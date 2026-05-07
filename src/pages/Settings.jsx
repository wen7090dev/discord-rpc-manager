import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { Moon, Globe, Trash2, Rocket, RotateCcw, Download, Check, X, Keyboard, Bell, Clipboard, Music, Terminal, Loader2, CheckCircle2, Headphones, Gamepad2, Info, RefreshCw, BookOpen, Shield } from 'lucide-react';
import clsx from 'clsx';

export default function Settings() {
  const { settings, saveData, t, updateInfo } = useStore();
  const [isResetting, setIsResetting] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [playerctlStatus, setPlayerctlStatus] = useState('unknown');
  const [playerctlInstalling, setPlayerctlInstalling] = useState(false);
  const [playerctlError, setPlayerctlError] = useState(null);
  const [appVersion, setAppVersion] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const checkTimer = useRef(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getPlatform?.().then(setPlatform);
    window.electronAPI.getPlayerctlStatus?.().then(setPlayerctlStatus);
    window.electronAPI.getAppVersion?.().then(setAppVersion);
    const removePlayerctl = window.electronAPI.onPlayerctlStatus?.(setPlayerctlStatus);
    const removeNotAvailable = window.electronAPI.onUpdateNotAvailable?.(() => {
      clearTimeout(checkTimer.current);
      setCheckingUpdate(false);
      setUpToDate(true);
    });
    return () => { removePlayerctl?.(); removeNotAvailable?.(); };
  }, []);

  // If update modal appears, stop the "checking" spinner
  useEffect(() => {
    if (updateInfo && checkingUpdate) {
      clearTimeout(checkTimer.current);
      setCheckingUpdate(false);
    }
  }, [updateInfo]);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpToDate(false);
    window.electronAPI?.checkUpdates?.();
    // Fallback: if neither update-available nor update-not-available fires in 15s, stop spinner
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      setCheckingUpdate(false);
      setUpToDate(true);
    }, 15000);
  };

  // Show on Linux when playerctl is missing.
  // Also show in dev mode on any platform so you can preview the UI.
  const showPlayerctl = platform === 'linux' && playerctlStatus === 'missing';

  const handleInstallPlayerctl = async () => {
    setPlayerctlInstalling(true);
    setPlayerctlError(null);
    const result = await window.electronAPI.installPlayerctl();
    setPlayerctlInstalling(false);
    if (!result.success) setPlayerctlError(result.cmd ?? null);
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    useStore.setState((state) => ({
      settings: { ...state.settings, [key]: newValue }
    }));
    if (key === 'autoLaunch' && window.electronAPI) {
      window.electronAPI.setAutoLaunch(newValue);
    }
    if (key === 'mediaDetectionEnabled' && window.electronAPI) {
      window.electronAPI.setMediaDetection?.(newValue);
    }
    if (key === 'steamDetectionEnabled' && window.electronAPI) {
      window.electronAPI.setSteamDetection?.(newValue);
    }
    saveData();
  };

  const handleThemeChange = (themeId) => {
    useStore.setState((state) => ({
      settings: { ...state.settings, theme: themeId }
    }));
    document.documentElement.setAttribute('data-theme', themeId);
    if (themeId === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    saveData();
  };

  const THEMES = [
    { id: 'light',    name: 'Light',    color: '#f2f3f5', accent: '#5865f2', border: 'border-[#d1d5db]' },
    { id: 'dark',     name: 'Dark',     color: '#1a1b1e', accent: '#5865f2', border: 'border-[#2d2f34]' },
    { id: 'midnight', name: 'Midnight', color: '#000000', accent: '#ffffff', border: 'border-zinc-800' },
    { id: 'ocean',    name: 'Ocean',    color: '#0a192f', accent: '#64ffda', border: 'border-[#1e3a8a]' },
    { id: 'forest',   name: 'Forest',   color: '#0b140d', accent: '#2ecc71', border: 'border-[#065f46]' },
    { id: 'sakura',   name: 'Sakura',   color: '#1a1216', accent: '#eb4d89', border: 'border-[#9d174d]' },
  ];

  const setLanguage = (lang) => {
    useStore.setState((state) => ({
      settings: { ...state.settings, language: lang }
    }));
    saveData();
  };

  const resetData = async () => {
    if (confirm(t('reset_confirm'))) {
      setIsResetting(true);
      useStore.setState({
        rpcs: [],
        applications: [],
        folders: [],
        settings: {
          theme: 'dark',
          language: 'en',
          autoLaunch: true,
          firstLaunch: true,
          tourCompleted: false,
          closeBehavior: 'tray',
          notificationsEnabled: true,
          clipboardDetection: true,
          mediaDetectionEnabled: true,
          steamDetectionEnabled: true,
        },
        activeRPC: null,
        status: 'disconnected',
        logs: [],
        startTime: null,
        initialized: false
      });
      await saveData();
      if (window.electronAPI) {
        try {
          await window.electronAPI.setAutoLaunch(false);
          await window.electronAPI.resetWindowSize();
        } catch (e) {
          console.error("System reset failed", e);
        }
      }
      window.localStorage.clear();
      setTimeout(() => {
        if (window.electronAPI) {
          window.electronAPI.relaunchApp();
        } else {
          window.location.reload();
        }
      }, 100);
    }
  };

  if (isResetting) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 z-[200]">
        <RotateCcw className="w-12 h-12 text-discord-blurple animate-spin mb-4" />
        <h2 className="text-xl font-bold text-text-main animate-pulse uppercase tracking-widest">{t('resetting_app')}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main mb-1">{t('settings')}</h1>
        <p className="text-text-muted text-sm">{t('settings_desc')}</p>
      </div>

      <div className="space-y-6">
        {/* Keyboard Shortcuts */}
        <div className="glass rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/2 flex items-center gap-2">
            <Keyboard size={14} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('shortcuts_title')}</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { keys: ['Ctrl', 'N'],   label: t('shortcut_new') },
              { keys: ['Ctrl', 'K'],   label: t('shortcut_search') },
              { keys: ['Esc'],         label: t('shortcut_esc') },
              { keys: ['Ctrl', '1–9'], label: t('shortcut_profile') },
              { keys: ['Ctrl', 'S'],   label: t('shortcut_stop') },
              { keys: ['Ctrl', 'P'],   label: t('shortcut_pause') },
            ].map(({ keys, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-2xl">
                <div className="flex items-center gap-1 shrink-0">
                  {keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-[11px] font-mono font-bold text-text-main shadow-sm">
                        {k}
                      </kbd>
                      {i < keys.length - 1 && <span className="text-text-muted text-[10px]">+</span>}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-text-muted leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* General Behavior */}
        <div className="glass rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('general_behavior')}</h3>
          </div>

          <div className="divide-y divide-white/5">
            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-green/10 text-discord-green rounded-2xl shrink-0">
                  <Rocket size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('auto_launch')}</h4>
                  <p className="text-sm text-text-muted">{t('auto_launch_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('autoLaunch')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoLaunch ? 'bg-discord-blurple' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoLaunch ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-discord-red/10 text-discord-red rounded-2xl flex items-center justify-center shrink-0">
                  <X size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('close_behavior')}</h4>
                  <p className="text-sm text-text-muted">{t('close_behavior_desc')}</p>
                </div>
              </div>
              <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => {
                    useStore.setState((state) => ({ settings: { ...state.settings, closeBehavior: 'tray' } }));
                    saveData();
                  }}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    settings.closeBehavior === 'tray' ? "bg-white text-discord-blurple shadow-sm" : "text-text-muted hover:text-text-main"
                  )}
                >
                  {t('close_tray')}
                </button>
                <button
                  onClick={() => {
                    useStore.setState((state) => ({ settings: { ...state.settings, closeBehavior: 'quit' } }));
                    saveData();
                  }}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    settings.closeBehavior === 'quit' ? "bg-discord-red text-white shadow-lg shadow-discord-red/20" : "text-text-muted hover:text-text-main"
                  )}
                >
                  {t('close_quit')}
                </button>
              </div>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-yellow/10 text-[#9a7d0a] dark:text-discord-yellow rounded-2xl shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('notif_setting')}</h4>
                  <p className="text-sm text-text-muted">{t('notif_setting_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notificationsEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-discord-blurple' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-green/10 text-discord-green rounded-2xl">
                  <Clipboard size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('clipboard_detection')}</h4>
                  <p className="text-sm text-text-muted">{t('clipboard_detection_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('clipboardDetection')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.clipboardDetection !== false ? 'bg-discord-blurple' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.clipboardDetection !== false ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-blurple/10 text-discord-blurple rounded-2xl shrink-0">
                  <Headphones size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('media_detection')}</h4>
                  <p className="text-sm text-text-muted">{t('media_detection_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('mediaDetectionEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.mediaDetectionEnabled !== false ? 'bg-discord-blurple' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.mediaDetectionEnabled !== false ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-green/10 text-discord-green rounded-2xl shrink-0">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('steam_detection')}</h4>
                  <p className="text-sm text-text-muted">{t('steam_detection_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('steamDetectionEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.steamDetectionEnabled !== false ? 'bg-discord-blurple' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.steamDetectionEnabled !== false ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-yellow/10 text-[#9a7d0a] dark:text-discord-yellow rounded-2xl">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('language')}</h4>
                  <p className="text-sm text-text-muted">{t('language_desc')}</p>
                </div>
              </div>
              <select
                className="bg-card border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-main"
                value={settings.language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en" className="bg-card text-text-main">English (US)</option>
                <option value="fr" className="bg-card text-text-main">Français</option>
                <option value="es" className="bg-card text-text-main">Español</option>
                <option value="de" className="bg-card text-text-main">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        {/* playerctl — Linux only in production, visible in dev on any platform for preview */}
        {showPlayerctl && (
          <div className="glass rounded-3xl border-yellow-500/20 overflow-hidden">
            <div className="p-4 border-b border-yellow-500/10 bg-yellow-500/5 flex items-center gap-2">
              <Music size={14} className="text-yellow-400" />
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest">{t('playerctl_section')}</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl shrink-0">
                  <Music size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('playerctl_missing_title')}</h4>
                  <p className="text-sm text-text-muted mt-0.5">{t('playerctl_missing_desc')}</p>
                </div>
              </div>

              {/* Manual commands — always visible so the user knows exactly what will be installed */}
              <div className="rounded-2xl bg-black/20 dark:bg-black/30 border border-white/5 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                  <Terminal size={12} className="text-text-muted" />
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{t('playerctl_install_cmds')}</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-xs">
                  {[
                    { distro: 'Ubuntu / Debian', cmd: 'sudo apt install playerctl' },
                    { distro: 'Arch Linux',      cmd: 'sudo pacman -S playerctl' },
                    { distro: 'Fedora',          cmd: 'sudo dnf install playerctl' },
                    { distro: 'openSUSE',        cmd: 'sudo zypper install playerctl' },
                  ].map(({ distro, cmd }) => (
                    <div key={distro} className="flex items-center gap-3">
                      <span className="text-text-muted w-32 shrink-0">{distro}</span>
                      <code className="text-discord-green">{cmd}</code>
                    </div>
                  ))}
                </div>
              </div>

              {playerctlError && (
                <p className="text-xs text-discord-red bg-discord-red/10 rounded-xl px-4 py-2">
                  {t('playerctl_error')}&nbsp;<code className="font-mono">{playerctlError}</code>
                </p>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleInstallPlayerctl}
                  disabled={playerctlInstalling}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                    playerctlInstalling
                      ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                  )}
                >
                  {playerctlInstalling
                    ? <><Loader2 size={15} className="animate-spin" />{t('playerctl_installing')}</>
                    : <><CheckCircle2 size={15} />{t('playerctl_install_btn')}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className="glass rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('appearance')}</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-fuchsia/10 text-discord-fuchsia rounded-2xl">
                  <Moon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{t('theme_selector')}</h4>
                  <p className="text-sm text-text-muted">{t('theme_selector_desc')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                    settings.theme === theme.id
                      ? 'bg-discord-blurple/10 ring-2 ring-discord-blurple'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 ${theme.border} flex items-center justify-center transition-transform group-hover:scale-110 shadow-md relative overflow-hidden`}
                    style={{ background: `linear-gradient(135deg, ${theme.color} 50%, ${theme.accent} 50%)` }}
                  >
                    {settings.theme === theme.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-full">
                        <Check size={18} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${settings.theme === theme.id ? 'text-discord-blurple' : 'text-text-muted'}`}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('data_management')}</h3>
          </div>

          <div className="divide-y divide-white/5">
            <div className="p-6 flex items-center justify-between hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-fuchsia/10 text-discord-fuchsia rounded-2xl shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="font-bold">{t('export_all')}</h4>
                  <p className="text-sm text-zinc-500">{t('export_desc')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const { rpcs, applications, folders } = useStore.getState();
                  const blob = new Blob([JSON.stringify({ rpcs, applications, folders }, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `rpc-backup-${new Date().toISOString().replace('T', '_').slice(0, 19).replace(/:/g, '-')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl font-bold text-sm transition-all border border-black/5 dark:border-white/5"
              >
                {t('export_all').split(' ')[0]}
              </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-white/2 transition-colors">
              <div className="flex gap-4">
                <div className="p-3 bg-discord-green/10 text-discord-green rounded-2xl">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h4 className="font-bold">{t('import_all')}</h4>
                  <p className="text-sm text-zinc-500">{t('import_desc')}</p>
                </div>
              </div>
              <label className="px-4 py-2 bg-discord-green/10 text-discord-green hover:bg-discord-green hover:text-white rounded-xl font-bold text-sm transition-all border border-discord-green/20 cursor-pointer">
                {t('import_all').split(' ')[0]}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    e.target.value = '';
                    const reader = new FileReader();
                    reader.onerror = () => {
                      useStore.getState().addNotification({ title: t('error'), message: t('import_error'), type: 'error' });
                    };
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        const count = useStore.getState().importData(data);
                        if (count) {
                          useStore.getState().addNotification({
                            title: t('import'),
                            message: t('import_success').replace('{count}', count),
                            type: 'success'
                          });
                        } else {
                          useStore.getState().addNotification({ title: t('error'), message: t('import_error'), type: 'error' });
                        }
                      } catch {
                        useStore.getState().addNotification({ title: t('error'), message: t('import_error'), type: 'error' });
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* About / Version */}
        <div className="glass rounded-3xl border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white/2 flex items-center gap-2">
            <Info size={14} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('about')}</h3>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-discord-blurple/10 text-discord-blurple rounded-2xl shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-text-main">{t('app_version')}</h4>
                <p className="text-sm text-text-muted font-mono">
                  {appVersion ? `v${appVersion}` : '—'}
                  {upToDate && (
                    <span className="ml-2 text-discord-green text-xs font-sans font-bold">{t('up_to_date')}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.electronAPI?.openLicense?.()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-main border-white/10"
              >
                <BookOpen size={14} />
                {t('open_license')}
              </button>
              <button
                onClick={() => window.electronAPI?.openExternal?.('https://wen7090dev.github.io/privacy-policy/discord-rpc-manager.html')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-main border-white/10"
              >
                <Shield size={14} />
                {t('open_privacy')}
              </button>
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border
                  ${checkingUpdate
                    ? 'bg-discord-blurple/10 text-discord-blurple/50 border-discord-blurple/10 cursor-not-allowed'
                    : 'bg-discord-blurple/10 text-discord-blurple hover:bg-discord-blurple hover:text-white border-discord-blurple/20'
                  }`}
              >
                <RefreshCw size={14} className={checkingUpdate ? 'animate-spin' : ''} />
                {checkingUpdate ? t('checking_updates') : t('check_updates')}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-3xl border-discord-red/10 overflow-hidden">
          <div className="p-4 border-b border-discord-red/5 bg-discord-red/5">
            <h3 className="text-xs font-bold text-discord-red/60 uppercase tracking-widest">{t('danger_zone')}</h3>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-zinc-200">{t('reset_data')}</h4>
              <p className="text-sm text-zinc-500">{t('reset_data_desc')}</p>
            </div>
            <button
              onClick={resetData}
              className="flex items-center gap-2 px-4 py-2 border border-discord-red/20 text-discord-red hover:bg-discord-red hover:text-white rounded-xl transition-all font-bold text-sm"
            >
              <Trash2 size={16} /> {t('reset_all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
