# react-ticketing

A complete cinema booking app starter template built with `@theatrical/sdk` and `@theatrical/react`.

## What's included

- **Home** — Film grid with now-showing titles
- **Film** — Film details with `SessionPicker` component for date/time selection
- **Booking** — Interactive `SeatMap` with real-time `OrderSummary` and pricing
- **Confirmation** — Booking reference display

## Quick start

```bash
theatrical init --template react-ticketing my-cinema-app
cd my-cinema-app
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env.local` and set your credentials:

```env
VITE_THEATRICAL_API_KEY=your_api_key
VITE_THEATRICAL_SITE_ID=your_site_id
VITE_MOCK_MODE=false       # set to "true" to run with mock data (no API key needed)
```

To get an API key, sign up at [theatrical.dev](https://theatrical.dev) and create a project.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrunohart%2Ftheatrical%2Ftree%2Fmain%2Fpackages%2Ftemplates%2Freact-ticketing)

Set the following environment variables in your Vercel project:

| Variable | Description |
|---|---|
| `VITE_THEATRICAL_API_KEY` | Your Theatrical API key |
| `VITE_THEATRICAL_SITE_ID` | The site/cinema ID to display |
| `VITE_MOCK_MODE` | Set to `true` to use mock data |

## Customization

### Theming

Wrap your app in `TheatricalThemeProvider` and override tokens:

```tsx
import { TheatricalThemeProvider } from '@theatrical/react';

<TheatricalThemeProvider theme={{ colors: { primary: '#your-brand-color' } }}>
  <App />
</TheatricalThemeProvider>
```

### Connecting to a live API

Replace calls in `src/data/mock.ts` with real SDK calls:

```ts
import { TheatricalClient } from '@theatrical/sdk';

const client = new TheatricalClient({
  apiKey: import.meta.env.VITE_THEATRICAL_API_KEY,
  environment: 'production',
});

const films = await client.films.nowShowing({
  siteId: import.meta.env.VITE_THEATRICAL_SITE_ID,
});
```

### Adding payment processing

Replace the mock confirmation in `Booking.tsx` with a real payment flow (Stripe, etc.) before
calling `confirm()` on the booking context.

## Project structure

```
src/
  App.tsx              # Root — router, nav, TheatricalThemeProvider
  main.tsx             # React entry point
  context/
    BookingContext.tsx  # useReducer state: film → session → seats → confirmation
  data/
    mock.ts            # Mock films, sessions, and seat maps
  pages/
    Home.tsx           # Film grid
    Film.tsx           # SessionPicker
    Booking.tsx        # SeatMap + OrderSummary
    Confirmation.tsx   # Booking reference
```

## License

BSL 1.1 — See [LICENSE-BSL.md](../../LICENSE-BSL.md)
