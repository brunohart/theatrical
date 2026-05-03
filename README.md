# Theatrical

### A developer platform for cinema technology

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-600%2B-brightgreen.svg)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-orange.svg)](LICENSE-BSL.md)

---

Cinema management platforms process billions in annual transaction value across thousands of sites worldwide. The APIs are mature, the documentation exists, and the infrastructure is production-grade. But the developer experience layer — typed clients, component libraries, event systems, CLI tools — does not exist yet.

**Theatrical is that layer.**

> **Independent project.** Theatrical is not affiliated with or endorsed by any cinema platform vendor. See [VISION.md](VISION.md) for full context.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Application                        │
├─────────────┬──────────────┬──────────────┬─────────────────────────┤
│  @theatrical│  @theatrical │  @theatrical │      @theatrical        │
│    /react   │  /templates  │  /analytics  │       /events           │
│  Components │  Starters    │  Horizon     │  Real-time Bridge       │
├─────────────┴──────┬───────┴──────────────┴─────────────────────────┤
│                    │          @theatrical/cli                        │
│                    │        Developer Tooling                        │
├────────────────────┴────────────────────────────────────────────────┤
│                        @theatrical/sdk                              │
│              Type-safe Client · Auth · HTTP · Resources             │
├─────────────────────────────────────────────────────────────────────┤
│                     Vista OCAPI / GAS / Horizon                     │
└─────────────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design deep-dive.

## Packages

| Package | Description | Tests | License |
|---------|-------------|-------|---------|
| [`@theatrical/sdk`](packages/sdk) | Type-safe TypeScript client — auth, HTTP, 8 resource modules, Zod validation | 274 | MIT |
| [`@theatrical/cli`](packages/cli) | Developer tools — `init`, `codegen`, `inspect` | 163 | MIT |
| [`@theatrical/react`](packages/react) | Cinema UI — SeatMap, SessionPicker, OrderSummary, PaymentForm, Loyalty | 34 | BSL 1.1 |
| [`@theatrical/analytics`](packages/analytics) | Horizon client, query builder, export utilities (CSV, JSON, DataFrame, Chart.js) | 35 | BSL 1.1 |
| [`@theatrical/events`](packages/events) | Real-time event bridge — poll, diff, emit, webhook with HMAC-SHA256 | 71 | BSL 1.1 |
| [`@theatrical/templates`](packages/templates) | React ticketing starter — complete 4-page booking app | — | BSL 1.1 |

## Quick Start

### Zero-credential mode (recommended for exploration)

```typescript
import { TheatricalClient } from '@theatrical/sdk';

// No API key needed — returns NZ cinema fixture data
const client = TheatricalClient.createMock();

const { data: films } = await client.films.nowShowing();
console.log(films[0].title); // 'The Last Projection'

const { data: sessions } = await client.sessions.list({
  siteId: 'site_embassy_wellington',
});
```

### With API credentials

```typescript
const client = TheatricalClient.create({
  apiKey: process.env.VISTA_API_KEY,
});

// Typed resources — autocomplete-driven development
const { data: sessions } = await client.sessions.list({
  siteId: 'roxy-wellington',
  date: '2026-05-03',
});

// Full booking flow
const order = await client.orders.create({
  sessionId: sessions[0].id,
  tickets: [{ type: 'adult', seatId: 'H7' }],
});
await client.orders.confirm(order.id);
```

### Real-time events

```typescript
import { BookingWatcher, WebhookDeliveryEngine } from '@theatrical/events';

const watcher = new BookingWatcher({
  fetch: (signal) => client.orders.list({}, signal),
});

watcher.on('booking.confirmed', async ({ order }) => {
  console.log(`Order ${order.id} confirmed`);
  // Trigger webhooks, update dashboards, notify staff
});

watcher.start();
```

### CLI

```bash
# Scaffold a new project
npx theatrical init my-cinema-app --template react-ticketing

# Explore API responses
npx theatrical inspect sessions list --site roxy-wellington

# Generate types from OpenAPI spec
npx theatrical codegen --spec openapi.yaml --output src/types
```

## Feature Overview

