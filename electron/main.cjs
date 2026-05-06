const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, Notification, dialog } = require('electron');
const path   = require('path');
const RPC    = require('discord-rpc');
const fs     = require('fs');
const crypto = require('crypto');
const os     = require('os');
const zlib   = require('zlib');
const { exec, spawn } = require('child_process');

app.setName('Discord RPC Manager');
if (process.platform === 'win32') app.setAppUserModelId('com.wen7090.discordrpc');

// ── Portable mode ─────────────────────────────────────────────────────────────
// If a "_portable" folder exists next to the exe, store all data there instead
const portableDir = path.join(path.dirname(process.execPath), '_portable');
if (fs.existsSync(portableDir)) {
  app.setPath('userData', portableDir);
  app.setPath('logs',     portableDir);
}

// ── Auto-update ───────────────────────────────────────────────────────────────
// Production: electron-updater downloads and installs silently.
// Dev: manual GitHub API check (no binary to patch in dev mode).
let autoUpdater = null;
if (app.isPackaged) {
  try {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('update-available', {
        version: info.version, current: app.getVersion(), downloadReady: false, progress: 0,
      });
    });
    autoUpdater.on('download-progress', (p) => {
      mainWindow?.webContents.send('update-progress', Math.round(p.percent));
    });
    autoUpdater.on('update-not-available', () => {
      mainWindow?.webContents.send('update-not-available');
    });
    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents.send('update-downloaded', { version: info.version });
    });
    autoUpdater.on('error', (err) => console.error('Auto-update error:', err.message));
  } catch (e) {
    console.error('electron-updater load failed:', e.message);
    autoUpdater = null;
  }
}

async function checkForUpdates() {
  if (app.isPackaged && autoUpdater) {
    autoUpdater.checkForUpdates().catch(() => {});
    return;
  }
  // Dev fallback: GitHub API check (opens release page in browser)
  try {
    const res = await fetch('https://api.github.com/repos/wen7090dev/discord-rpc-manager/releases/latest');
    if (!res.ok) return;
    const { tag_name, html_url } = await res.json();
    const latest = tag_name?.replace(/^v/, '');
    const current = app.getVersion();
    if (latest && latest !== current) {
      mainWindow?.webContents.send('update-available', {
        version: latest, url: html_url, current, downloadReady: false, devMode: true,
      });
    } else if (latest) {
      mainWindow?.webContents.send('update-not-available');
    }
  } catch {}
}

// discord-rpc's setActivity strips the `type` field — bypass it entirely
function setActivity(client, activity) {
  const timestamps = (activity.startTimestamp || activity.endTimestamp) ? {
    start: activity.startTimestamp,
    end:   activity.endTimestamp,
  } : undefined;

  const assets = (activity.largeImageKey || activity.largeImageText || activity.smallImageKey || activity.smallImageText) ? {
    large_image: activity.largeImageKey  || undefined,
    large_text:  activity.largeImageText || undefined,
    small_image: activity.smallImageKey  || undefined,
    small_text:  activity.smallImageText || undefined,
  } : undefined;

  const party = (activity.partyId || activity.partySize || activity.partyMax) ? {
    id:   activity.partyId || undefined,
    size: (activity.partySize && activity.partyMax) ? [activity.partySize, activity.partyMax] : undefined,
  } : undefined;

  const secrets = (activity.joinSecret || activity.spectateSecret) ? {
    join:     activity.joinSecret     || undefined,
    spectate: activity.spectateSecret || undefined,
  } : undefined;

  const rpcStr = (s) => (s && s.trim().length >= 2) ? s.trim() : undefined;
  return client.request('SET_ACTIVITY', {
    pid: process.pid,
    activity: {
      type:      activity.type ?? 0,
      state:     rpcStr(activity.state),
      details:   rpcStr(activity.details),
      timestamps,
      assets,
      party,
      secrets,
      buttons:   activity.buttons   || undefined,
      instance:  !!activity.instance,
    },
  });
}

let mainWindow;
let tray = null;
let rpcClient = null;
let STORAGE_PATH;
let reconnectTimer = null;
let lastClientId = null;
let lastActivity  = null;
let intentionalStop = false; // prevents handleDisconnect from firing during clearActivity
// Serializes all RPC operations — prevents start/stop race conditions
let rpcQueue = Promise.resolve();
function enqueueRPC(fn) {
  rpcQueue = rpcQueue.then(fn).catch(() => {});
  return rpcQueue;
}

