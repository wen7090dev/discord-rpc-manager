# Discord RPC Manager

<div align="center">
  <img src="https://raw.githubusercontent.com/wen7090dev/discord-rpc-manager/main/public/logo.png" alt="Logo" width="128" height="128" />
  <p align="center">
    <strong>A modern, powerful, and easy-to-use Discord Rich Presence Manager.</strong>
  </p>
  <p align="center">
    <a href="https://github.com/wen7090dev/discord-rpc-manager/stargazers"><img src="https://img.shields.io/github/stars/wen7090dev/discord-rpc-manager?style=for-the-badge&color=5865F2" alt="Stars" /></a>
    <a href="https://wen7090dev.github.io/license/discord-rpc-manager.html"><img src="https://img.shields.io/badge/License-Custom--NC--AP-yellow?style=for-the-badge" alt="License" /></a>
    <a href="https://github.com/wen7090dev/discord-rpc-manager/releases"><img src="https://img.shields.io/github/v/release/wen7090dev/discord-rpc-manager?style=for-the-badge&color=2eb67d" alt="Version" /></a>
  </p>
</div>

---

## Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/wen7090dev/discord-rpc-manager/main/screenshots/dashboard.png" alt="Dashboard" width="700" />
  <p><em>Dashboard — manage all your Rich Presence profiles</em></p>
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/wen7090dev/discord-rpc-manager/main/screenshots/editor.png" alt="Profile Editor" width="700" />
  <p><em>Profile Editor — live preview as you type</em></p>
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/wen7090dev/discord-rpc-manager/main/screenshots/settings.png" alt="Settings" width="700" />
  <p><em>Settings — themes, language, integrations</em></p>
</div>

---

## Features

### Profile Management
- **Create, edit, duplicate, delete** Rich Presence profiles
- **Pin** favorite profiles to the top of your list
- **List & Grid views** — switch between compact list or card layout
- **Sort** by default (pinned), alphabetical, most used, or newest first
- **Real-time search** — find profiles by name, description, or state
- **Folders** — organize profiles into color-coded groups with drag & drop support

### Rich Presence Fields
- **Activity type** — Playing, Watching, Listening, Competing
- **Details & State** — the two text lines shown in Discord
- **Large & Small images** with custom hover text (uses your Discord app assets)
- **Interactive buttons** — up to 2 clickable buttons with custom label & URL
- **Timestamp** — elapsed time or countdown mode with custom duration
- **Party** — party ID, size, max, join/spectate secrets (Playing mode only)

### Dynamic Variables
Use these placeholders in any text field — they are replaced in real time:

| Variable | Description |
|---|---|
| `{time}` | Current time (HH:MM) |
| `{date}` | Current date |
| `{day}` | Day of the week |
| `{artist}` | Currently playing artist (media detection) |
| `{title}` | Currently playing track title |
| `{game}` | Currently running Steam game |
| `{cpu}` | CPU usage percentage |
| `{ram}` | RAM usage percentage |
| `{weather:CityName}` | Current temperature for the specified city |

### Live Preview
- **Real-time Discord preview** — see exactly how your status looks before activating
- Renders the activity type prefix, details, state, images, buttons, and timer
- Timestamp counter updates every second in the preview

### Profile Rotation
- **Cycle through multiple profiles** at a configurable interval (minimum 5 s)
- **Loop mode** — continuously cycle indefinitely
- **Once mode** — run the sequence once then stop
- Visual spinning indicator while rotation is active

### Scheduler
- **Auto-activate profiles** on specific days and times
- Set **start time** and **end time** per profile
- **Day selection** — pick any combination of Mon–Sun
- Profile activates and deactivates automatically (checked every 60 s)

### Process Linking
- **Link any profile to a `.exe`** — profile auto-activates when that process starts
- **Auto-stop** — profile stops when the linked process closes
- Live searchable dropdown of currently running processes

