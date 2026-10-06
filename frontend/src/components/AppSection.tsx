import type { App } from '../apps'
import type { AppStatus } from '../lib/status'

export function AppSection({ app, status }: { app: App; status?: AppStatus }) {
  const down = status && !status.up
  return (
    <article className="app" id={app.id} aria-labelledby={`${app.id}-name`}>
      <a className="app-shot" href={app.url} tabIndex={-1} aria-hidden>
        <img
          src={`/shots/${app.id}.webp`}
          alt=""
          width={1200}
          height={750}
          loading="lazy"
          decoding="async"
        />
      </a>

      <div className="app-body">
        <p className="app-data">{app.data}</p>
        <h2 className="app-name" id={`${app.id}-name`}>
          {app.name}
        </h2>
        <p className="app-tagline">{app.tagline}</p>
        <ul className="app-features">
          {app.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <div className="app-actions">
          <a className="btn btn-primary" href={app.url}>
            Open app<span className="btn-arrow" aria-hidden>→</span>
          </a>
          <a className="btn" href={app.repo}>
            Source
          </a>
          <a className="btn" href={app.changelog}>
            Changelog
          </a>
        </div>

        <p className="app-meta">
          {status?.version && <span className="chip">{status.version}</span>}
          {down && <span className="chip chip-down">Not answering right now</span>}
        </p>
      </div>
    </article>
  )
}