// ── Tray icon generation (pure Node.js, no external deps) ────────────────────
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) { c ^= b; for (let i = 0; i < 8; i++) c = (c & 1) ? (c >>> 1) ^ 0xedb88320 : c >>> 1; }
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}
function makeCircleIcon(r, g, b) {
  const S = 32, cx = 15.5, cy = 15.5, radius = 12;
  const raw = Buffer.alloc(S * (1 + S * 4), 0);
  for (let y = 0; y < S; y++) {
    raw[y * (1 + S * 4)] = 0;
    for (let x = 0; x < S; x++) {
      if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= radius) {
        const o = y * (1 + S * 4) + 1 + x * 4;
        raw[o] = r; raw[o+1] = g; raw[o+2] = b; raw[o+3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13, 0);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6;
  return nativeImage.createFromBuffer(Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]));
}

let iconConnected, iconDisconnected;
function initTrayIcons() {
  iconConnected    = makeCircleIcon(87, 242, 135);
  iconDisconnected = makeCircleIcon(128, 132, 142);
}
function updateTrayIcon(status) {
  if (!tray) return;
  tray.setImage(status === 'connected' ? iconConnected : iconDisconnected);
}

// ── Media detection (cross-platform) ─────────────────────────────────────────
let smtcProcess    = null;
let smtcScriptPath = null;
let lastSmtcInfo   = { title: '', artist: '', source: '' };
let smtcMissCount  = 0;
const SMTC_MISS_GRACE = 2;

function handleSmtcLine(line) {
  line = (line || '').trim();
  if (!line) return;
  if (!line.startsWith('OK|')) {
    smtcMissCount++;
    if (smtcMissCount >= SMTC_MISS_GRACE && lastSmtcInfo.title !== '') {
      lastSmtcInfo = { title: '', artist: '', source: '' };
      mainWindow?.webContents.send('smtc-update', lastSmtcInfo);
    }
    return;
  }
  smtcMissCount = 0;
  const [, title = '', artist = '', source = ''] = line.split('|');
  if (title !== lastSmtcInfo.title || artist !== lastSmtcInfo.artist) {
    lastSmtcInfo = { title, artist, source };
    mainWindow?.webContents.send('smtc-update', lastSmtcInfo);
  }
}

function attachSmtcStdout() {
  let buffer = '';
  smtcProcess.stdout.on('data', (data) => {
    buffer += data.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const l of lines) handleSmtcLine(l);
  });
}

// Windows: PowerShell + WinRT (SMTC)
const SMTC_PS = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$winrtOk = $false
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
  $load = [System.WindowsRuntimeSystemExtensions].GetMethods() |
          Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 } |
          Select-Object -First 1
  function WinAwait($op) {
    $t = $load.MakeGenericMethod($op.GetType().GenericTypeArguments[0]).Invoke($null,@($op))
    $t.Wait(-1) | Out-Null; $t.Result
  }
  $mgr = WinAwait([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync())
  $winrtOk = $true
} catch {}

while ($true) {
  $output = "NONE"
  try {
    if ($winrtOk -and $mgr) {
      $sessions = @()
      foreach ($s in $mgr.GetSessions()) { $sessions += $s }
      $cur = try { $mgr.GetCurrentSession() } catch { $null }
      if ($cur) { $sessions += $cur }

      foreach ($s in $sessions) {
        try {
          $status = [int]$s.GetPlaybackInfo().PlaybackStatus
          $src = "$($s.SourceAppUserModelId)"
          if (($status -eq 4 -or $status -eq 5) -and ($src -notmatch 'chrome|firefox|msedge|brave|opera|vivaldi')) {
            $p = WinAwait($s.TryGetMediaPropertiesAsync())
            if ($p.Title) { $output = "OK|$($p.Title)|$($p.Artist)|$src"; break }
          }
        } catch {}
      }
    }
  } catch {}

  # Spotify desktop fallback — title is "Artist - Song" when playing, "Spotify" when paused
  if ($output -eq "NONE") {
    $sp = Get-Process spotify -EA SilentlyContinue |
          Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -ne 'Spotify' } |
          Select-Object -First 1
    if ($sp -and $sp.MainWindowTitle -match '^(.+) - (.+)$') {
      $output = "OK|$($Matches[2].Trim())|$($Matches[1].Trim())|Spotify"
    }
  }

  [Console]::WriteLine($output)
  Start-Sleep -Seconds 4
}
`.trim();

function initSMTC_Win() {
  smtcScriptPath = path.join(app.getPath('userData'), 'smtc.ps1');
  fs.writeFileSync(smtcScriptPath, '﻿' + SMTC_PS, 'utf8');
  smtcProcess = spawn('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', smtcScriptPath]);
  attachSmtcStdout();
}

let playerctlStatus = 'unknown'; // 'unknown' | 'missing' | 'installed'

// Linux: MPRIS via playerctl — install: apt install playerctl / pacman -S playerctl
const LINUX_MEDIA_SH = `#!/bin/bash
while true; do
  output=$(playerctl -a metadata --format '{{status}}|{{title}}|{{artist}}|{{playerName}}' 2>/dev/null | grep -m1 '^Playing|')
  if [ -n "$output" ]; then
    IFS='|' read -r _ title artist source <<< "$output"
    echo "OK|$title|$artist|$source"
  else
    echo "NONE"
  fi
  sleep 4
