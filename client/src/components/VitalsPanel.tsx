import { Panel } from './Panel'
import { useUptime } from '../hooks/useClock'
import type { ChatMessage } from '../types'

interface VitalsPanelProps {
  messages: ChatMessage[]
  latencies: number[]
}

export function VitalsPanel({ messages, latencies }: VitalsPanelProps) {
  const uptime = useUptime()
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : null
  const max = Math.max(1, ...latencies)

  return (
    <Panel category="SESSION VITALS" tag="XxXXXXXXX">
      <div className="mb-3">
        <div className="text-[10px] tracking-widest text-hud-cyan/50">Session Uptime</div>
        <div className="text-2xl font-bold tabular-nums text-hud-cyan-bright">{uptime}</div>
      </div>

      <div className="mb-3 flex h-16 items-end gap-[3px]">
        {latencies.length === 0 && (
          <div className="flex h-full w-full items-center text-[10px] text-hud-cyan/30">
            No requests yet — response latency will plot here
          </div>
        )}
        {latencies.map((l, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-hud-cyan/70"
            style={{ height: `${Math.max(8, (l / max) * 100)}%` }}
            title={`${l} ms`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-hud-border p-2">
          <div className="text-[10px] text-hud-cyan/50">Messages</div>
          <div className="text-sm font-semibold text-hud-cyan-bright">{messages.length}</div>
        </div>
        <div className="rounded border border-hud-border p-2">
          <div className="text-[10px] text-hud-cyan/50">Avg Latency</div>
          <div className="text-sm font-semibold text-hud-cyan-bright">
            {avgLatency !== null ? `${avgLatency} ms` : '—'}
          </div>
        </div>
      </div>
    </Panel>
  )
}
