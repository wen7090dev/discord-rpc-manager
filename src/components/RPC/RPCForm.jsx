import { X, Save, AlignLeft, Image as ImageIcon, Link as LinkIcon, Clock, Calendar, Info, ChevronDown, Check, Monitor, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import clsx from 'clsx';

const ACTIVITY_TYPES = [
  { value: 0, key: 'act_playing' },
  { value: 3, key: 'act_watching' },
  { value: 2, key: 'act_listening' },
  { value: 5, key: 'act_competing' },
];

const DAY_KEYS = ['day_sun','day_mon','day_tue','day_wed','day_thu','day_fri','day_sat'];
const DEFAULT_SCHEDULE = { enabled: false, days: [1,2,3,4,5], startTime: '09:00', endTime: '18:00' };

// ── Asset dropdown (thumbnails) ──────────────────────────────────────────────
function AssetSelect({ value, onChange, assets, appId, placeholder, loading, hasApp, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = assets.find(a => a.name === value);
  const thumbUrl = (asset) => `https://cdn.discordapp.com/app-assets/${appId}/${asset.id}.png`;

  const disabled = !hasApp || loading || assets.length === 0;
  const hintText = !hasApp
    ? t('select_app_first')
    : loading
    ? t('loading_dots')
    : assets.length === 0
    ? t('no_assets_available')
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2 border rounded-xl py-2.5 px-3 text-sm transition-all no-drag text-left',
          disabled
            ? 'bg-black/3 dark:bg-white/3 border-black/5 dark:border-white/5 opacity-60 cursor-not-allowed'
            : open
            ? 'bg-black/5 dark:bg-white/5 border-discord-blurple'
            : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-discord-blurple/40'
        )}
      >
        {selected && !loading ? (
          <>
            <img src={thumbUrl(selected)} alt={selected.name} className="w-7 h-7 rounded-md object-cover shrink-0 bg-black/20" />
            <span className="flex-1 truncate text-text-main text-xs font-medium">{selected.name}</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4 text-text-muted shrink-0" />
            <span className="flex-1 text-text-muted text-xs">{hintText}</span>
          </>
        )}
        <ChevronDown size={14} className={clsx('text-text-muted shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && assets.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* None option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left',
              !value && 'bg-discord-blurple/5'
            )}
          >
            <div className="w-7 h-7 rounded-md bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center">
              <X size={10} className="text-text-muted" />
            </div>
            <span className="flex-1 text-text-muted italic">— {t('none')} —</span>
            {!value && <Check size={12} className="text-discord-blurple" />}
          </button>

          <div className="max-h-52 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
            {assets.map(asset => (
              <button
                key={asset.id}
                type="button"
                onClick={() => { onChange(asset.name); setOpen(false); }}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left',
                  value === asset.name && 'bg-discord-blurple/5'
                )}
              >
                <img src={thumbUrl(asset)} alt={asset.name} className="w-7 h-7 rounded-md object-cover shrink-0 bg-black/20" />
                <span className="flex-1 truncate text-text-main">{asset.name}</span>
                {value === asset.name && <Check size={12} className="text-discord-blurple shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Process selector ─────────────────────────────────────────────────────────
function ProcessSelect({ value, onChange, processes, t }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const filtered = [...new Set(processes)]
    .filter(p => p.toLowerCase().endsWith('.exe'))
    .filter(p => !search || p.toLowerCase().includes(search.toLowerCase()))
    .sort();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2 border rounded-xl py-2.5 px-3 text-sm transition-all no-drag text-left',
          open
            ? 'bg-black/5 dark:bg-white/5 border-discord-green/50'
            : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-discord-green/30'
        )}
      >
        <Monitor className="w-4 h-4 text-text-muted shrink-0" />
        <span className={clsx('flex-1 truncate text-xs', value ? 'text-text-main font-medium' : 'text-text-muted')}>
          {value || (processes.length === 0 ? t('start_prog_hint') : t('select_process'))}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="text-text-muted hover:text-discord-red transition-colors"
            title={t('remove_link')}
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown size={14} className={clsx('text-text-muted shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-black/5 dark:border-white/5">
            <input
              ref={searchRef}
              type="text"
              placeholder={t('process_search_placeholder')}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-discord-green/50 text-text-main no-drag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left border-b border-black/5 dark:border-white/5',
                !value && 'bg-discord-green/5'
              )}
            >
              <X size={10} className="text-text-muted shrink-0" />
              <span className="text-text-muted italic flex-1">— {t('none')} —</span>
              {!value && <Check size={12} className="text-discord-green" />}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-5 text-xs text-text-muted text-center">
                {processes.length === 0 ? t('no_process_detected') : t('no_results')}
              </p>
            ) : (
              filtered.map(proc => (
                <button
                  key={proc}
                  type="button"
                  onClick={() => { onChange(proc); setOpen(false); }}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left',
                    value === proc && 'bg-discord-green/5'
                  )}
                >
                  <Monitor size={11} className={value === proc ? 'text-discord-green shrink-0' : 'text-text-muted shrink-0'} />
                  <span className={clsx('flex-1 truncate font-mono', value === proc ? 'text-text-main font-bold' : 'text-text-muted')}>
                    {proc}
                  </span>
                  {value === proc && <Check size={12} className="text-discord-green shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────
export function RPCForm({ initialData, onCancel, readOnly = false }) {
  const { applications, addRPC, updateRPC, setPreviewData, runningProcesses, t } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    color: '',
    icon: '',
    applicationId: '',
    description: '',
    state: '',
    activityType: 0,
    largeImageKey: '',
    largeImageText: '',
    smallImageKey: '',
    smallImageText: '',
    showTimestamp: true,
    timerMode: 'elapsed',
    duration: '',
    partySize: '',
    partyMax: '',
    partyId: '',
    joinSecret: '',
    spectateSecret: '',
    buttons: [{ label: '', url: '' }, { label: '', url: '' }],
    schedule: { ...DEFAULT_SCHEDULE },
    linkedProcess: '',
  });

  const [assetList, setAssetList] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [formError, setFormError] = useState('');
  const nameRef = useRef(null);

  // Debounced previewData update
  useEffect(() => {
    const timer = setTimeout(() => setPreviewData(formData), 150);
    return () => clearTimeout(timer);
  }, [formData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => setPreviewData(null);
  }, []);

  // Fetch assets when applicationId changes — cancel stale requests on rapid change
  useEffect(() => {
    const app = applications.find(a => a.id === formData.applicationId);
    if (!app?.appId) { setAssetList([]); setLoadingAssets(false); return; }
    setLoadingAssets(true);
    let cancelled = false;
    window.electronAPI?.getDiscordAssets?.(app.appId).then(list => {
      if (cancelled) return;
      setAssetList(Array.isArray(list) ? list : []);
      setLoadingAssets(false);
    }).catch(() => {
      if (cancelled) return;
      setAssetList([]);
      setLoadingAssets(false);
    });
    return () => { cancelled = true; };
  }, [formData.applicationId]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        buttons: initialData.buttons?.length
          ? initialData.buttons
          : [{ label: '', url: '' }, { label: '', url: '' }],
        schedule: { ...DEFAULT_SCHEDULE, ...(initialData.schedule || {}) },
      }));
    }
    const timer = setTimeout(() => nameRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    setFormError('');

    for (const btn of formData.buttons) {
      if (btn.url && !/^https?:\/\/.+/.test(btn.url)) {
        setFormError(t('btn_url_invalid'));
        return;
      }
    }

    if (formData.schedule.enabled && formData.schedule.startTime >= formData.schedule.endTime) {
      setFormError(t('schedule_time_invalid'));
      return;
    }

    if (initialData?.id) updateRPC(initialData.id, formData);
    else addRPC(formData);
    onCancel();
  };

  const updateButton = (idx, field, value) => {
    const newButtons = [...formData.buttons];
    newButtons[idx] = { ...newButtons[idx], [field]: value };
    setFormData({ ...formData, buttons: newButtons });
  };

  const toggleScheduleDay = (dayIdx) => {
    const days = formData.schedule.days.includes(dayIdx)
      ? formData.schedule.days.filter(d => d !== dayIdx)
      : [...formData.schedule.days, dayIdx].sort((a, b) => a - b);
    setFormData({ ...formData, schedule: { ...formData.schedule, days } });
  };

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setSched = (key, val) => setFormData(f => ({ ...f, schedule: { ...f.schedule, [key]: val } }));

  const partyDisabled     = formData.activityType !== 0;
  const timestampDisabled = formData.activityType === 5;

  const selectedApp = applications.find(a => a.id === formData.applicationId);
  const appId = selectedApp?.appId;

  return (
    <div className="glass rounded-3xl p-6 border-black/5 dark:border-white/10 no-drag shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-text-main">
          {initialData ? t('edit_rpc') : t('new_rpc')}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-text-muted hover:text-text-main transition-all">
          <X size={20} />
        </button>
      </div>

      {readOnly && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-xs font-bold">
          <Lock size={13} />
          {t('official_readonly')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={readOnly} className={readOnly ? 'opacity-60 pointer-events-none select-none' : ''} style={{ border: 'none', padding: 0, margin: 0 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Left column ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">{t('basic_info')}</h3>

            {/* Name + icon + color */}
            <div className="flex gap-2">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-lg font-bold select-none"
                style={formData.color
                  ? { background: `linear-gradient(135deg,${formData.color}44,${formData.color}88)`, borderColor: `${formData.color}55`, color: formData.color }
                  : {}}
              >
                {formData.icon || formData.name?.[0]?.toUpperCase() || '?'}
              </div>
              <input
                ref={nameRef}
                required
                type="text"
                placeholder={t('profile_name')}
                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main"
                value={formData.name || ''}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            {/* Color palette + emoji icon */}
            <div className="flex items-center gap-3 px-1">
              <div className="flex flex-wrap gap-1.5">
                {['#5865F2','#57F287','#FEE75C','#ED4245','#EB459E','#FF9500','#1ABC9C','#9B59B6','#3498DB','#FF6B6B','#E67E22','#95A5A6'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', formData.color === c ? '' : c)}
                    className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: formData.color === c ? '#fff' : 'transparent', outline: formData.color === c ? `2px solid ${c}` : 'none' }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="#hex"
                  value={formData.color || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v || /^#[0-9a-fA-F]{0,6}$/.test(v)) set('color', v);
                  }}
                  onBlur={() => {
                    if (formData.color && !/^#[0-9a-fA-F]{6}$/.test(formData.color)) set('color', '');
                  }}
                  className="w-14 text-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-1 text-xs focus:outline-none focus:border-discord-blurple no-drag font-mono"
                  style={/^#[0-9a-fA-F]{6}$/.test(formData.color || '') ? { borderColor: formData.color, color: formData.color } : { color: 'var(--text-muted)' }}
                />
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Icon</span>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="✦"
                  value={formData.icon || ''}
                  onChange={(e) => set('icon', e.target.value)}
                  className="w-12 text-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-1 text-sm focus:outline-none focus:border-discord-blurple no-drag text-text-main"
                />
              </div>
            </div>

            <select
              required
              className="w-full bg-card border border-black/5 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main"
              value={formData.applicationId}
              onChange={(e) => { const v = e.target.value; const n = Number(v); set('applicationId', v === '' ? '' : isNaN(n) ? v : n); }}
            >
              <option value="">{t('select_app')}</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name} ({app.appId})</option>
              ))}
            </select>

            {/* Activity type */}
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_TYPES.map(({ value, key }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('activityType', value)}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-bold transition-all border no-drag',
                    formData.activityType === value
                      ? 'bg-discord-blurple text-white border-discord-blurple shadow-lg shadow-discord-blurple/20'
                      : 'bg-black/5 dark:bg-white/5 text-text-muted border-black/5 dark:border-white/10 hover:border-discord-blurple/40'
                  )}
                >
                  {t(key)}
                </button>
              ))}
            </div>

            {/* Details / State */}
            <div className="space-y-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder={t('details')}
                  className={clsx(
                    "w-full bg-black/5 dark:bg-white/5 border rounded-xl py-3 px-4 text-sm focus:outline-none transition-all pl-11 no-drag text-text-main",
                    formData.description?.trim().length === 1
                      ? "border-discord-yellow/60 focus:border-discord-yellow"
                      : "border-black/5 dark:border-white/10 focus:border-discord-blurple"
                  )}
                  value={formData.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                />
                <AlignLeft className="absolute left-4 top-3.5 w-4 h-4 text-text-muted group-focus-within:text-discord-blurple" />
                {formData.description?.trim().length === 1 && (
                  <p className="text-[10px] text-discord-yellow mt-1 px-1">Discord requiert au moins 2 caractères</p>
                )}
              </div>
              <div className="relative group">
                <input
                  type="text"
                  placeholder={t('state')}
                  className={clsx(
                    "w-full bg-black/5 dark:bg-white/5 border rounded-xl py-3 px-4 text-sm focus:outline-none transition-all pl-11 no-drag text-text-main",
                    formData.state?.trim().length === 1
                      ? "border-discord-yellow/60 focus:border-discord-yellow"
                      : "border-black/5 dark:border-white/10 focus:border-discord-blurple"
                  )}
                  value={formData.state || ''}
                  onChange={(e) => set('state', e.target.value)}
                />
                <AlignLeft className="absolute left-4 top-3.5 w-4 h-4 text-text-muted group-focus-within:text-discord-blurple" />
                {formData.state?.trim().length === 1 && (
                  <p className="text-[10px] text-discord-yellow mt-1 px-1">Discord requiert au moins 2 caractères</p>
                )}
              </div>
              <p className="text-[10px] text-text-muted px-1 flex items-center gap-1">
                <Info size={10} className="shrink-0" />
                {t('vars_hint')}
              </p>
            </div>

            {/* Linked process (auto-launch) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Monitor size={11} />
                {t('auto_launch')}
              </label>
              <ProcessSelect
                value={formData.linkedProcess || ''}
                onChange={(v) => set('linkedProcess', v)}
                processes={runningProcesses}
                t={t}
              />
              <p className="text-[10px] text-text-muted px-1 flex items-center gap-1">
                <Info size={10} className="shrink-0" />
                {t('autolaunch_hint')}
              </p>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">{t('assets_icons')}</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Large image */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">{t('large_image')}</label>
                <AssetSelect
                  value={formData.largeImageKey || ''}
                  onChange={(v) => set('largeImageKey', v)}
                  assets={assetList}
                  appId={appId}
                  placeholder={t('large_image')}
                  loading={loadingAssets}
                  hasApp={!!selectedApp}
                  t={t}
                />
                <input
                  type="text"
                  placeholder={t('large_img_text')}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-1.5 px-3 text-[10px] focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main mt-1"
                  value={formData.largeImageText || ''}
                  onChange={(e) => set('largeImageText', e.target.value)}
                />
              </div>

              {/* Small image */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">{t('small_image')}</label>
                <AssetSelect
                  value={formData.smallImageKey || ''}
                  onChange={(v) => set('smallImageKey', v)}
                  assets={assetList}
                  appId={appId}
                  placeholder={t('small_image')}
                  loading={loadingAssets}
                  hasApp={!!selectedApp}
                  t={t}
                />
                <input
                  type="text"
                  placeholder={t('small_img_text')}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-1.5 px-3 text-[10px] focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main mt-1"
                  value={formData.smallImageText || ''}
                  onChange={(e) => set('smallImageText', e.target.value)}
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mt-4">{t('interactive_buttons')}</h3>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-discord-yellow/8 border border-discord-yellow/20 text-discord-yellow">
              <Info size={12} className="shrink-0" />
              <p className="text-[10px] font-medium leading-snug">{t('buttons_visibility_hint')}</p>
            </div>
            {formData.buttons.map((btn, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={t('button_label').replace('{n}', idx + 1)}
                  className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main"
                  value={btn.label}
                  onChange={(e) => updateButton(idx, 'label', e.target.value)}
                />
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-discord-blurple transition-all no-drag text-text-main"
                    value={btn.url}
                    onChange={(e) => updateButton(idx, 'url', e.target.value)}
                  />
                  <LinkIcon className="absolute left-2.5 top-2.5 w-3 h-3 text-text-muted" />
                </div>
              </div>
            ))}

            {/* Timer */}
            <div className={clsx(
              "flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-opacity",
              timestampDisabled && "opacity-40 pointer-events-none select-none"
            )}>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-text-muted" />
                <select
                  className="bg-transparent text-xs font-medium text-text-main focus:outline-none no-drag"
                  value={formData.timerMode || 'elapsed'}
                  onChange={(e) => set('timerMode', e.target.value)}
                >
                  <option value="elapsed" className="bg-card">{t('elapsed_time')}</option>
                  <option value="countdown" className="bg-card">{t('countdown')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                {formData.timerMode === 'countdown' && (
                  <input
                    type="number" min="5" max="86400"
                    placeholder={t('seconds')}
                    className="w-16 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded px-2 py-0.5 text-[10px] no-drag text-text-main"
                    value={formData.duration || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) set('duration', Math.min(86400, Math.max(5, v)));
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => set('showTimestamp', !formData.showTimestamp)}
                  className={`w-8 h-4 rounded-full transition-colors relative no-drag ${formData.showTimestamp ? 'bg-discord-green' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.showTimestamp ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Party & Secrets */}
            <div className={clsx("transition-opacity", partyDisabled && "opacity-40 pointer-events-none select-none")}>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mt-4 italic">{t('party_secrets')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted px-1 uppercase font-bold">{t('party_details')}</label>
                  <div className="flex gap-2">
                    <input type="number" min="1" placeholder={t('party_now')}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-3 text-xs focus:border-discord-blurple no-drag text-text-main"
                      value={formData.partySize || ''}
                      onChange={(e) => set('partySize', e.target.value ? Math.max(1, parseInt(e.target.value)) : '')}
                    />
                    <input type="number" min="1" placeholder={t('party_max')}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-3 text-xs focus:border-discord-blurple no-drag text-text-main"
                      value={formData.partyMax || ''}
                      onChange={(e) => set('partyMax', e.target.value ? Math.max(1, parseInt(e.target.value)) : '')}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted px-1 uppercase font-bold">Party ID</label>
                  <input type="text" placeholder="unique-id-123"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-3 text-xs focus:border-discord-blurple no-drag text-text-main"
                    value={formData.partyId || ''}
                    onChange={(e) => set('partyId', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <input type="text" placeholder="Join Secret"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-4 text-xs focus:border-discord-green/30 no-drag text-text-main"
                  value={formData.joinSecret || ''}
                  onChange={(e) => set('joinSecret', e.target.value)}
                />
                <input type="text" placeholder="Spectate Secret"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg py-2 px-4 text-xs focus:border-discord-fuchsia/30 no-drag text-text-main"
                  value={formData.spectateSecret || ''}
                  onChange={(e) => set('spectateSecret', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Schedule section (full width) ── */}
        <div className="border-t border-black/5 dark:border-white/5 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-2 rounded-xl transition-colors',
                formData.schedule.enabled ? 'bg-discord-fuchsia/10 text-discord-fuchsia' : 'bg-white/5 text-text-muted'
              )}>
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-text-main">{t('schedule_auto')}</p>
                <p className="text-xs text-text-muted">{t('schedule_desc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSched('enabled', !formData.schedule.enabled)}
              className={`w-12 h-6 rounded-full transition-colors relative no-drag ${formData.schedule.enabled ? 'bg-discord-fuchsia' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${formData.schedule.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {formData.schedule.enabled && (
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 space-y-4 border border-black/5 dark:border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('schedule_days')}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_KEYS.map((key, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleScheduleDay(idx)}
                      className={clsx(
                        'w-9 h-9 rounded-xl text-[11px] font-bold transition-all border no-drag',
                        formData.schedule.days.includes(idx)
                          ? 'bg-discord-fuchsia text-white border-discord-fuchsia shadow-md shadow-discord-fuchsia/20'
                          : 'bg-black/5 dark:bg-white/5 text-text-muted border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20'
                      )}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('schedule_start')}</label>
                  <input
                    type="time"
                    value={formData.schedule.startTime}
                    onChange={(e) => setSched('startTime', e.target.value)}
                    className="w-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 px-3 text-sm font-mono text-text-main focus:outline-none focus:border-discord-fuchsia/50 no-drag"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('schedule_end')}</label>
                  <input
                    type="time"
                    value={formData.schedule.endTime}
                    onChange={(e) => setSched('endTime', e.target.value)}
                    className="w-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 px-3 text-sm font-mono text-text-main focus:outline-none focus:border-discord-fuchsia/50 no-drag"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Form error ── */}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-discord-red/10 border border-discord-red/20 text-discord-red text-sm">
            <X size={14} className="shrink-0" />
            {formError}
          </div>
        )}

        </fieldset>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2 border-t border-black/5 dark:border-white/5">
          {!readOnly && (
            <button
              type="submit"
              className="flex-1 bg-discord-blurple hover:bg-discord-blurple/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-discord-blurple/20 no-drag"
            >
              <Save size={18} />
              {t('save_profile')}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className={`${readOnly ? 'flex-1 bg-discord-blurple/10 text-discord-blurple hover:bg-discord-blurple/20' : 'px-6'} py-3 border border-black/5 dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all font-medium no-drag text-text-main`}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
