<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/banner.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/public/banner.svg">
    <img src="docs/public/banner.svg" width="720" alt="Theatrical — the developer platform for cinema technology" />
  </picture>
</p>

<p align="center">
  Polyglot SDKs, CLI tools, UI components, real-time events, and analytics<br/>
  for cinema platform APIs — in TypeScript, C#, and Python.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="https://docs.theatrical.dev">Docs</a> &middot;
  <a href="https://theatrical-demo.vercel.app">Live Demo</a> &middot;
  <a href="ARCHITECTURE.md">Architecture</a> &middot;
  <a href="#research">Research</a> &middot;
  <a href="https://theatrical.dev">Website</a>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-D4622B.svg?style=flat-square&labelColor=1B2D4F" alt="TypeScript" /></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-8.0-D4622B.svg?style=flat-square&labelColor=1B2D4F" alt=".NET" /></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10+-D4622B.svg?style=flat-square&labelColor=1B2D4F" alt="Python" /></a>
  <a href="#testing"><img src="https://img.shields.io/badge/tests-1%2C048%20passing-D4622B.svg?style=flat-square&labelColor=1B2D4F" alt="Tests" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20%2F%20BSL%201.1-D4622B.svg?style=flat-square&labelColor=1B2D4F" alt="License" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@theatrical/sdk"><img src="https://img.shields.io/npm/v/@theatrical/sdk?style=flat-square&labelColor=1B2D4F&color=D4622B&label=npm%20%40theatrical%2Fsdk" alt="npm" /></a>
  <a href="https://pypi.org/project/theatrical/"><img src="https://img.shields.io/pypi/v/theatrical?style=flat-square&labelColor=1B2D4F&color=D4622B&label=pypi%20theatrical" alt="PyPI" /></a>
  <a href="https://www.nuget.org/packages/Theatrical.Sdk"><img src="https://img.shields.io/nuget/v/Theatrical.Sdk?style=flat-square&labelColor=1B2D4F&color=D4622B&label=nuget%20Theatrical.Sdk" alt="NuGet" /></a>
</p>

<br/>

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

Cinema platforms process billions in annual transaction value. The APIs are production-grade. The developer ecosystem around them is not. No typed clients. No component libraries. No event systems. Every integrator starts from scratch.

**Theatrical is the missing developer experience layer.**

> **Independent project.** Theatrical is not affiliated with or endorsed by any cinema platform vendor. See [VISION.md](VISION.md) for full context.

## Quick Start

Start building in 30 seconds — no API credentials required:

<table>
<tr><th>TypeScript</th><th>C#</th><th>Python</th></tr>
<tr>
<td>

```typescript
import { TheatricalClient } from '@theatrical/sdk';

const client = TheatricalClient.createMock();

const films = await client.films.nowShowing();
const { sessions } = await client.sessions.list({
  siteId: 'site_embassy_wellington',
});

const order = await client.orders.create({
  sessionId: sessions[0].id,
  tickets: [{ type: 'adult', seatId: 'H7' }],
});
```

</td>
<td>

```csharp
using Theatrical.Sdk;
using Theatrical.Sdk.Types;

var client = TheatricalClient.CreateMock();

var films = await client.Films.NowShowingAsync();
var sessions = await client.Sessions.ListAsync(
    new SessionFilter
    {
        SiteId = "site_embassy_wellington"
    });
```

</td>
<td>

```python
from theatrical import TheatricalClient
from theatrical.types import SessionFilter

client = TheatricalClient.create_mock()

films = await client.films.now_showing()
result = await client.sessions.list(
    SessionFilter(site_id="site_embassy_wellington")
)
```

</td>
</tr>
<tr>
<td><code>npm install @theatrical/sdk</code></td>
<td><code>dotnet add package Theatrical.Sdk</code></td>
<td><code>pip install theatrical</code></td>
</tr>
</table>

