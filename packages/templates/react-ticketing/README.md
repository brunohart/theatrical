# react-ticketing

A living cinema booking demo built on `@theatrical/events`.

A request-response API hands you a photograph. This app runs a cinema whose state genuinely changes — seats sell, sessions sell out, orders confirm — and the real `BookingWatcher` and `SessionWatcher` from the published `@theatrical/events` package poll it, diff it, and emit the typed event stream that drives the UI. The interface listens to the pulse, not the photo.

Three pages: programme → seat selection → confirmation.

## Quick Start

```bash
# Scaffold with the CLI
npx @theatrical/cli init my-cinema --template react-ticketing
cd my-cinema

# Install and run — no API key, no configuration
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Or run it from the monorepo:

```bash
git clone https://github.com/brunohart/theatrical.git
cd theatrical/packages/templates/react-ticketing
npm install && npm run dev
```

## Architecture

```
src/
├── lib/cinema.ts          # The living cinema — simulated state + real
│                          #   @theatrical/events watchers (poll → diff → emit)
├── pages/
│   ├── Seats.tsx          # Seat map + selection for a session
│   └── Confirmation.tsx   # Booking confirmation
├── components/            # Chrome, Poster, Timeboard, MissionControl, CodeSeam
├── App.tsx                # Router + Home programme grid
└── theme.ts               # Design tokens
```

Routes: `/` (programme) → `/book/:sessionId` (seats) → `/done` (confirmation).

## What it demonstrates

| Capability | Package |
|------------|---------|
| `BookingWatcher` — typed `booking.confirmed` events from polled order state | `@theatrical/events` |
| `SessionWatcher` — `session.soldout` detection via state diffing | `@theatrical/events` |
| Event-driven UI — the timeboard and mission control react to the stream | — |

The watchers are the published package, unmodified — the same poll → diff → emit
pipeline you would point at a real cinema platform API.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brunohart/theatrical/tree/main/packages/templates/react-ticketing)

Or via CLI:

```bash
cd packages/templates/react-ticketing
npx vercel --prod
```
