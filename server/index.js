import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { runAnthropicChat } from './lib/providers/anthropic.js'
import { runOllamaChat } from './lib/providers/ollama.js'
import * as spotify from './lib/spotify.js'

const PORT = process.env.PORT || 8787
const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'hermes3'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const SYSTEM_PROMPT = `You are M.O.N.I.C.A., a calm, capable AI assistant inspired by J.A.R.V.I.S.
Speak concisely and directly. You may use light, dry wit, but never at the expense of
clarity. Prefer short paragraphs or tight lists over long prose. If you don't know
something or can't verify it, say so plainly rather than guessing.

You have tools to control the user's Spotify account (search, playback, playlists).
Use them when the user asks for music. If a tool reports an error (e.g. Spotify not
connected, or no active device), relay that plainly instead of pretending it worked.`

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function resolveApiKey(req) {
  const headerKey = req.get('x-api-key')
  if (headerKey && headerKey.trim()) return headerKey.trim()
  return process.env.ANTHROPIC_API_KEY || ''
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasServerKey: Boolean(process.env.ANTHROPIC_API_KEY),
    model: DEFAULT_ANTHROPIC_MODEL,
  })
})

app.get('/api/ollama/models', async (req, res) => {
  const baseUrl = String(req.query.url || DEFAULT_OLLAMA_URL).replace(/\/$/, '')
  try {
    const upstream = await fetch(`${baseUrl}/api/tags`)
    if (!upstream.ok) throw new Error(`Ollama returned ${upstream.status}`)
    const data = await upstream.json()
    res.json({ ok: true, models: (data.models || []).map((m) => m.name) })
  } catch (err) {
    res.status(502).json({ ok: false, error: err instanceof Error ? err.message : 'Failed to reach Ollama' })
  }
})

app.post('/api/chat', async (req, res) => {
  const { messages, provider = 'anthropic', ollamaUrl, ollamaModel } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  if (provider === 'ollama') {
    try {
      const { content, trace } = await runOllamaChat({
        baseUrl: ollamaUrl || DEFAULT_OLLAMA_URL,
        model: ollamaModel || DEFAULT_OLLAMA_MODEL,
        system: SYSTEM_PROMPT,
        messages,
      })
      return res.json({ content, trace })
    } catch (err) {
      const status = (err && err.status) || 502
      return res.status(status).json({
        error: err instanceof Error ? err.message : 'Failed to reach the local Hermes/Ollama server',
      })
    }
  }

  const apiKey = resolveApiKey(req)
  if (!apiKey) {
    return res.status(200).json({
      demo: true,
      content:
        "I don't have an Anthropic API key configured yet, so I can't think for real. " +
        'Add one in Settings (top right) or set ANTHROPIC_API_KEY on the server, and I’ll be fully online.',
    })
  }

  try {
    const { content, trace } = await runAnthropicChat({
      apiKey,
      model: DEFAULT_ANTHROPIC_MODEL,
      system: SYSTEM_PROMPT,
      messages,
    })
    res.json({ content, trace })
  } catch (err) {
    console.error('chat proxy error', err)
    const status = (err && err.status) || 502
    res.status(status).json({ error: err instanceof Error ? err.message : 'Failed to reach the Anthropic API' })
  }
})

app.get('/api/spotify/status', (req, res) => {
  res.json({ configured: spotify.isConfigured(), connected: spotify.isConnected() })
})

app.get('/api/spotify/login', (req, res) => {
  if (!spotify.isConfigured()) {
    return res
      .status(400)
      .send('Spotify is not configured on the server. Set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in server/.env.')
  }
  res.redirect(spotify.buildAuthUrl())
})

app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error) {
    return res.redirect(`${FRONTEND_URL}/?spotify=error&reason=${encodeURIComponent(String(error))}`)
  }
  try {
    await spotify.handleCallback(String(code), String(state))
    res.redirect(`${FRONTEND_URL}/?spotify=connected`)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown_error'
    res.redirect(`${FRONTEND_URL}/?spotify=error&reason=${encodeURIComponent(reason)}`)
  }
})

app.post('/api/spotify/logout', (req, res) => {
  spotify.disconnect()
  res.json({ ok: true })
})

app.get('/api/spotify/now-playing', async (req, res) => {
  try {
    res.json(await spotify.nowPlaying())
  } catch (err) {
    res.status((err && err.status) || 502).json({ error: err instanceof Error ? err.message : 'Request failed' })
  }
})

const PLAYBACK_ACTIONS = {
  play: () => spotify.play(),
  pause: () => spotify.pause(),
  next: () => spotify.next(),
  previous: () => spotify.previous(),
}

app.post('/api/spotify/:action', async (req, res) => {
  const action = PLAYBACK_ACTIONS[req.params.action]
  if (!action) return res.status(404).json({ error: 'Unknown action' })
  try {
    res.json(await action())
  } catch (err) {
    res.status((err && err.status) || 502).json({ error: err instanceof Error ? err.message : 'Request failed' })
  }
})

app.listen(PORT, () => {
  console.log(`M.O.N.I.C.A. server listening on http://localhost:${PORT}`)
})
