import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import MiniSearch from 'minisearch';
import type {
  ArtifactType,
  SearchIndexManifestFile,
  SearchIndexSkippedFile,
  SearchIndexStatus,
  SearchWorkspaceRequest,
  SearchWorkspaceResult,
} from '../shared/sidekick-api';
import { classifyArtifact } from './folder-scanner';

export const SEARCH_INDEX_SCHEMA = 'search-index-manifest.v1';
export const SEARCH_INDEX_FOLDER = '.sidekick/search-index';
export const SEARCH_INDEX_FILE = 'index.json';
export const SEARCH_MANIFEST_FILE = 'manifest.json';
export const SEARCH_MAX_FILE_BYTES = 1024 * 1024;
export const SEARCH_UPDATE_DEBOUNCE_MS = 1000;

const ROOT_RELATIVE_PATH = '.';
const MAX_RESULTS = 50;
const DEFAULT_LIMIT = 20;
const MINISEARCH_VERSION = '7.2.0';

const ignoredFolderNames = new Set([
  '.git',
  '.sidekick',
  'node_modules',
  'out',
  'dist',
  '.vite',
  '.cache',
]);

const indexedExtensions = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]);

type SearchDocument = {
  id: string;
  name: string;
  relativePath: string;
  content: string;
  artifactType: ArtifactType;
  extension: string;
  size: number;
  modifiedAt: string;
};

type SearchManifest = {
  sidekick_schema: typeof SEARCH_INDEX_SCHEMA;
  source_model: 'physical-workspace-root';
  root_path: string;
  root_name: string;
  created_at: string;
  updated_at: string;
  engine: {
    name: 'minisearch';
    version: string;
  };
  options: {
    max_file_bytes: number;
    indexed_extensions: string[];
    ignored_folders: string[];
    query: {
      combine_with: 'AND';
      prefix_min_length: number;
      fuzzy_min_length: number;
    };
  };
  index_file: typeof SEARCH_INDEX_FILE;
  document_count: number;
  skipped_counts: Record<SearchIndexSkippedFile['reason'], number>;
  skipped_files: SearchIndexSkippedFile[];
  files: Record<string, SearchIndexManifestFile>;
};

type WorkspaceIndexState = {
  rootPath: string;
  status: SearchIndexStatus;
  manifest?: SearchManifest;
  index?: MiniSearch<SearchDocument>;
  queue: Promise<unknown>;
  watchers: FSWatcher[];
  pendingPaths: Set<string>;
  updateTimer?: NodeJS.Timeout;
};

type SearchIndexEvents = {
  status: [SearchIndexStatus];
};

const miniSearchOptions = {
  idField: 'id',
  fields: ['name', 'relativePath', 'content'],
  storeFields: ['name', 'relativePath', 'artifactType', 'extension', 'size', 'modifiedAt'],
  searchOptions: {
    boost: {
      name: 5,
      relativePath: 3,
      content: 1,
    },
    combineWith: 'AND' as const,
  },
};

const createEmptySkippedCounts = (): Record<SearchIndexSkippedFile['reason'], number> => ({
  unsupported: 0,
  binary: 0,
  oversized: 0,
  'read-error': 0,
});

const toPosixRelativePath = (rootPath: string, absolutePath: string) => {
  const relativePath = path.relative(rootPath, absolutePath);

  return relativePath === '' ? ROOT_RELATIVE_PATH : relativePath.split(path.sep).join('/');
};

const normaliseRelativePath = (relativePath: string) =>
  relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/g, '');

