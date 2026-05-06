import useStore from '../store/useStore';
import { Terminal, Trash2, Download } from 'lucide-react';

export default function Logs() {
  const { logs, clearLogs, t } = useStore();

  const exportLogs = () => {
    if (logs.length === 0) return;
    const text = logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpc-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main mb-1">{t('logs')}</h1>
          <p className="text-text-muted text-sm">{t('logs_desc')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-discord-red/10 hover:text-discord-red hover:border-discord-red/20 rounded-lg text-sm text-text-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> {t('clear_logs')}
          </button>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm text-text-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border-black/5 dark:border-white/5 overflow-hidden flex flex-col mb-4 bg-card/30">
        <div className="p-3 border-b border-black/5 dark:border-white/5 bg-white/2 flex items-center gap-2">
          <Terminal size={14} className="text-text-muted" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('realtime_logs')}</span>
          {logs.length > 0 && (
            <span className="ml-auto text-[10px] text-text-muted font-mono">{logs.length} entries</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 select-text">
          {logs.length === 0 ? (
            <div className="text-text-muted italic py-2">{t('waiting_events')}</div>
          ) : (
            logs.map((log, idx) => (
              <div key={log._id ?? idx} className="flex gap-3 group">
                <span className="text-text-muted font-bold shrink-0">[{log.timestamp}]</span>
                <span className={
                  log.type === 'error' ? 'text-discord-red font-medium' :
                  log.type === 'success' ? 'text-discord-green font-medium' :
                  'text-text-main'
                }>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
