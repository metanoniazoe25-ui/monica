import { useState } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  apiKey: string
  hasServerKey: boolean
  onSave: (key: string) => void
  onClose: () => void
}

export function SettingsModal({ apiKey, hasServerKey, onSave, onClose }: SettingsModalProps) {
  const [value, setValue] = useState(apiKey)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="hud-panel relative w-full max-w-md p-6 text-left">
        <span className="hud-corner hud-corner-tl" />
        <span className="hud-corner hud-corner-br" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-hud-cyan/60 hover:text-hud-cyan-bright"
          aria-label="Close settings"
        >
          <X size={18} />
        </button>

        <h2 className="mb-1 text-sm font-bold tracking-widest text-hud-cyan-bright">SETTINGS</h2>
        <p className="mb-4 text-[11px] text-hud-cyan/50">
          M.O.N.I.C.A. needs an Anthropic API key to think. Paste one below to store it in your browser only — it
          is sent to the local backend with each request and never leaves your machine.
        </p>

        {hasServerKey && (
          <p className="mb-4 rounded border border-hud-cyan/30 p-2 text-[11px] text-hud-cyan/60">
            A server-side key is already configured. A key entered here will override it for your session.
          </p>
        )}

        <label className="mb-1 block text-[10px] tracking-widest text-hud-cyan/50">ANTHROPIC API KEY</label>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          className="mb-4 w-full rounded border border-hud-cyan/40 bg-black/40 px-3 py-2 text-sm text-hud-cyan-bright placeholder:text-hud-cyan/30 focus:border-hud-cyan-bright focus:outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onSave('')
              setValue('')
            }}
            className="rounded border border-hud-border px-3 py-1.5 text-xs tracking-widest text-hud-cyan/60 hover:border-hud-cyan/50"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(value.trim())
              onClose()
            }}
            className="rounded border border-hud-cyan-bright bg-hud-cyan-dim/40 px-3 py-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright hover:bg-hud-cyan-dim/70"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}
