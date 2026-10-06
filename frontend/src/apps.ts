// The published apps, in board order. `id` is the join key with the backend's
// probe list (backend/internal/api/status.go `Targets`) — adding an app means
// adding it in both places, plus a 16:10 screenshot in public/shots/<id>.webp.

export interface App {
  id: string
  name: string
  /** Upper-case label for the dot-matrix board; keep it short. */
  boardName: string
  url: string
  tagline: string
  features: string[]
  /** Where the data comes from, in the publisher's own words. */
  data: string
  repo: string
  changelog: string
}

export const APPS: App[] = [
  {
    id: 'hsl',
    name: 'HSL Live',
    boardName: 'HSL LIVE',
    url: 'https://hsl.saavuori.live',
    tagline:
      'Every tram, bus, metro, commuter train and ferry in Helsinki, moving on the map in real time.',
    features: [
      'Plan a trip and follow the vehicles you will actually ride, with a countdown to your stop',
      'See trams ask traffic lights for priority, and whether the junction says yes',
      'Spot bunched trams and the gaps they leave, or replay the past week of tram movement',
    ],
    data: 'HSL real-time vehicle feed and Digitransit',
    repo: 'https://github.com/Saavuori/ratikka',
    changelog: 'https://saavuori.github.io/ratikka/',
  },
  {
    id: 'liikenne',
    name: 'Fintraffic LIVE',
    boardName: 'FINTRAFFIC',
    url: 'https://liikenne.saavuori.live',
    tagline: 'Ships, trains and road traffic across Finland on one live map.',
    features: [
      'Track the ships on the Baltic by AIS, with their trails and a replay of the whole fleet',
      'Follow every train with GPS, its delay, and live departure boards for each station',
      'Read road speeds against each road’s normal flow, plus road works, cameras and EV chargers',
    ],
    data: 'Fintraffic Digitraffic open data',
    repo: 'https://github.com/Saavuori/Fintraffic',
    changelog: 'https://saavuori.github.io/Fintraffic/',
  },
  {
    id: 'finstat',
    name: 'finstats',
    boardName: 'FINSTATS',
    url: 'https://finstat.saavuori.live',
    tagline:
      'Search all of Statistics Finland’s open tables and turn any of them into a chart or a municipality map.',
    features: [
      'Search or browse thousands of StatFin tables on population, economy, housing and more',
      'Pick values from controls generated from each table’s own metadata',
      'Map any regional table across Finland’s 300+ municipalities',
    ],
    data: 'Statistics Finland StatFin database, CC BY 4.0',
    repo: 'https://github.com/Saavuori/FinStats',
    changelog: 'https://saavuori.github.io/FinStats/',
  },
]

export const host = (url: string) => new URL(url).host