Mock mode returns real NZ cinema fixture data — Embassy Theatre Wellington, Roxy Cinema, Rialto Auckland — so you can build and test complete flows without API access.

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Your Application                                │
├──────────────┬───────────────┬───────────────┬──────────────────────────┤
│  @theatrical │  @theatrical  │  @theatrical  │      @theatrical         │
│    /react    │  /templates   │  /analytics   │       /events            │
│  Components  │  Starters     │  Horizon      │  Real-time Bridge        │
├──────────────┴───────┬───────┴───────────────┴──────────────────────────┤
│                      │         @theatrical/cli                          │
│                      │    init · codegen · inspect                      │
├──────────────────────┴──────────────────────────────────────────────────┤
│  @theatrical/sdk (TS)  │  Theatrical.Sdk (C#)  │  theatrical (Python)  │
│         Auth · HTTP · Retry · Rate Limiting · 8 Resources               │
├─────────────────────────────────────────────────────────────────────────┤
│                   Cinema Platform API Layer                              │
└─────────────────────────────────────────────────────────────────────────┘
```

Six packages. Three languages. One API surface. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

## Packages

### Core SDKs

Every SDK provides the same capabilities: GAS authentication with token refresh, HTTP retry with exponential backoff, token-bucket rate limiting, typed error hierarchy, and mock mode for zero-credential development.

| Package | Language | Tests | Install |
|---------|----------|-------|---------|
| [`@theatrical/sdk`](packages/sdk) | TypeScript 5.9 | 274 | `npm install @theatrical/sdk` |
| [`Theatrical.Sdk`](packages/sdk-csharp) | C# / .NET 8 | 276 | `dotnet add package Theatrical.Sdk` |
| [`theatrical`](packages/sdk-py) | Python 3.10+ | 339 | `pip install theatrical` |

**8 resource modules** per SDK: Sessions, Sites, Films, Orders, Loyalty, Subscriptions, Pricing, F&B.

### Developer Tools

| Package | Description | Tests | License |
|---------|-------------|-------|---------|
| [`@theatrical/cli`](packages/cli) | Scaffold projects, generate types from OpenAPI, explore APIs interactively | 165 | MIT |
| [`@theatrical/react`](packages/react) | SeatMap, SessionPicker, OrderSummary, PaymentForm, Loyalty — ARIA accessible, dark-mode-first | 57 | BSL 1.1 |
| [`@theatrical/events`](packages/events) | Real-time event bridge: poll → diff → emit → webhook (HMAC-SHA256 signed) | 71 | BSL 1.1 |
| [`@theatrical/analytics`](packages/analytics) | Horizon client, fluent query builder, export to CSV/JSON/DataFrame/Chart.js | 72 | BSL 1.1 |
| [Starter templates](packages/templates) | React ticketing starter — 4-page booking app, scaffolded via `npx @theatrical/cli init` | — | BSL 1.1 |

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

## What Makes This Different

### Real-time events from request-response APIs

Cinema platforms don't have webhooks. Theatrical builds them:

```typescript
import { BookingWatcher } from '@theatrical/events';

const watcher = new BookingWatcher({
  fetch: (signal) => client.orders.list({}, signal),
});

watcher.on('booking.confirmed', async ({ order }) => {
  // Triggered when order state changes to 'confirmed'
  await notifyStaff(order);
  await updateDashboard(order);
});

watcher.start();
```

The event bridge polls, diffs state changes, and delivers typed webhooks with HMAC-SHA256 signatures. One failing endpoint doesn't block the others (`Promise.allSettled` isolation).

### CLI that teaches the platform

```bash
# Scaffold a new project with everything wired up
npx @theatrical/cli init my-cinema-app --template react-ticketing

# Explore any API endpoint interactively
npx @theatrical/cli inspect sessions list --site roxy-wellington

# Generate types from an OpenAPI spec
npx @theatrical/cli codegen --spec openapi.yaml --output src/types
```

### Components that know cinema

Pre-built React components for the patterns every cinema app needs:

- **SeatMap** — interactive seat grid with ARIA keyboard navigation, wheelchair and companion markers
- **SessionPicker** — date-grouped showtime browser
- **OrderSummary** — line items, price breakdowns, loyalty points
- **PaymentForm** — provider-agnostic shell with render slots
- **Loyalty** — MemberCard, TierIndicator, PointsDisplay with animations

Dark-mode-first. Fully themeable via design tokens.

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

## Testing

**1,254 tests** across three languages:

```
TypeScript    639 tests    SDK 274 · CLI 165 · Events 71 · React 57 · Analytics 72
C# / .NET     276 tests    xUnit
Python        339 tests    pytest · mypy-strict · ruff
```

All mock data uses real NZ cinema context — Embassy Theatre Wellington, Roxy Cinema Wellington, Rialto Auckland. NZD currency, `en-NZ` locale. The fixture data tells a story, not `test-1` and `site-abc`.

<p align="center"><img src="docs/public/divider.svg" width="480" alt="" /></p>

## Research

Five essays on the architecture and economics of cinema platform technology:

| Essay | Question |
|-------|----------|
| [The Cinema Platform Thesis](research/cinema-platform-thesis.md) | Why does cinema need a developer ecosystem? |
| [What Stripe Did for Payments](research/what-stripe-did-for-payments.md) | What can cinema learn from the Stripe playbook? |
| [Cinema as Protocol](research/cinema-as-protocol.md) | What happens when we treat cinema-going as infrastructure? |
| [The 3.3 Billion Dollar API](research/the-3.3-billion-api.md) | What's the developer opportunity in cinema's transaction volume? |
| [Event-Driven Cinema](research/event-driven-cinema.md) | How do you build real-time on top of request-response? |

Available as web pages at [theatrical.dev/essays](https://theatrical.dev/essays/) with RSS.

## Development

```bash
git clone https://github.com/brunohart/theatrical.git
cd theatrical

# TypeScript — SDK + CLI
cd packages/sdk && npm install && npx vitest run
cd ../cli && npm install && npx vitest run

# C# — requires .NET 8 SDK
cd packages/sdk-csharp && dotnet test

# Python — requires 3.10+
cd packages/sdk-py && pip install -e ".[dev]" && pytest tests/ -q
```

## Disclaimer

Theatrical is not affiliated with, endorsed by, or officially connected to Vista Group International Limited or any of its subsidiaries. All trademarks are the property of their respective owners. See [VISION.md](VISION.md) for full context.

## License

| Packages | License | Why |
|----------|---------|-----|
| `@theatrical/sdk`, `@theatrical/cli`, `Theatrical.Sdk`, `theatrical` (Python) | **MIT** | Maximum adoption |
| `@theatrical/events`, `@theatrical/analytics`, `@theatrical/react`, starter templates | **BSL 1.1** | Commercial protection, converts to MIT after 3 years |

© 2026 [Bruno Hart](https://github.com/brunohart)
