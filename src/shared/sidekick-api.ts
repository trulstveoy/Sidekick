export type AppInfo = {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  isPackaged: boolean;
};

export type ArtifactType =
  | 'markdown-text'
  | 'document'
  | 'pdf'
  | 'image'
  | 'audio'
  | 'video'
  | 'spreadsheet-data'
  | 'presentation'
  | 'drawio'
  | 'transcript'
  | 'note'
  | 'information-model'
  | 'architecture'
  | 'unclassified';

export type FolderSignal =
  | 'background'
  | 'transcript'
  | 'information-model'
  | 'architecture'
  | 'thematic';

export type FolderSystemEffect = 'project-root';

export type FolderContextReference = {
  id: string;
  type: 'project';
  name: string;
};

export type FolderTagKind = 'system' | 'free';

export type FolderTag = {
  label: string;
  normalizedLabel: string;
  kind: FolderTagKind;
  source: 'explicit';
  updatedAt: string;
  systemEffect?: FolderSystemEffect;
  context?: FolderContextReference;
};

export type FolderMetadataStatus =
  | 'none'
  | 'valid'
  | 'invalid'
  | 'unsupported'
  | 'conflict';

export type FolderMetadataSummary = {
  status: FolderMetadataStatus;
  tags: FolderTag[];
  markerRelativePath?: string;
  folderId?: string;
  message?: string;
};

export type FolderTagEditRequest = {
  rootPath: string;
  folderRelativePath: string;
  label: string;
};

export type FolderTagEditResult = {
  status: 'complete';
  rootPath: string;
  folderRelativePath: string;
  metadata: FolderMetadataSummary;
  scan: WorkspaceScan;
};

export type ScanStatus = 'complete' | 'partial';

export type ScanWarningSeverity = 'info' | 'warning' | 'error';

export type ScanWarning = {
  path: string;
  type:
    | 'read-error'
    | 'depth-limit'
    | 'file-limit'
    | 'excluded-folder'
    | 'symlink-skipped'
    | 'metadata-invalid'
    | 'metadata-unsupported'
    | 'metadata-conflict';
  message: string;
  severity: ScanWarningSeverity;
};

export type RecentFile = {
  name: string;
  relativePath: string;
  artifactType: ArtifactType;
  contextHints: FolderSignal[];
  size: number;
  modifiedAt: string;
};

export type FolderTreeNode = {
  name: string;
  relativePath: string;
  kind: 'folder' | 'file';
  children?: FolderTreeNode[];
  artifactType?: ArtifactType;
  folderSignals?: FolderSignal[];
  metadata?: FolderMetadataSummary;
  contextHints: FolderSignal[];
  size?: number;
  modifiedAt?: string;
};

export type ContextViewId = 'folders' | 'projects';

export type ContextViewReason =
  | 'physical-tree-node'
  | 'project-root-tag'
  | 'physical-project-file';

export type ContextViewSourceKind =
  | 'physical-tree'
  | 'project-root'
  | 'physical-project-file';

export type ContextViewRow = {
  id: string;
  viewId: ContextViewId;
  artifactRelativePath: string;
  artifactKind: FolderTreeNode['kind'];
  artifactType?: ArtifactType;
  displayLabel: string;
  displayGroup?: string;
  contextId?: string;
  contextLabel?: string;
  contextType?: FolderContextReference['type'];
  viewReason: ContextViewReason;
  sourceKind: ContextViewSourceKind;
  size?: number;
  modifiedAt?: string;
};

export type FolderContextView = {
  id: 'folders';
  label: 'Mapper';
  rows: ContextViewRow[];
};

export type ProjectContext = {
  id: string;
  type: 'project';
  label: string;
  rootRelativePath: string;
  rootRow: ContextViewRow;
  rows: ContextViewRow[];
};

export type ProjectContextView = {
  id: 'projects';
  label: 'Prosjekter';
  contexts: ProjectContext[];
  rows: ContextViewRow[];
};

