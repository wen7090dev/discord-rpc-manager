import { motion } from 'framer-motion';
import { Download, X, Sparkles, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react';
import useStore from '../../store/useStore';

export function UpdateModal() {
  const { updateInfo, t } = useStore();
  const dismiss = () => useStore.setState({ updateInfo: null });

  if (!updateInfo) return null;

  const { downloadReady, progress = 0, devMode, url } = updateInfo;

  const handleAction = () => {
    if (devMode) {
      window.electronAPI?.openExternal(url);
      dismiss();
      return;
    }
    if (downloadReady) {
      window.electronAPI?.installUpdate?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismiss}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-card/90 border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-discord-blurple/20 blur-[80px] -z-10" />

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-discord-blurple/10 flex items-center justify-center mb-6 relative">
            {downloadReady
              ? <RotateCcw className="w-10 h-10 text-discord-blurple" />
              : <Download className="w-10 h-10 text-discord-blurple" />
            }
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-discord-blurple rounded-2xl -z-10"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <h5 className="flex items-center gap-2 text-discord-yellow">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('update_available')}</span>
            </h5>
          </div>

          <h2 className="text-2xl font-black text-text-main mb-2">
            {downloadReady ? t('update_ready') : t('new_version_title')}
          </h2>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            {t('update_desc').replace('{new}', updateInfo.version).replace('{old}', updateInfo.current)}
          </p>

          {/* Download progress bar (production only, while downloading) */}
          {!devMode && !downloadReady && (
            <div className="w-full mb-6">
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>{t('update_downloading')}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-discord-blurple rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={handleAction}
              disabled={!devMode && !downloadReady}
              className={`w-full h-14 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg group
                ${(!devMode && !downloadReady)
                  ? 'bg-discord-blurple/50 cursor-not-allowed'
                  : 'bg-discord-blurple hover:bg-discord-blurple-hover shadow-discord-blurple/20'
                }`}
            >
              {devMode
                ? <><ExternalLink className="w-5 h-5" /><span>{t('download_install')}</span></>
                : downloadReady
                  ? <><RotateCcw className="w-5 h-5" /><span>{t('install_restart')}</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                  : <><Download className="w-5 h-5 animate-bounce" /><span>{t('update_downloading')}</span></>
              }
            </button>

            <button
              onClick={dismiss}
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-text-main font-bold rounded-2xl transition-all border border-white/5"
            >
              {t('maybe_later')}
            </button>
          </div>

          <p className="mt-6 text-[10px] text-text-muted/50 uppercase tracking-widest font-medium flex items-center gap-2">
            {t('automated_check')} <span className="w-1 h-1 rounded-full bg-discord-green" /> github.com
          </p>
        </div>

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
