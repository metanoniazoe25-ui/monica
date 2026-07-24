import { useEffect, useState } from 'react'

interface SystemInfo {
  online: boolean
  effectiveType: string
  downlinkMbps: number | null
  memoryUsedMb: number | null
  memoryLimitMb: number | null
  storagePercent: number | null
  cores: number
  secure: boolean
}

function readSystemInfo(): SystemInfo {
  const connection = navigator.connection
  const memory = performance.memory

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType ?? 'unknown',
    downlinkMbps: connection?.downlink ?? null,
    memoryUsedMb: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
    memoryLimitMb: memory ? Math.round(memory.jsHeapSizeLimit / 1048576) : null,
    storagePercent: null,
    cores: navigator.hardwareConcurrency || 1,
    secure: window.isSecureContext,
  }
}

export function useSystemInfo() {
  const [info, setInfo] = useState<SystemInfo>(() => readSystemInfo())

  useEffect(() => {
    let cancelled = false

    navigator.storage
      ?.estimate?.()
      .then((estimate) => {
        if (cancelled || !estimate.quota) return
        const percent = Math.round(((estimate.usage ?? 0) / estimate.quota) * 100)
        setInfo((prev) => ({ ...prev, storagePercent: percent }))
      })
      .catch(() => {})

    const tick = () => setInfo(readSystemInfo())
    const interval = setInterval(tick, 3000)
    window.addEventListener('online', tick)
    window.addEventListener('offline', tick)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('online', tick)
      window.removeEventListener('offline', tick)
    }
  }, [])

  return info
}