const isPathInside = (rootPath: string, candidatePath: string) => {
  const relativePath = path.relative(rootPath, candidatePath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

export const resolveWorkspaceRelativePath = (rootPath: string, relativePath: string) => {
  if (path.isAbsolute(relativePath)) {
    throw new Error('Search result path must be relative to the workspace root.');
  }

  const normalised = normaliseRelativePath(relativePath);

  if (!normalised || normalised === ROOT_RELATIVE_PATH) {
    throw new Error('Search result path must be relative to the workspace root.');
  }

  const segments = normalised.split('/');

  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Search result path must stay inside the workspace root.');
  }

  const absolutePath = path.resolve(rootPath, ...segments);

  if (!isPathInside(rootPath, absolutePath)) {
    throw new Error('Search result path must stay inside the workspace root.');
  }

  return {
    absolutePath,
    relativePath: normalised,
  };
};

const isGeneratedContextPackage = (fileName: string) => fileName.includes('context-package');

const isHiddenFolder = (folderName: string) => folderName.startsWith('.');

const shouldIgnoreFolder = (folderName: string) =>
  ignoredFolderNames.has(folderName) || isHiddenFolder(folderName);

const isSupportedExtension = (fileName: string) =>
  indexedExtensions.has(path.extname(fileName).toLowerCase());

const isLikelyBinaryExtension = (fileName: string) => {
  const extension = path.extname(fileName).toLowerCase();

  return [
    '.pdf',
    '.doc',
    '.docx',
    '.odt',
    '.rtf',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.heic',
    '.mp3',
    '.wav',
    '.m4a',
    '.aac',
    '.flac',
    '.ogg',
    '.mp4',
    '.mov',
    '.mkv',
    '.webm',
    '.ppt',
    '.pptx',
    '.key',
    '.xlsx',
    '.xls',
  ].includes(extension);
};

const shouldIndexFileName = (fileName: string) =>
  !isGeneratedContextPackage(fileName.toLowerCase()) && isSupportedExtension(fileName);

const createStatus = (
  rootPath: string,
  state: SearchIndexStatus['state'],
  overrides: Partial<SearchIndexStatus> = {},
): SearchIndexStatus => ({
  rootPath,
  state,
  message: overrides.message,
  documentCount: overrides.documentCount ?? 0,
  skippedCounts: overrides.skippedCounts ?? createEmptySkippedCounts(),
  skippedFiles: overrides.skippedFiles ?? [],
  updatedAt: overrides.updatedAt,
  indexingStartedAt: overrides.indexingStartedAt,
});

const createManifest = (rootPath: string, createdAt = new Date().toISOString()): SearchManifest => ({
  sidekick_schema: SEARCH_INDEX_SCHEMA,
  source_model: 'physical-workspace-root',
  root_path: rootPath,
  root_name: path.basename(rootPath),
  created_at: createdAt,
  updated_at: createdAt,
  engine: {
    name: 'minisearch',
    version: MINISEARCH_VERSION,
  },
  options: {
    max_file_bytes: SEARCH_MAX_FILE_BYTES,
    indexed_extensions: [...indexedExtensions].sort(),
    ignored_folders: [...ignoredFolderNames].sort(),
    query: {
      combine_with: 'AND',
      prefix_min_length: 3,
      fuzzy_min_length: 5,
    },
  },
  index_file: SEARCH_INDEX_FILE,
  document_count: 0,
  skipped_counts: createEmptySkippedCounts(),
  skipped_files: [],
  files: {},
});

const createMiniSearch = () => new MiniSearch<SearchDocument>(miniSearchOptions);

const statusFromManifest = (rootPath: string, manifest: SearchManifest): SearchIndexStatus =>
  createStatus(rootPath, 'ready', {
    documentCount: manifest.document_count,
    skippedCounts: manifest.skipped_counts,
    skippedFiles: manifest.skipped_files,
    updatedAt: manifest.updated_at,
  });

const indexDirectoryPath = (rootPath: string) => path.join(rootPath, ...SEARCH_INDEX_FOLDER.split('/'));
const manifestPath = (rootPath: string) => path.join(indexDirectoryPath(rootPath), SEARCH_MANIFEST_FILE);
const indexPath = (rootPath: string) => path.join(indexDirectoryPath(rootPath), SEARCH_INDEX_FILE);

const readJson = async <T>(filePath: string): Promise<T> =>
  JSON.parse(await readFile(filePath, 'utf8')) as T;

const writeJson = async (filePath: string, value: unknown) => {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const sha256 = (value: Buffer) => createHash('sha256').update(value).digest('hex');

const addSkippedFile = (
  manifest: SearchManifest,
  relativePath: string,
  reason: SearchIndexSkippedFile['reason'],
  message: string,
) => {
  manifest.skipped_counts[reason] += 1;
  manifest.skipped_files.push({ relativePath, reason, message });
};

const resetSkippedFilesForPath = (manifest: SearchManifest, relativePath: string) => {
  manifest.skipped_files = manifest.skipped_files.filter((file) => file.relativePath !== relativePath);
  manifest.skipped_counts = createEmptySkippedCounts();
  manifest.skipped_files.forEach((file) => {
    manifest.skipped_counts[file.reason] += 1;
  });
};

const createDocumentRecord = (
  rootPath: string,
  absolutePath: string,
  relativePath: string,
  content: Buffer,
  size: number,
  mtime: Date,
): { document: SearchDocument; record: SearchIndexManifestFile } => {
  const name = path.basename(absolutePath);
  const extension = path.extname(name).toLowerCase();
  const artifactType = classifyArtifact(name);
  const modifiedAt = mtime.toISOString();
  const contentSha256 = sha256(content);
  const document = {
    id: relativePath,
    name,
    relativePath,
    content: content.toString('utf8'),
    artifactType,
    extension,
    size,
    modifiedAt,
  };

  return {
    document,
    record: {
      id: relativePath,
      relative_path: relativePath,
      name,
      extension,
      artifact_type: artifactType,
      size,
      modified_at: modifiedAt,
      mtime_ms: mtime.getTime(),
      content_sha256: contentSha256,
    },
  };
};

const queryAllowsPrefix = (query: string) =>
  query
    .trim()
    .split(/\s+/)
    .some((term) => term.length >= 3);

const queryAllowsFuzzy = (query: string) =>
  query
    .trim()
    .split(/\s+/)
    .some((term) => term.length >= 5);

const createSnippet = (content: string, query: string) => {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}_-]+/gu, ''))
    .filter(Boolean);
  const lowerContent = content.toLowerCase();
  const matchIndex = terms.reduce((best, term) => {
    const index = lowerContent.indexOf(term);

    return index >= 0 && (best < 0 || index < best) ? index : best;
  }, -1);
  const start = Math.max(0, (matchIndex < 0 ? 0 : matchIndex) - 70);
  const end = Math.min(content.length, start + 180);
  const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();

  return `${start > 0 ? '...' : ''}${snippet}${end < content.length ? '...' : ''}`;
};

