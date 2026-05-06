import { useState, useEffect, useRef } from 'react';
import { StatusCard } from '../components/RPC/StatusCard';
import { RPCList } from '../components/RPC/RPCList';
import { RPCForm } from '../components/RPC/RPCForm';
import { LivePreview } from '../components/RPC/LivePreview';
import { RotatorToolbar } from '../components/RPC/RotatorToolbar';
import { TutorialModal } from '../components/Modals/TutorialModal';
import useStore from '../store/useStore';
import { Plus, HelpCircle, Download, Search, CheckCircle2, AlertCircle, Link, Unlink, LayoutList, LayoutGrid, FolderPlus, Folder, FolderOpen, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Dashboard({ onNavigateApps }) {
  const [showForm, setShowForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [editingRPC, setEditingRPC] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('rpc-view-mode') || 'list');
  const [sortMode, setSortMode] = useState(() => localStorage.getItem('rpc-sort-mode') || 'default');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const folderScrollRef = useRef(null);

  useEffect(() => {
    const reset = () => setDragOverFolderId(null);
    window.addEventListener('dragend', reset);
    return () => window.removeEventListener('dragend', reset);
  }, []);
  const { t, importShareCode, decodeShareCode, addNotification, clipboardCode, setClipboardCode,
          folders, folderFilter, setFolderFilter, addFolder, removeFolder, moveToFolder, rpcs } = useStore();

  const toggleViewMode = () => {
    const next = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(next);
    localStorage.setItem('rpc-view-mode', next);
  };

  const cycleSortMode = () => {
    const modes = ['default', 'name', 'time', 'newest'];
    const next = modes[(modes.indexOf(sortMode) + 1) % modes.length];
    setSortMode(next);
    localStorage.setItem('rpc-sort-mode', next);
  };

  const SORT_LABELS = { default: '★', name: 'A–Z', time: '⏱', newest: t('sort_newest_short') };

  // Async decode whenever the pasted code changes
  useEffect(() => {
    const trimmed = shareCode.trim();
    if (!trimmed) { setDecoded(null); return; }
    let cancelled = false;
    decodeShareCode(trimmed).then(result => {
      if (!cancelled) setDecoded(result || 'invalid');
    }).catch(() => { if (!cancelled) setDecoded('invalid'); });
    return () => { cancelled = true; };
  }, [shareCode, decodeShareCode]);

  useEffect(() => {
    if (window.electronAPI) window.electronAPI.focusWindow();
  }, []);

  // Auto-open import panel when clipboard contains a share code
  useEffect(() => {
    if (!clipboardCode) return;
    setShowImport(true);
    setShareCode(clipboardCode);
    setClipboardCode(null);
  }, [clipboardCode]);

  useEffect(() => {
    const onNewRPC = () => { if (!showForm) { setEditingRPC(null); setShowForm(true); } };
    const onEscape = (e) => { if (e.key === 'Escape' && showForm) setShowForm(false); };
    window.addEventListener('shortcut:new-rpc', onNewRPC);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('shortcut:new-rpc', onNewRPC);
      window.removeEventListener('keydown', onEscape);
    };
  }, [showForm]);

  const handleEdit = (rpc) => { setEditingRPC(rpc); setShowForm(true); };
  const handleCreate = () => { setEditingRPC(null); setShowForm(true); };

  const handleImport = async () => {
    const result = await importShareCode(shareCode.trim());
    if (!result) {
      addNotification({ title: 'Error', message: t('import_error'), type: 'error' });
      return;
    }
    setShowImport(false);
    setShareCode('');
    setDecoded(null);
    addNotification({
      title: t('share'),
      message: result.autoLinked
        ? t('import_success').replace('{count}', 1)
        : `${t('import_success').replace('{count}', 1)} — ${t('share_code_hint')}`,
      type: 'success',
    });
  };

  const isValid   = decoded && decoded !== 'invalid';
  const isInvalid = decoded === 'invalid';

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-main mb-1">{t('dashboard')}</h1>
            <p className="text-text-muted text-sm">{t('dashboard_desc')}</p>
          </div>
          <div className="flex gap-3">
            <RotatorToolbar />
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 text-text-muted hover:text-text-main rounded-2xl transition-all"
              title={t('help_tutorial')}
            >
              <HelpCircle size={22} />
            </button>
            {!showForm && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowImport(!showImport); setShareCode(''); setDecoded(null); }}
                  className={clsx(
                    "flex items-center justify-center p-2.5 rounded-2xl transition-all border shrink-0",
                    showImport
                      ? "bg-discord-green/10 border-discord-green/20 text-discord-green"
                      : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-text-muted hover:text-text-main hover:border-black/20 dark:hover:border-white/20"
                  )}
                  title={t('share')}
                >
                  <Download size={22} />
                </button>
                <button
                  onClick={handleCreate}
                  data-tour="btn-new-rpc"
                  className="group flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/90 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-discord-blurple/20"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                  {t('new_rpc')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Import Panel ── */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="glass p-5 rounded-3xl border border-discord-green/20 bg-discord-green/5 space-y-4">
                {/* Input row */}
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <Search
                      className={clsx(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                        isInvalid ? "text-discord-red" : isValid ? "text-discord-green" : "text-text-muted group-focus-within:text-discord-green"
                      )}
                      size={18}
                    />
                    <input
                      type="text"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && isValid && handleImport()}
                      placeholder={t('import_code_placeholder')}
                      autoFocus
                      className={clsx(
                        "w-full bg-black/20 border rounded-2xl py-3 pl-12 pr-4 text-text-main outline-none transition-all font-mono text-sm",
                        isInvalid ? "border-discord-red/40 focus:border-discord-red/60" :
                        isValid   ? "border-discord-green/40 focus:border-discord-green/60" :
                                    "border-black/5 dark:border-white/5 focus:border-discord-green/50"
                      )}
                    />
                    {isInvalid && (
                      <AlertCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-discord-red" />
                    )}
                    {isValid && (
                      <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-discord-green" />
                    )}
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={!isValid}
                    className="bg-discord-green hover:bg-discord-green/90 text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-discord-green/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    {t('import_profile')}
                  </button>
                </div>

                {/* Live preview card */}
                <AnimatePresence mode="wait">
                  {isValid && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex items-start gap-4"
                    >
                      {/* Avatar letter */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-discord-blurple/30 to-discord-fuchsia/30 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5">
                        <span className="text-base font-bold text-discord-blurple">
                          {decoded.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-main text-sm truncate">{decoded.name}</p>
                        {decoded.description && (
                          <p className="text-xs text-text-muted truncate">{decoded.description}</p>
                        )}
                        {decoded.state && (
                          <p className="text-xs text-text-muted truncate opacity-70">{decoded.state}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {/* App link status */}
                          {decoded.discordClientId && (
                            <span className={clsx(
                              "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              decoded._autoLinked
                                ? "bg-discord-green/10 text-discord-green border-discord-green/20"
                                : "bg-discord-yellow/10 text-discord-yellow border-discord-yellow/20"
                            )}>
                              {decoded._autoLinked ? <Link size={9} /> : <Unlink size={9} />}
                              {decoded._autoLinked
                                ? decoded._appName
                                : `App ID: ${decoded.discordClientId}`}
                            </span>
                          )}

                          {/* Buttons count */}
                          {decoded.buttons?.filter(b => b.label || b.url).length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-discord-blurple/10 text-discord-blurple border border-discord-blurple/20">
                              {decoded.buttons.filter(b => b.label || b.url).length} button{decoded.buttons.filter(b => b.label || b.url).length > 1 ? 's' : ''}
                            </span>
                          )}

                          {/* Timer */}
                          {decoded.showTimestamp && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10">
                              {decoded.timerMode === 'countdown' ? `⏱ ${decoded.duration}s` : '⏱ elapsed'}
                            </span>
                          )}
                        </div>

                        {/* Warning if app not linked */}
                        {decoded.discordClientId && !decoded._autoLinked && (
                          <p className="mt-2 text-[10px] text-discord-yellow leading-snug">
                            {t('share_code_hint')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {isInvalid && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-discord-red text-xs font-medium px-1"
                    >
                      <AlertCircle size={14} />
                      {t('import_error')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
        <StatusCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="rpc-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RPCForm initialData={editingRPC} onCancel={() => setShowForm(false)} readOnly={!!editingRPC?.system} />
                </motion.div>
              ) : (
                <motion.div
                  key="rpc-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">{t('saved_profiles_title')}</h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={cycleSortMode}
                        className="px-2 py-1 rounded-lg text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[11px] font-bold font-mono"
                        title={t('sort_order')}
                      >
                        {SORT_LABELS[sortMode]}
                      </button>
                      <button
                        onClick={toggleViewMode}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title={viewMode === 'list' ? t('view_grid') : t('view_list')}
                      >
                        {viewMode === 'list' ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Folder bar ── */}
                  {(folders.length > 0 || showNewFolder) && (
                    <div ref={folderScrollRef} className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                      <button
                        onClick={() => setFolderFilter(null)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('__none__'); }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          const rpcId = e.dataTransfer.getData('text/rpc-id');
                          if (rpcId) moveToFolder(rpcId, null);
                          setDragOverFolderId(null);
                        }}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0',
                          dragOverFolderId === '__none__'
                            ? 'bg-discord-blurple/20 border-discord-blurple text-discord-blurple scale-105'
                            : folderFilter === null
                            ? 'bg-discord-blurple text-white border-discord-blurple'
                            : 'text-text-muted border-white/5 hover:bg-white/5 hover:text-text-main'
                        )}
                      >
                        <Folder size={12} /> {t('folder_all')} {rpcs.length > 0 && <span className={clsx('text-[10px] font-mono', folderFilter === null && dragOverFolderId !== '__none__' ? 'opacity-70' : 'opacity-50')}>({rpcs.length})</span>}
                      </button>
                      {folders.map(f => {
                        const count = rpcs.filter(r => r.folderId === f.id).length;
                        return (
                        <div key={f.id} className="flex items-center gap-0.5 group shrink-0">
                          <button
                            onClick={() => setFolderFilter(folderFilter === f.id ? null : f.id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(f.id); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const rpcId = e.dataTransfer.getData('text/rpc-id');
                              if (rpcId) { moveToFolder(rpcId, f.id); setFolderFilter(f.id); }
                              setDragOverFolderId(null);
                            }}
                            className={clsx(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                              dragOverFolderId === f.id
                                ? 'bg-discord-blurple/20 border-discord-blurple text-discord-blurple scale-105'
                                : folderFilter === f.id
                                ? 'bg-discord-blurple text-white border-discord-blurple'
                                : 'text-text-muted border-white/5 hover:bg-white/5 hover:text-text-main'
                            )}
                          >
                            <FolderOpen size={12} /> {f.name}
                            {count > 0 && <span className={clsx('text-[10px] font-mono', folderFilter === f.id && dragOverFolderId !== f.id ? 'opacity-70' : 'opacity-50')}>({count})</span>}
                          </button>
                          {folderFilter === f.id && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setFolderToDelete(f);
                              }}
                              className="p-1 text-text-muted hover:text-discord-red hover:bg-discord-red/10 rounded-lg cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )})}
                      {showNewFolder ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const name = newFolderName.trim();
                            if (name) { 
                              addFolder(name); 
                              setNewFolderName(''); 
                              setShowNewFolder(false); 
                              setTimeout(() => {
                                if (folderScrollRef.current) {
                                  folderScrollRef.current.scrollTo({ left: folderScrollRef.current.scrollWidth, behavior: 'smooth' });
                                }
                              }, 50);
                            }
                          }}
                          className="flex items-center gap-1 shrink-0"
                        >
                          <input
                            autoFocus
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && (setShowNewFolder(false), setNewFolderName(''))}
                            placeholder={t('folder_name_placeholder')}
                            className="bg-black/10 dark:bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-text-main outline-none focus:border-discord-blurple/50 w-32"
                          />
                          <button type="submit" className="text-discord-blurple text-xs font-bold px-2 py-1 hover:bg-white/5 rounded-lg">OK</button>
                          <button type="button" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="text-text-muted text-xs px-1 hover:text-text-main">
                            <X size={12} />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setShowNewFolder(true);
                            setTimeout(() => {
                              if (folderScrollRef.current) {
                                folderScrollRef.current.scrollTo({ left: folderScrollRef.current.scrollWidth, behavior: 'smooth' });
                              }
                            }, 50);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-text-muted border border-dashed border-white/10 hover:border-white/20 hover:text-text-main transition-all shrink-0"
                        >
                          <FolderPlus size={12} /> {t('folder_new')}
                        </button>
                      )}
                    </div>
                  )}
                  {folders.length === 0 && !showNewFolder && (
                    <button
                      onClick={() => setShowNewFolder(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] text-text-muted border border-dashed border-white/10 hover:border-white/20 hover:text-text-main transition-all w-fit"
                    >
                      <FolderPlus size={11} /> {t('folder_new')}
                    </button>
                  )}

                  <RPCList onEdit={handleEdit} onNavigateApps={onNavigateApps} viewMode={viewMode} sortMode={sortMode} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <LivePreview />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Folder Modal */}
      <AnimatePresence>
        {folderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFolderToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm glass border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-discord-red/10 text-discord-red rounded-xl shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-main mb-1">{t('folder_delete_title')}</h3>
                  <p className="text-sm text-text-muted">
                    {t('folder_delete_prompt')} <span className="font-bold text-text-main">{folderToDelete.name}</span> ?
                    <br/><br/>
                    {t('folder_delete_note')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setFolderToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-text-main hover:bg-white/5 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    removeFolder(folderToDelete.id);
                    setFolderToDelete(null);
                    setFolderFilter(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-discord-red hover:bg-discord-red/80 transition-colors shadow-lg shadow-discord-red/20"
                >
                  {t('folder_delete_confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
