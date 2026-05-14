import './index.css';
import './shared/sidekick-api';
import type {
  ArtifactType,
  CodexCompletionEvent,
  CodexOutputEvent,
  CodexPathTestResult,
  CodexRunMode,
  CodexStatus,
  ContextPackagePreview,
  ContextPackageResult,
  ContextViewId,
  ContextViewReason,
  ContextViewRow,
  DocumentRelationshipsGenerationResult,
  DocumentRelationshipsSnapshot,
  FolderTag,
  FolderSignal,
  FolderTreeNode,
  AppSettingsSnapshot,
  WorkspaceCreationResult,
  WorkspaceScan,
  WorkspaceInfoSnapshot,
  WorkspaceInitializationPreview,
  WorkspaceInitializationResult,
  ScanWarning,
  SearchIndexStatus,
  SearchWorkspaceResult,
  TranscriptionImportPreview,
  TranscriptionImportResult,
  TranscriptionSummaryBatchItemStatus,
  TranscriptionSummaryBatchPreview,
  TranscriptionSummaryBatchResult,
  TranscriptionSummaryBatchResultItemStatus,
  TranscriptionSummarySnapshot,
  WorkspaceWatchStatus,
} from './shared/sidekick-api';

type ViewState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'ready'; scan: WorkspaceScan }
  | { status: 'partial'; scan: WorkspaceScan }
  | { status: 'error'; message: string };

// Renderer state is modeled as explicit unions so each write-capable workflow
// can move through preview, confirmation, execution, and result states without
// relying on hidden DOM state.
type ContextPackageState =
  | { status: 'unavailable' }
  | { status: 'ready' }
  | { status: 'previewing' }
  | { status: 'confirming'; preview: ContextPackagePreview }
  | { status: 'generating'; preview: ContextPackagePreview }
  | { status: 'complete'; result: ContextPackageResult }
  | { status: 'error'; message: string; phase: 'preview' | 'generation' };

type TranscriptionImportState =
  | { status: 'unavailable' }
  | { status: 'ready' }
  | { status: 'previewing' }
  | { status: 'confirming'; preview: TranscriptionImportPreview }
  | { status: 'importing'; preview: TranscriptionImportPreview }
  | { status: 'complete'; result: TranscriptionImportResult }
  | { status: 'error'; message: string };

type TranscriptionSummaryBatchState =
  | { status: 'unavailable' }
  | { status: 'ready' }
  | { status: 'previewing' }
  | { status: 'confirming'; preview: TranscriptionSummaryBatchPreview }
  | { status: 'generating'; preview: TranscriptionSummaryBatchPreview }
  | { status: 'complete'; result: TranscriptionSummaryBatchResult }
  | { status: 'error'; message: string; phase: 'preview' | 'generation' };

type WorkspaceCreationState =
  | { status: 'closed'; message: string; parentPath: string | null }
  | { status: 'editing'; message: string; parentPath: string | null }
  | { status: 'selecting-parent'; message: string; parentPath: string | null }
  | { status: 'creating'; message: string; parentPath: string | null }
  | { status: 'complete'; message: string; parentPath: string | null }
  | { status: 'error'; message: string; parentPath: string | null };

type WorkspaceInitializationState =
  | { status: 'idle'; message: string }
  | { status: 'choosing'; message: string }
  | { status: 'preview'; message: string; preview: WorkspaceInitializationPreview }
  | { status: 'initializing'; message: string; preview: WorkspaceInitializationPreview }
  | { status: 'complete'; message: string; result: WorkspaceInitializationResult }
  | { status: 'error'; message: string; preview?: WorkspaceInitializationPreview };

type OverviewContextPackageStatus =
  | { status: 'unavailable' }
  | { status: 'checking'; rootPath: string }
  | { status: 'exists'; rootPath: string; outputFileName: string }
  | { status: 'missing'; rootPath: string; outputFileName: string }
  | { status: 'unknown'; rootPath?: string; message: string };

type CodexState =
  | { status: 'unavailable'; message: string }
  | { status: 'checking' }
  | { status: 'logged-out'; codexStatus: CodexStatus }
  | { status: 'ready'; codexStatus: CodexStatus }
  | { status: 'running'; runId: string; mode: CodexRunMode | 'login'; output: CodexOutputEvent[] }
  | {
      status: 'completed' | 'failed' | 'canceled';
      completion: CodexCompletionEvent;
      output: CodexOutputEvent[];
    };

type DocumentRelationshipsState =
  | { status: 'unavailable' }
  | { status: 'checking'; rootPath: string }
  | { status: 'ready'; rootPath: string; snapshot: DocumentRelationshipsSnapshot }
  | { status: 'generating'; rootPath: string; previousReport?: DocumentRelationshipsSnapshot }
  | { status: 'complete'; rootPath: string; result: DocumentRelationshipsGenerationResult }
  | { status: 'failed'; rootPath: string; message: string; previousReport?: DocumentRelationshipsSnapshot };

type SearchState =
  | { status: 'unavailable' }
  | { status: 'idle'; rootPath: string; indexStatus: SearchIndexStatus }
  | { status: 'searching'; rootPath: string; query: string; indexStatus: SearchIndexStatus }
  | { status: 'results'; rootPath: string; query: string; result: SearchWorkspaceResult }
  | { status: 'error'; rootPath: string; query: string; indexStatus?: SearchIndexStatus; message: string };

type DetailRow = [string, string];

type VisibleTreeEntry = {
  node: FolderTreeNode;
  level: number;
  parentPath?: string;
};

type ContextPackageTarget =
  | { scope: 'workspace' }
  | { scope: 'folder'; folderRelativePath: string };

type AppView = 'workspace' | 'settings';
type ActiveWorkflow =
  | 'context-package'
  | 'transcription-import'
  | 'transcription-summary-batch'
  | 'document-relationships'
  | 'codex'
  | null;

type SettingsState =
  | { status: 'idle'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'loading'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'saving'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'testing'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'error'; snapshot?: AppSettingsSnapshot; message: string };

type TranscriptionSummaryState =
  | { status: 'idle' }
  | { status: 'loading'; rootPath: string; transcriptionRelativePath: string }
  | {
      status: 'loaded';
      rootPath: string;
      transcriptionRelativePath: string;
      summary: TranscriptionSummarySnapshot;
    }
  | { status: 'error'; rootPath: string; transcriptionRelativePath: string; message: string };

type FolderTagSaveState =
  | { status: 'idle' }
  | { status: 'saving'; relativePath: string }
  | { status: 'saved'; relativePath: string; message: string }
  | { status: 'error'; relativePath: string; message: string };

type ActionTargets = {
  primaryButton: HTMLButtonElement | null;
  secondaryButton: HTMLButtonElement | null;
};

const appInfoTarget = document.querySelector<HTMLSpanElement>('[data-app-info]');
const appMainTarget = document.querySelector<HTMLElement>('[data-app-main]');
const workspaceViewTarget = document.querySelector<HTMLElement>('[data-workspace-view]');
const settingsViewTarget = document.querySelector<HTMLElement>('[data-settings-view]');
const openWorkspaceButton = document.querySelector<HTMLButtonElement>('[data-open-workspace]');
const openSettingsButton = document.querySelector<HTMLButtonElement>('[data-open-settings]');
const closeSettingsButton = document.querySelector<HTMLButtonElement>('[data-close-settings]');
const actionBarTarget = document.querySelector<HTMLElement>('[data-action-bar]');
const contextSurfaceTarget = document.querySelector<HTMLElement>('[data-context-surface]');
const workspaceDefaultTarget = document.querySelector<HTMLElement>('[data-workspace-default]');
const workflowHostTarget = document.querySelector<HTMLElement>('[data-workflow-host]');
const workflowPanels = document.querySelectorAll<HTMLElement>('[data-workflow-panel]');
const legacyWorkflowSurfaceTarget = document.querySelector<HTMLElement>('.surface-section--workflow');
const summaryStripTarget = document.querySelector<HTMLElement>('[data-summary]');
const workspaceEntryTarget = document.querySelector<HTMLElement>('[data-workspace-entry]');
const workspaceEntryErrorTarget = document.querySelector<HTMLElement>('[data-workspace-entry-error]');
const chooseFolderButtons = document.querySelectorAll<HTMLButtonElement>('[data-choose-folder]');
const initializeWorkspaceButton = document.querySelector<HTMLButtonElement>('[data-initialize-workspace]');
const workspaceInitializationPanelTarget = document.querySelector<HTMLElement>(
  '[data-workspace-initialization-panel]',
);
const workspaceInitializationTitleTarget = document.querySelector<HTMLElement>(
  '[data-workspace-initialization-title]',
);
const workspaceInitializationMessageTarget = document.querySelector<HTMLElement>(
  '[data-workspace-initialization-message]',
);
const workspaceInitializationDetailsTarget = document.querySelector<HTMLElement>(
  '[data-workspace-initialization-details]',
);
const workspaceInitializationWarningsTarget = document.querySelector<HTMLUListElement>(
  '[data-workspace-initialization-warnings]',
);
const workspaceInitializationConfirmButton = document.querySelector<HTMLButtonElement>(
  '[data-workspace-initialization-confirm]',
);
const workspaceInitializationCancelButton = document.querySelector<HTMLButtonElement>(
  '[data-workspace-initialization-cancel]',
);
const openCreateWorkspaceButton = document.querySelector<HTMLButtonElement>('[data-open-create-workspace]');
const workspaceCreateDialogTarget = document.querySelector<HTMLElement>('[data-workspace-create-dialog]');
const workspaceCreateCancelButtons = document.querySelectorAll<HTMLButtonElement>(
  '[data-workspace-create-cancel]',
);
const workspaceNameInput = document.querySelector<HTMLInputElement>('[data-workspace-name]');
const workspaceNameMessageTarget = document.querySelector<HTMLElement>('[data-workspace-name-message]');
const workspaceParentPathTarget = document.querySelector<HTMLElement>('[data-workspace-parent-path]');
const chooseWorkspaceParentButton = document.querySelector<HTMLButtonElement>(
  '[data-choose-workspace-parent]',
);
const workspaceTargetPreviewTarget = document.querySelector<HTMLElement>(
  '[data-workspace-target-preview]',
);
const createWorkspaceButton = document.querySelector<HTMLButtonElement>('[data-create-workspace]');
const createWorkspaceMessageTarget = document.querySelector<HTMLElement>(
  '[data-create-workspace-message]',
);
const selectedNameTarget = document.querySelector<HTMLElement>('[data-selected-name]');
const selectedPathTarget = document.querySelector<HTMLElement>('[data-selected-path]');
const statusMessageTarget = document.querySelector<HTMLElement>('[data-status-message]');
const folderSignalsTarget = document.querySelector<HTMLUListElement>('[data-folder-signals]');
const stateBannerTarget = document.querySelector<HTMLElement>('[data-state-banner]');
const stateTitleTarget = document.querySelector<HTMLElement>('[data-state-title]');
const stateMessageTarget = document.querySelector<HTMLElement>('[data-state-message]');
const overviewTitleTarget = document.querySelector<HTMLElement>('[data-overview-title]');
const overviewSubtitleTarget = document.querySelector<HTMLElement>('[data-overview-subtitle]');
const overviewEmptyTarget = document.querySelector<HTMLElement>('[data-overview-empty]');
const overviewScanStatusTarget = document.querySelector<HTMLElement>('[data-overview-scan-status]');
const overviewContextPackageStatusTarget = document.querySelector<HTMLElement>(
  '[data-overview-context-package-status]',
);
const selectionPanelTarget = document.querySelector<HTMLElement>('[data-selection-panel]');
const selectionLabelTarget = document.querySelector<HTMLElement>('[data-selection-label]');
const selectionTitleTarget = document.querySelector<HTMLElement>('[data-selection-title]');
const selectionBreadcrumbTarget = document.querySelector<HTMLElement>('[data-selection-breadcrumb]');
const selectionDetailsTarget = document.querySelector<HTMLElement>('[data-selection-details]');
const selectionActionsTarget = document.querySelector<HTMLElement>('[data-selection-actions]');
const selectionContentsTarget = document.querySelector<HTMLElement>('[data-selection-contents]');
const overviewGenerateContextButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-generate-context]',
);
const overviewImportTranscriptionButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-import-transcription]',
);
const overviewDocumentRelationshipsButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-document-relationships]',
);
const overviewRunCodexButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-run-codex]',
);
const treeToolbarTarget = document.querySelector<HTMLElement>('[data-tree-toolbar]');
const contextViewToggleTarget = document.querySelector<HTMLElement>('[data-context-view-toggle]');
const contextViewButtons = document.querySelectorAll<HTMLButtonElement>('[data-context-view-button]');
const foldersViewTarget = document.querySelector<HTMLElement>('[data-folders-view]');
const projectsViewTarget = document.querySelector<HTMLElement>('[data-projects-view]');
const treeTarget = document.querySelector<HTMLOListElement>('[data-folder-tree]');
const expandAllButton = document.querySelector<HTMLButtonElement>('[data-expand-all]');
const collapseAllButton = document.querySelector<HTMLButtonElement>('[data-collapse-all]');
const searchPanelTarget = document.querySelector<HTMLElement>('[data-search-panel]');
const searchQueryInput = document.querySelector<HTMLInputElement>('[data-search-query]');
const searchRefreshButton = document.querySelector<HTMLButtonElement>('[data-search-refresh]');
const searchStatusTarget = document.querySelector<HTMLElement>('[data-search-status]');
const searchCountTarget = document.querySelector<HTMLElement>('[data-search-count]');
const searchResultsTarget = document.querySelector<HTMLElement>('[data-search-results]');
const summaryTarget = document.querySelector<HTMLElement>('[data-summary]');
const contextPackageTitleTarget = document.querySelector<HTMLElement>('[data-context-package-title]');
const contextPackageMessageTarget = document.querySelector<HTMLElement>('[data-context-package-message]');
const contextPackageStateTarget = document.querySelector<HTMLElement>('[data-context-package-state]');
const contextPackageDetailsTarget = document.querySelector<HTMLElement>('[data-context-package-details]');
const contextPackageListTarget = document.querySelector<HTMLUListElement>('[data-context-package-list]');
const contextPackagePrimaryButton = document.querySelector<HTMLButtonElement>('[data-context-package-primary]');
const contextPackageSecondaryButton = document.querySelector<HTMLButtonElement>('[data-context-package-secondary]');
const artifactCountsTarget = document.querySelector<HTMLUListElement>('[data-artifact-counts]');
const recentFilesTarget = document.querySelector<HTMLUListElement>('[data-recent-files]');
const warningsTarget = document.querySelector<HTMLUListElement>('[data-warnings]');
const transcriptionImportTitleTarget = document.querySelector<HTMLElement>(
  '[data-transcription-import-title]',
);
const transcriptionImportMessageTarget = document.querySelector<HTMLElement>(
  '[data-transcription-import-message]',
);
const transcriptionImportStateTarget = document.querySelector<HTMLElement>(
  '[data-transcription-import-state]',
);
const transcriptionImportDetailsTarget = document.querySelector<HTMLElement>(
  '[data-transcription-import-details]',
);
const transcriptionImportListTarget = document.querySelector<HTMLUListElement>(
  '[data-transcription-import-list]',
);
const transcriptionImportPrimaryButton = document.querySelector<HTMLButtonElement>(
  '[data-transcription-import-primary]',
);
const transcriptionImportSecondaryButton = document.querySelector<HTMLButtonElement>(
  '[data-transcription-import-secondary]',
);
const transcriptionSummaryBatchTitleTarget = document.querySelector<HTMLElement>(
  '[data-transcription-summary-batch-title]',
);
const transcriptionSummaryBatchMessageTarget = document.querySelector<HTMLElement>(
  '[data-transcription-summary-batch-message]',
);
const transcriptionSummaryBatchStateTarget = document.querySelector<HTMLElement>(
  '[data-transcription-summary-batch-state]',
);
const transcriptionSummaryBatchDetailsTarget = document.querySelector<HTMLElement>(
  '[data-transcription-summary-batch-details]',
);
const transcriptionSummaryBatchListTarget = document.querySelector<HTMLUListElement>(
  '[data-transcription-summary-batch-list]',
);
const transcriptionSummaryBatchPrimaryButton = document.querySelector<HTMLButtonElement>(
  '[data-transcription-summary-batch-primary]',
);
const transcriptionSummaryBatchSecondaryButton = document.querySelector<HTMLButtonElement>(
  '[data-transcription-summary-batch-secondary]',
);
const documentRelationshipsTitleTarget = document.querySelector<HTMLElement>(
  '[data-document-relationships-title]',
);
const documentRelationshipsMessageTarget = document.querySelector<HTMLElement>(
  '[data-document-relationships-message]',
);
const documentRelationshipsStateTarget = document.querySelector<HTMLElement>(
  '[data-document-relationships-state]',
);
const documentRelationshipsDetailsTarget = document.querySelector<HTMLElement>(
  '[data-document-relationships-details]',
);
const documentRelationshipsReportTarget = document.querySelector<HTMLElement>(
  '[data-document-relationships-report]',
);
const documentRelationshipsPrimaryButton = document.querySelector<HTMLButtonElement>(
  '[data-document-relationships-primary]',
);
const documentRelationshipsSecondaryButton = document.querySelector<HTMLButtonElement>(
  '[data-document-relationships-secondary]',
);
const codexTitleTarget = document.querySelector<HTMLElement>('[data-codex-title]');
const codexMessageTarget = document.querySelector<HTMLElement>('[data-codex-message]');
const codexStateTarget = document.querySelector<HTMLElement>('[data-codex-state]');
const codexDetailsTarget = document.querySelector<HTMLElement>('[data-codex-details]');
const codexPromptInput = document.querySelector<HTMLTextAreaElement>('[data-codex-prompt]');
const codexEditModeInput = document.querySelector<HTMLInputElement>('[data-codex-edit-mode]');
const codexModeTitleTarget = document.querySelector<HTMLElement>('[data-codex-mode-title]');
const codexModeDescriptionTarget = document.querySelector<HTMLElement>(
  '[data-codex-mode-description]',
);
const codexOutputTarget = document.querySelector<HTMLUListElement>('[data-codex-output]');
const codexPrimaryButton = document.querySelector<HTMLButtonElement>('[data-codex-primary]');
const codexSecondaryButton = document.querySelector<HTMLButtonElement>('[data-codex-secondary]');
const settingsCodexPathInput = document.querySelector<HTMLInputElement>('[data-settings-codex-path]');
const settingsCodexDetailsTarget = document.querySelector<HTMLElement>(
  '[data-settings-codex-details]',
);
const settingsMessageTarget = document.querySelector<HTMLElement>('[data-settings-message]');
const settingsChooseCodexButton = document.querySelector<HTMLButtonElement>(
  '[data-settings-choose-codex]',
);
const settingsTestCodexButton = document.querySelector<HTMLButtonElement>('[data-settings-test-codex]');
const settingsSaveCodexButton = document.querySelector<HTMLButtonElement>('[data-settings-save-codex]');
const settingsResetCodexButton = document.querySelector<HTMLButtonElement>(
  '[data-settings-reset-codex]',
);

const ROOT_PATH = '.';

const artifactLabels: Record<ArtifactType, string> = {
  'markdown-text': 'Markdown/tekst',
  document: 'Dokumenter',
  pdf: 'PDFs',
  image: 'Bilder',
  audio: 'Lyd',
  video: 'Video',
  'spreadsheet-data': 'Regneark/data',
  presentation: 'Presentasjoner',
  drawio: 'draw.io',
  transcript: 'Transkripsjoner',
  note: 'Notater',
  'information-model': 'Informasjonsmodeller',
  architecture: 'Arkitektur',
  unclassified: 'Uklassifisert',
};

const signalLabels: Record<FolderSignal, string> = {
  background: 'Bakgrunn',
  transcript: 'Transkripsjonmappe',
  'information-model': 'Informasjonsmodeller',
  architecture: 'Arkitektur',
  thematic: 'Tematisk',
};

let state: ViewState = { status: 'empty' };
let expandedPaths = new Set<string>();
let selectedTreePath = ROOT_PATH;
let focusedTreePath = ROOT_PATH;
let activeContextView: ContextViewId = 'folders';
let contextPackageState: ContextPackageState = { status: 'unavailable' };
let contextPackageTarget: ContextPackageTarget = { scope: 'workspace' };
let overviewContextPackageStatus: OverviewContextPackageStatus = { status: 'unavailable' };
let transcriptionImportState: TranscriptionImportState = { status: 'unavailable' };
let transcriptionSummaryBatchState: TranscriptionSummaryBatchState = { status: 'unavailable' };
let documentRelationshipsState: DocumentRelationshipsState = { status: 'unavailable' };
let searchState: SearchState = { status: 'unavailable' };
let searchDebounceTimer: number | undefined;
let workspaceCreationState: WorkspaceCreationState = {
  status: 'closed',
  message: '',
  parentPath: null,
};
let workspaceInitializationState: WorkspaceInitializationState = {
  status: 'idle',
  message: '',
};
let workspaceNameTouched = false;
let codexState: CodexState = { status: 'unavailable', message: 'Choose a folder first.' };
let appView: AppView = 'workspace';
let activeWorkflow: ActiveWorkflow = null;
let settingsState: SettingsState = { status: 'idle', message: '' };
let workspaceInfoState: { rootPath: string; snapshot: WorkspaceInfoSnapshot; message?: string } | null =
  null;
let transcriptionSummaryState: TranscriptionSummaryState = { status: 'idle' };
let folderTagSaveState: FolderTagSaveState = { status: 'idle' };
let workspaceWatchStatus: WorkspaceWatchStatus | null = null;

if (!workflowHostTarget && legacyWorkflowSurfaceTarget) {
  // Vite HMR can update renderer code while leaving an older index.html DOM in
  // the running Electron window. A full reload is required when the shell
  // structure changed, otherwise workflow controls keep operating in the old
  // right-panel layout.
  window.location.reload();
}

const setText = (target: Element | null, value: string) => {
  if (target) {
    target.textContent = value;
  }
};

const clear = (target: HTMLElement | null) => {
  if (target) {
    target.replaceChildren();
  }
};

const createListItem = (text: string) => {
  const item = document.createElement('li');
  item.textContent = text;

  return item;
};

const createDetailRow = ([label, value]: DetailRow) => {
  const wrapper = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);

  return wrapper;
};

const renderDetails = (target: HTMLElement | null, rows: DetailRow[]) => {
  clear(target);
  target?.append(...rows.map(createDetailRow));
};

const renderList = (target: HTMLUListElement | null, items: string[]) => {
  clear(target);
  target?.append(...items.map(createListItem));
};

const renderActions = (
  { primaryButton, secondaryButton }: ActionTargets,
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
  secondaryLabel?: string,
) => {
  if (primaryButton) {
    primaryButton.textContent = primaryLabel;
    primaryButton.disabled = primaryDisabled;
  }

  if (secondaryButton && secondaryLabel) {
    secondaryButton.textContent = secondaryLabel;
  }

  secondaryButton?.toggleAttribute('hidden', !secondaryVisible);
};

