# react-ticketing

A complete cinema ticketing application built with `@theatrical/sdk` and `@theatrical/react`.

Demonstrates the full booking flow: film discovery → session selection → seat map → order summary → payment.

## Quick Start

```bash
# Clone
git clone https://github.com/brunohart/theatrical.git
cd theatrical/packages/templates/react-ticketing

# Install
npm install

# Run in mock mode (no API key required)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Mock Mode

The template ships in mock mode by default (`VITE_THEATRICAL_MOCK=true`). This uses `TheatricalClient.createMock()` — a fully offline client with pre-loaded NZ cinema fixture data.

To connect to a real Vista API:

```bash
cp .env.example .env
# Edit .env: set VITE_THEATRICAL_MOCK=false and VITE_THEATRICAL_API_KEY=your_key
npm run dev
```

## Architecture

```
src/
├── context/BookingContext.tsx  # useReducer state: film → session → seats → order → member
├── pages/
│   ├── Home.tsx           # Film grid (nowShowing)
│   ├── Film.tsx           # SessionPicker for a film
│   ├── Booking.tsx        # SeatMap + seat selection
│   └── Confirmation.tsx   # OrderSummary + MemberCard + PaymentForm
└── App.tsx                # Router, TheatricalThemeProvider, BookingProvider
```

## Components Used

| Component | Package | Page |
|-----------|---------|------|
| `SessionPicker` | `@theatrical/react` | Film |
| `SeatMap` | `@theatrical/react` | Booking |
| `OrderSummary` | `@theatrical/react` | Confirmation |
| `PaymentForm` | `@theatrical/react` | Confirmation |
| `MemberCard` | `@theatrical/react` | Confirmation |
| `LoyaltyBadge` | `@theatrical/react` | Confirmation |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brunohart/theatrical/tree/main/packages/templates/react-ticketing)

Or via CLI from the repo root:

```bash
cd packages/templates/react-ticketing
npx vercel --prod
```
