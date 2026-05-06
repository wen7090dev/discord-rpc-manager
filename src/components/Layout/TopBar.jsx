import { useState } from 'react';
import { Search, Bell, X, Minus, Music2, Gamepad2, Download } from 'lucide-react';
import useStore from '../../store/useStore';
import clsx from 'clsx';

const dismissUpdate = () => useStore.setState({ updateInfo: null });

const SEARCH_PLACEHOLDERS = {
  dashboard:    'search_placeholder',
  applications: 'search_placeholder',
  templates:    'search_placeholder',
};

export function TopBar({ showSearch = false, activeTab }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const { status, searchQuery, setSearchQuery, notifications, clearNotifications, settings, mediaInfo, steamGame, updateInfo, t, rpcs, applications, startRPC, folderFilter } = useStore();

  const unreadCount = notifications.length;

  return (
    <>
    <header className="h-16 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="titlebar absolute inset-0 -z-10" />
      
      <div className="flex items-center gap-4 flex-1">
        {showSearch && (
          <div className="relative max-w-md w-full no-drag" data-tour="search-bar">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={t(SEARCH_PLACEHOLDERS[activeTab] || 'search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !searchQuery) return;
                const base = folderFilter ? rpcs.filter(r => r.folderId === folderFilter) : rpcs;
                const match = base.find(r =>
                  r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.state?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (match) {
                  const app = applications.find(a => a.id === match.applicationId);
                  if (app) startRPC(match, app.appId);
                }
              }}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-discord-blurple/50 transition-colors text-text-main"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 no-drag">
        {/* SMTC — now playing */}
        {mediaInfo?.title && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-discord-fuchsia/20 bg-discord-fuchsia/5 max-w-[220px]" title={`${mediaInfo.artist} — ${mediaInfo.title}`}>
            <Music2 size={12} className="text-discord-fuchsia shrink-0 animate-pulse" />
            <span className="text-[11px] text-discord-fuchsia font-medium truncate">
              {mediaInfo.artist ? `${mediaInfo.artist} — ${mediaInfo.title}` : mediaInfo.title}
            </span>
          </div>
        )}
        {/* Steam — current game */}
        {steamGame && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-discord-green/20 bg-discord-green/5 max-w-[180px]" title={steamGame}>
            <Gamepad2 size={12} className="text-discord-green shrink-0" />
            <span className="text-[11px] text-discord-green font-medium truncate">{steamGame}</span>
          </div>
        )}

        <div className="flex items-center gap-2 group px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
          <div className={clsx(
            "w-2 h-2 rounded-full",
            status === 'connected' ? "bg-discord-green" : "bg-text-muted"
          )} />
          <span className="text-xs font-medium text-text-muted group-hover:text-text-main transition-colors uppercase tracking-wider">
            {status === 'connected' ? t('connected') : t('offline')}
          </span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5 text-text-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-discord-red rounded-full border-2 border-background animate-pulse" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-white/10 dark:border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50">
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('notifications')}</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] text-text-muted hover:text-text-main"
                    >
                      {t('clear')}
                    </button>
                  )}
               </div>
               <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                       <p className="text-xs text-text-muted italic">{t('no_notifications')}</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                         <h5 className={clsx(
                           "text-[11px] font-bold mb-0.5",
                           notif.type === 'error' ? 'text-discord-red' : 'text-discord-blurple'
                         )}>{notif.title}</h5>
                         <p className="text-[10px] text-text-muted leading-tight">{notif.message}</p>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <div className="flex items-center gap-1">
          <button 
            onClick={() => window.electronAPI?.minimizeWindow()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
            title={t('minimize')}
          >
            <Minus className="w-4 h-4 text-text-muted group-hover:text-text-main" />
          </button>
          <button 
            onClick={() => window.electronAPI?.closeWindow(settings.closeBehavior)}
            className="p-2 hover:bg-discord-red/20 text-text-muted hover:text-discord-red rounded-lg transition-all group"
            title={t('app_close')}
          >
            <X className="w-4 h-4 transition-colors group-hover:text-discord-red" />
          </button>
        </div>
      </div>
    </header>
    </>
  );
}
