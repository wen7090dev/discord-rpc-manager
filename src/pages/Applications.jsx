import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { Trash2, Cpu, ExternalLink, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Applications() {
  const { applications, addApplication, removeApplication, t, searchQuery } = useStore();
  const [appId, setAppId]           = useState('');
  const [appIdError, setAppIdError] = useState('');
  const [resolving, setResolving]       = useState(false);
  const [resolved, setResolved]         = useState(null);   // { name } auto from Discord
  const [resolveAttempted, setResolveAttempted] = useState(false);
  const [fallbackName, setFallbackName] = useState(''); // manual if API fails
  const resolveTimer = useRef(null);

  const filteredApps = applications.filter(app =>
    app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(app.appId).includes(searchQuery)
  );

  const validateAppId = (val) => /^\d{17,20}$/.test(val.trim());

  useEffect(() => {
    clearTimeout(resolveTimer.current);
    setResolved(null);
    setResolveAttempted(false);
    setFallbackName('');

    if (!validateAppId(appId)) return;

    resolveTimer.current = setTimeout(async () => {
      setResolving(true);
      try {
        const info = await window.electronAPI?.getDiscordAppInfo?.(appId.trim());
        if (info?.name) setResolved({ name: info.name });
      } catch (_) {}
      setResolving(false);
      setResolveAttempted(true);
    }, 500);

    return () => clearTimeout(resolveTimer.current);
  }, [appId]);

  const displayName = resolved?.name || fallbackName.trim();
  const canSubmit   = validateAppId(appId) && !resolving && displayName.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAppId(appId)) { setAppIdError(t('app_id_invalid')); return; }
    const added = addApplication({ name: displayName, appId: appId.trim() });
    if (added === false) { setAppIdError(t('app_id_duplicate')); return; }
    setAppId('');
    setAppIdError('');
    setResolved(null);
    setFallbackName('');
  };

  // Show fallback only after the API attempt is fully done and returned nothing
  const showFallback = resolveAttempted && !resolved;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main mb-1">{t('manage_apps')}</h1>
          <p className="text-text-muted text-sm">{t('create_app_help')}</p>
        </div>
        <a
          href="https://discord.com/developers/applications"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm font-bold transition-all border border-black/5 dark:border-white/10 text-text-main"
        >
          <ExternalLink size={16} />
          {t('go_to_portal')}
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-3xl border-black/5 dark:border-white/10 sticky top-24 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-text-main">{t('add_app')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* App ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase px-1">{t('app_id')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="123456789012345678"
                    className={`w-full bg-black/5 dark:bg-white/5 border rounded-xl py-2.5 px-4 pr-9 text-sm focus:outline-none no-drag text-text-main transition-colors ${appIdError ? 'border-discord-red/50 focus:border-discord-red' : 'border-black/5 dark:border-white/10 focus:border-discord-blurple'}`}
                    value={appId}
                    onChange={(e) => { setAppId(e.target.value); setAppIdError(''); }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {resolving && <Loader2 size={14} className="text-text-muted animate-spin" />}
                    {!resolving && resolved && <CheckCircle2 size={14} className="text-discord-green" />}
                  </div>
                </div>
                {appIdError && (
                  <p className="flex items-center gap-1.5 text-xs text-discord-red px-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {appIdError}
                  </p>
                )}
                {resolved && (
                  <p className="flex items-center gap-1.5 text-xs text-discord-green px-1 font-medium">
                    <CheckCircle2 size={12} className="shrink-0" />
                    {resolved.name}
                  </p>
                )}
              </div>

              {/* Fallback name input — only if auto-resolve failed */}
              {showFallback && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase px-1">{t('app_name')}</label>
                  <input
                    type="text"
                    placeholder="ex: Visual Studio Code"
                    autoFocus
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-discord-blurple no-drag text-text-main"
                    value={fallbackName}
                    onChange={(e) => setFallbackName(e.target.value)}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-discord-blurple hover:bg-discord-blurple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-discord-blurple/20 no-drag"
              >
                {t('add_app')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/5 text-center px-6">
              <Cpu size={48} className="text-text-muted mb-4" />
              <h3 className="text-xl font-bold text-text-muted mb-2">{t('no_apps')}</h3>
              <p className="text-text-muted text-sm max-w-xs">{t('create_app_help')}</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/5 text-center px-6">
              <Cpu size={48} className="text-text-muted mb-4" />
              <p className="text-text-muted text-sm">{t('no_results').replace('{query}', searchQuery)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredApps.map((app) => (
                <div key={app.id} className="glass p-4 rounded-2xl border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-discord-blurple/30 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-discord-blurple/10 flex items-center justify-center text-discord-blurple">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main group-hover:text-discord-blurple transition-colors">{app.name}</h4>
                      <code className="text-[10px] text-text-muted bg-black/5 dark:bg-black/20 px-1.5 py-0.5 rounded">{app.appId}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => removeApplication(app.id)}
                    className="p-2.5 text-text-muted hover:text-discord-red hover:bg-discord-red/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