done`.trim();

// Returns the first available package manager, or null if none detected
function detectPackageManager() {
  const managers = [
    { bin: 'apt-get', install: 'apt-get install -y playerctl' },
    { bin: 'dnf',     install: 'dnf install -y playerctl'     },
    { bin: 'pacman',  install: 'pacman -S --noconfirm playerctl' },
    { bin: 'zypper',  install: 'zypper install -y playerctl'  },
  ];
  for (const m of managers) {
    try { require('child_process').execSync(`which ${m.bin}`, { stdio: 'ignore' }); return m; } catch {}
  }
  return null;
}

function tryInstallPlayerctl() {
  const pm = detectPackageManager();
  if (!pm) {
    dialog.showMessageBox(mainWindow, {
      type: 'error', title: 'Installation impossible',
      message: 'Aucun gestionnaire de paquets reconnu (apt, dnf, pacman, zypper).',
      detail: 'Installez playerctl manuellement depuis votre terminal.',
      buttons: ['OK'],
    });
    return;
  }
  // pkexec opens the system graphical password prompt — no terminal needed
  exec(`pkexec ${pm.install}`, { timeout: 120000 }, (err) => {
    if (!err) {
      playerctlStatus = 'installed';
      mainWindow?.webContents.send('playerctl-status', 'installed');
      dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'playerctl installé',
        message: 'playerctl a été installé avec succès.',
        detail: 'La détection media va démarrer maintenant.',
        buttons: ['OK'],
      }).then(() => {
        if (smtcProcess) { try { smtcProcess.kill(); } catch (_) {} smtcProcess = null; }
        initSMTC_Linux();
      });
    } else {
      dialog.showMessageBox(mainWindow, {
        type: 'warning', title: 'Échec de l\'installation automatique',
        message: 'L\'installation automatique a échoué.',
        detail: `Exécutez cette commande dans un terminal :\n\nsudo ${pm.install}`,
        buttons: ['OK'],
      });
    }
  });
}

function initSMTC_Linux() {
  smtcScriptPath = path.join(app.getPath('userData'), 'media_poll.sh');
  fs.writeFileSync(smtcScriptPath, LINUX_MEDIA_SH, 'utf8');
  try { fs.chmodSync(smtcScriptPath, 0o755); } catch (_) {}
  smtcProcess = spawn('bash', [smtcScriptPath]);
  attachSmtcStdout();
}

// Check playerctl availability and prompt to install if missing.
// Called on Linux always, and in dev mode on any platform for UI preview.
function checkPlayerctl() {
  setTimeout(() => {
    exec('playerctl --version', (err) => {
      playerctlStatus = err ? 'missing' : 'installed';
      mainWindow?.webContents.send('playerctl-status', playerctlStatus);
      if (!err) return;
      dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'playerctl non installé',
        message: 'La détection media nécessite playerctl, qui n\'est pas installé.',
        detail: 'playerctl permet à l\'app de détecter la musique et les vidéos en cours de lecture.\n\nVoulez-vous l\'installer maintenant ? (Vous pouvez aussi le faire plus tard depuis les Paramètres)',
        buttons: ['Installer', 'Plus tard'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) tryInstallPlayerctl();
      });
    });
  }, 4000);
}

// macOS: AppleScript (Spotify + Apple Music) — no external dependencies needed
// pgrep guards prevent accidentally launching apps that aren't already running
const MAC_MEDIA_SH = `#!/bin/bash
while true; do
  output="NONE"
  if pgrep -x Spotify > /dev/null 2>&1; then
    state=$(osascript -e 'tell application "Spotify" to return player state as string' 2>/dev/null)
    if [ "$state" = "playing" ]; then
      title=$(osascript -e 'tell application "Spotify" to return name of current track' 2>/dev/null)
      artist=$(osascript -e 'tell application "Spotify" to return artist of current track' 2>/dev/null)
      [ -n "$title" ] && output="OK|$title|$artist|Spotify"
    fi
  fi
  if [ "$output" = "NONE" ] && pgrep -x Music > /dev/null 2>&1; then
    state=$(osascript -e 'tell application "Music" to return player state as string' 2>/dev/null)
    if [ "$state" = "playing" ]; then
      title=$(osascript -e 'tell application "Music" to return name of current track' 2>/dev/null)
      artist=$(osascript -e 'tell application "Music" to return artist of current track' 2>/dev/null)
      [ -n "$title" ] && output="OK|$title|$artist|Music"
    fi
  fi
  echo "$output"
  sleep 4
