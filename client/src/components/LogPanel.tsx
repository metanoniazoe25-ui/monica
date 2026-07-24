import { useEffect, useRef } from 'react'
import { Panel } from './Panel'
import type { LogEntry } from '../types'

export function LogPanel({ log }: { log: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [log])

  return (
    <Panel category="RT-LOG" tag="XXXXXX XXXX" className="flex-1" bodyClassName="min-h-0">
      <div className="h-full max-h-56 space-y-1.5 overflow-y-auto pr-1 text-left text-[11px] leading-relaxed">
        {log.map((entry) => (
          <div key={entry.id} className="text-hud-cyan/70">
            <span className="text-hud-cyan/40">[{entry.time}]</span> {entry.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </Panel>
  )
}
