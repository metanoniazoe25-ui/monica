import { Bell, Settings } from 'lucide-react'
import { useClock } from '../hooks/useClock'

interface TopBarProps {
  online: boolean
  logCount: number
  onOpenSettings: () => void
}

export function TopBar({ online, logCount, onOpenSettings }: TopBarProps) {
  const now = useClock()
  const time = now.toLocaleTimeString('en-US', { hour12: false })

  return (
    <header className="hud-panel flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-hud-cyan/40" />
          <span className="absolute inset-1.5 rounded-full border border-hud-cyan/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-hud-cyan-bright shadow-[0_0_8px_2px_var(--color-hud-cyan-bright)]" />
        </div>
        <div className="text-left">
          <div className="text-lg font-bold tracking-[0.3em] text-hud-cyan-bright">M.O.N.I.C.A.</div>
          <div className="text-[10px] tracking-widest text-hud-cyan/50">
            MULTI-OPERATIONAL NETWORKED INTELLIGENT COGNITIVE ASSISTANT
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-hud-cyan/50">SYSTEM STATUS</div>
          <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-hud-cyan-bright">
            <span
              className={`h-2 w-2 rounded-full ${online ? 'bg-hud-cyan-bright shadow-[0_0_6px_2px_var(--color-hud-cyan-bright)]' : 'bg-red-400'}`}
            />
            {online ? 'OPTIMAL' : 'OFFLINE'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-hud-cyan/50">LOCAL TIME</div>
          <div className="text-sm font-semibold text-hud-cyan-bright">{time}</div>
        </div>

        <div className="flex items-center gap-4 border-l border-hud-border pl-6">
          <div className="relative">
            <Bell size={18} className="text-hud-cyan/70" />
            {logCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-hud-cyan-bright text-[8px] font-bold text-black">
                {Math.min(logCount, 9)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="text-hud-cyan/70 transition hover:text-hud-cyan-bright"
          >
            <Settings size={18} />
          </button>
          <div className="flex items-center gap-2 rounded border border-hud-border px-3 py-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright">
            OPERATOR
            <span className="h-2 w-2 rounded-full bg-hud-cyan-bright" />
          </div>
        </div>
      </div>
    </header>
  )
}
