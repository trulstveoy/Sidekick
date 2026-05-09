import './index.css';
import './shared/sidekick-api';
import type {
  ArtifactType,
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

const appInfoTarget = document.querySelector<HTMLSpanElement>('[data-app-info]');
const chooseFolderButton = document.querySelector<HTMLButtonElement>('[data-choose-folder]');
const selectedNameTarget = document.querySelector<HTMLElement>('[data-selected-name]');
const selectedPathTarget = document.querySelector<HTMLElement>('[data-selected-path]');
const folderSignalsTarget = document.querySelector<HTMLUListElement>('[data-folder-signals]');
const stateTitleTarget = document.querySelector<HTMLElement>('[data-state-title]');
const stateMessageTarget = document.querySelector<HTMLElement>('[data-state-message]');
const treeTarget = document.querySelector<HTMLOListElement>('[data-folder-tree]');
const summaryTarget = document.querySelector<HTMLElement>('[data-summary]');
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

const renderTreeNode = (node: FolderTreeNode) => {
  const item = document.createElement('li');
  item.className = `tree-node tree-node--${node.kind}`;

  const row = document.createElement('div');
  row.className = 'tree-row';

  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = node.kind === 'folder' ? `${node.name}/` : node.name;
  row.append(name);

  if (node.kind === 'file' && node.artifactType) {
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

  if (node.children && node.children.length > 0) {
    const children = document.createElement('ol');
    children.append(...node.children.map(renderTreeNode));
    item.append(children);
  }

  return item;
};

const renderTree = (scan?: ProjectFolderScan) => {
  clear(treeTarget);

  if (!treeTarget || !scan) {
    return;
  }

  const children = scan.tree.children ?? [];
  treeTarget.append(...children.map(renderTreeNode));
};

const render = () => {
  chooseFolderButton?.toggleAttribute('disabled', state.status === 'loading' || !window.sidekick);

  if (state.status === 'empty') {
    setText(selectedNameTarget, 'No folder selected');
    setText(selectedPathTarget, window.sidekick ? 'Choose a local project folder to inspect.' : 'Open in Electron to inspect local folders.');
    setText(stateTitleTarget, 'Choose a project folder');
    setText(stateMessageTarget, 'Sidekick will inspect folder names, file metadata, and artifact types without changing files.');
    renderSummary();
    renderArtifactCounts();
    renderFolderSignals();
    renderRecentFiles();
    renderWarnings();
    renderTree();
    return;
  }

  if (state.status === 'loading') {
    setText(stateTitleTarget, 'Scanning folder');
    setText(stateMessageTarget, 'Reading structure and metadata. Files will not be changed.');
    return;
  }

  if (state.status === 'error') {
    setText(stateTitleTarget, 'Unable to inspect folder');
    setText(stateMessageTarget, state.message);
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
  renderTree(scan);
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
      state = { status: 'empty' };
      render();
      return;
    }

    state = scan.status === 'partial' ? { status: 'partial', scan } : { status: 'ready', scan };
    render();
  } catch (error) {
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

render();
