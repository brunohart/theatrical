# Architecture

> System design deep-dive for the Theatrical developer platform.

---

## System Overview

Theatrical is a six-package monorepo that provides the developer experience layer for cinema management platform APIs. The architecture is designed around three principles: **type safety as a contract**, **composability over coupling**, and **progressive complexity** — a developer should be able to make their first API call in five minutes and build a production booking system in an afternoon.

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

Every package above the SDK depends on it. The SDK depends on nothing except `zod` for runtime validation. This inverted dependency tree means the SDK can be used standalone — the React components, CLI, analytics, and events packages are additive layers.

---

## Package Architecture

### `@theatrical/sdk` — The Foundation

The SDK is the gravity centre of the system. It provides:

- **Authentication**: GAS (Global Auth Service) client with automatic token refresh and concurrent deduplication
- **HTTP Client**: Retry logic with exponential backoff, rate limiting via token bucket, request/response interceptors
- **Resource Modules**: Typed methods for every Vista OCAPI endpoint — sessions, sites, films, orders, loyalty, subscriptions, pricing, F&B
- **Error Hierarchy**: Typed error classes mapped from HTTP status codes and Vista error codes
- **Runtime Validation**: Zod schemas for every API response, catching malformed data at the boundary

```
packages/sdk/
├── src/
│   ├── auth/           # GAS client, token manager
│   ├── http/           # HTTP client, retry, rate limiter, interceptors
│   ├── resources/      # sessions, sites, films, orders, loyalty, ...
│   ├── errors/         # typed error hierarchy + response parser
│   ├── types/          # Zod schemas → z.infer types
│   ├── mock/           # FixtureTransport for offline development
│   └── client.ts       # TheatricalClient entry point
└── tests/              # 274 tests across 16 files
```

**Key design decision**: Types are derived from Zod schemas via `z.infer<typeof schema>`, not maintained as parallel interfaces. This eliminates type drift between what the schema validates and what TypeScript believes the shape is.

**Mock mode**: `TheatricalClient.createMock()` returns a fully functional client backed by in-memory NZ cinema fixture data. Zero API key required. This is the zero-friction onboarding path — every quickstart begins here.

### `@theatrical/cli` — Developer Tooling

Commander.js-based CLI with three commands:

- **`theatrical init`** — Scaffold a new project with SDK dependency, config files, and template selection
- **`theatrical codegen`** — Generate TypeScript types and Zod schemas from an OpenAPI specification
- **`theatrical inspect`** — Interactive API explorer with syntax-highlighted output and timing

Config management follows a split architecture: global credentials in `~/.config/theatrical/config.json`, project-scoped settings via cosmiconfig.

### `@theatrical/react` — Component Library

Cinema-inspired React components with a dark-mode-first design language:

- **SeatMap** — Interactive seat selection grid with ARIA grid pattern (`role="gridcell"`, `aria-selected`), keyboard navigation, and accessibility states (wheelchair, companion)
- **SessionPicker** — Date-based showtime browser with horizontal scrolling and session grouping
- **OrderSummary** — Booking review with line items and price breakdown
- **PaymentForm** — Provider-agnostic payment shell with render-slot pattern for drop-in SDKs
- **LoyaltyBadge / MemberCard** — Tier display with animated points counter

Design tokens use CSS custom properties with a cinema-themed palette: deep blacks, warm golds, cool blues. The `TheatricalThemeProvider` supports per-namespace deep merging — overriding a single colour token does not wipe the rest.

Build: tsup with ESM + CJS dual output and `.d.ts` declarations.

### `@theatrical/analytics` — Horizon Client

Typed interface to cinema data warehouses:

- **HorizonClient** — OAuth-authenticated query execution with automatic token refresh
- **QueryBuilder** — Fluent, type-safe query construction with conditional types preventing invalid metric/dimension combinations (e.g., `'source'` is not a valid dimension for `'occupancy'`)
- **Export Utilities** — `toCSV()`, `toJSON()`, `toDataFrame()`, `toChartData()` — Chart.js-compatible output
- **AnalyticsProvider** — Strategy pattern interface for fan-out to multiple analytics backends (Segment, Movio CDP, custom webhooks) via `Promise.allSettled`

### `@theatrical/events` — Real-time Event Bridge

Vista has no real-time event system. This package fills the gap:

```
┌──────────┐     ┌────────────┐     ┌────────────┐     ┌──────────────┐
│  Poller  │────▶│ DiffEngine │────▶│ StateStore │────▶│ EventEmitter │
│ (fetch)  │     │ (compare)  │     │ (persist)  │     │ (dispatch)   │
└──────────┘     └────────────┘     └────────────┘     └──────┬───────┘
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │ WebhookDelivery   │
                                                    │ (HMAC + retry)    │
                                                    └───────────────────┘
```

**Poller**: AbortController-based polling with `setTimeout`-after-completion (not `setInterval`) to prevent request overlap on slow APIs. Configurable intervals per resource type.

**DiffEngine**: Pure function `diff<T extends { id: string }>(current, previous)` returning `DiffEvent<T>[]` with `type: 'added' | 'removed' | 'changed'`. No side effects, independently testable.

**StateStore**: In-memory Map with optional TTL support. `get()` returns `undefined` and deletes expired entries. Ensures the event bridge does not serve stale state after a polling gap.

