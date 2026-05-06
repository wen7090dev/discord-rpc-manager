import { create } from 'zustand';
import translations from '../config/translations';

const interpolate = (str, extra = {}) => {
  if (!str) return str;
  const now = new Date();
  return str
    .replace(/\{time\}/g,   now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    .replace(/\{date\}/g,   now.toLocaleDateString())
    .replace(/\{day\}/g,    now.toLocaleDateString(undefined, { weekday: 'long' }))
    .replace(/\{artist\}/g, extra.artist  || '')
    .replace(/\{title\}/g,  extra.title   || '')
    .replace(/\{game\}/g,   extra.game    || '')
    .replace(/\{cpu\}/g,    extra.cpu     != null ? `${extra.cpu}%`  : '{cpu}')
    .replace(/\{ram\}/g,    extra.ram     != null ? `${extra.ram}%`  : '{ram}')
    .replace(/\{weather:([^}]+)\}/gi, (_, city) => extra.weather?.[city.toLowerCase()] ?? `{weather:${city}}`);
};

// ── Share-code helpers ────────────────────────────────────────────────────────
// Short field names for compact encoding (v2 format uses these)
const SN = {
  n:'name', d:'description', s:'state', lk:'largeImageKey', lt:'largeImageText',
  sk:'smallImageKey', st:'smallImageText', at:'activityType', ts:'showTimestamp',
  tm:'timerMode', du:'duration', ps:'partySize', pm:'partyMax', pi:'partyId',
  js:'joinSecret', ss:'spectateSecret', lp:'linkedProcess', sc:'schedule',
  cl:'color', ic:'icon',
};
const NS = Object.fromEntries(Object.entries(SN).map(([s,l]) => [l,s]));

// Expand short-name payload back to full field names
export function expandPayload(p) {
  if (!p) return null;
  if (p.name) return p; // v1 (full names), pass through
  const out = {};
  Object.entries(SN).forEach(([s, l]) => { if (p[s] !== undefined) out[l] = p[s]; });
  if (Array.isArray(p.b)) out.buttons = p.b.map(b => Array.isArray(b) ? { label: b[0], url: b[1] } : b);
  // _a is either a string (just the app ID) or { i, n } object
  if (p._a) out._app = typeof p._a === 'string' ? { i: p._a } : p._a;
  return out;
}

async function compressToB64(obj) {
  const s = new CompressionStream('deflate-raw');
  const w = s.writable.getWriter();
  w.write(new TextEncoder().encode(JSON.stringify(obj)));
  w.close();
  const buf = await new Response(s.readable).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function decompressFromB64(b64) {
  try {
    const pad = b64.replace(/-/g, '+').replace(/_/g, '/');
    const fullB64 = pad.padEnd(pad.length + (4 - (pad.length % 4)) % 4, '=');
    const bytes = Uint8Array.from(atob(fullB64), c => c.charCodeAt(0));
    const s = new DecompressionStream('deflate-raw');
    const w = s.writable.getWriter();
    w.write(bytes); w.close();
    const result = await new Response(s.readable).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(result));
  } catch (err) {
    console.error('Failed to decompress share code:', err);
    return null;
  }
}

export async function rawFromCode(code) {
  if (!code) return null;
  const lower = code.toLowerCase();
  if (lower.startsWith('rpc:')) return expandPayload(await decompressFromB64(code.slice(4)));
  if (lower.startsWith('r:'))   return expandPayload(await decompressFromB64(code.slice(2)));
  return null;
}

function compactRPC(rpc, app) {
  const p = { n: rpc.name };
  ['description','state','largeImageKey','largeImageText','smallImageKey','smallImageText',
   'duration','partySize','partyMax','partyId','joinSecret','spectateSecret','schedule','color','icon'].forEach(k => {
    if (rpc[k]) p[NS[k]] = rpc[k];
  });
  if (rpc.activityType) p.at = rpc.activityType;
  if (rpc.showTimestamp) p.ts = true;
  if (rpc.timerMode && rpc.timerMode !== 'elapsed') p.tm = rpc.timerMode;
  if (rpc.linkedProcess) p.lp = rpc.linkedProcess;
  const btns = rpc.buttons?.filter(b => b.label && b.url);
  if (btns?.length) p.b = btns.map(b => [b.label, b.url]);
  if (app) p._a = { i: app.appId, n: app.name };
  return p;
}

