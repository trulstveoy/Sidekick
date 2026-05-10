import { contextBridge, ipcRenderer } from 'electron';
import type { SidekickApi } from './shared/sidekick-api';

const sidekickApi: SidekickApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  chooseProjectFolder: () => ipcRenderer.invoke('project-folder:choose-and-scan'),
  previewContextPackage: (rootPath) => ipcRenderer.invoke('context-package:preview', rootPath),
  generateContextPackage: (rootPath) => ipcRenderer.invoke('context-package:generate', rootPath),
};

contextBridge.exposeInMainWorld('sidekick', sidekickApi);
