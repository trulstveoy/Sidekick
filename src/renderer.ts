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
  FolderSignal,
  FolderTreeNode,
  AppSettingsSnapshot,
  ProjectCreationResult,
  ProjectFolderScan,
  ProjectInfoSnapshot,
  ProjectInitializationPreview,
  ProjectInitializationResult,
  ScanWarning,
  TranscriptionImportPreview,
  TranscriptionImportResult,
} from './shared/sidekick-api';

type ViewState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'ready'; scan: ProjectFolderScan }
  | { status: 'partial'; scan: ProjectFolderScan }
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

type ProjectCreationState =
  | { status: 'closed'; message: string; parentPath: string | null }
  | { status: 'editing'; message: string; parentPath: string | null }
  | { status: 'selecting-parent'; message: string; parentPath: string | null }
  | { status: 'creating'; message: string; parentPath: string | null }
  | { status: 'complete'; message: string; parentPath: string | null }
  | { status: 'error'; message: string; parentPath: string | null };

type ProjectInitializationState =
  | { status: 'idle'; message: string }
  | { status: 'choosing'; message: string }
  | { status: 'preview'; message: string; preview: ProjectInitializationPreview }
  | { status: 'initializing'; message: string; preview: ProjectInitializationPreview }
  | { status: 'complete'; message: string; result: ProjectInitializationResult }
  | { status: 'error'; message: string; preview?: ProjectInitializationPreview };

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

type DetailRow = [string, string];

type VisibleTreeEntry = {
  node: FolderTreeNode;
  level: number;
  parentPath?: string;
};

type AppView = 'workspace' | 'settings';
type ActiveWorkflow = 'context-package' | 'transcription-import' | 'codex' | null;

type SettingsState =
  | { status: 'idle'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'loading'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'saving'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'testing'; snapshot?: AppSettingsSnapshot; message: string }
  | { status: 'error'; snapshot?: AppSettingsSnapshot; message: string };

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
const projectEntryTarget = document.querySelector<HTMLElement>('[data-project-entry]');
const projectEntryErrorTarget = document.querySelector<HTMLElement>('[data-project-entry-error]');
const chooseFolderButtons = document.querySelectorAll<HTMLButtonElement>('[data-choose-folder]');
const initializeProjectButton = document.querySelector<HTMLButtonElement>('[data-initialize-project]');
const projectInitializationPanelTarget = document.querySelector<HTMLElement>(
  '[data-project-initialization-panel]',
);
const projectInitializationTitleTarget = document.querySelector<HTMLElement>(
  '[data-project-initialization-title]',
);
const projectInitializationMessageTarget = document.querySelector<HTMLElement>(
  '[data-project-initialization-message]',
);
const projectInitializationDetailsTarget = document.querySelector<HTMLElement>(
  '[data-project-initialization-details]',
);
const projectInitializationWarningsTarget = document.querySelector<HTMLUListElement>(
  '[data-project-initialization-warnings]',
);
const projectInitializationConfirmButton = document.querySelector<HTMLButtonElement>(
  '[data-project-initialization-confirm]',
);
const projectInitializationCancelButton = document.querySelector<HTMLButtonElement>(
  '[data-project-initialization-cancel]',
);
const openCreateProjectButton = document.querySelector<HTMLButtonElement>('[data-open-create-project]');
const projectCreateDialogTarget = document.querySelector<HTMLElement>('[data-project-create-dialog]');
const projectCreateCancelButtons = document.querySelectorAll<HTMLButtonElement>(
  '[data-project-create-cancel]',
);
const projectNameInput = document.querySelector<HTMLInputElement>('[data-project-name]');
const projectNameMessageTarget = document.querySelector<HTMLElement>('[data-project-name-message]');
const projectParentPathTarget = document.querySelector<HTMLElement>('[data-project-parent-path]');
const chooseProjectParentButton = document.querySelector<HTMLButtonElement>(
  '[data-choose-project-parent]',
);
const projectTargetPreviewTarget = document.querySelector<HTMLElement>(
  '[data-project-target-preview]',
);
const createProjectButton = document.querySelector<HTMLButtonElement>('[data-create-project]');
const createProjectMessageTarget = document.querySelector<HTMLElement>(
  '[data-create-project-message]',
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
const selectionContentsTarget = document.querySelector<HTMLElement>('[data-selection-contents]');
const overviewGenerateContextButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-generate-context]',
);
const overviewImportTranscriptionButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-import-transcription]',
);
const overviewRunCodexButton = document.querySelector<HTMLButtonElement>(
  '[data-overview-action-run-codex]',
);
const treeToolbarTarget = document.querySelector<HTMLElement>('[data-tree-toolbar]');
const treeTarget = document.querySelector<HTMLOListElement>('[data-folder-tree]');
const expandAllButton = document.querySelector<HTMLButtonElement>('[data-expand-all]');
const collapseAllButton = document.querySelector<HTMLButtonElement>('[data-collapse-all]');
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
let contextPackageState: ContextPackageState = { status: 'unavailable' };
let overviewContextPackageStatus: OverviewContextPackageStatus = { status: 'unavailable' };
let transcriptionImportState: TranscriptionImportState = { status: 'unavailable' };
let projectCreationState: ProjectCreationState = {
  status: 'closed',
  message: '',
  parentPath: null,
};
let projectInitializationState: ProjectInitializationState = {
  status: 'idle',
  message: '',
};
let projectNameTouched = false;
let codexState: CodexState = { status: 'unavailable', message: 'Choose a folder first.' };
let appView: AppView = 'workspace';
let activeWorkflow: ActiveWorkflow = null;
let settingsState: SettingsState = { status: 'idle', message: '' };
let projectInfoState: { rootPath: string; snapshot: ProjectInfoSnapshot; message?: string } | null =
  null;

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