### Media Detection
Automatically fills `{artist}` and `{title}` variables:
- **Windows** — SMTC (System Media Transport Controls) via WinRT / PowerShell, with Spotify fallback
- **Linux** — `playerctl` (MPRIS protocol), supports Spotify, VLC, Rhythmbox, and all MPRIS players; in-app install button when missing
- **macOS** — AppleScript for Spotify and Apple Music

### Steam Detection
- Detects the currently running Steam game and fills `{game}`
- **Windows** — reads registry (`HKCU\SOFTWARE\Valve\Steam`)
- **Linux** — parses `~/.steam/registry.vdf`
- **macOS** — parses `~/Library/Application Support/Steam/registry.vdf`
- Game names fetched from the Steam API

### System Monitoring
- **CPU usage** (`{cpu}`) and **RAM usage** (`{ram}`) updated in real time
- Polled automatically and available anywhere in your profile text fields

### Profile Sharing
- **Share codes** — export any profile as a compact `rpc:…` string (v2 deflate compression)
- **Import panel** — paste a code to preview the profile before importing
- **Auto-link** — automatically link to an existing Discord app if the ID matches
- **Clipboard detection** — the import panel opens automatically when a share code is detected in the clipboard
- **Deep links** — `rpcmanager://import/{code}` opens and imports directly

### Community Marketplace
- Browse profiles shared by the community
- **Tabs** — All / Top 10 / Top This Week / Top This Month
- **Sort** by newest, oldest, most liked, least liked, or alphabetically
- **Search** by profile name
- One-click import with live preview before adding
- New community profiles trigger an in-app notification

### Applications
- Register your Discord Developer Portal apps by Client ID
- Auto-resolve app name from Discord
- **Asset browser** — browse and preview your uploaded art assets directly in the image key dropdowns

### Statistics & Analytics
- Total time spent across all profiles
- Per-profile time tracking with percentage bars and ranking
- Top profile badge

### Activity Logs
- Real-time terminal-style log viewer (last 100 entries)
- **Info**, **Success**, and **Error** log types with timestamps
- **Export logs** as `.txt`
- **Clear** button to wipe logs

### Tray Integration
- Tray icon changes color based on connection status (green = connected, gray = disconnected)
- **Quick-launch** any profile directly from the tray menu
- **Show / Hide** the window from the tray
- **Quit** the app from the tray

### Auto-Update
- **Background check** for new GitHub releases
- **Download progress** shown in real time
- **Changelog modal** on first launch after an update, fetching release notes from GitHub
- **One-click install & restart** when the download is ready
- Dev mode redirects to the GitHub releases page

### Notifications
- **In-app notification center** with bell icon and unread count
- Types: Info, Success, Error
- **System notifications** for Discord disconnections, auto-launch events, and community updates (can be toggled off in Settings)

### Onboarding Tour
- **Guided 5-step tour** on first launch, highlighting key UI elements
- Spotlight overlay with smart tooltip positioning
- Skip at any time with Escape

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New profile (Dashboard) |
| `Ctrl+K` | Focus search bar |
| `Ctrl+S` | Stop active RPC |
| `Ctrl+P` | Pause / Resume RPC |
| `Ctrl+1`–`Ctrl+9` | Activate profile 1–9 |
| `Escape` | Close form / dismiss tour |

