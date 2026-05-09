export type AppInfo = {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  isPackaged: boolean;
};

export type SidekickApi = {
  getAppInfo: () => Promise<AppInfo>;
};

declare global {
  interface Window {
    sidekick?: SidekickApi;
  }
}
