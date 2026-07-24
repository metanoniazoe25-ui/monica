# M.O.N.I.C.A.

A JARVIS-style AI assistant: a cyan HUD dashboard with a voice/text chat
interface backed by Claude, plus panels that show real browser/session
telemetry (not scripted fake data) styled like a sci-fi command center.

- **`client/`** — React + TypeScript + Vite + Tailwind CSS v4 frontend.
  Central "core" visualization, voice input (Web Speech API
  `SpeechRecognition`), voice output (`speechSynthesis`), a live system
  log, and chat transcript.
- **`server/`** — Small Express backend that proxies chat requests to the
  Anthropic Messages API so your API key never reaches the browser's
  network tab of a third party.

## Features

- Voice or typed conversation with an AI assistant (Claude), styled as a
  JARVIS-like HUD.
- Real telemetry panels: session uptime, message/latency stats, CPU core
  count, JS heap memory, storage usage, network type/downlink, and
  secure-context status — all sourced from actual browser APIs.
- Live system log of what the assistant is actually doing (listening,
  thinking, speaking, errors) instead of decorative scripted text.
- API key can be set via a server-side `.env` **or** pasted into the
  in-app Settings panel (stored only in `localStorage`, sent to your own
  local backend).
- Graceful "demo mode" response when no API key is configured yet, so the
  UI is fully explorable before you wire up a key.

## Getting started

Requires Node.js 20+.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # optional — or skip and use the in-app Settings panel
npm run dev
```

Set `ANTHROPIC_API_KEY` in `server/.env` if you want every session to use
the same key without configuring it in the browser. The server listens on
`http://localhost:8787` by default.

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
- Click the gear icon (top right) to paste an Anthropic API key if you
  don't want to configure one server-side.
- Toggle voice output, auto-listen (start listening again automatically
  after the assistant finishes speaking), and reset the conversation from
  the status panel's control buttons.

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
