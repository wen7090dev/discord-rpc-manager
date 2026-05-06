import useStore from '../store/useStore';
import { BarChart2, Clock, Trophy, Activity } from 'lucide-react';

function formatTime(seconds) {
  if (!seconds || seconds < 1) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function Stats() {
  const { rpcs, t } = useStore();

  const ranked = [...rpcs]
    .filter(r => r.totalTime > 0)
    .sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));

  const totalTime  = rpcs.reduce((acc, r) => acc + (r.totalTime || 0), 0);
  const topProfile = ranked[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main mb-1">{t('stats_title')}</h1>
        <p className="text-text-muted text-sm">{t('stats_desc')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-discord-blurple" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('stats_total_time')}</span>
          </div>
          <p className="text-2xl font-bold text-text-main">{formatTime(totalTime)}</p>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-discord-yellow" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('stats_top_profile')}</span>
          </div>
          <p className="text-2xl font-bold text-text-main truncate">{topProfile?.name || '—'}</p>
          {topProfile && (
            <p className="text-xs text-text-muted mt-1">{formatTime(topProfile.totalTime)}</p>
          )}
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-discord-green" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('stats_profiles_used')}</span>
          </div>
          <p className="text-2xl font-bold text-text-main">
            {ranked.length} <span className="text-text-muted text-lg font-normal">/ {rpcs.length}</span>
          </p>
        </div>
      </div>

      {/* Profile ranking */}
      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
          <BarChart2 className="w-10 h-10 text-text-muted mb-3 opacity-40" />
          <p className="text-text-main font-medium">{t('stats_no_data')}</p>
          <p className="text-text-muted text-sm mt-1">{t('stats_no_data_desc')}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('stats_by_profile')}</span>
          </div>
          <div className="divide-y divide-white/5">
            {ranked.map((rpc, i) => {
              const pct = totalTime > 0 ? Math.round((rpc.totalTime / totalTime) * 100) : 0;
              return (
                <div key={rpc.id} className="px-5 py-4 flex items-center gap-4">
                  <span className={`text-sm font-bold w-6 text-center shrink-0 ${i === 0 ? 'text-discord-yellow' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-text-muted'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-text-main truncate">{rpc.name}</span>
                      <span className="text-xs font-mono text-text-muted ml-2 shrink-0">{formatTime(rpc.totalTime)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-discord-blurple transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-text-muted w-9 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