const isOverviewContextPackageStatusForScan = (scan: ProjectFolderScan) =>
  overviewContextPackageStatus.status !== 'unavailable' &&
  overviewContextPackageStatus.status !== 'unknown' &&
  overviewContextPackageStatus.rootPath === scan.rootPath;

const contextPackageStatusText = (scan?: ProjectFolderScan) => {
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

const overviewWarningCount = (scan: ProjectFolderScan) => {
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

const getTranscriptionFolderLabel = (scan: ProjectFolderScan) => {
  const folders = findNodesByFolderSignal(scan.tree, 'transcript');

  if (folders.length === 1) {
    return folders[0].relativePath;
  }

  if (folders.length > 1) {
    return 'Flere mulige transkripsjonsmapper';
  }

  return 'Ingen transkripsjonsmappe funnet';
};

const overviewWarnings = (scan?: ProjectFolderScan) => {
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
    warnings.unshift('Skanningen er delvis. Se prosjektmappen manuelt ved behov.');
  }

  return warnings;
};

const setContextPackageStateForScan = (scan?: ProjectFolderScan) => {
  contextPackageState = scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setOverviewContextPackageStatusForScan = (scan?: ProjectFolderScan) => {
  overviewContextPackageStatus = scan && window.sidekick
    ? { status: 'checking', rootPath: scan.rootPath }
    : { status: 'unavailable' };
};

const setTranscriptionImportStateForScan = (scan?: ProjectFolderScan) => {
  transcriptionImportState =
    scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setCodexStateForScan = (scan?: ProjectFolderScan) => {
  codexState =
    scan && window.sidekick
      ? { status: 'checking' }
      : { status: 'unavailable', message: 'Choose a folder first.' };
};

const setActiveScan = (scan: ProjectFolderScan) => {
  resetExpandedPaths();
  selectedTreePath = scan.tree.relativePath;
  focusedTreePath = scan.tree.relativePath;
  activeWorkflow = null;
  appView = 'workspace';
  setContextPackageStateForScan(scan);
  setOverviewContextPackageStatusForScan(scan);
  setTranscriptionImportStateForScan(scan);
  setCodexStateForScan(scan);
  state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
  projectInfoState = null;
  void refreshProjectInfo(scan);
};

const getActiveScan = () =>
  state.status === 'ready' || state.status === 'partial' ? state.scan : undefined;

const isFolderNode = (node: FolderTreeNode) => node.kind === 'folder';

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
    codexState.status === 'checking' ||
    codexState.status === 'running');

const getChildren = (node: FolderTreeNode) => node.children ?? [];

const hasChildren = (node: FolderTreeNode) => getChildren(node).length > 0;

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

const getParentPath = (scan: ProjectFolderScan, relativePath: string) =>
  getTreeEntryByPath(scan.tree, relativePath)?.parentPath;

const getPathAncestors = (scan: ProjectFolderScan, relativePath: string) => {
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

const ensureVisibleTreeSelection = (scan: ProjectFolderScan) => {
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
  selectedTreePath = relativePath;
  focusedTreePath = relativePath;
  render();

  if (shouldFocus) {
    focusTreeRow(relativePath);
  }
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

const renderSummary = (scan?: ProjectFolderScan) => {
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

const renderArtifactCounts = (scan?: ProjectFolderScan) => {
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

const renderFolderSignals = (scan?: ProjectFolderScan) => {
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

const renderRecentFiles = (scan?: ProjectFolderScan) => {
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

const renderOverviewWarnings = (scan?: ProjectFolderScan) => {
  clear(warningsTarget);

  const warnings = overviewWarnings(scan);

  if (!warningsTarget || warnings.length === 0) {
    warningsTarget?.append(createListItem('Ingen varsler'));
    return;
  }

  warningsTarget.append(...warnings.map(createListItem));
};

const renderOverviewScanStatus = (scan?: ProjectFolderScan) => {
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

const renderOverviewContextPackageStatus = (scan?: ProjectFolderScan) => {
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

const getNodeWarnings = (scan: ProjectFolderScan, node: FolderTreeNode) =>
  scan.warnings.filter((warning) => {
    if (node.relativePath === ROOT_PATH) {
      return true;
    }

    return warning.path === node.relativePath || warning.path.startsWith(`${node.relativePath}/`);
  });

const renderSelectionBreadcrumb = (scan: ProjectFolderScan, node: FolderTreeNode) => {
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
      current.textContent = ancestor.relativePath === ROOT_PATH ? 'Prosjektoversikt' : ancestor.name;
      selectionBreadcrumbTarget.append(current);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'breadcrumb-button';
    button.textContent = ancestor.relativePath === ROOT_PATH ? 'Prosjektoversikt' : ancestor.name;
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

const renderSelectionContents = (node: FolderTreeNode) => {
  clear(selectionContentsTarget);

  if (!selectionContentsTarget) {
    return;
  }

  const title = document.createElement('p');
  title.className = 'selection-contents-title';
  title.textContent = node.relativePath === ROOT_PATH
    ? 'Prosjektinnhold'
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

const projectInfoStatusText = (scan: ProjectFolderScan) => {
  if (!projectInfoState || projectInfoState.rootPath !== scan.rootPath) {
    return 'Sjekker';
  }

  if (projectInfoState.message) {
    return 'Feilet';
  }

  switch (projectInfoState.snapshot.status) {
    case 'complete':
      return projectInfoState.snapshot.generatedAt
        ? `Oppdatert ${formatDate(projectInfoState.snapshot.generatedAt)}`
        : 'Tilgjengelig';
    case 'invalid':
      return 'Ugyldig';
    case 'missing':
      return 'Mangler';
  }
};

const appendProjectSummary = (scan: ProjectFolderScan) => {
  if (!selectionContentsTarget || !projectInfoState || projectInfoState.rootPath !== scan.rootPath) {
    return;
  }

  const { snapshot, message } = projectInfoState;
  const title = document.createElement('h3');
  title.className = 'selection-contents-title';
  title.textContent = 'Prosjektsammendrag';

  if (snapshot.status !== 'complete') {
    const empty = document.createElement('p');
    empty.className = 'selection-empty';
    empty.textContent =
      message ??
      (snapshot.status === 'invalid'
        ? snapshot.message ?? 'Prosjektsammendraget kan ikke leses.'
        : 'Ingen prosjektsammendrag er generert ennå.');
    selectionContentsTarget.append(title, empty);
    return;
  }

  const summary = document.createElement('p');
  summary.className = 'selection-summary';
  summary.textContent = snapshot.projectSummary ?? '';

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

const renderSelectedTreeContext = (scan?: ProjectFolderScan) => {
  if (!scan) {
    selectionPanelTarget?.toggleAttribute('hidden', true);
    return;
  }

  ensureVisibleTreeSelection(scan);
  selectionPanelTarget?.toggleAttribute('hidden', false);

  const node = getNodeByPath(scan.tree, selectedTreePath) ?? scan.tree;
  const warnings = getNodeWarnings(scan, node);
  const childFolders = getChildren(node).filter(isFolderNode).length;
  const childFiles = getChildren(node).length - childFolders;

  if (node.relativePath === ROOT_PATH) {
    setText(selectionLabelTarget, 'Prosjekt');
    setText(selectionTitleTarget, scan.rootName);
    renderSelectionBreadcrumb(scan, node);
    renderDetails(selectionDetailsTarget, [
      ['Prosjektmappe', scan.rootPath],
      ['Filer', scan.summary.fileCount.toString()],
      ['Mapper', scan.summary.folderCount.toString()],
      ['Skannet', formatDate(scan.scannedAt)],
      ['Status', scan.status === 'partial' ? 'Delvis' : 'Fullført'],
      ['Kontekstpakke', contextPackageStatusText(scan)],
      ['Prosjektsammendrag', projectInfoStatusText(scan)],
      ['Varsler', overviewWarningCount(scan) > 0 ? overviewWarningCount(scan).toString() : 'Ingen'],
      ['Markdown/tekst', scan.summary.artifactTypeCounts['markdown-text'].toString()],
      ['Transkripsjoner', scan.summary.artifactTypeCounts.transcript.toString()],
    ]);
    renderSelectionContents(node);
    appendProjectSummary(scan);
    appendSelectionWarnings(overviewWarnings(scan));
    return;
  }

  setText(selectionLabelTarget, isFolderNode(node) ? 'Mappe' : 'Fil');
  setText(selectionTitleTarget, node.relativePath === ROOT_PATH ? scan.rootName : node.name);
  renderSelectionBreadcrumb(scan, node);

  if (isFolderNode(node)) {
    renderDetails(selectionDetailsTarget, [
      ['Relativ sti', node.relativePath],
      ['Direkte innhold', `${childFolders} mapper / ${childFiles} filer`],
      ['Filer totalt', countFilesInNode(node).toString()],
      ['Signal', getFolderSignalLabel(node)],
      ['Sist endret', formatDate(node.modifiedAt) || 'Ukjent'],
      ['Varsler', warnings.length > 0 ? warnings.length.toString() : 'Ingen'],
    ]);
  } else {
    renderDetails(selectionDetailsTarget, [
      ['Relativ sti', node.relativePath],
      ['Type', node.artifactType ? artifactLabels[node.artifactType] : 'Fil'],
      ['Størrelse', formatBytes(node.size) || 'Ukjent'],
      ['Sist endret', formatDate(node.modifiedAt) || 'Ukjent'],
      ['Varsler', warnings.length > 0 ? warnings.length.toString() : 'Ingen'],
    ]);
  }

  renderSelectionContents(node);
  appendSelectionWarnings(
    warnings.map((warning) =>
      warning.path === ROOT_PATH ? warning.message : `${warning.path}: ${warning.message}`,
    ),
  );
};

const normalizeDisplayPath = (pathValue: string) => pathValue.replace(/[\\/]+$/, '');

const getProjectNameValidationMessage = (projectName: string) => {
  const trimmedName = projectName.trim();

  if (!trimmedName) {
    return 'Prosjektnavn er påkrevd.';
  }

  if (
    trimmedName === '.' ||
    trimmedName === '..' ||
    trimmedName.includes('/') ||
    trimmedName.includes('\\') ||
    trimmedName.includes('\0') ||
    /^[a-zA-Z]:/.test(trimmedName)
  ) {
    return 'Prosjektnavnet må være et mappenavn, ikke en sti.';
  }

  return '';
};

const getProjectTargetPath = (parentPath: string, projectName: string) =>
  `${normalizeDisplayPath(parentPath)}/${projectName.trim()}`;

const renderProjectCreation = () => {
  const projectName = projectNameInput?.value ?? '';
  const validationMessage = getProjectNameValidationMessage(projectName);
  const isDialogOpen = projectCreationState.status !== 'closed';
  const isSelectingParent = projectCreationState.status === 'selecting-parent';
  const isCreating = projectCreationState.status === 'creating';
  const hasValidRequest = !validationMessage && Boolean(projectCreationState.parentPath);
  const shouldShowValidationMessage =
    isDialogOpen && Boolean(validationMessage) && projectNameTouched;

  projectCreateDialogTarget?.toggleAttribute('hidden', !isDialogOpen);
  projectNameInput?.toggleAttribute('disabled', isCreating || !window.sidekick);
  chooseProjectParentButton?.toggleAttribute('disabled', isCreating || isSelectingParent || !window.sidekick);
  createProjectButton?.toggleAttribute('disabled', isCreating || !hasValidRequest || !window.sidekick);
  projectCreateCancelButtons.forEach((button) => {
    button.toggleAttribute('disabled', isCreating);
  });

  if (createProjectMessageTarget) {
    if (projectCreationState.status === 'closed' || projectCreationState.status === 'editing') {
      createProjectMessageTarget.removeAttribute('data-status');
    } else {
      createProjectMessageTarget.dataset.status = projectCreationState.status;
    }
  }

  setText(createProjectMessageTarget, projectCreationState.message);
  setText(projectNameMessageTarget, shouldShowValidationMessage ? validationMessage : '');
  setText(projectParentPathTarget, projectCreationState.parentPath ?? 'Ingen plassering valgt.');

  if (projectTargetPreviewTarget) {
    const targetText =
      projectCreationState.parentPath && !validationMessage
        ? getProjectTargetPath(projectCreationState.parentPath, projectName)
        : 'Velg prosjektnavn og plassering for å se hva som opprettes.';

    if (projectCreationState.parentPath && !validationMessage) {
      const target = document.createElement('strong');
      const assumptions = document.createElement('span');
      const transcriptions = document.createElement('span');
      target.textContent = targetText;
      assumptions.textContent = '00. Forutsetninger';
      transcriptions.textContent = '01. Transkripsjoner';
      projectTargetPreviewTarget.replaceChildren(target, assumptions, transcriptions);
    } else {
      projectTargetPreviewTarget.textContent = targetText;
    }
  }

  if (createProjectButton) {
    createProjectButton.textContent = isCreating ? 'Oppretter...' : 'Opprett mappe';
  }

  if (chooseProjectParentButton) {
    chooseProjectParentButton.textContent = isSelectingParent ? 'Velger...' : 'Velg...';
  }
};

const renderProjectInitialization = () => {
  const isChoosing = projectInitializationState.status === 'choosing';
  const isPreview =
    projectInitializationState.status === 'preview' ||
    projectInitializationState.status === 'initializing' ||
    projectInitializationState.status === 'error';
  const isInitializing = projectInitializationState.status === 'initializing';
  const preview =
    projectInitializationState.status === 'preview' ||
    projectInitializationState.status === 'initializing' ||
    projectInitializationState.status === 'error'
      ? projectInitializationState.preview
      : undefined;
  const missingFolders =
    preview?.requiredFolders.filter((folder) => folder.status === 'missing') ?? [];

  initializeProjectButton?.toggleAttribute('disabled', isChoosing || isInitializing || !window.sidekick);
  projectInitializationPanelTarget?.toggleAttribute(
    'hidden',
    projectInitializationState.status === 'idle',
  );
  projectInitializationConfirmButton?.toggleAttribute('hidden', !isPreview || !preview);
  projectInitializationCancelButton?.toggleAttribute('hidden', !isPreview && !isChoosing);
  projectInitializationConfirmButton?.toggleAttribute('disabled', isInitializing || !preview);
  projectInitializationCancelButton?.toggleAttribute('disabled', isInitializing);

  if (initializeProjectButton) {
    initializeProjectButton.textContent = isChoosing ? 'Velger...' : 'Initialiser eksisterende mappe...';
  }

  if (projectInitializationConfirmButton) {
    projectInitializationConfirmButton.textContent = isInitializing
      ? 'Initialiserer...'
      : missingFolders.length > 0
        ? 'Opprett manglende mapper'
        : 'Bruk som prosjekt';
  }

  setText(projectInitializationTitleTarget, 'Initialiser eksisterende mappe');
  setText(projectInitializationMessageTarget, projectInitializationState.message);

  if (!preview) {
    renderDetails(projectInitializationDetailsTarget, []);
    renderList(projectInitializationWarningsTarget, []);
    return;
  }

  renderDetails(projectInitializationDetailsTarget, [
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
    projectInitializationWarningsTarget,
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

const createContextPackageSteps = (activeStep: 1 | 2 | 3) =>
  createOperationSteps(['Forhåndsvis', 'Bekreft', 'Ferdig'], activeStep);

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

const renderContextPackageUnavailable = () => {
  setText(contextPackageTitleTarget, 'Ingen prosjektmappe valgt');
  setText(
    contextPackageMessageTarget,
    window.sidekick
      ? 'Velg en prosjektmappe før du lager kontekstpakke.'
      : 'Åpne appen i Electron for å lage kontekstpakker.',
  );
  renderContextPackageStateElements();
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Forhåndsvis', true);
};

const renderContextPackageReady = (scan: ProjectFolderScan) => {
  setText(contextPackageTitleTarget, 'Lag kontekstpakke');
  setText(
    contextPackageMessageTarget,
    'Forbered én Markdown-fil som samler prosjektmaterialet for bruk utenfor Sidekick.',
  );
  renderContextPackageStateElements(createContextPackageSteps(1));
  renderContextPackageDetails([
    ['Prosjektmappe', scan.rootName],
    ['Omfang', 'Hele valgt prosjektmappe'],
    ['Format', 'Markdown'],
    ['Plassering', 'Prosjektroten'],
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
        ? `Sidekick erstatter eksisterende ${preview.outputFileName} i prosjektroten.`
        : `Sidekick skriver én Markdown-fil til prosjektroten: ${preview.outputFileName}.`,
    ),
  );
  renderContextPackageDetails([
    ['Filnavn', preview.outputFileName],
    ['Plassering', 'Prosjektroten'],
    ['Overskriver', preview.willOverwrite ? 'Ja' : 'Nei'],
    ['Filsti', preview.outputPath],
  ]);
  renderContextPackageList([preview.binaryFileWarning, preview.selfIgnoreWarning]);
  renderContextPackageActions('Generer pakke', false, true);
};

const renderContextPackageGenerating = (preview: ContextPackagePreview) => {
  setText(contextPackageTitleTarget, 'Genererer kontekstpakke');
  setText(contextPackageMessageTarget, 'Sidekick skriver kontekstpakken til prosjektmappen.');
  renderContextPackageStateElements(
    createContextPackageSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(`Sidekick skriver ${preview.outputFileName}.`),
  );
  renderContextPackageDetails([
    ['Filnavn', preview.outputFileName],
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
    result.projectSummary.status === 'complete'
      ? 'Prosjektsammendrag oppdatert'
      : `Prosjektsammendrag feilet: ${result.projectSummary.message ?? 'Ukjent feil'}`;

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
      result.overwritten ? 'Filen ble skrevet over i prosjektroten.' : 'Filen ble skrevet til prosjektroten.',
    ),
  );
  renderContextPackageDetails([
    ['Filnavn', result.outputFileName],
    ['Filsti', result.outputPath],
    ['Overskrevet', result.overwritten ? 'Ja' : 'Nei'],
    ['Inkludert', result.totalFiles.toString()],
    ['Hoppet over', result.skippedFiles.length.toString()],
    ['Tokens', result.totalTokens.toString()],
    ['Tegn', result.totalCharacters.toString()],
    ['Størrelse', formatBytes(result.outputBytes)],
    ['Prosjektsammendrag', summaryStatus],
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
        : 'Kontroller prosjektmappen før du prøver igjen.',
    ),
  );
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Prøv igjen', false, true);
};

const renderContextPackage = (scan?: ProjectFolderScan) => {
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
  setText(transcriptionImportTitleTarget, 'Ingen prosjektmappe valgt');
  setText(
    transcriptionImportMessageTarget,
    window.sidekick
      ? 'Velg en prosjektmappe før du importerer transkripsjoner.'
      : 'Åpne appen i Electron for å importere transkripsjoner.',
  );
  renderTranscriptionImportStateElements();
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Velg fil...', true);
};

const renderTranscriptionImportReady = (scan: ProjectFolderScan) => {
  setText(transcriptionImportTitleTarget, 'Importer transkripsjon');
  setText(
    transcriptionImportMessageTarget,
    'Velg en tekst- eller Markdown-fil som skal kopieres inn i prosjektets transkripsjonsmappe.',
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
  setText(transcriptionImportMessageTarget, 'Kopierer transkripsjonen inn i prosjektet.');
  renderTranscriptionImportStateElements(
    createImportSteps(2),
    createWriteOperationBadge(),
    createWriteWarning(`Sidekick skriver ${preview.destinationFileName} til prosjektmappen.`),
  );
  renderTranscriptionImportDetails([
    ['Nytt filnavn', preview.destinationFileName],
    ['Destinasjonssti', preview.destinationPath],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Importerer...', true);
};

const renderTranscriptionImportComplete = (result: TranscriptionImportResult) => {
  setText(transcriptionImportTitleTarget, 'Transkripsjon importert');
  setText(transcriptionImportMessageTarget, 'Prosjektet er skannet på nytt med den importerte filen.');
  renderTranscriptionImportStateElements(
    createImportSteps(3),
    createResultBanner(
      'success',
      'Filen er lagt til',
      'Originalfilen er uendret på kildestedet.',
    ),
  );
  renderTranscriptionImportDetails([
    ['Importert fil', result.destinationFileName],
    ['Kilde', result.sourceFileName],
    ['Størrelse', formatBytes(result.copiedBytes)],
    ['Nummer', result.finalNumber.toString().padStart(2, '0')],
    ['Destinasjonssti', result.destinationPath],
    ['Original', 'Uendret'],
  ]);
  renderTranscriptionImportList([]);
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

const renderTranscriptionImport = (scan?: ProjectFolderScan) => {
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
      ? 'Codex kan lese og endre filer direkte i prosjektmappen for denne kjøringen.'
      : 'Codex kan lese prosjektmappen, men ikke endre filer.',
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

const renderCodexUnavailable = (message = 'Velg en prosjektmappe først.') => {
  setText(codexTitleTarget, 'Ingen prosjektmappe valgt');
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

const renderCodexReady = (codexStatus: CodexStatus, scan: ProjectFolderScan) => {
  const isWriteMode = Boolean(codexEditModeInput?.checked);

  setText(codexTitleTarget, 'Codex er klar');
  setText(codexMessageTarget, 'Kjør Codex direkte mot valgt prosjektmappe.');
  renderCodexStateElements(
    ...(isWriteMode
      ? [
          createWriteOperationBadge(),
          createWriteWarning(`Codex kan endre filer direkte i ${scan.rootPath} for denne kjøringen.`),
        ]
      : [createCodexSteps(1)]),
  );
  renderCodexDetails([
    ['Prosjektmappe', scan.rootPath],
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
  scan: ProjectFolderScan,
) => {
  setText(codexTitleTarget, run.mode === 'login' ? 'Innlogging kjører' : 'Codex kjører');
  setText(
    codexMessageTarget,
    run.mode === 'workspace-write'
      ? 'Codex har skrivetilgang til valgt prosjektmappe i denne kjøringen.'
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
    ['Prosjektmappe', scan.rootPath],
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

const renderCodex = (scan?: ProjectFolderScan) => {
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

const renderTreeToolbar = (scan?: ProjectFolderScan) => {
  const hasScan = Boolean(scan);

  treeToolbarTarget?.toggleAttribute('hidden', !hasScan);
  expandAllButton?.toggleAttribute('disabled', !hasScan);
  collapseAllButton?.toggleAttribute('disabled', !hasScan);
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
  name.textContent = node.kind === 'folder' ? `${node.name}/` : node.name;
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

const renderTree = (scan?: ProjectFolderScan) => {
  clear(treeTarget);
  renderTreeToolbar(scan);

  if (!treeTarget || !scan) {
    return;
  }

  ensureVisibleTreeSelection(scan);
  treeTarget.append(renderTreeNode(scan.tree));
};

const refreshOverviewContextPackageStatus = async (scan: ProjectFolderScan) => {
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
    // selected a different project.
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

const refreshProjectInfo = async (scan: ProjectFolderScan) => {
  if (!window.sidekick) {
    return;
  }

  const rootPath = scan.rootPath;

  try {
    const snapshot = await window.sidekick.readProjectInfo(rootPath);
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    projectInfoState = {
      rootPath,
      snapshot,
    };
  } catch (error) {
    const activeScan = getActiveScan();

    if (!activeScan || activeScan.rootPath !== rootPath) {
      return;
    }

    projectInfoState = {
      rootPath,
      snapshot: {
        status: 'invalid',
        path: '',
        message: error instanceof Error ? error.message : 'Kunne ikke lese prosjektsammendrag.',
      },
    };
  }

  render();
};

const renderNoScanPanels = () => {
  overviewEmptyTarget?.toggleAttribute('hidden', true);
  renderOverviewScanStatus();
  renderOverviewContextPackageStatus();
  renderContextPackage();
  renderTranscriptionImport();
  renderCodex();
  renderTree();
};

const renderEmptyState = () => {
  setText(selectedNameTarget, 'Ingen prosjektmappe valgt');
  setText(
    selectedPathTarget,
    window.sidekick ? 'Velg en mappe for å inspisere innholdet.' : 'Åpne i Electron for å inspisere lokale mapper.',
  );
  setText(statusMessageTarget, 'Ingen prosjektmappe valgt');
  setText(projectEntryErrorTarget, '');
  projectEntryErrorTarget?.toggleAttribute('hidden', true);
  setText(stateTitleTarget, 'Velg en prosjektmappe');
  setText(stateMessageTarget, 'Sidekick skanner lokale mapper lesebeskyttet.');
  setText(overviewTitleTarget, 'Mappestruktur');
  setText(overviewSubtitleTarget, 'Velg en mappe for å se prosjektoversikt.');
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
  setText(projectEntryErrorTarget, message);
  projectEntryErrorTarget?.toggleAttribute('hidden', false);
  setText(stateTitleTarget, 'Kan ikke åpne mappen');
  setText(stateMessageTarget, message);
  setText(overviewTitleTarget, 'Kan ikke åpne mappen');
  setText(overviewSubtitleTarget, 'Velg en annen mappe eller prøv igjen.');
  overviewEmptyTarget?.toggleAttribute('hidden', true);
  renderContextPackage();
  renderTranscriptionImport();
  renderCodex();
  renderWarnings([
    {
      path: '.',
      type: 'read-error',
      severity: 'error',
      message,
    },
  ]);
};

const renderReadyState = (scan: ProjectFolderScan, status: 'ready' | 'partial') => {
  const newestFile = scan.summary.recentFiles[0];
  const hasProjectContent = getChildren(scan.tree).length > 0;

  setText(selectedNameTarget, scan.rootName);
  setText(selectedPathTarget, scan.rootPath);
  setText(
    statusMessageTarget,
    `${scan.status === 'partial' ? 'Delvis skanning' : 'Skanning fullført'} · ${formatDate(
      scan.scannedAt,
    )}`,
  );
  setText(stateTitleTarget, status === 'partial' ? 'Delvis prosjektoversikt' : 'Prosjektoversikt');
  setText(
    stateMessageTarget,
    newestFile
      ? `Sist endret: ${formatDate(newestFile.modifiedAt)}. Mappesignaler er tolkningshjelp.`
      : 'Mappesignaler er tolkningshjelp.',
  );
  setText(
    overviewTitleTarget,
    status === 'partial' ? 'Prosjektoversikt (delvis)' : 'Prosjektoversikt',
  );
  setText(
    overviewSubtitleTarget,
    hasProjectContent
      ? 'Nøkkeltall, mappesignaler og nylig aktivitet i valgt prosjektmappe.'
      : 'Sidekick fant ingen filer eller undermapper i prosjektmappen.',
  );
  overviewEmptyTarget?.toggleAttribute('hidden', hasProjectContent);
  renderSummary(scan);
  renderArtifactCounts(scan);
  renderFolderSignals(scan);
  renderRecentFiles(scan);
  renderOverviewWarnings(scan);
  renderOverviewScanStatus(scan);
  renderOverviewContextPackageStatus(scan);
  renderSelectedTreeContext(scan);
  renderContextPackage(scan);
  renderTranscriptionImport(scan);
  renderCodex(scan);
  renderTree(scan);
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
  const hasActiveProject = state.status === 'ready' || state.status === 'partial';
  if (!hasActiveProject) {
    activeWorkflow = null;
  }

  const isBusy =
    state.status === 'loading' ||
    projectCreationState.status === 'creating' ||
    projectInitializationState.status === 'choosing' ||
    projectInitializationState.status === 'initializing';
  const isEntryState = state.status === 'empty' || state.status === 'error';
  const hasActiveWorkflow = activeWorkflow !== null;
  const isNavigationBlocked = isBusy || hasActiveWorkflow || isExclusiveWorkflowActive();

  chooseFolderButtons.forEach((button) => {
    button.toggleAttribute('disabled', isNavigationBlocked || !window.sidekick);
  });
  openSettingsButton?.toggleAttribute('disabled', isNavigationBlocked);
  overviewGenerateContextButton?.toggleAttribute('disabled', !hasActiveProject || isBusy || hasActiveWorkflow);
  overviewImportTranscriptionButton?.toggleAttribute('disabled', !hasActiveProject || isBusy || hasActiveWorkflow);
  overviewRunCodexButton?.toggleAttribute('disabled', !hasActiveProject || isBusy || hasActiveWorkflow);
  appMainTarget?.classList.toggle('app-main--single', !hasActiveProject);
  contextSurfaceTarget?.toggleAttribute('hidden', !hasActiveProject);
  actionBarTarget?.toggleAttribute('hidden', !hasActiveProject || appView === 'settings');
  workspaceDefaultTarget?.toggleAttribute('hidden', hasActiveWorkflow);
  workflowHostTarget?.toggleAttribute('hidden', !hasActiveWorkflow);
  workflowPanels.forEach((panel) => {
    panel.toggleAttribute('hidden', panel.dataset.workflowPanel !== activeWorkflow);
  });
  summaryStripTarget?.toggleAttribute('hidden', !hasActiveProject);
  projectEntryTarget?.toggleAttribute('hidden', !isEntryState);
  stateBannerTarget?.toggleAttribute('hidden', isEntryState || hasActiveProject);
  renderProjectCreation();
  renderProjectInitialization();
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
    const preview = await window.sidekick.previewContextPackage(scan.rootPath);
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
    const result = await window.sidekick.generateContextPackage(scan.rootPath);
    const selectedPathAfterScan = getNodeByPath(result.scan.tree, selectedTreePath)
      ? selectedTreePath
      : result.scan.tree.relativePath;
    state =
      result.scan.status === 'partial'
        ? { status: 'partial', scan: result.scan }
        : { status: 'ready', scan: result.scan };
    selectedTreePath = selectedPathAfterScan;
    focusedTreePath = selectedPathAfterScan;
    expandedPaths = new Set([...expandedPaths, ROOT_PATH]);
    setTranscriptionImportStateForScan(result.scan);
    contextPackageState = { status: 'complete', result };
    projectInfoState = {
      rootPath: result.scan.rootPath,
      snapshot:
        result.projectSummary.projectInfo ??
        result.projectSummary.previousProjectInfo ?? {
          status: 'missing',
          path: '',
        },
      message: result.projectSummary.status === 'failed' ? result.projectSummary.message : undefined,
    };
    overviewContextPackageStatus = {
      status: 'exists',
      rootPath: result.scan.rootPath,
      outputFileName: result.outputFileName,
    };
    void refreshCodexStatus(result.scan);
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
    setContextPackageStateForScan(result.scan);
    setOverviewContextPackageStatusForScan(result.scan);
    transcriptionImportState = { status: 'complete', result };
    void refreshOverviewContextPackageStatus(result.scan);
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

const refreshCodexStatus = async (scan: ProjectFolderScan) => {
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

const startCodexLogin = async (scan: ProjectFolderScan) => {
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

const startCodexRun = async (scan: ProjectFolderScan) => {
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
    void refreshOverviewContextPackageStatus(completion.scan);
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
    const scan = await window.sidekick.chooseProjectFolder();

    if (!scan) {
      expandedPaths = new Set();
      setContextPackageStateForScan();
      setOverviewContextPackageStatusForScan();
      setTranscriptionImportStateForScan();
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
    setCodexStateForScan();
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to inspect the selected folder.',
    };
    render();
  }
};

const chooseProjectFolderForInitialization = async () => {
  if (!window.sidekick) {
    projectInitializationState = {
      status: 'error',
      message: 'Prosjektinitialisering er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  projectInitializationState = {
    status: 'choosing',
    message: 'Velg mappen som skal brukes som Sidekick-prosjekt.',
  };
  render();

  try {
    const preview = await window.sidekick.chooseProjectFolderForInitialization();

    if (!preview) {
      projectInitializationState = { status: 'idle', message: '' };
      render();
      return;
    }

    const missingCount = preview.requiredFolders.filter((folder) => folder.status === 'missing').length;
    projectInitializationState = {
      status: 'preview',
      preview,
      message:
        missingCount > 0
          ? 'Kontroller mappen før Sidekick oppretter manglende standardmapper.'
          : 'Kontroller mappen før Sidekick bruker den som aktivt prosjekt.',
    };
  } catch (error) {
    projectInitializationState = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke kontrollere prosjektmappen.',
    };
  }

  render();
};

const cancelProjectInitialization = () => {
  if (projectInitializationState.status === 'initializing') {
    return;
  }

  projectInitializationState = { status: 'idle', message: '' };
  render();
  initializeProjectButton?.focus();
};

const confirmProjectInitialization = async () => {
  if (
    !window.sidekick ||
    (projectInitializationState.status !== 'preview' &&
      projectInitializationState.status !== 'error')
  ) {
    return;
  }

  const previousState = state;
  const { preview } = projectInitializationState;

  if (!preview) {
    return;
  }

  projectInitializationState = {
    status: 'initializing',
    preview,
    message: 'Initialiserer prosjektmappe.',
  };
  state = { status: 'loading' };
  render();

  try {
    const result = await window.sidekick.confirmProjectInitialization(preview.previewId);
    setActiveScan(result.scan);
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshCodexStatus(result.scan);
    projectInitializationState = {
      status: 'complete',
      result,
      message: `${result.rootName} er valgt som Sidekick-prosjekt.`,
    };
    render();
  } catch (error) {
    projectInitializationState = {
      status: 'error',
      preview,
      message: error instanceof Error ? error.message : 'Kunne ikke initialisere prosjektmappen.',
    };
    state = previousState;
    render();
  }
};

const openProjectCreateDialog = () => {
  projectNameTouched = false;
  projectCreationState = {
    status: 'editing',
    message: '',
    parentPath: projectCreationState.parentPath,
  };
  render();
  projectNameInput?.focus();
};

const closeProjectCreateDialog = () => {
  if (projectCreationState.status === 'creating') {
    return;
  }

  projectCreationState = {
    status: 'closed',
    message: '',
    parentPath: projectCreationState.parentPath,
  };
  render();
  openCreateProjectButton?.focus();
};

const getProjectDialogFocusableElements = () =>
  Array.from(
    projectCreateDialogTarget?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null);

const chooseProjectParentFolder = async () => {
  if (!window.sidekick) {
    projectCreationState = {
      ...projectCreationState,
      status: 'error',
      message: 'Prosjektopprettelse er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  projectCreationState = {
    ...projectCreationState,
    status: 'selecting-parent',
    message: 'Velg hvor prosjektmappen skal opprettes.',
  };
  render();

  try {
    const parentPath = await window.sidekick.chooseProjectParentFolder();

    projectCreationState = {
      status: 'editing',
      message: parentPath ? '' : 'Ingen plassering valgt.',
      parentPath: parentPath ?? projectCreationState.parentPath,
    };
  } catch (error) {
    projectCreationState = {
      ...projectCreationState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke velge plassering.',
    };
  }

  render();
};

const createProject = async () => {
  if (!window.sidekick) {
    projectCreationState = {
      ...projectCreationState,
      status: 'error',
      message: 'Prosjektopprettelse er tilgjengelig i Electron-appen.',
    };
    render();
    return;
  }

  const projectName = projectNameInput?.value ?? '';
  const validationMessage = getProjectNameValidationMessage(projectName);

  if (validationMessage || !projectCreationState.parentPath) {
    projectNameTouched = true;
    projectCreationState = {
      ...projectCreationState,
      status: 'error',
      message: validationMessage || 'Velg hvor prosjektmappen skal opprettes.',
    };
    render();
    return;
  }

  const previousState = state;
  const parentPath = projectCreationState.parentPath;
  projectCreationState = { status: 'creating', message: 'Oppretter prosjektmappe.', parentPath };
  state = { status: 'loading' };
  render();

  try {
    const result: ProjectCreationResult | null = await window.sidekick.createProjectFolder({
      projectName,
      parentPath,
    });

    if (!result) {
      projectCreationState = { status: 'editing', message: '', parentPath };
      state = previousState;
      render();
      return;
    }

    if (projectNameInput) {
      projectNameInput.value = '';
    }

    setActiveScan(result.scan);
    void refreshOverviewContextPackageStatus(result.scan);
    void refreshCodexStatus(result.scan);
    projectCreationState = {
      status: 'closed',
      message: `Opprettet ${result.rootName}.`,
      parentPath,
    };
    render();
  } catch (error) {
    projectCreationState = {
      ...projectCreationState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Kunne ikke opprette prosjektmappe.',
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

initializeProjectButton?.addEventListener('click', () => {
  void chooseProjectFolderForInitialization();
});
projectInitializationConfirmButton?.addEventListener('click', () => {
  void confirmProjectInitialization();
});
projectInitializationCancelButton?.addEventListener('click', cancelProjectInitialization);
openCreateProjectButton?.addEventListener('click', openProjectCreateDialog);
projectCreateCancelButtons.forEach((button) => {
  button.addEventListener('click', closeProjectCreateDialog);
});
chooseProjectParentButton?.addEventListener('click', () => {
  void chooseProjectParentFolder();
});
projectNameInput?.addEventListener('input', () => {
  projectNameTouched = true;
  render();
});
projectCreateDialogTarget?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target === projectNameInput && !createProjectButton?.disabled) {
    event.preventDefault();
    void createProject();
  }

  if (event.key !== 'Tab') {
    return;
  }

  // The create-project surface behaves as a lightweight modal; keep tab focus
  // inside it until the user cancels or creates the project.
  const focusableElements = getProjectDialogFocusableElements();
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
  if (event.key === 'Escape' && projectCreationState.status !== 'closed') {
    event.preventDefault();
    closeProjectCreateDialog();
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

createProjectButton?.addEventListener('click', () => {
  void createProject();
});

expandAllButton?.addEventListener('click', expandAllFolders);
collapseAllButton?.addEventListener('click', collapseAllFolders);
contextPackagePrimaryButton?.addEventListener('click', handleContextPackagePrimary);
overviewGenerateContextButton?.addEventListener('click', () => {
  openWorkflow('context-package');
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

render();