const formatBytes = (bytes?: number) => {
  if (bytes === undefined) {
    return '';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatShortDate = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const isOverviewContextPackageStatusForScan = (scan: WorkspaceScan) =>
  overviewContextPackageStatus.status !== 'unavailable' &&
  overviewContextPackageStatus.status !== 'unknown' &&
  overviewContextPackageStatus.rootPath === scan.rootPath;

const contextPackageStatusText = (scan?: WorkspaceScan) => {
  if (!scan || !isOverviewContextPackageStatusForScan(scan)) {
    return overviewContextPackageStatus.status === 'unknown' ? 'Ukjent' : 'Ikke sjekket';
  }

  if (overviewContextPackageStatus.status === 'checking') {
    return 'Sjekker';
  }

  if (overviewContextPackageStatus.status === 'exists') {
    return 'Finnes';
  }

  return 'Mangler';
};

const overviewWarningCount = (scan: WorkspaceScan) => {
  let count = scan.warnings.length;

  if (scan.summary.limitsReached.maxDepth) {
    count += 1;
  }

  if (scan.summary.limitsReached.maxFiles) {
    count += 1;
  }

  return count;
};

const collectFileArtifactTypes = (node: FolderTreeNode, types = new Set<ArtifactType>()) => {
  if (!isFolderNode(node) && node.artifactType) {
    types.add(node.artifactType);
  }

  getChildren(node).forEach((child) => collectFileArtifactTypes(child, types));

  return types;
};

const countFilesInNode = (node: FolderTreeNode): number =>
  getChildren(node).reduce(
    (count, child) => count + (isFolderNode(child) ? countFilesInNode(child) : 1),
    0,
  );

const getFolderSignalLabel = (node: FolderTreeNode) => {
  const signal = node.folderSignals?.[0] ?? node.contextHints[0];

  return signal ? signalLabels[signal] : 'Ingen tydelig signal';
};

const findNodesByFolderSignal = (
  node: FolderTreeNode,
  signal: FolderSignal,
  matches: FolderTreeNode[] = [],
) => {
  if (
    isFolderNode(node) &&
    (node.folderSignals?.includes(signal) || node.contextHints.includes(signal))
  ) {
    matches.push(node);
  }

  getChildren(node).forEach((child) => findNodesByFolderSignal(child, signal, matches));

  return matches;
};

const getTranscriptionFolderLabel = (scan: WorkspaceScan) => {
  const folders = findNodesByFolderSignal(scan.tree, 'transcript');

  if (folders.length === 1) {
    return folders[0].relativePath;
  }

  if (folders.length > 1) {
    return 'Flere mulige transkripsjonsmapper';
  }

  return 'Ingen transkripsjonsmappe funnet';
};

const isSingleDetectedTranscriptionFolder = (scan: WorkspaceScan, node: FolderTreeNode) => {
  const folders = findNodesByFolderSignal(scan.tree, 'transcript');

  return (
    isFolderNode(node) &&
    (node.folderSignals?.includes('transcript') || node.contextHints.includes('transcript')) &&
    folders.length === 1 &&
    folders[0].relativePath === node.relativePath
  );
};

const overviewWarnings = (scan?: WorkspaceScan) => {
  if (!scan) {
    return [];
  }

  const warnings = scan.warnings.map((warning) => `${warning.path}: ${warning.message}`);

  if (scan.summary.limitsReached.maxDepth) {
    warnings.unshift('Skanningen traff maks dybde. Oversikten kan være ufullstendig.');
  }

  if (scan.summary.limitsReached.maxFiles) {
    warnings.unshift('Skanningen traff maks antall filer. Oversikten kan være ufullstendig.');
  }

  if (scan.status === 'partial' && warnings.length === 0) {
    warnings.unshift('Skanningen er delvis. Se arbeidsområdet manuelt ved behov.');
  }

  return warnings;
};

const setContextPackageStateForScan = (scan?: WorkspaceScan) => {
  contextPackageState = scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setOverviewContextPackageStatusForScan = (scan?: WorkspaceScan) => {
  overviewContextPackageStatus = scan && window.sidekick
    ? { status: 'checking', rootPath: scan.rootPath }
    : { status: 'unavailable' };
};

const setTranscriptionImportStateForScan = (scan?: WorkspaceScan) => {
  transcriptionImportState =
    scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setTranscriptionSummaryBatchStateForScan = (scan?: WorkspaceScan) => {
  transcriptionSummaryBatchState =
    scan && window.sidekick?.previewTranscriptionSummaryBatch
      ? { status: 'ready' }
      : { status: 'unavailable' };
};

const setDocumentRelationshipsStateForScan = (scan?: WorkspaceScan) => {
  documentRelationshipsState =
    scan && window.sidekick ? { status: 'checking', rootPath: scan.rootPath } : { status: 'unavailable' };
};

const createMissingSearchStatus = (rootPath: string): SearchIndexStatus => ({
  rootPath,
  state: 'missing',
  documentCount: 0,
  skippedCounts: {
    unsupported: 0,
    binary: 0,
    oversized: 0,
    'read-error': 0,
  },
  skippedFiles: [],
});

const setSearchStateForScan = (scan?: WorkspaceScan) => {
  searchState =
    scan && window.sidekick?.getSearchIndexStatus
      ? { status: 'idle', rootPath: scan.rootPath, indexStatus: createMissingSearchStatus(scan.rootPath) }
      : { status: 'unavailable' };
};

const setCodexStateForScan = (scan?: WorkspaceScan) => {
  codexState =
    scan && window.sidekick
      ? { status: 'checking' }
      : { status: 'unavailable', message: 'Choose a folder first.' };
};

const setActiveScan = (scan: WorkspaceScan) => {
  resetExpandedPaths();
  selectedTreePath = scan.tree.relativePath;
  focusedTreePath = scan.tree.relativePath;
  activeContextView = 'folders';
  workspaceWatchStatus = null;
  transcriptionSummaryState = { status: 'idle' };
  activeWorkflow = null;
  appView = 'workspace';
  resetContextPackageTarget();
  setContextPackageStateForScan(scan);
  setOverviewContextPackageStatusForScan(scan);
  setTranscriptionImportStateForScan(scan);
  setTranscriptionSummaryBatchStateForScan(scan);
  setDocumentRelationshipsStateForScan(scan);
  setSearchStateForScan(scan);
  setCodexStateForScan(scan);
  state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
  workspaceInfoState = null;
  void refreshWorkspaceInfo(scan);
  void refreshDocumentRelationships(scan);
  void refreshSearchIndexStatus(scan);
};

const getActiveScan = () =>
  state.status === 'ready' || state.status === 'partial' ? state.scan : undefined;

const isFolderNode = (node: FolderTreeNode) => node.kind === 'folder';

const hasActiveSearchQuery = () => Boolean(searchQueryInput?.value.trim());

const getProjectRows = (scan: WorkspaceScan) => scan.contextViews.projects.rows;

const getSelectedContextViewRow = (
  scan: WorkspaceScan,
  relativePath = selectedTreePath,
): ContextViewRow | undefined => {
  const rows =
    activeContextView === 'projects'
      ? getProjectRows(scan)
      : scan.contextViews.folders.rows;

  return rows.find((row) => row.artifactRelativePath === relativePath);
};

const getFirstProjectSelectionPath = (scan: WorkspaceScan) =>
  scan.contextViews.projects.contexts[0]?.rootRelativePath ?? scan.tree.relativePath;

const getNearestExistingPath = (scan: WorkspaceScan, relativePath: string) => {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/g, '');

  if (!normalized || normalized === ROOT_PATH) {
    return scan.tree.relativePath;
  }

  const segments = normalized.split('/');

  while (segments.length > 0) {
    const candidate = segments.join('/');

    if (getNodeByPath(scan.tree, candidate)) {
      return candidate;
    }

    segments.pop();
  }

  return scan.tree.relativePath;
};

const selectContextView = (viewId: ContextViewId) => {
  const scan = getActiveScan();

  activeContextView = viewId;

  if (scan) {
    if (viewId === 'folders') {
      selectedTreePath = getNodeByPath(scan.tree, selectedTreePath)
        ? selectedTreePath
        : scan.tree.relativePath;
      focusedTreePath = selectedTreePath;
    } else if (!getProjectRows(scan).some((row) => row.artifactRelativePath === selectedTreePath)) {
      selectedTreePath = getFirstProjectSelectionPath(scan);
      focusedTreePath = selectedTreePath;
    }
  }

  render();
};

const replaceActiveScan = (scan: WorkspaceScan, preferredSelectedPath = selectedTreePath) => {
  const selectedPath = getNodeByPath(scan.tree, preferredSelectedPath)
    ? preferredSelectedPath
    : getNearestExistingPath(scan, preferredSelectedPath);

  selectedTreePath = selectedPath;
  focusedTreePath = selectedPath;
  if (
    activeContextView === 'projects' &&
    !getProjectRows(scan).some((row) => row.artifactRelativePath === selectedTreePath)
  ) {
    selectedTreePath = getFirstProjectSelectionPath(scan);
    focusedTreePath = selectedTreePath;
  }
  state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
};

const resetContextPackageTarget = () => {
  contextPackageTarget = { scope: 'workspace' };
};

const openWorkspaceContextPackageWorkflow = () => {
  resetContextPackageTarget();
  openWorkflow('context-package');
};

const openFolderContextPackageWorkflow = (folderRelativePath: string) => {
  contextPackageTarget = { scope: 'folder', folderRelativePath };
  openWorkflow('context-package');
};

const focusActiveWorkflow = () => {
  window.requestAnimationFrame(() => {
    const activePanel = document.querySelector<HTMLElement>(
      `[data-workflow-panel="${activeWorkflow ?? ''}"]`,
    );
    const focusTarget = activePanel?.querySelector<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusTarget?.focus();
  });
};

const focusSelectedTreeRow = () => {
  window.requestAnimationFrame(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      return;
    }

    if (activeContextView === 'projects') {
      const projectRow = projectsViewTarget?.querySelector<HTMLElement>(
        `.project-context-row[data-project-path="${CSS.escape(selectedTreePath)}"]`,
      );
      projectRow?.focus();
      return;
    }

    const row = treeTarget?.querySelector<HTMLElement>(
      `.tree-row[data-tree-path="${CSS.escape(focusedTreePath)}"]`,
    );
    row?.focus();
  });
};

const openWorkflow = (workflow: Exclude<ActiveWorkflow, null>) => {
  if (!getActiveScan()) {
    return;
  }

  appView = 'workspace';
  activeWorkflow = workflow;
  render();
  focusActiveWorkflow();
};

const closeActiveWorkflow = () => {
  if (activeWorkflow === 'context-package' && contextPackageState.status !== 'generating') {
    contextPackageState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  }

  if (activeWorkflow === 'transcription-import' && transcriptionImportState.status !== 'importing') {
    transcriptionImportState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  }

  if (
    activeWorkflow === 'transcription-summary-batch' &&
    transcriptionSummaryBatchState.status !== 'generating'
  ) {
    transcriptionSummaryBatchState =
      getActiveScan() && window.sidekick?.previewTranscriptionSummaryBatch
        ? { status: 'ready' }
        : { status: 'unavailable' };
  }

  if (activeWorkflow === 'document-relationships' && documentRelationshipsState.status !== 'generating') {
    const scan = getActiveScan();

    if (scan) {
      void refreshDocumentRelationships(scan);
    } else {
      documentRelationshipsState = { status: 'unavailable' };
    }
  }

  if (
    activeWorkflow === 'codex' &&
    codexState.status !== 'running' &&
    codexState.status !== 'checking'
  ) {
    const scan = getActiveScan();
    if (scan) {
      void refreshCodexStatus(scan);
    }
  }

  activeWorkflow = null;
  render();
  focusSelectedTreeRow();
};

const isExclusiveWorkflowActive = () =>
  activeWorkflow !== null &&
  (contextPackageState.status === 'previewing' ||
    contextPackageState.status === 'confirming' ||
    contextPackageState.status === 'generating' ||
    transcriptionImportState.status === 'previewing' ||
    transcriptionImportState.status === 'confirming' ||
    transcriptionImportState.status === 'importing' ||
    transcriptionSummaryBatchState.status === 'previewing' ||
    transcriptionSummaryBatchState.status === 'confirming' ||
    transcriptionSummaryBatchState.status === 'generating' ||
    documentRelationshipsState.status === 'checking' ||
    documentRelationshipsState.status === 'generating' ||
    codexState.status === 'checking' ||
    codexState.status === 'running');

const getChildren = (node: FolderTreeNode) => node.children ?? [];

const hasChildren = (node: FolderTreeNode) => getChildren(node).length > 0;

const getVisibleFolderTags = (node: FolderTreeNode) =>
  isFolderNode(node) && node.metadata?.status === 'valid' ? node.metadata.tags : [];

const collectWorkspaceTags = (node: FolderTreeNode, tags = new Map<string, FolderTag>()) => {
  getVisibleFolderTags(node).forEach((tag) => {
    tags.set(tag.normalizedLabel, tag);
  });

  getChildren(node).forEach((child) => collectWorkspaceTags(child, tags));

  return [...tags.values()].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
  );
};

const getNodeByPath = (node: FolderTreeNode, relativePath: string): FolderTreeNode | undefined => {
  if (node.relativePath === relativePath) {
    return node;
  }

  for (const child of getChildren(node)) {
    const match = getNodeByPath(child, relativePath);
    if (match) {
      return match;
    }
  }

  return undefined;
};

const flattenVisibleTree = (
  node: FolderTreeNode,
  level = 1,
  parentPath?: string,
  entries: VisibleTreeEntry[] = [],
) => {
  entries.push({ node, level, parentPath });

  if (isFolderNode(node) && expandedPaths.has(node.relativePath)) {
    getChildren(node).forEach((child) => {
      flattenVisibleTree(child, level + 1, node.relativePath, entries);
    });
  }

  return entries;
};

const getTreeEntryByPath = (
  node: FolderTreeNode,
  relativePath: string,
  level = 1,
  parentPath?: string,
): VisibleTreeEntry | undefined => {
  if (node.relativePath === relativePath) {
    return { node, level, parentPath };
  }

  for (const child of getChildren(node)) {
    const match = getTreeEntryByPath(child, relativePath, level + 1, node.relativePath);
    if (match) {
      return match;
    }
  }

  return undefined;
};

const getParentPath = (scan: WorkspaceScan, relativePath: string) =>
  getTreeEntryByPath(scan.tree, relativePath)?.parentPath;

const getPathAncestors = (scan: WorkspaceScan, relativePath: string) => {
  const ancestors: FolderTreeNode[] = [];
  let currentPath: string | undefined = relativePath;

  while (currentPath) {
    const entry = getTreeEntryByPath(scan.tree, currentPath);
    if (!entry) {
      break;
    }

    ancestors.unshift(entry.node);
    currentPath = entry.parentPath;
  }

  return ancestors;
};

const ensureVisibleTreeSelection = (scan: WorkspaceScan) => {
  const selectedNode = getNodeByPath(scan.tree, selectedTreePath);
  const focusedNode = getNodeByPath(scan.tree, focusedTreePath);

  if (!selectedNode) {
    selectedTreePath = scan.tree.relativePath;
  }

  if (!focusedNode) {
    focusedTreePath = selectedTreePath;
  }
};

const focusTreeRow = (relativePath: string) => {
  if (activeContextView === 'projects') {
    const focusProjectRow = () => {
      const row = projectsViewTarget?.querySelector<HTMLElement>(
        `.project-context-row[data-project-path="${CSS.escape(relativePath)}"]`,
      );
      row?.focus();
    };
    focusProjectRow();
    window.requestAnimationFrame(focusProjectRow);
    return;
  }

  const row = treeTarget?.querySelector<HTMLElement>(
    `.tree-row[data-tree-path="${CSS.escape(relativePath)}"]`,
  );
  row?.focus();

  // Some tree actions re-render immediately before focus moves. Queue a second
  // focus pass so keyboard navigation lands on the recreated row.
  window.requestAnimationFrame(() => {
    const nextRow = treeTarget?.querySelector<HTMLElement>(
      `.tree-row[data-tree-path="${CSS.escape(relativePath)}"]`,
    );
    nextRow?.focus();
  });
};

const selectTreePath = (relativePath: string, shouldFocus = false) => {
  if (relativePath !== selectedTreePath) {
    folderTagSaveState = { status: 'idle' };
  }
  selectedTreePath = relativePath;
  focusedTreePath = relativePath;
  render();

  if (shouldFocus) {
    focusTreeRow(relativePath);
  }
};

const saveFolderTag = async (node: FolderTreeNode, label: string, action: 'add' | 'remove') => {
  const scan = getActiveScan();
  const api = action === 'add' ? window.sidekick?.addFolderTag : window.sidekick?.removeFolderTag;
  const normalizedLabel = label.trim().replace(/\s+/g, ' ');

  if (!scan || !isFolderNode(node) || !api || !normalizedLabel || node.relativePath === ROOT_PATH) {
    return;
  }

  folderTagSaveState = { status: 'saving', relativePath: node.relativePath };
  render();

  try {
    const result = await api({
      rootPath: scan.rootPath,
      folderRelativePath: node.relativePath,
      label: normalizedLabel,
    });

    replaceActiveScan(result.scan, node.relativePath);
    folderTagSaveState = {
      status: 'saved',
      relativePath: result.folderRelativePath,
      message: 'Lagret',
    };
  } catch (error) {
    folderTagSaveState = {
      status: 'error',
      relativePath: node.relativePath,
      message: error instanceof Error ? error.message : 'Kunne ikke lagre tagger',
    };
  }

  render();
};

const getDirectChildSummary = (node: FolderTreeNode) => {
  const children = getChildren(node);
  const folderCount = children.filter(isFolderNode).length;
  const fileCount = children.length - folderCount;
  const parts = [];

  if (folderCount > 0) {
    parts.push(`${folderCount} ${folderCount === 1 ? 'mappe' : 'mapper'}`);
  }

  if (fileCount > 0) {
    parts.push(`${fileCount} ${fileCount === 1 ? 'fil' : 'filer'}`);
  }

  return parts.length > 0 ? parts.join(' / ') : 'Tom';
};

const collectFolderPaths = (node: FolderTreeNode, paths = new Set<string>()) => {
  if (isFolderNode(node)) {
    paths.add(node.relativePath);
  }

  getChildren(node).filter(isFolderNode).forEach((child) => {
    collectFolderPaths(child, paths);
  });

  return paths;
};

const resetExpandedPaths = () => {
  expandedPaths = new Set([ROOT_PATH]);
};

const toggleFolder = (relativePath: string) => {
  const nextExpandedPaths = new Set(expandedPaths);

  if (nextExpandedPaths.has(relativePath)) {
    nextExpandedPaths.delete(relativePath);
  } else {
    nextExpandedPaths.add(relativePath);
  }

  expandedPaths = nextExpandedPaths;
  render();
};

const expandAllFolders = () => {
  const scan = getActiveScan();

  if (!scan) {
    return;
  }

  expandedPaths = collectFolderPaths(scan.tree);
  render();
};

const collapseAllFolders = () => {
  const scan = getActiveScan();

  expandedPaths = scan ? new Set([ROOT_PATH]) : new Set();
  if (scan) {
    selectedTreePath = scan.tree.relativePath;
    focusedTreePath = scan.tree.relativePath;
  }
  render();
};

const renderSummary = (scan?: WorkspaceScan) => {
  if (!summaryTarget) {
    return;
  }

  const rows: DetailRow[] = scan
    ? [
        ['Filer', scan.summary.fileCount.toString()],
        ['Mapper', scan.summary.folderCount.toString()],
        ['Siste skanning', formatShortDate(scan.scannedAt)],
        ['Kontekstpakke', contextPackageStatusText(scan)],
        ['Transkripsjoner', scan.summary.artifactTypeCounts.transcript.toString()],
        ['Varsler', overviewWarningCount(scan).toString()],
        ['Markdown/tekst', scan.summary.artifactTypeCounts['markdown-text'].toString()],
      ]
    : [
        ['Filer', '0'],
        ['Mapper', '0'],
        ['Siste skanning', '-'],
        ['Kontekstpakke', 'Ikke sjekket'],
      ];

  summaryTarget.replaceChildren(
    ...rows.map((row, index) => {
      const item = createDetailRow(row);
      if (index > 3) {
        item.className = 'stats-strip__optional';
      }
      if (row[0] === 'Varsler' && scan && overviewWarningCount(scan) > 0) {
        item.dataset.status = 'warning';
      }
      return item;
    }),
  );
};

