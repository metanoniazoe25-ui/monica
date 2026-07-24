import type { AssistantState } from '../types'

const STATE_LABEL: Record<AssistantState, string> = {
  idle: 'CORE\nACTIVE',
  listening: 'LISTEN\nING',
  thinking: 'PROCESS\nING',
  speaking: 'RESPOND\nING',
  error: 'CORE\nERROR',
}

const STATE_COLOR: Record<AssistantState, string> = {
  idle: 'text-hud-cyan-bright',
  listening: 'text-emerald-300',
  thinking: 'text-amber-300',
  speaking: 'text-hud-cyan-bright',
  error: 'text-red-400',
}

export function CorePanel({ state }: { state: AssistantState }) {
  const active = state !== 'idle'

  return (
    <div className="relative flex flex-1 items-center justify-center">
      <div className="relative flex h-[340px] w-[340px] items-center justify-center">
        <svg
          viewBox="0 0 340 340"
          className={`absolute inset-0 animate-spin-slow ${active ? 'opacity-80' : 'opacity-40'}`}
        >
          <circle cx="170" cy="170" r="165" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 10" className="text-hud-cyan" />
        </svg>
        <svg
          viewBox="0 0 340 340"
          className={`absolute inset-0 animate-spin-slower ${active ? 'opacity-90' : 'opacity-50'}`}
        >
          <circle cx="170" cy="170" r="132" fill="none" stroke="currentColor" strokeWidth="1" className="text-hud-cyan/70" />
          <line x1="170" y1="8" x2="170" y2="38" stroke="currentColor" strokeWidth="2" className="text-hud-cyan-bright" />
          <line x1="170" y1="302" x2="170" y2="332" stroke="currentColor" strokeWidth="2" className="text-hud-cyan-bright" />
        </svg>
        <svg viewBox="0 0 340 340" className="absolute inset-0 opacity-30">
          <circle cx="170" cy="170" r="100" fill="none" stroke="currentColor" strokeWidth="1" className="text-hud-cyan" />
          <line x1="170" y1="70" x2="170" y2="270" stroke="currentColor" strokeWidth="1" className="text-hud-cyan" />
          <line x1="70" y1="170" x2="270" y2="170" stroke="currentColor" strokeWidth="1" className="text-hud-cyan" />
          <line x1="99" y1="99" x2="241" y2="241" stroke="currentColor" strokeWidth="1" className="text-hud-cyan" />
          <line x1="241" y1="99" x2="99" y2="241" stroke="currentColor" strokeWidth="1" className="text-hud-cyan" />
        </svg>

        <div
          className={`relative flex h-16 w-16 items-center justify-center border border-hud-cyan-bright/60 ${active ? 'animate-core-pulse' : ''}`}
        >
          <span className="absolute -left-1 -top-1 h-2 w-2 border-l border-t border-hud-cyan-bright" />
          <span className="absolute -right-1 -top-1 h-2 w-2 border-r border-t border-hud-cyan-bright" />
          <span className="absolute -bottom-1 -left-1 h-2 w-2 border-b border-l border-hud-cyan-bright" />
          <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-hud-cyan-bright" />
          <div
            className={`whitespace-pre text-center text-[10px] font-bold leading-tight tracking-widest ${STATE_COLOR[state]}`}
          >
            {STATE_LABEL[state]}
          </div>
        </div>
      </div>
    </div>
  )
}
