import { Terminal, Shield, RefreshCw, Zap } from 'lucide-react';
import useStore from '../../store/useStore';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

export function StatusCard() {
  const { status, activeRPC, stopRPC, startTime, t } = useStore();
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    let interval;
    if (status === 'connected' && startTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        
        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        
        setElapsed(`${hours}:${minutes}:${seconds}`);
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsed('00:00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, startTime]);

  const isReconnecting = status === 'disconnected' && activeRPC != null;
  const displayStatus = status === 'connected' ? 'connected' : (isReconnecting ? 'reconnecting' : 'offline');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="glass rounded-2xl p-5 border-l-4 border-l-discord-blurple">
        <div className="flex items-center justify-between mb-3 text-text-muted">
          <span className="text-xs font-bold uppercase tracking-widest">{t('status')}</span>
          <Shield size={16} />
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-2.5 h-2.5 rounded-full animate-pulse",
            status === 'connected' ? "bg-discord-green" : (isReconnecting ? "bg-discord-yellow" : "bg-discord-red")
          )} />
          <h4 className="text-xl font-bold font-mono tracking-tight capitalize">
            {t(displayStatus)}
          </h4>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border-l-4 border-l-discord-fuchsia">
        <div className="flex items-center justify-between mb-3 text-text-muted">
          <span className="text-xs font-bold uppercase tracking-widest">{t('active_profile')}</span>
          <Zap size={16} />
        </div>
        <h4 className="text-xl font-bold truncate">{activeRPC?.name || (status === 'connected' ? '...' : t('offline'))}</h4>
      </div>

      <div className="glass rounded-2xl p-5 border-l-4 border-l-discord-yellow">
        <div className="flex items-center justify-between mb-3 text-text-muted">
          <span className="text-xs font-bold uppercase tracking-widest">{t('runtime')}</span>
          <RefreshCw size={16} />
        </div>
        <h4 className="text-xl font-bold font-mono">{elapsed}</h4>
      </div>

      <div className="bg-gradient-to-br from-discord-blurple to-indigo-600 rounded-2xl p-5 shadow-lg shadow-discord-blurple/20 group relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between text-white/60 mb-2">
             <span className="text-xs font-bold uppercase tracking-widest">Console</span>
             <Terminal size={16} />
          </div>
          <button 
            onClick={() => stopRPC()}
            disabled={status !== 'connected'}
            className="w-full bg-white text-discord-blurple font-bold py-2 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 shadow-md hover:shadow-lg"
            data-theme-btn="contrast"
          >
            {t('force_termination')}
          </button>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      </div>
    </div>
  );
}