const renderArtifactCounts = (scan?: WorkspaceScan) => {
  clear(artifactCountsTarget);

  if (!artifactCountsTarget || !scan) {
    artifactCountsTarget?.append(createListItem('Ingen artefakter ennå'));
    return;
  }

  const rows = Object.entries(scan.summary.artifactTypeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${artifactLabels[type as ArtifactType]}: ${count}`);

  artifactCountsTarget.append(...(rows.length ? rows : ['Ingen artefakter funnet']).map(createListItem));
};

const renderFolderSignals = (scan?: WorkspaceScan) => {
  clear(folderSignalsTarget);

  if (!folderSignalsTarget || !scan) {
    folderSignalsTarget?.append(createListItem('Ingen mappesignaler ennå'));
    return;
  }

  const rows = Object.entries(scan.summary.folderSignalCounts)
    .filter(([, count]) => count > 0)
    .map(([signal, count]) => `${signalLabels[signal as FolderSignal]}: ${count}`);

  folderSignalsTarget.append(
    ...(rows.length ? rows : ['Ingen mappesignaler funnet']).map(createListItem),
  );
};

const renderRecentFiles = (scan?: WorkspaceScan) => {
  clear(recentFilesTarget);

  if (!recentFilesTarget || !scan || scan.summary.recentFiles.length === 0) {
    recentFilesTarget?.append(createListItem('Ingen nylig endrede filer'));
    return;
  }

  recentFilesTarget.append(
    ...scan.summary.recentFiles.map((file) => {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const meta = document.createElement('span');
      name.textContent = file.relativePath;
      meta.textContent = `${artifactLabels[file.artifactType]} / ${formatDate(file.modifiedAt)}`;
      item.append(name, meta);

      return item;
    }),
  );
};

const renderWarnings = (warnings: ScanWarning[] = []) => {
  clear(warningsTarget);

  if (!warningsTarget || warnings.length === 0) {
    warningsTarget?.append(createListItem('Ingen varsler'));
    return;
  }

  warningsTarget.append(
    ...warnings.map((warning) => createListItem(`${warning.path}: ${warning.message}`)),
  );
};

const renderOverviewWarnings = (scan?: WorkspaceScan) => {
  clear(warningsTarget);

  const warnings = overviewWarnings(scan);

  if (!warningsTarget || warnings.length === 0) {
    warningsTarget?.append(createListItem('Ingen varsler'));
    return;
  }

  warningsTarget.append(...warnings.map(createListItem));
};

const renderOverviewScanStatus = (scan?: WorkspaceScan) => {
  if (!scan) {
    renderDetails(overviewScanStatusTarget, []);
    return;
  }

  renderDetails(overviewScanStatusTarget, [
    ['Status', scan.status === 'partial' ? 'Delvis' : 'Fullført'],
    ['Tidspunkt', formatDate(scan.scannedAt)],
    ['Filer', scan.summary.fileCount.toString()],
    ['Mapper', scan.summary.folderCount.toString()],
  ]);
};

const renderOverviewContextPackageStatus = (scan?: WorkspaceScan) => {
  if (!overviewContextPackageStatusTarget) {
    return;
  }

  const statusText = contextPackageStatusText(scan);
  overviewContextPackageStatusTarget.textContent = statusText;
  overviewContextPackageStatusTarget.dataset.status =
    statusText === 'Finnes' ? 'success' : statusText === 'Mangler' ? 'warning' : 'neutral';
};

const getFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop();
  return extension && extension !== fileName ? `.${extension}` : 'fil';
};

const hasAllowedTranscriptionExtension = (fileName: string) =>
  ['.txt', '.md', '.markdown'].includes(getFileExtension(fileName).toLowerCase());

const isTranscriptionFileNode = (node: FolderTreeNode) =>
  !isFolderNode(node) &&
  hasAllowedTranscriptionExtension(node.name) &&
  (node.artifactType === 'transcript' || node.contextHints.includes('transcript'));

const isTranscriptionSummaryStateFor = (
  rootPath: string,
  transcriptionRelativePath: string,
) =>
  transcriptionSummaryState.status !== 'idle' &&
  transcriptionSummaryState.rootPath === rootPath &&
  transcriptionSummaryState.transcriptionRelativePath === transcriptionRelativePath;

const loadTranscriptionSummary = async (scan: WorkspaceScan, node: FolderTreeNode) => {
  if (!window.sidekick?.readTranscriptionSummary || !isTranscriptionFileNode(node)) {
    return;
  }

  const request = {
    rootPath: scan.rootPath,
    transcriptionRelativePath: node.relativePath,
  };

  try {
    const summary = await window.sidekick.readTranscriptionSummary(request);

    if (selectedTreePath !== node.relativePath || getActiveScan()?.rootPath !== scan.rootPath) {
      return;
    }

    transcriptionSummaryState = {
      status: 'loaded',
      rootPath: scan.rootPath,
      transcriptionRelativePath: node.relativePath,
      summary,
    };
  } catch (error) {
    if (selectedTreePath !== node.relativePath || getActiveScan()?.rootPath !== scan.rootPath) {
      return;
    }

    transcriptionSummaryState = {
      status: 'error',
      rootPath: scan.rootPath,
      transcriptionRelativePath: node.relativePath,
      message: error instanceof Error ? error.message : 'Sammendraget kunne ikke leses.',
    };
  }

  render();
};

const getNodeWarnings = (scan: WorkspaceScan, node: FolderTreeNode) =>
  scan.warnings.filter((warning) => {
    if (node.relativePath === ROOT_PATH) {
      return true;
    }

    return warning.path === node.relativePath || warning.path.startsWith(`${node.relativePath}/`);
  });

const renderSelectionBreadcrumb = (scan: WorkspaceScan, node: FolderTreeNode) => {
  clear(selectionBreadcrumbTarget);

  if (!selectionBreadcrumbTarget) {
    return;
  }

  const ancestors = getPathAncestors(scan, node.relativePath);

  ancestors.forEach((ancestor, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '›';
      selectionBreadcrumbTarget.append(separator);
    }

    const isCurrent = index === ancestors.length - 1;
    if (isCurrent) {
      const current = document.createElement('span');
      current.className = 'breadcrumb-current';
      current.textContent = ancestor.relativePath === ROOT_PATH ? 'Arbeidsområdeoversikt' : ancestor.name;
      selectionBreadcrumbTarget.append(current);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'breadcrumb-button';
    button.textContent = ancestor.relativePath === ROOT_PATH ? 'Arbeidsområdeoversikt' : ancestor.name;
    button.addEventListener('click', () => {
      selectTreePath(ancestor.relativePath, true);
    });
    selectionBreadcrumbTarget.append(button);
  });
};

const createDirectContentRow = (node: FolderTreeNode) => {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = `direct-content-row direct-content-row--${node.kind}`;
  row.addEventListener('click', () => {
    if (isFolderNode(node)) {
      expandedPaths.add(node.relativePath);
    }
    selectTreePath(node.relativePath, true);
  });

  const badge = document.createElement('span');
  badge.className = 'artifact-badge';
  badge.textContent = isFolderNode(node) ? 'mappe' : getFileExtension(node.name);

  const name = document.createElement('span');
  name.className = 'direct-content-name';
  name.textContent = node.name;

  const meta = document.createElement('span');
  meta.className = 'direct-content-meta';
  meta.textContent = isFolderNode(node)
    ? getDirectChildSummary(node)
    : [node.artifactType ? artifactLabels[node.artifactType] : 'Fil', formatBytes(node.size)]
        .filter(Boolean)
        .join(' · ');

  row.append(badge, name, meta);

  return row;
};

const renderSelectionContents = (node: FolderTreeNode, shouldClear = true) => {
  if (shouldClear) {
    clear(selectionContentsTarget);
  }

  if (!selectionContentsTarget) {
    return;
  }

  const title = document.createElement('p');
  title.className = 'selection-contents-title';
  title.textContent = node.relativePath === ROOT_PATH
    ? 'Arbeidsområdeinnhold'
    : isFolderNode(node)
      ? 'Direkte innhold'
      : 'Artefakt';
  selectionContentsTarget.append(title);

  if (!isFolderNode(node)) {
    const summary = document.createElement('p');
    summary.className = 'selection-empty';
    summary.textContent = 'Filen kan inspiseres som metadata i Sidekick. Åpning av filer er ikke del av denne oppgaven.';
    selectionContentsTarget.append(summary);
    return;
  }

  const children = getChildren(node);
  if (children.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent = 'Denne mappen er tom.';
    selectionContentsTarget.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'direct-content-list';
  children.forEach((child) => list.append(createDirectContentRow(child)));
  selectionContentsTarget.append(list);
};

const appendTranscriptionSummary = (scan: WorkspaceScan, node: FolderTreeNode) => {
  if (
    !selectionContentsTarget ||
    !window.sidekick?.readTranscriptionSummary ||
    !isTranscriptionFileNode(node)
  ) {
    return;
  }

  if (!isTranscriptionSummaryStateFor(scan.rootPath, node.relativePath)) {
    transcriptionSummaryState = {
      status: 'loading',
      rootPath: scan.rootPath,
      transcriptionRelativePath: node.relativePath,
    };
    void loadTranscriptionSummary(scan, node);
  }

  const title = document.createElement('p');
  title.className = 'selection-contents-title';
  title.textContent = 'Samtalesammendrag';

  const container = document.createElement('div');
  container.className = 'transcription-summary';
  container.dataset.transcriptionSummary = transcriptionSummaryState.status;

  if (
    transcriptionSummaryState.status === 'loading' ||
    !isTranscriptionSummaryStateFor(scan.rootPath, node.relativePath)
  ) {
    container.textContent = 'Laster sammendrag...';
  } else if (transcriptionSummaryState.status === 'error') {
    container.textContent = transcriptionSummaryState.message;
  } else if (transcriptionSummaryState.status === 'loaded') {
    const { summary } = transcriptionSummaryState;

    if (summary.status === 'complete' || summary.status === 'stale') {
      if (summary.status === 'stale') {
        const warning = document.createElement('p');
        warning.className = 'transcription-summary-warning';
        warning.textContent = summary.message ?? 'Sammendraget kan være utdatert.';
        container.append(warning);
      }

      const summaryText = document.createElement('pre');
      summaryText.className = 'transcription-summary-body';
      summaryText.textContent = summary.conversationSummary ?? 'Sammendraget er tomt.';
      container.append(summaryText);

      if (summary.generatedAt) {
        const meta = document.createElement('p');
        meta.className = 'transcription-summary-meta';
        meta.textContent = `Laget ${formatDate(summary.generatedAt)}`;
        container.append(meta);
      }
    } else {
      container.textContent = summary.message ?? 'Ingen samtalesammendrag er tilgjengelig.';
    }
  }

  selectionContentsTarget.append(title, container);
};

const appendSelectionWarnings = (warnings: string[]) => {
  if (!selectionContentsTarget || warnings.length === 0) {
    return;
  }

  const title = document.createElement('p');
  title.className = 'selection-contents-title';
  title.textContent = 'Varsler';

  const list = document.createElement('ul');
  list.className = 'warning-list';
  list.dataset.selectionWarnings = '';

  warnings.forEach((warning) => {
    const item = document.createElement('li');
    item.textContent = warning;
    list.append(item);
  });

  selectionContentsTarget.append(title, list);
};

const createFolderTagChip = (node: FolderTreeNode, tag: FolderTag) => {
  const chip = document.createElement('span');
  chip.className = 'folder-tag-chip';
  chip.dataset.tagKind = tag.kind;

  const label = document.createElement('span');
  label.textContent = tag.label;

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'folder-tag-remove';
  removeButton.textContent = 'x';
  removeButton.setAttribute('aria-label', `Fjern tag ${tag.label}`);
  removeButton.toggleAttribute('disabled', folderTagSaveState.status === 'saving');
  removeButton.addEventListener('click', () => {
    void saveFolderTag(node, tag.label, 'remove');
  });

  chip.append(label, removeButton);

  return chip;
};

const getTagSuggestions = (scan: WorkspaceScan, node: FolderTreeNode) => {
  const existing = new Set(getVisibleFolderTags(node).map((tag) => tag.normalizedLabel));
  const suggestions = new Map<string, FolderTag>();

  suggestions.set('prosjektmappe', {
    label: 'Prosjektmappe',
    normalizedLabel: 'prosjektmappe',
    kind: 'system',
    source: 'explicit',
    updatedAt: scan.scannedAt,
    systemEffect: 'project-root',
    context: {
      id: 'project-suggestion',
      type: 'project',
      name: 'Prosjektmappe',
    },
  });

  collectWorkspaceTags(scan.tree).forEach((tag) => {
    suggestions.set(tag.normalizedLabel, tag);
  });

  return [...suggestions.values()]
    .filter((tag) => !existing.has(tag.normalizedLabel))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }));
};

const appendFolderTagSaveStatus = (container: HTMLElement, node: FolderTreeNode) => {
  if (folderTagSaveState.status === 'idle' || folderTagSaveState.relativePath !== node.relativePath) {
    return;
  }

  const status = document.createElement('p');
  status.className = 'folder-tag-status';

  if (folderTagSaveState.status === 'saving') {
    status.dataset.status = 'saving';
    status.textContent = 'Lagrer...';
  } else if (folderTagSaveState.status === 'saved') {
    status.dataset.status = 'saved';
    status.textContent = folderTagSaveState.message;
  } else {
    status.dataset.status = 'error';
    status.textContent = folderTagSaveState.message || 'Kunne ikke lagre tagger';
  }

  container.append(status);
};

const appendFolderTagsEditor = (scan: WorkspaceScan, node: FolderTreeNode) => {
  if (!selectionContentsTarget) {
    return;
  }

  const title = document.createElement('p');
  title.className = 'selection-contents-title';
  title.textContent = 'Tagger';

  const container = document.createElement('div');
  container.className = 'folder-tags-editor';

  if (!isFolderNode(node)) {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent = 'Filer kan ikke tagges som mapper i denne versjonen.';
    selectionContentsTarget.append(title, empty);
    return;
  }

  if (node.relativePath === ROOT_PATH) {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent = 'Arbeidsområdet kan ikke tagges i denne versjonen.';
    selectionContentsTarget.append(title, empty);
    return;
  }

  if (
    node.metadata?.status === 'invalid' ||
    node.metadata?.status === 'unsupported' ||
    node.metadata?.status === 'conflict'
  ) {
    const warning = document.createElement('p');
    warning.className = 'folder-tags-warning';
    warning.textContent = node.metadata.message ?? 'Mappemetadata må rettes før tagger kan brukes.';
    container.append(warning);
  }

  const tags = getVisibleFolderTags(node);
  const chips = document.createElement('div');
  chips.className = 'folder-tag-list';
  chips.dataset.folderTags = '';

  if (tags.length > 0) {
    tags.forEach((tag) => chips.append(createFolderTagChip(node, tag)));
  } else {
    const empty = document.createElement('span');
    empty.className = 'folder-tags-empty';
    empty.textContent = 'Ingen tagger';
    chips.append(empty);
  }

  const suggestions = getTagSuggestions(scan, node);
  const datalistId = `folder-tag-suggestions-${node.relativePath.replace(/[^a-z0-9_-]+/gi, '-')}`;
  const inputRow = document.createElement('div');
  inputRow.className = 'folder-tag-input-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'folder-tag-input';
  input.placeholder = 'Legg til tag...';
  input.setAttribute('aria-label', 'Legg til tag');
  input.setAttribute('list', datalistId);
  input.toggleAttribute(
    'disabled',
    folderTagSaveState.status === 'saving' || !window.sidekick?.addFolderTag,
  );

  const datalist = document.createElement('datalist');
  datalist.id = datalistId;
  suggestions.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag.label;
    datalist.append(option);
  });

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'btn btn-secondary btn-sm';
  addButton.textContent = 'Legg til';
  addButton.toggleAttribute(
    'disabled',
    folderTagSaveState.status === 'saving' || !window.sidekick?.addFolderTag,
  );

  const addInputTag = () => {
    const label = input.value.trim().replace(/\s+/g, ' ');
    if (!label) {
      return;
    }
    input.value = '';
    void saveFolderTag(node, label, 'add');
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addInputTag();
    }
  });
  input.addEventListener('change', () => {
    if (suggestions.some((tag) => tag.label === input.value)) {
      addInputTag();
    }
  });
  addButton.addEventListener('click', addInputTag);

  inputRow.append(input, addButton, datalist);

  const note = document.createElement('p');
  note.className = 'folder-tags-note';
  note.textContent = 'Lagres som skjult Sidekick-metadata i mappen - ikke i dokumentene dine';

  container.append(chips, inputRow, note);
  appendFolderTagSaveStatus(container, node);
  selectionContentsTarget.append(title, container);
};

const workspaceInfoStatusText = (scan: WorkspaceScan) => {
  if (!workspaceInfoState || workspaceInfoState.rootPath !== scan.rootPath) {
    return 'Sjekker';
  }

  if (workspaceInfoState.message) {
    return 'Feilet';
  }

  switch (workspaceInfoState.snapshot.status) {
    case 'complete':
      return workspaceInfoState.snapshot.generatedAt
        ? `Oppdatert ${formatDate(workspaceInfoState.snapshot.generatedAt)}`
        : 'Tilgjengelig';
    case 'invalid':
      return 'Ugyldig';
    case 'missing':
      return 'Mangler';
  }
};

const appendWorkspaceSummary = (scan: WorkspaceScan) => {
  if (!selectionContentsTarget || !workspaceInfoState || workspaceInfoState.rootPath !== scan.rootPath) {
    return;
  }

  const { snapshot, message } = workspaceInfoState;
  const title = document.createElement('h3');
  title.className = 'selection-contents-title';
  title.textContent = 'Arbeidsområdesammendrag';

  if (snapshot.status !== 'complete') {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent =
      message ??
      (snapshot.status === 'invalid'
        ? snapshot.message ?? 'Arbeidsområdesammendraget kan ikke leses.'
        : 'Ingen arbeidsområdesammendrag er generert ennå.');
    selectionContentsTarget.append(title, empty);
    return;
  }

  const summary = document.createElement('p');
  summary.className = 'selection-summary';
  summary.textContent = snapshot.workspaceSummary ?? '';

  const details = document.createElement('dl');
  details.className = 'detail-list selection-summary-details';
  const rows: DetailRow[] = [
    ['Oppdatert', snapshot.generatedAt ? formatDate(snapshot.generatedAt) : 'Ukjent'],
    ['Kilde', snapshot.contextPackagePath ?? 'Ukjent'],
  ];
  details.append(...rows.map(createDetailRow));

  const fragments: HTMLElement[] = [title, summary, details];

  if (snapshot.participants) {
    const participants = document.createElement('p');
    participants.className = 'selection-summary-meta';
    participants.textContent = `Deltakere: ${snapshot.participants.replace(/\n+/g, ' ')}`;
    fragments.push(participants);
  }

  if (snapshot.themes && snapshot.themes.length > 0) {
    const themeList = document.createElement('ul');
    themeList.className = 'plain-list selection-summary-list';
    themeList.append(...snapshot.themes.map(createListItem));
    fragments.push(themeList);
  }

  if (snapshot.openQuestions && snapshot.openQuestions.length > 0) {
    const questionsTitle = document.createElement('h3');
    questionsTitle.className = 'selection-contents-title';
    questionsTitle.textContent = 'Åpne spørsmål';
    const questionList = document.createElement('ul');
    questionList.className = 'plain-list selection-summary-list';
    questionList.append(...snapshot.openQuestions.map(createListItem));
    fragments.push(questionsTitle, questionList);
  }

  if (message) {
    const warning = document.createElement('p');
    warning.className = 'selection-empty';
    warning.textContent = message;
    fragments.push(warning);
  }

  selectionContentsTarget.append(...fragments);
};

const getCurrentDocumentRelationshipsSnapshot = (scan: WorkspaceScan) => {
  if (documentRelationshipsState.status === 'ready' && documentRelationshipsState.rootPath === scan.rootPath) {
    return documentRelationshipsState.snapshot;
  }

  if (
    documentRelationshipsState.status === 'complete' &&
    documentRelationshipsState.rootPath === scan.rootPath
  ) {
    return documentRelationshipsState.result.report;
  }

  if (
    documentRelationshipsState.status === 'failed' &&
    documentRelationshipsState.rootPath === scan.rootPath
  ) {
    return documentRelationshipsState.previousReport;
  }

  if (
    documentRelationshipsState.status === 'generating' &&
    documentRelationshipsState.rootPath === scan.rootPath
  ) {
    return documentRelationshipsState.previousReport;
  }

  return undefined;
};

const documentRelationshipsStatusText = (scan: WorkspaceScan) => {
  if (documentRelationshipsState.status === 'unavailable') {
    return 'Ikke tilgjengelig';
  }

  if (
    'rootPath' in documentRelationshipsState &&
    documentRelationshipsState.rootPath !== scan.rootPath
  ) {
    return 'Sjekker';
  }

  switch (documentRelationshipsState.status) {
    case 'checking':
      return 'Sjekker';
    case 'generating':
      return 'Oppdaterer';
    case 'complete':
      return documentRelationshipsState.result.report?.generatedAt
        ? `Oppdatert ${formatDate(documentRelationshipsState.result.report.generatedAt)}`
        : 'Oppdatert';
    case 'failed':
      return documentRelationshipsState.previousReport ? 'Feilet, tidligere rapport finnes' : 'Feilet';
    case 'ready':
      switch (documentRelationshipsState.snapshot.status) {
        case 'complete':
          return documentRelationshipsState.snapshot.generatedAt
            ? `Oppdatert ${formatDate(documentRelationshipsState.snapshot.generatedAt)}`
            : 'Tilgjengelig';
        case 'invalid':
          return 'Ugyldig';
        case 'missing':
          return 'Mangler';
      }
      break;
  }

  return 'Sjekker';
};

const appendDocumentRelationshipsSummary = (scan: WorkspaceScan) => {
  if (!selectionContentsTarget) {
    return;
  }

  const snapshot = getCurrentDocumentRelationshipsSnapshot(scan);
  const title = document.createElement('h3');
  title.className = 'selection-contents-title';
  title.textContent = 'Sammenhenger';

  if (!snapshot || snapshot.status !== 'complete') {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent =
      snapshot?.status === 'invalid'
        ? snapshot.message ?? 'Rapporten for sammenhenger kan ikke leses.'
        : 'Ingen rapport for sammenhenger er generert ennå.';
    selectionContentsTarget.append(title, empty);
    return;
  }

  const summary = document.createElement('p');
  summary.className = 'selection-summary';
  summary.textContent = snapshot.overview ?? 'Rapporten er tilgjengelig.';

  const details = document.createElement('dl');
  details.className = 'detail-list selection-summary-details';
  details.append(
    ...([
      ['Oppdatert', snapshot.generatedAt ? formatDate(snapshot.generatedAt) : 'Ukjent'],
      ['Kilde', snapshot.contextPackagePath ?? 'Ukjent'],
    ] satisfies DetailRow[]).map(createDetailRow),
  );

  const button = document.createElement('button');
  button.className = 'btn btn-secondary btn-sm selection-action-button';
  button.type = 'button';
  button.textContent = 'Vis rapport';
  button.toggleAttribute('disabled', isExclusiveWorkflowActive());
  button.addEventListener('click', () => {
    openWorkflow('document-relationships');
  });

  selectionContentsTarget.append(title, summary, details, button);
};

const clearSelectionActions = () => {
  selectionActionsTarget?.replaceChildren();
};

const renderSelectionActions = (scan: WorkspaceScan, node: FolderTreeNode) => {
  const target = selectionActionsTarget ?? selectionContentsTarget;

  if (!target) {
    return;
  }

  if (target === selectionActionsTarget) {
    target.replaceChildren();
  }

  if (!isFolderNode(node) || node.relativePath === ROOT_PATH) {
    return;
  }

  const actionTitle = document.createElement('p');
  actionTitle.className = 'selection-contents-title';
  actionTitle.textContent = 'Handlinger';

  const contextPackageButton = document.createElement('button');
  contextPackageButton.className = 'btn btn-secondary btn-sm selection-action-button';
  contextPackageButton.type = 'button';
  contextPackageButton.textContent = 'Generer kontekstpakke for denne mappen';
  contextPackageButton.toggleAttribute('disabled', isExclusiveWorkflowActive());
  contextPackageButton.addEventListener('click', () => {
    openFolderContextPackageWorkflow(node.relativePath);
  });

  const buttons = [contextPackageButton];

  if (isSingleDetectedTranscriptionFolder(scan, node)) {
    const summaryButton = document.createElement('button');
    summaryButton.className = 'btn btn-secondary btn-sm selection-action-button';
    summaryButton.type = 'button';
    summaryButton.textContent = 'Generer manglende sammendrag';
    summaryButton.toggleAttribute(
      'disabled',
      isExclusiveWorkflowActive() || !window.sidekick?.previewTranscriptionSummaryBatch,
    );
    summaryButton.addEventListener('click', () => {
      openWorkflow('transcription-summary-batch');
    });
    buttons.push(summaryButton);
  }

  target.append(actionTitle, ...buttons);
};

const renderSelectedTreeContext = (scan?: WorkspaceScan) => {
  if (!scan) {
    selectionPanelTarget?.toggleAttribute('hidden', true);
    clearSelectionActions();
    return;
  }

  ensureVisibleTreeSelection(scan);
  selectionPanelTarget?.toggleAttribute('hidden', false);

  const node = getNodeByPath(scan.tree, selectedTreePath) ?? scan.tree;
  const contextViewRow = getSelectedContextViewRow(scan, node.relativePath);
  const warnings = getNodeWarnings(scan, node);
  const childFolders = getChildren(node).filter(isFolderNode).length;
  const childFiles = getChildren(node).length - childFolders;
  clear(selectionContentsTarget);

  if (node.relativePath === ROOT_PATH) {
    setText(selectionLabelTarget, 'Arbeidsområde');
    setText(selectionTitleTarget, scan.rootName);
    renderSelectionBreadcrumb(scan, node);
    renderDetails(selectionDetailsTarget, [
      ['Arbeidsområde', scan.rootPath],
      ['Visning', activeContextView === 'projects' ? 'Prosjekter' : 'Mapper'],
      ['Filer', scan.summary.fileCount.toString()],
      ['Mapper', scan.summary.folderCount.toString()],
      ['Skannet', formatDate(scan.scannedAt)],
      ['Status', scan.status === 'partial' ? 'Delvis' : 'Fullført'],
      ['Kontekstpakke', contextPackageStatusText(scan)],
      ['Arbeidsområdesammendrag', workspaceInfoStatusText(scan)],
      ['Sammenhenger', documentRelationshipsStatusText(scan)],
      ['Varsler', overviewWarningCount(scan) > 0 ? overviewWarningCount(scan).toString() : 'Ingen'],
      ['Markdown/tekst', scan.summary.artifactTypeCounts['markdown-text'].toString()],
      ['Transkripsjoner', scan.summary.artifactTypeCounts.transcript.toString()],
    ]);
    clearSelectionActions();
    appendFolderTagsEditor(scan, node);
    renderSelectionContents(node, false);
    appendWorkspaceSummary(scan);
    appendDocumentRelationshipsSummary(scan);
    appendSelectionWarnings(overviewWarnings(scan));
    return;
  }

  setText(selectionLabelTarget, isFolderNode(node) ? 'Mappe' : 'Fil');
  setText(selectionTitleTarget, node.relativePath === ROOT_PATH ? scan.rootName : node.name);
  renderSelectionBreadcrumb(scan, node);

  if (isFolderNode(node)) {
    const details: DetailRow[] = [
      ['Relativ sti', node.relativePath],
      ['Direkte innhold', `${childFolders} mapper / ${childFiles} filer`],
      ['Filer totalt', countFilesInNode(node).toString()],
      ['Signal', getFolderSignalLabel(node)],
      ['Sist endret', formatDate(node.modifiedAt) || 'Ukjent'],
      ['Varsler', warnings.length > 0 ? warnings.length.toString() : 'Ingen'],
    ];

    if (activeContextView === 'projects' && contextViewRow) {
      details.splice(1, 0, ['Fysisk plassering', contextViewRow.artifactRelativePath]);
      if (contextViewRow.contextLabel) {
        details.splice(2, 0, ['Prosjekt', contextViewRow.contextLabel]);
      }
      details.push(['Vises her fordi', projectViewReasonLabel(contextViewRow.viewReason)]);
    }

    renderDetails(selectionDetailsTarget, details);
  } else {
    const details: DetailRow[] = [
      ['Relativ sti', node.relativePath],
      ['Type', node.artifactType ? artifactLabels[node.artifactType] : 'Fil'],
      ['Størrelse', formatBytes(node.size) || 'Ukjent'],
      ['Sist endret', formatDate(node.modifiedAt) || 'Ukjent'],
      ['Varsler', warnings.length > 0 ? warnings.length.toString() : 'Ingen'],
    ];

    if (activeContextView === 'projects' && contextViewRow) {
      details.splice(1, 0, ['Fysisk plassering', contextViewRow.artifactRelativePath]);
      if (contextViewRow.contextLabel) {
        details.splice(2, 0, ['Prosjekt', contextViewRow.contextLabel]);
      }
      details.push(['Vises her fordi', projectViewReasonLabel(contextViewRow.viewReason)]);
    }

    renderDetails(selectionDetailsTarget, details);
  }

  appendFolderTagsEditor(scan, node);
  renderSelectionContents(node, false);
  appendTranscriptionSummary(scan, node);
  renderSelectionActions(scan, node);
  appendSelectionWarnings(
    warnings.map((warning) =>
      warning.path === ROOT_PATH ? warning.message : `${warning.path}: ${warning.message}`,
    ),
  );
};

const normalizeDisplayPath = (pathValue: string) => pathValue.replace(/[\\/]+$/, '');

const getWorkspaceNameValidationMessage = (workspaceName: string) => {
  const trimmedName = workspaceName.trim();

  if (!trimmedName) {
    return 'Arbeidsområdenavn er påkrevd.';
  }

  if (
    trimmedName === '.' ||
    trimmedName === '..' ||
    trimmedName.includes('/') ||
    trimmedName.includes('\\') ||
    trimmedName.includes('\0') ||
    /^[a-zA-Z]:/.test(trimmedName)
  ) {
    return 'Arbeidsområdenavnet må være et mappenavn, ikke en sti.';
  }

  return '';
};

const getWorkspaceTargetPath = (parentPath: string, workspaceName: string) =>
  `${normalizeDisplayPath(parentPath)}/${workspaceName.trim()}`;

const renderWorkspaceCreation = () => {
  const workspaceName = workspaceNameInput?.value ?? '';
  const validationMessage = getWorkspaceNameValidationMessage(workspaceName);
  const isDialogOpen = workspaceCreationState.status !== 'closed';
  const isSelectingParent = workspaceCreationState.status === 'selecting-parent';
  const isCreating = workspaceCreationState.status === 'creating';
  const hasValidRequest = !validationMessage && Boolean(workspaceCreationState.parentPath);
  const shouldShowValidationMessage =
    isDialogOpen && Boolean(validationMessage) && workspaceNameTouched;

  workspaceCreateDialogTarget?.toggleAttribute('hidden', !isDialogOpen);
  workspaceNameInput?.toggleAttribute('disabled', isCreating || !window.sidekick);
  chooseWorkspaceParentButton?.toggleAttribute('disabled', isCreating || isSelectingParent || !window.sidekick);
  createWorkspaceButton?.toggleAttribute('disabled', isCreating || !hasValidRequest || !window.sidekick);
  workspaceCreateCancelButtons.forEach((button) => {
    button.toggleAttribute('disabled', isCreating);
  });

  if (createWorkspaceMessageTarget) {
    if (workspaceCreationState.status === 'closed' || workspaceCreationState.status === 'editing') {
      createWorkspaceMessageTarget.removeAttribute('data-status');
    } else {
      createWorkspaceMessageTarget.dataset.status = workspaceCreationState.status;
    }
  }

  setText(createWorkspaceMessageTarget, workspaceCreationState.message);
  setText(workspaceNameMessageTarget, shouldShowValidationMessage ? validationMessage : '');
  setText(workspaceParentPathTarget, workspaceCreationState.parentPath ?? 'Ingen plassering valgt.');

  if (workspaceTargetPreviewTarget) {
    const targetText =
      workspaceCreationState.parentPath && !validationMessage
        ? getWorkspaceTargetPath(workspaceCreationState.parentPath, workspaceName)
        : 'Velg arbeidsområdenavn og plassering for å se hva som opprettes.';

    if (workspaceCreationState.parentPath && !validationMessage) {
      const target = document.createElement('strong');
      const assumptions = document.createElement('span');
      const notes = document.createElement('span');
      const transcriptions = document.createElement('span');
      target.textContent = targetText;
      assumptions.textContent = '00. Forutsetninger';
      notes.textContent = '01. Notater';
      transcriptions.textContent = '02. Transkripsjoner';
      workspaceTargetPreviewTarget.replaceChildren(target, assumptions, notes, transcriptions);
    } else {
      workspaceTargetPreviewTarget.textContent = targetText;
    }
  }

  if (createWorkspaceButton) {
    createWorkspaceButton.textContent = isCreating ? 'Oppretter...' : 'Opprett arbeidsområde';
  }

  if (chooseWorkspaceParentButton) {
    chooseWorkspaceParentButton.textContent = isSelectingParent ? 'Velger...' : 'Velg...';
  }
};

const renderWorkspaceInitialization = () => {
  const isChoosing = workspaceInitializationState.status === 'choosing';
  const isPreview =
    workspaceInitializationState.status === 'preview' ||
    workspaceInitializationState.status === 'initializing' ||
    workspaceInitializationState.status === 'error';
  const isInitializing = workspaceInitializationState.status === 'initializing';
  const preview =
    workspaceInitializationState.status === 'preview' ||
    workspaceInitializationState.status === 'initializing' ||
    workspaceInitializationState.status === 'error'
      ? workspaceInitializationState.preview
      : undefined;
  const missingFolders =
    preview?.requiredFolders.filter((folder) => folder.status === 'missing') ?? [];

  initializeWorkspaceButton?.toggleAttribute('disabled', isChoosing || isInitializing || !window.sidekick);
  workspaceInitializationPanelTarget?.toggleAttribute(
    'hidden',
    workspaceInitializationState.status === 'idle',
  );
  workspaceInitializationConfirmButton?.toggleAttribute('hidden', !isPreview || !preview);
  workspaceInitializationCancelButton?.toggleAttribute('hidden', !isPreview && !isChoosing);
  workspaceInitializationConfirmButton?.toggleAttribute('disabled', isInitializing || !preview);
  workspaceInitializationCancelButton?.toggleAttribute('disabled', isInitializing);

  if (initializeWorkspaceButton) {
    initializeWorkspaceButton.textContent = isChoosing ? 'Velger...' : 'Initialiser eksisterende arbeidsområde...';
  }

  if (workspaceInitializationConfirmButton) {
    workspaceInitializationConfirmButton.textContent = isInitializing
      ? 'Initialiserer...'
      : missingFolders.length > 0
        ? 'Opprett manglende mapper'
        : 'Bruk som arbeidsområde';
  }

  setText(workspaceInitializationTitleTarget, 'Initialiser eksisterende arbeidsområde');
  setText(workspaceInitializationMessageTarget, workspaceInitializationState.message);

  if (!preview) {
    renderDetails(workspaceInitializationDetailsTarget, []);
    renderList(workspaceInitializationWarningsTarget, []);
    return;
  }

  renderDetails(workspaceInitializationDetailsTarget, [
    ['Mappe', preview.rootPath],
    ['Eksisterende innhold', preview.existingEntryCount.toString()],
    [
      'Mapper som finnes',
      preview.requiredFolders
        .filter((folder) => folder.status === 'existing')
        .map((folder) => folder.name)
        .join(', ') || 'Ingen',
    ],
    ['Mapper som opprettes', missingFolders.map((folder) => folder.name).join(', ') || 'Ingen'],
  ]);
  renderList(
    workspaceInitializationWarningsTarget,
    preview.warnings.map((warning) => `${warning.path}: ${warning.message}`),
  );
};

const renderContextPackageDetails = (rows: DetailRow[]) =>
  renderDetails(contextPackageDetailsTarget, rows);

const renderContextPackageList = (items: string[]) => renderList(contextPackageListTarget, items);

const renderContextPackageStateElements = (...elements: HTMLElement[]) => {
  contextPackageStateTarget?.replaceChildren(...elements);
};

const renderTranscriptionImportDetails = (rows: DetailRow[]) =>
  renderDetails(transcriptionImportDetailsTarget, rows);

const renderTranscriptionImportList = (items: string[]) =>
  renderList(transcriptionImportListTarget, items);

const renderTranscriptionImportStateElements = (...elements: HTMLElement[]) => {
  transcriptionImportStateTarget?.replaceChildren(...elements);
};

const renderTranscriptionSummaryBatchDetails = (rows: DetailRow[]) =>
  renderDetails(transcriptionSummaryBatchDetailsTarget, rows);

const renderTranscriptionSummaryBatchList = (items: string[]) =>
  renderList(transcriptionSummaryBatchListTarget, items);

const renderTranscriptionSummaryBatchStateElements = (...elements: HTMLElement[]) => {
  transcriptionSummaryBatchStateTarget?.replaceChildren(...elements);
};

const createOperationSteps = (labels: string[], activeStep: number) => {
  const steps = document.createElement('ol');
  steps.className = 'operation-steps';

  // Use a real ordered list and aria-current so write workflows expose progress
  // to assistive technologies without custom widget behavior.
  labels.forEach((label, index) => {
    const stepNumber = index + 1;
    const step = document.createElement('li');
    step.className = 'operation-step';

    if (stepNumber < activeStep) {
      step.classList.add('operation-step--done');
    }

    if (stepNumber === activeStep) {
      step.classList.add('operation-step--active');
      step.setAttribute('aria-current', 'step');
    }

    step.textContent = label;
    steps.append(step);
  });

  return steps;
};

const createImportSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Velg fil', 'Bekreft', 'Ferdig'], activeStep);

const createTranscriptionSummaryBatchSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Forhåndsvis', 'Generer', 'Ferdig'], activeStep);

const createContextPackageSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Forhåndsvis', 'Bekreft', 'Ferdig'], activeStep);

const createDocumentRelationshipsSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Kontekstpakke', 'Analyse', 'Rapport'], activeStep);

const createWriteOperationBadge = () => {
  const badge = document.createElement('span');
  badge.className = 'write-operation-badge';
  badge.textContent = 'Skriveoperasjon';

  return badge;
};

const createWriteWarning = (message: string) => {
  const warning = document.createElement('div');
  warning.className = 'write-warning';
  warning.setAttribute('role', 'note');
  warning.textContent = message;

  return warning;
};

const createResultBanner = (
  variant: 'success' | 'warning' | 'error',
  title: string,
  message: string,
) => {
  const banner = document.createElement('div');
  banner.className = `result-banner result-banner--${variant}`;
  banner.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  banner.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
  const heading = document.createElement('strong');
  const body = document.createElement('span');
  heading.textContent = title;
  body.textContent = message;
  banner.replaceChildren(heading, body);

  return banner;
};

const renderContextPackageActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
  if (contextPackageSecondaryButton) {
    contextPackageSecondaryButton.textContent = 'Tilbake';
  }

  renderActions(
    {
      primaryButton: contextPackagePrimaryButton,
      secondaryButton: contextPackageSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
  );
};

const renderTranscriptionImportActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
  if (transcriptionImportSecondaryButton) {
    transcriptionImportSecondaryButton.textContent = 'Tilbake';
  }

  renderActions(
    {
      primaryButton: transcriptionImportPrimaryButton,
      secondaryButton: transcriptionImportSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
  );
};

const renderTranscriptionSummaryBatchActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
  if (transcriptionSummaryBatchSecondaryButton) {
    transcriptionSummaryBatchSecondaryButton.textContent = 'Tilbake';
  }

  renderActions(
    {
      primaryButton: transcriptionSummaryBatchPrimaryButton,
      secondaryButton: transcriptionSummaryBatchSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
  );
};

const renderContextPackageUnavailable = () => {
  setText(contextPackageTitleTarget, 'Ingen arbeidsområde valgt');
  setText(
    contextPackageMessageTarget,
    window.sidekick
      ? 'Velg et arbeidsområde før du lager kontekstpakke.'
      : 'Åpne appen i Electron for å lage kontekstpakker.',
  );
  renderContextPackageStateElements();
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Forhåndsvis', true);
};

const renderContextPackageReady = (scan: WorkspaceScan) => {
  const folderNode =
    contextPackageTarget.scope === 'folder'
      ? getNodeByPath(scan.tree, contextPackageTarget.folderRelativePath)
      : undefined;

  setText(
    contextPackageTitleTarget,
    contextPackageTarget.scope === 'folder'
      ? 'Lag kontekstpakke for mappe'
      : 'Lag kontekstpakke',
  );
  setText(
    contextPackageMessageTarget,
    contextPackageTarget.scope === 'folder'
      ? 'Forbered én Markdown-fil som samler innholdet i den valgte mappen.'
      : 'Forbered én Markdown-fil som samler arbeidsområdematerialet for bruk utenfor Sidekick.',
  );
  renderContextPackageStateElements(createContextPackageSteps(1));
  renderContextPackageDetails([
    ['Arbeidsområde', scan.rootName],
    [
      'Omfang',
      contextPackageTarget.scope === 'folder'
        ? `Valgt mappe: ${folderNode?.relativePath ?? contextPackageTarget.folderRelativePath}`
        : 'Hele valgt arbeidsområde',
    ],
    ['Format', 'Markdown'],
    ['Plassering', contextPackageTarget.scope === 'folder' ? 'Valgt mappe' : 'Arbeidsområderoten'],
  ]);
  renderContextPackageList([]);
  renderContextPackageActions('Forhåndsvis', false, true);
};

const renderContextPackagePreviewing = () => {
  setText(contextPackageTitleTarget, 'Forbereder kontekstpakke');
  setText(contextPackageMessageTarget, 'Sjekker filnavn, plassering og om en pakke finnes fra før.');
  renderContextPackageStateElements(createContextPackageSteps(1));
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Forbereder...', true);
};

const renderContextPackageConfirming = (preview: ContextPackagePreview) => {
  setText(contextPackageTitleTarget, 'Bekreft kontekstpakke');
  setText(contextPackageMessageTarget, 'Kontroller plassering og overskriving før Sidekick skriver filen.');
  renderContextPackageStateElements(
    createContextPackageSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(
      preview.willOverwrite
        ? `Sidekick erstatter eksisterende ${preview.outputFileName} i ${preview.scope === 'folder' ? 'valgt mappe' : 'arbeidsområderoten'}.`
        : `Sidekick skriver én Markdown-fil til ${preview.scope === 'folder' ? 'valgt mappe' : 'arbeidsområderoten'}: ${preview.outputFileName}.`,
    ),
  );
  renderContextPackageDetails([
    ['Filnavn', preview.outputFileName],
    ['Omfang', preview.scope === 'folder' ? preview.targetRelativePath : 'Hele arbeidsområdeet'],
    ['Plassering', preview.scope === 'folder' ? 'Valgt mappe' : 'Arbeidsområderoten'],
    ['Overskriver', preview.willOverwrite ? 'Ja' : 'Nei'],
    ['Filsti', preview.outputPath],
  ]);
  renderContextPackageList([preview.binaryFileWarning, preview.selfIgnoreWarning]);
  renderContextPackageActions('Generer pakke', false, true);
};

const renderContextPackageGenerating = (preview: ContextPackagePreview) => {
  setText(contextPackageTitleTarget, 'Genererer kontekstpakke');
  setText(
    contextPackageMessageTarget,
    preview.scope === 'folder'
      ? 'Sidekick skriver kontekstpakken til den valgte mappen.'
      : 'Sidekick skriver kontekstpakken til arbeidsområdet.',
  );
  renderContextPackageStateElements(
    createContextPackageSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(`Sidekick skriver ${preview.outputFileName}.`),
  );
  renderContextPackageDetails([
    ['Filnavn', preview.outputFileName],
    ['Omfang', preview.scope === 'folder' ? preview.targetRelativePath : 'Hele arbeidsområdeet'],
    ['Filsti', preview.outputPath],
  ]);
  renderContextPackageList([]);
  renderContextPackageActions('Genererer...', true);
};

const renderContextPackageComplete = (result: ContextPackageResult) => {
  const skippedPreview = result.skippedFiles
    .slice(0, 5)
    .map((file) => `${file.path}: ${file.reason}`);
  const warningPreview = result.warnings.map((warning) =>
    warning.path ? `${warning.path}: ${warning.message}` : warning.message,
  );
  const summaryStatus =
    result.scope === 'workspace' && result.workspaceSummary
      ? result.workspaceSummary.status === 'complete'
        ? 'Arbeidsområdesammendrag oppdatert'
        : `Arbeidsområdesammendrag feilet: ${result.workspaceSummary.message ?? 'Ukjent feil'}`
      : null;

  setText(contextPackageTitleTarget, 'Kontekstpakke generert');
  setText(
    contextPackageMessageTarget,
    result.overwritten ? 'Eksisterende kontekstpakke ble erstattet.' : 'Ny kontekstpakke ble opprettet.',
  );
  renderContextPackageStateElements(
    createContextPackageSteps(3),
    createResultBanner(
      'success',
      'Kontekstpakken er klar',
      result.overwritten
        ? `Filen ble skrevet over i ${result.scope === 'folder' ? 'valgt mappe' : 'arbeidsområderoten'}.`
        : `Filen ble skrevet til ${result.scope === 'folder' ? 'valgt mappe' : 'arbeidsområderoten'}.`,
    ),
  );
  renderContextPackageDetails([
    ['Filnavn', result.outputFileName],
    ['Omfang', result.scope === 'folder' ? result.targetRelativePath : 'Hele arbeidsområdeet'],
    ['Filsti', result.outputPath],
    ['Overskrevet', result.overwritten ? 'Ja' : 'Nei'],
    ['Inkludert', result.totalFiles.toString()],
    ['Hoppet over', result.skippedFiles.length.toString()],
    ['Tokens', result.totalTokens.toString()],
    ['Tegn', result.totalCharacters.toString()],
    ['Størrelse', formatBytes(result.outputBytes)],
    ...(summaryStatus ? ([['Arbeidsområdesammendrag', summaryStatus]] satisfies DetailRow[]) : []),
  ]);
  renderContextPackageList([
    ...warningPreview,
    ...skippedPreview,
    ...(result.skippedFiles.length > skippedPreview.length
      ? [`${result.skippedFiles.length - skippedPreview.length} flere filer ble hoppet over`]
      : []),
  ]);
  renderContextPackageActions('Lag ny', false, true);
};

const renderContextPackageError = (
  message: string,
  phase: Extract<ContextPackageState, { status: 'error' }>['phase'],
) => {
  setText(
    contextPackageTitleTarget,
    phase === 'preview' ? 'Kontekstpakke kan ikke forberedes' : 'Generering feilet',
  );
  setText(contextPackageMessageTarget, message);
  renderContextPackageStateElements(
    createContextPackageSteps(phase === 'preview' ? 1 : 2),
    createResultBanner(
      'error',
      phase === 'preview' ? 'Ingen fil ble skrevet' : 'Kontekstpakken ble ikke fullført',
      phase === 'preview'
        ? 'Rett problemet og prøv forhåndsvisning på nytt.'
        : 'Kontroller arbeidsområdet før du prøver igjen.',
    ),
  );
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Prøv igjen', false, true);
};

const renderContextPackage = (scan?: WorkspaceScan) => {
  if (!scan || !window.sidekick || contextPackageState.status === 'unavailable') {
    renderContextPackageUnavailable();
    return;
  }

  switch (contextPackageState.status) {
    case 'ready':
      renderContextPackageReady(scan);
      break;
    case 'previewing':
      renderContextPackagePreviewing();
      break;
    case 'confirming':
      renderContextPackageConfirming(contextPackageState.preview);
      break;
    case 'generating':
      renderContextPackageGenerating(contextPackageState.preview);
      break;
    case 'complete':
      renderContextPackageComplete(contextPackageState.result);
      break;
    case 'error':
      renderContextPackageError(contextPackageState.message, contextPackageState.phase);
      break;
  }
};

const renderTranscriptionImportUnavailable = () => {
  setText(transcriptionImportTitleTarget, 'Ingen arbeidsområde valgt');
  setText(
    transcriptionImportMessageTarget,
    window.sidekick
      ? 'Velg et arbeidsområde før du importerer transkripsjoner.'
      : 'Åpne appen i Electron for å importere transkripsjoner.',
  );
  renderTranscriptionImportStateElements();
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Velg fil...', true);
};

const renderTranscriptionImportReady = (scan: WorkspaceScan) => {
  setText(transcriptionImportTitleTarget, 'Importer transkripsjon');
  setText(
    transcriptionImportMessageTarget,
    'Velg en tekst- eller Markdown-fil som skal kopieres inn i arbeidsområdeets transkripsjonsmappe.',
  );
  renderTranscriptionImportStateElements(createImportSteps(1));
  renderTranscriptionImportDetails([
    ['Tillatte filer', '.txt, .md, .markdown'],
    ['Målmappe', getTranscriptionFolderLabel(scan)],
    ['Handling', 'Kopierer filen. Originalen blir liggende der den er.'],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Velg fil...', false, true);
};

const renderTranscriptionImportPreviewing = () => {
  setText(transcriptionImportTitleTarget, 'Velger fil');
  setText(transcriptionImportMessageTarget, 'Venter på at du velger en transkripsjonsfil.');
  renderTranscriptionImportStateElements(createImportSteps(1));
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Velger...', true);
};

const formatNumberingPreview = (preview: TranscriptionImportPreview) =>
  `${preview.numbering.nextNumber.toString().padStart(preview.numbering.width, '0')}${
    preview.numbering.separator
  } (${preview.numbering.inferredFromExistingFiles ? 'funnet fra eksisterende filer' : 'ny sekvens'})`;

const renderTranscriptionImportConfirming = (preview: TranscriptionImportPreview) => {
  setText(transcriptionImportTitleTarget, 'Bekreft import');
  setText(transcriptionImportMessageTarget, 'Kontroller plassering og filnavn før Sidekick kopierer filen.');
  renderTranscriptionImportStateElements(
    createImportSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(
      `Sidekick kopierer én fil til ${preview.targetFolderRelativePath}. Ingen andre filer endres.`,
    ),
  );
  renderTranscriptionImportDetails([
    ['Kildefil', preview.sourceFileName],
    ['Kildesti', preview.sourcePath],
    ['Transkripsjonsmappe', preview.targetFolderRelativePath],
    ['Nytt filnavn', preview.destinationFileName],
    ['Nummerering', formatNumberingPreview(preview)],
    ['Destinasjonssti', preview.destinationPath],
    ['Handling', 'Kopier, ikke flytt'],
  ]);
  renderTranscriptionImportList(
    preview.warnings.map((warning) =>
      warning.path ? `${warning.path}: ${warning.message}` : warning.message,
    ),
  );
  renderTranscriptionImportActions('Importer fil', false, true);
};

const renderTranscriptionImportImporting = (preview: TranscriptionImportPreview) => {
  setText(transcriptionImportTitleTarget, 'Importerer fil');
  setText(transcriptionImportMessageTarget, 'Kopierer transkripsjonen inn i arbeidsområdeet.');
  renderTranscriptionImportStateElements(
    createImportSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(`Sidekick skriver ${preview.destinationFileName} til arbeidsområdet.`),
  );
  renderTranscriptionImportDetails([
    ['Nytt filnavn', preview.destinationFileName],
    ['Destinasjonssti', preview.destinationPath],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Importerer...', true);
};

const renderTranscriptionImportComplete = (result: TranscriptionImportResult) => {
  const summaryText =
    result.summary.status === 'complete'
      ? 'Samtalesammendrag laget'
      : 'Import fullført, men sammendrag mangler';

  setText(transcriptionImportTitleTarget, 'Transkripsjon importert');
  setText(
    transcriptionImportMessageTarget,
    'Arbeidsområdet er skannet på nytt med den importerte filen.',
  );
  renderTranscriptionImportStateElements(
    createImportSteps(3),
    createResultBanner(
      'success',
      'Filen er lagt til',
      result.summary.status === 'complete'
        ? 'Originalfilen er uendret, og Sidekick har laget et samtalesammendrag.'
        : 'Originalfilen er uendret på kildestedet.',
    ),
  );
  renderTranscriptionImportDetails([
    ['Importert fil', result.destinationFileName],
    ['Kilde', result.sourceFileName],
    ['Størrelse', formatBytes(result.copiedBytes)],
    ['Nummer', result.finalNumber.toString().padStart(2, '0')],
    ['Sammendrag', summaryText],
    ['Destinasjonssti', result.destinationPath],
    ['Original', 'Uendret'],
  ]);
  renderTranscriptionImportList(
    result.summary.status === 'failed' ? [result.summary.message] : [],
  );
  renderTranscriptionImportActions('Importer ny', false, true);
};

const renderTranscriptionImportError = (message: string) => {
  setText(transcriptionImportTitleTarget, 'Importen kan ikke fullføres');
  setText(transcriptionImportMessageTarget, message);
  renderTranscriptionImportStateElements(
    createImportSteps(1),
    createResultBanner('error', 'Ingen filer ble endret', 'Prøv igjen med en gyldig transkripsjonsfil.'),
  );
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Prøv igjen', false, true);
};

const renderTranscriptionImport = (scan?: WorkspaceScan) => {
  if (!scan || !window.sidekick || transcriptionImportState.status === 'unavailable') {
    renderTranscriptionImportUnavailable();
    return;
  }

  switch (transcriptionImportState.status) {
    case 'ready':
      renderTranscriptionImportReady(scan);
      break;
    case 'previewing':
      renderTranscriptionImportPreviewing();
      break;
    case 'confirming':
      renderTranscriptionImportConfirming(transcriptionImportState.preview);
      break;
    case 'importing':
      renderTranscriptionImportImporting(transcriptionImportState.preview);
      break;
    case 'complete':
      renderTranscriptionImportComplete(transcriptionImportState.result);
      break;
    case 'error':
      renderTranscriptionImportError(transcriptionImportState.message);
      break;
  }
};

const transcriptionSummaryBatchStatusLabel = (
  status: TranscriptionSummaryBatchItemStatus | TranscriptionSummaryBatchResultItemStatus,
) => {
  switch (status) {
    case 'missing':
      return 'Mangler';
    case 'invalid':
      return 'Ugyldig';
    case 'stale':
      return 'Utdatert';
    case 'complete':
      return 'Finnes';
    case 'generated':
      return 'Generert';
    case 'failed':
      return 'Feilet';
    case 'skipped-complete':
      return 'Hoppet over';
    case 'skipped-stale':
      return 'Utdatert, hoppet over';
  }
};

const renderTranscriptionSummaryBatchUnavailable = () => {
  setText(transcriptionSummaryBatchTitleTarget, 'Ingen arbeidsområde valgt');
  setText(
    transcriptionSummaryBatchMessageTarget,
    window.sidekick
      ? 'Velg et arbeidsområde før du lager samtalesammendrag.'
      : 'Åpne appen i Electron for å lage samtalesammendrag.',
  );
  renderTranscriptionSummaryBatchStateElements();
  renderTranscriptionSummaryBatchDetails([]);
  renderTranscriptionSummaryBatchList([]);
  renderTranscriptionSummaryBatchActions('Forhåndsvis', true);
};

const renderTranscriptionSummaryBatchReady = (scan: WorkspaceScan) => {
  setText(transcriptionSummaryBatchTitleTarget, 'Lag manglende sammendrag');
  setText(
    transcriptionSummaryBatchMessageTarget,
    'Sidekick sjekker transkripsjonsmappen og lager sammendrag for filer som mangler det.',
  );
  renderTranscriptionSummaryBatchStateElements(createTranscriptionSummaryBatchSteps(1));
  renderTranscriptionSummaryBatchDetails([
    ['Transkripsjonsmappe', getTranscriptionFolderLabel(scan)],
    ['Omfang', 'Direkte transkripsjonsfiler i denne mappen'],
    ['Lager for', 'Manglende eller ugyldige sammendrag'],
    ['Hopper over', 'Eksisterende og utdaterte sammendrag'],
  ]);
  renderTranscriptionSummaryBatchList([]);
  renderTranscriptionSummaryBatchActions('Forhåndsvis', false, true);
};

const renderTranscriptionSummaryBatchPreviewing = () => {
  setText(transcriptionSummaryBatchTitleTarget, 'Sjekker transkripsjoner');
  setText(transcriptionSummaryBatchMessageTarget, 'Ser etter eksisterende samtalesammendrag.');
  renderTranscriptionSummaryBatchStateElements(createTranscriptionSummaryBatchSteps(1));
  renderTranscriptionSummaryBatchDetails([]);
  renderTranscriptionSummaryBatchList([]);
  renderTranscriptionSummaryBatchActions('Sjekker...', true);
};

const renderTranscriptionSummaryBatchConfirming = (preview: TranscriptionSummaryBatchPreview) => {
  const previewItems = preview.items.slice(0, 8).map(
    (item) =>
      `${item.transcriptionFileName}: ${transcriptionSummaryBatchStatusLabel(item.status)}${
        item.message ? ` (${item.message})` : ''
      }`,
  );

  setText(transcriptionSummaryBatchTitleTarget, 'Bekreft sammendrag');
  setText(
    transcriptionSummaryBatchMessageTarget,
    'Kontroller hvor mange filer Sidekick skal behandle før Codex kjøres.',
  );
  renderTranscriptionSummaryBatchStateElements(
    createTranscriptionSummaryBatchSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(
      `Sidekick skriver samtalesammendrag i arbeidsområdeets .sidekick-mappe for ${preview.counts.toGenerate} transkripsjoner.`,
    ),
  );
  renderTranscriptionSummaryBatchDetails([
    ['Transkripsjonsmappe', preview.targetFolderRelativePath],
    ['Transkripsjoner', preview.counts.total.toString()],
    ['Mangler sammendrag', preview.counts.missing.toString()],
    ['Ugyldige sammendrag', preview.counts.invalid.toString()],
    ['Finnes fra før', preview.counts.complete.toString()],
    ['Utdaterte', preview.counts.stale.toString()],
    ['Skal genereres', preview.counts.toGenerate.toString()],
  ]);
  renderTranscriptionSummaryBatchList([
    ...preview.warnings.map((warning) =>
      warning.path ? `${warning.path}: ${warning.message}` : warning.message,
    ),
    ...previewItems,
    ...(preview.items.length > previewItems.length
      ? [`${preview.items.length - previewItems.length} flere transkripsjoner`]
      : []),
  ]);
  renderTranscriptionSummaryBatchActions(
    preview.counts.toGenerate > 0 ? 'Generer sammendrag' : 'Ingenting å generere',
    preview.counts.toGenerate === 0,
    true,
  );
};

const renderTranscriptionSummaryBatchGenerating = (preview: TranscriptionSummaryBatchPreview) => {
  setText(transcriptionSummaryBatchTitleTarget, 'Genererer sammendrag');
  setText(transcriptionSummaryBatchMessageTarget, 'Codex lager sammendrag én transkripsjon av gangen.');
  renderTranscriptionSummaryBatchStateElements(
    createTranscriptionSummaryBatchSteps(2),
    createWriteOperationBadge(),
    createWriteWarning('Sidekick skriver bare sammendrag i arbeidsområdeets .sidekick-mappe.'),
  );
  renderTranscriptionSummaryBatchDetails([
    ['Transkripsjonsmappe', preview.targetFolderRelativePath],
    ['Gjenstår å generere', preview.counts.toGenerate.toString()],
    ['Hoppes over', (preview.counts.complete + preview.counts.stale).toString()],
  ]);
  renderTranscriptionSummaryBatchList([]);
  renderTranscriptionSummaryBatchActions('Genererer...', true);
};

const renderTranscriptionSummaryBatchComplete = (result: TranscriptionSummaryBatchResult) => {
  const failedItems = result.items
    .filter((item) => item.status === 'failed')
    .map((item) => `${item.transcriptionFileName}: ${item.message ?? 'Ukjent feil'}`);
  const generatedItems = result.items
    .filter((item) => item.status === 'generated')
    .slice(0, 8)
    .map((item) => `${item.transcriptionFileName}: Generert`);

  setText(transcriptionSummaryBatchTitleTarget, 'Sammendrag ferdig');
  setText(
    transcriptionSummaryBatchMessageTarget,
    result.counts.failed > 0
      ? 'Noen sammendrag feilet. Filer som lyktes er beholdt.'
      : 'Alle manglende sammendrag som kunne genereres er oppdatert.',
  );
  renderTranscriptionSummaryBatchStateElements(
    createTranscriptionSummaryBatchSteps(3),
    createResultBanner(
      result.counts.failed > 0 ? 'warning' : 'success',
      result.counts.failed > 0 ? 'Delvis fullført' : 'Sammendragene er klare',
      `${result.counts.generated} generert, ${result.counts.failed} feilet.`,
    ),
  );
  renderTranscriptionSummaryBatchDetails([
    ['Transkripsjonsmappe', result.targetFolderRelativePath],
    ['Generert', result.counts.generated.toString()],
    ['Feilet', result.counts.failed.toString()],
    ['Hoppet over, finnes', result.counts.skippedComplete.toString()],
    ['Hoppet over, utdatert', result.counts.skippedStale.toString()],
  ]);
  renderTranscriptionSummaryBatchList([
    ...failedItems,
    ...generatedItems,
    ...(result.counts.generated > generatedItems.length
      ? [`${result.counts.generated - generatedItems.length} flere sammendrag ble generert`]
      : []),
  ]);
  renderTranscriptionSummaryBatchActions('Sjekk på nytt', false, true);
};

const renderTranscriptionSummaryBatchError = (
  message: string,
  phase: Extract<TranscriptionSummaryBatchState, { status: 'error' }>['phase'],
) => {
  setText(
    transcriptionSummaryBatchTitleTarget,
    phase === 'preview' ? 'Sammendrag kan ikke forberedes' : 'Generering feilet',
  );
  setText(transcriptionSummaryBatchMessageTarget, message);
  renderTranscriptionSummaryBatchStateElements(
    createTranscriptionSummaryBatchSteps(phase === 'preview' ? 1 : 2),
    createResultBanner(
      'error',
      phase === 'preview' ? 'Ingen sammendrag ble skrevet' : 'Genereringen ble ikke fullført',
      'Rett problemet og prøv igjen.',
    ),
  );
  renderTranscriptionSummaryBatchDetails([]);
  renderTranscriptionSummaryBatchList([]);
  renderTranscriptionSummaryBatchActions('Prøv igjen', false, true);
};

const renderTranscriptionSummaryBatch = (scan?: WorkspaceScan) => {
  if (
    !scan ||
    !window.sidekick?.previewTranscriptionSummaryBatch ||
    transcriptionSummaryBatchState.status === 'unavailable'
  ) {
    renderTranscriptionSummaryBatchUnavailable();
    return;
  }

  switch (transcriptionSummaryBatchState.status) {
    case 'ready':
      renderTranscriptionSummaryBatchReady(scan);
      break;
    case 'previewing':
      renderTranscriptionSummaryBatchPreviewing();
      break;
    case 'confirming':
      renderTranscriptionSummaryBatchConfirming(transcriptionSummaryBatchState.preview);
      break;
    case 'generating':
      renderTranscriptionSummaryBatchGenerating(transcriptionSummaryBatchState.preview);
      break;
    case 'complete':
      renderTranscriptionSummaryBatchComplete(transcriptionSummaryBatchState.result);
      break;
    case 'error':
      renderTranscriptionSummaryBatchError(
        transcriptionSummaryBatchState.message,
        transcriptionSummaryBatchState.phase,
      );
      break;
  }
};

const renderDocumentRelationshipsDetails = (rows: DetailRow[]) =>
  renderDetails(documentRelationshipsDetailsTarget, rows);

const renderDocumentRelationshipsStateElements = (...elements: HTMLElement[]) => {
  documentRelationshipsStateTarget?.replaceChildren(...elements);
};

const renderDocumentRelationshipsActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
  if (documentRelationshipsSecondaryButton) {
    documentRelationshipsSecondaryButton.textContent = 'Tilbake';
  }

  renderActions(
    {
      primaryButton: documentRelationshipsPrimaryButton,
      secondaryButton: documentRelationshipsSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
  );
};

const createDocumentRelationshipsSection = (title: string, body?: string) => {
  const section = document.createElement('section');
  section.className = 'document-relationships-section';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const content = document.createElement('pre');
  content.textContent = body?.trim() || 'Ingen innhold i denne seksjonen.';

  section.append(heading, content);

  return section;
};

const renderDocumentRelationshipsReport = (snapshot?: DocumentRelationshipsSnapshot) => {
  clear(documentRelationshipsReportTarget);

  if (!documentRelationshipsReportTarget || snapshot?.status !== 'complete') {
    return;
  }

  documentRelationshipsReportTarget.append(
    createDocumentRelationshipsSection('Oversikt', snapshot.overview),
    createDocumentRelationshipsSection('Relasjonskart', snapshot.relationshipMap),
    createDocumentRelationshipsSection('Tematiske klynger', snapshot.thematicClusters),
    createDocumentRelationshipsSection('Overlapp', snapshot.notableOverlaps),
    createDocumentRelationshipsSection('Mulige motsetninger', snapshot.possibleContradictions),
    createDocumentRelationshipsSection('Lav sikkerhet eller manglende belegg', snapshot.lowConfidenceOrMissingEvidence),
  );
};

const documentRelationshipsDetailsRows = (
  scan: WorkspaceScan,
  snapshot?: DocumentRelationshipsSnapshot,
) =>
  [
    ['Arbeidsområde', scan.rootName],
    ['Omfang', 'Hele valgt arbeidsområde'],
    ['Kildemodell', snapshot?.sourceModel ?? 'Fysisk arbeidsområde'],
    ['Rapportfil', snapshot?.path ?? '.sidekick/document-relationships.md'],
    ['Oppdatert', snapshot?.generatedAt ? formatDate(snapshot.generatedAt) : 'Ikke generert'],
    ['Kontekstpakke', snapshot?.contextPackagePath ?? 'Genereres før analysen'],
  ] satisfies DetailRow[];

const renderDocumentRelationshipsUnavailable = () => {
  setText(documentRelationshipsTitleTarget, 'Ingen arbeidsområde valgt');
  setText(
    documentRelationshipsMessageTarget,
    window.sidekick
      ? 'Velg et arbeidsområde før du analyserer sammenhenger.'
      : 'Åpne appen i Electron for å analysere sammenhenger.',
  );
  renderDocumentRelationshipsStateElements();
  renderDocumentRelationshipsDetails([]);
  renderDocumentRelationshipsReport();
  renderDocumentRelationshipsActions('Finn sammenhenger', true);
};

const renderDocumentRelationshipsChecking = (scan: WorkspaceScan) => {
  setText(documentRelationshipsTitleTarget, 'Sjekker rapport');
  setText(documentRelationshipsMessageTarget, 'Ser etter eksisterende rapport for dokumentsammenhenger.');
  renderDocumentRelationshipsStateElements(createDocumentRelationshipsSteps(1));
  renderDocumentRelationshipsDetails(documentRelationshipsDetailsRows(scan));
  renderDocumentRelationshipsReport();
  renderDocumentRelationshipsActions('Sjekker...', true);
};

const renderDocumentRelationshipsReady = (
  scan: WorkspaceScan,
  snapshot: DocumentRelationshipsSnapshot,
) => {
  if (snapshot.status === 'complete') {
    setText(documentRelationshipsTitleTarget, 'Dokumentsammenhenger');
    setText(documentRelationshipsMessageTarget, 'Siste rapport er tilgjengelig. Du kan lage en ny ved behov.');
    renderDocumentRelationshipsStateElements(createDocumentRelationshipsSteps(3));
    renderDocumentRelationshipsDetails(documentRelationshipsDetailsRows(scan, snapshot));
    renderDocumentRelationshipsReport(snapshot);
    renderDocumentRelationshipsActions('Analyser på nytt', false, true);
    return;
  }

  setText(documentRelationshipsTitleTarget, 'Finn sammenhenger');
  setText(
    documentRelationshipsMessageTarget,
    snapshot.status === 'invalid'
      ? snapshot.message ?? 'Eksisterende rapport kan ikke leses. Lag en ny rapport for å erstatte den.'
      : 'Generer en kontekstpakke og la Codex beskrive sammenhenger på tvers av dokumentene.',
  );
  renderDocumentRelationshipsStateElements(
    createDocumentRelationshipsSteps(1),
    ...(snapshot.status === 'invalid'
      ? [createResultBanner('warning', 'Rapporten kan ikke leses', 'Sidekick kan lage en ny rapport.')]
      : []),
  );
  renderDocumentRelationshipsDetails(documentRelationshipsDetailsRows(scan, snapshot));
  renderDocumentRelationshipsReport();
  renderDocumentRelationshipsActions('Finn sammenhenger', false, true);
};

const renderDocumentRelationshipsGenerating = (
  scan: WorkspaceScan,
  previousReport?: DocumentRelationshipsSnapshot,
) => {
  setText(documentRelationshipsTitleTarget, 'Analyserer sammenhenger');
  setText(
    documentRelationshipsMessageTarget,
    'Sidekick lager først en ny kontekstpakke og bruker den deretter som grunnlag for rapporten.',
  );
  renderDocumentRelationshipsStateElements(
    createDocumentRelationshipsSteps(2),
    createWriteOperationBadge(),
    createWriteWarning('Sidekick oppdaterer kontekstpakken og skriver .sidekick/document-relationships.md.'),
  );
  renderDocumentRelationshipsDetails(documentRelationshipsDetailsRows(scan, previousReport));
  renderDocumentRelationshipsReport(previousReport);
  renderDocumentRelationshipsActions('Analyserer...', true);
};

const renderDocumentRelationshipsComplete = (
  scan: WorkspaceScan,
  result: DocumentRelationshipsGenerationResult,
) => {
  const report = result.report;

  setText(documentRelationshipsTitleTarget, 'Dokumentsammenhenger oppdatert');
  setText(documentRelationshipsMessageTarget, 'Rapporten er skrevet og kan brukes som grunnlag for videre tasks.');
  renderDocumentRelationshipsStateElements(
    createDocumentRelationshipsSteps(3),
    createResultBanner(
      'success',
      'Rapporten er klar',
      'Funnene er strukturert som Markdown i arbeidsområdeets .sidekick-mappe.',
    ),
  );
  renderDocumentRelationshipsDetails([
    ...documentRelationshipsDetailsRows(scan, report),
    ['Tokens i kontekstpakke', result.contextPackage?.totalTokens.toString() ?? 'Ukjent'],
  ]);
  renderDocumentRelationshipsReport(report);
  renderDocumentRelationshipsActions('Analyser på nytt', false, true);
};

const renderDocumentRelationshipsFailed = (
  scan: WorkspaceScan,
  message: string,
  previousReport?: DocumentRelationshipsSnapshot,
) => {
  setText(documentRelationshipsTitleTarget, 'Analyse feilet');
  setText(documentRelationshipsMessageTarget, message);
  renderDocumentRelationshipsStateElements(
    createDocumentRelationshipsSteps(2),
    createResultBanner(
      'error',
      'Ingen ny rapport ble skrevet',
      previousReport ? 'Tidligere rapport vises under.' : 'Rett problemet og prøv igjen.',
    ),
  );
  renderDocumentRelationshipsDetails(documentRelationshipsDetailsRows(scan, previousReport));
  renderDocumentRelationshipsReport(previousReport);
  renderDocumentRelationshipsActions('Prøv igjen', false, true);
};

const renderDocumentRelationships = (scan?: WorkspaceScan) => {
  if (!scan || !window.sidekick || documentRelationshipsState.status === 'unavailable') {
    renderDocumentRelationshipsUnavailable();
    return;
  }

  if (
    'rootPath' in documentRelationshipsState &&
    documentRelationshipsState.rootPath !== scan.rootPath
  ) {
    renderDocumentRelationshipsChecking(scan);
    return;
  }

  switch (documentRelationshipsState.status) {
    case 'checking':
      renderDocumentRelationshipsChecking(scan);
      break;
    case 'ready':
      renderDocumentRelationshipsReady(scan, documentRelationshipsState.snapshot);
      break;
    case 'generating':
      renderDocumentRelationshipsGenerating(scan, documentRelationshipsState.previousReport);
      break;
    case 'complete':
      renderDocumentRelationshipsComplete(scan, documentRelationshipsState.result);
      break;
    case 'failed':
      renderDocumentRelationshipsFailed(
        scan,
        documentRelationshipsState.message,
        documentRelationshipsState.previousReport,
      );
      break;
  }
};

const renderCodexActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
  secondaryLabel = 'Tilbake',
) => {
  renderActions(
    {
      primaryButton: codexPrimaryButton,
      secondaryButton: codexSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
    secondaryLabel,
  );
};

const renderCodexStateElements = (...elements: HTMLElement[]) => {
  codexStateTarget?.replaceChildren(...elements);
};

const createCodexSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Instruksjon', 'Kjøring', 'Ferdig'], activeStep);

const codexModeLabel = (mode: CodexRunMode | 'login') => {
  if (mode === 'workspace-write') {
    return 'Skrivetilgang';
  }

  if (mode === 'login') {
    return 'Innlogging';
  }

  return 'Lesetilgang';
};

const codexExitLabel = (completion: CodexCompletionEvent) =>
  completion.exitCode?.toString() ?? completion.signal ?? 'Ukjent';

const setCodexInputsDisabled = (disabled: boolean) => {
  if (codexPromptInput) {
    codexPromptInput.disabled = disabled;
  }

  if (codexEditModeInput) {
    codexEditModeInput.disabled = disabled;
  }
};

const renderCodexModeCopy = () => {
  const isWriteMode = Boolean(codexEditModeInput?.checked);

  setText(codexModeTitleTarget, isWriteMode ? 'Skrivetilgang' : 'Lesetilgang');
  setText(
    codexModeDescriptionTarget,
    isWriteMode
      ? 'Codex kan lese og endre filer direkte i arbeidsområdet for denne kjøringen.'
      : 'Codex kan lese arbeidsområdet, men ikke endre filer.',
  );
};

const renderCodexDetails = (rows: DetailRow[]) => renderDetails(codexDetailsTarget, rows);

const renderCodexOutput = (output: CodexOutputEvent[] = []) => {
  clear(codexOutputTarget);

  if (!codexOutputTarget) {
    return;
  }

  if (output.length === 0) {
    codexOutputTarget.append(createListItem('Ingen kjørelogg ennå.'));
    return;
  }

  codexOutputTarget.append(
    ...output.slice(-12).map((event) => {
      const text = event.parsed ? JSON.stringify(event.parsed) : event.text;
      return createListItem(`${event.stream}: ${text}`);
    }),
  );
};

const renderCodexUnavailable = (message = 'Velg et arbeidsområde først.') => {
  setText(codexTitleTarget, 'Ingen arbeidsområde valgt');
  setText(codexMessageTarget, window.sidekick ? message : 'Åpne Sidekick i Electron for å bruke Codex.');
  renderCodexStateElements();
  renderCodexDetails([]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexModeCopy();
  renderCodexActions('Kjør Codex', true);
};

const renderCodexChecking = () => {
  setText(codexTitleTarget, 'Sjekker Codex');
  setText(codexMessageTarget, 'Ser etter Codex CLI og innloggingsstatus.');
  renderCodexStateElements(createCodexSteps(1));
  renderCodexDetails([]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexModeCopy();
  renderCodexActions('Sjekker...', true);
};

const renderCodexLoggedOut = (codexStatus: CodexStatus) => {
  setText(codexTitleTarget, 'Innlogging kreves');
  setText(codexMessageTarget, codexStatus.message ?? 'Codex er tilgjengelig, men ikke logget inn.');
  renderCodexStateElements(
    createResultBanner('error', 'Codex er ikke logget inn', 'Start innlogging med Codex sin enhetsflyt.'),
  );
  renderCodexDetails([
    ['Versjon', codexStatus.version ?? 'Ukjent'],
    ['Innlogging', 'Enhetsflyt'],
  ]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexModeCopy();
  renderCodexActions('Logg inn', false, true);
};

const renderCodexReady = (codexStatus: CodexStatus, scan: WorkspaceScan) => {
  const isWriteMode = Boolean(codexEditModeInput?.checked);

  setText(codexTitleTarget, 'Codex er klar');
  setText(codexMessageTarget, 'Kjør Codex direkte mot valgt arbeidsområde.');
  renderCodexStateElements(
    ...(isWriteMode
      ? [
          createWriteOperationBadge(),
          createWriteWarning(`Codex kan endre filer direkte i ${scan.rootPath} for denne kjøringen.`),
        ]
      : [createCodexSteps(1)]),
  );
  renderCodexDetails([
    ['Arbeidsområde', scan.rootPath],
    ['Versjon', codexStatus.version ?? 'Ukjent'],
    ['Standard tilgang', 'Lesetilgang'],
  ]);
  renderCodexOutput([]);
  setCodexInputsDisabled(false);
  renderCodexModeCopy();
  renderCodexActions('Kjør Codex', false, true);
};

const renderCodexRunning = (
  run: Extract<CodexState, { status: 'running' }>,
  scan: WorkspaceScan,
) => {
  setText(codexTitleTarget, run.mode === 'login' ? 'Innlogging kjører' : 'Codex kjører');
  setText(
    codexMessageTarget,
    run.mode === 'workspace-write'
      ? 'Codex har skrivetilgang til valgt arbeidsområde i denne kjøringen.'
      : 'Sidekick viser kontrollert kjørelogg fra Codex.',
  );
  renderCodexStateElements(
    ...(run.mode === 'workspace-write'
      ? [
          createWriteOperationBadge(),
          createWriteWarning(`Codex kan endre filer direkte i ${scan.rootPath}.`),
        ]
      : [createCodexSteps(2)]),
  );
  renderCodexDetails([
    ['Kjøring', run.runId],
    ['Tilgang', codexModeLabel(run.mode)],
    ['Arbeidsområde', scan.rootPath],
  ]);
  renderCodexOutput(run.output);
  setCodexInputsDisabled(true);
  renderCodexModeCopy();
  renderCodexActions(run.mode === 'login' ? 'Logger inn...' : 'Kjører...', true, true, 'Avbryt');
};

const renderCodexFinished = (
  finished: Extract<CodexState, { status: 'completed' | 'failed' | 'canceled' }>,
) => {
  const title =
    finished.status === 'completed'
      ? 'Codex fullført'
      : finished.status === 'canceled'
        ? 'Codex avbrutt'
        : 'Codex feilet';
  const message =
    finished.completion.message ??
    (finished.status === 'completed'
      ? 'Kjøringen er ferdig.'
      : finished.status === 'canceled'
        ? 'Kjøringen ble avbrutt.'
        : 'Kjøringen feilet.');

  setText(codexTitleTarget, title);
  setText(codexMessageTarget, message);
  renderCodexStateElements(
    createResultBanner(
      finished.status === 'failed' ? 'error' : finished.status === 'canceled' ? 'warning' : 'success',
      title,
      message,
    ),
  );
  renderCodexDetails([
    ['Kjøring', finished.completion.runId],
    ['Tilgang', codexModeLabel(finished.completion.mode)],
    ['Avslutning', codexExitLabel(finished.completion)],
  ]);
  renderCodexOutput(finished.output);
  setCodexInputsDisabled(false);
  renderCodexModeCopy();
  renderCodexActions('Kjør igjen', false, true);
};

const renderCodex = (scan?: WorkspaceScan) => {
  if (!scan || !window.sidekick || codexState.status === 'unavailable') {
    renderCodexUnavailable(codexState.status === 'unavailable' ? codexState.message : undefined);
    return;
  }

  switch (codexState.status) {
    case 'checking':
      renderCodexChecking();
      break;
    case 'logged-out':
      renderCodexLoggedOut(codexState.codexStatus);
      break;
    case 'ready':
      renderCodexReady(codexState.codexStatus, scan);
      break;
    case 'running':
      renderCodexRunning(codexState, scan);
      break;
    case 'completed':
    case 'failed':
    case 'canceled':
      renderCodexFinished(codexState);
      break;
  }
};

const renderContextViewToggle = (scan?: WorkspaceScan) => {
  contextViewToggleTarget?.toggleAttribute('hidden', !scan);
  contextViewButtons.forEach((button) => {
    const viewId = button.dataset.contextViewButton as ContextViewId | undefined;
    const isActive = viewId === activeContextView;
    button.classList.toggle('context-view-toggle__button--active', isActive);
    button.setAttribute('aria-pressed', isActive.toString());
    button.toggleAttribute('disabled', !scan);
  });
};

const renderTreeToolbar = (scan?: WorkspaceScan) => {
  const hasScan = Boolean(scan);
  const isFoldersView = activeContextView === 'folders';

  treeToolbarTarget?.toggleAttribute('hidden', !hasScan || !isFoldersView);
  expandAllButton?.toggleAttribute('disabled', !hasScan || !isFoldersView);
  collapseAllButton?.toggleAttribute('disabled', !hasScan || !isFoldersView);
};

const createTreeItem = (node: FolderTreeNode, level: number) => {
  const item = document.createElement('li');
  item.className = `tree-node tree-node--${node.kind}`;
  item.setAttribute('role', 'treeitem');
  item.setAttribute('aria-level', level.toString());

  return item;
};

const appendTreeNodeName = (row: HTMLDivElement, node: FolderTreeNode) => {
  const name = document.createElement('span');
  name.className = 'tree-name';
  const label = document.createElement('span');
  label.textContent = node.kind === 'folder' ? `${node.name}/` : node.name;
  name.append(label);

  const tags = getVisibleFolderTags(node);
  if (tags.length > 0) {
    const tagList = document.createElement('span');
    tagList.className = 'tree-tag-list';
    tags.slice(0, 3).forEach((tag) => {
      const pill = document.createElement('span');
      pill.className = 'tree-tag-pill';
      pill.dataset.tagKind = tag.kind;
      pill.textContent = tag.label;
      tagList.append(pill);
    });

    if (tags.length > 3) {
      const more = document.createElement('span');
      more.className = 'tree-tag-pill';
      more.dataset.tagKind = 'more';
      more.textContent = `+${tags.length - 3}`;
      tagList.append(more);
    }

    name.append(tagList);
  }
  row.append(name);
};

const appendTreeNodeMeta = (row: HTMLDivElement, node: FolderTreeNode) => {
  if (isFolderNode(node)) {
    const meta = document.createElement('span');
    meta.className = 'tree-meta';
    const fileCount = countFilesInNode(node);
    meta.textContent = `${getDirectChildSummary(node)} · ${fileCount} ${
      fileCount === 1 ? 'fil totalt' : 'filer totalt'
    }`;
    row.append(meta);
  } else if (node.artifactType) {
    const meta = document.createElement('span');
    meta.className = 'tree-meta';
    meta.textContent = `${artifactLabels[node.artifactType]} ${formatBytes(node.size)}`.trim();
    row.append(meta);
  }
};

const appendTreeNodeHints = (row: HTMLDivElement, node: FolderTreeNode) => {
  if (isFolderNode(node)) {
    const hints = document.createElement('span');
    const artifacts = [...collectFileArtifactTypes(node)]
      .slice(0, 3)
      .map((type) => artifactLabels[type]);
    hints.className = 'tree-hints';
    hints.textContent = artifacts.length > 0 ? artifacts.join(', ') : getFolderSignalLabel(node);
    row.append(hints);
  } else if (node.contextHints.length > 0) {
    const hints = document.createElement('span');
    hints.className = 'tree-hints';
    hints.textContent = node.contextHints.map((hint) => signalLabels[hint]).join(', ');
    row.append(hints);
  }
};

const appendTreeSpacer = (row: HTMLDivElement) => {
  const spacer = document.createElement('span');
  spacer.className = 'tree-toggle-spacer';
  row.append(spacer);
};

const appendFolderToggle = (item: HTMLLIElement, row: HTMLDivElement, node: FolderTreeNode) => {
  const isExpanded = expandedPaths.has(node.relativePath);
  const canExpand = hasChildren(node);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tree-toggle';
  toggle.tabIndex = -1;
  toggle.textContent = canExpand ? (isExpanded ? 'v' : '>') : '';
  toggle.disabled = !canExpand;
  toggle.setAttribute(
    'aria-label',
    canExpand
      ? `${isExpanded ? 'Lukk' : 'Utvid'} ${node.name}`
      : `${node.name} har ingen underpunkter`,
  );

  if (canExpand) {
    item.setAttribute('aria-expanded', isExpanded.toString());
    row.classList.add('tree-row--interactive');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      focusedTreePath = node.relativePath;
      toggleFolder(node.relativePath);
      focusTreeRow(node.relativePath);
    });
  }

  row.append(toggle);
};

const moveTreeFocus = (relativePath: string, shouldRender = false) => {
  focusedTreePath = relativePath;
  if (shouldRender) {
    render();
  }
  focusTreeRow(relativePath);
};

// The folder browser uses roving tabindex: one visible tree row is keyboard
// focusable, while arrow keys move focus without changing the selected item.
const handleTreeItemKeyDown = (event: KeyboardEvent, node: FolderTreeNode) => {
  const scan = getActiveScan();

  if (!scan) {
    return;
  }

  const visibleEntries = flattenVisibleTree(scan.tree);
  const currentIndex = visibleEntries.findIndex((entry) => entry.node.relativePath === node.relativePath);
  const currentEntry = visibleEntries[currentIndex];

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      const next = visibleEntries[Math.min(currentIndex + 1, visibleEntries.length - 1)];
      if (next) {
        moveTreeFocus(next.node.relativePath);
      }
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      const previous = visibleEntries[Math.max(currentIndex - 1, 0)];
      if (previous) {
        moveTreeFocus(previous.node.relativePath);
      }
      break;
    }
    case 'ArrowRight': {
      if (!isFolderNode(node) || !hasChildren(node)) {
        return;
      }

      event.preventDefault();
      if (!expandedPaths.has(node.relativePath)) {
        expandedPaths.add(node.relativePath);
        moveTreeFocus(node.relativePath, true);
        return;
      }

      const firstChild = getChildren(node)[0];
      if (firstChild) {
        moveTreeFocus(firstChild.relativePath);
      }
      break;
    }
    case 'ArrowLeft': {
      event.preventDefault();
      if (isFolderNode(node) && expandedPaths.has(node.relativePath) && node.relativePath !== ROOT_PATH) {
        expandedPaths.delete(node.relativePath);
        moveTreeFocus(node.relativePath, true);
        return;
      }

      const parentPath = currentEntry?.parentPath ?? getParentPath(scan, node.relativePath);
      if (parentPath) {
        moveTreeFocus(parentPath);
      }
      break;
    }
    case 'Enter':
    case ' ': {
      event.preventDefault();
      selectTreePath(node.relativePath, true);
      break;
    }
  }
};

const handleGlobalTreeKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || !treeTarget) {
    return;
  }

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement) || !treeTarget.contains(activeElement)) {
    return;
  }

  const treeItem = activeElement.closest<HTMLElement>('[role="treeitem"][data-tree-path]');
  const scan = getActiveScan();
  const relativePath = treeItem?.dataset.treePath;

  if (!scan || !relativePath) {
    return;
  }

  const node = getNodeByPath(scan.tree, relativePath);
  if (node) {
    handleTreeItemKeyDown(event, node);
  }
};

const createTreeRow = (item: HTMLLIElement, node: FolderTreeNode) => {
  const row = document.createElement('div');
  row.className = 'tree-row';
  row.dataset.treePath = node.relativePath;
  row.dataset.treeKind = node.kind;

  item.tabIndex = -1;
  item.dataset.treePath = node.relativePath;
  item.setAttribute('aria-selected', (node.relativePath === selectedTreePath).toString());
  item.classList.toggle('tree-node--selected', node.relativePath === selectedTreePath);
  item.classList.toggle('tree-node--focused', node.relativePath === focusedTreePath);
  row.tabIndex = node.relativePath === focusedTreePath ? 0 : -1;
  row.addEventListener('focus', () => {
    focusedTreePath = node.relativePath;
  });
  row.addEventListener('keydown', (event) => {
    handleTreeItemKeyDown(event, node);
  });

  if (isFolderNode(node)) {
    appendFolderToggle(item, row, node);
  } else {
    appendTreeSpacer(row);
  }

  appendTreeNodeName(row, node);
  appendTreeNodeMeta(row, node);
  appendTreeNodeHints(row, node);

  row.addEventListener('click', () => {
    if (isFolderNode(node)) {
      focusedTreePath = node.relativePath;
    }
    selectTreePath(node.relativePath, true);
  });

  return row;
};

const appendTreeChildren = (item: HTMLLIElement, node: FolderTreeNode, level: number) => {
  if (!isFolderNode(node) || !expandedPaths.has(node.relativePath) || !hasChildren(node)) {
    return;
  }

  const children = document.createElement('ol');
  children.setAttribute('role', 'group');
  children.append(...getChildren(node).map((child) => renderTreeNode(child, level + 1)));
  item.append(children);
};

const renderTreeNode = (node: FolderTreeNode, level = 1) => {
  const item = createTreeItem(node, level);
  item.append(createTreeRow(item, node));
  appendTreeChildren(item, node, level);

  return item;
};

const renderTree = (scan?: WorkspaceScan) => {
  clear(treeTarget);
  renderTreeToolbar(scan);

  foldersViewTarget?.toggleAttribute(
    'hidden',
    !scan || activeContextView !== 'folders' || hasActiveSearchQuery(),
  );

  if (!treeTarget || !scan || activeContextView !== 'folders' || hasActiveSearchQuery()) {
    return;
  }

  ensureVisibleTreeSelection(scan);
  treeTarget.append(renderTreeNode(scan.tree));
};

const projectViewReasonLabel = (reason: ContextViewReason) => {
  switch (reason) {
    case 'project-root-tag':
      return 'Mappen er tagget som Prosjektmappe.';
    case 'physical-project-file':
      return 'Filen ligger fysisk i en mappe tagget som Prosjektmappe.';
    case 'physical-tree-node':
      return 'Elementet vises i den fysiske mappevisningen.';
  }
};

const createProjectContextRow = (row: ContextViewRow) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `project-context-row project-context-row--${row.artifactKind}`;
  button.classList.toggle('project-context-row--selected', row.artifactRelativePath === selectedTreePath);
  button.dataset.projectPath = row.artifactRelativePath;
  button.addEventListener('click', () => {
    selectTreePath(row.artifactRelativePath, true);
  });

  const badge = document.createElement('span');
  badge.className = 'artifact-badge';
  badge.textContent = row.artifactKind === 'folder' ? 'prosjekt' : getFileExtension(row.displayLabel);

  const name = document.createElement('span');
  name.className = 'project-context-row__name';
  name.textContent = row.displayLabel;

  const meta = document.createElement('span');
  meta.className = 'project-context-row__meta';
  meta.textContent =
    row.artifactKind === 'folder'
      ? row.artifactRelativePath
      : [row.artifactType ? artifactLabels[row.artifactType] : 'Fil', formatBytes(row.size)]
          .filter(Boolean)
          .join(' · ');

  button.append(badge, name, meta);

  return button;
};

const renderProjectsView = (scan?: WorkspaceScan) => {
  clear(projectsViewTarget);
  projectsViewTarget?.toggleAttribute(
    'hidden',
    !scan || activeContextView !== 'projects' || hasActiveSearchQuery(),
  );

  if (!projectsViewTarget || !scan || activeContextView !== 'projects' || hasActiveSearchQuery()) {
    return;
  }

  if (scan.contextViews.projects.contexts.length === 0) {
    const empty = document.createElement('section');
    empty.className = 'project-context-empty';
    const title = document.createElement('h3');
    title.textContent = 'Ingen prosjektmapper';
    const message = document.createElement('p');
    message.textContent =
      'Tagg en mappe med Prosjektmappe i Mapper-visningen for å vise den her.';
    empty.append(title, message);
    projectsViewTarget.append(empty);
    return;
  }

  scan.contextViews.projects.contexts.forEach((context) => {
    const group = document.createElement('section');
    group.className = 'project-context-group';

    const header = document.createElement('header');
    header.className = 'project-context-group__header';
    const title = document.createElement('h3');
    title.textContent = context.label;
    const count = document.createElement('span');
    count.className = 'project-context-group__count';
    count.textContent = `${context.rows.length} ${context.rows.length === 1 ? 'fil' : 'filer'}`;
    header.append(title, count);

    const root = document.createElement('div');
    root.className = 'project-context-root';
    root.append(createProjectContextRow(context.rootRow));

    const source = document.createElement('div');
    source.className = 'project-context-source';
    const sourceLabel = document.createElement('p');
    sourceLabel.className = 'project-context-source__label';
    sourceLabel.textContent = 'Prosjektfiler';
    source.append(sourceLabel);

    if (context.rows.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'project-context-source__empty';
      empty.textContent = 'Ingen filer i prosjektmappen.';
      source.append(empty);
    } else {
      context.rows.forEach((row) => source.append(createProjectContextRow(row)));
    }

    group.append(header, root, source);
    projectsViewTarget.append(group);
  });
};

const searchStatusLabel = (status?: SearchIndexStatus) => {
  switch (status?.state) {
    case 'indexing':
      return 'Bygger indeks';
    case 'updating':
      return 'Oppdaterer indeks';
    case 'ready':
      return `Indeks klar (${status.documentCount})`;
    case 'stale':
      return 'Indeks må oppdateres';
    case 'failed':
      return 'Indeks feilet';
    case 'missing':
      return 'Indeks mangler';
    default:
      return 'Indeks ikke sjekket';
  }
};

const searchStatusTone = (status?: SearchIndexStatus) => {
  if (!status) {
    return 'neutral';
  }

  if (status.state === 'ready') {
    return 'success';
  }

  if (status.state === 'stale' || status.state === 'missing' || status.state === 'indexing' || status.state === 'updating') {
    return 'warning';
  }

  if (status.state === 'failed') {
    return 'error';
  }

  return 'neutral';
};

const currentSearchIndexStatus = () => {
  if (searchState.status === 'idle' || searchState.status === 'searching') {
    return searchState.indexStatus;
  }

  if (searchState.status === 'results') {
    return searchState.result.status;
  }

  if (searchState.status === 'error') {
    return searchState.indexStatus;
  }

  return undefined;
};

const renderSearchResults = (scan?: WorkspaceScan) => {
  clear(searchResultsTarget);
  const query = searchQueryInput?.value.trim() ?? '';
  const indexStatus = currentSearchIndexStatus();
  const hasQuery = Boolean(query);

  searchPanelTarget?.toggleAttribute('hidden', !scan);
  searchResultsTarget?.toggleAttribute('hidden', !scan || !hasQuery);
  treeTarget?.parentElement?.toggleAttribute('hidden', Boolean(scan && hasQuery));
  projectsViewTarget?.toggleAttribute('hidden', Boolean(scan && hasQuery) || activeContextView !== 'projects');
  searchQueryInput?.toggleAttribute('disabled', !scan || !window.sidekick?.searchWorkspace);

  if (searchStatusTarget) {
    searchStatusTarget.textContent = searchStatusLabel(indexStatus);
    searchStatusTarget.dataset.status = searchStatusTone(indexStatus);
  }

  const canRefresh =
    Boolean(scan && window.sidekick?.refreshSearchIndex) &&
    indexStatus?.state !== 'indexing' &&
    indexStatus?.state !== 'updating';
  searchRefreshButton?.toggleAttribute('disabled', !canRefresh);

  const skippedCount = indexStatus
    ? Object.values(indexStatus.skippedCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const skippedLabel = skippedCount > 0 ? ` · ${skippedCount} hoppet over` : '';

  if (!hasQuery) {
    setText(searchCountTarget, indexStatus ? `${indexStatus.documentCount} indeksert${skippedLabel}` : '');
    return;
  }

  if (searchState.status === 'searching') {
    setText(searchCountTarget, 'Søker...');
    searchResultsTarget?.append(createResultBanner('warning', 'Søker', 'Sidekick søker i lokal indeks.'));
    return;
  }

  if (searchState.status === 'error') {
    setText(searchCountTarget, 'Søk feilet');
    searchResultsTarget?.append(createResultBanner('error', 'Søket feilet', searchState.message));
    return;
  }

  if (searchState.status !== 'results') {
    setText(searchCountTarget, 'Skriv for å søke');
    return;
  }

  setText(
    searchCountTarget,
    `${searchState.result.results.length} av ${searchState.result.resultCount} treff${skippedLabel}`,
  );

  if (searchState.result.results.length === 0) {
    searchResultsTarget?.append(createResultBanner('warning', 'Ingen treff', 'Søket ga ingen treff i indeksen.'));
    return;
  }

  const list = document.createElement('ol');
  list.className = 'search-result-list';

  const resultIndexStatus = searchState.result.status;
  searchState.result.results.forEach((result) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const title = document.createElement('span');
    const meta = document.createElement('span');
    const snippet = document.createElement('span');

    button.type = 'button';
    button.className = 'search-result-row';
    button.disabled = !scan || !getNodeByPath(scan.tree, result.relativePath);
    title.className = 'search-result-title';
    meta.className = 'search-result-meta';
    snippet.className = 'search-result-snippet';
    title.textContent = result.relativePath;
    meta.textContent = `${result.rank}. treff · score ${result.score.toFixed(2)} · ${artifactLabels[result.artifactType]} · ${formatBytes(result.size)}`;
    snippet.textContent = result.snippet || 'Ingen tekstutdrag tilgjengelig.';
    button.append(title, meta, snippet);
    button.addEventListener('click', () => {
      const activeScan = getActiveScan();
      if (!activeScan || !getNodeByPath(activeScan.tree, result.relativePath)) {
        return;
      }

      selectedTreePath = result.relativePath;
      focusedTreePath = result.relativePath;
      expandedPaths = new Set([
        ...expandedPaths,
        ROOT_PATH,
        ...getPathAncestors(activeScan, result.relativePath).map((node) => node.relativePath),
      ]);
      if (searchQueryInput) {
        searchQueryInput.value = '';
      }
      searchState = { status: 'idle', rootPath: activeScan.rootPath, indexStatus: resultIndexStatus };
      render();
      focusSelectedTreeRow();
    });
    item.append(button);
    list.append(item);
  });

  searchResultsTarget?.append(list);
};

const refreshSearchIndexStatus = async (scan: WorkspaceScan) => {
  if (!window.sidekick?.getSearchIndexStatus) {
    searchState = { status: 'unavailable' };
    render();
    return;
  }

  try {
    const indexStatus = await window.sidekick.getSearchIndexStatus(scan.rootPath);
    const activeScan = getActiveScan();
    if (!activeScan || activeScan.rootPath !== scan.rootPath) {
      return;
    }

    const query = searchQueryInput?.value.trim() ?? '';
    if (searchState.status === 'results' && searchState.rootPath === scan.rootPath && query) {
      searchState = {
        status: 'results',
        rootPath: scan.rootPath,
        query: searchState.query,
        result: {
          ...searchState.result,
          status: indexStatus,
        },
      };
    } else {
      searchState = { status: 'idle', rootPath: scan.rootPath, indexStatus };
    }
  } catch (error) {
    searchState = {
      status: 'error',
      rootPath: scan.rootPath,
      query: '',
      message: error instanceof Error ? error.message : 'Kunne ikke lese søkeindeks.',
    };
  }

  render();
};

const runSearch = async () => {
  const scan = getActiveScan();
  const query = searchQueryInput?.value.trim() ?? '';

  if (!scan || !window.sidekick?.searchWorkspace) {
    return;
  }

  if (!query) {
    const indexStatus = currentSearchIndexStatus() ?? createMissingSearchStatus(scan.rootPath);
    searchState = { status: 'idle', rootPath: scan.rootPath, indexStatus };
    render();
    return;
  }

  const indexStatus = currentSearchIndexStatus() ?? createMissingSearchStatus(scan.rootPath);
  searchState = { status: 'searching', rootPath: scan.rootPath, query, indexStatus };
  render();

  try {
    const result = await window.sidekick.searchWorkspace({ rootPath: scan.rootPath, query, limit: 25 });
    const activeScan = getActiveScan();
    if (!activeScan || activeScan.rootPath !== scan.rootPath || searchQueryInput?.value.trim() !== query) {
      return;
    }
    searchState = { status: 'results', rootPath: scan.rootPath, query, result };
  } catch (error) {
    searchState = {
      status: 'error',
      rootPath: scan.rootPath,
      query,
      indexStatus,
      message: error instanceof Error ? error.message : 'Søket kunne ikke gjennomføres.',
    };
  }

  render();
};

const scheduleSearch = () => {
  if (searchDebounceTimer) {
    window.clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = window.setTimeout(() => {
    void runSearch();
  }, 200);
};

const refreshSearchIndex = async () => {
  const scan = getActiveScan();

  if (!scan || !window.sidekick?.refreshSearchIndex) {
    return;
  }

  const previousStatus = currentSearchIndexStatus() ?? createMissingSearchStatus(scan.rootPath);
  searchState = {
    status: 'idle',
    rootPath: scan.rootPath,
    indexStatus: {
      ...previousStatus,
      state: 'indexing',
      message: 'Oppdaterer søkeindeks.',
    },
  };
  render();

  try {
    const indexStatus = await window.sidekick.refreshSearchIndex(scan.rootPath);
    const activeScan = getActiveScan();
    if (!activeScan || activeScan.rootPath !== scan.rootPath) {
      return;
    }
    searchState = { status: 'idle', rootPath: scan.rootPath, indexStatus };
    await runSearch();
  } catch (error) {
    searchState = {
      status: 'error',
      rootPath: scan.rootPath,
      query: searchQueryInput?.value.trim() ?? '',
      indexStatus: previousStatus,
      message: error instanceof Error ? error.message : 'Søkeindeksen kunne ikke oppdateres.',
    };
  }

  render();
};

const handleSearchIndexStatus = (status: SearchIndexStatus) => {
  const scan = getActiveScan();

  if (!scan || scan.rootPath !== status.rootPath) {
    return;
  }

  if (searchState.status === 'results') {
    searchState = {
      ...searchState,
      result: {
        ...searchState.result,
        status,
      },
    };
  } else if (searchState.status === 'searching') {
    searchState = {
      ...searchState,
      indexStatus: status,
    };
  } else {
    searchState = { status: 'idle', rootPath: status.rootPath, indexStatus: status };
  }

  render();
};

const handleWorkspaceWatchStatus = (status: WorkspaceWatchStatus) => {
  const scan = getActiveScan();

  if (!scan || scan.rootPath !== status.rootPath) {
    return;
  }

  workspaceWatchStatus = status;
  render();
};

const handleWorkspaceScanUpdated = (scan: WorkspaceScan) => {
  const activeScan = getActiveScan();

  if (!activeScan || activeScan.rootPath !== scan.rootPath) {
    return;
  }

  replaceActiveScan(scan);
  render();
  void refreshWorkspaceInfo(scan);
  void refreshSearchIndexStatus(scan);
};

const refreshOverviewContextPackageStatus = async (scan: WorkspaceScan) => {
  if (!window.sidekick) {
    overviewContextPackageStatus = { status: 'unavailable' };
    render();
    return;
  }

  const rootPath = scan.rootPath;
  overviewContextPackageStatus = { status: 'checking', rootPath };
  render();

  try {
    const preview = await window.sidekick.previewContextPackage(rootPath);
    const activeScan = getActiveScan();

    // Async preview results must not update the overview after the user has
    // selected a different workspace.
    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    overviewContextPackageStatus = preview.willOverwrite
      ? { status: 'exists', rootPath, outputFileName: preview.outputFileName }
      : { status: 'missing', rootPath, outputFileName: preview.outputFileName };
  } catch (error) {
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    overviewContextPackageStatus = {
      status: 'unknown',
      rootPath,
      message: error instanceof Error ? error.message : 'Kunne ikke sjekke kontekstpakke.',
    };
  }

  render();
};

const refreshWorkspaceInfo = async (scan: WorkspaceScan) => {
  if (!window.sidekick) {
    return;
  }

  const rootPath = scan.rootPath;

  try {
    const snapshot = await window.sidekick.readWorkspaceInfo(rootPath);
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    workspaceInfoState = {
      rootPath,
      snapshot,
    };
  } catch (error) {
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    workspaceInfoState = {
      rootPath,
      snapshot: {
        status: 'invalid',
        path: '',
        message: error instanceof Error ? error.message : 'Kunne ikke lese arbeidsområdesammendrag.',
      },
    };
  }

  render();
};

const refreshDocumentRelationships = async (scan: WorkspaceScan) => {
  if (!window.sidekick) {
    documentRelationshipsState = { status: 'unavailable' };
    return;
  }

  const rootPath = scan.rootPath;
  documentRelationshipsState = { status: 'checking', rootPath };

  try {
    const snapshot = await window.sidekick.readDocumentRelationships(rootPath);
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    documentRelationshipsState = {
      status: 'ready',
      rootPath,
      snapshot,
    };
  } catch (error) {
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    documentRelationshipsState = {
      status: 'ready',
      rootPath,
      snapshot: {
        status: 'invalid',
        path: '',
        message: error instanceof Error ? error.message : 'Kunne ikke lese rapport for sammenhenger.',
      },
    };
  }

  render();
};

const renderNoScanPanels = () => {
  overviewEmptyTarget?.toggleAttribute('hidden', true);
  renderOverviewScanStatus();
  renderOverviewContextPackageStatus();
  renderSearchResults();
  renderContextPackage();
  renderTranscriptionImport();
  renderTranscriptionSummaryBatch();
  renderDocumentRelationships();
  renderCodex();
  renderContextViewToggle();
  renderTree();
  renderProjectsView();
};

const renderEmptyState = () => {
  setText(selectedNameTarget, 'Ingen arbeidsområde valgt');
  setText(
    selectedPathTarget,
    window.sidekick ? 'Velg en mappe for å inspisere innholdet.' : 'Åpne i Electron for å inspisere lokale mapper.',
  );
  setText(statusMessageTarget, 'Ingen arbeidsområde valgt');
  setText(workspaceEntryErrorTarget, '');
  workspaceEntryErrorTarget?.toggleAttribute('hidden', true);
  setText(stateTitleTarget, 'Velg et arbeidsområde');
  setText(stateMessageTarget, 'Sidekick skanner lokale mapper lesebeskyttet.');
  setText(overviewTitleTarget, 'Mappestruktur');
  setText(overviewSubtitleTarget, 'Velg en mappe for å se oversikt.');
  renderSummary();
  renderArtifactCounts();
  renderFolderSignals();
  renderRecentFiles();
  renderWarnings();
  renderNoScanPanels();
};

const renderLoadingState = () => {
  setText(statusMessageTarget, 'Leser mappeinnhold...');
  setText(stateTitleTarget, 'Leser mappeinnhold');
  setText(stateMessageTarget, 'Ingen filer endres. Kun lesing.');
  setText(overviewTitleTarget, 'Leser mappeinnhold');
  setText(overviewSubtitleTarget, 'Sidekick inspiserer mappen uten å endre filer.');
  overviewEmptyTarget?.toggleAttribute('hidden', true);
  renderNoScanPanels();
};

const renderErrorState = (message: string) => {
  setText(statusMessageTarget, 'Feil ved åpning av mappe');
  setText(workspaceEntryErrorTarget, message);
  workspaceEntryErrorTarget?.toggleAttribute('hidden', false);
  setText(stateTitleTarget, 'Kan ikke åpne mappen');
  setText(stateMessageTarget, message);
  setText(overviewTitleTarget, 'Kan ikke åpne mappen');
  setText(overviewSubtitleTarget, 'Velg en annen mappe eller prøv igjen.');
  overviewEmptyTarget?.toggleAttribute('hidden', true);
  renderContextPackage();
  renderTranscriptionImport();
  renderTranscriptionSummaryBatch();
  renderDocumentRelationships();
  renderCodex();
  renderContextViewToggle();
  renderTree();
  renderProjectsView();
  renderWarnings([
    {
      path: '.',
      type: 'read-error',
      severity: 'error',
      message,
    },
  ]);
};

const renderReadyState = (scan: WorkspaceScan, status: 'ready' | 'partial') => {
  const newestFile = scan.summary.recentFiles[0];
  const hasWorkspaceContent = getChildren(scan.tree).length > 0;
  const liveRefreshMessage =
    workspaceWatchStatus?.rootPath === scan.rootPath &&
    workspaceWatchStatus.state !== 'watching'
      ? ` · ${workspaceWatchStatus.message}`
      : '';

  setText(selectedNameTarget, scan.rootName);
  setText(selectedPathTarget, scan.rootPath);
  setText(
    statusMessageTarget,
    `${scan.status === 'partial' ? 'Delvis skanning' : 'Skanning fullført'} · ${formatDate(
      scan.scannedAt,
    )}${liveRefreshMessage}`,
  );
  setText(stateTitleTarget, status === 'partial' ? 'Delvis oversikt' : 'Arbeidsområdeoversikt');
  setText(
    stateMessageTarget,
    newestFile
      ? `Sist endret: ${formatDate(newestFile.modifiedAt)}. Mappesignaler er tolkningshjelp.`
      : 'Mappesignaler er tolkningshjelp.',
  );
  setText(
    overviewTitleTarget,
    status === 'partial' ? 'Arbeidsområdeoversikt (delvis)' : 'Arbeidsområdeoversikt',
  );
  setText(
    overviewSubtitleTarget,
    hasWorkspaceContent
      ? 'Nøkkeltall, mappesignaler og nylig aktivitet i valgt arbeidsområde.'
      : 'Sidekick fant ingen filer eller undermapper i arbeidsområdet.',
  );
  overviewEmptyTarget?.toggleAttribute('hidden', hasWorkspaceContent);
  renderSummary(scan);
  renderArtifactCounts(scan);
  renderFolderSignals(scan);
  renderRecentFiles(scan);
  renderOverviewWarnings(scan);
  renderOverviewScanStatus(scan);
  renderOverviewContextPackageStatus(scan);
  renderSearchResults(scan);
  renderSelectedTreeContext(scan);
  renderContextPackage(scan);
  renderTranscriptionImport(scan);
  renderTranscriptionSummaryBatch(scan);
  renderDocumentRelationships(scan);
  renderCodex(scan);
  renderContextViewToggle(scan);
  renderTree(scan);
  renderProjectsView(scan);
};

const sourceLabel = (snapshot?: AppSettingsSnapshot) => {
  if (!snapshot) {
    return 'Ukjent';
  }

  if (snapshot.codexPathSource === 'environment') {
    return 'Miljøvariabel';
  }

  if (snapshot.codexPathSource === 'saved') {
    return 'Lagret innstilling';
  }

  return 'Automatisk søk';
};

const renderSettings = () => {
  workspaceViewTarget?.toggleAttribute('hidden', appView !== 'workspace');
  settingsViewTarget?.toggleAttribute('hidden', appView !== 'settings');
  openWorkspaceButton?.setAttribute('aria-current', appView === 'workspace' ? 'page' : 'false');
  openSettingsButton?.setAttribute('aria-current', appView === 'settings' ? 'page' : 'false');

  const snapshot = settingsState.snapshot;

  const rows: DetailRow[] = [
    ['Modus', sourceLabel(snapshot)],
    ['Effektiv sti', snapshot?.effectiveCodexPath ?? 'Automatisk søk'],
  ];

  if (snapshot?.warning) {
    rows.push(['Varsel', snapshot.warning]);
  }

  renderDetails(settingsCodexDetailsTarget, rows);
  setText(settingsMessageTarget, settingsState.message);

  const settingsBusy = settingsState.status === 'loading' || settingsState.status === 'saving' || settingsState.status === 'testing';
  const settingsAvailable = Boolean(window.sidekick);

  settingsCodexPathInput?.toggleAttribute('disabled', settingsBusy || !settingsAvailable);
  settingsChooseCodexButton?.toggleAttribute('disabled', settingsBusy || !settingsAvailable);
  settingsTestCodexButton?.toggleAttribute('disabled', settingsBusy || !settingsAvailable);
  settingsSaveCodexButton?.toggleAttribute('disabled', settingsBusy || !settingsAvailable);
  settingsResetCodexButton?.toggleAttribute('disabled', settingsBusy || !settingsAvailable);
};

const render = () => {
  const hasActiveWorkspace = state.status === 'ready' || state.status === 'partial';
  if (!hasActiveWorkspace) {
    activeWorkflow = null;
  }

  const isBusy =
    state.status === 'loading' ||
    workspaceCreationState.status === 'creating' ||
    workspaceInitializationState.status === 'choosing' ||
    workspaceInitializationState.status === 'initializing';
  const isEntryState = state.status === 'empty' || state.status === 'error';
  const hasActiveWorkflow = activeWorkflow !== null;
  const isNavigationBlocked = isBusy || hasActiveWorkflow || isExclusiveWorkflowActive();

  chooseFolderButtons.forEach((button) => {
    button.toggleAttribute('disabled', isNavigationBlocked || !window.sidekick);
  });
  openSettingsButton?.toggleAttribute('disabled', isNavigationBlocked);
  overviewGenerateContextButton?.toggleAttribute('disabled', !hasActiveWorkspace || isBusy || hasActiveWorkflow);
  overviewImportTranscriptionButton?.toggleAttribute('disabled', !hasActiveWorkspace || isBusy || hasActiveWorkflow);
  overviewDocumentRelationshipsButton?.toggleAttribute(
    'disabled',
    !hasActiveWorkspace || isBusy || hasActiveWorkflow,
  );
  overviewRunCodexButton?.toggleAttribute('disabled', !hasActiveWorkspace || isBusy || hasActiveWorkflow);
  appMainTarget?.classList.toggle('app-main--single', !hasActiveWorkspace);
  contextSurfaceTarget?.toggleAttribute('hidden', !hasActiveWorkspace);
  actionBarTarget?.toggleAttribute('hidden', !hasActiveWorkspace || appView === 'settings');
  workspaceDefaultTarget?.toggleAttribute('hidden', hasActiveWorkflow);
  workflowHostTarget?.toggleAttribute('hidden', !hasActiveWorkflow);
  workflowPanels.forEach((panel) => {
    panel.toggleAttribute('hidden', panel.dataset.workflowPanel !== activeWorkflow);
  });
  summaryStripTarget?.toggleAttribute('hidden', !hasActiveWorkspace);
  workspaceEntryTarget?.toggleAttribute('hidden', !isEntryState);
  stateBannerTarget?.toggleAttribute('hidden', isEntryState || hasActiveWorkspace);
  renderWorkspaceCreation();
  renderWorkspaceInitialization();
  renderSettings();

  switch (state.status) {
    case 'empty':
      renderEmptyState();
      break;
    case 'loading':
      renderLoadingState();
      break;
    case 'error':
      renderErrorState(state.message);
      break;
    case 'ready':
    case 'partial':
      renderReadyState(state.scan, state.status);
      break;
  }
};

const loadSettings = async () => {
  if (!window.sidekick) {
    settingsState = {
      status: 'error',
      message: 'Innstillinger er tilgjengelige i Electron-appen.',
    };
    render();
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'loading',
    message: 'Laster innstillinger.',
  };
  render();

  try {
    const snapshot = await window.sidekick.getSettings();
    if (settingsCodexPathInput) {
      settingsCodexPathInput.value = snapshot.settings.sidekick_codex_path ?? '';
    }
    settingsState = {
      status: 'idle',
      snapshot,
      message: snapshot.warning ?? 'Innstillinger lastet.',
    };
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke laste innstillinger.',
    };
  }

  render();
};

const openSettings = () => {
  if (activeWorkflow) {
    return;
  }

  appView = 'settings';
  render();
  void loadSettings();
};

const openWorkspace = () => {
  appView = 'workspace';
  render();
};

const currentSettingsCodexPath = () => settingsCodexPathInput?.value.trim() || null;

const chooseCodexPath = async () => {
  if (!window.sidekick) {
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'loading',
    message: 'Velg Codex CLI-programfil.',
  };
  render();

  try {
    const codexPath = await window.sidekick.chooseCodexPath();

    if (codexPath && settingsCodexPathInput) {
      settingsCodexPathInput.value = codexPath;
      settingsState = {
        ...settingsState,
        status: 'idle',
        message: 'Sti valgt. Test eller lagre innstillingen.',
      };
    } else {
      settingsState = {
        ...settingsState,
        status: 'idle',
        message: 'Ingen sti valgt.',
      };
    }
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke velge Codex-sti.',
    };
  }

  render();
};

const applyCodexSettingsResult = (snapshot: AppSettingsSnapshot, message: string) => {
  if (settingsCodexPathInput) {
    settingsCodexPathInput.value = snapshot.settings.sidekick_codex_path ?? '';
  }

  settingsState = {
    status: 'idle',
    snapshot,
    message,
  };

  const scan = getActiveScan();

  if (scan) {
    void refreshCodexStatus(scan);
  }
};

const saveCodexPath = async () => {
  if (!window.sidekick) {
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'saving',
    message: 'Lagrer Codex-sti.',
  };
  render();

  try {
    const snapshot = await window.sidekick.saveCodexPath(currentSettingsCodexPath());
    applyCodexSettingsResult(snapshot, 'Codex-sti lagret.');
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke lagre Codex-sti.',
    };
  }

  render();
};

const resetCodexPath = async () => {
  if (!window.sidekick) {
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'saving',
    message: 'Tilbakestiller Codex-sti.',
  };
  render();

  try {
    const snapshot = await window.sidekick.resetCodexPath();
    applyCodexSettingsResult(snapshot, 'Codex-sti tilbakestilt til automatisk søk.');
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke tilbakestille Codex-sti.',
    };
  }

  render();
};

const testCodexPath = async () => {
  if (!window.sidekick) {
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'testing',
    message: 'Tester Codex-sti.',
  };
  render();

  try {
    const result: CodexPathTestResult = await window.sidekick.testCodexPath(
      currentSettingsCodexPath(),
    );
    settingsState = {
      ...settingsState,
      status: result.ok ? 'idle' : 'error',
      message: result.message,
    };
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke teste Codex-sti.',
    };
  }

  render();
};

const openContextPackageConfirmation = async () => {
  const scan = getActiveScan();

  if (!window.sidekick || !scan) {
    contextPackageState = { status: 'unavailable' };
    render();
    return;
  }

  contextPackageState = { status: 'previewing' };
  render();

  try {
    const preview =
      contextPackageTarget.scope === 'folder'
        ? window.sidekick.previewFolderContextPackage
          ? await window.sidekick.previewFolderContextPackage({
              rootPath: scan.rootPath,
              folderRelativePath: contextPackageTarget.folderRelativePath,
            })
          : (() => {
              throw new Error('Folder-scoped context packages are not available.');
            })()
        : await window.sidekick.previewContextPackage(scan.rootPath);
    contextPackageState = { status: 'confirming', preview };
  } catch (error) {
    contextPackageState = {
      status: 'error',
      phase: 'preview',
      message: error instanceof Error ? error.message : 'Unable to prepare context package.',
    };
  }

  render();
};

const generateContextPackage = async () => {
  const scan = getActiveScan();

  if (!window.sidekick || !scan || contextPackageState.status !== 'confirming') {
    return;
  }

  const { preview } = contextPackageState;
  contextPackageState = { status: 'generating', preview };
  render();

  try {
    const result =
      preview.scope === 'folder'
        ? window.sidekick.generateFolderContextPackage
          ? await window.sidekick.generateFolderContextPackage({
              rootPath: scan.rootPath,
              folderRelativePath: preview.targetRelativePath,
            })
          : (() => {
              throw new Error('Folder-scoped context packages are not available.');
            })()
        : await window.sidekick.generateContextPackage(scan.rootPath);
    const preferredSelectedPath =
      result.scope === 'folder' ? result.targetRelativePath : selectedTreePath;
    const selectedPathAfterScan = getNodeByPath(result.scan.tree, preferredSelectedPath)
      ? preferredSelectedPath
      : getNodeByPath(result.scan.tree, selectedTreePath)
      ? selectedTreePath
      : result.scan.tree.relativePath;
    state =
      result.scan.status === 'partial'
        ? { status: 'partial', scan: result.scan }
        : { status: 'ready', scan: result.scan };
    selectedTreePath = selectedPathAfterScan;
    focusedTreePath = selectedPathAfterScan;
    expandedPaths = new Set([
      ...expandedPaths,
      ROOT_PATH,
      ...getPathAncestors(result.scan, selectedPathAfterScan).map((node) => node.relativePath),
    ]);
    setTranscriptionImportStateForScan(result.scan);
    setTranscriptionSummaryBatchStateForScan(result.scan);
    setDocumentRelationshipsStateForScan(result.scan);
    setSearchStateForScan(result.scan);
    contextPackageState = { status: 'complete', result };
    if (result.scope === 'workspace') {
      if (result.workspaceSummary) {
        workspaceInfoState = {
          rootPath: result.scan.rootPath,
          snapshot:
            result.workspaceSummary.workspaceInfo ??
            result.workspaceSummary.previousWorkspaceInfo ?? {
              status: 'missing',
              path: '',
            },
          message:
            result.workspaceSummary.status === 'failed' ? result.workspaceSummary.message : undefined,
        };
      }
      overviewContextPackageStatus = {
        status: 'exists',
        rootPath: result.scan.rootPath,
        outputFileName: result.outputFileName,
      };
    }
    void refreshDocumentRelationships(result.scan);
    void refreshCodexStatus(result.scan);
    void refreshSearchIndexStatus(result.scan);
  } catch (error) {
    contextPackageState = {
      status: 'error',
      phase: 'generation',
      message: error instanceof Error ? error.message : 'Unable to generate context package.',
    };
  }

  render();
};

const handleContextPackagePrimary = () => {
  if (contextPackageState.status === 'confirming') {
    void generateContextPackage();
    return;
  }

  void openContextPackageConfirmation();
};

const openTranscriptionImportConfirmation = async () => {
  const scan = getActiveScan();

  if (!window.sidekick || !scan) {
    transcriptionImportState = { status: 'unavailable' };
    render();
    return;
  }

  transcriptionImportState = { status: 'previewing' };
  render();

  try {
    const preview = await window.sidekick.previewTranscriptionImport(scan.rootPath);
    transcriptionImportState = preview ? { status: 'confirming', preview } : { status: 'ready' };
  } catch (error) {
    transcriptionImportState = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to prepare transcription import.',
    };
  }

  render();
};

const importTranscription = async () => {
  if (!window.sidekick || transcriptionImportState.status !== 'confirming') {
    return;
  }

  const { preview } = transcriptionImportState;
  transcriptionImportState = { status: 'importing', preview };
  render();

  try {
    const result = await window.sidekick.confirmTranscriptionImport(preview.previewId);
    const nextState =
      result.scan.status === 'partial'
        ? ({ status: 'partial', scan: result.scan } satisfies ViewState)
        : ({ status: 'ready', scan: result.scan } satisfies ViewState);
    state = nextState;
    expandedPaths = new Set([...expandedPaths, ROOT_PATH, result.targetFolderRelativePath]);
    const importedRelativePath = `${result.targetFolderRelativePath}/${result.destinationFileName}`;
    const importedNode = getNodeByPath(result.scan.tree, importedRelativePath);
    // After a successful import, focus the new file when the rescan can find it;
    // otherwise keep the user on the target folder that changed.
    selectedTreePath = importedNode ? importedRelativePath : result.targetFolderRelativePath;
    focusedTreePath = selectedTreePath;
    transcriptionSummaryState =
      result.summary.status === 'complete'
        ? {
            status: 'loaded',
            rootPath: result.rootPath,
            transcriptionRelativePath: importedRelativePath,
            summary: result.summary.summary,
          }
        : { status: 'idle' };
    setContextPackageStateForScan(result.scan);
    setOverviewContextPackageStatusForScan(result.scan);
    setTranscriptionSummaryBatchStateForScan(result.scan);
    setDocumentRelationshipsStateForScan(result.scan);
    setSearchStateForScan(result.scan);
    transcriptionImportState = { status: 'complete', result };
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshDocumentRelationships(result.scan);
    void refreshSearchIndexStatus(result.scan);
  } catch (error) {
    transcriptionImportState = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to import transcription.',
    };
  }

  render();
};

const handleTranscriptionImportPrimary = () => {
  if (transcriptionImportState.status === 'confirming') {
    void importTranscription();
    return;
  }

  void openTranscriptionImportConfirmation();
};

const openTranscriptionSummaryBatchPreview = async () => {
  const scan = getActiveScan();

  if (!window.sidekick?.previewTranscriptionSummaryBatch || !scan) {
    transcriptionSummaryBatchState = { status: 'unavailable' };
    render();
    return;
  }

  transcriptionSummaryBatchState = { status: 'previewing' };
  render();

  try {
    const preview = await window.sidekick.previewTranscriptionSummaryBatch(scan.rootPath);
    transcriptionSummaryBatchState = { status: 'confirming', preview };
  } catch (error) {
    transcriptionSummaryBatchState = {
      status: 'error',
      phase: 'preview',
      message: error instanceof Error ? error.message : 'Kunne ikke forberede sammendrag.',
    };
  }

  render();
};

const generateTranscriptionSummaryBatch = async () => {
  const scan = getActiveScan();

  if (
    !window.sidekick?.confirmTranscriptionSummaryBatch ||
    !scan ||
    transcriptionSummaryBatchState.status !== 'confirming'
  ) {
    return;
  }

  const { preview } = transcriptionSummaryBatchState;
  transcriptionSummaryBatchState = { status: 'generating', preview };
  render();

  try {
    const result = await window.sidekick.confirmTranscriptionSummaryBatch(preview.previewId);
    const selectedPathAfterScan = getNodeByPath(result.scan.tree, preview.targetFolderRelativePath)
      ? preview.targetFolderRelativePath
      : getNodeByPath(result.scan.tree, selectedTreePath)
        ? selectedTreePath
        : result.scan.tree.relativePath;

    state =
      result.scan.status === 'partial'
        ? { status: 'partial', scan: result.scan }
        : { status: 'ready', scan: result.scan };
    selectedTreePath = selectedPathAfterScan;
    focusedTreePath = selectedPathAfterScan;
    expandedPaths = new Set([
      ...expandedPaths,
      ROOT_PATH,
      ...getPathAncestors(result.scan, selectedPathAfterScan).map((node) => node.relativePath),
    ]);
    transcriptionSummaryState = { status: 'idle' };
    setContextPackageStateForScan(result.scan);
    setOverviewContextPackageStatusForScan(result.scan);
    setTranscriptionImportStateForScan(result.scan);
    setDocumentRelationshipsStateForScan(result.scan);
    setSearchStateForScan(result.scan);
    transcriptionSummaryBatchState = { status: 'complete', result };
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshDocumentRelationships(result.scan);
    void refreshCodexStatus(result.scan);
    void refreshSearchIndexStatus(result.scan);
  } catch (error) {
    transcriptionSummaryBatchState = {
      status: 'error',
      phase: 'generation',
      message: error instanceof Error ? error.message : 'Kunne ikke generere sammendrag.',
    };
  }

  render();
};

const handleTranscriptionSummaryBatchPrimary = () => {
  if (transcriptionSummaryBatchState.status === 'confirming') {
    void generateTranscriptionSummaryBatch();
    return;
  }

  void openTranscriptionSummaryBatchPreview();
};

const generateDocumentRelationships = async () => {
  const scan = getActiveScan();

  if (!window.sidekick || !scan) {
    documentRelationshipsState = { status: 'unavailable' };
    render();
    return;
  }

  const previousReport = getCurrentDocumentRelationshipsSnapshot(scan);
  documentRelationshipsState = {
    status: 'generating',
    rootPath: scan.rootPath,
    previousReport: previousReport?.status === 'complete' ? previousReport : undefined,
  };
  render();

  try {
    const result = await window.sidekick.generateDocumentRelationships(scan.rootPath);
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== scan.rootPath) {
      return;
    }

    if (result.status === 'complete' && result.contextPackage) {
      const selectedPathAfterScan = getNodeByPath(result.contextPackage.scan.tree, selectedTreePath)
        ? selectedTreePath
        : result.contextPackage.scan.tree.relativePath;
      state =
        result.contextPackage.scan.status === 'partial'
          ? { status: 'partial', scan: result.contextPackage.scan }
          : { status: 'ready', scan: result.contextPackage.scan };
      selectedTreePath = selectedPathAfterScan;
      focusedTreePath = selectedPathAfterScan;
      setContextPackageStateForScan(result.contextPackage.scan);
      setTranscriptionImportStateForScan(result.contextPackage.scan);
      setTranscriptionSummaryBatchStateForScan(result.contextPackage.scan);
      overviewContextPackageStatus = {
        status: 'exists',
        rootPath: result.contextPackage.scan.rootPath,
        outputFileName: result.contextPackage.outputFileName,
      };
      documentRelationshipsState = {
        status: 'complete',
        rootPath: result.contextPackage.scan.rootPath,
        result,
      };
      void refreshCodexStatus(result.contextPackage.scan);
    } else {
      documentRelationshipsState = {
        status: 'failed',
        rootPath: scan.rootPath,
        message: result.message ?? 'Kunne ikke analysere sammenhenger.',
        previousReport: result.previousReport,
      };
    }
  } catch (error) {
    documentRelationshipsState = {
      status: 'failed',
      rootPath: scan.rootPath,
      message: error instanceof Error ? error.message : 'Kunne ikke analysere sammenhenger.',
      previousReport: previousReport?.status === 'complete' ? previousReport : undefined,
    };
  }

  render();
};

const handleDocumentRelationshipsPrimary = () => {
  void generateDocumentRelationships();
};

const refreshCodexStatus = async (scan: WorkspaceScan) => {
  if (!window.sidekick) {
    codexState = { status: 'unavailable', message: 'Åpne Sidekick i Electron for å bruke Codex.' };
    render();
    return;
  }

  codexState = { status: 'checking' };
  render();

  try {
    const codexStatus = await window.sidekick.getCodexStatus(scan.rootPath);

    if (codexStatus.state === 'ready') {
      codexState = { status: 'ready', codexStatus };
    } else if (codexStatus.state === 'logged-out') {
      codexState = { status: 'logged-out', codexStatus };
    } else {
      codexState = {
        status: 'unavailable',
        message:
          codexStatus.message ??
          'Codex CLI ble ikke funnet. Installer Codex CLI eller sett en Codex-sti i innstillingene.',
      };
    }
  } catch (error) {
    codexState = {
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Kunne ikke sjekke Codex-status.',
    };
  }

  render();
};

const startCodexLogin = async (scan: WorkspaceScan) => {
  if (!window.sidekick) {
    return;
  }

  try {
    const { runId } = await window.sidekick.startCodexLogin(scan.rootPath);
    codexState = { status: 'running', runId, mode: 'login', output: [] };
  } catch (error) {
    codexState = {
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Kunne ikke starte Codex-innlogging.',
    };
  }

  render();
};

const startCodexRun = async (scan: WorkspaceScan) => {
  if (!window.sidekick || !codexPromptInput) {
    return;
  }

  const prompt = codexPromptInput.value.trim();

  if (!prompt) {
    codexState = {
      status: 'failed',
      completion: {
        runId: 'not-started',
        state: 'failed',
        mode: 'read-only',
        exitCode: null,
        signal: null,
        message: 'Skriv en instruksjon før du kjører Codex.',
        createdAt: new Date().toISOString(),
      },
      output: [],
    };
    render();
    return;
  }

  const mode: CodexRunMode = codexEditModeInput?.checked ? 'workspace-write' : 'read-only';

  try {
    const { runId } = await window.sidekick.startCodexRun({
      rootPath: scan.rootPath,
      prompt,
      mode,
    });
    codexState = { status: 'running', runId, mode, output: [] };
  } catch (error) {
    codexState = {
      status: 'failed',
      completion: {
        runId: 'not-started',
        state: 'failed',
        mode,
        exitCode: null,
        signal: null,
        message: error instanceof Error ? error.message : 'Kunne ikke starte Codex.',
        createdAt: new Date().toISOString(),
      },
      output: [],
    };
  }

  render();
};

const handleCodexPrimary = () => {
  const scan = getActiveScan();

  if (!scan) {
    return;
  }

  if (codexState.status === 'logged-out') {
    void startCodexLogin(scan);
    return;
  }

  void startCodexRun(scan);
};

const cancelCodexRun = async () => {
  if (!window.sidekick || codexState.status !== 'running') {
    return;
  }

  try {
    await window.sidekick.cancelCodexRun(codexState.runId);
  } catch (error) {
    const completion: CodexCompletionEvent = {
      runId: codexState.runId,
      state: 'failed',
      mode: codexState.mode,
      exitCode: null,
      signal: null,
      message: error instanceof Error ? error.message : 'Kunne ikke avbryte Codex.',
      createdAt: new Date().toISOString(),
    };
    codexState = { status: 'failed', completion, output: codexState.output };
    render();
  }
};

const appendCodexOutput = (event: CodexOutputEvent) => {
  if (codexState.status !== 'running' || codexState.runId !== event.runId) {
    return;
  }

  codexState = {
    ...codexState,
    output: [...codexState.output, event],
  };
  render();
};

const completeCodexRun = (completion: CodexCompletionEvent) => {
  if (codexState.status !== 'running' || codexState.runId !== completion.runId) {
    return;
  }

  if (completion.scan) {
    // Main sends a scan only for completed edit-mode runs, because those are the
    // Codex runs that may have changed files on disk.
    state =
      completion.scan.status === 'partial'
        ? { status: 'partial', scan: completion.scan }
        : { status: 'ready', scan: completion.scan };
      setContextPackageStateForScan(completion.scan);
      setOverviewContextPackageStatusForScan(completion.scan);
      setTranscriptionImportStateForScan(completion.scan);
      setTranscriptionSummaryBatchStateForScan(completion.scan);
      setDocumentRelationshipsStateForScan(completion.scan);
      setSearchStateForScan(completion.scan);
      void refreshOverviewContextPackageStatus(completion.scan);
      void refreshDocumentRelationships(completion.scan);
      void refreshSearchIndexStatus(completion.scan);
  }

  const output = codexState.output;
  codexState = {
    status: completion.state,
    completion,
    output,
  };
  render();

  if (completion.mode === 'login' && completion.state === 'completed') {
    const scan = getActiveScan();

    if (scan) {
      void refreshCodexStatus(scan);
    }
  }
};

const chooseFolder = async () => {
  if (activeWorkflow) {
    return;
  }

  if (!window.sidekick) {
    state = { status: 'error', message: 'Local folder inspection is available in the Electron app.' };
    render();
    return;
  }

  state = { status: 'loading' };
  render();

  try {
    const scan = await window.sidekick.chooseWorkspaceFolder();

    if (!scan) {
      expandedPaths = new Set();
      setContextPackageStateForScan();
      setOverviewContextPackageStatusForScan();
      setTranscriptionImportStateForScan();
      setTranscriptionSummaryBatchStateForScan();
      setDocumentRelationshipsStateForScan();
      setSearchStateForScan();
      setCodexStateForScan();
      state = { status: 'empty' };
      render();
      return;
    }

    setActiveScan(scan);
    render();
    void refreshOverviewContextPackageStatus(scan);
    void refreshCodexStatus(scan);
  } catch (error) {
    expandedPaths = new Set();
    setContextPackageStateForScan();
    setOverviewContextPackageStatusForScan();
    setTranscriptionImportStateForScan();
    setTranscriptionSummaryBatchStateForScan();
    setDocumentRelationshipsStateForScan();
    setSearchStateForScan();
    setCodexStateForScan();
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to inspect the selected folder.',
    };
    render();
  }
};

const chooseWorkspaceFolderForInitialization = async () => {
  if (!window.sidekick) {
    workspaceInitializationState = {
      status: 'error',
      message: 'Arbeidsområdeinitialisering er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  workspaceInitializationState = {
    status: 'choosing',
    message: 'Velg mappen som skal brukes som Sidekick-arbeidsområde.',
  };
  render();

  try {
    const preview = await window.sidekick.chooseWorkspaceFolderForInitialization();

    if (!preview) {
      workspaceInitializationState = { status: 'idle', message: '' };
      render();
      return;
    }

    const missingCount = preview.requiredFolders.filter((folder) => folder.status === 'missing').length;
    workspaceInitializationState = {
      status: 'preview',
      preview,
      message:
        missingCount > 0
          ? 'Kontroller mappen før Sidekick oppretter manglende standardmapper.'
          : 'Kontroller mappen før Sidekick bruker den som aktivt arbeidsområde.',
    };
  } catch (error) {
    workspaceInitializationState = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke kontrollere arbeidsområdet.',
    };
  }

  render();
};

const cancelWorkspaceInitialization = () => {
  if (workspaceInitializationState.status === 'initializing') {
    return;
  }

  workspaceInitializationState = { status: 'idle', message: '' };
  render();
  initializeWorkspaceButton?.focus();
};

const confirmWorkspaceInitialization = async () => {
  if (
    !window.sidekick ||
    (workspaceInitializationState.status !== 'preview' &&
      workspaceInitializationState.status !== 'error')
  ) {
    return;
  }

  const previousState = state;
  const { preview } = workspaceInitializationState;

  if (!preview) {
    return;
  }

  workspaceInitializationState = {
    status: 'initializing',
    preview,
    message: 'Initialiserer arbeidsområde.',
  };
  state = { status: 'loading' };
  render();

  try {
    const result = await window.sidekick.confirmWorkspaceInitialization(preview.previewId);
    setActiveScan(result.scan);
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshCodexStatus(result.scan);
    workspaceInitializationState = {
      status: 'complete',
      result,
      message: `${result.rootName} er valgt som Sidekick-arbeidsområde.`,
    };
    render();
  } catch (error) {
    workspaceInitializationState = {
      status: 'error',
      preview,
      message: error instanceof Error ? error.message : 'Kunne ikke initialisere arbeidsområdet.',
    };
    state = previousState;
    render();
  }
};

const openWorkspaceCreateDialog = () => {
  workspaceNameTouched = false;
  workspaceCreationState = {
    status: 'editing',
    message: '',
    parentPath: workspaceCreationState.parentPath,
  };
  render();
  workspaceNameInput?.focus();
};

const closeWorkspaceCreateDialog = () => {
  if (workspaceCreationState.status === 'creating') {
    return;
  }

  workspaceCreationState = {
    status: 'closed',
    message: '',
    parentPath: workspaceCreationState.parentPath,
  };
  render();
  openCreateWorkspaceButton?.focus();
};

const getWorkspaceDialogFocusableElements = () =>
  Array.from(
    workspaceCreateDialogTarget?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null);

const chooseWorkspaceParentFolder = async () => {
  if (!window.sidekick) {
    workspaceCreationState = {
      ...workspaceCreationState,
      status: 'error',
      message: 'Arbeidsområdeopprettelse er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  workspaceCreationState = {
    ...workspaceCreationState,
    status: 'selecting-parent',
    message: 'Velg hvor arbeidsområdet skal opprettes.',
  };
  render();

  try {
    const parentPath = await window.sidekick.chooseWorkspaceParentFolder();

    workspaceCreationState = {
      status: 'editing',
      message: parentPath ? '' : 'Ingen plassering valgt.',
      parentPath: parentPath ?? workspaceCreationState.parentPath,
    };
  } catch (error) {
    workspaceCreationState = {
      ...workspaceCreationState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke velge plassering.',
    };
  }

  render();
};

const createWorkspace = async () => {
  if (!window.sidekick) {
    workspaceCreationState = {
      ...workspaceCreationState,
      status: 'error',
      message: 'Arbeidsområdeopprettelse er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  const workspaceName = workspaceNameInput?.value ?? '';
  const validationMessage = getWorkspaceNameValidationMessage(workspaceName);

  if (validationMessage || !workspaceCreationState.parentPath) {
    workspaceNameTouched = true;
    workspaceCreationState = {
      ...workspaceCreationState,
      status: 'error',
      message: validationMessage || 'Velg hvor arbeidsområdet skal opprettes.',
    };
    render();
    return;
  }

  const previousState = state;
  const parentPath = workspaceCreationState.parentPath;
  workspaceCreationState = { status: 'creating', message: 'Oppretter arbeidsområde.', parentPath };
  state = { status: 'loading' };
  render();

  try {
    const result: WorkspaceCreationResult | null = await window.sidekick.createWorkspaceFolder({
      workspaceName,
      parentPath,
    });

    if (!result) {
      workspaceCreationState = { status: 'editing', message: '', parentPath };
      state = previousState;
      render();
      return;
    }

    if (workspaceNameInput) {
      workspaceNameInput.value = '';
    }

    setActiveScan(result.scan);
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshCodexStatus(result.scan);
    workspaceCreationState = {
      status: 'closed',
      message: `Opprettet ${result.rootName}.`,
      parentPath,
    };
    render();
  } catch (error) {
    workspaceCreationState = {
      ...workspaceCreationState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke opprette arbeidsområde.',
    };
    state = previousState;
    render();
  }
};

if (window.sidekick) {
  window.sidekick.getAppInfo().then((info) => {
    setText(appInfoTarget, `${info.name} ${info.version} / ${info.platform}`);
  });
} else {
  setText(appInfoTarget, 'Browser preview');
}

chooseFolderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    void chooseFolder();
  });
});

initializeWorkspaceButton?.addEventListener('click', () => {
  void chooseWorkspaceFolderForInitialization();
});
workspaceInitializationConfirmButton?.addEventListener('click', () => {
  void confirmWorkspaceInitialization();
});
workspaceInitializationCancelButton?.addEventListener('click', cancelWorkspaceInitialization);
openCreateWorkspaceButton?.addEventListener('click', openWorkspaceCreateDialog);
workspaceCreateCancelButtons.forEach((button) => {
  button.addEventListener('click', closeWorkspaceCreateDialog);
});
chooseWorkspaceParentButton?.addEventListener('click', () => {
  void chooseWorkspaceParentFolder();
});
workspaceNameInput?.addEventListener('input', () => {
  workspaceNameTouched = true;
  render();
});
workspaceCreateDialogTarget?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target === workspaceNameInput && !createWorkspaceButton?.disabled) {
    event.preventDefault();
    void createWorkspace();
  }

  if (event.key !== 'Tab') {
    return;
  }

  // The create-workspace surface behaves as a lightweight modal; keep tab focus
  // inside it until the user cancels or creates the workspace.
  const focusableElements = getWorkspaceDialogFocusableElements();
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (!firstElement || !lastElement) {
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && workspaceCreationState.status !== 'closed') {
    event.preventDefault();
    closeWorkspaceCreateDialog();
  }
});
document.addEventListener('keydown', handleGlobalTreeKeyDown);

openSettingsButton?.addEventListener('click', openSettings);
openWorkspaceButton?.addEventListener('click', openWorkspace);
closeSettingsButton?.addEventListener('click', openWorkspace);
settingsChooseCodexButton?.addEventListener('click', () => {
  void chooseCodexPath();
});
settingsTestCodexButton?.addEventListener('click', () => {
  void testCodexPath();
});
settingsSaveCodexButton?.addEventListener('click', () => {
  void saveCodexPath();
});
settingsResetCodexButton?.addEventListener('click', () => {
  void resetCodexPath();
});

createWorkspaceButton?.addEventListener('click', () => {
  void createWorkspace();
});

expandAllButton?.addEventListener('click', expandAllFolders);
collapseAllButton?.addEventListener('click', collapseAllFolders);
contextViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const viewId = button.dataset.contextViewButton as ContextViewId | undefined;
    if (viewId === 'folders' || viewId === 'projects') {
      selectContextView(viewId);
    }
  });
});
searchQueryInput?.addEventListener('input', scheduleSearch);
searchRefreshButton?.addEventListener('click', () => {
  void refreshSearchIndex();
});
contextPackagePrimaryButton?.addEventListener('click', handleContextPackagePrimary);
overviewGenerateContextButton?.addEventListener('click', () => {
  openWorkspaceContextPackageWorkflow();
});
contextPackageSecondaryButton?.addEventListener('click', () => {
  closeActiveWorkflow();
});
transcriptionImportPrimaryButton?.addEventListener('click', handleTranscriptionImportPrimary);
overviewImportTranscriptionButton?.addEventListener('click', () => {
  openWorkflow('transcription-import');
});
transcriptionImportSecondaryButton?.addEventListener('click', () => {
  closeActiveWorkflow();
});
transcriptionSummaryBatchPrimaryButton?.addEventListener(
  'click',
  handleTranscriptionSummaryBatchPrimary,
);
transcriptionSummaryBatchSecondaryButton?.addEventListener('click', () => {
  closeActiveWorkflow();
});
documentRelationshipsPrimaryButton?.addEventListener('click', handleDocumentRelationshipsPrimary);
overviewDocumentRelationshipsButton?.addEventListener('click', () => {
  openWorkflow('document-relationships');
});
documentRelationshipsSecondaryButton?.addEventListener('click', () => {
  closeActiveWorkflow();
});
codexEditModeInput?.addEventListener('change', () => {
  render();
});
codexPrimaryButton?.addEventListener('click', handleCodexPrimary);
overviewRunCodexButton?.addEventListener('click', () => {
  openWorkflow('codex');
});
codexSecondaryButton?.addEventListener('click', () => {
  if (codexState.status === 'running') {
    void cancelCodexRun();
    return;
  }

  closeActiveWorkflow();
});

window.sidekick?.onCodexOutput?.(appendCodexOutput);
window.sidekick?.onCodexCompletion?.(completeCodexRun);
window.sidekick?.onSearchIndexStatus?.(handleSearchIndexStatus);
window.sidekick?.onWorkspaceWatchStatus?.(handleWorkspaceWatchStatus);
window.sidekick?.onWorkspaceScanUpdated?.(handleWorkspaceScanUpdated);

render();
