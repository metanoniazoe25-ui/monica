import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Provider } from '../types'

interface SettingsModalProps {
  apiKey: string
  hasServerKey: boolean
  onSaveApiKey: (key: string) => void
  provider: Provider
  onSetProvider: (p: Provider) => void
  ollamaUrl: string
  onSetOllamaUrl: (url: string) => void
  ollamaModel: string
  onSetOllamaModel: (model: string) => void
  onClose: () => void
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded border px-3 py-2 text-xs font-semibold tracking-widest transition ${
        active
          ? 'border-hud-cyan-bright bg-hud-cyan-dim/40 text-hud-cyan-bright'
          : 'border-hud-border text-hud-cyan/50 hover:border-hud-cyan/40'
      }`}
    >
      {label}
    </button>
  )
}

export function SettingsModal({
  apiKey,
  hasServerKey,
  onSaveApiKey,
  provider,
  onSetProvider,
  ollamaUrl,
  onSetOllamaUrl,
  ollamaModel,
  onSetOllamaModel,
  onClose,
}: SettingsModalProps) {
  const [keyValue, setKeyValue] = useState(apiKey)
  const [urlValue, setUrlValue] = useState(ollamaUrl)
  const [models, setModels] = useState<string[]>([])
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [modelError, setModelError] = useState('')

  const fetchModels = () => {
    setModelStatus('loading')
    fetch(`/api/ollama/models?url=${encodeURIComponent(urlValue)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error || 'Failed to reach Ollama')
        setModels(d.models)
        setModelStatus('ok')
        if (!ollamaModel && d.models[0]) onSetOllamaModel(d.models[0])
      })
      .catch((err) => {
        setModelStatus('error')
        setModelError(err instanceof Error ? err.message : 'Failed to reach Ollama')
      })
  }

  useEffect(() => {
    if (provider === 'ollama') fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

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

        <h2 className="mb-3 text-sm font-bold tracking-widest text-hud-cyan-bright">SETTINGS</h2>

        <div className="mb-4 text-[10px] tracking-widest text-hud-cyan/50">AI BRAIN</div>
        <div className="mb-4 flex gap-2">
          <TabButton active={provider === 'anthropic'} label="CLAUDE" onClick={() => onSetProvider('anthropic')} />
          <TabButton active={provider === 'ollama'} label="HERMES (LOCAL)" onClick={() => onSetProvider('ollama')} />
        </div>

        {provider === 'anthropic' ? (
          <>
            <p className="mb-3 text-[11px] text-hud-cyan/50">
              Paste an Anthropic API key to store it in your browser only — it's sent to your local backend with
              each request and never leaves your machine.
            </p>
            {hasServerKey && (
              <p className="mb-3 rounded border border-hud-cyan/30 p-2 text-[11px] text-hud-cyan/60">
                A server-side key is already configured. A key entered here overrides it for your session.
              </p>
            )}
            <label className="mb-1 block text-[10px] tracking-widest text-hud-cyan/50">ANTHROPIC API KEY</label>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              className="mb-4 w-full rounded border border-hud-cyan/40 bg-black/40 px-3 py-2 text-sm text-hud-cyan-bright placeholder:text-hud-cyan/30 focus:border-hud-cyan-bright focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onSaveApiKey('')
                  setKeyValue('')
                }}
                className="rounded border border-hud-border px-3 py-1.5 text-xs tracking-widest text-hud-cyan/60 hover:border-hud-cyan/50"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveApiKey(keyValue.trim())
                  onClose()
                }}
                className="rounded border border-hud-cyan-bright bg-hud-cyan-dim/40 px-3 py-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright hover:bg-hud-cyan-dim/70"
              >
                SAVE
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-[11px] text-hud-cyan/50">
              Talks to a locally running Ollama server hosting your Hermes model. No API key needed — everything
              stays on your machine.
            </p>
            <label className="mb-1 block text-[10px] tracking-widest text-hud-cyan/50">OLLAMA BASE URL</label>
            <div className="mb-3 flex gap-2">
              <input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 rounded border border-hud-cyan/40 bg-black/40 px-3 py-2 text-sm text-hud-cyan-bright placeholder:text-hud-cyan/30 focus:border-hud-cyan-bright focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onSetOllamaUrl(urlValue)
                  fetchModels()
                }}
                className="rounded border border-hud-cyan/40 px-3 text-xs tracking-widest text-hud-cyan/70 hover:border-hud-cyan-bright hover:text-hud-cyan-bright"
              >
                TEST
              </button>
            </div>

            <label className="mb-1 block text-[10px] tracking-widest text-hud-cyan/50">MODEL</label>
            {modelStatus === 'loading' && <div className="mb-3 text-[11px] text-hud-cyan/40">Checking…</div>}
            {modelStatus === 'error' && (
              <div className="mb-3 text-[11px] text-amber-400">Couldn't reach Ollama: {modelError}</div>
            )}
            {models.length > 0 ? (
              <select
                value={ollamaModel}
                onChange={(e) => onSetOllamaModel(e.target.value)}
                className="mb-4 w-full rounded border border-hud-cyan/40 bg-black/40 px-3 py-2 text-sm text-hud-cyan-bright focus:border-hud-cyan-bright focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={ollamaModel}
                onChange={(e) => onSetOllamaModel(e.target.value)}
                placeholder="hermes3"
                className="mb-4 w-full rounded border border-hud-cyan/40 bg-black/40 px-3 py-2 text-sm text-hud-cyan-bright placeholder:text-hud-cyan/30 focus:border-hud-cyan-bright focus:outline-none"
              />
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onSetOllamaUrl(urlValue)
                  onClose()
                }}
                className="rounded border border-hud-cyan-bright bg-hud-cyan-dim/40 px-3 py-1.5 text-xs font-semibold tracking-widest text-hud-cyan-bright hover:bg-hud-cyan-dim/70"
              >
                DONE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
