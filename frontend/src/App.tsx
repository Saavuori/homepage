import { useEffect, useState } from 'react'
import { APPS } from './apps'
import { AppSection } from './components/AppSection'
import { Board } from './components/Board'
import { useStatus } from './lib/status'
import { applyTheme, loadTheme, type Theme } from './lib/theme'

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
    >
      {next === 'dark' ? 'Dark' : 'Light'} theme
    </button>
  )
}

function useOwnVersion() {
  const [version, setVersion] = useState<string>()
  useEffect(() => {
    fetch('/api/version')
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => v?.version && setVersion(v.version))
      .catch(() => {})
  }, [])
  return version
}

export default function App() {
  const status = useStatus()
  const version = useOwnVersion()

  return (
    <div className="page">
      <header className="site-head">
        <span className="wordmark">saavuori.live</span>
        <ThemeToggle />
      </header>

      <main>
        <section className="intro">
          <h1>Live maps and data explorers built on Finnish open data.</h1>
          <p>
            Each app runs on its own address. The board below checks every one of them once a
            minute.
          </p>
        </section>

        <Board state={status} />

        <div className="apps">
          {APPS.map((app) => (
            <AppSection
              key={app.id}
              app={app}
              status={status.kind === 'ok' ? status.byId[app.id] : undefined}
            />
          ))}
        </div>
      </main>

      <footer className="site-foot">
        <span>
          Made by Sampsa Saavuori ·{' '}
          <a href="https://github.com/Saavuori">github.com/Saavuori</a>
        </span>
        <span className="mono">
          <a href="https://github.com/Saavuori/homepage">Page source</a>
          {version && ` · ${version}`}
        </span>
      </footer>
    </div>
  )
}
