import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, Users, Loader2, Star, Calendar, RefreshCw, Check, ArrowDownUp } from 'lucide-react';
import useStore, { rawFromCode } from '../store/useStore';
import clsx from 'clsx';

const TABS = [
  { id: 'all', labelKey: 'tab_all' },
  { id: 'top10', labelKey: 'tab_top10' },
  { id: 'week', labelKey: 'tab_week' },
  { id: 'month', labelKey: 'tab_month' },
];

const assetCache = new Map();

function CommunityCard({ rpc, index, userRpcs, importingId, onImport, t }) {
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const decoded = await rawFromCode(rpc.code);
        if (!active || !decoded) return;

        const clientId = decoded._app?.i;
        const appName = decoded._app?.n || (clientId ? `App ${clientId}` : 'Unknown');

        // Fetch assets from Discord if clientId exists
        let assets = {};
        if (clientId) {
          if (assetCache.has(clientId)) {
            assets = assetCache.get(clientId);
          } else {
            try {
              const res = await fetch(`https://discord.com/api/v9/oauth2/applications/${clientId}/assets`);
              if (res.ok) {
                const list = await res.json();
                const map = {};
                for (const asset of list) {
                  map[asset.name] = `https://cdn.discordapp.com/app-assets/${clientId}/${asset.id}.png`;
                }
                assetCache.set(clientId, map);
                assets = map;
              }
            } catch {}
          }
        }

        const resolveAsset = (key) => {
          if (!key) return null;
          if (key.startsWith('http')) return key;
          return assets[key] || null;
        };

        setPreview({
          appName,
          description: decoded.description,
          state: decoded.state,
          largeImage: resolveAsset(decoded.largeImageKey),
          smallImage: resolveAsset(decoded.smallImageKey),
          buttons: decoded.buttons || []
        });
      } finally {
        if (active) setLoadingPreview(false);
      }
    };
    load();
    return () => { active = false; };
  }, [rpc.code]);

  const isImporting = importingId === rpc.code;
  const isAlreadyImported = userRpcs.some(r => r.originalCode === rpc.code || r.name === rpc.name);
  const { language } = useStore();
  const date = new Date(rpc.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="glass p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:border-discord-blurple/30 transition-all flex flex-col h-full group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-discord-blurple/20 to-discord-fuchsia/20 border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0">
          <span className="font-bold text-discord-blurple text-lg">
            {preview ? (preview.appName[0]?.toUpperCase()) : <Users size={18} />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-main truncate" title={preview?.appName || 'Loading...'}>
            {preview ? preview.appName : <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted font-medium">
            <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md"><Star size={10} fill="currentColor" /> {rpc.likes}</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {date}</span>
          </div>
        </div>
      </div>

      <div className="bg-black/5 dark:bg-black/40 rounded-xl p-2.5 mb-4 border border-black/5 dark:border-white/5 flex-grow relative min-h-[80px]">
        {loadingPreview ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-discord-blurple/50" />
          </div>
        ) : preview ? (
          <>
            <div className="flex gap-2">
              <div className="relative w-12 h-12 shrink-0">
                {preview.largeImage ? (
                  <img src={preview.largeImage} className="w-12 h-12 rounded-lg object-cover bg-card" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-black/10 dark:bg-zinc-800 flex items-center justify-center text-[8px] text-text-muted">{t('no_img')}</div>
                )}
                {preview.smallImage && (
                  <img src={preview.smallImage} className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-card object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-main truncate">{preview.appName}</p>
                {preview.description && <p className="text-[10px] text-text-muted truncate">{preview.description}</p>}
                {preview.state && <p className="text-[10px] text-text-muted truncate">{preview.state}</p>}
              </div>
            </div>
            {preview.buttons && preview.buttons.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {preview.buttons.slice(0, 2).map((b, i) => (
                  <div key={i} className="w-full text-center py-1 rounded bg-black/5 dark:bg-[#4e5058] border border-black/5 dark:border-transparent text-[9px] font-semibold text-text-main dark:text-zinc-200 truncate px-2">{b.label}</div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-muted italic">
            {t('invalid_code')}
          </div>
        )}
      </div>

      <button
        onClick={() => !isAlreadyImported && onImport(rpc)}
        disabled={isImporting || isAlreadyImported}
        className={clsx(
          "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
          isAlreadyImported
            ? "bg-emerald-500/10 text-emerald-500 cursor-default"
            : isImporting
              ? "bg-discord-blurple/20 text-discord-blurple cursor-wait"
              : "bg-discord-blurple text-white hover:bg-discord-blurple-hover hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-discord-blurple/20"
        )}
      >
        {isImporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isAlreadyImported ? (
          <><Check size={14} /> {t('already_imported')}</>
        ) : (
          <><Download size={14} /> {t('import')}</>
        )}
      </button>
    </motion.div>
  );
}

export default function Community() {
  const { t, importShareCode, addNotification, rpcs: userRpcs, communityCache, setCommunityCache } = useStore();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(communityCache.all.length === 0);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [importingId, setImportingId] = useState(null);

  const fetchCommunityData = async (force = false) => {
    if (force || communityCache.all.length === 0) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://wen7090dev.github.io/discord-rpc/community/all_rpcs.json?t=${Date.now()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      // On décode les noms tout de suite pour que la recherche fonctionne
      const enriched = await Promise.all(data.map(async r => {
        const decoded = await rawFromCode(r.code);
        return { ...r, name: decoded?.name || 'Unknown' };
      }));

      setCommunityCache({ ...communityCache, all: enriched });
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const handleImport = async (rpc) => {
    setImportingId(rpc.code);
    const result = await importShareCode(rpc.code);
    setImportingId(null);
    
    if (result) {
      addNotification({
        title: t('community_title'),
        message: result.autoLinked
          ? t('import_success_linked').replace('{name}', rpc.name)
          : t('import_success_unlinked').replace('{name}', rpc.name),
        type: 'success',
      });
    } else {
      addNotification({ title: t('error'), message: t('import_error'), type: 'error' });
    }
  };

  const getFilteredList = () => {
    let list = [...communityCache.all];
    const now = new Date();

    if (activeTab === 'top10') {
      return list.sort((a, b) => b.likes - a.likes).slice(0, 10);
    }
    
    if (activeTab === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - (day === 0 ? 6 : day - 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      list = list.filter(rpc => new Date(rpc.date) >= startOfWeek);
    } else if (activeTab === 'month') {
      list = list.filter(rpc => {
        const d = new Date(rpc.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    return list;
  };

  const displayList = getFilteredList();
  const filteredRPCs = displayList
    .filter(rpc => (rpc.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortMode === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortMode === 'liked') return b.likes - a.likes;
      if (sortMode === 'az') return (a.name || '').localeCompare(b.name || '');
      if (sortMode === 'za') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-text-main to-text-main/60 bg-clip-text text-transparent">{t('community_title')}</h1>
          <p className="text-text-muted text-sm mt-1">{t('community_desc')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-discord-blurple transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all w-full md:w-64"
            />
          </div>

          <div className="relative group">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="appearance-none bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all cursor-pointer text-text-main"
            >
              <option value="newest" className="bg-card text-text-main">{t('sort_newest')}</option>
              <option value="oldest" className="bg-card text-text-main">{t('sort_oldest')}</option>
              <option value="liked" className="bg-card text-text-main">{t('sort_most_liked')}</option>
              <option value="az" className="bg-card text-text-main">{t('sort_az')}</option>
              <option value="za" className="bg-card text-text-main">{t('sort_za')}</option>
            </select>
          </div>

          <a
            href="https://discord.gg/YhTDM8FCrr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-discord-blurple text-white hover:bg-discord-blurple-hover transition-all active:scale-95 shadow-lg shadow-discord-blurple/20 group"
            data-theme-btn="contrast"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="font-bold text-sm">{t('join_discord')}</span>
          </a>

          <button
            onClick={() => fetchCommunityData(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:bg-white/10 hover:text-text-main transition-all active:scale-95 group"
            title={t('refresh')}
          >
            <RefreshCw size={18} className={clsx(loading && "animate-spin text-discord-blurple")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/20"
                : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-main"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-[400px]">
        {loading && communityCache.all.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
            <Loader2 size={32} className="animate-spin mb-4 text-discord-blurple" />
            <p>{t('loading_community')}</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-discord-red/20 rounded-3xl bg-discord-red/5">
            <p className="text-discord-red font-medium mb-4">{error}</p>
            <button 
              onClick={() => fetchCommunityData()}
              className="bg-discord-red/10 text-discord-red hover:bg-discord-red hover:text-white px-4 py-2 rounded-xl transition-colors text-sm font-bold"
            >
              {t('retry')}
            </button>
          </div>
        ) : filteredRPCs.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl bg-card/30">
            <Search size={32} className="text-text-muted mb-3 opacity-50" />
            <p className="text-text-main font-medium">{t('no_profile_found')}</p>
            {search && <p className="text-text-muted text-sm mt-1">{t('try_other_keywords')}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRPCs.map((rpc, index) => (
              <CommunityCard 
                key={rpc.code + index}
                rpc={rpc}
                index={index}
                userRpcs={userRpcs}
                importingId={importingId}
                onImport={handleImport}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
