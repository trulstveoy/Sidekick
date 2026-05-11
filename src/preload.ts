import { contextBridge, ipcRenderer } from 'electron';
import type { CodexCompletionEvent, CodexOutputEvent, SidekickApi } from './shared/sidekick-api';

const sidekickApi: SidekickApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  chooseProjectFolder: () => ipcRenderer.invoke('project-folder:choose-and-scan'),
  createProjectFolder: (request) => ipcRenderer.invoke('project-folder:create', request),
  previewContextPackage: (rootPath) => ipcRenderer.invoke('context-package:preview', rootPath),
  generateContextPackage: (rootPath) => ipcRenderer.invoke('context-package:generate', rootPath),
  previewTranscriptionImport: (rootPath) =>
    ipcRenderer.invoke('transcription:preview-import', rootPath),
  confirmTranscriptionImport: (previewId) =>
    ipcRenderer.invoke('transcription:confirm-import', previewId),
  getCodexStatus: (rootPath) => ipcRenderer.invoke('codex:get-status', rootPath),
  startCodexLogin: (rootPath) => ipcRenderer.invoke('codex:start-login', rootPath),
  startCodexRun: (request) => ipcRenderer.invoke('codex:start-run', request),
  cancelCodexRun: (runId) => ipcRenderer.invoke('codex:cancel', runId),
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
