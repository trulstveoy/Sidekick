import { contextBridge, ipcRenderer } from 'electron';
import type { SidekickApi } from './shared/sidekick-api';

const sidekickApi: SidekickApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
};

contextBridge.exposeInMainWorld('sidekick', sidekickApi);
