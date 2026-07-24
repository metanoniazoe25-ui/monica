import { Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Panel } from './Panel'
import type { SpotifyNowPlaying } from '../types'

interface SpotifyPanelProps {
  configured: boolean
  connected: boolean
  nowPlaying: SpotifyNowPlaying | null
  onConnect: () => void
  onDisconnect: () => void
  onControl: (action: 'play' | 'pause' | 'next' | 'previous') => void
}

function formatMs(ms?: number) {
  if (!ms || Number.isNaN(ms)) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SpotifyPanel({ configured, connected, nowPlaying, onConnect, onDisconnect, onControl }: SpotifyPanelProps) {
  if (!configured) {
    return (
      <Panel category="MUSIC" tag="XXXXXXXX">
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
          <Music size={22} className="text-hud-cyan/40" />
          <div className="text-[11px] text-hud-cyan/40">
            Spotify isn't configured. Add SPOTIFY_CLIENT_ID / SECRET to server/.env to enable music control.
          </div>
        </div>
      </Panel>
    )
  }

  if (!connected) {
    return (
      <Panel category="MUSIC" tag="XXXXXXXX">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Music size={22} className="text-hud-cyan/50" />
          <button
            type="button"
            onClick={onConnect}
            className="rounded border border-hud-cyan-bright bg-hud-cyan-dim/40 px-4 py-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright hover:bg-hud-cyan-dim/70"
          >
            CONNECT SPOTIFY
          </button>
        </div>
      </Panel>
    )
  }

  const progress =
    nowPlaying?.durationMs && nowPlaying.durationMs > 0
      ? Math.min(100, ((nowPlaying.progressMs ?? 0) / nowPlaying.durationMs) * 100)
      : 0

  return (
    <Panel category="MUSIC · LINKED" tag="XXXXXXXX">
      {nowPlaying?.playing && nowPlaying.track ? (
        <div className="flex gap-3">
          {nowPlaying.albumArt ? (
            <img src={nowPlaying.albumArt} alt="" className="h-14 w-14 shrink-0 rounded border border-hud-border" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-hud-border">
              <Music size={18} className="text-hud-cyan/40" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-xs font-semibold text-hud-cyan-bright">{nowPlaying.track}</div>
            <div className="truncate text-[10px] text-hud-cyan/50">{nowPlaying.artists}</div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-hud-cyan-dim/40">
              <div className="h-full rounded-full bg-hud-cyan-bright" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-0.5 flex justify-between text-[9px] text-hud-cyan/30">
              <span>{formatMs(nowPlaying.progressMs)}</span>
              <span>{formatMs(nowPlaying.durationMs)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-2 text-center text-[11px] text-hud-cyan/40">Nothing playing right now</div>
      )}

      <div className="mt-3 flex items-center justify-center gap-4">
        <button type="button" onClick={() => onControl('previous')} className="text-hud-cyan/70 hover:text-hud-cyan-bright">
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={() => onControl(nowPlaying?.playing ? 'pause' : 'play')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-hud-cyan/50 text-hud-cyan-bright hover:border-hud-cyan-bright"
        >
          {nowPlaying?.playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button type="button" onClick={() => onControl('next')} className="text-hud-cyan/70 hover:text-hud-cyan-bright">
          <SkipForward size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={onDisconnect}
        className="mt-3 w-full text-center text-[9px] tracking-widest text-hud-cyan/30 hover:text-hud-cyan/60"
      >
        DISCONNECT
      </button>
    </Panel>
  )
}
