export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  ts: number
  latencyMs?: number
}

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface LogEntry {
  id: number
  time: string
  text: string
}

export type Provider = 'anthropic' | 'ollama'

export interface ToolTrace {
  tool: string
  input?: unknown
  ok: boolean
  error?: string
}

export interface SpotifyNowPlaying {
  playing: boolean
  track?: string
  artists?: string
  album?: string
  albumArt?: string | null
  progressMs?: number
  durationMs?: number
  uri?: string
}