export class SearchIndexManager extends EventEmitter<SearchIndexEvents> {
  private readonly states = new Map<string, WorkspaceIndexState>();

  private getState(rootPath: string) {
    let state = this.states.get(rootPath);

    if (!state) {
      state = {
        rootPath,
        status: createStatus(rootPath, 'missing'),
        queue: Promise.resolve(),
        watchers: [],
        pendingPaths: new Set(),
      };
      this.states.set(rootPath, state);
    }

    return state;
  }

  private setStatus(state: WorkspaceIndexState, status: SearchIndexStatus) {
    state.status = status;
    this.emit('status', status);
  }

  private enqueue<T>(state: WorkspaceIndexState, task: () => Promise<T>): Promise<T> {
    const next = state.queue.then(task, task);
    state.queue = next.catch(() => undefined);

    return next;
  }

  private async loadFromDisk(rootPath: string) {
    const state = this.getState(rootPath);

    if (state.index && state.manifest) {
      return state;
    }

    try {
      const [manifest, indexJson] = await Promise.all([
        readJson<SearchManifest>(manifestPath(rootPath)),
        readFile(indexPath(rootPath), 'utf8'),
      ]);

      if (manifest.sidekick_schema !== SEARCH_INDEX_SCHEMA || manifest.root_path !== rootPath) {
        throw new Error('Search index metadata does not match this workspace.');
      }

      state.manifest = manifest;
      state.index = MiniSearch.loadJSON<SearchDocument>(indexJson, miniSearchOptions);
      this.setStatus(state, statusFromManifest(rootPath, manifest));
      this.ensureWatchers(state).catch(() => {
        this.markStale(rootPath, 'Filovervåking kunne ikke startes. Oppdater indeksen manuelt.');
      });

      return state;
    } catch {
      this.setStatus(state, createStatus(rootPath, 'missing', { message: 'Søkeindeks mangler.' }));
      return state;
    }
  }

