# M.O.N.I.C.A.

A JARVIS-style AI assistant: a cyan HUD dashboard with a voice/text chat
interface, real tool-use (Spotify control), a choice of AI brain (Claude
or your own locally-running Hermes model), and panels that show real
browser/session telemetry (not scripted fake data) styled like a sci-fi
command center.

- **`client/`** — React + TypeScript + Vite + Tailwind CSS v4 frontend.
  Central "core" visualization, voice input (Web Speech API
  `SpeechRecognition`), voice output (`speechSynthesis`), a live system
  log, chat transcript, and a Spotify panel.
- **`server/`** — Express backend that proxies chat to either the
  Anthropic API or a local Ollama server, runs the tool-calling loop, and
  wraps the Spotify Web API (OAuth + playback + search + playlists).

## Features

- Voice or typed conversation with an AI assistant, styled as a
  JARVIS-like HUD.
- **Two AI brains, switchable from Settings:**
  - **Claude** (Anthropic API) — needs an API key.
  - **Hermes (local)** — talks to a [Nous Research Hermes](https://github.com/NousResearch)
    model running under [Ollama](https://ollama.com) on your own machine.
    No API key, nothing leaves your machine. Settings can list the models
    you've already pulled and test the connection.
- **Spotify tool-use** — ask it to search, play/pause/skip, or build a
  playlist ("play some Daft Punk", "what's playing", "make me a playlist
  called Focus with some lo-fi"), and it calls the real Spotify Web API.
  Also works as a standalone panel with connect + transport controls +
  live now-playing.
- Real telemetry panels: session uptime, message/latency stats, CPU core
  count, JS heap memory, storage usage, network type/downlink, and
  secure-context status — all sourced from actual browser APIs.
- Live system log of what the assistant is actually doing (listening,
  thinking, speaking, tool calls, errors) instead of decorative scripted
  text.
- Claude API key can be set via a server-side `.env` **or** pasted into
  the in-app Settings panel (stored only in `localStorage`, sent to your
  own local backend).
- Graceful "demo mode" response when no Claude key is configured yet, so
  the UI is fully explorable before you wire up a key.

## Getting started

Requires Node.js 20+.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # optional — see below for what each var does
npm run dev
```

The server listens on `http://localhost:8787` by default. Nothing in
`.env` is required to start — Claude falls back to demo mode, Hermes
defaults to a stock local Ollama, and Spotify stays disabled until
configured.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). The Vite dev
server proxies `/api/*` requests to the backend on port 8787.

### 3. Talk to it

- Type in the input bar at the bottom of the core panel, or click the mic
  icon to speak (Chrome/Edge have the best `SpeechRecognition` support;
  Firefox currently doesn't support it, but typing still works everywhere).
- Click the gear icon (top right) to open Settings.

## Connecting Hermes (local, via Ollama)

1. Install [Ollama](https://ollama.com) and pull a Hermes model, e.g.:
   ```bash
   ollama pull hermes3
   ```
2. Ollama serves it automatically at `http://localhost:11434` — you don't
   need to `ollama run` it separately for the app to use it.
3. In M.O.N.I.C.A.'s Settings, switch **AI Brain** to **Hermes (local)**.
   It defaults to `http://localhost:11434`; click **TEST** to confirm the
   connection and populate the model dropdown with whatever you've pulled.
4. Hermes models are specifically tuned for tool/function calling, so
   Spotify control works the same way it does with Claude.

If Ollama isn't reachable, the app tells you plainly rather than
pretending to work — check the model dropdown error or `ollama serve`.

## Connecting Spotify

1. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. In the app's settings, add this Redirect URI:
   `http://localhost:8787/api/spotify/callback`
3. Copy the Client ID and Client Secret into `server/.env`:
   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   ```
4. Restart the backend, then click **CONNECT SPOTIFY** in the Music panel
   (or ask the assistant to play something — it'll tell you to connect
   first if you haven't).
5. Playback control (play/pause/skip) requires an active Spotify device —
   have Spotify open and playing on some device first. Search, now-playing,
   and playlist creation work regardless.

Tokens are kept in server memory only (this is a single-user local app,
not a multi-tenant deployment) — restarting the backend requires
reconnecting.

## Building for production

```bash
cd client && npm run build   # outputs client/dist
cd server && npm start       # serve /api alongside your own static hosting of client/dist
```

## Notes

- Voice recognition and speech synthesis both require browser support and
  (for recognition) microphone permission — the mic button is disabled
  automatically if `SpeechRecognition` isn't available.
- The "resources" panel reports real values the browser exposes
  (`navigator.hardwareConcurrency`, `performance.memory`,
  `navigator.storage.estimate()`, `navigator.connection`) rather than
  fabricated numbers — some fields show `n/a` in browsers that don't
  expose that API (e.g. `performance.memory` is Chromium-only).
- Tool-calling is capped at a few rounds per turn to avoid runaway loops;
  if the assistant hits the cap it says so instead of silently stopping.
