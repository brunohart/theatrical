# Theatrical

### A developer platform for cinema technology

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-1%2C048%20passing-brightgreen.svg)](#testing)
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
│  @theatrical/sdk (TS)  │  Theatrical.Sdk (C#)  │  theatrical (Py)  │
│  Type-safe Client · Auth · HTTP · 8 Resource Modules per language   │
├─────────────────────────────────────────────────────────────────────┤
│                     Vista OCAPI / GAS / Horizon                     │
└─────────────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design deep-dive.

## Packages

| Package | Description | Tests | License |
|---------|-------------|-------|---------|
| [`@theatrical/sdk`](packages/sdk) | Type-safe TypeScript client — auth, HTTP, 8 resource modules, Zod validation | 274 | MIT |
| [`@theatrical/cli`](packages/cli) | Developer tools — `init`, `codegen`, `inspect` | 165 | MIT |
| [`@theatrical/react`](packages/react) | Cinema UI — SeatMap, SessionPicker, OrderSummary, PaymentForm, Loyalty | 34 | BSL 1.1 |
| [`@theatrical/analytics`](packages/analytics) | Horizon client, query builder, export utilities (CSV, JSON, DataFrame, Chart.js) | 35 | BSL 1.1 |
| [`@theatrical/events`](packages/events) | Real-time event bridge — poll, diff, emit, webhook with HMAC-SHA256 | 71 | BSL 1.1 |
| [`@theatrical/templates`](packages/templates) | React ticketing starter — complete 4-page booking app | — | BSL 1.1 |

### Polyglot SDKs

| SDK | Status | Install | Tests |
|-----|--------|---------|-------|
| [C# / .NET 8](packages/sdk-csharp) | Alpha | `dotnet add package Theatrical.Sdk` | 272 |
| [Python 3.10+](packages/sdk-py) | Alpha | `pip install theatrical` | 337 |

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

### C# / .NET

```csharp
using Theatrical.Sdk;

// Zero-credential mock mode
var client = TheatricalClient.CreateMock();

var films = await client.Films.NowShowingAsync();
Console.WriteLine(films[0].Title); // "The Last Projection"

var sessions = await client.Sessions.ListAsync(new SessionFilter
{
    SiteId = "site_embassy_wellington"
});
```

### Python

```python
from theatrical import TheatricalClient

# Zero-credential mock mode
client = TheatricalClient.create_mock()

films = await client.films.now_showing()
print(films[0].title)  # "The Last Projection"

sessions = await client.sessions.list(site_id="site_embassy_wellington")
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
# TypeScript
cd packages/sdk && npx vitest run        # 274 tests
cd packages/cli && npx vitest run        # 165 tests
cd packages/events && npx vitest run     # 71 tests
cd packages/analytics && npx vitest run  # 35 tests

# C# / .NET
cd packages/sdk-csharp && dotnet test    # 272 tests

# Python
cd packages/sdk-py && pytest tests/ -q   # 337 tests
```

**1,048 tests** across three languages. TypeScript: 439 (SDK 274, CLI 165). C# / .NET: 272 (xUnit). Python: 337 (pytest, mypy-strict, ruff clean). All mock data uses real NZ cinema context: Embassy Theatre Wellington, Roxy Cinema, Rialto Auckland. NZD currency, en-NZ locale.

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

# TypeScript
cd packages/sdk && npm install && npx vitest run
cd ../cli && npm install && npx vitest run

# C# (.NET 8 SDK required)
cd packages/sdk-csharp && dotnet test

# Python (3.10+ required)
cd packages/sdk-py && pip install -e ".[dev]" && pytest tests/ -q
```

## Disclaimer

Theatrical is not affiliated with, endorsed by, or officially connected to Vista Group International Limited or any of its subsidiaries. All trademarks are the property of their respective owners. See [VISION.md](VISION.md) for full context.

## License

**MIT** — `@theatrical/sdk`, `@theatrical/cli` (maximum adoption)
**BSL 1.1** — `@theatrical/events`, `@theatrical/analytics`, `@theatrical/react`, `@theatrical/templates` (commercial protection, converts to MIT after 3 years)

© 2026 [Bruno Hart](https://github.com/brunohart)
