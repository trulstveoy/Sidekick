import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  ArtifactType,
  FolderSignal,
  FolderTreeNode,
  ProjectFolderScan,
  RecentFile,
  ScanOptions,
  ScanSummary,
  ScanWarning,
} from '../shared/sidekick-api';

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  maxDepth: 5,
  maxFiles: 2000,
  excludedFolderNames: ['.git', 'node_modules', 'out', 'dist', '.vite', '.cache'],
  includeHidden: false,
  followSymlinks: false,
};

const ARTIFACT_TYPES: ArtifactType[] = [
  'markdown-text',
  'document',
  'pdf',
  'image',
  'audio',
  'video',
  'spreadsheet-data',
  'presentation',
  'drawio',
  'transcript',
  'note',
  'information-model',
  'architecture',
  'unclassified',
];

const FOLDER_SIGNALS: FolderSignal[] = [
  'background',
  'transcript',
  'information-model',
  'architecture',
  'thematic',
];

const createArtifactCounts = (): Record<ArtifactType, number> =>
  ARTIFACT_TYPES.reduce(
    (counts, type) => ({
      ...counts,
      [type]: 0,
    }),
    {} as Record<ArtifactType, number>,
  );

const createFolderSignalCounts = (): Record<FolderSignal, number> =>
  FOLDER_SIGNALS.reduce(
    (counts, signal) => ({
      ...counts,
      [signal]: 0,
    }),
    {} as Record<FolderSignal, number>,
  );

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const getFolderSignals = (folderName: string): FolderSignal[] => {
  const value = normalise(folderName);
  const signals: FolderSignal[] = [];

  if (
    includesAny(value, [
      'background',
      'bakgrunn',
      'reference',
      'references',
      'kilde',
      'kilder',
      'source',
      'sources',
      'grunnlag',
    ])
  ) {
    signals.push('background');
  }

  if (
    includesAny(value, [
      'transcript',
      'transcripts',
      'transcription',
      'transkripsjon',
      'transkripsjoner',
      'interview',
      'interviews',
      'intervju',
      'intervjuer',
    ])
  ) {
    signals.push('transcript');
  }

  if (
    includesAny(value, [
      'information model',
      'informasjonsmodell',
      'informasjonsmodeller',
      'domain model',
      'domenemodell',
      'begrepsmodell',
      'model',
      'modell',
    ])
  ) {
    signals.push('information-model');
  }

  if (includesAny(value, ['architecture', 'arkitektur', 'diagram', 'diagrams', 'systemskisse'])) {
    signals.push('architecture');
  }

  if (includesAny(value, ['theme', 'themes', 'topic', 'topics', 'tema', 'emne'])) {
    signals.push('thematic');
  }

  return signals;
};

const extensionType = (fileName: string): ArtifactType => {
  const lowerName = fileName.toLowerCase();

  if (
    lowerName.endsWith('.drawio') ||
    lowerName.endsWith('.dio') ||
    lowerName.endsWith('.drawio.svg') ||
    lowerName.endsWith('.drawio.png')
  ) {
    return 'drawio';
  }

  const extension = path.extname(lowerName);

  if (['.md', '.markdown', '.txt'].includes(extension)) {
    return 'markdown-text';
  }

  if (['.doc', '.docx', '.odt', '.rtf'].includes(extension)) {
    return 'document';
  }

  if (extension === '.pdf') {
    return 'pdf';
  }

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic'].includes(extension)) {
    return 'image';
  }

  if (['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'].includes(extension)) {
    return 'audio';
  }

  if (['.mp4', '.mov', '.mkv', '.webm'].includes(extension)) {
    return 'video';
  }

  if (['.csv', '.xlsx', '.xls', '.json'].includes(extension)) {
    return 'spreadsheet-data';
  }

  if (['.ppt', '.pptx', '.key'].includes(extension)) {
    return 'presentation';
  }

  return 'unclassified';
};

const canPromoteTextLike = (type: ArtifactType) =>
  ['markdown-text', 'document', 'pdf', 'unclassified'].includes(type);

export const classifyArtifact = (fileName: string): ArtifactType => {
  const baseType = extensionType(fileName);
  const value = normalise(fileName);

  if (
    canPromoteTextLike(baseType) &&
    includesAny(value, ['transcript', 'transcription', 'transkripsjon', 'interview', 'intervju'])
  ) {
    return 'transcript';
  }

  if (canPromoteTextLike(baseType) && includesAny(value, ['note', 'notes', 'notat', 'meeting', 'møte'])) {
    return 'note';
  }

  return baseType;
};

export const getFileContextHints = (
  fileName: string,
  folderHints: FolderSignal[],
): FolderSignal[] => {
  const value = normalise(fileName);
  const hints = new Set<FolderSignal>(folderHints);

  if (
    includesAny(value, [
      'information model',
      'informasjonsmodell',
      'domain model',
      'domenemodell',
      'begrepsmodell',
      'model',
      'modell',
    ])
  ) {
    hints.add('information-model');
  }

  if (includesAny(value, ['architecture', 'arkitektur', 'diagram', 'systemskisse'])) {
    hints.add('architecture');
  }

  return [...hints];
};

type ScanState = {
  fileCount: number;
  folderCount: number;
  artifactTypeCounts: Record<ArtifactType, number>;
  folderSignalCounts: Record<FolderSignal, number>;
  recentFiles: RecentFile[];
  warnings: ScanWarning[];
  limitsReached: ScanSummary['limitsReached'];
  fileLimitWarningAdded: boolean;
};

const createScanState = (): ScanState => ({
  fileCount: 0,
  folderCount: 0,
  artifactTypeCounts: createArtifactCounts(),
  folderSignalCounts: createFolderSignalCounts(),
  recentFiles: [],
  warnings: [],
  limitsReached: {
    maxDepth: false,
    maxFiles: false,
  },
  fileLimitWarningAdded: false,
});