  async getStatus(rootPath: string) {
    const state = this.getState(rootPath);

    if (state.status.state !== 'missing' || state.index) {
      return state.status;
    }

    await this.loadFromDisk(rootPath);

    return state.status;
  }

  startInitialIndex(rootPath: string) {
    const state = this.getState(rootPath);

    if (state.status.state === 'indexing' || state.status.state === 'updating') {
      return state.status;
    }

    void this.enqueue(state, async () => {
      await this.loadFromDisk(rootPath);

      if (state.status.state === 'ready') {
        return;
      }

      this.setStatus(
        state,
        createStatus(rootPath, 'indexing', {
          indexingStartedAt: new Date().toISOString(),
          message: 'Bygger søkeindeks for arbeidsområdet.',
        }),
      );
      await this.rebuild(rootPath, 'indexing');
    }).catch((error) => {
      this.setStatus(
        state,
        createStatus(rootPath, 'failed', {
          message: error instanceof Error ? error.message : 'Søkeindeksen kunne ikke bygges.',
        }),
      );
    });

    return state.status;
  }

  async refresh(rootPath: string) {
    const state = this.getState(rootPath);

    this.setStatus(
      state,
      createStatus(rootPath, 'indexing', {
        indexingStartedAt: new Date().toISOString(),
        message: 'Oppdaterer søkeindeks.',
      }),
    );

    return this.enqueue(state, async () => this.rebuild(rootPath, 'indexing'));
  }

  async search(request: SearchWorkspaceRequest): Promise<SearchWorkspaceResult> {
    const query = request.query.trim();
    const limit = Math.max(1, Math.min(request.limit ?? DEFAULT_LIMIT, MAX_RESULTS));
    const state = await this.loadFromDisk(request.rootPath);

    if (!query) {
      return {
        rootPath: request.rootPath,
        query,
        status: state.status,
        results: [],
        resultCount: 0,
      };
    }

    if (!state.index || !state.manifest || state.status.state === 'missing') {
      return {
        rootPath: request.rootPath,
        query,
        status: state.status,
        results: [],
        resultCount: 0,
      };
    }

    const rawResults = state.index.search(query, {
      combineWith: 'AND',
      boost: { name: 5, relativePath: 3, content: 1 },
      prefix: queryAllowsPrefix(query),
      fuzzy: queryAllowsFuzzy(query) ? 0.15 : false,
    });
    const items = [];

    for (const [index, result] of rawResults.slice(0, limit).entries()) {
      const relativePath = String(result.id);
      const record = state.manifest.files[relativePath];

      if (!record) {
        this.markStale(request.rootPath, 'Søkeresultat manglet manifestpost.');
        continue;
      }

      try {
        const { absolutePath } = resolveWorkspaceRelativePath(request.rootPath, relativePath);
        const content = await readFile(absolutePath, 'utf8');
        items.push({
          id: relativePath,
          rank: index + 1,
          score: result.score,
          name: record.name,
          relativePath,
          artifactType: record.artifact_type,
          extension: record.extension,
          size: record.size,
          modifiedAt: record.modified_at,
          snippet: createSnippet(content, query),
        });
      } catch {
        this.markStale(request.rootPath, 'En søkeresultatfil mangler eller kan ikke leses.');
      }
    }

    return {
      rootPath: request.rootPath,
      query,
      status: this.getState(request.rootPath).status,
      results: items,
      resultCount: rawResults.length,
    };
  }

  markStale(rootPath: string, message: string) {
    const state = this.getState(rootPath);
    const manifest = state.manifest;

    this.setStatus(
      state,
      createStatus(rootPath, 'stale', {
        message,
        documentCount: manifest?.document_count ?? state.status.documentCount,
        skippedCounts: manifest?.skipped_counts ?? state.status.skippedCounts,
        skippedFiles: manifest?.skipped_files ?? state.status.skippedFiles,
        updatedAt: manifest?.updated_at ?? state.status.updatedAt,
      }),
    );
  }

