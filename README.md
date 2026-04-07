# Theatrical

> A developer toolkit for cinema management platforms.

[![CI](https://github.com/brunohart/theatrical/actions/workflows/ci.yml/badge.svg)](https://github.com/brunohart/theatrical/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

---

Cinema management platforms power thousands of sites worldwide — but the third-party developer tooling around them is still in its infancy. No type-safe SDKs, no component libraries, no event systems, no quickstart templates.

**Theatrical fills that gap.**

> **Note:** Theatrical is an independent, community-driven project. It is not affiliated with or endorsed by any cinema platform vendor. Users are responsible for ensuring their use of underlying APIs complies with applicable terms of service.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@theatrical/sdk`](packages/sdk) | Type-safe TypeScript client for cinema platform APIs | 🔨 Building |
| [`@theatrical/cli`](packages/cli) | Developer tools — scaffold, codegen, inspect | 📋 Planned |
| [`@theatrical/react`](packages/react) | UI components — seat maps, session pickers | 📋 Planned |
| [`@theatrical/analytics`](packages/analytics) | Horizon data warehouse toolkit | 📋 Planned |
| [`@theatrical/events`](packages/events) | Real-time event bridge | 📋 Planned |
| [`@theatrical/templates`](packages/templates) | Starter project templates | 📋 Planned |

## Quick Start

```typescript
import { TheatricalClient } from '@theatrical/sdk';

const client = new TheatricalClient({
  apiKey: process.env.VISTA_API_KEY,
  environment: 'sandbox',
});

// What's showing?
const films = await client.films.nowShowing({ siteId: 'roxy-wellington' });

// Find sessions
const sessions = await client.sessions.list({
  siteId: 'roxy-wellington',
  filmId: films[0].id,
  date: '2026-04-08',
});

// Book tickets
const order = await client.orders.create({
  sessionId: sessions[0].id,
  tickets: [{ type: 'adult', seatId: 'H12' }],
});

await client.orders.confirm(order.id);
```

## Why?

Read [VISION.md](VISION.md) for the full thesis.

## Architecture

```
theatrical/
├── packages/
│   ├── sdk/           → Core API client library
│   ├── cli/           → Developer tooling
│   ├── react/         → UI component library
│   ├── analytics/     → Data & reporting tools
│   ├── events/        → Real-time event bridge
│   └── templates/     → Starter applications
├── docs/              → Documentation site
└── research/          → Industry analysis
```

Monorepo managed with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/). Each package is independently versioned and tree-shakeable.

## Development

```bash
# Clone
git clone https://github.com/brunohart/theatrical.git
cd theatrical

# Install
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Disclaimer

Theatrical is not affiliated with, endorsed by, or officially connected to Vista Group International Limited or any of its subsidiaries. All trademarks are the property of their respective owners. See [VISION.md](VISION.md) for full legal notice.

## License

Core packages (SDK, CLI): MIT © 2026 [Bruno Hart](https://github.com/brunohart)
Premium packages: [BSL 1.1](LICENSE-BSL.md)