done`.trim();

function initSMTC_Mac() {
  smtcScriptPath = path.join(app.getPath('userData'), 'media_poll.sh');
  fs.writeFileSync(smtcScriptPath, MAC_MEDIA_SH, 'utf8');
  try { fs.chmodSync(smtcScriptPath, 0o755); } catch (_) {}
  smtcProcess = spawn('bash', [smtcScriptPath]);
  attachSmtcStdout();
}

function initMediaDetection() {
  if (process.platform === 'win32') initSMTC_Win();
  else if (process.platform === 'linux') initSMTC_Linux();
  else if (process.platform === 'darwin') initSMTC_Mac();
  if (process.platform === 'linux') checkPlayerctl();
}

// ── Steam ─────────────────────────────────────────────────────────────────────
let lastSteamAppId = 0;
let steamTimer     = null;

function initSteam() {
  pollSteam();
  steamTimer = setInterval(pollSteam, 6000);
}

async function getSteamAppId() {
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      exec('reg query "HKCU\\SOFTWARE\\Valve\\Steam" /v RunningAppID 2>nul', { timeout: 3000 }, (err, stdout) => {
        if (err || !stdout) return resolve(0);
        const m = stdout.match(/RunningAppID\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
        resolve(m ? parseInt(m[1], 16) : 0);
      });
    });
  }
  // Linux: ~/.steam/registry.vdf  |  macOS: ~/Library/Application Support/Steam/registry.vdf
  const vdfPath = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support', 'Steam', 'registry.vdf')
    : path.join(os.homedir(), '.steam', 'registry.vdf');
  try {
    const content = fs.readFileSync(vdfPath, 'utf8');
    const m = content.match(/"RunningAppID"\s+"(\d+)"/);
    return m ? parseInt(m[1], 10) : 0;
  } catch { return 0; }
}

async function pollSteam() {
  const appId = await getSteamAppId();
  if (appId === lastSteamAppId) return;
  lastSteamAppId = appId;
  if (appId === 0) {
    mainWindow?.webContents.send('steam-update', { appId: 0, name: '' });
    return;
  }
  try {
    const res  = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`);
    const data = await res.json();
    const name = data?.[String(appId)]?.data?.name || `Steam App ${appId}`;
    mainWindow?.webContents.send('steam-update', { appId, name });
  } catch {
    mainWindow?.webContents.send('steam-update', { appId, name: `Steam App ${appId}` });
  }
}

// ── Process monitor (auto-launch) ────────────────────────────────────────────
let processMonitorTimer = null;
let lastProcessSet = new Set();

