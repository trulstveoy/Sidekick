import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { lstat } from 'node:fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import type {
  AppInfo,
  AppSettingsSnapshot,
  CodexPathTestResult,
  CodexCompletionEvent,
  CodexRunRequest,
  WorkspaceCreationRequest,
  WorkspaceInitializationPreview,
  TranscriptionSummaryBatchPreview,
  TranscriptionSummaryReadRequest,
  TranscriptionImportPreview,
  SearchWorkspaceRequest,
  FolderTagEditRequest,
  WorkspaceScan,
} from './shared/sidekick-api';
import {
  generateContextPackage,
  generateFolderContextPackage,
  getContextPackagePreview,
  getFolderContextPackagePreview,
} from './main/context-package';
import {
  generateDocumentRelationships,
  readDocumentRelationships,
} from './main/document-relationships';
import { CodexRunner } from './main/codex-runner';
import { scanWorkspaceFolder } from './main/folder-scanner';
import {
  FOLDER_METADATA_FILE_NAME,
  ROOT_RELATIVE_PATH,
  addFolderTag,
  removeFolderTag,
  toFolderMetadataSummary,
} from './main/context-metadata';
import { readWorkspaceInfo } from './main/workspace-info';
import { createWorkspaceFolder } from './main/workspace-creator';
import {
  confirmWorkspaceInitialization,
  createWorkspaceInitializationPreview,
} from './main/workspace-initializer';
import {
  confirmTranscriptionImport,
  createTranscriptionImportPreview,
} from './main/transcription-importer';
import {
  generateTranscriptionSummary,
  readTranscriptionSummary,
} from './main/transcription-summary';
import {
  confirmTranscriptionSummaryBatch,
  createTranscriptionSummaryBatchPreview,
} from './main/transcription-summary-batch';
import { AppSettingsStore, normalizeCodexPath, validateCodexPath } from './main/settings-store';
import { SearchIndexManager } from './main/search-index';
import { WorkspaceFileEventService } from './main/workspace-file-events';
import { WorkspaceWatchManager } from './main/workspace-watch-manager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.enableSandbox();

const getAppInfo = (): AppInfo => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
  isPackaged: app.isPackaged,
});

ipcMain.handle('app:get-info', getAppInfo);

const appIconPath = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'sidekick-icon.png')
    : path.join(app.getAppPath(), 'assets', 'icons', 'generated', 'sidekick-icon.png');

const selectedWorkspaceRoots = new Set<string>();
const selectedWorkspaceParentFolders = new Set<string>();
let activeWorkspaceRoot: string | undefined;
const pendingTranscriptionImports = new Map<string, TranscriptionImportPreview>();
const pendingTranscriptionSummaryBatches = new Map<string, TranscriptionSummaryBatchPreview>();
const pendingWorkspaceInitializations = new Map<string, WorkspaceInitializationPreview>();
let settingsStore: AppSettingsStore | undefined;
const codexRunner = new CodexRunner();
const workspaceFileEventService = new WorkspaceFileEventService();
const searchIndexManager = new SearchIndexManager(workspaceFileEventService);
const workspaceWatchManager = new WorkspaceWatchManager(workspaceFileEventService);
const codexRuns = new Map<
  string,
  {
    sender: Electron.WebContents;
    rootPath: string;
    mode: CodexCompletionEvent['mode'];
  }
>();

const getSettingsStore = () => {
  settingsStore ??= new AppSettingsStore(app.getPath('userData'));

  return settingsStore;
};

const codexEnvironmentFromSettings = (snapshot: AppSettingsSnapshot) => {
  const environmentPath = normalizeCodexPath(process.env.SIDEKICK_CODEX_PATH);

  // An environment override wins over saved UI settings so CI, scripts, and
  // advanced users can force an executable without mutating app state.
  if (environmentPath || !snapshot.settings.sidekick_codex_path) {
    return process.env;
  }

  return {
    ...process.env,
    SIDEKICK_CODEX_PATH: snapshot.settings.sidekick_codex_path,
  };
};

const applyCodexSettings = async () => {
  const snapshot = await getSettingsStore().snapshot();
  codexRunner.setEnvironment(codexEnvironmentFromSettings(snapshot));

  return snapshot;
};

searchIndexManager.on('status', (status) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.webContents.isDestroyed()) {
      window.webContents.send('search-index:status', status);
    }
  });
});

