import './index.css';
import './shared/sidekick-api';
import type {
  ArtifactType,
  ContextPackagePreview,
  ContextPackageResult,
  FolderSignal,
  FolderTreeNode,
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
  | { status: 'idle'; message: string }
  | { status: 'creating'; message: string }
  | { status: 'complete'; message: string }
  | { status: 'error'; message: string };

type DetailRow = [string, string];

type ActionTargets = {
  primaryButton: HTMLButtonElement | null;
  secondaryButton: HTMLButtonElement | null;
};

const appInfoTarget = document.querySelector<HTMLSpanElement>('[data-app-info]');
const chooseFolderButton = document.querySelector<HTMLButtonElement>('[data-choose-folder]');
const projectNameInput = document.querySelector<HTMLInputElement>('[data-project-name]');
const createProjectButton = document.querySelector<HTMLButtonElement>('[data-create-project]');
const createProjectMessageTarget = document.querySelector<HTMLElement>(
  '[data-create-project-message]',
);
const selectedNameTarget = document.querySelector<HTMLElement>('[data-selected-name]');
const selectedPathTarget = document.querySelector<HTMLElement>('[data-selected-path]');
const folderSignalsTarget = document.querySelector<HTMLUListElement>('[data-folder-signals]');
const stateTitleTarget = document.querySelector<HTMLElement>('[data-state-title]');
const stateMessageTarget = document.querySelector<HTMLElement>('[data-state-message]');
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

const artifactLabels: Record<ArtifactType, string> = {
  'markdown-text': 'Markdown/text',
  document: 'Documents',
  pdf: 'PDFs',
  image: 'Images',
  audio: 'Audio',
  video: 'Video',
  'spreadsheet-data': 'Spreadsheets/data',
  presentation: 'Presentations',
  drawio: 'draw.io',
  transcript: 'Transcripts',
  note: 'Notes',
  'information-model': 'Information models',
  architecture: 'Architecture',
  unclassified: 'Unclassified',
};

const signalLabels: Record<FolderSignal, string> = {
  background: 'Background',
  transcript: 'Transcripts',
  'information-model': 'Information models',
  architecture: 'Architecture',
  thematic: 'Thematic',
};

let state: ViewState = { status: 'empty' };
let expandedPaths = new Set<string>();
let contextPackageState: ContextPackageState = { status: 'unavailable' };
let transcriptionImportState: TranscriptionImportState = { status: 'unavailable' };
let projectCreationState: ProjectCreationState = { status: 'idle', message: '' };

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

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const setContextPackageStateForScan = (scan?: ProjectFolderScan) => {
  contextPackageState = scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setTranscriptionImportStateForScan = (scan?: ProjectFolderScan) => {
  transcriptionImportState =
    scan && window.sidekick ? { status: 'ready' } : { status: 'unavailable' };
};

const setActiveScan = (scan: ProjectFolderScan) => {
  resetExpandedPaths();
  setContextPackageStateForScan(scan);
  setTranscriptionImportStateForScan(scan);
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
    parts.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
  }

  if (fileCount > 0) {
    parts.push(`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`);
  }

  return parts.length > 0 ? parts.join(' / ') : 'Empty';
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
        ['Files', scan.summary.fileCount.toString()],
        ['Folders', scan.summary.folderCount.toString()],
        ['Status', scan.status === 'partial' ? 'Partial' : 'Complete'],
      ]
    : [
        ['Files', '0'],
        ['Folders', '0'],
        ['Status', 'Waiting'],
      ];

  summaryTarget.replaceChildren(...rows.map(createDetailRow));
};

