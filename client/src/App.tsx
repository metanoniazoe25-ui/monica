import { useCallback, useState } from 'react'
import { TopBar } from './components/TopBar'
import { VitalsPanel } from './components/VitalsPanel'
import { ResourcesPanel } from './components/ResourcesPanel'
import { NetworkPanel } from './components/NetworkPanel'
import { StatusPanel } from './components/StatusPanel'
import { LogPanel } from './components/LogPanel'
import { TerminalPanel } from './components/TerminalPanel'
import { CorePanel } from './components/CorePanel'
import { VoiceBar } from './components/VoiceBar'
import { SettingsModal } from './components/SettingsModal'
import { SpotifyPanel } from './components/SpotifyPanel'
import { useAssistant } from './hooks/useAssistant'
import { useSystemInfo } from './hooks/useSystemInfo'
import { useSpotify } from './hooks/useSpotify'

function App() {
  const assistant = useAssistant()
  const system = useSystemInfo()
  const spotify = useSpotify(assistant.pushLog)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSpotifyControl = useCallback(
    (action: 'play' | 'pause' | 'next' | 'previous') => {
      fetch(`/api/spotify/${action}`, { method: 'POST' })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) assistant.pushLog(`Spotify ${action} failed: ${d.error}`)
          else assistant.pushLog(`Spotify: ${action}`)
          spotify.refreshStatus()
        })
        .catch(() => assistant.pushLog(`Spotify ${action} failed: request error`))
    },
    [assistant, spotify],
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-3 p-3 text-hud-cyan">
      <TopBar online={system.online} logCount={assistant.log.length} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <VitalsPanel messages={assistant.messages} latencies={assistant.latencies} />
          <ResourcesPanel />
          <NetworkPanel />
          <SpotifyPanel
            configured={spotify.status.configured}
            connected={spotify.status.connected}
            nowPlaying={spotify.nowPlaying}
            onConnect={spotify.connect}
            onDisconnect={spotify.disconnect}
            onControl={handleSpotifyControl}
          />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-6">
          <div className="hud-panel relative flex flex-1 flex-col p-4">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
            <CorePanel state={assistant.state} />
            <VoiceBar
              state={assistant.state}
              listening={assistant.listening}
              supportsRecognition={assistant.supportsRecognition}
              onToggleListening={assistant.toggleListening}
              onSend={assistant.sendMessage}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <StatusPanel
            model="M.O.N.I.C.A."
            provider={assistant.provider}
            ollamaModel={assistant.ollamaModel}
            keyConfigured={Boolean(assistant.apiKey) || assistant.hasServerKey}
            voiceOut={assistant.voiceOut}
            autoListen={assistant.autoListen}
            listening={assistant.listening}
            supportsRecognition={assistant.supportsRecognition}
            onToggleVoiceOut={() => assistant.setVoiceOut(!assistant.voiceOut)}
            onToggleAutoListen={() => assistant.setAutoListen(!assistant.autoListen)}
            onToggleListening={assistant.toggleListening}
            onReset={assistant.reset}
          />
          <LogPanel log={assistant.log} />
          <TerminalPanel messages={assistant.messages} />
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal
          apiKey={assistant.apiKey}
          hasServerKey={assistant.hasServerKey}
          onSaveApiKey={assistant.setApiKey}
          provider={assistant.provider}
          onSetProvider={assistant.setProvider}
          ollamaUrl={assistant.ollamaUrl}
          onSetOllamaUrl={assistant.setOllamaUrl}
          ollamaModel={assistant.ollamaModel}
          onSetOllamaModel={assistant.setOllamaModel}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