workspaceWatchManager.on('status', (status) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.webContents.isDestroyed()) {
      window.webContents.send('workspace:watch-status', status);
    }
  });
});

const broadcastWorkspaceScan = (scan: WorkspaceScan) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.webContents.isDestroyed()) {
      window.webContents.send('workspace:scan-updated', scan);
    }
  });
};

const activateWorkspaceScan = (scan: WorkspaceScan) => {
  selectedWorkspaceRoots.add(scan.rootPath);
  activeWorkspaceRoot = scan.rootPath;
  workspaceWatchManager.watchWorkspace(scan.rootPath);

  return scan;
};

workspaceWatchManager.on('refresh', (rootPath) => {
  void (async () => {
    if (activeWorkspaceRoot !== rootPath || !selectedWorkspaceRoots.has(rootPath)) {
      return;
    }

    try {
      const scan = await scanWorkspaceFolder(rootPath);

      if (activeWorkspaceRoot !== rootPath) {
        return;
      }

      broadcastWorkspaceScan(scan);
      workspaceWatchManager.notifyUpdated(rootPath);
    } catch (error) {
      workspaceWatchManager.notifyRefreshFailed(
        rootPath,
        error instanceof Error ? error.message : 'Kunne ikke oppdatere arbeidsområdet.',
      );
    }
  })();
});

ipcMain.handle('workspace:choose-and-scan', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose workspace',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const scan = await scanWorkspaceFolder(result.filePaths[0]);
  activateWorkspaceScan(scan);
  searchIndexManager.startInitialIndex(scan.rootPath);

  return scan;
});

ipcMain.handle('workspace:choose-parent', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose where to create the workspace',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  selectedWorkspaceParentFolders.add(result.filePaths[0]);
  return result.filePaths[0];
});

ipcMain.handle('workspace:create', async (event, request: WorkspaceCreationRequest) => {
  if (!request || typeof request.workspaceName !== 'string') {
    throw new Error('Workspace name is required.');
  }

  if (typeof request.parentPath !== 'string' || !selectedWorkspaceParentFolders.has(request.parentPath)) {
    throw new Error('Choose where the workspace should be created.');
  }

  const createdWorkspace = await createWorkspaceFolder({
    parentPath: request.parentPath,
    request,
  });
  const scan = await scanWorkspaceFolder(createdWorkspace.rootPath);
  activateWorkspaceScan(scan);
  searchIndexManager.startInitialIndex(createdWorkspace.rootPath);

  return {
    ...createdWorkspace,
    scan,
  };
});

ipcMain.handle('workspace:choose-for-initialization', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose existing workspace',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const preview = await createWorkspaceInitializationPreview(result.filePaths[0]);
  pendingWorkspaceInitializations.set(preview.previewId, preview);

  return preview;
});

ipcMain.handle('workspace:confirm-initialization', async (_event, previewId) => {
  if (typeof previewId !== 'string' || previewId.trim().length === 0) {
    throw new Error('A workspace initialization preview is required.');
  }

  const preview = pendingWorkspaceInitializations.get(previewId);

  if (!preview) {
    throw new Error('The workspace initialization preview has expired.');
  }

  try {
    const initializedWorkspace = await confirmWorkspaceInitialization(preview.rootPath);
    const scan = await scanWorkspaceFolder(initializedWorkspace.rootPath);
    activateWorkspaceScan(scan);
    searchIndexManager.startInitialIndex(initializedWorkspace.rootPath);

    return {
      status: 'complete',
      ...initializedWorkspace,
      scan,
    };
  } finally {
    pendingWorkspaceInitializations.delete(previewId);
  }
});

const assertKnownWorkspaceRoot = (rootPath: unknown) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) {
    throw new Error('A selected workspace is required.');
  }

  // Renderer requests may name only roots that were selected through a native
  // dialog or created by Sidekick in this process.
  if (!selectedWorkspaceRoots.has(rootPath)) {
    throw new Error('This action requires a folder selected in Sidekick.');
  }

  return rootPath;
};

const isPathInside = (parentPath: string, childPath: string) => {
  const relativePath = path.relative(parentPath, childPath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const normalizeWorkspaceRelativePath = (relativePath: string) => {
  if (path.isAbsolute(relativePath)) {
    throw new Error('Selected folder path must be relative to the workspace root.');
  }

  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/g, '');

  if (!normalized || normalized === ROOT_RELATIVE_PATH) {
    throw new Error('Workspace root cannot be tagged in this version.');
  }

  const segments = normalized.split('/');

  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('Selected folder path must stay inside the workspace root.');
  }

  if (segments.includes('.sidekick') || segments.includes(FOLDER_METADATA_FILE_NAME)) {
    throw new Error('Sidekick metadata paths cannot be tagged.');
  }

  return {
    normalized,
    segments,
  };
};

