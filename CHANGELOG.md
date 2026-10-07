# saavuori.live Changelog

All notable changes to this project are documented here. The version headings
match the tags CI generates on each push to `main`.

## [v0.0.4] - 2026-10-07

### Added
- **FingridFlow Live** on the board and in the app list: Finland's power system
  live and every Fingrid open dataset, at fingrid.saavuori.live.

## [v0.0.1] - 2026-10-06

### Added
- **Homepage for saavuori.live** listing the published apps: HSL Live,
  Fintraffic LIVE and finstats, each with a screenshot, what it does, where its
  data comes from, and links to the app, its source and its changelog.
- **Live status board**: a dot-matrix departure board that shows whether each
  app is answering and how fast, plus its current version where the app
  reports one. The server checks every app once a minute.
- **Light and dark themes**: an explicit toggle, remembered across visits.
- **CI/CD**: push to `main` tags a release, builds a multi-arch image and pushes
  it to GHCR; the Oracle host redeploys within five minutes via cron.
