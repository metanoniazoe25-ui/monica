import type { ReactNode } from 'react'

interface PanelProps {
  category: string
  tag?: string
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Panel({ category, tag, className = '', bodyClassName = '', children }: PanelProps) {
  return (
    <div className={`hud-panel flex flex-col p-4 ${className}`}>
      <span className="hud-corner hud-corner-tl" />
      <span className="hud-corner hud-corner-br" />
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.2em] text-hud-cyan/70">SYSTEM //</div>
          {tag && (
            <div className="select-none text-[9px] tracking-wide text-hud-cyan/25 blur-[1.5px]">{tag}</div>
          )}
        </div>
        <div className="text-[9px] tracking-[0.2em] text-hud-cyan/45">{category}</div>
      </div>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  )
}
