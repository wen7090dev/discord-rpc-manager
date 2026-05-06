const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage
  getStorage:      ()       => ipcRenderer.invoke('get-storage'),
  saveStorage:     (data)   => ipcRenderer.invoke('save-storage', data),

  // RPC control
  startRPC:        (config)   => ipcRenderer.invoke('start-rpc', config),
  stopRPC:         ()         => ipcRenderer.invoke('stop-rpc'),
  updateRPC:       (activity) => ipcRenderer.invoke('update-rpc', activity),
  getDiscordAssets:   (appId) => ipcRenderer.invoke('get-discord-assets', appId),
  getDiscordAppInfo:  (appId) => ipcRenderer.invoke('get-discord-app-info', appId),
  onProcessUpdate: (cb) => {
    const fn = (_, procs) => cb(procs);
    ipcRenderer.on('process-update', fn);
    return () => ipcRenderer.removeListener('process-update', fn);
  },
  pauseRPC:        ()         => ipcRenderer.invoke('pause-rpc'),
  resumeRPC:       ()         => ipcRenderer.invoke('resume-rpc'),

  // System
  setAutoLaunch:   (enable)   => ipcRenderer.invoke('set-auto-launch', enable),
  resetWindowSize: ()         => ipcRenderer.invoke('reset-window-size'),
  minimizeWindow:  ()         => ipcRenderer.invoke('minimize-window'),
  closeWindow:     (behavior) => ipcRenderer.invoke('close-window', behavior),
  focusWindow:     ()         => ipcRenderer.invoke('focus-window'),
  relaunchApp:     ()         => ipcRenderer.invoke('relaunch-app'),
  getFingerprint:  ()         => ipcRenderer.invoke('get-fingerprint'),

  // Tray — send profile list so the tray menu stays in sync
  updateTrayProfiles: (profiles) => ipcRenderer.invoke('update-tray-profiles', profiles),

  // System notification
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Event listeners (return cleanup function)
  onRPCStatus: (cb) => {
    const fn = (_, status) => cb(status);
    ipcRenderer.on('rpc-status', fn);
    return () => ipcRenderer.removeListener('rpc-status', fn);
  },
  onLogMessage: (cb) => {
    const fn = (_, log) => cb(log);
    ipcRenderer.on('log-message', fn);
    return () => ipcRenderer.removeListener('log-message', fn);
  },
  // Tray → launch a profile by ID
  onLaunchProfile: (cb) => {
    const fn = (_, id) => cb(id);
    ipcRenderer.on('launch-profile', fn);
    return () => ipcRenderer.removeListener('launch-profile', fn);
  },
  // Deep link: rpcmanager://import/...
  onDeepLink: (cb) => {
    const fn = (_, url) => cb(url);
    ipcRenderer.on('deep-link', fn);
    return () => ipcRenderer.removeListener('deep-link', fn);
  },
  // Returns last known SMTC state immediately (no PowerShell round-trip)
  getSMTC: () => ipcRenderer.invoke('get-smtc'),
  // Windows Media Transport Controls (artist / title)
  onSMTCUpdate: (cb) => {
    const fn = (_, info) => cb(info);
    ipcRenderer.on('smtc-update', fn);
    return () => ipcRenderer.removeListener('smtc-update', fn);
  },
  // Steam — currently running game
  onSteamUpdate: (cb) => {
    const fn = (_, info) => cb(info);
    ipcRenderer.on('steam-update', fn);
    return () => ipcRenderer.removeListener('steam-update', fn);
  },
  // Discord user info (avatar, username) — sent on connect/disconnect
  onDiscordUser: (cb) => {
    const fn = (_, user) => cb(user);
    ipcRenderer.on('discord-user', fn);
    return () => ipcRenderer.removeListener('discord-user', fn);
  },
  // Auto-update notification
  onUpdateAvailable: (cb) => {
    const fn = (_, info) => cb(info);
    ipcRenderer.on('update-available', fn);
    return () => ipcRenderer.removeListener('update-available', fn);
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openLicense:  ()    => ipcRenderer.invoke('open-license'),
  // System info: CPU %, RAM %
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getWeather: (city) => ipcRenderer.invoke('get-weather', city),
  onSystemInfo: (cb) => {
    const fn = (_, info) => cb(info);
    ipcRenderer.on('system-info', fn);
    return () => ipcRenderer.removeListener('system-info', fn);
  },
  // Discord closed unexpectedly (not user-initiated)
  onDiscordClosed: (cb) => {
    const fn = () => cb();
    ipcRenderer.on('rpc-discord-closed', fn);
    return () => ipcRenderer.removeListener('rpc-discord-closed', fn);
  },
  // App version & updates
  getAppVersion:  ()         => ipcRenderer.invoke('get-app-version'),
  checkUpdates:   ()         => ipcRenderer.invoke('check-updates'),
  installUpdate:  ()         => ipcRenderer.invoke('install-update'),
  onUpdateProgress: (cb) => {
    const fn = (_, percent) => cb(percent);
    ipcRenderer.on('update-progress', fn);
    return () => ipcRenderer.removeListener('update-progress', fn);
  },
  onUpdateDownloaded: (cb) => {
    const fn = (_, info) => cb(info);
    ipcRenderer.on('update-downloaded', fn);
    return () => ipcRenderer.removeListener('update-downloaded', fn);
  },
  onUpdateNotAvailable: (cb) => {
    const fn = () => cb();
    ipcRenderer.on('update-not-available', fn);
    return () => ipcRenderer.removeListener('update-not-available', fn);
  },

  // Media / Steam detection toggles
  setMediaDetection: (enabled) => ipcRenderer.invoke('set-media-detection', enabled),
  setSteamDetection: (enabled) => ipcRenderer.invoke('set-steam-detection', enabled),

  // Platform
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  // Linux: playerctl presence ('unknown' | 'missing' | 'installed')
  getPlayerctlStatus: () => ipcRenderer.invoke('get-playerctl-status'),
  installPlayerctl:   () => ipcRenderer.invoke('install-playerctl'),
  onPlayerctlStatus: (cb) => {
    const fn = (_, status) => cb(status);
    ipcRenderer.on('playerctl-status', fn);
    return () => ipcRenderer.removeListener('playerctl-status', fn);
  },
});