export type ContextViewsSnapshot = {
  folders: FolderContextView;
  projects: ProjectContextView;
};

export type ScanSummary = {
  fileCount: number;
  folderCount: number;
  artifactTypeCounts: Record<ArtifactType, number>;
  folderSignalCounts: Record<FolderSignal, number>;
  recentFiles: RecentFile[];
  limitsReached: {
    maxDepth: boolean;
    maxFiles: boolean;
  };
};

export type WorkspaceScan = {
  rootPath: string;
  rootName: string;
  scannedAt: string;
  status: ScanStatus;
  tree: FolderTreeNode;
  summary: ScanSummary;
  warnings: ScanWarning[];
  contextViews: ContextViewsSnapshot;
};

export type WorkspaceWatchStatus = {
  rootPath: string;
  state: 'watching' | 'refreshing' | 'updated' | 'error';
  message: string;
  createdAt: string;
};

export type ScanOptions = {
  maxDepth: number;
  maxFiles: number;
  excludedFolderNames: string[];
  includeHidden: boolean;
  followSymlinks: boolean;
};

export type WorkspaceCreationRequest = {
  workspaceName: string;
  parentPath: string;
};

export type RequiredWorkspaceFolderName =
  | '00. Forutsetninger'
  | '01. Notater'
  | '02. Transkripsjoner';

export type WorkspaceCreationFolderStatus = 'created' | 'existing';

export type WorkspaceCreationFolder = {
  name: RequiredWorkspaceFolderName;
  path: string;
  status: WorkspaceCreationFolderStatus;
};

export type WorkspaceCreationResult = {
  rootPath: string;
  rootName: string;
  requiredFolders: WorkspaceCreationFolder[];
  scan: WorkspaceScan;
};

export type WorkspaceInitializationFolderStatus = 'existing' | 'missing';

export type WorkspaceInitializationFolder = {
  name: RequiredWorkspaceFolderName;
  path: string;
  status: WorkspaceInitializationFolderStatus;
};

export type WorkspaceInitializationWarning = {
  path: string;
  message: string;
};

export type WorkspaceInitializationPreview = {
  previewId: string;
  rootPath: string;
  rootName: string;
  requiredFolders: WorkspaceInitializationFolder[];
  existingEntryCount: number;
  warnings: WorkspaceInitializationWarning[];
};

export type WorkspaceInitializationResult = {
  status: 'complete';
  rootPath: string;
  rootName: string;
  requiredFolders: WorkspaceCreationFolder[];
  scan: WorkspaceScan;
};

export type ContextPackageSkippedFile = {
  path: string;
  reason: string;
};

export type ContextPackageWarning = {
  path?: string;
  message: string;
};

export type WorkspaceInfoSnapshot = {
  status: 'missing' | 'complete' | 'invalid';
  path: string;
  generatedAt?: string;
  sourceScope?: 'full-workspace';
  contextPackagePath?: string;
  contextPackageSha256?: string;
  summaryLanguage?: 'nb';
  workspaceSummary?: string;
  participants?: string;
  themes?: string[];
  openQuestions?: string[];
  message?: string;
};

export type WorkspaceSummaryGenerationResult = {
  status: 'complete' | 'failed';
  workspaceInfo?: WorkspaceInfoSnapshot;
  previousWorkspaceInfo?: WorkspaceInfoSnapshot;
  message?: string;
};

export type DocumentRelationshipsSnapshot = {
  status: 'missing' | 'complete' | 'invalid';
  path: string;
  generatedAt?: string;
  sourceScope?: 'full-workspace';
  sourceModel?: 'physical-workspace';
  contextPackagePath?: string;
  contextPackageSha256?: string;
  summaryLanguage?: 'nb';
  overview?: string;
  relationshipMap?: string;
  thematicClusters?: string;
  notableOverlaps?: string;
  possibleContradictions?: string;
  lowConfidenceOrMissingEvidence?: string;
  markdown?: string;
  message?: string;
};