### SDK (`@theatrical/sdk`)
- **Authentication**: GAS client with automatic token refresh and concurrent deduplication
- **HTTP Client**: Retry with exponential backoff, token bucket rate limiting, request/response interceptors
- **8 Resource Modules**: Sessions, Sites, Films, Orders, Loyalty, Subscriptions, Pricing, F&B
- **Error Hierarchy**: Typed errors mapped from HTTP status + Vista error codes
- **Runtime Validation**: Zod schemas on every API response
- **Mock Mode**: `TheatricalClient.createMock()` for zero-credential development

### Events (`@theatrical/events`)
- **Poller**: AbortController-based with setTimeout-after-completion
- **DiffEngine**: Pure function change detection — added, removed, changed
- **StateStore**: In-memory with TTL support
- **4 Watchers**: Booking, Session, Film, Inventory — typed event payloads
- **Webhook Delivery**: HMAC-SHA256 signatures, exponential backoff retry, `Promise.allSettled` endpoint isolation

### Analytics (`@theatrical/analytics`)
- **HorizonClient**: OAuth-authenticated query execution with token refresh
- **QueryBuilder**: Fluent API with compile-time metric/dimension validation
- **Export Utilities**: `toCSV()`, `toJSON()`, `toDataFrame()`, `toChartData()` (Chart.js compatible)
- **AnalyticsProvider**: Strategy pattern for fan-out to Segment, Movio CDP, custom backends

### React (`@theatrical/react`)
- **SeatMap**: Interactive seat grid with ARIA grid pattern and accessibility states
- **SessionPicker**: Date-based showtime browser with grouping
- **OrderSummary**: Line items + price breakdown
- **PaymentForm**: Provider-agnostic payment shell with render slots
- **Loyalty**: MemberCard, LoyaltyBadge, TierIndicator, PointsDisplay

## Testing

```bash
# Run all SDK tests
cd packages/sdk && npx vitest run      # 274 tests

# Run events tests
cd packages/events && npx vitest run   # 71 tests

# Run CLI tests
cd packages/cli && npx vitest run      # 163 tests

# Run analytics tests
cd packages/analytics && npx vitest run # 35 tests

# Run integration tests
npx vitest run tests/integration/      # Cross-package flows

# Run benchmarks
npx tsx tests/benchmarks/sdk-performance.ts
npx tsx tests/benchmarks/events-throughput.ts
```

**600+ tests** across 45+ test files. All mock data uses real NZ cinema context: Embassy Theatre Wellington, Roxy Cinema, Rialto Auckland. NZD currency, en-NZ locale.

## Research

| Essay | Description |
|-------|-------------|
| [The Cinema Platform Thesis](research/cinema-platform-thesis.md) | Why cinema needs a developer ecosystem |
| [What Stripe Did for Payments](research/what-stripe-did-for-payments.md) | The developer experience parallel |
| [Cinema as Protocol](research/cinema-as-protocol.md) | Cinema-going as cultural infrastructure |
| [The 3.3 Billion Dollar API](research/the-3.3-billion-api.md) | Vista's scale and the developer gap |
| [Event-Driven Cinema](research/event-driven-cinema.md) | Real-time events for cinema operations |

## Development

```bash
git clone https://github.com/brunohart/theatrical.git
cd theatrical

# Install dependencies
cd packages/sdk && npm install
cd ../cli && npm install
cd ../events && npm install
cd ../analytics && npm install

# Type check
npx tsc --noEmit -p packages/sdk/tsconfig.json

# Run tests
cd packages/sdk && npx vitest run
```

## Disclaimer

Theatrical is not affiliated with, endorsed by, or officially connected to Vista Group International Limited or any of its subsidiaries. All trademarks are the property of their respective owners. See [VISION.md](VISION.md) for full context.

## License

**MIT** — `@theatrical/sdk`, `@theatrical/cli` (maximum adoption)
**BSL 1.1** — `@theatrical/events`, `@theatrical/analytics`, `@theatrical/react`, `@theatrical/templates` (commercial protection, converts to MIT after 3 years)

© 2026 [Bruno Hart](https://github.com/brunohart)
