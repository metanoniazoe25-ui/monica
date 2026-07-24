import { Lock, LockOpen, Wifi, WifiOff } from 'lucide-react'
import { Panel } from './Panel'
import { useSystemInfo } from '../hooks/useSystemInfo'

export function NetworkPanel() {
  const info = useSystemInfo()

  return (
    <Panel category={`LINK: ${info.downlinkMbps ?? '—'} MB/S`} tag="XxXXXXX">
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-hud-cyan/30">
          {info.secure ? (
            <Lock size={26} className="text-hud-cyan-bright" />
          ) : (
            <LockOpen size={26} className="text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright">
          {info.online ? <Wifi size={14} /> : <WifiOff size={14} className="text-red-400" />}
          {info.secure ? 'CONNECTION SECURE' : 'UNSECURED CONTEXT'}
        </div>
        <div className="text-[10px] tracking-wide text-hud-cyan/40">
          {info.online ? `${info.effectiveType.toUpperCase()} · ONLINE` : 'NO CONNECTION'}
        </div>
      </div>
    </Panel>
  )
}
