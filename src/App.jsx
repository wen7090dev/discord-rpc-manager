import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { SetupModal } from './components/Modals/SetupModal';
import { UpdateModal } from './components/Modals/UpdateModal';
import { ChangelogModal } from './components/Modals/ChangelogModal';
import OnboardingTour from './components/Onboarding/OnboardingTour';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Applications from './pages/Applications';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Stats from './pages/Stats';
import { Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import useStore from './store/useStore';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTour, setShowTour] = useState(false);
  const prevProcsRef = useRef(new Set());
  const lastShownClipboard = useRef(null);
  const { loadData, setStatus, initialized, settings, setSearchQuery, rpcs, applications, activeRPC, paused, stopRPC, pauseRPC, resumeRPC, setClipboardCode, updateInfo, showChangelog, t } = useStore();
  const theme = settings.theme;

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;
    loadData();

    const removeStatus       = window.electronAPI.onRPCStatus((status) => setStatus(status));
    const removeDiscordClosed = window.electronAPI.onDiscordClosed?.(() => {
      useStore.getState().handleUnexpectedDisconnect();
    });
    const removeLogs   = window.electronAPI.onLogMessage((log) => {
      useStore.setState((s) => ({ logs: [{ ...log, _id: Date.now() + Math.random() }, ...s.logs].slice(0, 100) }));
    });

    // Deep link: rpcmanager://import/...
    const removeDeepLink = window.electronAPI.onDeepLink?.(async (url) => {
      const match = url.match(/rpcmanager:\/\/import\/(.+)/i);
      if (!match) return;
      const code = decodeURIComponent(match[1]);
      const result = await useStore.getState().importShareCode(code);
      if (result) {
        useStore.getState().addNotification({
          title: useStore.getState().t('share'),
          message: result.autoLinked
            ? useStore.getState().t('import_success').replace('{count}', 1)
            : `${useStore.getState().t('import_success').replace('{count}', 1)} — ${useStore.getState().t('share_code_hint')}`,
          type: 'success',
        });
        handleTabChange('dashboard');
      }
    });

    // Tray → launch profile by ID
    const removeLaunch = window.electronAPI.onLaunchProfile?.((id) => {
      const { rpcs, applications, startRPC } = useStore.getState();
      const rpc = rpcs.find(r => r.id === id);
      const app = rpc && applications.find(a => a.id === rpc.applicationId);
      if (rpc && app) startRPC(rpc, app.appId);
    });

    // SMTC — update media info + refresh active RPC if it uses {artist}/{title}
    const removeSMTC = window.electronAPI.onSMTCUpdate?.((info) => {
      const { setMediaInfo, updateActiveRPCMedia } = useStore.getState();
      setMediaInfo(info);
      updateActiveRPCMedia();
    });

    // Discord user info for live preview (avatar, username)
    const removeDiscordUser = window.electronAPI.onDiscordUser?.((user) => {
      useStore.getState().setDiscordUser(user);
    });

    // Auto-update: available (starts download) → progress → downloaded (ready to install)
    const removeUpdate = window.electronAPI.onUpdateAvailable?.((info) => {
      useStore.setState({ updateInfo: { ...info, downloadReady: false } });
    });
    const removeUpdateProgress = window.electronAPI.onUpdateProgress?.((percent) => {
      useStore.setState((s) => ({
        updateInfo: s.updateInfo ? { ...s.updateInfo, progress: percent } : null,
      }));
    });
    const removeUpdateDownloaded = window.electronAPI.onUpdateDownloaded?.((info) => {
      useStore.setState((s) => ({
        updateInfo: s.updateInfo
          ? { ...s.updateInfo, downloadReady: true, version: info.version }
          : { version: info.version, current: '', downloadReady: true },
      }));
    });

    const removeSystemInfo = window.electronAPI.onSystemInfo?.((info) => {
      useStore.getState().setSystemInfo(info);
    });

    // Steam — update current game + refresh active RPC if it uses {game}
    const removeSteam = window.electronAPI.onSteamUpdate?.((info) => {
      const { setSteamGame, updateActiveRPCMedia, addNotification, t } = useStore.getState();
      setSteamGame(info.name || '');
      updateActiveRPCMedia();
      if (info.name) addNotification({ title: 'Steam', message: info.name, type: 'info' });
    });

    // Process monitor → auto-launch / auto-stop
    const removeProcessUpdate = window.electronAPI.onProcessUpdate?.((procs) => {
      const procSet = new Set(procs);
      const prevSet = prevProcsRef.current;
      const { rpcs, applications, activeRPC, startRPC, stopRPC, setRunningProcesses } = useStore.getState();

      // Keep running processes list up to date in store (for UI dropdowns)
      setRunningProcesses(procs);

      // Auto-stop: active profile's linked process is no longer running
      if (activeRPC?.linkedProcess && !procSet.has(activeRPC.linkedProcess.toLowerCase())) {
        stopRPC();
      }

      // Auto-launch: a linked process just appeared and no profile is active
      if (!activeRPC) {
        const newProcs = [...procSet].filter(p => !prevSet.has(p));
        for (const proc of newProcs) {
          const rpc = rpcs.find(r => r.linkedProcess && r.linkedProcess.toLowerCase() === proc);
          if (rpc) {
            const linkedApp = applications.find(a => a.id === rpc.applicationId);
            if (linkedApp) {
              startRPC(rpc, linkedApp.appId);
              useStore.getState().addNotification({ title: useStore.getState().t('auto_launch_notif'), message: rpc.name, type: 'info' });
              break;
            }
          }
        }
      }

      prevProcsRef.current = procSet;
    });

    const timer = setTimeout(() => window.electronAPI.focusWindow(), 500);

    return () => {
      removeStatus?.();
      removeLogs?.();
      removeDeepLink?.();
      removeLaunch?.();
      removeDiscordUser?.();
      removeSMTC?.();
      removeSteam?.();
      removeProcessUpdate?.();
      removeUpdate?.();
      removeUpdateProgress?.();
      removeUpdateDownloaded?.();
      removeSystemInfo?.();
      removeDiscordClosed?.();
      clearTimeout(timer);
    };
  }, []);

  // ── Clipboard detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.clipboard || !settings.clipboardDetection) return;
    const check = async () => {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        const low = text.toLowerCase();
        if ((low.startsWith('rpc:') || low.startsWith('r:')) && text !== lastShownClipboard.current) {
          lastShownClipboard.current = text;
          setClipboardCode(text);
        }
      } catch {}
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [settings.clipboardDetection]);

  // ── Onboarding tour ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized && !settings.firstLaunch && !settings.tourCompleted) {
      const t = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [initialized, settings.firstLaunch, settings.tourCompleted]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = theme || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  }, [theme]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector('[data-tour="search-bar"] input')?.focus();
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (activeTab === 'dashboard') window.dispatchEvent(new CustomEvent('shortcut:new-rpc'));
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (useStore.getState().activeRPC) useStore.getState().stopRPC();
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        const { activeRPC, paused, pauseRPC, resumeRPC } = useStore.getState();
        if (activeRPC && paused) resumeRPC();
        else if (activeRPC && !paused) pauseRPC();
      }
      // Ctrl+1–9: activate nth profile
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const { rpcs, applications, startRPC } = useStore.getState();
        const rpc = rpcs[parseInt(e.key) - 1];
        if (rpc) {
          const app = applications.find(a => a.id === rpc.applicationId);
          if (app) startRPC(rpc, app.appId);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab]);

  // ── Scheduler tick (every 60 s) ───────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    const tick = () => {
      const { rpcs, applications, activeRPC, startRPC, stopRPC } = useStore.getState();
      const now  = new Date();
      const day  = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      const scheduled = rpcs.find(r =>
        r.schedule?.enabled &&
        r.schedule.days?.includes(day) &&
        hhmm >= r.schedule.startTime &&
        hhmm <  r.schedule.endTime
      );

      if (scheduled && activeRPC?.id !== scheduled.id) {
        const app = applications.find(a => a.id === scheduled.applicationId);
        if (app) {
          startRPC(scheduled, app.appId);
          useStore.getState().addNotification({
            title: useStore.getState().t('schedule_auto'),
            message: scheduled.name,
            type: 'info',
          });
        }
      } else if (!scheduled && activeRPC?.schedule?.enabled) {
        stopRPC();
        useStore.getState().addNotification({
          title: useStore.getState().t('schedule_stopped'),
          message: activeRPC.name,
          type: 'info',
        });
      }
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [initialized]);

  // ── Community Background Check (every 5 mins) ─────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    const { checkCommunityUpdates } = useStore.getState();
    
    // Initial check after boot
    setTimeout(checkCommunityUpdates, 5000);

    const interval = setInterval(checkCommunityUpdates, 5 * 60_000);
    return () => clearInterval(interval);
  }, [initialized]);

  // ── Custom Navigation Events ──────────────────────────────────────────────
  useEffect(() => {
    const handleNav = (e) => {
      if (e.type === 'navigate:community') setActiveTab('community');
    };
    window.addEventListener('navigate:community', handleNav);
    return () => window.removeEventListener('navigate:community', handleNav);
  }, []);

  // ── Sync tray profile list ────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.updateTrayProfiles || !initialized) return;
    window.electronAPI.updateTrayProfiles({
      profiles: rpcs.map(r => ({
        id:    r.id,
        name:  r.name,
        appId: applications.find(a => a.id === r.applicationId)?.appId || null,
      })),
      labels: {
        no_profiles: t('no_profiles'),
        show_app: t('show_app'),
        stop_rpc: t('stop_rpc'),
        quit: t('quit'),
        profiles: t('profiles'),
      }
    });
  }, [rpcs, applications, initialized, t]);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-6 fixed inset-0 z-[1000] pointer-events-none">
        <motion.img 
          src="logo.png" 
          className="w-20 h-20 rounded-2xl shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin opacity-50" />
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-discord-blurple animate-pulse" />
          <span className="text-text-muted text-xs font-bold uppercase tracking-[0.3em]">{t('loading_presence')}</span>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab) => { setActiveTab(tab); setSearchQuery(''); };

  const SEARCHABLE_TABS = ['dashboard', 'applications', 'templates'];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard onNavigateApps={() => handleTabChange('applications')} />;
      case 'community':    return <Community />;

      case 'applications': return <Applications />;
      case 'settings':     return <Settings />;
      case 'logs':         return <Logs />;
      case 'stats':        return <Stats />;
      default:             return <Dashboard onNavigateApps={() => handleTabChange('applications')} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-main">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar showSearch={SEARCHABLE_TABS.includes(activeTab)} activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
      <AnimatePresence>
        {initialized && settings.firstLaunch && (
          <SetupModal key="setup-modal" />
        )}
        {updateInfo && (
          <UpdateModal key="update-modal" />
        )}
        {showChangelog && (
          <ChangelogModal key="changelog-modal" />
        )}
      </AnimatePresence>
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}

export default App;
