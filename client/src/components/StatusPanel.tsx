import { Mic, MicOff, Power, Repeat, Volume2, VolumeX } from 'lucide-react'
import { Panel } from './Panel'
import type { Provider } from '../types'

interface StatusPanelProps {
  model: string
  provider: Provider
  ollamaModel: string
  keyConfigured: boolean
  voiceOut: boolean
  autoListen: boolean
  listening: boolean
  supportsRecognition: boolean
  onToggleVoiceOut: () => void
  onToggleAutoListen: () => void
  onToggleListening: () => void
  onReset: () => void
}

function ToggleButton({
  active,
  label,
  icon,
  onClick,
  disabled,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-pressed={active}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded border text-[9px] tracking-wide transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'border-hud-cyan-bright bg-hud-cyan-dim/50 text-hud-cyan-bright'
          : 'border-hud-border text-hud-cyan/50 hover:border-hud-cyan/50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export function StatusPanel({
  model,
  provider,
  ollamaModel,
  keyConfigured,
  voiceOut,
  autoListen,
  listening,
  supportsRecognition,
  onToggleVoiceOut,
  onToggleAutoListen,
  onToggleListening,
  onReset,
}: StatusPanelProps) {
  const brainLabel = provider === 'ollama' ? ollamaModel || 'Hermes (local)' : 'Claude'
  const readyLabel = provider === 'ollama' ? 'LOCAL' : keyConfigured ? 'CONFIGURED' : 'NOT SET'
  const readyOk = provider === 'ollama' || keyConfigured

  return (
    <Panel category={model.toUpperCase()} tag="XXXXX-XXXX">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] tracking-widest text-hud-cyan/50">Brain</div>
          <div className="truncate text-sm font-semibold text-hud-cyan-bright" title={brainLabel}>
            {brainLabel}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-hud-cyan/50">
            {provider === 'ollama' ? 'Runtime' : 'API Key'}
          </div>
          <div className={`text-sm font-semibold ${readyOk ? 'text-hud-cyan-bright' : 'text-amber-400'}`}>
            {readyLabel}
          </div>
        </div>
      </div>

      <div className="mb-2 text-[10px] tracking-widest text-hud-cyan/50">CONTROLS</div>
      <div className="grid grid-cols-4 gap-2">
        <ToggleButton
          active={listening}
          label="MIC"
          icon={listening ? <Mic size={16} /> : <MicOff size={16} />}
          onClick={onToggleListening}
          disabled={!supportsRecognition}
        />
        <ToggleButton
          active={voiceOut}
          label="VOICE"
          icon={voiceOut ? <Volume2 size={16} /> : <VolumeX size={16} />}
          onClick={onToggleVoiceOut}
        />
        <ToggleButton active={autoListen} label="AUTO" icon={<Repeat size={16} />} onClick={onToggleAutoListen} />
        <ToggleButton active={false} label="RESET" icon={<Power size={16} />} onClick={onReset} />
      </div>
    </Panel>
  )
}
