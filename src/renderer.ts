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

type ContextPackageState =
  | { status: 'unavailable' }
  | { status: 'ready' }
  | { status: 'previewing' }
  | { status: 'confirming'; preview: ContextPackagePreview }
  | { status: 'generating'; preview: ContextPackagePreview }
  | { status: 'complete'; result: ContextPackageResult }
  | { status: 'error'; message: string };

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

type AppView = 'workspace' | 'settings';

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
const summaryStripTarget = document.querySelector<HTMLElement>('[data-summary]');
const projectEntryTarget = document.querySelector<HTMLElement>('[data-project-entry]');
const projectEntryErrorTarget = document.querySelector<HTMLElement>('[data-project-entry-error]');
const chooseFolderButtons = document.querySelectorAll<HTMLButtonElement>('[data-choose-folder]');
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
const codexDetailsTarget = document.querySelector<HTMLElement>('[data-codex-details]');
const codexPromptInput = document.querySelector<HTMLTextAreaElement>('[data-codex-prompt]');
const codexEditModeInput = document.querySelector<HTMLInputElement>('[data-codex-edit-mode]');
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
let contextPackageState: ContextPackageState = { status: 'unavailable' };
let overviewContextPackageStatus: OverviewContextPackageStatus = { status: 'unavailable' };
let transcriptionImportState: TranscriptionImportState = { status: 'unavailable' };
let projectCreationState: ProjectCreationState = {
  status: 'closed',
  message: '',
  parentPath: null,
};
let projectNameTouched = false;
let codexState: CodexState = { status: 'unavailable', message: 'Choose a folder first.' };
let appView: AppView = 'workspace';
let settingsState: SettingsState = { status: 'idle', message: '' };

const ROOT_PATH = '.';

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
) => {
  if (primaryButton) {
    primaryButton.textContent = primaryLabel;
    primaryButton.disabled = primaryDisabled;
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
  setContextPackageStateForScan(scan);
  setOverviewContextPackageStatusForScan(scan);
  setTranscriptionImportStateForScan(scan);
  setCodexStateForScan(scan);
  state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
};

const getActiveScan = () =>
  state.status === 'ready' || state.status === 'partial' ? state.scan : undefined;

const isFolderNode = (node: FolderTreeNode) => node.kind === 'folder';

const getChildren = (node: FolderTreeNode) => node.children ?? [];

const hasChildren = (node: FolderTreeNode) => getChildren(node).length > 0;

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

const renderContextPackageDetails = (rows: DetailRow[]) =>
  renderDetails(contextPackageDetailsTarget, rows);

const renderContextPackageList = (items: string[]) => renderList(contextPackageListTarget, items);

const renderTranscriptionImportDetails = (rows: DetailRow[]) =>
  renderDetails(transcriptionImportDetailsTarget, rows);

const renderTranscriptionImportList = (items: string[]) =>
  renderList(transcriptionImportListTarget, items);

const renderContextPackageActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
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
    window.sidekick ? 'Choose a folder first.' : 'Open in Electron to create context packages.',
  );
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Create context package', true);
};

const renderContextPackageReady = () => {
  setText(contextPackageTitleTarget, 'Ready');
  setText(contextPackageMessageTarget, 'Create one Markdown package in the folder root.');
  renderContextPackageDetails([
    ['Scope', 'Full selected folder'],
    ['Format', 'Markdown'],
  ]);
  renderContextPackageList([]);
  renderContextPackageActions('Create context package', false);
};

const renderContextPackagePreviewing = () => {
  setText(contextPackageTitleTarget, 'Preparing');
  setText(contextPackageMessageTarget, 'Checking output path.');
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Preparing...', true);
};

const renderContextPackageConfirming = (preview: ContextPackagePreview) => {
  setText(contextPackageTitleTarget, 'Confirm generation');
  setText(contextPackageMessageTarget, 'Review the output before writing.');
  renderContextPackageDetails([
    ['Output file', preview.outputFileName],
    ['Overwrite', preview.willOverwrite ? 'Yes' : 'No'],
    ['Output path', preview.outputPath],
  ]);
  renderContextPackageList([preview.binaryFileWarning, preview.selfIgnoreWarning]);
  renderContextPackageActions('Generate package', false, true);
};