function startProcessMonitor() {
  const check = () => {
    const cmd = process.platform === 'win32' ? 'tasklist /FO CSV /NH 2>nul' : 'ps -eo comm=';
    exec(cmd, (err, stdout) => {
      if (err) return;
      const procs = new Set(
        process.platform === 'win32'
          ? stdout.split('\n').map(l => l.split(',')[0]?.replace(/"/g, '').trim().toLowerCase()).filter(Boolean)
          : stdout.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean)
      );
      const changed = procs.size !== lastProcessSet.size ||
        [...procs].some(p => !lastProcessSet.has(p));
      if (changed) {
        lastProcessSet = procs;
        mainWindow?.webContents.send('process-update', [...procs]);
      }
    });
  };
  check();
  processMonitorTimer = setInterval(check, 5000);
}

// ── RPC client lifecycle ──────────────────────────────────────────────────────
let lastDestroyTime = 0;
const RPC_COOLDOWN_MS = 2000; // minimum gap Discord needs between disconnect and reconnect

async function waitForCooldown() {
  const elapsed = Date.now() - lastDestroyTime;
  if (elapsed < RPC_COOLDOWN_MS) await new Promise(r => setTimeout(r, RPC_COOLDOWN_MS - elapsed));
}

async function destroyClient() {
  if (!rpcClient) return;
  const c = rpcClient;
  rpcClient = null; // null immediately so no other code re-uses it
  try { await c.destroy(); } catch (e) { console.error('rpcClient.destroy failed:', e.message); }
  lastDestroyTime = Date.now();
}

// ── Auto-reconnect ────────────────────────────────────────────────────────────
function clearReconnect() {
  if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
  lastClientId = null;
  lastActivity  = null;
}
function scheduleReconnect(clientId, activity) {
  if (reconnectTimer || !clientId) return;
  lastClientId = clientId;
  lastActivity  = activity;
  reconnectTimer = setInterval(() => tryReconnect(), 10000);
}
async function tryReconnect() {
  if (rpcClient || !lastClientId) return;
  const log = (msg) => mainWindow?.webContents.send('log-message', { message: msg, type: 'info', timestamp: new Date().toLocaleTimeString() });
  log('Auto-reconnect: attempting...');
  try {
    rpcClient = new RPC.Client({ transport: 'ipc' });
    const currentClientId = lastClientId;
    const currentActivity = lastActivity;

    rpcClient.on('ready', () => {
      log('Auto-reconnect: restored!', 'success');
      if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
      mainWindow?.webContents.send('rpc-status', 'connected');
      updateTrayIcon('connected');
      setActivity(rpcClient, currentActivity).catch(() => {});
    });

    const handleDisconnect = (msg) => {
      if (!rpcClient) return;
      log(`Connection lost again ${msg} — scheduling reconnect...`);
      mainWindow?.webContents.send('rpc-status', 'disconnected');
      updateTrayIcon('disconnected');
      destroyClient();
      scheduleReconnect(currentClientId, currentActivity);
    };
    rpcClient.on('error', (err) => handleDisconnect(`(Error: ${err.message})`));
    rpcClient.on('disconnected', () => handleDisconnect('(Discord closed)'));

    await rpcClient.login({ clientId: currentClientId });
  } catch (e) {
    log(`Auto-reconnect failed: ${e.message}`);
    await destroyClient();
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────
function initStorage() {
  STORAGE_PATH = path.join(app.getPath('userData'), 'dsc-rpc-config.json');
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify({
      rpcs: [], applications: [],
      settings: { theme: 'dark', language: 'en', autoLaunch: true, firstLaunch: true, closeBehavior: 'tray' }
    }, null, 2));
  }
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function buildTrayMenu(profiles = [], labels = {}) {
  const profileItems = profiles.length > 0
    ? profiles.map(p => ({
        label: p.name,
        enabled: !!p.appId,
        click: () => mainWindow?.webContents.send('launch-profile', p.id),
      }))
    : [{ label: labels.no_profiles || 'No profiles yet', enabled: false }];

  return Menu.buildFromTemplate([
    { label: labels.show_app || 'Show App', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: labels.profiles || 'Profiles', enabled: false },
    ...profileItems,
    { type: 'separator' },
    { label: labels.stop_rpc || 'Stop RPC', click: () => {
        enqueueRPC(async () => {
          if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
          if (!rpcClient) return;
          intentionalStop = true;
          await rpcClient.clearActivity().catch(() => {});
          mainWindow?.webContents.send('rpc-status', 'disconnected');
          updateTrayIcon('disconnected');
        });
      }
    },
    { type: 'separator' },
    { label: labels.quit || 'Quit', click: () => { app.isQuiting = true; app.quit(); } },
  ]);
}

function createTray() {
  initTrayIcons();
  tray = new Tray(iconDisconnected);
  tray.setToolTip('Discord RPC Manager');
  tray.setContextMenu(buildTrayMenu());
  tray.on('double-click', () => mainWindow?.show());
}

// ── Deep link registration ────────────────────────────────────────────────────
// Register the rpcmanager:// protocol (must be called before app.ready on Windows)
if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient('rpcmanager', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('rpcmanager');
}

function handleDeepLink(url) {
  mainWindow?.webContents.send('deep-link', url);
}

// ── Window ────────────────────────────────────────────────────────────────────
function clearStaleBounds() {
  // Electron (and some libs) persist window bounds in userData.
  // Delete any such file so an old installation can't impose a tiny size.
  const candidates = [
    path.join(app.getPath('userData'), 'window-state.json'),
    path.join(app.getPath('userData'), 'window-state'),
    path.join(app.getPath('userData'), 'bounds.json'),
  ];
  for (const f of candidates) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
}

function createWindow() {
  clearStaleBounds();
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const MIN_W = 952, MIN_H = 900;

  mainWindow = new BrowserWindow({
    width: 1507, height: 900, minWidth: MIN_W, minHeight: MIN_H,
    icon: path.join(__dirname, app.isPackaged ? '../dist/icon.png' : '../public/icon.png'),
    backgroundColor: '#1a1b1e',
    // Linux: frame:false removes the WM title bar so the renderer's custom controls take over.
    // Windows/macOS: titleBarStyle:'hidden' keeps resize borders while hiding the OS title bar.
    ...(process.platform === 'linux' ? { frame: false } : { titleBarStyle: 'hidden' }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: false
    },
    show: false,
  });

  // Enforce at OS level (belt-and-suspenders alongside the constructor options)
  mainWindow.setMinimumSize(MIN_W, MIN_H);

  const enforceMinSize = () => {
    if (!mainWindow) return;
    const [w, h] = mainWindow.getSize();
    if (w < MIN_W || h < MIN_H) {
      mainWindow.setSize(Math.max(w, MIN_W), Math.max(h, MIN_H));
    }
  };

  mainWindow.once('ready-to-show', () => {
    enforceMinSize();
    mainWindow.show(); mainWindow.focus();
    mainWindow.setAlwaysOnTop(true); mainWindow.setAlwaysOnTop(false);
  });

  // Also enforce after the page finishes loading (catches post-load resizes)
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(enforceMinSize, 200);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) { event.preventDefault(); shell.openExternal(url); }
  });

  if (isDev) {
    const viteUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(viteUrl);
    mainWindow.webContents.on('did-fail-load', (_, __, ___, url) => {
      if (url.includes('5173')) mainWindow.loadURL('http://localhost:5174');
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) { event.preventDefault(); mainWindow.hide(); }
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_, argv) => {
    // Windows deep link arrives here as a CLI argument
    const url = argv.find(a => a.startsWith('rpcmanager://'));
    if (url) handleDeepLink(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show(); mainWindow.focus();
    }
  });
}

