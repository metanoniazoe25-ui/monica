import crypto from 'node:crypto'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ')

// Single-user local app: one in-memory token set and one pending auth attempt at a time.
let tokenStore = null
let pendingAuth = null

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getClientConfig() {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8787/api/spotify/callback',
  }
}

export function isConfigured() {
  const { clientId, clientSecret } = getClientConfig()
  return Boolean(clientId && clientSecret)
}

export function isConnected() {
  return Boolean(tokenStore?.refreshToken)
}

export function disconnect() {
  tokenStore = null
}

export function buildAuthUrl() {
  const { clientId, redirectUri } = getClientConfig()
  const codeVerifier = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest())
  const state = base64url(crypto.randomBytes(16))
  pendingAuth = { state, codeVerifier }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`
}

export async function handleCallback(code, state) {
  if (!pendingAuth || state !== pendingAuth.state) {
    throw new Error('Invalid or expired Spotify auth state — try connecting again.')
  }
  const { clientId, clientSecret, redirectUri } = getClientConfig()
  const verifier = pendingAuth.codeVerifier
  pendingAuth = null

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Failed to exchange Spotify authorization code')

  tokenStore = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

async function refreshIfNeeded() {
  if (!tokenStore) {
    throw new Error('Spotify is not connected. Connect it from Settings first.')
  }
  if (Date.now() < tokenStore.expiresAt - 30_000) return

  const { clientId, clientSecret } = getClientConfig()
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokenStore.refreshToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh Spotify token')

  tokenStore.accessToken = data.access_token
  tokenStore.expiresAt = Date.now() + data.expires_in * 1000
  if (data.refresh_token) tokenStore.refreshToken = data.refresh_token
}

async function spotifyFetch(path, options = {}) {
  await refreshIfNeeded()
  const res = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), authorization: `Bearer ${tokenStore.accessToken}` },
  })
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const error = new Error(data?.error?.message || `Spotify API error (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

async function playbackAction(path, options) {
  try {
    return await spotifyFetch(path, options)
  } catch (err) {
    if (err instanceof Error && 'status' in err && err.status === 404) {
      throw new Error('No active Spotify device — open Spotify on a device first, then try again.')
    }
    throw err
  }
}

export async function getProfile() {
  return spotifyFetch('/me')
}

export async function search(query, type = 'track', limit = 5) {
  const params = new URLSearchParams({ q: query, type, limit: String(limit) })
  const data = await spotifyFetch(`/search?${params.toString()}`)
  const items = data?.[`${type}s`]?.items || []
  return items.map((item) => ({
    name: item.name,
    uri: item.uri,
    artists: item.artists?.map((a) => a.name).join(', '),
    album: item.album?.name,
    url: item.external_urls?.spotify,
  }))
}

export async function nowPlaying() {
  const data = await spotifyFetch('/me/player/currently-playing')
  if (!data || !data.item) return { playing: false }
  return {
    playing: data.is_playing,
    track: data.item.name,
    artists: data.item.artists?.map((a) => a.name).join(', '),
    album: data.item.album?.name,
    albumArt: data.item.album?.images?.[0]?.url ?? null,
    progressMs: data.progress_ms,
    durationMs: data.item.duration_ms,
    uri: data.item.uri,
  }
}

export async function play(uri) {
  const body = uri ? (uri.includes(':track:') ? { uris: [uri] } : { context_uri: uri }) : undefined
  await playbackAction('/me/player/play', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { ok: true }
}

export async function pause() {
  await playbackAction('/me/player/pause', { method: 'PUT' })
  return { ok: true }
}

export async function next() {
  await playbackAction('/me/player/next', { method: 'POST' })
  return { ok: true }
}

export async function previous() {
  await playbackAction('/me/player/previous', { method: 'POST' })
  return { ok: true }
}

export async function createPlaylist(name, trackQueries = []) {
  const me = await getProfile()
  const playlist = await spotifyFetch(`/users/${me.id}/playlists`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, description: 'Created by M.O.N.I.C.A.', public: false }),
  })

  const uris = []
  for (const q of trackQueries) {
    if (typeof q === 'string' && q.startsWith('spotify:track:')) {
      uris.push(q)
      continue
    }
    const [top] = await search(q, 'track', 1)
    if (top) uris.push(top.uri)
  }

  if (uris.length) {
    await spotifyFetch(`/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uris }),
    })
  }

  return { id: playlist.id, name: playlist.name, url: playlist.external_urls?.spotify, tracksAdded: uris.length }
}
