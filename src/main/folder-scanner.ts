import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Stats } from 'node:fs';
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

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
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

// Folder and artifact classification is intentionally heuristic. Folder names
// help users understand a project, but they must not become hidden rules that
// block access to files.
const artifactExtensionGroups: Array<{ extensions: string[]; type: ArtifactType }> = [
  { extensions: ['.md', '.markdown', '.txt'], type: 'markdown-text' },
  { extensions: ['.doc', '.docx', '.odt', '.rtf'], type: 'document' },
  { extensions: ['.pdf'], type: 'pdf' },
  { extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic'], type: 'image' },
  { extensions: ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'], type: 'audio' },
  { extensions: ['.mp4', '.mov', '.mkv', '.webm'], type: 'video' },
  { extensions: ['.csv', '.xlsx', '.xls', '.json'], type: 'spreadsheet-data' },
  { extensions: ['.ppt', '.pptx', '.key'], type: 'presentation' },
];

const drawioFileSuffixes = ['.drawio', '.dio', '.drawio.svg', '.drawio.png'];

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

  if (drawioFileSuffixes.some((suffix) => lowerName.endsWith(suffix))) {
    return 'drawio';
  }

  const extension = path.extname(lowerName);
  const match = artifactExtensionGroups.find((group) => group.extensions.includes(extension));

  return match?.type ?? 'unclassified';
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

type ScanContext = {
  rootPath: string;
  options: ScanOptions;
  state: ScanState;
};

type ScanNodeInput = {
  entryPath: string;
  depth: number;
  inheritedHints: FolderSignal[];
};

type ScannedPath = ScanNodeInput & {
  name: string;
  relativePath: string;
  stats: Stats;
};

type DirectoryChildrenInput = {
  node: FolderTreeNode;
  entryPath: string;
  depth: number;
  contextHints: FolderSignal[];
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
  // Keep the scan payload compact; the overview needs only a small activity
  // signal, not a full file history.
  state.recentFiles = state.recentFiles.slice(0, 5);
};

const addWarning = (state: ScanState, warning: ScanWarning) => {
  state.warnings.push(warning);
};

const readPathStats = async (
  { rootPath, state }: ScanContext,
  entryPath: string,
): Promise<Stats | null> => {
  try {
    return await lstat(entryPath);
  } catch (error) {
    addWarning(state, {
      path: toRelativePath(rootPath, entryPath),
      type: 'read-error',
      severity: 'warning',
      message: error instanceof Error ? error.message : 'Unable to read path.',
    });

    return null;
  }
};

const addFolderSignals = (state: ScanState, signals: FolderSignal[]) => {
  signals.forEach((signal) => {
    state.folderSignalCounts[signal] += 1;
  });
};

const createFolderNode = ({ name, relativePath, stats }: ScannedPath, contextHints: FolderSignal[]) => ({
  name,
  relativePath,
  kind: 'folder' as const,
  children: [],
  folderSignals: getFolderSignals(name),
  contextHints,
  modifiedAt: stats.mtime.toISOString(),
});

const addDepthLimitWarning = (
  { options, state }: ScanContext,
  relativePath: string,
) => {
  state.limitsReached.maxDepth = true;
  addWarning(state, {
    path: relativePath,
    type: 'depth-limit',
    severity: 'warning',
    message: `Maximum scan depth of ${options.maxDepth} reached.`,
  });
};

const readDirectoryEntries = async (
  { state }: ScanContext,
  entryPath: string,
  relativePath: string,
) => {
  try {
    return await readdir(entryPath);
  } catch (error) {
    addWarning(state, {
      path: relativePath,
      type: 'read-error',
      severity: 'warning',
      message: error instanceof Error ? error.message : 'Unable to read folder.',
    });

    return null;
  }
};

const addFileLimitWarning = ({ options, state }: ScanContext, relativePath: string) => {
  state.limitsReached.maxFiles = true;

  if (state.fileLimitWarningAdded) {
    return;
  }

  state.fileLimitWarningAdded = true;
  addWarning(state, {
    path: relativePath,
    type: 'file-limit',
    severity: 'warning',
    message: `Maximum file count of ${options.maxFiles} reached.`,
  });
};

const scanDirectoryChildren = async (
  context: ScanContext,
  { node, entryPath, depth, contextHints }: DirectoryChildrenInput,
) => {
  const entries = await readDirectoryEntries(context, entryPath, node.relativePath);

  if (!entries) {
    return;
  }

  for (const entryName of entries) {
    if (context.state.fileCount >= context.options.maxFiles) {
      addFileLimitWarning(context, node.relativePath);
      break;
    }

    const childNode = await scanNode(context, {
      entryPath: path.join(entryPath, entryName),
      depth: depth + 1,
      inheritedHints: contextHints,
    });

    if (childNode) {
      node.children?.push(childNode);
    }
  }

  node.children = sortNodes(node.children ?? []);
};

const scanDirectory = async (
  context: ScanContext,
  scannedPath: ScannedPath,
): Promise<FolderTreeNode | null> => {
  const { entryPath, depth, inheritedHints, name, relativePath } = scannedPath;

  if (relativePath !== '.' && shouldExcludeFolder(name, context.options)) {
    addWarning(context.state, {
      path: relativePath,
      type: 'excluded-folder',
      severity: 'info',
      message: 'Folder excluded from scan.',
    });

    return null;
  }

  const ownSignals = getFolderSignals(name);
  const contextHints = [...new Set([...inheritedHints, ...ownSignals])];
  const node = createFolderNode(scannedPath, contextHints);

  if (relativePath !== '.') {
    context.state.folderCount += 1;
    addFolderSignals(context.state, ownSignals);
  }

  if (depth >= context.options.maxDepth) {
    addDepthLimitWarning(context, relativePath);
    return node;
  }

  await scanDirectoryChildren(context, {
    node,
    entryPath,
    depth,
    contextHints,
  });

  return node;
};

const scanFile = ({ state }: ScanContext, scannedPath: ScannedPath): FolderTreeNode => {
  const { name, relativePath, inheritedHints, stats } = scannedPath;
  const artifactType = classifyArtifact(name);
  const contextHints = getFileContextHints(name, inheritedHints);
  const modifiedAt = stats.mtime.toISOString();
  const size = stats.size;

  state.fileCount += 1;
  state.artifactTypeCounts[artifactType] += 1;
  addRecentFile(state, {
    name,
    relativePath,
    artifactType,
    contextHints,
    size,
    modifiedAt,
  });

  return {
    name,
    relativePath,
    kind: 'file',
    artifactType,
    contextHints,
    size,
    modifiedAt,
  };
};

const scanNode = async (
  context: ScanContext,
  input: ScanNodeInput,
): Promise<FolderTreeNode | null> => {
  const stats = await readPathStats(context, input.entryPath);

  if (!stats) {
    return null;
  }

  const name = path.basename(input.entryPath);
  const relativePath = toRelativePath(context.rootPath, input.entryPath);

  if (stats.isSymbolicLink() && !context.options.followSymlinks) {
    addWarning(context.state, {
      path: relativePath,
      type: 'symlink-skipped',
      severity: 'info',
      message: 'Symbolic link skipped.',
    });

    // Do not follow symlinks by default; a selected project folder is the trust
    // boundary for read-only scanning.
    return null;
  }

  const scannedPath = {
    ...input,
    name,
    relativePath,
    stats,
  };

  if (stats.isDirectory()) {
    return scanDirectory(context, scannedPath);
  }

  if (!stats.isFile()) {
    return null;
  }

  return scanFile(context, scannedPath);
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
  const context = {
    rootPath,
    options: resolvedOptions,
    state,
  };
  const rootNode = await scanNode(context, {
    entryPath: rootPath,
    depth: 0,
    inheritedHints: [],
  });

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