const resolveFolderTagRequest = async (request: unknown): Promise<FolderTagEditRequest & { folderPath: string }> => {
  if (!request || typeof request !== 'object') {
    throw new Error('A folder tag request is required.');
  }

  const { rootPath, folderRelativePath, label } = request as Partial<FolderTagEditRequest>;

  if (typeof folderRelativePath !== 'string') {
    throw new Error('A selected folder path is required.');
  }

  if (typeof label !== 'string' || label.trim().length === 0) {
    throw new Error('A tag label is required.');
  }

  const workspaceRoot = assertKnownWorkspaceRoot(rootPath);
  const { normalized, segments } = normalizeWorkspaceRelativePath(folderRelativePath);
  const folderPath = path.resolve(workspaceRoot, ...segments);

  if (!isPathInside(workspaceRoot, folderPath)) {
    throw new Error('Selected folder must stay inside the workspace root.');
  }

  const stats = await lstat(folderPath);

  if (!stats.isDirectory()) {
    throw new Error('Selected path must be a folder.');
  }

  return {
    rootPath: workspaceRoot,
    folderRelativePath: normalized,
    label,
    folderPath,
  };
};

const createFolderTagEditResult = async (
  request: FolderTagEditRequest & { folderPath: string },
  operation: typeof addFolderTag | typeof removeFolderTag,
) => {
  const metadata = await operation(request.folderPath, request.label);
  const scan = await scanWorkspaceFolder(request.rootPath);

  return {
    status: 'complete' as const,
    rootPath: request.rootPath,
    folderRelativePath: request.folderRelativePath,
    metadata: toFolderMetadataSummary('valid', request.folderRelativePath, metadata),
    scan,
  };
};

