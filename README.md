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

## Features

- **Quick Search** — Instantly find your profiles with the search bar.
- **Dynamic Dashboard** — Manage multiple Rich Presence profiles in one place.
- **Profile Rotation** — Automatically cycle through profiles on a timer.
- **Folders** — Organize your profiles into color-coded groups.
- **Templates** — Pre-configured presets for Gaming, Coding, Chill, and more.
- **Media Detection** — Auto-detect Spotify, Steam, and system media (Windows SMTC, Linux playerctl, macOS AppleScript).
- **Dynamic Variables** — Use `{artist}`, `{title}`, `{game}`, `{time}`, `{date}`, `{cpu}`, `{ram}`, `{weather:City}` in any text field.
- **Live Preview** — See exactly how your status looks before activating it.
- **Profile Sharing** — Share any profile with a compact `rpc:...` code.
- **Activity Scheduler** — Auto-activate profiles on a time and day schedule.
- **Profile Rotation** — Cycle through multiple statuses automatically.
- **Live Notifications** — Real-time updates when your status changes.
- **Activity Logs** — Console to debug and monitor RPC events.
- **Stats & Analytics** — Track total time spent on each profile.
- **Internationalization** — Full support for English, French, Spanish, and German.
- **Themes** — Light, Dark, Midnight, Ocean, Forest, Sakura.
- **Portable Mode** — Run without installation, data stored next to the executable.
- **Auto-update** — Notified instantly when a new release is available on GitHub.

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

Run on a Windows machine:

```bash
npm run build
```

Output in `dist_electron/`:

| File | Description |
|---|---|
| `Discord-RPC-Manager-Setup.exe` | NSIS installer (EN / FR / ES / DE) |
| `Discord-RPC-Manager-Portable.exe` | Portable executable, no installation needed |

### macOS

Run on a macOS machine:

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

Run on a Linux machine (or inside WSL2 with a proper Node environment):

```bash
npm run build
```

Output in `dist_electron/`:

| File | Description |
|---|---|
| `Discord-RPC-Manager-linux.AppImage` | Universal — runs on any distro |
| `Discord-RPC-Manager-linux.deb` | Debian / Ubuntu package |

### GitHub Actions (recommended for all platforms at once)

Create `.github/workflows/release.yml` with a matrix build strategy targeting `windows-latest`, `macos-latest`, and `ubuntu-latest`. Each job runs `npm run build` and uploads the artifacts to a GitHub Release. This is the simplest way to produce all binaries in one go.

---

## Portable Mode

The Windows portable build stores its data in a `_portable` folder next to the executable.
To activate portable mode on any platform, create a folder named `_portable` next to the app binary before launching — all settings and profiles will be written there instead of the user's AppData.

---

## Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Give it a name — this is what Discord shows as your activity title (e.g., `Working`, `YouTube`, `Spotify`).
3. Copy the **Application ID** from the General Information tab.
4. In the app, go to **Applications** and add your Client ID.
5. Optionally, upload images under **Rich Presence → Art Assets** to use as image keys.

---

## Dynamic Variables

You can use these placeholders in the **Details** and **State** fields of any profile:

| Variable | Description |
|---|---|
| `{time}` | Current time (HH:MM) |
| `{date}` | Current date |
| `{day}` | Day of the week |
| `{artist}` | Currently playing artist (media detection) |
| `{title}` | Currently playing track title (media detection) |
| `{game}` | Currently running Steam game (Steam detection) |
| `{cpu}` | CPU usage percentage |
| `{ram}` | RAM usage percentage |
| `{weather:CityName}` | Current temperature for the specified city |

Media and Steam detection can be enabled or disabled individually in **Settings**.

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
