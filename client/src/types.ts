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
