declare global {
  interface ElectronAPI {
    // Storage
    getStorage: () => Promise<unknown>;
    saveStorage: (data: unknown) => Promise<void>;
    // RPC
    startRPC: (config: unknown) => Promise<unknown>;
    stopRPC: () => Promise<void>;
    updateRPC: (activity: unknown) => Promise<void>;
    pauseRPC: () => Promise<void>;
    resumeRPC: () => Promise<void>;
    getDiscordAssets: (appId: string) => Promise<unknown>;
    getDiscordAppInfo: (appId: string) => Promise<unknown>;
    // System
    setAutoLaunch: (enable: boolean) => Promise<void>;
    resetWindowSize: () => Promise<void>;
    minimizeWindow: () => Promise<void>;
    closeWindow: (behavior: string) => Promise<void>;
    focusWindow: () => Promise<void>;
    relaunchApp: () => Promise<void>;
    getFingerprint: () => Promise<string>;
    getPlatform: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    openLicense: () => Promise<void>;
    showNotification: (title: string, body: string) => Promise<void>;
    getSystemInfo: () => Promise<unknown>;
    getWeather: (city: string) => Promise<unknown>;
    getAppVersion: () => Promise<string>;
    checkUpdates: () => Promise<void>;
    installUpdate: () => Promise<void>;
    // Detection toggles
    setMediaDetection: (enabled: boolean) => Promise<void>;
    setSteamDetection: (enabled: boolean) => Promise<void>;
    // Tray
    updateTrayProfiles: (profiles: unknown[]) => Promise<void>;
    // Updates
    onUpdateAvailable: (cb: (info: unknown) => void) => () => void;
    onUpdateProgress: (cb: (percent: number) => void) => () => void;
    onUpdateDownloaded: (cb: (info: unknown) => void) => () => void;
    onUpdateNotAvailable: (cb: () => void) => () => void;
    // Events
    onRPCStatus: (cb: (status: string) => void) => () => void;
    onLogMessage: (cb: (log: unknown) => void) => () => void;
    onLaunchProfile: (cb: (id: string) => void) => () => void;
    onDeepLink: (cb: (url: string) => void) => () => void;
    onProcessUpdate: (cb: (procs: unknown) => void) => () => void;
    onSMTCUpdate: (cb: (info: unknown) => void) => () => void;
    onSteamUpdate: (cb: (info: unknown) => void) => () => void;
    onDiscordUser: (cb: (user: unknown) => void) => () => void;
    onDiscordClosed: (cb: () => void) => () => void;
    onSystemInfo: (cb: (info: unknown) => void) => () => void;
    getSMTC: () => Promise<unknown>;
    // Playerctl (Linux)
    getPlayerctlStatus: () => Promise<string>;
    installPlayerctl: () => Promise<void>;
    onPlayerctlStatus: (cb: (status: string) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
  const __APP_VERSION__: string;
}

export {};
