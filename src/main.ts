import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import type {
  AppInfo,
  AppSettingsSnapshot,
  CodexPathTestResult,
  CodexCompletionEvent,
  CodexRunRequest,
  ProjectCreationRequest,
  ProjectInitializationPreview,
  TranscriptionImportPreview,
} from './shared/sidekick-api';
import { generateContextPackage, getContextPackagePreview } from './main/context-package';
import { CodexRunner } from './main/codex-runner';
import { scanProjectFolder } from './main/folder-scanner';
import { createProjectFolder } from './main/project-creator';
import {
  confirmProjectInitialization,
  createProjectInitializationPreview,
} from './main/project-initializer';
import {
  confirmTranscriptionImport,
  createTranscriptionImportPreview,
} from './main/transcription-importer';
import { AppSettingsStore, normalizeCodexPath, validateCodexPath } from './main/settings-store';

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

const selectedProjectRoots = new Set<string>();
const selectedProjectParentFolders = new Set<string>();
const pendingTranscriptionImports = new Map<string, TranscriptionImportPreview>();
const pendingProjectInitializations = new Map<string, ProjectInitializationPreview>();
let settingsStore: AppSettingsStore | undefined;
const codexRunner = new CodexRunner();
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

ipcMain.handle('project-folder:choose-and-scan', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose project folder',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  selectedProjectRoots.add(result.filePaths[0]);
  return scanProjectFolder(result.filePaths[0]);
});

ipcMain.handle('project-folder:choose-parent', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose where to create the project',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  selectedProjectParentFolders.add(result.filePaths[0]);
  return result.filePaths[0];
});

ipcMain.handle('project-folder:create', async (event, request: ProjectCreationRequest) => {
  if (!request || typeof request.projectName !== 'string') {
    throw new Error('Project name is required.');
  }

  if (typeof request.parentPath !== 'string' || !selectedProjectParentFolders.has(request.parentPath)) {
    throw new Error('Choose where the project should be created.');
  }

  const createdProject = await createProjectFolder({
    parentPath: request.parentPath,
    request,
  });
  selectedProjectRoots.add(createdProject.rootPath);

  return {
    ...createdProject,
    scan: await scanProjectFolder(createdProject.rootPath),
  };
});

ipcMain.handle('project-folder:choose-for-initialization', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const dialogOptions: Electron.OpenDialogOptions = {
    title: 'Choose existing project folder',
    properties: ['openDirectory'],
  };
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const preview = await createProjectInitializationPreview(result.filePaths[0]);
  pendingProjectInitializations.set(preview.previewId, preview);

  return preview;
});

ipcMain.handle('project-folder:confirm-initialization', async (_event, previewId) => {
  if (typeof previewId !== 'string' || previewId.trim().length === 0) {
    throw new Error('A project initialization preview is required.');
  }

  const preview = pendingProjectInitializations.get(previewId);

  if (!preview) {
    throw new Error('The project initialization preview has expired.');
  }

  try {
    const initializedProject = await confirmProjectInitialization(preview.rootPath);
    selectedProjectRoots.add(initializedProject.rootPath);

    return {
      status: 'complete',
      ...initializedProject,
      scan: await scanProjectFolder(initializedProject.rootPath),
    };
  } finally {
    pendingProjectInitializations.delete(previewId);
  }
});

const assertKnownProjectRoot = (rootPath: unknown) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) {
    throw new Error('A selected project folder is required.');
  }

  // Renderer requests may name only roots that were selected through a native
  // dialog or created by Sidekick in this process.
  if (!selectedProjectRoots.has(rootPath)) {
    throw new Error('This action requires a folder selected in Sidekick.');
  }

  return rootPath;
};

ipcMain.handle('context-package:preview', (_event, rootPath) =>
  getContextPackagePreview(assertKnownProjectRoot(rootPath)),
);

ipcMain.handle('context-package:generate', (_event, rootPath) =>
  generateContextPackage(assertKnownProjectRoot(rootPath)),
);

ipcMain.handle('transcription:preview-import', async (event, rootPath) => {
  const projectRoot = assertKnownProjectRoot(rootPath);
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

  const preview = await createTranscriptionImportPreview(projectRoot, result.filePaths[0]);
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
    // revalidates the root in case the selected project set has changed.
    assertKnownProjectRoot(preview.rootPath);

    return await confirmTranscriptionImport(preview);
  } finally {
    pendingTranscriptionImports.delete(previewId);
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
    rootPath: assertKnownProjectRoot(rootPath),
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
        const scan = await scanProjectFolder(run.rootPath);
        completedEvent = {
          ...completion,
          scan,
        };
      } catch (error) {
        completedEvent = {
          ...completion,
          message:
            error instanceof Error
              ? `Codex completed, but the project refresh failed: ${error.message}`
              : 'Codex completed, but the project refresh failed.',
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
  codexRunner.getStatus(assertKnownProjectRoot(rootPath)),
);

ipcMain.handle('codex:start-login', (event, rootPath) => {
  const projectRoot = assertKnownProjectRoot(rootPath);
  const runId = codexRunner.startLogin(projectRoot);
  codexRuns.set(runId, {
    sender: event.sender,
    rootPath: projectRoot,
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

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
