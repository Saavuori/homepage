# saavuori.live

The front page of **[saavuori.live](https://saavuori.live)**: the live apps I
have published, each on its own subdomain, with a departure-board-style status
display that the server refreshes every minute.

| App | Address | What it is | Source |
|-----|---------|-----------|--------|
| HSL Live | [hsl.saavuori.live](https://hsl.saavuori.live) | Every tram, bus, metro, train and ferry in Helsinki in real time | [ratikka](https://github.com/Saavuori/ratikka) |
| Fintraffic LIVE | [liikenne.saavuori.live](https://liikenne.saavuori.live) | Ships, trains and road traffic across Finland | [Fintraffic](https://github.com/Saavuori/Fintraffic) |
| finstats | [finstat.saavuori.live](https://finstat.saavuori.live) | Statistics Finland's open tables as charts and maps | [FinStats](https://github.com/Saavuori/FinStats) |
| FingridFlow Live | [fingrid.saavuori.live](https://fingrid.saavuori.live) | Finland's power system live, and every Fingrid open dataset | [fingrid-data-collector](https://github.com/Saavuori/fingrid-data-collector) |

## How it works

A Vite + React page embedded in a small Go binary, the same shape as the apps it
lists. The backend has one job beyond serving the page: a background prober
requests each app's public URL every 60 s (and its `/api/version`, when it has
one) and serves the latest result at `/api/status`. The board reads that, so a
visitor's browser never has to reach the other origins and page loads never add
load to the apps.

```
backend/cmd/server/main.go        wires /api/status, /api/version, /api/health + static
backend/internal/api/status.go    the app list (Targets) and the background prober
backend/internal/api/static.go    serves the embedded Vite build
frontend/src/apps.ts              the app catalogue: names, copy, links
frontend/src/components/Board.tsx the dot-matrix status board
frontend/public/shots/            one 16:10 screenshot per app
deploy/                           install.sh (domain as arg) + compose + cron auto-update
```

## Add an app

1. Add it to `Targets` in `backend/internal/api/status.go`.
2. Add it to `APPS` in `frontend/src/apps.ts` with the same `id`.
3. Add a 1200×750 screenshot as `frontend/public/shots/<id>.webp`.

## Develop

```bash
cd backend && go run ./cmd/server                 # :8081, serves /api/*
cd frontend && npm install && npm run dev         # :5173, proxies /api -> :8081
```

## Deploy

Push to `main` → CI tags a release, builds a multi-arch image and pushes
`ghcr.io/saavuori/homepage:latest` → the Oracle host's 5-minute cron redeploys
it. First-time setup and the Caddy/DNS details are in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Release notes:
[CHANGELOG.md](CHANGELOG.md), published at <https://saavuori.github.io/homepage/>.
