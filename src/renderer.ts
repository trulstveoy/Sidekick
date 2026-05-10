import './index.css';
import './shared/sidekick-api';
import type {
  ArtifactType,
  ContextPackagePreview,
  ContextPackageResult,
  FolderSignal,
  FolderTreeNode,
  ProjectFolderScan,
  ScanWarning,
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

const appInfoTarget = document.querySelector<HTMLSpanElement>('[data-app-info]');
const chooseFolderButton = document.querySelector<HTMLButtonElement>('[data-choose-folder]');
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

  const rows = scan
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

  summaryTarget.replaceChildren(
    ...rows.map(([label, value]) => {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);

      return wrapper;
    }),
  );
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

const renderContextPackageDetails = (rows: Array<[string, string]>) => {
  clear(contextPackageDetailsTarget);

  contextPackageDetailsTarget?.append(
    ...rows.map(([label, value]) => {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);

      return wrapper;
    }),
  );
};

const renderContextPackageList = (items: string[]) => {
  clear(contextPackageListTarget);
  contextPackageListTarget?.append(...items.map(createListItem));
};

const renderContextPackageActions = (
  primaryLabel: string,
  primaryDisabled: boolean,
  secondaryVisible = false,
) => {
  if (contextPackagePrimaryButton) {
    contextPackagePrimaryButton.textContent = primaryLabel;
    contextPackagePrimaryButton.disabled = primaryDisabled;
  }

  contextPackageSecondaryButton?.toggleAttribute('hidden', !secondaryVisible);
};

const renderContextPackage = (scan?: ProjectFolderScan) => {
  if (!scan || !window.sidekick || contextPackageState.status === 'unavailable') {
    setText(contextPackageTitleTarget, 'No folder selected');
    setText(
      contextPackageMessageTarget,
      window.sidekick ? 'Choose a folder first.' : 'Open in Electron to create context packages.',
    );
    renderContextPackageDetails([]);
    renderContextPackageList([]);
    renderContextPackageActions('Create context package', true);
    return;
  }

  if (contextPackageState.status === 'ready') {
    setText(contextPackageTitleTarget, 'Ready');
    setText(contextPackageMessageTarget, 'Create one Markdown package in the folder root.');
    renderContextPackageDetails([
      ['Scope', 'Full selected folder'],
      ['Format', 'Markdown'],
    ]);
    renderContextPackageList([]);
    renderContextPackageActions('Create context package', false);
    return;
  }

  if (contextPackageState.status === 'previewing') {
    setText(contextPackageTitleTarget, 'Preparing');
    setText(contextPackageMessageTarget, 'Checking output path.');
    renderContextPackageDetails([]);
    renderContextPackageList([]);
    renderContextPackageActions('Preparing...', true);
    return;
  }

  if (contextPackageState.status === 'confirming') {
    const { preview } = contextPackageState;
    setText(contextPackageTitleTarget, 'Confirm generation');
    setText(contextPackageMessageTarget, 'Review the output before writing.');
    renderContextPackageDetails([
      ['Output file', preview.outputFileName],
      ['Overwrite', preview.willOverwrite ? 'Yes' : 'No'],
      ['Output path', preview.outputPath],
    ]);
    renderContextPackageList([preview.binaryFileWarning, preview.selfIgnoreWarning]);
    renderContextPackageActions('Generate package', false, true);
    return;
  }

  if (contextPackageState.status === 'generating') {
    const { preview } = contextPackageState;
    setText(contextPackageTitleTarget, 'Generating');
    setText(contextPackageMessageTarget, 'Writing context package.');
    renderContextPackageDetails([
      ['Output file', preview.outputFileName],
      ['Output path', preview.outputPath],
    ]);
    renderContextPackageList([]);
    renderContextPackageActions('Generating...', true);
    return;
  }

  if (contextPackageState.status === 'complete') {
    const { result } = contextPackageState;
    const skippedPreview = result.skippedFiles
      .slice(0, 5)
      .map((file) => `${file.path}: ${file.reason}`);
    const warningPreview = result.warnings.map((warning) =>
      warning.path ? `${warning.path}: ${warning.message}` : warning.message,
    );
    setText(contextPackageTitleTarget, 'Package created');
    setText(contextPackageMessageTarget, result.overwritten ? 'Existing package overwritten.' : 'Context package created.');
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
    return;
  }

  setText(contextPackageTitleTarget, 'Generation failed');
  setText(contextPackageMessageTarget, contextPackageState.message);
  renderContextPackageDetails([]);
  renderContextPackageList([]);
  renderContextPackageActions('Try again', false);
};