  async close() {
    for (const state of this.states.values()) {
      this.closeWatchers(state);
    }
  }

  private closeWatchers(state: WorkspaceIndexState) {
    state.watchers.forEach((watcher) => watcher.close());
    state.watchers = [];
    if (state.updateTimer) {
      clearTimeout(state.updateTimer);
      state.updateTimer = undefined;
    }
    state.pendingPaths.clear();
  }

  private async rebuild(rootPath: string, activeState: 'indexing' | 'updating') {
    const state = this.getState(rootPath);
    const createdAt = state.manifest?.created_at ?? new Date().toISOString();
    const manifest = createManifest(rootPath, createdAt);
    const miniSearch = createMiniSearch();
    const documents: SearchDocument[] = [];

    await this.collectDocuments(rootPath, rootPath, manifest, documents);
    miniSearch.addAll(documents);
    manifest.files = Object.fromEntries(documents.map((document) => [document.id, manifest.files[document.id]]));
    manifest.document_count = documents.length;
    manifest.updated_at = new Date().toISOString();

    await mkdir(indexDirectoryPath(rootPath), { recursive: true });
    await Promise.all([
      writeFile(indexPath(rootPath), JSON.stringify(miniSearch), 'utf8'),
      writeJson(manifestPath(rootPath), manifest),
    ]);

    state.index = miniSearch;
    state.manifest = manifest;
    this.setStatus(state, statusFromManifest(rootPath, manifest));
    await this.ensureWatchers(state);

    return activeState === 'indexing' ? state.status : statusFromManifest(rootPath, manifest);
  }

  private async collectDocuments(
    rootPath: string,
    directoryPath: string,
    manifest: SearchManifest,
    documents: SearchDocument[],
  ) {
    let entries: string[];

    try {
      entries = await readdir(directoryPath);
    } catch {
      addSkippedFile(manifest, toPosixRelativePath(rootPath, directoryPath), 'read-error', 'Mappen kunne ikke leses.');
      return;
    }

    for (const entryName of entries) {
      const entryPath = path.join(directoryPath, entryName);
      const relativePath = toPosixRelativePath(rootPath, entryPath);
      let stats;

      try {
        stats = await stat(entryPath);
      } catch {
        addSkippedFile(manifest, relativePath, 'read-error', 'Filen kunne ikke leses.');
        continue;
      }

      if (stats.isDirectory()) {
        if (relativePath !== ROOT_RELATIVE_PATH && shouldIgnoreFolder(entryName)) {
          continue;
        }
        await this.collectDocuments(rootPath, entryPath, manifest, documents);
        continue;
      }

      if (!stats.isFile()) {
        continue;
      }

      const document = await this.readDocumentForIndex(rootPath, entryPath, relativePath, manifest);
      if (document) {
        documents.push(document);
      }
    }
  }

  private async readDocumentForIndex(
    rootPath: string,
    absolutePath: string,
    relativePath: string,
    manifest: SearchManifest,
  ) {
    const fileName = path.basename(absolutePath);
    let stats;

    resetSkippedFilesForPath(manifest, relativePath);

    try {
      stats = await stat(absolutePath);
    } catch {
      addSkippedFile(manifest, relativePath, 'read-error', 'Filen kunne ikke leses.');
      return null;
    }

    if (stats.size > SEARCH_MAX_FILE_BYTES) {
      addSkippedFile(manifest, relativePath, 'oversized', 'Filen er større enn 1 MiB.');
      return null;
    }

    if (!shouldIndexFileName(fileName)) {
      addSkippedFile(
        manifest,
        relativePath,
        isLikelyBinaryExtension(fileName) ? 'binary' : 'unsupported',
        'Filtypen indekseres ikke som tekst.',
      );
      return null;
    }

    try {
      const content = await readFile(absolutePath);
      const { document, record } = createDocumentRecord(
        rootPath,
        absolutePath,
        relativePath,
        content,
        stats.size,
        stats.mtime,
      );
      manifest.files[relativePath] = record;

      return document;
    } catch {
      addSkippedFile(manifest, relativePath, 'read-error', 'Filen kunne ikke leses.');
      return null;
    }
  }

