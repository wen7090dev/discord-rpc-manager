import { useState, useRef, useEffect } from 'react';
import useStore from '../../store/useStore';
import { RotateCw, Play, Square, Timer, Check, ChevronDown, Repeat, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export function RotatorToolbar() {
  const { rpcs, startRotation, stopRotation, rotationInterval, t } = useStore();
  const [interval, setIntervalVal] = useState(30);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState('loop'); // 'loop' | 'once'
  const dropdownRef = useRef(null);
  const prevRpcsRef = useRef(null);

  // Auto-remove deleted profiles from selection (selection is otherwise fully manual)
  useEffect(() => {
    const prev = prevRpcsRef.current;
    prevRpcsRef.current = rpcs;
    if (!prev) return; // skip first run
    const currIds = new Set(rpcs.map(r => r.id));
    const removed = new Set(prev.filter(r => !currIds.has(r.id)).map(r => r.id));
    if (removed.size) setSelectedIds(cur => cur.filter(id => !removed.has(id)));
  }, [rpcs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleId = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (rpcs.length < 2) return null;

  return (
    <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-1 rounded-2xl px-3 relative">
      <div className="flex items-center gap-2 text-text-muted pr-2 border-r border-black/5 dark:border-white/10">
         <RotateCw size={16} className={rotationInterval ? 'animate-spin text-discord-green' : ''} />
         <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Rotator</span>
      </div>
      
      {/* Interval Input */}
      <div className="flex items-center gap-2 pr-2 border-r border-black/5 dark:border-white/10">
         <Timer size={14} className="text-text-muted" />
         <div className="flex items-center gap-1">
          <input
              type="number"
              min="5"
              className="w-8 bg-transparent text-sm font-bold focus:outline-none no-drag text-text-main"
              value={interval}
              onChange={(e) => setIntervalVal(Math.max(5, parseInt(e.target.value) || 30))}
          />
          <span className="text-[10px] text-text-muted font-bold">s</span>
         </div>
      </div>

      {/* Selection Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={!!rotationInterval}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
            showDropdown ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5",
            rotationInterval && "opacity-50 cursor-not-allowed"
          )}
        >
          {selectedIds.length} {t('selected')}
          <ChevronDown size={14} className={clsx("transition-transform", showDropdown && "rotate-180")} />
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-black/5 dark:border-white/10 rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-1 mb-1 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
               <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('profiles')}</span>
               <button 
                onClick={() => setSelectedIds(rpcs.map(r => r.id))}
                className="text-[9px] text-discord-blurple hover:underline font-bold"
               >
                 {t('all')}
               </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {rpcs.map(rpc => (
                <button
                  key={rpc.id}
                  onClick={() => toggleId(rpc.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <span className={clsx("text-xs truncate max-w-[120px]", selectedIds.includes(rpc.id) ? "text-text-main font-bold" : "text-text-muted")}>
                    {rpc.name}
                  </span>
                  {selectedIds.includes(rpc.id) && <Check size={12} className="text-discord-blurple shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      {!rotationInterval && (
        <button
          onClick={() => setMode(m => m === 'loop' ? 'once' : 'loop')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-white/5 transition-all border border-white/5"
          title={mode === 'loop' ? t('rotation_mode_loop') : t('rotation_mode_once')}
        >
          {mode === 'loop' ? <Repeat size={11} /> : <ArrowRight size={11} />}
          {mode === 'loop' ? t('rotation_mode_loop') : t('rotation_mode_once')}
        </button>
      )}

      {rotationInterval ? (
        <button
          onClick={() => stopRotation()}
          className="flex items-center gap-2 bg-discord-red/20 text-discord-red px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-discord-red hover:text-white transition-all shadow-lg shadow-discord-red/10"
        >
          <Square size={12} fill="currentColor" /> {t('stop')}
        </button>
      ) : (
        <button
          onClick={() => startRotation(selectedIds, interval, mode)}
          disabled={selectedIds.length < 2}
          className="flex items-center gap-2 bg-discord-green/20 text-discord-green px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-discord-green hover:text-white transition-all shadow-lg shadow-discord-green/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Play size={12} fill="currentColor" /> {t('start_loop')}
        </button>
      )}
    </div>
  );
}