const renderArtifactCounts = (scan?: ProjectFolderScan) => {
  clear(artifactCountsTarget);

  if (!artifactCountsTarget || !scan) {
    artifactCountsTarget?.append(createListItem('No artifacts yet'));
    return;
  }

  const rows = Object.entries(scan.summary.artifactTypeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${artifactLabels[type as ArtifactType]}: ${count}`);

  artifactCountsTarget.append(...(rows.length ? rows : ['No artifacts found']).map(createListItem));
};

const renderFolderSignals = (scan?: ProjectFolderScan) => {
  clear(folderSignalsTarget);

  if (!folderSignalsTarget || !scan) {
    folderSignalsTarget?.append(createListItem('No signals yet'));
    return;
  }

  const rows = Object.entries(scan.summary.folderSignalCounts)
    .filter(([, count]) => count > 0)
    .map(([signal, count]) => `${signalLabels[signal as FolderSignal]}: ${count}`);

  folderSignalsTarget.append(...(rows.length ? rows : ['No folder signals found']).map(createListItem));
};

const renderRecentFiles = (scan?: ProjectFolderScan) => {
  clear(recentFilesTarget);

  if (!recentFilesTarget || !scan || scan.summary.recentFiles.length === 0) {
    recentFilesTarget?.append(createListItem('No recent files yet'));
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
    warningsTarget?.append(createListItem('No warnings'));
    return;
  }

  warningsTarget.append(
    ...warnings.map((warning) => createListItem(`${warning.path}: ${warning.message}`)),
  );
};

const renderProjectCreation = () => {
  const isCreating = projectCreationState.status === 'creating';

  projectNameInput?.toggleAttribute('disabled', isCreating || !window.sidekick);
  createProjectButton?.toggleAttribute('disabled', isCreating || !window.sidekick);

  if (createProjectMessageTarget) {
    if (projectCreationState.status === 'idle') {
      createProjectMessageTarget.removeAttribute('data-status');
    } else {
      createProjectMessageTarget.dataset.status = projectCreationState.status;
    }
  }

  setText(createProjectMessageTarget, projectCreationState.message);

  if (createProjectButton) {
    createProjectButton.textContent = isCreating ? 'Creating...' : 'Create project';
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
  setText(contextPackageTitleTarget, 'No folder selected');
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
  setText(transcriptionImportTitleTarget, 'No folder selected');
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
    meta.textContent = getDirectChildSummary(node);
    row.append(meta);
  } else if (node.artifactType) {
    const meta = document.createElement('span');
    meta.className = 'tree-meta';
    meta.textContent = `${artifactLabels[node.artifactType]} ${formatBytes(node.size)}`.trim();
    row.append(meta);
  }
};

const appendTreeNodeHints = (row: HTMLDivElement, node: FolderTreeNode) => {
  if (node.contextHints.length > 0) {
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

const renderNoScanPanels = () => {
  renderContextPackage();
  renderTranscriptionImport();
  renderTree();
};

const renderEmptyState = () => {
  setText(selectedNameTarget, 'No folder selected');
  setText(
    selectedPathTarget,
    window.sidekick ? 'Choose a folder to inspect.' : 'Open in Electron to inspect local folders.',
  );
  setText(stateTitleTarget, 'Choose a project folder');
  setText(stateMessageTarget, 'Read-only scan of structure, metadata, and artifact types.');
  renderSummary();
  renderArtifactCounts();
  renderFolderSignals();
  renderRecentFiles();
  renderWarnings();
  renderNoScanPanels();
};

const renderLoadingState = () => {
  setText(stateTitleTarget, 'Scanning folder');
  setText(stateMessageTarget, 'Reading structure and metadata.');
  renderNoScanPanels();
};

const renderErrorState = (message: string) => {
  setText(stateTitleTarget, 'Unable to inspect folder');
  setText(stateMessageTarget, message);
  renderContextPackage();
  renderTranscriptionImport();
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

  setText(selectedNameTarget, scan.rootName);
  setText(selectedPathTarget, scan.rootPath);
  setText(stateTitleTarget, status === 'partial' ? 'Partial folder overview' : 'Folder overview');
  setText(
    stateMessageTarget,
    newestFile
      ? `Last changed: ${formatDate(newestFile.modifiedAt)}. Folder categories are inferred hints.`
      : 'Folder categories are inferred hints.',
  );
  renderSummary(scan);
  renderArtifactCounts(scan);
  renderFolderSignals(scan);
  renderRecentFiles(scan);
  renderWarnings(scan.warnings);
  renderContextPackage(scan);
  renderTranscriptionImport(scan);
  renderTree(scan);
};

const render = () => {
  const isBusy = state.status === 'loading' || projectCreationState.status === 'creating';

  chooseFolderButton?.toggleAttribute('disabled', isBusy || !window.sidekick);
  renderProjectCreation();

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
    transcriptionImportState = { status: 'complete', result };
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
      setTranscriptionImportStateForScan();
      state = { status: 'empty' };
      render();
      return;
    }

    setActiveScan(scan);
    render();
  } catch (error) {
    expandedPaths = new Set();
    setContextPackageStateForScan();
    setTranscriptionImportStateForScan();
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to inspect the selected folder.',
    };
    render();
  }
};

const createProject = async () => {
  if (!window.sidekick) {
    projectCreationState = {
      status: 'error',
      message: 'Project creation is available in the Electron app.',
    };
    render();
    return;
  }

  const projectName = projectNameInput?.value ?? '';
  const previousState = state;
  projectCreationState = { status: 'creating', message: 'Choose where to create the project.' };
  state = { status: 'loading' };
  render();

  try {
    const result: ProjectCreationResult | null = await window.sidekick.createProjectFolder({
      projectName,
    });

    if (!result) {
      projectCreationState = { status: 'idle', message: '' };
      state = previousState;
      render();
      return;
    }

    if (projectNameInput) {
      projectNameInput.value = '';
    }

    setActiveScan(result.scan);
    projectCreationState = {
      status: 'complete',
      message: `Created ${result.rootName}.`,
    };
    render();
  } catch (error) {
    projectCreationState = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to create project.',
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

chooseFolderButton?.addEventListener('click', () => {
  void chooseFolder();
});

createProjectButton?.addEventListener('click', () => {
  void createProject();
});

expandAllButton?.addEventListener('click', expandAllFolders);
collapseAllButton?.addEventListener('click', collapseAllFolders);
contextPackagePrimaryButton?.addEventListener('click', handleContextPackagePrimary);
contextPackageSecondaryButton?.addEventListener('click', () => {
  contextPackageState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  render();
});
transcriptionImportPrimaryButton?.addEventListener('click', handleTranscriptionImportPrimary);
transcriptionImportSecondaryButton?.addEventListener('click', () => {
  transcriptionImportState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  render();
});

render();
