import { User } from 'lucide-react';
import useStore from '../../store/useStore';
import { useState, useEffect } from 'react';

// Module-level cache: appId → { assetName: cdnUrl }
const assetCache = new Map();
try {
  const stored = JSON.parse(localStorage.getItem('discord-asset-cache') || '{}');
  Object.entries(stored).forEach(([appId, map]) => assetCache.set(appId, map));
} catch (_) {}

async function loadAssets(appId) {
  if (!appId || assetCache.has(appId)) return;
  try {
    const list = await window.electronAPI?.getDiscordAssets?.(appId);
    if (!Array.isArray(list) || list.length === 0) return;
    const map = {};
    list.forEach(a => { map[a.name] = `https://cdn.discordapp.com/app-assets/${appId}/${a.id}.png`; });
    assetCache.set(appId, map);
    try {
      const all = {};
      assetCache.forEach((v, k) => { all[k] = v; });
      localStorage.setItem('discord-asset-cache', JSON.stringify(all));
    } catch (_) {}
  } catch (_) {}
}

export function LivePreview({ rpc: propRpc }) {
  const { applications, previewData, activeRPC, startTime, t, resolveVars, discordUser } = useStore();

  // Priority: Prop > Preview Data (Form) > Active RPC
  const rpc = propRpc || previewData || activeRPC;
  const applicationsList = applications || [];
  const app = rpc?.applicationId ? applicationsList.find(a => a.id === rpc.applicationId) : null;

  const [displayTime, setDisplayTime] = useState('00:00');
  const [assetUrls, setAssetUrls] = useState({});

  // Fetch and cache Discord app assets whenever the appId changes
  useEffect(() => {
    const appId = app?.appId;
    if (!appId) { setAssetUrls({}); return; }
    if (assetCache.has(appId)) {
      setAssetUrls(assetCache.get(appId));
      return;
    }
    let cancelled = false;
    loadAssets(appId).then(() => {
      if (cancelled) return;
      const map = assetCache.get(appId);
      if (map) setAssetUrls(map);
    });
    return () => { cancelled = true; };
  }, [app?.appId]);

  useEffect(() => {
    let interval;
    if (rpc?.showTimestamp) {
      const updateTimer = () => {
        const now = Date.now();
        if (rpc.timerMode === 'countdown' && rpc.duration) {
          const durationMs = parseInt(rpc.duration) * 1000;
          const isActuallyRunning = activeRPC?.id === rpc.id && startTime;
          
          const end = isActuallyRunning 
            ? startTime + durationMs
            : now + durationMs; // For preview, assume it just started
          
          const diff = Math.max(0, Math.floor((end - now) / 1000));
          const mins = Math.floor(diff / 60).toString().padStart(2, '0');
          const secs = (diff % 60).toString().padStart(2, '0');
          setDisplayTime(`${mins}:${secs}`);
        } else {
          const start = (activeRPC?.id === rpc.id && startTime) ? startTime : now;
          const diff = Math.floor((now - start) / 1000);
          const mins = Math.floor(diff / 60).toString().padStart(2, '0');
          const secs = (diff % 60).toString().padStart(2, '0');
          setDisplayTime(`${mins}:${secs}`);
        }
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rpc, activeRPC, startTime]);

  const ACTIVITY_PREFIX = { 0: 'act_playing', 2: 'act_listening', 3: 'act_watching', 5: 'act_competing' };
  const getActivityPrefix = () => t(ACTIVITY_PREFIX[rpc?.activityType ?? 0] || 'act_playing');

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t('live_preview')}</h3>
      
      <div className="bg-[#232428] rounded-xl overflow-hidden shadow-2xl max-w-sm border border-black/20 font-sans text-white">
        {/* Profile Banner */}
        <div className="h-16 bg-discord-blurple/80 p-4"></div>
        
        <div className="px-4 pb-4 -mt-10 relative">
          {/* Avatar Area */}
          <div className="flex items-end justify-between mb-4">
            <div className="w-20 h-20 bg-[#232428] rounded-full p-1.5 shadow-xl">
              <div className="w-full h-full bg-[#313338] rounded-full flex items-center justify-center relative overflow-hidden">
                {discordUser?.avatarUrl ? (
                  <img src={discordUser.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User size={40} className="text-zinc-600" />
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-discord-green rounded-full border-4 border-[#232428]" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg leading-tight">
                {discordUser?.username || t('your_profile')}
              </h4>
              <p className="text-xs text-zinc-400 font-medium">
                @{discordUser?.username || 'username'}
              </p>
            </div>

            <div className="bg-[#111214] rounded-lg p-3 border border-white/5">
               <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                 {getActivityPrefix()}
               </h5>
               
               <div className="flex gap-4">
                  {/* Image Group — relative container sized to large image */}
                  <div className="relative w-16 h-16 shrink-0">
                    {/* Large image group */}
                    <div className="group/large relative w-full h-full">
                      <div className="w-full h-full bg-zinc-800 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center text-[10px] text-zinc-600 cursor-default">
                        {rpc?.largeImageKey && assetUrls[rpc.largeImageKey] ? (
                          <img src={assetUrls[rpc.largeImageKey]} alt={rpc.largeImageKey} className="w-full h-full object-cover" />
                        ) : rpc?.largeImageKey ? (
                          <div className="w-full h-full bg-discord-blurple/20 flex flex-col items-center justify-center text-center px-1">
                            <span className="text-[8px] opacity-40 font-bold mb-0.5">ASSET</span>
                            <span className="text-[9px] text-zinc-300 font-mono truncate w-full text-center">{rpc.largeImageKey}</span>
                          </div>
                        ) : (
                          <span className="opacity-20 text-[8px]">NO ASSET</span>
                        )}
                      </div>
                      
                      {rpc?.largeImageText && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111214] border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover/large:opacity-100 transition-all z-30 pointer-events-none shadow-2xl text-white font-bold">
                          {rpc.largeImageText}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111214]"></div>
                        </div>
                      )}
                    </div>

                    {/* Small image — corner badge */}
                    {rpc?.smallImageKey && (
                      <div className="group/small absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#111214] p-0.5 cursor-default z-10">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center text-[6px] text-zinc-100 font-mono">
                          {assetUrls[rpc.smallImageKey] ? (
                            <img src={assetUrls[rpc.smallImageKey]} alt={rpc.smallImageKey} className="w-full h-full object-cover" />
                          ) : (
                            rpc.smallImageKey.substring(0, 3)
                          )}
                        </div>
                        {rpc?.smallImageText && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111214] border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover/small:opacity-100 transition-all z-30 pointer-events-none shadow-xl text-white font-bold">
                            {rpc.smallImageText}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111214]"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text Data */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <h6 className="font-bold text-[13px] leading-tight truncate text-zinc-100">
                      {app?.name || t('app_name')}
                    </h6>
                    <p className="text-[12px] text-zinc-400 truncate mt-0.5">
                      {resolveVars(rpc?.description) || t('details')}
                    </p>
                    <p className="text-[12px] text-zinc-400 truncate">
                      {resolveVars(rpc?.state) || t('state')}
                    </p>
                    
                    {rpc?.partySize && (
                      <p className="text-[12px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                         {rpc.partySize} {t('of')} {rpc.partyMax || '?'}
                      </p>
                    )}

                    {rpc?.showTimestamp && (
                      <p className="text-[12px] text-zinc-400 mt-0.5 font-medium">
                        {displayTime}
                      </p>
                    )}
                  </div>
               </div>

               {/* Buttons */}
               <div className="mt-4 space-y-2">
                 {rpc?.buttons?.map((btn, idx) => btn.label && (
                   <button 
                    key={idx} 
                    className="w-full bg-[#4e5058] hover:bg-[#6c6e77] py-1.5 rounded text-[12px] font-semibold transition-all active:scale-[0.98] border border-transparent hover:border-white/10"
                   >
                      {btn.label}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
