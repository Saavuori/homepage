import { useEffect, useState } from 'react'

// Mirrors AppStatus in backend/internal/api/status.go.
export interface AppStatus {
  id: string
  up: boolean
  httpCode?: number
  latencyMs?: number
  version?: string
  error?: string
  checkedAt: string
}

export type StatusState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ok'; byId: Record<string, AppStatus>; checkedAt?: Date }

// The server re-probes every 60 s, so polling faster would only re-read the
// same result.
const POLL_MS = 60_000

export function useStatus(): StatusState {
  const [state, setState] = useState<StatusState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/status')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body: { apps: AppStatus[] } = await res.json()
        if (cancelled) return
        const byId = Object.fromEntries(body.apps.map((a) => [a.id, a]))
        const times = body.apps.map((a) => Date.parse(a.checkedAt)).filter(Number.isFinite)
        setState({
          kind: 'ok',
          byId,
          checkedAt: times.length ? new Date(Math.max(...times)) : undefined,
        })
      } catch {
        // Keep showing the last good result if one exists; only a page that
        // never got one falls back to the error line.
        if (!cancelled) setState((s) => (s.kind === 'ok' ? s : { kind: 'error' }))
      }
    }
    load()
    const t = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return state
}
