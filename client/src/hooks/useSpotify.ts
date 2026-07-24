import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpotifyNowPlaying } from '../types'

interface SpotifyStatus {
  configured: boolean
  connected: boolean
}

export function useSpotify(pushLog?: (text: string) => void) {
  const [status, setStatus] = useState<SpotifyStatus>({ configured: false, connected: false })
  const [nowPlaying, setNowPlaying] = useState<SpotifyNowPlaying | null>(null)
  const pushLogRef = useRef(pushLog)
  pushLogRef.current = pushLog

  const refreshStatus = useCallback(() => {
    fetch('/api/spotify/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('spotify')
    if (!result) return

    if (result === 'connected') {
      pushLogRef.current?.('Spotify connected')
      refreshStatus()
    } else if (result === 'error') {
      pushLogRef.current?.(`Spotify connection failed: ${params.get('reason') || 'unknown error'}`)
    }

    params.delete('spotify')
    params.delete('reason')
    const query = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''))
  }, [refreshStatus])

  useEffect(() => {
    if (!status.connected) {
      setNowPlaying(null)
      return
    }
    let cancelled = false
    const poll = () => {
      fetch('/api/spotify/now-playing')
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setNowPlaying(d)
        })
        .catch(() => {})
    }
    poll()
    const interval = setInterval(poll, 8000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [status.connected])

  const connect = useCallback(() => {
    window.location.href = '/api/spotify/login'
  }, [])

  const disconnect = useCallback(() => {
    fetch('/api/spotify/logout', { method: 'POST' })
      .then(() => {
        setStatus((s) => ({ ...s, connected: false }))
        setNowPlaying(null)
        pushLogRef.current?.('Spotify disconnected')
      })
      .catch(() => {})
  }, [])

  return { status, nowPlaying, connect, disconnect, refreshStatus }
}
