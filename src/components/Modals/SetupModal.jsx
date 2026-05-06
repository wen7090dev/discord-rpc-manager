import { useState } from 'react';
import useStore from '../../store/useStore';
import { Check, Rocket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function SetupModal() {
  const { settings, saveData, t } = useStore();
  const [isFinishing, setIsFinishing] = useState(false);

  const THEMES = [
    { id: 'light', name: 'Light', color: '#f2f3f5', accent: '#5865f2', border: 'border-[#d1d5db]' },
    { id: 'dark', name: 'Dark', color: '#1a1b1e', accent: '#5865f2', border: 'border-[#2d2f34]' },
    { id: 'midnight', name: 'Midnight', color: '#000000', accent: '#ffffff', border: 'border-zinc-800' },
    { id: 'ocean', name: 'Ocean', color: '#0a192f', accent: '#64ffda', border: 'border-[#1e3a8a]' },
    { id: 'forest', name: 'Forest', color: '#0b140d', accent: '#2ecc71', border: 'border-[#065f46]' },
    { id: 'sakura', name: 'Sakura', color: '#1a1216', accent: '#eb4d89', border: 'border-[#9d174d]' },
  ];

  const handleThemeChange = (themeId) => {
    useStore.setState((state) => ({
      settings: { ...state.settings, theme: themeId }
    }));
    document.documentElement.setAttribute('data-theme', themeId);
    if (themeId === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  };

  const handleAutoLaunchToggle = () => {
    const newValue = !settings.autoLaunch;
    useStore.setState((state) => ({
      settings: { ...state.settings, autoLaunch: newValue }
    }));
    if (window.electronAPI) {
      window.electronAPI.setAutoLaunch(newValue);
    }
  };

  const setLanguage = (lang) => {
    useStore.setState((state) => ({
      settings: { ...state.settings, language: lang }
    }));
  };

  const handleFinish = () => {
    setIsFinishing(true);
    useStore.setState((state) => ({
      settings: { ...state.settings, firstLaunch: false }
    }));
    saveData();
    if (window.electronAPI) {
      setTimeout(() => {
        window.electronAPI.focusWindow();
      }, 300);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isFinishing ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={clsx(
        "fixed inset-0 flex items-center justify-center p-4 sm:p-6",
        isFinishing ? "-z-10 pointer-events-none" : "z-[100] pointer-events-auto"
      )}
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl bg-card border border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-discord-blurple/10 text-discord-blurple rounded-2xl mb-2">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl font-black text-text-main tracking-tight uppercase italic">{t('setup_title')}</h2>
            <p className="text-text-muted text-sm max-w-xs mx-auto">{t('setup_desc')}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] text-center">{t('setup_theme')}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.color} 50%, ${theme.accent} 50%)` 
                    }}
                  >
                    {settings.theme === theme.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-full">
                        <Check size={18} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-tight ${settings.theme === theme.id ? 'text-discord-blurple' : 'text-text-muted'}`}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/5 dark:bg-white/2 rounded-3xl p-5 border border-black/5 dark:border-white/5 flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('setup_language')}</span>
              <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl w-full gap-1">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'en' ? 'bg-white text-discord-blurple shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                  data-theme-btn={settings.language === 'en' ? 'contrast' : ''}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'fr' ? 'bg-white text-discord-blurple shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                  data-theme-btn={settings.language === 'fr' ? 'contrast' : ''}
                >
                  FR
                </button>
                <button 
                  onClick={() => setLanguage('es')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'es' ? 'bg-white text-discord-blurple shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                  data-theme-btn={settings.language === 'es' ? 'contrast' : ''}
                >
                  ES
                </button>
                <button 
                  onClick={() => setLanguage('de')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.language === 'de' ? 'bg-white text-discord-blurple shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                  data-theme-btn={settings.language === 'de' ? 'contrast' : ''}
                >
                  DE
                </button>
              </div>
            </div>

            <div className="bg-black/5 dark:bg-white/2 rounded-3xl p-5 border border-black/5 dark:border-white/5 flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('setup_autolaunch')}</span>
              <div className="flex items-center justify-between w-full h-full px-2">
                <div className="p-2 bg-discord-green/10 text-discord-green rounded-xl">
                  <Rocket size={20} />
                </div>
                <button 
                  onClick={handleAutoLaunchToggle}
                  className={`w-12 h-6 rounded-full transition-all relative p-1 ${settings.autoLaunch ? 'bg-discord-green shadow-lg shadow-discord-green/20' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoLaunch ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-discord-blurple hover:bg-discord-blurple/90 text-white font-black py-4 rounded-3xl text-lg uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-discord-blurple/25"
          >
            {t('setup_finish')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