  private async ensureWatchers(state: WorkspaceIndexState) {
    this.closeWatchers(state);
    const folders = await this.collectWatchFolders(state.rootPath);

    folders.forEach((folderPath) => {
      try {
        const watcher = watch(folderPath, (eventType, fileName) => {
          const candidatePath =
            typeof fileName === 'string' && fileName
              ? path.join(folderPath, fileName)
              : folderPath;
          this.queueIncrementalUpdate(state.rootPath, candidatePath, eventType);
        });
        watcher.on('error', () => {
          this.markStale(state.rootPath, 'Filovervåking feilet. Oppdater indeksen manuelt.');
        });
        state.watchers.push(watcher);
      } catch {
        this.markStale(state.rootPath, 'Filovervåking kunne ikke startes. Oppdater indeksen manuelt.');
      }
    });
  }

  private async collectWatchFolders(rootPath: string) {
    const folders: string[] = [];

    const walk = async (directoryPath: string) => {
      folders.push(directoryPath);
      let entries: string[];

      try {
        entries = await readdir(directoryPath);
      } catch {
        return;
      }

      await Promise.all(
        entries.map(async (entryName) => {
          if (shouldIgnoreFolder(entryName)) {
            return;
          }

          const entryPath = path.join(directoryPath, entryName);
          try {
            const stats = await stat(entryPath);
            if (stats.isDirectory()) {
              await walk(entryPath);
            }
          } catch {
            // Watchers are opportunistic. Scan/search-open stale checks remain
            // the fallback if a directory cannot be watched.
          }
        }),
      );
    };

    await walk(rootPath);

    return folders;
  }

  private queueIncrementalUpdate(rootPath: string, candidatePath: string, eventType: string) {
    const state = this.getState(rootPath);

    if (!isPathInside(rootPath, candidatePath)) {
      this.markStale(rootPath, 'Filendring utenfor arbeidsområdet ble avvist.');
      return;
    }

    const relativePath = toPosixRelativePath(rootPath, candidatePath);
    if (relativePath === ROOT_RELATIVE_PATH) {
      this.markStale(rootPath, 'Arbeidsområderoten endret seg. Oppdater indeksen manuelt.');
      return;
    }

    state.pendingPaths.add(relativePath);

    if (eventType === 'rename') {
      state.pendingPaths.add('*rename*');
    }

    if (state.updateTimer) {
      clearTimeout(state.updateTimer);
    }

    state.updateTimer = setTimeout(() => {
      const paths = [...state.pendingPaths];
      state.pendingPaths.clear();
      state.updateTimer = undefined;

      void this.enqueue(state, async () => {
        await this.applyIncrementalUpdates(rootPath, paths);
      }).catch((error) => {
        this.markStale(
          rootPath,
          error instanceof Error ? error.message : 'Indeksen kunne ikke oppdateres inkrementelt.',
        );
      });
    }, SEARCH_UPDATE_DEBOUNCE_MS);
  }

  private async applyIncrementalUpdates(rootPath: string, paths: string[]) {
    const state = await this.loadFromDisk(rootPath);

    if (!state.index || !state.manifest) {
      this.startInitialIndex(rootPath);
      return;
    }

    if (paths.includes('*rename*')) {
      await this.applyManifestDiff(rootPath);
      return;
    }

    this.setStatus(
      state,
      createStatus(rootPath, 'updating', {
        documentCount: state.manifest.document_count,
        skippedCounts: state.manifest.skipped_counts,
        skippedFiles: state.manifest.skipped_files,
        updatedAt: state.manifest.updated_at,
        message: 'Oppdaterer søkeindeks.',
      }),
    );

    for (const relativePath of paths) {
      await this.applySinglePathUpdate(rootPath, relativePath);
    }

    await this.persistLoadedState(rootPath);
  }

