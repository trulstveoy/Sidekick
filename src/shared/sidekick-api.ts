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
};

export type SidekickApi = {
  getAppInfo: () => Promise<AppInfo>;
  chooseProjectFolder: () => Promise<ProjectFolderScan | null>;
  previewContextPackage: (rootPath: string) => Promise<ContextPackagePreview>;
  generateContextPackage: (rootPath: string) => Promise<ContextPackageResult>;
};

declare global {
  interface Window {
    sidekick?: SidekickApi;
  }
}
