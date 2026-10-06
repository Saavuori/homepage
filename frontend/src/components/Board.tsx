import { useEffect, useState } from 'react'
import { APPS, host } from '../apps'
import type { AppStatus, StatusState } from '../lib/status'

// The page's signature: a passenger-information display, the same dot-matrix
// board Helsinki's stops and stations use, listing the apps instead of
// departures. The status column is a real check made by the server.

const helsinkiTime = (d: Date, seconds = false) =>
  d.toLocaleTimeString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  })

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <time className="board-clock" dateTime={now.toISOString()} aria-label="Time in Helsinki">
      {helsinkiTime(now, true)}
    </time>
  )
}

function latency(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function StatusCell({ status, state }: { status?: AppStatus; state: StatusState }) {
  if (state.kind === 'loading') return <span className="board-status dim">· · ·</span>
  if (!status) return <span className="board-status dim">—</span>
  if (!status.up)
    return (
      <span className="board-status down">
        <i className="led led-down" aria-hidden /> DOWN
      </span>
    )
  return (
    <span className="board-status">
      <i className="led led-up" aria-hidden />
      <span className="sr-only">Up, answered in </span>
      {latency(status.latencyMs ?? 0)}
    </span>
  )
}

function footerLine(state: StatusState) {
  switch (state.kind) {
    case 'loading':
      return 'Checking the apps…'
    case 'error':
      return 'Status check unavailable. The links still work.'
    case 'ok':
      return state.checkedAt
        ? `Checked ${helsinkiTime(state.checkedAt)} · rechecked every minute`
        : 'First check in progress…'
  }
}

export function Board({ state }: { state: StatusState }) {
  return (
    <section className="board" aria-labelledby="board-title">
      <header className="board-head">
        <h2 id="board-title" className="board-title">
          Live apps
        </h2>
        <Clock />
      </header>

      <div className="board-cols" aria-hidden>
        <span>App</span>
        <span>Address</span>
        <span>Status</span>
      </div>

      <ul className="board-rows">
        {APPS.map((app) => {
          const status = state.kind === 'ok' ? state.byId[app.id] : undefined
          return (
            <li key={app.id}>
              <a className="board-row" href={app.url}>
                <span className="board-name">{app.boardName}</span>
                <span className="board-host">{host(app.url)}</span>
                <StatusCell status={status} state={state} />
              </a>
            </li>
          )
        })}
      </ul>

      <p className="board-foot" aria-live="polite">
        {footerLine(state)}
      </p>
    </section>
  )
}