const renderContextPackageGenerating = (preview: ContextPackagePreview) => {
  setText(contextPackageTitleTarget, 'Generating');
  setText(contextPackageMessageTarget, 'Writing context package.');
  renderContextPackageDetails([
    ['Output file', preview.outputFileName],
    ['Output path', preview.outputPath],
  ]);
  renderContextPackageList([]);
  renderContextPackageActions('Generating...', true);
};

const renderContextPackageComplete = (result: ContextPackageResult) => {
  const skippedPreview = result.skippedFiles
    .slice(0, 5)
    .map((file) => `${file.path}: ${file.reason}`);
  const warningPreview = result.warnings.map((warning) =>
    warning.path ? `${warning.path}: ${warning.message}` : warning.message,
  );

  setText(contextPackageTitleTarget, 'Package created');
  setText(
    contextPackageMessageTarget,
    result.overwritten ? 'Existing package overwritten.' : 'Context package created.',
  );
  renderContextPackageDetails([
    ['Output file', result.outputFileName],
    ['Included', result.totalFiles.toString()],
    ['Skipped', result.skippedFiles.length.toString()],
    ['Tokens', result.totalTokens.toString()],
    ['Characters', result.totalCharacters.toString()],
    ['Size', formatBytes(result.outputBytes)],
    ['Output path', result.outputPath],
  ]);
  renderContextPackageList([
    ...warningPreview,
    ...skippedPreview,
    ...(result.skippedFiles.length > skippedPreview.length
      ? [`${result.skippedFiles.length - skippedPreview.length} more skipped files`]
      : []),
  ]);
  renderContextPackageActions('Create again', false);
};

const renderContextPackageError = (message: string) => {
  setText(contextPackageTitleTarget, 'Generation failed');
  setText(contextPackageMessageTarget, message);
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Try again', false);
};

const renderContextPackage = (scan?: ProjectFolderScan) => {
  if (!scan || !window.sidekick || contextPackageState.status === 'unavailable') {
    renderContextPackageUnavailable();
    return;
  }

  switch (contextPackageState.status) {
    case 'ready':
      renderContextPackageReady();
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
      renderContextPackageError(contextPackageState.message);
      break;
  }
};

const renderTranscriptionImportUnavailable = () => {
  setText(transcriptionImportTitleTarget, 'Ingen prosjektmappe valgt');
  setText(
    transcriptionImportMessageTarget,
    window.sidekick ? 'Choose a folder first.' : 'Open in Electron to import transcriptions.',
  );
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Add transcription', true);
};