const toRelativePath = (rootPath: string, entryPath: string) => {
  const relativePath = path.relative(rootPath, entryPath);

  return relativePath === '' ? '.' : relativePath.split(path.sep).join('/');
};

const isHiddenFolder = (folderName: string) => folderName.startsWith('.');

const shouldExcludeFolder = (folderName: string, options: ScanOptions) =>
  options.excludedFolderNames.includes(folderName) ||
  (!options.includeHidden && isHiddenFolder(folderName));

const sortNodes = (nodes: FolderTreeNode[]) =>
  nodes.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'folder' ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  });

const addRecentFile = (state: ScanState, file: RecentFile) => {
  state.recentFiles.push(file);
  state.recentFiles.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));
  state.recentFiles = state.recentFiles.slice(0, 5);
};

const addWarning = (state: ScanState, warning: ScanWarning) => {
  state.warnings.push(warning);
};

const scanNode = async (
  rootPath: string,
  entryPath: string,
  depth: number,
  inheritedHints: FolderSignal[],
  options: ScanOptions,
  state: ScanState,
): Promise<FolderTreeNode | null> => {
  let stats;

  try {
    stats = await lstat(entryPath);
  } catch (error) {
    addWarning(state, {
      path: toRelativePath(rootPath, entryPath),
      type: 'read-error',
      severity: 'warning',
      message: error instanceof Error ? error.message : 'Unable to read path.',
    });

    return null;
  }

  const name = path.basename(entryPath);
  const relativePath = toRelativePath(rootPath, entryPath);

  if (stats.isSymbolicLink() && !options.followSymlinks) {
    addWarning(state, {
      path: relativePath,
      type: 'symlink-skipped',
      severity: 'info',
      message: 'Symbolic link skipped.',
    });

    return null;
  }

  if (stats.isDirectory()) {
    if (relativePath !== '.' && shouldExcludeFolder(name, options)) {
      addWarning(state, {
        path: relativePath,
        type: 'excluded-folder',
        severity: 'info',
        message: 'Folder excluded from scan.',
      });

      return null;
    }

    const ownSignals = getFolderSignals(name);
    const contextHints = [...new Set([...inheritedHints, ...ownSignals])];

    if (relativePath !== '.') {
      state.folderCount += 1;
      ownSignals.forEach((signal) => {
        state.folderSignalCounts[signal] += 1;
      });
    }

    const node: FolderTreeNode = {
      name,
      relativePath,
      kind: 'folder',
      children: [],
      folderSignals: ownSignals,
      contextHints,
      modifiedAt: stats.mtime.toISOString(),
    };

    if (depth >= options.maxDepth) {
      state.limitsReached.maxDepth = true;
      addWarning(state, {
        path: relativePath,
        type: 'depth-limit',
        severity: 'warning',
        message: `Maximum scan depth of ${options.maxDepth} reached.`,
      });

      return node;
    }

    let entries;

    try {
      entries = await readdir(entryPath);
    } catch (error) {
      addWarning(state, {
        path: relativePath,
        type: 'read-error',
        severity: 'warning',
        message: error instanceof Error ? error.message : 'Unable to read folder.',
      });

      return node;
    }

    for (const entryName of entries) {
      if (state.fileCount >= options.maxFiles) {
        state.limitsReached.maxFiles = true;

        if (!state.fileLimitWarningAdded) {
          state.fileLimitWarningAdded = true;
          addWarning(state, {
            path: relativePath,
            type: 'file-limit',
            severity: 'warning',
            message: `Maximum file count of ${options.maxFiles} reached.`,
          });
        }

        break;
      }

      const childNode = await scanNode(
        rootPath,
        path.join(entryPath, entryName),
        depth + 1,
        contextHints,
        options,
        state,
      );

      if (childNode) {
        node.children?.push(childNode);
      }
    }

    node.children = sortNodes(node.children ?? []);

    return node;
  }

  if (!stats.isFile()) {
    return null;
  }

  state.fileCount += 1;

  const artifactType = classifyArtifact(name);
  const contextHints = getFileContextHints(name, inheritedHints);
  const modifiedAt = stats.mtime.toISOString();
  const size = stats.size;

  state.artifactTypeCounts[artifactType] += 1;

  const node: FolderTreeNode = {
    name,
    relativePath,
    kind: 'file',
    artifactType,
    contextHints,
    size,
    modifiedAt,
  };

  addRecentFile(state, {
    name,
    relativePath,
    artifactType,
    contextHints,
    size,
    modifiedAt,
  });

  return node;
};

export const scanProjectFolder = async (
  rootPath: string,
  options: Partial<ScanOptions> = {},
): Promise<ProjectFolderScan> => {
  const resolvedOptions = {
    ...DEFAULT_SCAN_OPTIONS,
    ...options,
  };
  const state = createScanState();
  const rootNode = await scanNode(rootPath, rootPath, 0, [], resolvedOptions, state);

  if (!rootNode) {
    throw new Error('Unable to scan selected folder.');
  }

  const summary: ScanSummary = {
    fileCount: state.fileCount,
    folderCount: state.folderCount,
    artifactTypeCounts: state.artifactTypeCounts,
    folderSignalCounts: state.folderSignalCounts,
    recentFiles: state.recentFiles,
    limitsReached: state.limitsReached,
  };

  return {
    rootPath,
    rootName: path.basename(rootPath),
    scannedAt: new Date().toISOString(),
    status: state.warnings.some((warning) => warning.severity !== 'info') ? 'partial' : 'complete',
    tree: rootNode,
    summary,
    warnings: state.warnings,
  };
};
