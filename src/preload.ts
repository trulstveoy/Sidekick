import { contextBridge, ipcRenderer } from 'electron';
import type { CodexCompletionEvent, CodexOutputEvent, SidekickApi } from './shared/sidekick-api';

// Keep the renderer on a typed, task-specific surface. It never receives raw
// ipcRenderer, filesystem, process, or shell access.
const sidekickApi: SidekickApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  chooseProjectFolder: () => ipcRenderer.invoke('project-folder:choose-and-scan'),
  chooseProjectParentFolder: () => ipcRenderer.invoke('project-folder:choose-parent'),
  createProjectFolder: (request) => ipcRenderer.invoke('project-folder:create', request),
  chooseProjectFolderForInitialization: () =>
    ipcRenderer.invoke('project-folder:choose-for-initialization'),
  confirmProjectInitialization: (previewId) =>
    ipcRenderer.invoke('project-folder:confirm-initialization', previewId),
  previewContextPackage: (rootPath) => ipcRenderer.invoke('context-package:preview', rootPath),
  generateContextPackage: (rootPath) => ipcRenderer.invoke('context-package:generate', rootPath),
  previewFolderContextPackage: (request) =>
    ipcRenderer.invoke('context-package:preview-folder', request),
  generateFolderContextPackage: (request) =>
    ipcRenderer.invoke('context-package:generate-folder', request),
  previewTranscriptionImport: (rootPath) =>
    ipcRenderer.invoke('transcription:preview-import', rootPath),
  confirmTranscriptionImport: (previewId) =>
    ipcRenderer.invoke('transcription:confirm-import', previewId),
  getCodexStatus: (rootPath) => ipcRenderer.invoke('codex:get-status', rootPath),
  startCodexLogin: (rootPath) => ipcRenderer.invoke('codex:start-login', rootPath),
  startCodexRun: (request) => ipcRenderer.invoke('codex:start-run', request),
  cancelCodexRun: (runId) => ipcRenderer.invoke('codex:cancel', runId),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveCodexPath: (codexPath) => ipcRenderer.invoke('settings:save-codex-path', codexPath),
  resetCodexPath: () => ipcRenderer.invoke('settings:reset-codex-path'),
  chooseCodexPath: () => ipcRenderer.invoke('settings:choose-codex-path'),
  testCodexPath: (codexPath) => ipcRenderer.invoke('settings:test-codex-path', codexPath),
  onCodexOutput: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, output: CodexOutputEvent) => {
      listener(output);
    };
    ipcRenderer.on('codex:output', handler);

    return () => {
      ipcRenderer.off('codex:output', handler);
    };
  },
  onCodexCompletion: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, completion: CodexCompletionEvent) => {
      listener(completion);
    };
    ipcRenderer.on('codex:completion', handler);

    return () => {
      ipcRenderer.off('codex:completion', handler);
    };
  },
};

contextBridge.exposeInMainWorld('sidekick', sidekickApi);