const renderTreeToolbar = (scan?: ProjectFolderScan) => {
  const hasScan = Boolean(scan);

  treeToolbarTarget?.toggleAttribute('hidden', !hasScan);
  expandAllButton?.toggleAttribute('disabled', !hasScan);
  collapseAllButton?.toggleAttribute('disabled', !hasScan);
};

const renderTreeNode = (node: FolderTreeNode, level = 1) => {
  const item = document.createElement('li');
  item.className = `tree-node tree-node--${node.kind}`;
  item.setAttribute('role', 'treeitem');
  item.setAttribute('aria-level', level.toString());

  const row = document.createElement('div');
  row.className = 'tree-row';

  if (isFolderNode(node)) {
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
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'tree-toggle-spacer';
    row.append(spacer);
  }

  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = node.kind === 'folder' ? `${node.name}/` : node.name;
  row.append(name);

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

  if (node.contextHints.length > 0) {
    const hints = document.createElement('span');
    hints.className = 'tree-hints';
    hints.textContent = node.contextHints.map((hint) => signalLabels[hint]).join(', ');
    row.append(hints);
  }

  item.append(row);

  if (isFolderNode(node) && expandedPaths.has(node.relativePath) && hasChildren(node)) {
    const children = document.createElement('ol');
    children.setAttribute('role', 'group');
    children.append(...getChildren(node).map((child) => renderTreeNode(child, level + 1)));
    item.append(children);
  }

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

const render = () => {
  chooseFolderButton?.toggleAttribute('disabled', state.status === 'loading' || !window.sidekick);

  if (state.status === 'empty') {
    setText(selectedNameTarget, 'No folder selected');
    setText(selectedPathTarget, window.sidekick ? 'Choose a folder to inspect.' : 'Open in Electron to inspect local folders.');
    setText(stateTitleTarget, 'Choose a project folder');
    setText(stateMessageTarget, 'Read-only scan of structure, metadata, and artifact types.');
    renderSummary();
    renderArtifactCounts();
    renderFolderSignals();
    renderRecentFiles();
    renderWarnings();
    renderContextPackage();
    renderTree();
    return;
  }

  if (state.status === 'loading') {
    setText(stateTitleTarget, 'Scanning folder');
    setText(stateMessageTarget, 'Reading structure and metadata.');
    renderContextPackage();
    renderTree();
    return;
  }

  if (state.status === 'error') {
    setText(stateTitleTarget, 'Unable to inspect folder');
    setText(stateMessageTarget, state.message);
    renderContextPackage();
    renderWarnings([
      {
        path: '.',
        type: 'read-error',
        severity: 'error',
        message: state.message,
      },
    ]);
    return;
  }

  const scan = state.scan;
  const newestFile = scan.summary.recentFiles[0];

  setText(selectedNameTarget, scan.rootName);
  setText(selectedPathTarget, scan.rootPath);
  setText(stateTitleTarget, state.status === 'partial' ? 'Partial folder overview' : 'Folder overview');
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
  renderTree(scan);
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
      state = { status: 'empty' };
      render();
      return;
    }

    resetExpandedPaths();
    setContextPackageStateForScan(scan);
    state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
    render();
  } catch (error) {
    expandedPaths = new Set();
    setContextPackageStateForScan();
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to inspect the selected folder.',
    };
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

expandAllButton?.addEventListener('click', expandAllFolders);
collapseAllButton?.addEventListener('click', collapseAllFolders);
contextPackagePrimaryButton?.addEventListener('click', handleContextPackagePrimary);
contextPackageSecondaryButton?.addEventListener('click', () => {
  contextPackageState = getActiveScan() ? { status: 'ready' } : { status: 'unavailable' };
  render();
});

render();