### Settings
- **6 themes** — Light, Dark, Midnight, Ocean, Forest, Sakura
- **4 languages** — English, Français, Español, Deutsch
- **Auto-launch** on system boot
- **Close behavior** — minimize to tray or quit
- **Export / Import backup** — full JSON backup of all profiles, apps, folders, and settings
- **Reset all data** with confirmation
- **Privacy Policy** and **License** links
- playerctl install helper (Linux)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS, v18 or later)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Discord](https://discord.com/) installed and running on your machine
- A [Discord Application](https://discord.com/developers/applications) (free — you need its Client ID)

### Run from source

```bash
git clone https://github.com/wen7090dev/discord-rpc-manager.git
cd discord-rpc-manager
npm install
npm run electron:dev
```

The app opens at `http://localhost:5173` via Vite, then Electron wraps it automatically.

---

## Build

> **Important:** electron-builder must be run on the **target platform**. You cannot cross-compile (e.g., build a `.dmg` on Windows). Use GitHub Actions for multi-platform builds.

### Windows

```bash
npm run build
```

Output in `dist_electron/`:

| File | Description |
|---|---|
| `Discord-RPC-Manager-Setup.exe` | NSIS installer (EN / FR / ES / DE) |
| `Discord-RPC-Manager-Portable.exe` | Portable executable, no installation needed |

### macOS

```bash
npm run build
```

Output in `dist_electron/`:

| File | Description |
|---|---|
| `Discord-RPC-Manager-mac-x64.dmg` | Intel Mac installer |
| `Discord-RPC-Manager-mac-arm64.dmg` | Apple Silicon installer |
| `Discord-RPC-Manager-mac-x64.zip` | Intel Mac zip archive |
| `Discord-RPC-Manager-mac-arm64.zip` | Apple Silicon zip archive |

### Linux

```bash
npm run build
```

Output in `dist_electron/`:

| File | Description |
|---|---|
| `Discord-RPC-Manager-linux.AppImage` | Universal — runs on any distro |
| `Discord-RPC-Manager-linux.deb` | Debian / Ubuntu package |

### GitHub Actions (recommended for all platforms at once)

Push a `v*` tag to trigger the workflow. It builds Windows (NSIS + Portable), macOS (dmg x64 + arm64), and Linux (AppImage + deb) in parallel and uploads everything to a GitHub Release automatically.

---

## Portable Mode

Create a folder named `_portable` next to the executable before launching — all settings and profiles will be written there instead of the user's AppData. This works on all platforms.

---

## Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Give it a name — this is what Discord shows as your activity title.
3. Copy the **Application ID** from the General Information tab.
4. In the app, go to **Applications** and add your Client ID.
5. Optionally, upload images under **Rich Presence → Art Assets** to use as image keys.

---

## Built With

- **Electron** — Desktop app framework
- **React** — User interface
- **Vite** — Build tool
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide Icons** — Icon set
- **discord-rpc** — Discord Rich Presence IPC client
- **electron-updater** — Auto-update system

---

## Download

Get the latest release from the [Releases page](https://github.com/wen7090dev/discord-rpc-manager/releases/latest).

| Platform | File |
|---|---|
| Windows (installer) | `Discord-RPC-Manager-Setup.exe` |
| Windows (portable) | `Discord-RPC-Manager-Portable.exe` |
| macOS (Intel) | `Discord-RPC-Manager-mac-x64.dmg` |
| macOS (Apple Silicon) | `Discord-RPC-Manager-mac-arm64.dmg` |
| Linux (AppImage) | `Discord-RPC-Manager-linux.AppImage` |
| Linux (Debian) | `Discord-RPC-Manager-linux.deb` |

---

## Forking & Custom Versions

You are free to fork this project and release your own custom version, subject to the conditions in the [License](#license):

- You **must** keep the original credits to **wen7090dev** visible (Portfolio, GitHub, and Coffee links in the sidebar).
- You **must** add a visible note indicating your version is a fork (e.g., "Modified by [YourName]").
- You **may** add your own links alongside the original ones.
- You **may not** sell or monetize the software or any derivative work.
- You **must** include this license in all copies and forks.

---

## License

This project is licensed under a **Custom Non-Commercial & Attribution Protected License**.

- You MAY NOT sell or monetize this software or any derivative works.
- You MUST keep the original credits to **wen7090dev** visible in the UI.
- Modifications are allowed provided original attribution is preserved.
- Derivative works must clearly state they are modified versions of this project.

Full license: [wen7090dev.github.io/license/discord-rpc-manager.html](https://wen7090dev.github.io/license/discord-rpc-manager.html)

---

## Support

- [Buy me a coffee](https://buymeacoffee.com/wen7090)
- [Star the repo](https://github.com/wen7090dev/discord-rpc-manager)
- [Portfolio](https://wen7090dev.github.io)

Developed by **wen7090dev**
