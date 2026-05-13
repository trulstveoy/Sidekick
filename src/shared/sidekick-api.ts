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

export type ScanStatus = 'complete' | 'partial';

export type ScanWarningSeverity = 'info' | 'warning' | 'error';

export type ScanWarning = {
  path: string;
  type:
    | 'read-error'
    | 'depth-limit'
    | 'file-limit'
    | 'excluded-folder'
    | 'symlink-skipped';
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
  contextHints: FolderSignal[];
  size?: number;
  modifiedAt?: string;
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

export type ProjectFolderScan = {
  rootPath: string;
  rootName: string;
  scannedAt: string;
  status: ScanStatus;
  tree: FolderTreeNode;
  summary: ScanSummary;
  warnings: ScanWarning[];
};

export type ScanOptions = {
  maxDepth: number;
  maxFiles: number;
  excludedFolderNames: string[];
  includeHidden: boolean;
  followSymlinks: boolean;
};

export type ProjectCreationRequest = {
  projectName: string;
  parentPath: string;
};

export type RequiredProjectFolderName = '00. Forutsetninger' | '01. Transkripsjoner';

export type ProjectCreationFolderStatus = 'created' | 'existing';

export type ProjectCreationFolder = {
  name: RequiredProjectFolderName;
  path: string;
  status: ProjectCreationFolderStatus;
};

export type ProjectCreationResult = {
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectCreationFolder[];
  scan: ProjectFolderScan;
};

export type ProjectInitializationFolderStatus = 'existing' | 'missing';

export type ProjectInitializationFolder = {
  name: RequiredProjectFolderName;
  path: string;
  status: ProjectInitializationFolderStatus;
};

export type ProjectInitializationWarning = {
  path: string;
  message: string;
};

export type ProjectInitializationPreview = {
  previewId: string;
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectInitializationFolder[];
  existingEntryCount: number;
  warnings: ProjectInitializationWarning[];
};

export type ProjectInitializationResult = {
  status: 'complete';
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectCreationFolder[];
  scan: ProjectFolderScan;
};

export type ContextPackageSkippedFile = {
  path: string;
  reason: string;
};

export type ContextPackageWarning = {
  path?: string;
  message: string;
};

export type ContextPackagePreview = {
  rootPath: string;
  outputPath: string;
  outputFileName: string;
  willOverwrite: boolean;
  binaryFileWarning: string;
  selfIgnoreWarning: string;
};

export type ContextPackageResult = {
  status: 'complete';
  rootPath: string;
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
  scan: ProjectFolderScan;
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
  scan: ProjectFolderScan;
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
  scan?: ProjectFolderScan;
  createdAt: string;
};

export type CodexEventUnsubscribe = () => void;

// Public renderer contract exposed by preload. Keep this narrow: every method
// should map to one intentional app capability, not a generic system primitive.
export type SidekickApi = {
  getAppInfo: () => Promise<AppInfo>;
  chooseProjectFolder: () => Promise<ProjectFolderScan | null>;
  chooseProjectParentFolder: () => Promise<string | null>;
  createProjectFolder: (
    request: ProjectCreationRequest,
  ) => Promise<ProjectCreationResult | null>;
  chooseProjectFolderForInitialization: () => Promise<ProjectInitializationPreview | null>;
  confirmProjectInitialization: (previewId: string) => Promise<ProjectInitializationResult>;
  previewContextPackage: (rootPath: string) => Promise<ContextPackagePreview>;
  generateContextPackage: (rootPath: string) => Promise<ContextPackageResult>;
  previewTranscriptionImport: (rootPath: string) => Promise<TranscriptionImportPreview | null>;
  confirmTranscriptionImport: (previewId: string) => Promise<TranscriptionImportResult>;
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
};

declare global {
  interface Window {
    sidekick?: SidekickApi;
  }
}
