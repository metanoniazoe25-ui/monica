import { useState } from 'react'
import { ArrowUp, Mic, MicOff } from 'lucide-react'
import type { AssistantState } from '../types'

interface VoiceBarProps {
  state: AssistantState
  listening: boolean
  supportsRecognition: boolean
  onToggleListening: () => void
  onSend: (text: string) => void
}

const STATUS_TEXT: Record<AssistantState, string> = {
  idle: 'AWAITING COMMAND…',
  listening: 'LISTENING…',
  thinking: 'PROCESSING…',
  speaking: 'SPEAKING…',
  error: 'ERROR — TRY AGAIN',
}

export function VoiceBar({ state, listening, supportsRecognition, onToggleListening, onSend }: VoiceBarProps) {
  const [text, setText] = useState('')
  const active = state === 'listening' || state === 'speaking'

  const submit = () => {
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-2">
      <div className="flex h-8 items-end gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`w-1 rounded-full bg-hud-cyan ${active ? 'animate-bar' : 'opacity-30'}`}
            style={{ height: '100%', animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </div>

      <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-hud-cyan/50 bg-black/30 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggleListening}
          disabled={!supportsRecognition}
          title={supportsRecognition ? 'Toggle voice input' : 'Voice input not supported in this browser'}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-30 ${
            listening
              ? 'border-hud-cyan-bright bg-hud-cyan-dim text-hud-cyan-bright'
              : 'border-hud-cyan/40 text-hud-cyan/70 hover:border-hud-cyan-bright'
          }`}
        >
          {listening ? <Mic size={15} /> : <MicOff size={15} />}
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={STATUS_TEXT[state]}
          className="flex-1 bg-transparent text-xs tracking-widest text-hud-cyan-bright placeholder:text-hud-cyan/40 focus:outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hud-cyan/40 text-hud-cyan/70 transition hover:border-hud-cyan-bright hover:text-hud-cyan-bright disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={15} />
        </button>
      </div>
    </div>
  )
}
