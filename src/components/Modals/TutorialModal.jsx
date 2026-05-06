import { X, ExternalLink, Info, Image as ImageIcon, Settings, Play, Zap } from 'lucide-react';
import useStore from '../../store/useStore';

export function TutorialModal({ isOpen, onClose }) {
  const { t } = useStore();

  if (!isOpen) return null;

  const steps = [
    {
      title: t('tutorial_step1_title'),
      desc: t('tutorial_step1_desc'),
      icon: <ExternalLink className="text-discord-blurple" />,
      link: "https://discord.com/developers/applications"
    },
    {
      title: t('tutorial_step2_title'),
      desc: t('tutorial_step2_desc'),
      icon: <Settings className="text-discord-yellow" />
    },
    {
      title: t('tutorial_step3_title'),
      desc: t('tutorial_step3_desc'),
      icon: <ImageIcon className="text-discord-fuchsia" />
    },
    {
      title: t('tutorial_step4_title'),
      desc: t('tutorial_step4_desc'),
      icon: <Play className="text-discord-green" />
    },
    {
      title: t('tutorial_step5_title'),
      desc: t('tutorial_step5_desc'),
      icon: <Zap className="text-discord-yellow" />,
      fullWidth: true
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-discord-blurple/20 to-transparent p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-discord-blurple rounded-xl flex items-center justify-center shadow-lg shadow-discord-blurple/20">
                <Info className="text-white" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-text-main leading-tight">{t('tutorial_title')}</h2>
                <p className="text-xs text-text-muted font-medium">{t('tutorial_desc')}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-text-muted hover:text-text-main transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className={`group p-5 bg-black/2 dark:bg-white/2 border border-black/5 dark:border-white/5 rounded-2xl hover:border-black/10 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all${step.fullWidth ? ' md:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-card border border-black/5 dark:border-white/5 rounded-lg flex items-center justify-center text-text-main">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase">{t('step')} {idx + 1}</span>
                </div>
                <h4 className="font-bold text-sm mb-2 text-text-main group-hover:text-discord-blurple transition-colors">{step.title}</h4>
                <p className="text-[11px] leading-relaxed text-text-muted group-hover:text-text-main transition-colors">
                  {step.desc}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold text-discord-blurple hover:underline"
                  >
                    Discord Developer Portal <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/5 dark:bg-zinc-900/50 border-t border-black/5 dark:border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-discord-blurple hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-discord-blurple/20 active:scale-95"
          >
            {t('got_it')}
          </button>
        </div>
      </div>
    </div>
  );
}