const renderTranscriptionImportReady = () => {
  setText(transcriptionImportTitleTarget, 'Ready');
  setText(transcriptionImportMessageTarget, 'Copy a text or Markdown transcript into the project.');
  renderTranscriptionImportDetails([
    ['Accepted', '.txt, .md, .markdown'],
    ['Target', 'Detected transcription folder'],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Add transcription', false);
};

const renderTranscriptionImportPreviewing = () => {
  setText(transcriptionImportTitleTarget, 'Choose file');
  setText(transcriptionImportMessageTarget, 'Waiting for transcription file selection.');
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Choosing...', true);
};

const formatNumberingPreview = (preview: TranscriptionImportPreview) =>
  `${preview.numbering.nextNumber.toString().padStart(preview.numbering.width, '0')}${
    preview.numbering.separator
  } (${preview.numbering.inferredFromExistingFiles ? 'inferred' : 'new sequence'})`;

const renderTranscriptionImportConfirming = (preview: TranscriptionImportPreview) => {
  setText(transcriptionImportTitleTarget, 'Confirm import');
  setText(transcriptionImportMessageTarget, 'Review the destination before copying.');
  renderTranscriptionImportDetails([
    ['Source file', preview.sourceFileName],
    ['Target folder', preview.targetFolderRelativePath],
    ['Destination file', preview.destinationFileName],
    ['Numbering', formatNumberingPreview(preview)],
    ['Destination path', preview.destinationPath],
  ]);
  renderTranscriptionImportList([
    'Source file will be copied, not moved.',
    ...preview.warnings.map((warning) =>
      warning.path ? `${warning.path}: ${warning.message}` : warning.message,
    ),
  ]);
  renderTranscriptionImportActions('Import transcription', false, true);
};

const renderTranscriptionImportImporting = (preview: TranscriptionImportPreview) => {
  setText(transcriptionImportTitleTarget, 'Importing');
  setText(transcriptionImportMessageTarget, 'Copying transcription into the project.');
  renderTranscriptionImportDetails([
    ['Destination file', preview.destinationFileName],
    ['Destination path', preview.destinationPath],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Importing...', true);
};

const renderTranscriptionImportComplete = (result: TranscriptionImportResult) => {
  setText(transcriptionImportTitleTarget, 'Transcription added');
  setText(transcriptionImportMessageTarget, 'Copied into the transcription folder.');
  renderTranscriptionImportDetails([
    ['Destination file', result.destinationFileName],
    ['Source file', result.sourceFileName],
    ['Size', formatBytes(result.copiedBytes)],
    ['Destination path', result.destinationPath],
  ]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Add another', false);
};

const renderTranscriptionImportError = (message: string) => {
  setText(transcriptionImportTitleTarget, 'Import failed');
  setText(transcriptionImportMessageTarget, message);
  renderTranscriptionImportDetails([]);
  renderTranscriptionImportList([]);
  renderTranscriptionImportActions('Try again', false);
};

const renderTranscriptionImport = (scan?: ProjectFolderScan) => {
  if (!scan || !window.sidekick || transcriptionImportState.status === 'unavailable') {
    renderTranscriptionImportUnavailable();
    return;
  }

  switch (transcriptionImportState.status) {
    case 'ready':
      renderTranscriptionImportReady();
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
) => {
  renderActions(
    {
      primaryButton: codexPrimaryButton,
      secondaryButton: codexSecondaryButton,
    },
    primaryLabel,
    primaryDisabled,
    secondaryVisible,
  );
};

const setCodexInputsDisabled = (disabled: boolean) => {
  if (codexPromptInput) {
    codexPromptInput.disabled = disabled;
  }

  if (codexEditModeInput) {
    codexEditModeInput.disabled = disabled;
  }
};

const renderCodexDetails = (rows: DetailRow[]) => renderDetails(codexDetailsTarget, rows);

const renderCodexOutput = (output: CodexOutputEvent[] = []) => {
  clear(codexOutputTarget);

  if (!codexOutputTarget) {
    return;
  }

  if (output.length === 0) {
    codexOutputTarget.append(createListItem('No output yet'));
    return;
  }

  codexOutputTarget.append(
    ...output.slice(-12).map((event) => {
      const text = event.parsed ? JSON.stringify(event.parsed) : event.text;
      return createListItem(`${event.stream}: ${text}`);
    }),
  );
};

const renderCodexUnavailable = (message = 'Choose a folder first.') => {
  setText(codexTitleTarget, 'Ingen prosjektmappe valgt');
  setText(codexMessageTarget, window.sidekick ? message : 'Open in Electron to use Codex.');
  renderCodexDetails([]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexActions('Run Codex', true);
};

const renderCodexChecking = () => {
  setText(codexTitleTarget, 'Checking Codex');
  setText(codexMessageTarget, 'Looking for Codex CLI and login status.');
  renderCodexDetails([]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexActions('Checking...', true);
};

const renderCodexLoggedOut = (codexStatus: CodexStatus) => {
  setText(codexTitleTarget, 'Login required');
  setText(codexMessageTarget, codexStatus.message ?? 'Codex is available but not logged in.');
  renderCodexDetails([
    ['Version', codexStatus.version ?? 'Unknown'],
    ['Mode', 'Device auth'],
  ]);
  renderCodexOutput([]);
  setCodexInputsDisabled(true);
  renderCodexActions('Login', false);
};

const renderCodexReady = (codexStatus: CodexStatus) => {
  setText(codexTitleTarget, 'Ready');
  setText(codexMessageTarget, 'Run Codex in the selected project folder.');
  renderCodexDetails([
    ['Version', codexStatus.version ?? 'Unknown'],
    ['Default sandbox', 'read-only'],
  ]);
  renderCodexOutput([]);
  setCodexInputsDisabled(false);
  renderCodexActions('Run Codex', false);
};

const renderCodexRunning = (run: Extract<CodexState, { status: 'running' }>) => {
  setText(codexTitleTarget, run.mode === 'login' ? 'Login running' : 'Codex running');
  setText(
    codexMessageTarget,
    run.mode === 'workspace-write'
      ? 'Codex may edit files in this project.'
      : 'Streaming Codex output.',
  );
  renderCodexDetails([
    ['Run ID', run.runId],
    ['Mode', run.mode],
  ]);
  renderCodexOutput(run.output);
  setCodexInputsDisabled(true);
  renderCodexActions('Running...', true, true);
};

const renderCodexFinished = (
  finished: Extract<CodexState, { status: 'completed' | 'failed' | 'canceled' }>,
) => {
  const title =
    finished.status === 'completed'
      ? 'Codex completed'
      : finished.status === 'canceled'
        ? 'Codex canceled'
        : 'Codex failed';
  const message =
    finished.completion.message ??
    (finished.status === 'completed'
      ? 'Run finished.'
      : finished.status === 'canceled'
        ? 'Run was canceled.'
        : 'Run failed.');

  setText(codexTitleTarget, title);
  setText(codexMessageTarget, message);
  renderCodexDetails([
    ['Run ID', finished.completion.runId],
    ['Mode', finished.completion.mode],
    ['Exit', finished.completion.exitCode?.toString() ?? finished.completion.signal ?? 'Unknown'],
  ]);
  renderCodexOutput(finished.output);
  setCodexInputsDisabled(false);
  renderCodexActions('Run again', false);
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
      renderCodexReady(codexState.codexStatus);
      break;
    case 'running':
      renderCodexRunning(codexState);
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
  toggle.textContent = canExpand ? (isExpanded ? 'v' : '>') : '';
  toggle.disabled = !canExpand;
  toggle.setAttribute(
    'aria-label',
    canExpand
      ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`
      : `${node.name} has no child items`,
  );

  if (canExpand) {
    item.setAttribute('aria-expanded', isExpanded.toString());
    row.classList.add('tree-row--interactive');
    row.addEventListener('click', () => {
      toggleFolder(node.relativePath);
    });
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFolder(node.relativePath);
    });
  }

  row.append(toggle);
};

const createTreeRow = (item: HTMLLIElement, node: FolderTreeNode) => {
  const row = document.createElement('div');
  row.className = 'tree-row';

  if (isFolderNode(node)) {
    appendFolderToggle(item, row, node);
  } else {
    appendTreeSpacer(row);
  }

  appendTreeNodeName(row, node);
  appendTreeNodeMeta(row, node);
  appendTreeNodeHints(row, node);

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
  renderContextPackage(scan);
  renderTranscriptionImport(scan);
  renderCodex(scan);
  renderTree(scan);
};

const sourceLabel = (snapshot?: AppSettingsSnapshot) => {
  if (!snapshot) {
    return 'Unknown';
  }

  if (snapshot.codexPathSource === 'environment') {
    return 'Environment variable';
  }

  if (snapshot.codexPathSource === 'saved') {
    return 'Saved setting';
  }

  return 'Automatic discovery';
};

const renderSettings = () => {
  workspaceViewTarget?.toggleAttribute('hidden', appView !== 'workspace');
  settingsViewTarget?.toggleAttribute('hidden', appView !== 'settings');
  openWorkspaceButton?.setAttribute('aria-current', appView === 'workspace' ? 'page' : 'false');
  openSettingsButton?.setAttribute('aria-current', appView === 'settings' ? 'page' : 'false');

  const snapshot = settingsState.snapshot;

  const rows: DetailRow[] = [
    ['Mode', sourceLabel(snapshot)],
    ['Effective path', snapshot?.effectiveCodexPath ?? 'Automatic discovery'],
  ];

  if (snapshot?.warning) {
    rows.push(['Warning', snapshot.warning]);
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
  const isBusy = state.status === 'loading' || projectCreationState.status === 'creating';
  const hasActiveProject = state.status === 'ready' || state.status === 'partial';
  const isEntryState = state.status === 'empty' || state.status === 'error';

  chooseFolderButtons.forEach((button) => {
    button.toggleAttribute('disabled', isBusy || !window.sidekick);
  });
  overviewGenerateContextButton?.toggleAttribute('disabled', !hasActiveProject || isBusy);
  overviewImportTranscriptionButton?.toggleAttribute('disabled', !hasActiveProject || isBusy);
  overviewRunCodexButton?.toggleAttribute('disabled', !hasActiveProject || isBusy);
  appMainTarget?.classList.toggle('app-main--single', !hasActiveProject);
  contextSurfaceTarget?.toggleAttribute('hidden', !hasActiveProject);
  actionBarTarget?.toggleAttribute('hidden', !hasActiveProject);
  summaryStripTarget?.toggleAttribute('hidden', !hasActiveProject);
  projectEntryTarget?.toggleAttribute('hidden', !isEntryState);
  stateBannerTarget?.toggleAttribute('hidden', isEntryState || hasActiveProject);
  renderProjectCreation();
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
      message: 'Settings are available in the Electron app.',
    };
    render();
    return;
  }

  settingsState = {
    ...settingsState,
    status: 'loading',
    message: 'Loading settings.',
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
      message: snapshot.warning ?? 'Settings loaded.',
    };
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to load settings.',
    };
  }

  render();
};

const openSettings = () => {
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
    message: 'Choose the Codex CLI executable.',
  };
  render();

  try {
    const codexPath = await window.sidekick.chooseCodexPath();

    if (codexPath && settingsCodexPathInput) {
      settingsCodexPathInput.value = codexPath;
      settingsState = {
        ...settingsState,
        status: 'idle',
        message: 'Path selected. Test or save the setting.',
      };
    } else {
      settingsState = {
        ...settingsState,
        status: 'idle',
        message: 'No path selected.',
      };
    }
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to choose Codex path.',
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
    message: 'Saving Codex path.',
  };
  render();

  try {
    const snapshot = await window.sidekick.saveCodexPath(currentSettingsCodexPath());
    applyCodexSettingsResult(snapshot, 'Codex path saved.');
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to save Codex path.',
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
    message: 'Resetting Codex path.',
  };
  render();

  try {
    const snapshot = await window.sidekick.resetCodexPath();
    applyCodexSettingsResult(snapshot, 'Codex path reset to automatic discovery.');
  } catch (error) {
    settingsState = {
      ...settingsState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to reset Codex path.',
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
    message: 'Testing Codex path.',
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
      message: error instanceof Error ? error.message : 'Unable to test Codex path.',
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
    contextPackageState = { status: 'complete', result };
    overviewContextPackageStatus = {
      status: 'exists',
      rootPath: scan.rootPath,
      outputFileName: result.outputFileName,
    };
  } catch (error) {
    contextPackageState = {
      status: 'error',
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
    codexState = { status: 'unavailable', message: 'Open in Electron to use Codex.' };
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
          'Codex CLI was not found. Install Codex CLI or set SIDEKICK_CODEX_PATH to the full Codex executable path.',
      };
    }
  } catch (error) {
    codexState = {
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Unable to check Codex status.',
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
      message: error instanceof Error ? error.message : 'Unable to start Codex login.',
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
        message: 'Enter a Codex prompt before running.',
        createdAt: new Date().toISOString(),
      },
      output: [],
    };
    render();
    return;
  }

  const mode: CodexRunMode = codexEditModeInput?.checked ? 'workspace-write' : 'read-only';

  if (
    mode === 'workspace-write' &&
    !window.confirm('Allow Codex to change files in the selected project folder?')
  ) {
    return;
  }

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
        message: error instanceof Error ? error.message : 'Unable to start Codex.',
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
      message: error instanceof Error ? error.message : 'Unable to cancel Codex.',
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
overviewGenerateContextButton?.addEventListener('click', handleContextPackagePrimary);
contextPackageSecondaryButton?.addEventListener('click', () => {
  contextPackageState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  render();
});
transcriptionImportPrimaryButton?.addEventListener('click', handleTranscriptionImportPrimary);
overviewImportTranscriptionButton?.addEventListener('click', handleTranscriptionImportPrimary);
transcriptionImportSecondaryButton?.addEventListener('click', () => {
  transcriptionImportState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  render();
});
codexPrimaryButton?.addEventListener('click', handleCodexPrimary);
overviewRunCodexButton?.addEventListener('click', handleCodexPrimary);
codexSecondaryButton?.addEventListener('click', () => {
  void cancelCodexRun();
});

window.sidekick?.onCodexOutput?.(appendCodexOutput);
window.sidekick?.onCodexCompletion?.(completeCodexRun);

render();