ipcMain.handle('context-package:preview', (_event, rootPath) =>
  getContextPackagePreview(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('context-package:generate', (_event, rootPath) =>
  generateContextPackage(assertKnownWorkspaceRoot(rootPath), { codexRunner }),
);

ipcMain.handle('workspace-info:read', (_event, rootPath) =>
  readWorkspaceInfo(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('document-relationships:read', (_event, rootPath) =>
  readDocumentRelationships(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('document-relationships:generate', (_event, rootPath) =>
  generateDocumentRelationships({
    rootPath: assertKnownWorkspaceRoot(rootPath),
    codexRunner,
  }),
);

const assertFolderContextPackageRequest = (request: unknown) => {
  if (!request || typeof request !== 'object') {
    throw new Error('A selected folder is required.');
  }

  const { rootPath, folderRelativePath } = request as {
    rootPath?: unknown;
    folderRelativePath?: unknown;
  };

  if (typeof folderRelativePath !== 'string') {
    throw new Error('A selected folder path is required.');
  }

  return {
    rootPath: assertKnownWorkspaceRoot(rootPath),
    folderRelativePath,
  };
};

ipcMain.handle('context-package:preview-folder', (_event, request) =>
  getFolderContextPackagePreview(assertFolderContextPackageRequest(request)),
);

ipcMain.handle('context-package:generate-folder', (_event, request) =>
  generateFolderContextPackage(assertFolderContextPackageRequest(request)),
);

ipcMain.handle('folder-tags:add', async (_event, request) =>
  createFolderTagEditResult(await resolveFolderTagRequest(request), addFolderTag),
);

ipcMain.handle('folder-tags:remove', async (_event, request) =>
  createFolderTagEditResult(await resolveFolderTagRequest(request), removeFolderTag),
);

const assertSearchWorkspaceRequest = (request: unknown): SearchWorkspaceRequest => {
  if (!request || typeof request !== 'object') {
    throw new Error('A search request is required.');
  }

  const { rootPath, query, limit } = request as Partial<SearchWorkspaceRequest>;

  if (typeof query !== 'string') {
    throw new Error('Search query must be text.');
  }

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
    throw new Error('Search limit must be between 1 and 50.');
  }

  return {
    rootPath: assertKnownWorkspaceRoot(rootPath),
    query,
    limit,
  };
};

ipcMain.handle('search-index:get-status', (_event, rootPath) =>
  searchIndexManager.getStatus(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('search-index:refresh', (_event, rootPath) =>
  searchIndexManager.refresh(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('search-index:search', (_event, request) =>
  searchIndexManager.search(assertSearchWorkspaceRequest(request)),
);

ipcMain.handle('transcription:preview-import', async (event, rootPath) => {
  const workspaceRoot = assertKnownWorkspaceRoot(rootPath);
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose transcription',
    properties: ['openFile'],
    filters: [
      {
        name: 'Text and Markdown',
        extensions: ['txt', 'md', 'markdown'],
      },
    ],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const preview = await createTranscriptionImportPreview(workspaceRoot, result.filePaths[0]);
  pendingTranscriptionImports.set(preview.previewId, preview);

  return preview;
});

ipcMain.handle('transcription:confirm-import', async (_event, previewId) => {
  if (typeof previewId !== 'string') {
    throw new Error('A transcription import preview is required.');
  }

  const preview = pendingTranscriptionImports.get(previewId);

  if (!preview) {
    throw new Error('The transcription import preview has expired.');
  }

  try {
    // Confirm uses the stored preview rather than renderer-supplied paths, then
    // revalidates the root in case the selected workspace set has changed.
    assertKnownWorkspaceRoot(preview.rootPath);

    return await confirmTranscriptionImport(preview, ({ rootPath, transcriptionPath }) =>
      generateTranscriptionSummary({
        rootPath,
        transcriptionPath,
        codexRunner,
      }),
    );
  } finally {
    pendingTranscriptionImports.delete(previewId);
  }
});

const assertTranscriptionSummaryReadRequest = (
  request: unknown,
): TranscriptionSummaryReadRequest => {
  if (!request || typeof request !== 'object') {
    throw new Error('A transcription summary request is required.');
  }

  const { rootPath, transcriptionRelativePath } = request as Partial<TranscriptionSummaryReadRequest>;

  if (typeof transcriptionRelativePath !== 'string') {
    throw new Error('A workspace-relative transcription path is required.');
  }

  return {
    rootPath: assertKnownWorkspaceRoot(rootPath),
    transcriptionRelativePath,
  };
};

ipcMain.handle('transcription:read-summary', (_event, request) => {
  const summaryRequest = assertTranscriptionSummaryReadRequest(request);

  return readTranscriptionSummary(
    summaryRequest.rootPath,
    summaryRequest.transcriptionRelativePath,
  );
});

ipcMain.handle('transcription:preview-summary-batch', async (_event, rootPath) => {
  const workspaceRoot = assertKnownWorkspaceRoot(rootPath);
  const preview = await createTranscriptionSummaryBatchPreview(
    workspaceRoot,
    readTranscriptionSummary,
  );
  pendingTranscriptionSummaryBatches.set(preview.previewId, preview);

  return preview;
});

ipcMain.handle('transcription:confirm-summary-batch', async (_event, previewId) => {
  if (typeof previewId !== 'string' || previewId.trim().length === 0) {
    throw new Error('A transcription summary preview is required.');
  }

  const preview = pendingTranscriptionSummaryBatches.get(previewId);

  if (!preview) {
    throw new Error('The transcription summary preview has expired.');
  }

  try {
    const workspaceRoot = assertKnownWorkspaceRoot(preview.rootPath);

    return await confirmTranscriptionSummaryBatch({
      rootPath: workspaceRoot,
      reader: readTranscriptionSummary,
      generateSummary: ({ rootPath: summaryRootPath, transcriptionPath }) =>
        generateTranscriptionSummary({
          rootPath: summaryRootPath,
          transcriptionPath,
          codexRunner,
        }),
    });
  } finally {
    pendingTranscriptionSummaryBatches.delete(previewId);
  }
});

const assertCodexRunRequest = (request: unknown): CodexRunRequest => {
  if (!request || typeof request !== 'object') {
    throw new Error('A Codex run request is required.');
  }

  const { rootPath, prompt, mode } = request as Partial<CodexRunRequest>;

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Enter a Codex prompt before running.');
  }

  if (mode !== 'read-only' && mode !== 'workspace-write') {
    throw new Error('Choose a valid Codex run mode.');
  }

  return {
    rootPath: assertKnownWorkspaceRoot(rootPath),
    prompt,
    mode,
  };
};

codexRunner.on('output', (output) => {
  const run = codexRuns.get(output.runId);

  if (!run || run.sender.isDestroyed()) {
    return;
  }

  run.sender.send('codex:output', output);
});

codexRunner.on('completion', (completion) => {
  const run = codexRuns.get(completion.runId);

  if (!run) {
    return;
  }

  void (async () => {
    let completedEvent = completion;

    if (completion.state === 'completed' && run.mode === 'workspace-write') {
      try {
        // Edit-mode Codex runs may have changed files, so the renderer receives
        // a fresh scan as part of the completion event.
        const scan = await scanWorkspaceFolder(run.rootPath);
        completedEvent = {
          ...completion,
          scan,
        };
      } catch (error) {
        completedEvent = {
          ...completion,
          message:
            error instanceof Error
              ? `Codex completed, but the workspace refresh failed: ${error.message}`
              : 'Codex completed, but the workspace refresh failed.',
        };
      }
    }

    if (!run.sender.isDestroyed()) {
      run.sender.send('codex:completion', completedEvent);
    }

    codexRuns.delete(completion.runId);
  })();
});

ipcMain.handle('codex:get-status', (_event, rootPath) =>
  codexRunner.getStatus(assertKnownWorkspaceRoot(rootPath)),
);

ipcMain.handle('codex:start-login', (event, rootPath) => {
  const workspaceRoot = assertKnownWorkspaceRoot(rootPath);
  const runId = codexRunner.startLogin(workspaceRoot);
  codexRuns.set(runId, {
    sender: event.sender,
    rootPath: workspaceRoot,
    mode: 'login',
  });

  return { runId };
});

ipcMain.handle('codex:start-run', (event, request) => {
  const codexRequest = assertCodexRunRequest(request);
  const runId = codexRunner.startExec(
    codexRequest.rootPath,
    codexRequest.prompt,
    codexRequest.mode,
  );
  codexRuns.set(runId, {
    sender: event.sender,
    rootPath: codexRequest.rootPath,
    mode: codexRequest.mode,
  });

  return { runId };
});

ipcMain.handle('codex:cancel', (_event, runId) => {
  if (typeof runId !== 'string' || runId.trim().length === 0) {
    throw new Error('A Codex run id is required.');
  }

  codexRunner.cancel(runId);
});

ipcMain.handle('settings:get', () => getSettingsStore().snapshot());

ipcMain.handle('settings:choose-codex-path', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose Codex CLI executable',
    properties: ['openFile'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('settings:save-codex-path', async (_event, codexPath) => {
  await getSettingsStore().updateCodexPath(codexPath);
  return applyCodexSettings();
});

ipcMain.handle('settings:reset-codex-path', async () => {
  await getSettingsStore().updateCodexPath(null);
  return applyCodexSettings();
});

ipcMain.handle('settings:test-codex-path', async (_event, codexPath): Promise<CodexPathTestResult> => {
  try {
    const validatedPath = await validateCodexPath(codexPath);
    const snapshot = await getSettingsStore().snapshot();
    const environment =
      validatedPath && !normalizeCodexPath(process.env.SIDEKICK_CODEX_PATH)
        ? {
            ...process.env,
            SIDEKICK_CODEX_PATH: validatedPath,
          }
        : codexEnvironmentFromSettings(snapshot);
    const testRunner = new CodexRunner('codex', environment);
    const status = await testRunner.getStatus(app.getPath('home'));

    return {
      ok: status.state !== 'unavailable',
      state: status.state,
      version: status.version,
      message:
        status.state === 'unavailable'
          ? status.message ?? 'Codex CLI is unavailable.'
          : status.version
            ? `Codex detected: ${status.version}`
            : status.message ?? 'Codex detected.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Codex CLI path could not be tested.',
    };
  }
});

const isAllowedNavigation = (targetUrl: string) => {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    return targetUrl.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  }

  return new URL(targetUrl).protocol === 'file:';
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 720,
    title: 'Sidekick',
    backgroundColor: '#f7f5ef',
    icon: appIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      void shell.openExternal(url);
    }

    // New windows are never opened inside the renderer; allowed https links are
    // delegated to the OS browser and every other target is denied.
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isAllowedNavigation(targetUrl)) {
      event.preventDefault();
    }
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  app.setAppUserModelId('com.sidekick.app');
  await applyCodexSettings();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  void searchIndexManager.close();
  workspaceWatchManager.close();
  workspaceFileEventService.close();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
