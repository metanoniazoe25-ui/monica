import { useCallback, useEffect, useRef, useState } from 'react'
import type { AssistantState, ChatMessage, LogEntry, Provider, ToolTrace } from '../types'

const API_KEY_STORAGE = 'monica.apiKey'
const VOICE_OUT_STORAGE = 'monica.voiceOut'
const AUTO_LISTEN_STORAGE = 'monica.autoListen'
const PROVIDER_STORAGE = 'monica.provider'
const OLLAMA_URL_STORAGE = 'monica.ollamaUrl'
const OLLAMA_MODEL_STORAGE = 'monica.ollamaModel'

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

let logIdCounter = 0

function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [state, setState] = useState<AssistantState>('idle')
  const [listening, setListening] = useState(false)
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '')
  const [hasServerKey, setHasServerKey] = useState(false)
  const [voiceOut, setVoiceOutState] = useState(() => localStorage.getItem(VOICE_OUT_STORAGE) !== 'off')
  const [autoListen, setAutoListenState] = useState(() => localStorage.getItem(AUTO_LISTEN_STORAGE) === 'on')
  const [latencies, setLatencies] = useState<number[]>([])
  const [provider, setProviderState] = useState<Provider>(
    () => (localStorage.getItem(PROVIDER_STORAGE) as Provider) || 'anthropic',
  )
  const [ollamaUrl, setOllamaUrlState] = useState(
    () => localStorage.getItem(OLLAMA_URL_STORAGE) || DEFAULT_OLLAMA_URL,
  )
  const [ollamaModel, setOllamaModelState] = useState(() => localStorage.getItem(OLLAMA_MODEL_STORAGE) || '')

  const messagesRef = useRef<ChatMessage[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sendMessageRef = useRef<(text: string) => void>(() => {})
  const prevStateRef = useRef<AssistantState>('idle')

  const supportsRecognition =
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  const supportsSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const pushLog = useCallback((text: string) => {
    logIdCounter += 1
    setLog((prev) => [...prev.slice(-49), { id: logIdCounter, time: timeNow(), text }])
  }, [])

  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    pushLog('Session initialized')
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        setHasServerKey(Boolean(d.hasServerKey))
        pushLog(d.hasServerKey ? 'Server API key detected' : 'No server key — using local key if provided')
      })
      .catch(() => pushLog('Health check failed — backend unreachable'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setApiKey = useCallback(
    (key: string) => {
      setApiKeyState(key)
      if (key) localStorage.setItem(API_KEY_STORAGE, key)
      else localStorage.removeItem(API_KEY_STORAGE)
      pushLog(key ? 'API key saved locally' : 'API key cleared')
    },
    [pushLog],
  )

  const setVoiceOut = useCallback(
    (value: boolean) => {
      setVoiceOutState(value)
      localStorage.setItem(VOICE_OUT_STORAGE, value ? 'on' : 'off')
      pushLog(`Voice output ${value ? 'enabled' : 'disabled'}`)
      if (!value) window.speechSynthesis?.cancel()
    },
    [pushLog],
  )

  const setAutoListen = useCallback(
    (value: boolean) => {
      setAutoListenState(value)
      localStorage.setItem(AUTO_LISTEN_STORAGE, value ? 'on' : 'off')
      pushLog(`Auto-listen ${value ? 'enabled' : 'disabled'}`)
    },
    [pushLog],
  )

  const setProvider = useCallback(
    (value: Provider) => {
      setProviderState(value)
      localStorage.setItem(PROVIDER_STORAGE, value)
      pushLog(`AI brain switched to ${value === 'ollama' ? 'Hermes (local)' : 'Claude'}`)
    },
    [pushLog],
  )

  const setOllamaUrl = useCallback((value: string) => {
    setOllamaUrlState(value)
    localStorage.setItem(OLLAMA_URL_STORAGE, value)
  }, [])

  const setOllamaModel = useCallback((value: string) => {
    setOllamaModelState(value)
    localStorage.setItem(OLLAMA_MODEL_STORAGE, value)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!voiceOut || !supportsSynthesis || !text) {
        setState('idle')
        return
      }
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 1.02
      utter.pitch = 0.9
      utter.onstart = () => {
        setState('speaking')
        pushLog('Speech synthesis started')
      }
      utter.onend = () => {
        setState('idle')
        pushLog('Speech synthesis ended')
      }
      utter.onerror = () => setState('idle')
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    },
    [voiceOut, supportsSynthesis, pushLog],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      }
      const history = [...messagesRef.current, userMsg]
      setMessages(history)
      pushLog(`Query received: "${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}"`)
      setState('thinking')

      const started = performance.now()
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(apiKey ? { 'x-api-key': apiKey } : {}),
          },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            provider,
            ollamaUrl,
            ollamaModel: ollamaModel || undefined,
          }),
        })
        const data = await res.json()
        const latency = Math.round(performance.now() - started)
        if (!res.ok) throw new Error(data.error || 'Request failed')

        const trace = Array.isArray(data.trace) ? (data.trace as ToolTrace[]) : []
        for (const t of trace) {
          pushLog(t.ok ? `Tool used: ${t.tool}` : `Tool failed: ${t.tool} — ${t.error}`)
        }

        const replyText = data.content || '…'
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: replyText,
          ts: Date.now(),
          latencyMs: latency,
        }
        setMessages((prev) => [...prev, assistantMsg])
        setLatencies((prev) => [...prev.slice(-19), latency])
        pushLog(`Response generated (${latency} ms)${data.demo ? ' [demo mode]' : ''}`)
        speak(replyText)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        pushLog(`Error: ${message}`)
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${message}`, ts: Date.now() },
        ])
        setState('idle')
      }
    },
    [apiKey, provider, ollamaUrl, ollamaModel, pushLog, speak],
  )

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  useEffect(() => {
    if (!supportsRecognition) return
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!RecognitionCtor) return

    const recognition = new RecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => {
      setListening(true)
      setState('listening')
      pushLog('Listening…')
    }
    recognition.onend = () => {
      setListening(false)
      setState((s) => (s === 'listening' ? 'idle' : s))
    }
    recognition.onerror = (event) => {
      pushLog(`Voice recognition error: ${event.error}`)
      setListening(false)
      setState('idle')
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
      if (transcript.trim()) sendMessageRef.current(transcript)
    }

    recognitionRef.current = recognition
    return () => recognition.abort()
  }, [supportsRecognition, pushLog])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      pushLog('Voice recognition not supported in this browser')
      return
    }
    if (listening) {
      recognitionRef.current.stop()
    } else {
      window.speechSynthesis?.cancel()
      recognitionRef.current.start()
    }
  }, [listening, pushLog])

  useEffect(() => {
    if (
      autoListen &&
      prevStateRef.current === 'speaking' &&
      state === 'idle' &&
      recognitionRef.current &&
      !listening
    ) {
      recognitionRef.current.start()
    }
    prevStateRef.current = state
  }, [state, autoListen, listening])

  const reset = useCallback(() => {
    setMessages([])
    setLatencies([])
    window.speechSynthesis?.cancel()
    setState('idle')
    pushLog('Conversation reset')
  }, [pushLog])

  return {
    messages,
    log,
    state,
    listening,
    sendMessage,
    toggleListening,
    apiKey,
    setApiKey,
    hasServerKey,
    voiceOut,
    setVoiceOut,
    autoListen,
    setAutoListen,
    latencies,
    supportsRecognition,
    supportsSynthesis,
    reset,
    provider,
    setProvider,
    ollamaUrl,
    setOllamaUrl,
    ollamaModel,
    setOllamaModel,
    pushLog,
  }
}
