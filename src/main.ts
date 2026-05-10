import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import type { AppInfo } from './shared/sidekick-api';
import { generateContextPackage, getContextPackagePreview } from './main/context-package';
import { scanProjectFolder } from './main/folder-scanner';

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

const selectedProjectRoots = new Set<string>();

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

const assertKnownProjectRoot = (rootPath: unknown) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) {
    throw new Error('A selected project folder is required.');
  }

  if (!selectedProjectRoots.has(rootPath)) {
    throw new Error('Context package generation requires a folder selected in Sidekick.');
  }

  return rootPath;
};

ipcMain.handle('context-package:preview', (_event, rootPath) =>
  getContextPackagePreview(assertKnownProjectRoot(rootPath)),
);

ipcMain.handle('context-package:generate', (_event, rootPath) =>
  generateContextPackage(assertKnownProjectRoot(rootPath)),
);

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
app.whenReady().then(() => {
  app.setAppUserModelId('com.sidekick.app');
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