// macOS deep link
app.on('open-url', (event, url) => { event.preventDefault(); handleDeepLink(url); });

app.whenReady().then(() => {
  initStorage();
  // Repair/sync startup entry on launch (catches path changes after updates)
  try {
    const stored = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
    if (stored?.settings?.autoLaunch) {
      if (process.platform === 'linux') setLinuxAutostart(true);
      else app.setLoginItemSettings(buildLoginItemSettings(true));
    }
  } catch {}
  createWindow();
  createTray();
  startProcessMonitor();
  let _startSettings = {};
  try { _startSettings = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8')).settings || {}; } catch {}
  if (_startSettings.mediaDetectionEnabled !== false) initMediaDetection();
  if (_startSettings.steamDetectionEnabled !== false) initSteam();
  startSystemInfoPoller();
  setTimeout(checkForUpdates, 5000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

let isCleaningUp = false;
app.on('before-quit', (event) => {
  if (isCleaningUp) return;
  event.preventDefault();
  isCleaningUp = true;
  clearReconnect();
  if (smtcProcess) { try { smtcProcess.kill(); } catch (_) {} }
  clearInterval(steamTimer);
  clearInterval(processMonitorTimer);
  clearInterval(systemInfoTimer);
  if (smtcScriptPath) { try { fs.unlinkSync(smtcScriptPath); } catch (_) {} }
  (async () => {
    if (rpcClient) { try { await rpcClient.clearActivity(); } catch (_) {} }
    await destroyClient();
    app.isQuiting = true;
    app.quit();
  })();
});

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-storage', () => {
  try {
    return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  } catch {
    return { rpcs: [], applications: [], settings: {} };
  }
});

ipcMain.handle('save-storage', (_, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('save-storage failed:', e.message);
    return false;
  }
});

ipcMain.handle('start-rpc', (_, args) => enqueueRPC(async () => {
  let { clientId, activity } = args;
  const log = (msg, type = 'info') =>
    mainWindow?.webContents.send('log-message', { message: msg, type, timestamp: new Date().toLocaleTimeString() });

  if (activity?.type === 1) activity = { ...activity, type: 0 };

  // Reset here so any pending async disconnected from a prior stop is now unguarded only
  // after the queue drains — safe because rpcClient is still alive for same-app fast-path
  intentionalStop = false;

  try {
    // Check same-app BEFORE clearReconnect() which nulls lastClientId
    if (rpcClient && clientId === lastClientId) {
      log('Updating activity (same app)...');
      try {
        await setActivity(rpcClient, activity);
        lastActivity = activity;
        mainWindow?.webContents.send('rpc-status', 'connected');
        return { success: true };
      } catch (err) {
        log(`Activity error: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    }

    clearReconnect();

    if (rpcClient) {
      log('Closing previous session...');
      intentionalStop = true;
      await rpcClient.clearActivity().catch(() => {});
      await destroyClient();
      intentionalStop = false;
    }

    // Always wait for cooldown — covers stop-rpc → start-rpc queued sequences too
    await waitForCooldown();

    log(`Connecting with ID: ${clientId}...`);
    rpcClient = new RPC.Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
      log('Connected to Discord! Updating status...', 'success');
      mainWindow?.webContents.send('rpc-status', 'connected');
      updateTrayIcon('connected');
      const u = rpcClient.user;
      if (u) {
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
          : null;
        mainWindow?.webContents.send('discord-user', { id: u.id, username: u.username, avatarUrl });
      }
      setActivity(rpcClient, activity).catch(err => {
        log(`Activity error: ${err.message || err}`, 'error');
      });
    });

    const handleDisconnect = (msg) => {
      if (!rpcClient || intentionalStop) return;
      log(`Connection lost ${msg}`);
      mainWindow?.webContents.send('rpc-discord-closed');
      updateTrayIcon('disconnected');
      destroyClient();
    };
    rpcClient.on('error', (err) => handleDisconnect(`(Error: ${err.message})`));
    rpcClient.on('disconnected', () => handleDisconnect('(Discord closed)'));

    await rpcClient.login({ clientId }).catch(err => {
      throw new Error(`Discord login failed: ${err.message}. Is Discord open?`);
    });

    lastClientId = clientId; lastActivity = activity;
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    await destroyClient();
    return { success: false, error: error.message };
  }
}));

ipcMain.handle('stop-rpc', () => enqueueRPC(async () => {
  const log = (msg, type = 'info') =>
    mainWindow?.webContents.send('log-message', { message: msg, type, timestamp: new Date().toLocaleTimeString() });
  // Stop auto-reconnect timer but keep lastClientId/lastActivity for same-app fast-path
  if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
  if (!rpcClient) return false;
  try {
    log('Stopping presence...');
    intentionalStop = true;
    await rpcClient.clearActivity().catch(() => {});
    // intentionalStop stays true until the next start-rpc resets it —
    // this suppresses any async 'disconnected' event that fires after clearActivity,
    // so rpcClient stays alive for the same-app fast-path on the next start
    mainWindow?.webContents.send('rpc-status', 'disconnected');
    updateTrayIcon('disconnected');
    log('Status cleared from Discord.', 'success');
    return true;
  } catch (err) {
    intentionalStop = false;
    log(`Stop error: ${err.message}`, 'error');
    await destroyClient();
    updateTrayIcon('disconnected');
    return false;
  }
}));

ipcMain.handle('update-rpc', async (_, activity) => {
  if (activity?.type === 1) activity = { ...activity, type: 0 };
  if (rpcClient) { try { await setActivity(rpcClient, activity); return true; } catch (_) { return false; } }
  return false;
});

ipcMain.handle('get-discord-assets', async (_, appId) => {
  try {
    const res = await fetch(`https://discord.com/api/v6/oauth2/applications/${appId}/assets`, {
      headers: { 'User-Agent': 'DiscordBot (discord-rpc-manager, 1.0)' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_) {}
  return [];
});

ipcMain.handle('get-discord-app-info', async (_, appId) => {
  const urls = [
    `https://discord.com/api/v10/oauth2/applications/${appId}/rpc`,
    `https://discord.com/api/v6/oauth2/applications/${appId}/rpc`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data?.name) return data;
      }
    } catch (_) {}
  }
  return null;
});

// Returns the last known SMTC state without running PowerShell
ipcMain.handle('get-smtc', () => lastSmtcInfo);

ipcMain.handle('pause-rpc', async () => {
  if (!rpcClient) return false;
  try { await rpcClient.clearActivity().catch(() => {}); return true; } catch { return false; }
});

ipcMain.handle('resume-rpc', async () => {
  if (!rpcClient || !lastActivity) return false;
  try { await setActivity(rpcClient, lastActivity); return true; } catch { return false; }
});

// Dynamic tray profile list (called from renderer when rpcs change)
ipcMain.handle('update-tray-profiles', (_, { profiles, labels }) => {
  if (tray) tray.setContextMenu(buildTrayMenu(profiles, labels));
});

// Open URL in default browser
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

// Open bundled LICENSE in the default browser (file:// works on all platforms)
ipcMain.handle('open-license', () => {
  const licensePath = app.isPackaged
    ? path.join(process.resourcesPath, 'LICENSE.txt')
    : path.join(__dirname, '..', 'LICENSE');
  return shell.openExternal('file:///' + licensePath.replace(/\\/g, '/'));
});

// System notification
ipcMain.handle('show-notification', (_, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
});

function buildLoginItemSettings(enable) {
  // In dev, exe is electron.exe — must pass the app path as first arg so Electron knows what to load.
  const args = app.isPackaged ? ['--hidden'] : [app.getAppPath(), '--hidden'];
  return { openAtLogin: enable, path: app.getPath('exe'), args };
}

// Linux auto-launch: write/remove a .desktop file in ~/.config/autostart/
function setLinuxAutostart(enable) {
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');
  const desktopPath  = path.join(autostartDir, 'discord-rpc-manager.desktop');
  if (enable) {
    fs.mkdirSync(autostartDir, { recursive: true });
    const content = [
      '[Desktop Entry]',
      'Type=Application',
      'Version=1.0',
      'Name=Discord RPC Manager',
      `Exec=${app.getPath('exe')} --hidden`,
      'Comment=Discord Rich Presence Manager',
      'X-GNOME-Autostart-enabled=true',
    ].join('\n') + '\n';
    fs.writeFileSync(desktopPath, content, 'utf8');
  } else {
    try { fs.unlinkSync(desktopPath); } catch (_) {}
  }
}

ipcMain.handle('set-auto-launch', (_, enable) => {
  if (process.platform === 'linux') {
    try { setLinuxAutostart(enable); return true; } catch { return false; }
  }
  try {
    app.setLoginItemSettings(buildLoginItemSettings(enable));
    return true;
  } catch { return false; }
});

ipcMain.handle('reset-window-size', () => {
  if (mainWindow) { mainWindow.setSize(1200, 900); mainWindow.center(); }
});
ipcMain.handle('minimize-window', () => mainWindow?.minimize());
ipcMain.handle('close-window', (_, behavior) => {
  if (behavior === 'quit') app.quit();
  else mainWindow?.hide();
});
ipcMain.handle('focus-window', () => {
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }
});
ipcMain.handle('relaunch-app', () => { app.relaunch(); app.exit(0); });
ipcMain.handle('get-fingerprint', () => {
  const info = os.platform() + os.arch() + os.cpus().length + os.totalmem();
  return crypto.createHash('sha256').update(info).digest('hex');
});

// ── System info (CPU / RAM) ───────────────────────────────────────────────────
let prevCpuTimes = null;
let systemInfoTimer = null;
const weatherCache = new Map(); // city -> { value, expires }

function calcCpuPercent() {
  const cpus = os.cpus();
  let idleDiff = 0, totalDiff = 0;
  cpus.forEach((cpu, i) => {
    const prev = prevCpuTimes?.[i];
    Object.keys(cpu.times).forEach(k => {
      const d = cpu.times[k] - (prev?.times[k] || 0);
      totalDiff += d;
      if (k === 'idle') idleDiff += d;
    });
  });
  prevCpuTimes = cpus.map(c => ({ times: { ...c.times } }));
  return totalDiff === 0 ? 0 : Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}

function startSystemInfoPoller() {
  calcCpuPercent(); // prime baseline
  systemInfoTimer = setInterval(() => {
    const cpu = calcCpuPercent();
    const ram = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    mainWindow?.webContents.send('system-info', { cpu, ram });
  }, 4000);
}

ipcMain.handle('get-system-info', () => ({
  cpu: calcCpuPercent(),
  ram: Math.round((1 - os.freemem() / os.totalmem()) * 100),
}));

// playerctl status + install (Linux only)
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-playerctl-status', () => playerctlStatus);
ipcMain.handle('install-playerctl', () => new Promise((resolve) => {
  const pm = detectPackageManager();
  if (!pm) return resolve({ success: false, reason: 'no_pm' });
  exec(`pkexec ${pm.install}`, { timeout: 120000 }, (err) => {
    if (!err) {
      playerctlStatus = 'installed';
      mainWindow?.webContents.send('playerctl-status', 'installed');
      if (smtcProcess) { try { smtcProcess.kill(); } catch (_) {} smtcProcess = null; }
      initSMTC_Linux();
      resolve({ success: true });
    } else {
      resolve({ success: false, reason: 'install_failed', cmd: `sudo ${pm.install}` });
    }
  });
}));

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-updates', () => checkForUpdates());

ipcMain.handle('install-update', () => {
  if (autoUpdater) autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('set-media-detection', (_, enabled) => {
  if (enabled) {
    if (!smtcProcess) initMediaDetection();
  } else {
    if (smtcProcess) { try { smtcProcess.kill(); } catch (_) {} smtcProcess = null; }
    if (smtcScriptPath) { try { fs.unlinkSync(smtcScriptPath); } catch (_) {} smtcScriptPath = null; }
    lastSmtcInfo = { title: '', artist: '', source: '' };
    mainWindow?.webContents.send('smtc-update', lastSmtcInfo);
  }
});

ipcMain.handle('set-steam-detection', (_, enabled) => {
  if (enabled) {
    if (!steamTimer) initSteam();
  } else {
    if (steamTimer) { clearInterval(steamTimer); steamTimer = null; }
    lastSteamAppId = 0;
    mainWindow?.webContents.send('steam-update', { appId: 0, name: '' });
  }
});

ipcMain.handle('get-weather', async (_, city) => {
  const key = city.toLowerCase().trim();
  const now = Date.now();
  const cached = weatherCache.get(key);
  if (cached && cached.expires > now) return cached.value;
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(key)}?format=%t`, {
      headers: { 'User-Agent': 'RPC-Manager/1.0' }
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim().replace(/\+/g, '');
    weatherCache.set(key, { value: text, expires: now + 10 * 60_000 });
    return text;
  } catch { return null; }
});