export type DocumentRelationshipsGenerationResult = {
  status: 'complete' | 'failed';
  report?: DocumentRelationshipsSnapshot;
  previousReport?: DocumentRelationshipsSnapshot;
  contextPackage?: ContextPackageResult;
  message?: string;
};

export type ContextPackageScope = 'workspace' | 'folder';

export type FolderContextPackageRequest = {
  rootPath: string;
  folderRelativePath: string;
};

export type ContextPackagePreview = {
  scope: ContextPackageScope;
  rootPath: string;
  targetPath: string;
  targetRelativePath: string;
  outputPath: string;
  outputFileName: string;
  willOverwrite: boolean;
  binaryFileWarning: string;
  selfIgnoreWarning: string;
};

export type ContextPackageResult = {
  status: 'complete';
  scope: ContextPackageScope;
  rootPath: string;
  targetPath: string;
  targetRelativePath: string;
  outputPath: string;
  outputFileName: string;
  overwritten: boolean;
  totalFiles: number;
  totalCharacters: number;
  totalTokens: number;
  outputBytes: number;
  processedFiles: string[];
  skippedFiles: ContextPackageSkippedFile[];
  warnings: ContextPackageWarning[];
  workspaceSummary?: WorkspaceSummaryGenerationResult;
  scan: WorkspaceScan;
};

export type SearchIndexState =
  | 'missing'
  | 'indexing'
  | 'ready'
  | 'updating'
  | 'stale'
  | 'failed';

export type SearchIndexSkippedReason = 'unsupported' | 'binary' | 'oversized' | 'read-error';

export type SearchIndexSkippedFile = {
  relativePath: string;
  reason: SearchIndexSkippedReason;
  message: string;
};

export type SearchIndexSkippedCounts = Record<SearchIndexSkippedReason, number>;

export type SearchIndexStatus = {
  rootPath: string;
  state: SearchIndexState;
  message?: string;
  documentCount: number;
  skippedCounts: SearchIndexSkippedCounts;
  skippedFiles: SearchIndexSkippedFile[];
  updatedAt?: string;
  indexingStartedAt?: string;
};

export type SearchWorkspaceRequest = {
  rootPath: string;
  query: string;
  limit?: number;
};

export type SearchWorkspaceResultItem = {
  id: string;
  rank: number;
  score: number;
  name: string;
  relativePath: string;
  artifactType: ArtifactType;
  extension: string;
  size: number;
  modifiedAt: string;
  snippet: string;
};

export type SearchWorkspaceResult = {
  rootPath: string;
  query: string;
  status: SearchIndexStatus;
  results: SearchWorkspaceResultItem[];
  resultCount: number;
};

export type SearchIndexManifestFile = {
  id: string;
  relative_path: string;
  name: string;
  extension: string;
  artifact_type: ArtifactType;
  size: number;
  modified_at: string;
  mtime_ms: number;
  content_sha256: string;
};

export type TranscriptionImportWarning = {
  path?: string;
  message: string;
};

export type TranscriptionImportNumbering = {
  nextNumber: number;
  width: number;
  separator: string;
  inferredFromExistingFiles: boolean;
};

export type TranscriptionImportPreview = {
  previewId: string;
  rootPath: string;
  sourcePath: string;
  sourceFileName: string;
  targetFolderPath: string;
  targetFolderRelativePath: string;
  destinationPath: string;
  destinationFileName: string;
  numbering: TranscriptionImportNumbering;
  warnings: TranscriptionImportWarning[];
};

export type TranscriptionSummaryStatus = 'missing' | 'complete' | 'stale' | 'invalid';

export type TranscriptionSummarySnapshot = {
  status: TranscriptionSummaryStatus;
  rootPath: string;
  transcriptionRelativePath: string;
  summaryRelativePath: string;
  summaryPath: string;
  generatedAt?: string;
  transcriptionSha256?: string;
  currentTranscriptionSha256?: string;
  summaryLanguage?: 'nb';
  conversationSummary?: string;
  message?: string;
};