**TypedEventEmitter**: Extends Node's `EventEmitter` with generic type constraints. `emit<K>(event: K, payload: Events[K])` — TypeScript catches emit calls with wrong payload shapes at compile time.

**Watchers**: `BookingWatcher`, `SessionWatcher`, `FilmWatcher`, `InventoryWatcher` — each extends `BaseWatcher` which wires Poller + DiffEngine + StateStore + TypedEventEmitter into a single `start()`/`stop()` lifecycle.

**Webhook Delivery**: HMAC-SHA256 signed payloads (`X-Theatrical-Signature: sha256=<hex>`), exponential backoff retry, `Promise.allSettled` for endpoint isolation — one failing endpoint never blocks another.

### `@theatrical/templates` — Starter Applications

The `react-ticketing` template is a complete cinema booking app:

- 4-page booking flow: Home → Film → Booking → Confirmation
- `BookingContext` with `useReducer` state machine carrying the full funnel
- `TheatricalClient.createMock()` for zero-credential onboarding
- `VITE_THEATRICAL_MOCK` env toggle for SDK/mock switching

---

## Type System Philosophy

Types flow from the bottom up. The SDK defines Zod schemas as the single source of truth:

```typescript
export const sessionSchema = z.object({
  id: z.string(),
  filmId: z.string(),
  // ...
});
export type Session = z.infer<typeof sessionSchema>;
```

This pattern has three properties:
1. **Runtime validation** — malformed API responses throw `ZodError` at the boundary
2. **Type inference** — TypeScript types are derived, not duplicated
3. **Single source of truth** — no drift between schema and type

Resource modules use `.parse()` on every API response, creating a validated boundary between the untrusted network and the typed application layer.

---

## Error Handling Architecture

```
HTTP Response
     │
     ▼
parseErrorResponse(response)
     │
     ├── 400 → ValidationError { fields, vistaCode }
     ├── 401 → AuthenticationError (triggers token refresh)
     ├── 403 → AuthorizationError
     ├── 404 → NotFoundError { resourceId }
     ├── 409 → ConflictError (seat selection conflicts)
     ├── 429 → RateLimitError { retryAfter } (HTTP-date & delta-seconds)
     ├── 5xx → ServerError
     └── ??? → TheatricalError (generic fallback)
```

All errors extend `TheatricalError`, which carries `statusCode`, `requestId`, and optional `vistaCode` for platform-specific diagnostics. The HTTP client retries `RateLimitError` (using `retryAfter` for delay) and `ServerError` (using exponential backoff). The `401` token-refresh path runs as a one-shot retry before the general retry loop.

---

## Security Model

- **Authentication**: GAS bearer tokens with automatic refresh. Tokens are never logged or included in error messages.
- **Webhook signatures**: HMAC-SHA256 over the raw JSON body using a per-endpoint shared secret. Recipients verify with constant-time comparison to prevent timing attacks.
- **Dual licensing**: MIT for `sdk` and `cli` (maximum adoption), BSL 1.1 for `events`, `analytics`, `react`, and `templates` (commercial protection). The BSL converts to MIT after 3 years.
- **No credentials in code**: Config management splits global credentials from project config. `.env.example` files document required variables without containing actual secrets.

---

## Testing Strategy

| Layer | Tests | Approach |
|-------|-------|----------|
| SDK | 274 | Unit tests with mocked fetch, Zod rejection tests, error parsing |
| CLI | 163 | Command parsing, config management, formatter output |
| React | 34 | Component rendering, interaction logic, accessibility |
| Analytics | 35 | OAuth flow, query builder, export utilities |
| Events | 71 | Poller lifecycle, diff engine, watcher events, webhook delivery |
| Integration | 27+ | Cross-package flows: SDK → Events → Webhook |

Total: **600+ tests** across 45+ test files.

Mock data uses real NZ cinema context throughout: Embassy Theatre Wellington, Roxy Cinema, Rialto Auckland. Real film titles, realistic session times, NZD currency, en-NZ locale.

---

## Build & Package

- **Monorepo**: npm workspaces with `packages/*` convention
- **TypeScript**: 5.9.3, strict mode, ESNext target
- **Test runner**: Vitest 1.6.1 (fast, ESM-native, compatible with fake timers)
- **Bundler**: tsup for library packages (ESM + CJS dual output with `.d.ts`)
- **CI**: GitHub Actions (lint, typecheck, test across all packages)

Each package publishes independently to npm. The `exports` map in each `package.json` provides ESM (`import`), CJS (`require`), and TypeScript declarations (`types`) entry points.

---

## What This Architecture Enables

A cinema operator using Vista's platform can go from zero to a working custom booking interface in three steps:

```bash
npx theatrical init my-cinema --template react-ticketing
cd my-cinema
npm run dev
```

The mock client provides immediate feedback. When ready to connect to Vista's API:

```typescript
const client = TheatricalClient.create({ apiKey: process.env.VISTA_API_KEY });
const { data: films } = await client.films.nowShowing({ siteId: 'my-site' });
```

For real-time operations:

```typescript
const watcher = new BookingWatcher({
  fetch: (signal) => client.orders.list({}, signal),
});
watcher.on('booking.confirmed', async ({ order }) => {
  await webhookEngine.deliverAll(endpoints, 'booking.confirmed', order);
});
watcher.start();
```

The architecture treats the Vista API as a data source and Theatrical as the developer experience layer. Every design decision optimises for the moment a cinema developer opens the README and decides whether this project is worth their time.
