import { useEffect, useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';

export function ChangelogModal() {
  const { dismissChangelog, t } = useStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/wen7090dev/discord-rpc-manager/releases/latest', {
      headers: { 'User-Agent': 'discord-rpc-manager' },
    })
      .then(r => r.json())
      .then(data => setNotes(data.body || ''))
      .catch(() => setNotes(''))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissChangelog} />
      <motion.div
        className="relative glass rounded-3xl p-7 max-w-md w-full shadow-2xl border border-white/10"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <button
          onClick={dismissChangelog}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-text-muted hover:text-text-main transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-discord-blurple/20 flex items-center justify-center">
            <Sparkles size={18} className="text-discord-blurple" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">{t('changelog_title')}</h2>
            <p className="text-xs text-text-muted">v{__APP_VERSION__}</p>
          </div>
        </div>

        <div className="min-h-[80px] max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-discord-blurple" />
            </div>
          ) : notes ? (
            <div className="text-sm text-text-muted space-y-2 whitespace-pre-wrap leading-relaxed">
              {notes}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-6">{t('changelog_empty')}</p>
          )}
        </div>

        <button
          onClick={dismissChangelog}
          className="mt-6 w-full bg-discord-blurple hover:bg-discord-blurple/90 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-discord-blurple/20"
        >
          {t('changelog_close')}
        </button>
      </motion.div>
    </motion.div>
  );
}