export type TranscriptionSummaryGenerationResult =
  | {
      status: 'complete';
      summary: TranscriptionSummarySnapshot;
    }
  | {
      status: 'failed';
      message: string;
    };

export type TranscriptionSummaryReadRequest = {
  rootPath: string;
  transcriptionRelativePath: string;
};

export type TranscriptionSummaryBatchItemStatus = 'missing' | 'complete' | 'stale' | 'invalid';

export type TranscriptionSummaryBatchItem = {
  transcriptionRelativePath: string;
  transcriptionFileName: string;
  status: TranscriptionSummaryBatchItemStatus;
  summaryRelativePath: string;
  message?: string;
};

export type TranscriptionSummaryBatchCounts = {
  total: number;
  missing: number;
  complete: number;
  stale: number;
  invalid: number;
  toGenerate: number;
};

export type TranscriptionSummaryBatchPreview = {
  previewId: string;
  rootPath: string;
  targetFolderPath: string;
  targetFolderRelativePath: string;
  counts: TranscriptionSummaryBatchCounts;
  items: TranscriptionSummaryBatchItem[];
  warnings: TranscriptionImportWarning[];
};

export type TranscriptionSummaryBatchResultItemStatus =
  | 'generated'
  | 'failed'
  | 'skipped-complete'
  | 'skipped-stale';

export type TranscriptionSummaryBatchResultItem = {
  transcriptionRelativePath: string;
  transcriptionFileName: string;
  status: TranscriptionSummaryBatchResultItemStatus;
  message?: string;
  summary?: TranscriptionSummarySnapshot;
};

export type TranscriptionSummaryBatchResultCounts = {
  total: number;
  generated: number;
  failed: number;
  skippedComplete: number;
  skippedStale: number;
};

export type TranscriptionSummaryBatchResult = {
  status: 'complete';
  rootPath: string;
  targetFolderPath: string;
  targetFolderRelativePath: string;
  counts: TranscriptionSummaryBatchResultCounts;
  items: TranscriptionSummaryBatchResultItem[];
  scan: WorkspaceScan;
};

export type TranscriptionImportResult = {
  status: 'complete';
  rootPath: string;
  sourcePath: string;
  sourceFileName: string;
  targetFolderPath: string;
  targetFolderRelativePath: string;
  destinationPath: string;
  destinationFileName: string;
  finalNumber: number;
  copiedBytes: number;
  summary: TranscriptionSummaryGenerationResult;
  scan: WorkspaceScan;
};

export type CodexRunMode = 'read-only' | 'workspace-write';

export type CodexStatusState = 'unavailable' | 'logged-out' | 'ready';

export type CodexStatus = {
  state: CodexStatusState;
  available: boolean;
  loggedIn: boolean;
  version?: string;
  message?: string;
};

export type CodexRunRequest = {
  rootPath: string;
  prompt: string;
  mode: CodexRunMode;
};

export type AppSettings = {
  sidekick_codex_path: string | null;
};

export type CodexPathSource = 'automatic' | 'environment' | 'saved';

export type AppSettingsSnapshot = {
  settings: AppSettings;
  codexPathSource: CodexPathSource;
  effectiveCodexPath: string | null;
  warning?: string;
};

export type CodexPathTestResult = {
  ok: boolean;
  message: string;
  version?: string;
  state?: CodexStatusState;
};

export type CodexRunStartResult = {
  runId: string;
};

export type CodexOutputEvent = {
  runId: string;
  stream: 'stdout' | 'stderr';
  text: string;
  parsed?: unknown;
  createdAt: string;
};

export type CodexCompletionEvent = {
  runId: string;
  state: 'completed' | 'failed' | 'canceled';
  mode: CodexRunMode | 'login';
  exitCode: number | null;
  signal: string | null;
  message?: string;
  scan?: WorkspaceScan;
  createdAt: string;
};

export type CodexEventUnsubscribe = () => void;

