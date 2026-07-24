import { useState } from 'react'
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
import { useAssistant } from './hooks/useAssistant'
import { useSystemInfo } from './hooks/useSystemInfo'

function App() {
  const assistant = useAssistant()
  const system = useSystemInfo()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-3 p-3 text-hud-cyan">
      <TopBar online={system.online} logCount={assistant.log.length} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <VitalsPanel messages={assistant.messages} latencies={assistant.latencies} />
          <ResourcesPanel />
          <NetworkPanel />
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
          onSave={assistant.setApiKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
