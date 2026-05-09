import { contextBridge, ipcRenderer } from 'electron';
import type { SidekickApi } from './shared/sidekick-api';

const sidekickApi: SidekickApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  chooseProjectFolder: () => ipcRenderer.invoke('project-folder:choose-and-scan'),
};

contextBridge.exposeInMainWorld('sidekick', sidekickApi);
