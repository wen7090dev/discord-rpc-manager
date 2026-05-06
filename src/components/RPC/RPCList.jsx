import { Trash2, Edit2, Play, Square, Pause, RotateCcw, Info, Download, Copy, Check, X, Share2, Calendar, Cpu, GripVertical, Pin, PinOff, Timer, Monitor, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import useStore from '../../store/useStore';
import clsx from 'clsx';
const ACTIVITY_LABELS = { 2: 'act_listening', 3: 'act_watching', 5: 'act_competing' };

function formatTime(seconds) {
  if (seconds < 60) return '<1m';
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function sortRPCs(arr, mode) {
  switch (mode) {
    case 'name':   return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'time':   return arr.sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));
    case 'newest': return arr.reverse();
    default:       return arr.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }
}

export function RPCList({ onEdit, onNavigateApps, viewMode = 'list', sortMode = 'default' }) {
  const {
    rpcs, applications, removeRPC, duplicateRPC, generateShareCode,
    addNotification, startRPC, stopRPC, pauseRPC, resumeRPC, activeRPC, paused, connecting, setPreviewData,
    searchQuery, folderFilter, folders, moveToFolder, t, togglePin, reorderRPCs, status
  } = useStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [dragOverId, setDragOverId]           = useState(null);
  const [folderMenuId, setFolderMenuId]       = useState(null);
  const dragId = useRef(null);

  const appMap = useMemo(() => new Map(applications.map(a => [a.id, a])), [applications]);

  const closeFolderMenu = useCallback(() => setFolderMenuId(null), []);
  useEffect(() => {
    if (!folderMenuId) return;
    window.addEventListener('click', closeFolderMenu);
    return () => window.removeEventListener('click', closeFolderMenu);
  }, [folderMenuId, closeFolderMenu]);

  const handleShare = async (e, rpc) => {
    e.stopPropagation();
    const code = await generateShareCode(rpc.id);
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      addNotification({ title: t('share'), message: t('share_copied'), type: 'success' });
    }).catch(() => {
      addNotification({ title: 'Error', message: 'Clipboard access denied', type: 'error' });
    });
  };

  const baseRPCs = folderFilter
    ? rpcs.filter(r => r.folderId === folderFilter)
    : rpcs;

  const filteredRPCs = searchQuery
    ? baseRPCs.filter(rpc =>
        rpc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpc.state?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortRPCs([...baseRPCs], sortMode);

  // Reordering works without search; folder-assign drag always works
  const canReorder = !searchQuery;

  if (rpcs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl bg-card/30">
        <Info className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-text-main font-medium text-sm">{t('no_rpc')}</p>
        <p className="text-text-muted text-xs">{t('create_first')}</p>
      </div>
    );
  }

  if (filteredRPCs.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl bg-card/30">
        <Info className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-text-main font-medium text-sm">{t('no_results').replace('{query}', searchQuery)}</p>
      </div>
    );
  }

  const noApps = applications.length === 0;

  // ── Folder picker dropdown ────────────────────────────────────────────────────
  const FolderMenu = ({ rpc, size = 13 }) => {
    if (!folders.length) return null;
    const inFolder = !!rpc.folderId;
    return (
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setFolderMenuId(folderMenuId === rpc.id ? null : rpc.id)}
          className={clsx(
            "p-1.5 rounded-lg transition-colors",
            inFolder
              ? "text-discord-blurple bg-discord-blurple/10 hover:bg-discord-blurple/20"
              : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main"
          )}
          title={t('folder_all')}
        >
          {inFolder ? <FolderOpen size={size} /> : <Folder size={size} />}
        </button>
        {folderMenuId === rpc.id && (
          <div className="absolute bottom-full mb-1 right-0 z-30 min-w-[140px] bg-card border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={() => { moveToFolder(rpc.id, null); setFolderMenuId(null); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                !rpc.folderId
                  ? "bg-discord-blurple/10 text-discord-blurple font-bold"
                  : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main"
              )}
            >
              <Folder size={11} />
              {t('folder_all')}
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => { moveToFolder(rpc.id, f.id); setFolderMenuId(null); }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                  rpc.folderId === f.id
                    ? "bg-discord-blurple/10 text-discord-blurple font-bold"
                    : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main"
                )}
              >
                <FolderOpen size={11} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Shared drag props ────────────────────────────────────────────────────────
  // Always draggable (for folder-tab drop targets); reorder drop only when not filtered
  const dragProps = (rpc) => ({
    draggable: true,
    onDragStart: (e) => { dragId.current = rpc.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/rpc-id', rpc.id); },
    onDragOver:  canReorder ? (e) => { e.preventDefault(); setDragOverId(rpc.id); } : undefined,
    onDragLeave: canReorder ? () => setDragOverId(null) : undefined,
    onDrop:      canReorder ? (e) => { e.preventDefault(); if (dragId.current && dragId.current !== rpc.id) reorderRPCs(dragId.current, rpc.id); dragId.current = null; setDragOverId(null); } : undefined,
    onDragEnd:   () => { dragId.current = null; setDragOverId(null); },
  });

  return (
    <div className="space-y-3">
      {noApps && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-discord-yellow/10 border border-discord-yellow/20 text-discord-yellow">
          <Cpu size={16} className="shrink-0" />
          <p className="text-xs font-medium flex-1">{t('no_app_linked')}</p>
          {onNavigateApps && (
            <button
              onClick={onNavigateApps}
              className="text-xs font-bold px-3 py-1 bg-discord-yellow/20 hover:bg-discord-yellow/30 rounded-lg transition-colors shrink-0"
            >
              {t('add_app_first')}
            </button>
          )}
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {filteredRPCs.map((rpc, listIdx) => {
          const isActive   = activeRPC?.id === rpc.id;
          const app        = appMap.get(rpc.applicationId);
          const hasSchedule = rpc.schedule?.enabled;
          const isDragOver = dragOverId === rpc.id;

          // ── Shared card chrome ─────────────────────────────────────────────
          const cardClass = clsx(
            "group relative glass rounded-2xl transition-all duration-200 border cursor-pointer",
            folderMenuId === rpc.id ? "z-40" : "z-10",
            isActive
              ? "border-discord-green/40 shadow-lg shadow-discord-green/10 ring-1 ring-discord-green/20"
              : rpc.system
              ? "border-discord-blurple/30 bg-discord-blurple/5 hover:border-discord-blurple/50"
              : rpc.pinned
              ? "border-yellow-400/40 hover:border-yellow-400/60"
              : "border-black/5 dark:border-white/5 hover:border-discord-blurple/30",
            isDragOver && "bg-discord-blurple/10 border-discord-blurple/40"
          );

          // ── Active dot indicator ───────────────────────────────────────────
          const isReconnecting = isActive && status === 'disconnected';
          const activeDot = isActive && (
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5 pointer-events-none z-10">
              {(!paused && !isReconnecting) && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-discord-green opacity-75" />}
              {isReconnecting && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-discord-yellow opacity-75" />}
              <span className={clsx("relative inline-flex rounded-full h-2.5 w-2.5", isReconnecting ? "bg-discord-yellow" : (paused ? "bg-discord-yellow" : "bg-discord-green"))} />
            </span>
          );

          // ── Tags row ──────────────────────────────────────────────────────
          const tags = (
            <>
              {rpc.system && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/20 shrink-0">
                  Official
                </span>
              )}
              {rpc.activityType !== undefined && rpc.activityType !== 0 && ACTIVITY_LABELS[rpc.activityType] && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-discord-blurple/10 text-discord-blurple border border-discord-blurple/10 shrink-0">
                  {t(ACTIVITY_LABELS[rpc.activityType])}
                </span>
              )}
              {hasSchedule && <Calendar size={11} className="text-discord-fuchsia shrink-0" title="Scheduled" />}
              {rpc.linkedProcess && <Monitor size={11} className="text-discord-green shrink-0" title={`Auto-launch: ${rpc.linkedProcess}`} />}
            </>
          );

          // ── Play / pause / stop controls ──────────────────────────────────
          const playControls = isActive ? (
            <>
              {isReconnecting ? (
                <div className="px-2 py-1 bg-discord-yellow/10 text-discord-yellow rounded-lg flex items-center gap-1.5 text-xs font-bold animate-pulse" title={t('reconnecting')}>
                  <Loader2 size={12} className="animate-spin" />
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); paused ? resumeRPC() : pauseRPC(); }}
                  className={clsx(
                    "p-1.5 rounded-lg transition-all",
                    paused
                      ? "bg-discord-green/10 text-discord-green hover:bg-discord-green hover:text-white"
                      : "bg-discord-yellow/10 text-discord-yellow hover:bg-discord-yellow hover:text-white"
                  )}
                  title={paused ? 'Resume (Ctrl+P)' : 'Pause (Ctrl+P)'}
                >
                  {paused ? <RotateCcw size={14} /> : <Pause size={14} fill="currentColor" />}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); stopRPC(); }}
                className="p-1.5 bg-discord-red/10 text-discord-red hover:bg-discord-red hover:text-white rounded-lg transition-all"
                title="Stop (Ctrl+S)"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </>
          ) : (
            <div className="relative group/play">
              <button
                onClick={(e) => { e.stopPropagation(); startRPC(rpc, app?.appId); }}
                disabled={!app || connecting}
                className="p-1.5 bg-discord-green/10 text-discord-green hover:bg-discord-green hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {connecting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              </button>
              {!app && (
                <div className="absolute bottom-full left-0 mb-2 w-44 p-2 bg-card border border-black/5 dark:border-white/10 text-text-main text-[10px] rounded-xl opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none leading-snug z-20 shadow-xl">
                  {t('no_app_linked')}
                </div>
              )}
            </div>
          );

          // ── Delete control ────────────────────────────────────────────────
          const deleteControl = confirmDeleteId === rpc.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); removeRPC(rpc.id); setConfirmDeleteId(null); }}
                className="p-1.5 bg-discord-red text-white rounded-lg text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
              >
                <Check size={11} /> {t('delete_confirm')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                className="p-1.5 text-text-muted hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(rpc.id); }}
              className="p-1.5 text-text-muted hover:bg-discord-red/10 hover:text-discord-red rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          );

          // ══ GRID CARD ════════════════════════════════════════════════════════
          if (viewMode === 'grid') {
            return (
              <div
                key={rpc.id}
                {...dragProps(rpc)}
                onClick={() => setPreviewData(rpc)}
                className={clsx(cardClass, "p-3 flex flex-col")}
              >
                {activeDot}

                {/* Body — grows to push action bar to bottom */}
                <div className="flex items-start gap-2.5 flex-1">
                  {/* Avatar */}
                  <div
                    className={clsx("w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5",
                      !rpc.color && (isActive ? "bg-gradient-to-br from-discord-green/20 to-discord-blurple/20 border-discord-green/20" : "bg-gradient-to-br from-discord-blurple/20 to-discord-fuchsia/20 border-black/5 dark:border-white/5"))}
                    style={rpc.color ? { background: `linear-gradient(135deg,${rpc.color}44,${rpc.color}77)`, borderColor: `${rpc.color}55` } : {}}
                  >
                    <span className="text-sm font-bold" style={{ color: rpc.color || (isActive ? '#57F287' : '#5865F2') }}>
                      {rpc.icon || rpc.name?.[0]?.toUpperCase() || 'R'}
                    </span>
                  </div>

                  {/* Text block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      <h3 className="font-semibold text-text-main text-sm truncate max-w-[120px]">{rpc.name}</h3>
                      {tags}
                    </div>
                    <p className="text-[11px] text-text-muted truncate">
                      {app ? app.name : <span className="text-discord-yellow/80">{t('no_app_linked').split('—')[0].trim()}</span>}
                      <span className="ml-1.5 opacity-30 font-mono text-[9px]">#{rpc._shortId || String(rpc.id).slice(-6)}</span>
                    </p>
                    {(rpc.description || rpc.state) && (
                      <div className="mt-1 space-y-0.5">
                        {rpc.description && <p className="text-[10px] text-text-muted/70 truncate">{rpc.description}</p>}
                        {rpc.state       && <p className="text-[10px] text-text-muted/50 truncate italic">{rpc.state}</p>}
                      </div>
                    )}
                    {rpc.totalTime > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-discord-green/10 text-discord-green border border-discord-green/20">
                          <Timer size={9} />
                          {formatTime(rpc.totalTime)} {t('active')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pin */}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(rpc.id); }}
                    className={clsx(
                      "p-1 rounded-md transition-colors shrink-0",
                      rpc.pinned
                        ? "text-yellow-400 hover:bg-yellow-400/10"
                        : "text-text-muted/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-muted"
                    )}
                    title={rpc.pinned ? t('unpin_profile') : t('pin_profile')}
                  >
                    {rpc.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                  </button>
                </div>

                {/* Action bar — always at bottom */}
                <div className="flex items-center gap-0.5 pt-2 mt-2 border-t border-black/5 dark:border-white/5">
                  {playControls}
                  <div className="flex-1" />
                  <FolderMenu rpc={rpc} size={13} />
                  <button onClick={(e) => handleShare(e, rpc)} className="p-1.5 text-text-muted hover:bg-discord-green/10 hover:text-discord-green rounded-md transition-colors" title={t('share')}>
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(rpc,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${rpc.name}-profile.json`; a.click(); URL.revokeObjectURL(url); }}
                    className="p-1.5 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main rounded-md transition-colors" title="Export JSON"
                  >
                    <Download size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); duplicateRPC(rpc.id); }} className="p-1.5 text-text-muted hover:bg-discord-blurple/10 hover:text-discord-blurple rounded-md transition-colors" title={t('duplicate')}>
                    <Copy size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(rpc); }} className="p-1.5 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main rounded-md transition-colors" title="Edit">
                    <Edit2 size={13} />
                  </button>
                  {deleteControl}
                </div>

                {listIdx < 9 && !searchQuery && !folderFilter && (
                  <span className="absolute bottom-1.5 left-2.5 text-[8px] font-mono text-text-muted/20 group-hover:text-text-muted/40 transition-colors select-none pointer-events-none">
                    Ctrl+{listIdx + 1}
                  </span>
                )}
              </div>
            );
          }

          // ══ LIST CARD ════════════════════════════════════════════════════════
          return (
            <div
              key={rpc.id}
              {...dragProps(rpc)}
              onClick={() => setPreviewData(rpc)}
              className={clsx(cardClass, "p-4")}
            >
              {/* Drag handle */}
              {!searchQuery && (
                <div
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-text-muted/30 group-hover:text-text-muted/60 cursor-grab active:cursor-grabbing transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical size={14} />
                </div>
              )}

              {/* Pinned star */}
              {rpc.pinned && (
                <span className="absolute top-2 left-6 text-[9px] font-bold text-yellow-400 select-none">★</span>
              )}

              {activeDot}

              {/* Keyboard hint */}
              {listIdx < 9 && !searchQuery && !folderFilter && (
                <span className="absolute bottom-2 left-2 text-[9px] font-mono text-text-muted/30 group-hover:text-text-muted/60 transition-colors select-none pointer-events-none">
                  Ctrl+{listIdx + 1}
                </span>
              )}

              <div className="flex items-center justify-between gap-3 pl-4">
                {/* Left: avatar + text */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={clsx("w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-all",
                      !rpc.color && (isActive ? "bg-gradient-to-br from-discord-green/20 to-discord-blurple/20 border-discord-green/20" : "bg-gradient-to-br from-discord-blurple/20 to-discord-fuchsia/20 border-black/5 dark:border-white/5"))}
                    style={rpc.color ? { background: `linear-gradient(135deg,${rpc.color}44,${rpc.color}77)`, borderColor: `${rpc.color}55` } : {}}
                  >
                    <span className="text-lg font-bold" style={{ color: rpc.color || (isActive ? '#57F287' : '#5865F2') }}>
                      {rpc.icon || rpc.name?.[0]?.toUpperCase() || 'R'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-text-main">{rpc.name}</h3>
                      {tags}
                    </div>
                    <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                      {app ? app.name : <span className="text-discord-yellow/80">{t('no_app_linked').split('—')[0].trim()}</span>}
                      <span className="ml-2 opacity-30 font-mono text-[9px]">#{rpc._shortId || String(rpc.id).slice(-6)}</span>
                    </p>
                    {(rpc.description || rpc.state) && (
                      <div className="mt-0.5 space-y-px">
                        {rpc.description && <p className="text-[11px] text-text-muted/70 truncate">{rpc.description}</p>}
                        {rpc.state       && <p className="text-[11px] text-text-muted/50 truncate italic">{rpc.state}</p>}
                      </div>
                    )}
                    {rpc.totalTime > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-discord-green/10 text-discord-green border border-discord-green/20">
                          <Timer size={10} />
                          {formatTime(rpc.totalTime)} {t('active')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(rpc.id); }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      rpc.pinned
                        ? "text-yellow-400 hover:bg-yellow-400/10"
                        : "text-text-muted/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-muted"
                    )}
                    title={rpc.pinned ? t('unpin_profile') : t('pin_profile')}
                  >
                    {rpc.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>

                  {playControls}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const blob = new Blob([JSON.stringify(rpc, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `${rpc.name}-profile.json`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                    title="Export JSON"
                  >
                    <Download size={16} />
                  </button>

                  <button
                    onClick={(e) => handleShare(e, rpc)}
                    className="p-2 text-text-muted hover:bg-discord-green/10 hover:text-discord-green rounded-lg transition-colors"
                    title={t('share')}
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(rpc); }}
                    className="p-2 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateRPC(rpc.id); }}
                    className="p-2 text-text-muted hover:bg-discord-blurple/10 hover:text-discord-blurple rounded-lg transition-colors"
                    title={t('duplicate')}
                  >
                    <Copy size={16} />
                  </button>

                  <FolderMenu rpc={rpc} size={15} />

                  {deleteControl}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
