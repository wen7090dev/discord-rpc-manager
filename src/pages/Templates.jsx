import { Grid, Gamepad2, Code2, Music2, Coffee, Trash2, Plus, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';



export default function Templates() {
  const { addRPC, applications, t, searchQuery, addNotification } = useStore();

  const PRESETS = [
    {
      name: t('gaming_session'),
      icon: Gamepad2,
      color: 'bg-discord-red',
      data: {
        description: t('gaming_desc'),
        state: t('gaming_state'),
        largeImageKey: 'gaming',
        largeImageText: t('gaming_img_text'),
      }
    },
    {
      name: t('coding_mode'),
      icon: Code2,
      color: 'bg-discord-blurple',
      data: {
        description: t('coding_desc'),
        state: t('coding_state'),
        largeImageKey: 'vscode',
        largeImageText: t('coding_img_text'),
      }
    },
    {
      name: t('chill_mode'),
      icon: Music2,
      color: 'bg-discord-fuchsia',
      data: {
        description: t('chill_desc'),
        state: t('chill_state'),
        largeImageKey: 'music',
        largeImageText: t('chill_img_text'),
      }
    },
    {
      name: t('afk_mode'),
      icon: Coffee,
      color: 'bg-discord-yellow',
      data: {
        description: t('afk_desc'),
        state: t('afk_state'),
        largeImageKey: 'chill',
      }
    }
  ];

  const filteredPresets = PRESETS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyTemplate = (preset) => {
    const appId = applications[0]?.id || '';
    addRPC({
      ...preset.data,
      name: `${preset.name} - ${new Date().toLocaleTimeString()}`,
      applicationId: appId,
      showTimestamp: true,
      buttons: [{ label: '', url: '' }, { label: '', url: '' }]
    });
    addNotification({ title: preset.name, message: t('template_added').replace('{name}', preset.name), type: 'success' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles size={14} /> {t('new_feature')}
        </motion.div>
        <h1 className="text-4xl font-extrabold text-text-main">
          {t('templates_title').split(' ').slice(0, -1).join(' ')}{' '}
          <span className="text-discord-blurple">{t('templates_title').split(' ').slice(-1)}</span>
        </h1>
        <p className="text-text-muted max-w-xl mx-auto">{t('templates_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPresets.length === 0 && (
          <div className="col-span-4 flex flex-col items-center justify-center py-20 text-center">
            <Sparkles size={48} className="text-text-muted mb-4" />
            <p className="text-text-muted text-sm">{t('no_results').replace('{query}', searchQuery)}</p>
          </div>
        )}
        {filteredPresets.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <motion.div
              key={preset.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass relative group p-8 rounded-3xl border-black/5 dark:border-white/5 hover:border-discord-blurple/30 transition-all flex flex-col items-center text-center gap-6 overflow-hidden"
            >
              <div className={`${preset.color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl`}>
                 <Icon size={32} className="text-white" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-discord-blurple transition-colors text-text-main">{preset.name}</h3>
                <p className="text-sm text-text-muted line-clamp-2">{preset.data.description}</p>
              </div>

              <button 
                onClick={() => applyTemplate(preset)}
                className="w-full py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl font-bold text-sm transition-all border border-black/5 dark:border-white/5 no-drag text-text-main"
              >
                {t('use_preset')}
              </button>

              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-black/5 dark:bg-white/5 rounded-full blur-3xl group-hover:bg-discord-blurple/10 transition-colors" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
