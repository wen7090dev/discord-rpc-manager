import { LayoutDashboard, Cpu, Settings, FileText, Globe, Github, Coffee, Users, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import useStore from '../../store/useStore';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Sidebar({ activeTab, setActiveTab }) {
  const { t } = useStore();

  const menuItems = [
    { id: 'dashboard',    label: t('dashboard'),       icon: LayoutDashboard },
    { id: 'community',    label: t('community_title'), icon: Users },
    { id: 'applications', label: t('applications'),    icon: Cpu },
    { id: 'stats',        label: t('stats'),           icon: BarChart2 },
    { id: 'logs',         label: t('logs'),            icon: FileText },
    { id: 'settings',     label: t('settings'),        icon: Settings },
  ];


  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-black/5 dark:border-white/5">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/5 shadow-lg shadow-discord-blurple/20">
            <img src="logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text-main">RPC <span className="text-discord-blurple">Manager</span></span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              data-tour={item.id === 'applications' ? 'nav-applications' : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                activeTab === item.id
                  ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/20"
                  : "text-text-muted hover:text-text-main hover:bg-white/5"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-text-muted group-hover:text-text-main"
              )} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-2">
        <div className="glass rounded-2xl p-4 border border-white/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{t('credits')}</p>
              <a
                href="https://wen7090dev.github.io/license/Discord-RPC-Manager.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-text-muted hover:text-discord-blurple transition-colors underline decoration-current"
              >
                Original by wen7090dev ({t('license')})
              </a>
            </div>
            <span className="text-[10px] font-mono text-text-muted">v{__APP_VERSION__}</span>
          </div>

          <div className="space-y-2">
            <a
              href="https://wen7090dev.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 bg-discord-blurple/10 hover:bg-discord-blurple/20 border border-discord-blurple/10 rounded-xl transition-all group/port"
            >
              <Globe className="w-4 h-4 text-discord-blurple group-hover/port:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-text-main group-hover:text-discord-blurple transition-colors">{t('portfolio')}</span>
            </a>

            <a
              href="https://github.com/wen7090dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 rounded-xl transition-all group/git"
            >
              <Github className="w-4 h-4 text-text-muted group-hover/git:scale-110 transition-transform" />
              <span className="text-xs font-bold text-text-main group-hover:text-black dark:group-hover:text-white">GitHub</span>
            </a>

            <a
              href="https://discord.gg/YhTDM8FCrr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 bg-discord-blurple/10 hover:bg-discord-blurple/20 border border-discord-blurple/10 rounded-xl transition-all group/dc"
            >
              <svg className="w-4 h-4 text-discord-blurple shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-xs font-bold text-text-main group-hover/dc:text-discord-blurple transition-colors">Discord</span>
            </a>

            <a
              href="https://buymeacoffee.com/wen7090"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 bg-discord-yellow/10 hover:bg-discord-yellow/20 border border-discord-yellow/30 dark:border-discord-yellow/20 rounded-xl transition-all group/coffee no-drag"
            >
              <Coffee className="w-4 h-4 text-discord-yellow group-hover/coffee:animate-bounce" />
              <span className="text-xs font-bold text-[#9a7d0a] dark:text-discord-yellow">{t('coffee')}</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
