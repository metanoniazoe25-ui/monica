import { useEffect, useRef } from 'react'
import { Panel } from './Panel'
import type { ChatMessage } from '../types'

export function TerminalPanel({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <Panel category="ROOT@MONICA" tag="XXXXXXX" className="flex-1" bodyClassName="min-h-0">
      <div className="h-full max-h-56 space-y-2.5 overflow-y-auto pr-1 text-left text-[12px] leading-relaxed">
        {messages.length === 0 && (
          <div className="text-hud-cyan/30">
            <span className="text-hud-cyan-bright">&gt;</span> monica --analyze --current-environment
            <div className="italic text-hud-cyan/25">Awaiting your first command…</div>
          </div>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id}>
              <span className="text-hud-cyan-bright">&gt;</span> <span className="text-hud-cyan/90">{m.content}</span>
            </div>
          ) : (
            <div key={m.id} className="pl-3 italic text-hud-cyan/55">
              {m.content}
              {typeof m.latencyMs === 'number' && (
                <span className="ml-2 not-italic text-hud-cyan/25">[{m.latencyMs}ms]</span>
              )}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </Panel>
  )
}
