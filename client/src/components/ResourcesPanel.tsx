import { Cpu, Database, HardDrive } from 'lucide-react'
import { Panel } from './Panel'
import { useSystemInfo } from '../hooks/useSystemInfo'

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-hud-cyan-dim/40">
      <div
        className="h-full rounded-full bg-hud-cyan-bright transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

export function ResourcesPanel() {
  const info = useSystemInfo()
  const memPercent =
    info.memoryUsedMb !== null && info.memoryLimitMb ? (info.memoryUsedMb / info.memoryLimitMb) * 100 : null

  return (
    <Panel category="RT-MONITOR" tag="XxxXXXXXXXXX">
      <div className="space-y-3 text-left">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-hud-cyan/70">
              <Cpu size={13} /> CPU Cores
            </span>
            <span className="font-semibold text-hud-cyan-bright">{info.cores}</span>
          </div>
          <Bar percent={(info.cores / 16) * 100} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-hud-cyan/70">
              <Database size={13} /> Heap Memory
            </span>
            <span className="font-semibold text-hud-cyan-bright">
              {info.memoryUsedMb !== null ? `${info.memoryUsedMb} MB` : 'n/a'}
            </span>
          </div>
          <Bar percent={memPercent ?? 0} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-hud-cyan/70">
              <HardDrive size={13} /> Storage Used
            </span>
            <span className="font-semibold text-hud-cyan-bright">
              {info.storagePercent !== null ? `${info.storagePercent}%` : '—'}
            </span>
          </div>
          <Bar percent={info.storagePercent ?? 0} />
        </div>
      </div>
    </Panel>
  )
}