// Persist last known Discord user so the preview works even when no profile is active
let _cachedDiscordUser = null;
try { _cachedDiscordUser = JSON.parse(localStorage.getItem('discord-user-cache') || 'null'); } catch {}

let _communityCache = { all: [], top10: [], week: [], month: [] };
try { 
  const parsed = JSON.parse(localStorage.getItem('community-cache')); 
  if (parsed && !Array.isArray(parsed)) _communityCache = parsed;
} catch {}

// ── Built-in system profile (always pinned, injected at load, never saved) ───
const SYSTEM_APP = {
  id: 'system_app_wen7090',
  appId: '994759581551042731',
  name: 'Want this custom status?',
  system: true,
};
const SYSTEM_RPC = {
  id: 'system_rpc_wen7090',
  name: 'Want this custom status?',
  applicationId: 'system_app_wen7090',
  activityType: 5,
  description: 'Download RPC APP',
  state: 'Download the app below ⬇️',
  largeImageKey: 'rpc',
  smallImageKey: 'verified',
  buttons: [{ label: 'GitHub', url: 'https://wen7090dev.github.io/index.html' }],
  icon: 'W',
  _shortId: 'x4m9kz',
  pinned: true,
  system: true,
};

let _saveTimer = null;

const useStore = create((set, get) => ({
  rpcs: [],
  applications: [],
  settings: {
    theme: 'dark',
    language: 'en',
    autoLaunch: true,
    firstLaunch: true,
    tourCompleted: false,
    closeBehavior: 'tray',
    notificationsEnabled: true,
    clipboardDetection: true,
    mediaDetectionEnabled: true,
    steamDetectionEnabled: true,
  },
  activeRPC: null,
  connecting: false,
  status: 'disconnected',
  logs: [],
  startTime: null,
  searchQuery: '',
  notifications: [],
  rotationInterval: null,
  initialized: false,
  paused: false,
  runningProcesses: [],
  mediaInfo: { title: '', artist: '', source: '' },
  steamGame: '',
  discordUser: _cachedDiscordUser,
  updateInfo: null,
  communityCache: _communityCache,
  folders: [],
  folderFilter: null,
  systemInfo: { cpu: 0, ram: 0, weather: {} },

  setCommunityCache: (list) => {
    try { localStorage.setItem('community-cache', JSON.stringify(list)); } catch {}
    set({ communityCache: list });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  checkCommunityUpdates: async () => {
    try {
      const res = await fetch('https://wen7090dev.github.io/discord-rpc/community/all_rpcs.json?t=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      
      const { communityCache, addNotification, t } = get();
      const knownCodes = new Set(communityCache.all?.map(p => p.code) || []);
      
      let newFound = false;
      data.forEach(p => {
        if (!knownCodes.has(p.code)) {
          newFound = true;
          addNotification({
            title: t('community_title'),
            message: t('new_profile_community').replace('{name}', p.name),
            type: 'info',
            action: { label: t('view_now'), onClick: () => window.dispatchEvent(new CustomEvent('navigate:community')) }
          });
        }
      });

      if (newFound) {
        get().setCommunityCache({ ...communityCache, all: data });
      }
    } catch (e) {
      console.error('Community check failed:', e);
    }
  },

  setRunningProcesses: (procs) => set({ runningProcesses: procs }),
  setMediaInfo: (info) => set({ mediaInfo: info }),
  setSteamGame: (name) => set({ steamGame: name }),

  // ── Folders ───────────────────────────────────────────────────────────────
  setFolderFilter: (id) => set({ folderFilter: id }),
  addFolder: (name, color = '#5865f2') => {
    const id = `folder_${Date.now()}`;
    set(state => ({ folders: [...state.folders, { id, name, color }] }));
    get().saveData();
    return id;
  },
  removeFolder: (id) => {
    set(state => ({
      folders: state.folders.filter(f => f.id !== id),
      rpcs: state.rpcs.map(r => r.folderId === id ? { ...r, folderId: null } : r),
      folderFilter: state.folderFilter === id ? null : state.folderFilter,
    }));
    get().saveData();
  },
  renameFolder: (id, name) => {
    set(state => ({ folders: state.folders.map(f => f.id === id ? { ...f, name } : f) }));
    get().saveData();
  },
  moveToFolder: (rpcId, folderId) => {
    set(state => ({ rpcs: state.rpcs.map(r => r.id === rpcId ? { ...r, folderId: folderId || null } : r) }));
    get().saveData();
  },

  // ── System info (CPU / RAM / Weather) ────────────────────────────────────
  setSystemInfo: (info) => set(state => ({ systemInfo: { ...state.systemInfo, ...info } })),
  setWeather: (city, value) => set(state => ({
    systemInfo: { ...state.systemInfo, weather: { ...state.systemInfo.weather, [city.toLowerCase()]: value } }
  })),
  prefetchWeather: async (text) => {
    if (!window.electronAPI?.getWeather) return;
    const cities = [...(text.matchAll(/\{weather:([^}]+)\}/gi))].map(m => m[1].toLowerCase());
    for (const city of cities) {
      const cached = get().systemInfo.weather[city];
      if (cached) continue;
      try {
        const val = await window.electronAPI.getWeather(city);
        if (val) get().setWeather(city, val);
      } catch {}
    }
  },
  setDiscordUser: (user) => {
    if (!user) return; // keep last known user visible
    try { localStorage.setItem('discord-user-cache', JSON.stringify(user)); } catch {}
    set({ discordUser: user });
  },
  resolveVars: (str) => {
    const { mediaInfo, steamGame, systemInfo } = get();
    return interpolate(str, {
      artist:  mediaInfo.artist,
      title:   mediaInfo.title,
      game:    steamGame,
      cpu:     systemInfo.cpu,
      ram:     systemInfo.ram,
      weather: systemInfo.weather,
    });
  },
  addNotification: (notif) => set((state) => ({
    notifications: [{ id: Date.now() + Math.random(), ...notif, read: false }, ...state.notifications].slice(0, 10)
  })),
  clearNotifications: () => set({ notifications: [] }),
  setPreviewData: (data) => set({ previewData: data }),

  t: (key) => {
    const lang = get().settings?.language || 'en';
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  },

  loadData: async () => {
    if (!window.electronAPI) {
      set({ initialized: true });
      return;
    }
    try {
      const data = await window.electronAPI.getStorage();
      set({
        rpcs:         [SYSTEM_RPC, ...(data.rpcs || [])],
        applications: [SYSTEM_APP, ...(data.applications || [])],
        settings: { ...get().settings, ...(data.settings || {}) },
        folders: data.folders || [],
        initialized: true
      });
    } catch {
      set({ initialized: true });
    }
  },

  saveData: () => {
    if (!window.electronAPI) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      const { rpcs, applications, settings, folders } = get();
      window.electronAPI.saveStorage({
        rpcs:         rpcs.filter(r => !r.system),
        applications: applications.filter(a => !a.system),
        settings,
        folders,
      });
      _saveTimer = null;
    }, 500);
  },

  addRPC: (rpc) => {
    const id = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    set((state) => ({ rpcs: [...state.rpcs, { ...rpc, id }] }));
    get().saveData();
  },

  updateRPC: (id, updatedRPC) => {
    set((state) => ({
      rpcs: state.rpcs.map((r) => (r.id === id ? { ...updatedRPC, id } : r))
    }));
    get().saveData();
  },

  duplicateRPC: (id) => {
    const rpc = get().rpcs.find(r => r.id === id);
    if (!rpc) return;
    const newId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    // eslint-disable-next-line no-unused-vars
    const { system, ...rpcData } = rpc;
    set((state) => ({ rpcs: [...state.rpcs, { ...rpcData, id: newId, name: `${rpc.name} (copy)`, totalTime: 0 }] }));
    get().saveData();
  },

  removeRPC: (id) => {
    set((state) => ({ rpcs: state.rpcs.filter((r) => r.id !== id) }));
    get().saveData();
  },

  importData: (importedData) => {
    // Accept { rpcs, applications, folders } object or plain rpc array (backward compat)
    let rpcArray = importedData;
    let appArray = null;
    let folderArray = null;
    if (importedData && !Array.isArray(importedData) && Array.isArray(importedData.rpcs)) {
      rpcArray = importedData.rpcs;
      appArray = Array.isArray(importedData.applications) ? importedData.applications : null;
      folderArray = Array.isArray(importedData.folders) ? importedData.folders : null;
    }
    if (!Array.isArray(rpcArray)) return false;

    // Build folder ID map: imported folder ID → local folder ID (match by name, create if missing)
    const folderIdMap = {};
    const newFolders = [];
    if (folderArray) {
      const existingFolders = get().folders;
      for (const f of folderArray) {
        const match = existingFolders.find(e => e.name === f.name);
        if (match) {
          folderIdMap[f.id] = match.id;
        } else {
          const newId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          folderIdMap[f.id] = newId;
          newFolders.push({ ...f, id: newId });
        }
      }
    }

    const newRPCs = rpcArray.map(rpc => ({
      ...rpc,
      id: `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      folderId: rpc.folderId ? (folderIdMap[rpc.folderId] ?? null) : null,
    }));

    set((state) => {
      const next = { rpcs: [...state.rpcs, ...newRPCs] };
      if (appArray) {
        const existingAppIds = new Set(state.applications.map(a => a.appId));
        const newApps = appArray.filter(a => !existingAppIds.has(a.appId)).map(a => ({ ...a, id: Date.now() + Math.random() }));
        next.applications = [...state.applications, ...newApps];
      }
      if (newFolders.length) next.folders = [...state.folders, ...newFolders];
      return next;
    });
    get().saveData();
    return newRPCs.length;
  },

  togglePin: (id) => {
    set(state => ({ rpcs: state.rpcs.map(r => r.id === id ? { ...r, pinned: !r.pinned } : r) }));
    get().saveData();
  },

  reorderRPCs: (fromId, toId) => {
    set(state => {
      const arr = [...state.rpcs];
      const from = arr.findIndex(r => r.id === fromId);
      const to   = arr.findIndex(r => r.id === toId);
      if (from === -1 || to === -1) return state;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { rpcs: arr };
    });
    get().saveData();
  },

  addApplication: (app) => {
    if (get().applications.some(a => a.appId === app.appId)) return false;
    set((state) => ({ applications: [...state.applications, { ...app, id: Date.now() }] }));
    get().saveData();
    return true;
  },

  removeApplication: (id) => {
    set((state) => ({ applications: state.applications.filter((a) => a.id !== id) }));
    get().saveData();
  },

  setStatus: (status) => set({ status }),

  addLog: (message) => set((state) => ({
    logs: [{ _id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), message }, ...state.logs].slice(0, 100)
  })),
  clearLogs: () => set({ logs: [] }),

  updateActiveRPCMedia: () => {
    const { activeRPC, mediaInfo, steamGame, systemInfo, startTime, paused } = get();
    if (!activeRPC || !window.electronAPI || paused) return;
    const uses = (s) => s && (s.includes('{artist}') || s.includes('{title}') || s.includes('{game}') || s.includes('{cpu}') || s.includes('{ram}') || s.includes('{weather:'));
    if (!uses(activeRPC.description) && !uses(activeRPC.state)) return;
    const extra = { artist: mediaInfo.artist, title: mediaInfo.title, game: steamGame, cpu: systemInfo.cpu, ram: systemInfo.ram, weather: systemInfo.weather };
    const type  = Number(activeRPC.activityType ?? 0);
    const rpcStr = (s) => { const v = interpolate(s, extra)?.trim(); return (v && v.length >= 2) ? v : undefined; };
    window.electronAPI.updateRPC({
      type,
      details: rpcStr(activeRPC.description),
      state:   rpcStr(activeRPC.state),
      largeImageKey:  activeRPC.largeImageKey  || undefined,
      largeImageText: activeRPC.largeImageText || undefined,
      smallImageKey:  activeRPC.smallImageKey  || undefined,
      smallImageText: activeRPC.smallImageText || undefined,
      buttons: activeRPC.buttons?.filter(b => b.label && b.url).map(b => ({ label: b.label, url: b.url })) || undefined,
      startTimestamp: (activeRPC.showTimestamp && type !== 5 && activeRPC.timerMode !== 'countdown' && startTime)
        ? Math.floor(startTime) : undefined,
      endTimestamp: (activeRPC.showTimestamp && type !== 5 && activeRPC.timerMode === 'countdown' && activeRPC.duration && startTime)
        ? Math.floor(startTime + parseInt(activeRPC.duration) * 1000) : undefined,
    });
  },

  startRPC: async (rpc, appId) => {
    if (!window.electronAPI) return;
    if (get().connecting) return;
    set({ connecting: true });
    get().addLog(`Pushing RPC update for ${appId}...`);
    const { mediaInfo, steamGame } = get();
    // Pre-fetch weather for any {weather:City} vars in this RPC
    const allText = [rpc.description, rpc.state, rpc.largeImageText, rpc.smallImageText].filter(Boolean).join(' ');
    if (allText.includes('{weather:')) await get().prefetchWeather(allText);
    const { systemInfo } = get(); // read after prefetch so weather is populated
    const extra = { artist: mediaInfo.artist, title: mediaInfo.title, game: steamGame, cpu: systemInfo.cpu, ram: systemInfo.ram, weather: systemInfo.weather };
    // Discord requires details/state to be ≥2 chars if present
    const rpcStr = (s) => { const v = interpolate(s, extra)?.trim(); return (v && v.length >= 2) ? v : undefined; };

    const activity = {
      type: Number(rpc.activityType ?? 0),
      details: rpcStr(rpc.description),
      state:   rpcStr(rpc.state),
      largeImageKey:  rpc.largeImageKey  || undefined,
      largeImageText: rpc.largeImageText || undefined,
      smallImageKey:  rpc.smallImageKey  || undefined,
      smallImageText: rpc.smallImageText || undefined,
      buttons: rpc.buttons?.filter(b => b.label && b.url).map(b => ({ label: b.label, url: b.url })) || undefined,
      partyId:        rpc.partyId        || undefined,
      partySize:      rpc.partySize  ? parseInt(rpc.partySize)  : undefined,
      partyMax:       rpc.partyMax   ? parseInt(rpc.partyMax)   : undefined,
      joinSecret:     rpc.joinSecret     || undefined,
      spectateSecret: rpc.spectateSecret || undefined,
      instance: true,
    };
    if (activity.buttons?.length === 0) delete activity.buttons;

    const now = Date.now();
    // Timestamp — not supported for Competing (type 5)
    if (rpc.showTimestamp && activity.type !== 5) {
      if (rpc.timerMode === 'countdown' && rpc.duration) {
        activity.endTimestamp = Math.floor(now + parseInt(rpc.duration) * 1000);
      } else {
        activity.startTimestamp = Math.floor(now);
      }
    }

    // Party & secrets — only supported for Playing (type 0)
    if (activity.type !== 0) {
      delete activity.partyId;
      delete activity.partySize;
      delete activity.partyMax;
      delete activity.joinSecret;
      delete activity.spectateSecret;
    }

    let result;
    try {
      result = await window.electronAPI.startRPC({ clientId: appId, activity });
    } catch (err) {
      get().addLog(`RPC Error: ${err.message}`);
      set({ connecting: false });
      return;
    }
    set({ connecting: false });
    if (result.success) {
      set({ activeRPC: rpc, startTime: now, paused: false });
      get().addNotification({
        title: get().t('rpc_active_title'),
        message: get().t('rpc_active_msg').replace('{name}', rpc.name),
        type: 'success'
      });
      // Sync fresh SMTC data then push an update so {artist}/{title}/{game} resolve correctly
      const usesMedia = [rpc.description, rpc.state].some(
        s => s && (s.includes('{artist}') || s.includes('{title}') || s.includes('{game}'))
      );
      if (usesMedia) {
        window.electronAPI.getSMTC?.().then(info => {
          if (info?.title || info?.artist) get().setMediaInfo(info);
          get().updateActiveRPCMedia();
        }).catch(() => get().updateActiveRPCMedia());
      }
    } else {
      get().addLog(`RPC Error: ${result.error}`);
      if (get().settings.notificationsEnabled) {
        window.electronAPI.showNotification?.(get().t('conn_error_title'), result.error);
      }
    }
  },

  stopRPC: async () => {
    const { activeRPC: current, startTime: st } = get();
    if (!current) return; // already stopped — prevents double-click accumulation
    get().stopRotation();
    // Clear immediately + set cooldown so Play is blocked during the stop + buffer after
    set({ activeRPC: null, startTime: null, paused: false });
    if (st) {
      const elapsed = Math.floor((Date.now() - st) / 1000);
      set(state => ({
        rpcs: state.rpcs.map(r => r.id === current.id ? { ...r, totalTime: (r.totalTime || 0) + elapsed } : r)
      }));
    }
    if (window.electronAPI) {
      await window.electronAPI.stopRPC();
      set({ status: 'disconnected' });
      get().saveData();
    }
  },

  // Called when Discord closes on its own (not triggered by the user)
  handleUnexpectedDisconnect: () => {
    const { activeRPC: current, startTime: st } = get();
    if (!current) return;
    get().stopRotation();
    const elapsed = st ? Math.floor((Date.now() - st) / 1000) : 0;
    set(state => ({
      activeRPC: null,
      startTime: null,
      paused: false,
      status: 'disconnected',
      rpcs: elapsed > 0
        ? state.rpcs.map(r => r.id === current.id ? { ...r, totalTime: (r.totalTime || 0) + elapsed } : r)
        : state.rpcs,
    }));
    get().saveData();
  },

  pauseRPC: async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.pauseRPC?.();
    set({ paused: true });
  },

  resumeRPC: async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.resumeRPC?.();
    set({ paused: false });
  },

  startRotation: (rpcIds, intervalSeconds, mode = 'loop') => {
    get().stopRotation();
    get().addLog(`Starting rotation (${intervalSeconds}s, mode: ${mode})...`);
    let index = 0;
    const play = () => {
      const { rpcs, applications } = get();
      const nextRpc = rpcs.find(r => r.id === rpcIds[index]);
      const app = applications.find(a => a.id === nextRpc?.applicationId);
      if (nextRpc && app) get().startRPC(nextRpc, app.appId);
    };
    play();
    const intervalId = setInterval(() => {
      index++;
      if (mode === 'once' && index >= rpcIds.length) {
        clearInterval(intervalId);
        set({ rotationInterval: null });
        get().addLog('Sequence completed.');
        return;
      }
      index = index % rpcIds.length;
      play();
    }, intervalSeconds * 1000);
    set({ rotationInterval: intervalId });
  },

  stopRotation: () => {
    const { rotationInterval } = get();
    if (rotationInterval) { clearInterval(rotationInterval); set({ rotationInterval: null }); }
  },

  clipboardCode: null,
  setClipboardCode: (code) => set({ clipboardCode: code }),

  generateShareCode: async (id) => {
    const rpc = get().rpcs.find(r => r.id === id);
    if (!rpc) return null;
    const app = get().applications.find(a => a.id === rpc.applicationId);
    try {
      const b64 = await compressToB64(compactRPC(rpc, app));
      return 'rpc:' + b64;
    } catch { return null; }
  },

  decodeShareCode: async (code) => {
    if (!code) return null;
    try {
      const raw = await rawFromCode(code);
      if (!raw?.name) return null;
      const appData = raw._app || (raw.discordClientId ? { i: raw.discordClientId, n: raw.discordAppName } : null);
      const existingApp = appData?.i ? get().applications.find(a => a.appId === appData.i) : null;
      return { ...raw, discordClientId: appData?.i || null, _autoLinked: !!existingApp, _appName: existingApp?.name || appData?.n || null };
    } catch { return null; }
  },

  importShareCode: async (code) => {
    if (!code) return false;
    try {
      const raw = await rawFromCode(code);
      if (!raw?.name) return false;

      const appData = raw._app || (raw.discordClientId ? { i: raw.discordClientId, n: raw.discordAppName } : null);
      let applicationId = '';
      if (appData?.i) {
        let existingApp = get().applications.find(a => a.appId === appData.i);
        if (!existingApp) {
          let appName = appData.n || appData.i;
          try {
            const info = await window.electronAPI?.getDiscordAppInfo?.(appData.i);
            if (info?.name) appName = info.name;
          } catch {}
          const newApp = { name: appName, appId: appData.i, id: Date.now() + Math.random() };
          set(state => ({ applications: [...state.applications, newApp] }));
          existingApp = newApp;
        }
        applicationId = existingApp.id;
      }

      const { _app, discordClientId, discordAppName, ...rpcPayload } = raw;
      const newId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      set(state => ({ rpcs: [...state.rpcs, { ...rpcPayload, id: newId, applicationId, originalCode: code }] }));
      get().saveData();
      return { success: true, autoLinked: !!applicationId, discordClientId: appData?.i, discordAppName: appData?.n };
    } catch { return false; }
  },
}));

export default useStore;
