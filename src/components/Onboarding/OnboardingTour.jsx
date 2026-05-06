import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import useStore from '../../store/useStore';

const STEPS = [
  { id: 'welcome', target: null },
  { id: 'applications', target: '[data-tour="nav-applications"]', pad: 10 },
  { id: 'new-rpc', target: '[data-tour="btn-new-rpc"]', pad: 10 },
  { id: 'search', target: '[data-tour="search-bar"]', pad: 10 },
  { id: 'done', target: null },
];

const TITLE_KEYS = ['tour_welcome_title', 'tour_apps_title', 'tour_new_rpc_title', 'tour_search_title', 'tour_done_title'];
const DESC_KEYS  = ['tour_welcome_desc',  'tour_apps_desc',  'tour_new_rpc_desc',  'tour_search_desc',  'tour_done_desc'];

function getRect(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

function Spotlight({ rect, pad = 10 }) {
  if (!rect) return null;
  const t = rect.top - pad;
  const l = rect.left - pad;
  const r = rect.right + pad;
  const b = rect.bottom + pad;
  const style = 'fixed bg-black/60 z-[9998] transition-all duration-300 pointer-events-none';
  return (
    <>
      <div className={style} style={{ top: 0, left: 0, right: 0, height: Math.max(0, t) }} />
      <div className={style} style={{ top: t, left: 0, width: Math.max(0, l), height: b - t }} />
      <div className={style} style={{ top: t, left: r, right: 0, height: b - t }} />
      <div className={style} style={{ top: b, left: 0, right: 0, bottom: 0 }} />
      <div
        className="fixed z-[9998] pointer-events-none rounded-xl transition-all duration-300"
        style={{ top: t, left: l, width: r - l, height: b - t, boxShadow: '0 0 0 4px rgba(88,101,242,0.6)' }}
      />
    </>
  );
}

function tooltipPosition(rect, pad) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = 320;
  const tooltipH = 160;
  const gap = 18;

  // prefer below, then above, then right, then left
  if (rect.bottom + pad + gap + tooltipH < vh) {
    return { top: rect.bottom + pad + gap, left: Math.min(Math.max(rect.left, 8), vw - tooltipW - 8) };
  }
  if (rect.top - pad - gap - tooltipH > 0) {
    return { top: rect.top - pad - gap - tooltipH, left: Math.min(Math.max(rect.left, 8), vw - tooltipW - 8) };
  }
  if (rect.right + pad + gap + tooltipW < vw) {
    return { top: Math.max(rect.top - 40, 8), left: rect.right + pad + gap };
  }
  return { top: Math.max(rect.top - 40, 8), left: Math.max(rect.left - pad - gap - tooltipW, 8) };
}

export default function OnboardingTour({ onComplete }) {
  const { t, settings, saveData } = useStore();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const updateRect = useCallback(() => {
    setRect(getRect(current.target));
  }, [current.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const finish = async () => {
    useStore.setState((s) => ({
      settings: { ...s.settings, tourCompleted: true }
    }));
    await saveData();
    onComplete?.();
  };

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const isCentered = !current.target;
  const pos = isCentered ? null : tooltipPosition(rect, current.pad ?? 10);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9997]">
        {/* Dim overlay for centered steps */}
        {isCentered && (
          <div className="absolute inset-0 bg-black/70" />
        )}

        {/* Spotlight for targeted steps */}
        {!isCentered && rect && (
          <Spotlight rect={rect} pad={current.pad} />
        )}
        {!isCentered && !rect && (
          <div className="absolute inset-0 bg-black/60" />
        )}

        {/* Tooltip / card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed z-[9999] w-80 bg-card border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-6"
          style={
            isCentered
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : pos
          }
        >
          {/* Arrow indicator for targeted steps */}
          {!isCentered && rect && (
            <div className="absolute -top-2 left-6 w-4 h-4 bg-card border-t border-l border-black/10 dark:border-white/10 rotate-45" />
          )}

          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-discord-blurple" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-discord-blurple">
                {isCentered
                  ? (isFirst ? t('tour') : isLast ? t('done_badge') : t('tour'))
                  : t('tour_step').replace('{current}', step).replace('{total}', STEPS.length - 2)}
              </span>
            </div>
            <button
              onClick={finish}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-text-main"
              title={t('tour_skip')}
            >
              <X size={14} />
            </button>
          </div>

          <h3 className="text-base font-bold text-text-main mb-2">{t(TITLE_KEYS[step])}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-5">{t(DESC_KEYS[step])}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-4 bg-discord-blurple' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && !isLast && (
                <button
                  onClick={finish}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {t('tour_skip')}
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/90 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
              >
                {isLast ? t('tour_finish') : t('tour_next')}
                {!isLast && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