  private async applyManifestDiff(rootPath: string) {
    const state = await this.loadFromDisk(rootPath);

    if (!state.index || !state.manifest) {
      this.startInitialIndex(rootPath);
      return;
    }

    const currentFiles = new Map<string, { absolutePath: string; size: number; mtimeMs: number }>();
    await this.collectCurrentSupportedPaths(rootPath, rootPath, currentFiles);
    const knownPaths = new Set(Object.keys(state.manifest.files));
    const changedPaths = new Set<string>();

    for (const [relativePath, current] of currentFiles.entries()) {
      const known = state.manifest.files[relativePath];
      if (!known || known.size !== current.size || known.mtime_ms !== current.mtimeMs) {
        changedPaths.add(relativePath);
      }
    }

    for (const relativePath of knownPaths) {
      if (!currentFiles.has(relativePath)) {
        changedPaths.add(relativePath);
      }
    }

    if (changedPaths.size > 200) {
      this.markStale(rootPath, 'Mange filendringer ble oppdaget. Oppdater indeksen manuelt.');
      return;
    }

    await this.applyIncrementalUpdates(rootPath, [...changedPaths]);
  }

  private async collectCurrentSupportedPaths(
    rootPath: string,
    directoryPath: string,
    files: Map<string, { absolutePath: string; size: number; mtimeMs: number }>,
  ) {
    let entries: string[];
    try {
      entries = await readdir(directoryPath);
    } catch {
      return;
    }

    for (const entryName of entries) {
      if (shouldIgnoreFolder(entryName)) {
        continue;
      }

      const entryPath = path.join(directoryPath, entryName);
      try {
        const stats = await stat(entryPath);
        if (stats.isDirectory()) {
          await this.collectCurrentSupportedPaths(rootPath, entryPath, files);
        } else if (stats.isFile() && shouldIndexFileName(entryName)) {
          files.set(toPosixRelativePath(rootPath, entryPath), {
            absolutePath: entryPath,
            size: stats.size,
            mtimeMs: stats.mtime.getTime(),
          });
        }
      } catch {
        // Stale detection handles unreadable paths through skipped metadata on
        // the next explicit refresh.
      }
    }
  }

  private async applySinglePathUpdate(rootPath: string, relativePath: string) {
    const state = await this.loadFromDisk(rootPath);

    if (!state.index || !state.manifest) {
      return;
    }

    const { absolutePath } = resolveWorkspaceRelativePath(rootPath, relativePath);

    resetSkippedFilesForPath(state.manifest, relativePath);

    try {
      const stats = await stat(absolutePath);

      if (stats.isDirectory()) {
        await this.applyManifestDiff(rootPath);
        return;
      }

      if (!stats.isFile()) {
        this.removeDocument(state, relativePath);
        return;
      }

      this.removeDocument(state, relativePath);
      const document = await this.readDocumentForIndex(rootPath, absolutePath, relativePath, state.manifest);
      if (document) {
        state.index.add(document);
      }
    } catch {
      this.removeDocument(state, relativePath);
    }
  }

  private removeDocument(state: WorkspaceIndexState, relativePath: string) {
    if (state.index?.has(relativePath)) {
      state.index.discard(relativePath);
    }
    if (state.manifest) {
      delete state.manifest.files[relativePath];
      resetSkippedFilesForPath(state.manifest, relativePath);
    }
  }

  private async persistLoadedState(rootPath: string) {
    const state = this.getState(rootPath);

    if (!state.index || !state.manifest) {
      return;
    }

    state.manifest.document_count = Object.keys(state.manifest.files).length;
    state.manifest.updated_at = new Date().toISOString();
    await Promise.all([
      writeFile(indexPath(rootPath), JSON.stringify(state.index), 'utf8'),
      writeJson(manifestPath(rootPath), state.manifest),
    ]);
    this.setStatus(state, statusFromManifest(rootPath, state.manifest));
  }

  async deleteIndex(rootPath: string) {
    const state = this.getState(rootPath);
    this.closeWatchers(state);
    await rm(indexDirectoryPath(rootPath), { recursive: true, force: true });
    state.index = undefined;
    state.manifest = undefined;
    this.setStatus(state, createStatus(rootPath, 'missing'));
  }
}