// Public renderer contract exposed by preload. Keep this narrow: every method
// should map to one intentional app capability, not a generic system primitive.
export type SidekickApi = {
  getAppInfo: () => Promise<AppInfo>;
  chooseWorkspaceFolder: () => Promise<WorkspaceScan | null>;
  chooseWorkspaceParentFolder: () => Promise<string | null>;
  createWorkspaceFolder: (
    request: WorkspaceCreationRequest,
  ) => Promise<WorkspaceCreationResult | null>;
  chooseWorkspaceFolderForInitialization: () => Promise<WorkspaceInitializationPreview | null>;
  confirmWorkspaceInitialization: (previewId: string) => Promise<WorkspaceInitializationResult>;
  previewContextPackage: (rootPath: string) => Promise<ContextPackagePreview>;
  generateContextPackage: (rootPath: string) => Promise<ContextPackageResult>;
  readWorkspaceInfo: (rootPath: string) => Promise<WorkspaceInfoSnapshot>;
  readDocumentRelationships: (rootPath: string) => Promise<DocumentRelationshipsSnapshot>;
  generateDocumentRelationships: (
    rootPath: string,
  ) => Promise<DocumentRelationshipsGenerationResult>;
  previewFolderContextPackage?: (
    request: FolderContextPackageRequest,
  ) => Promise<ContextPackagePreview>;
  generateFolderContextPackage?: (
    request: FolderContextPackageRequest,
  ) => Promise<ContextPackageResult>;
  previewTranscriptionImport: (rootPath: string) => Promise<TranscriptionImportPreview | null>;
  confirmTranscriptionImport: (previewId: string) => Promise<TranscriptionImportResult>;
  readTranscriptionSummary?: (
    request: TranscriptionSummaryReadRequest,
  ) => Promise<TranscriptionSummarySnapshot>;
  previewTranscriptionSummaryBatch?: (
    rootPath: string,
  ) => Promise<TranscriptionSummaryBatchPreview>;
  confirmTranscriptionSummaryBatch?: (
    previewId: string,
  ) => Promise<TranscriptionSummaryBatchResult>;
  getSearchIndexStatus?: (rootPath: string) => Promise<SearchIndexStatus>;
  refreshSearchIndex?: (rootPath: string) => Promise<SearchIndexStatus>;
  searchWorkspace?: (request: SearchWorkspaceRequest) => Promise<SearchWorkspaceResult>;
  addFolderTag?: (request: FolderTagEditRequest) => Promise<FolderTagEditResult>;
  removeFolderTag?: (request: FolderTagEditRequest) => Promise<FolderTagEditResult>;
  getCodexStatus: (rootPath: string) => Promise<CodexStatus>;
  startCodexLogin: (rootPath: string) => Promise<CodexRunStartResult>;
  startCodexRun: (request: CodexRunRequest) => Promise<CodexRunStartResult>;
  cancelCodexRun: (runId: string) => Promise<void>;
  getSettings: () => Promise<AppSettingsSnapshot>;
  saveCodexPath: (codexPath: string | null) => Promise<AppSettingsSnapshot>;
  resetCodexPath: () => Promise<AppSettingsSnapshot>;
  chooseCodexPath: () => Promise<string | null>;
  testCodexPath: (codexPath: string | null) => Promise<CodexPathTestResult>;
  onCodexOutput: (listener: (event: CodexOutputEvent) => void) => CodexEventUnsubscribe;
  onCodexCompletion: (listener: (event: CodexCompletionEvent) => void) => CodexEventUnsubscribe;
  onSearchIndexStatus?: (
    listener: (event: SearchIndexStatus) => void,
  ) => CodexEventUnsubscribe;
  onWorkspaceScanUpdated?: (listener: (scan: WorkspaceScan) => void) => CodexEventUnsubscribe;
  onWorkspaceWatchStatus?: (
    listener: (event: WorkspaceWatchStatus) => void,
  ) => CodexEventUnsubscribe;
};

declare global {
  interface Window {
    sidekick?: SidekickApi;
  }
}
