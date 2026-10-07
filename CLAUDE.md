# homepage

The front page of `saavuori.live`. It lists the user's published apps (HSL Live,
Fintraffic LIVE, finstats, FingridFlow Live — each on a `<name>.saavuori.live` subdomain) and shows
whether each one is up, on a dot-matrix "departure board". A small Go backend
embeds the built frontend and serves it as a single binary.

Sibling projects `ratikka` (HSL Live), `Fintraffic` (liikenne), `FinStats`,
`bensa` and `tieliikenne` share this architecture, deployment host, and CI/CD
shape — when something here looks unexplained, check how they solved it before
inventing a new approach. The scaffolding (Dockerfile, workflows, deploy/,
changelog script) was copied from FinStats.

## What the backend does

Only one thing beyond static serving: `internal/api/status.go` probes every app
in `Targets` every 60 s — `GET /` for up/down and latency, then `GET
/api/version` for a version string when the app has one (ratikka does not) —
and `/api/status` returns the last result. Probing is server-side because the
apps are other origins without CORS, and on a timer so page views never fan
out into requests to the apps.

An app counts as **up** when `/` answers below 400. Caddy answers 502 for a
stopped container, which is why the check goes through the public URL rather
than the container network.

## Layout

```
backend/cmd/server/main.go      entrypoint: starts the prober, wires the API + static
backend/internal/api/status.go  Targets (the app list) + Prober + /api/status
backend/internal/api/static.go  serves the embedded Vite build
backend/internal/api/version.go /api/version and /api/health
backend/internal/api/dist/      frontend build, embedded via //go:embed at image build
frontend/src/apps.ts            app catalogue (copy, links); `id` joins to Targets
frontend/src/components/        Board (status display), AppSection
frontend/public/shots/<id>.webp 1200×750 screenshot per app
scripts/build-changelog.js      CHANGELOG.md -> dist-changelog/index.html for Pages
deploy/                         install.sh (domain as arg) + compose + cron auto-update
```

## Adding an app

Three places, keyed by the same `id`: `Targets` in `status.go`, `APPS` in
`apps.ts`, and `public/shots/<id>.webp`. The screenshots were taken with
Playwright driving the installed Edge in headed mode — headless Edge renders
MapLibre maps blank.

## Local development

```
cd backend && go run ./cmd/server           # :8081, serves /api/* (probes the live apps)
cd frontend && npm install && npm run dev   # :5173, proxies /api -> :8081
```

`backend/internal/api/dist/` holds only `.gitkeep` in a checkout, so
`//go:embed all:dist` still compiles.

## Conventions

- Version/build metadata is injected via `-ldflags` in CI, never hardcoded.
- Unknown `/api/*` paths 404 instead of falling through to `index.html`.
- Theme is an explicit choice on `<html data-theme>` (light by default here),
  not the OS setting. index.html applies the saved choice before first paint.
- The board is the only element that glows; it looks the same in both themes.
- CHANGELOG.md headings must match the tags CI generates (`## [v0.1.0] - date`),
  or the Pages changelog renders them as plain text.

## Deployment

Push to `main` → CI tags, builds a multi-arch image, pushes
`ghcr.io/saavuori/homepage:latest`. The Oracle host runs a 5-minute cron
(`~/homepage/update.sh`) that pulls and redeploys. TLS is terminated by the
Caddy container in the *ratikka* stack (`~/ratikka/Caddyfile`), which proxies
`saavuori.live` to `homepage:8080` over the shared `web-proxy` network and
redirects `www.saavuori.live` to the apex. See `docs/DEPLOYMENT.md`.
