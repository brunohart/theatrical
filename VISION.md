# Theatrical

### A developer platform for cinema technology

---

Cinema technology sits at an inflection point. The platforms that power the world's theatres — the systems behind every ticket sold, every seat reserved, every concession ordered — process billions in transactions annually. They are sophisticated, battle-tested, and architecturally mature.

And yet, the third-party developer ecosystem around them remains in its earliest stages.

The cinema management platforms that serves thousands of sites globally have built developer portals, published API documentation, and laid the infrastructure for ecosystem development. The opportunity is enormous — but the tooling layer that makes it easy to build on these platforms barely exists.

Stripe has 400+ open source repositories. Twilio maintains SDKs in seven languages. Shopify built an entire app store on their developer toolkit. These companies understood something fundamental — a platform is only as valuable as what people build on top of it.

Cinema's developer ecosystem deserves the same foundation.

**Theatrical exists to provide it.**

---

## What Theatrical Is

Theatrical is an independent, community-built developer toolkit for cinema management platforms. It provides the developer experience layer — type-safe clients, UI components, tooling — that turns API documentation into something you can build with in an afternoon.

Theatrical is not affiliated with, endorsed by, or officially connected to any cinema software vendor. It is an independent open-source project.

**`@theatrical/sdk`** — Type-safe TypeScript/JavaScript client library for cinema platform APIs. Sessions, sites, films, orders, loyalty, subscriptions, pricing, F&B. Zod runtime validation. Retry logic. Rate limit awareness.

**`@theatrical/cli`** — Developer tooling. Scaffold projects, generate types from OpenAPI specs, explore API responses interactively.

**`@theatrical/react`** — Pre-built, themeable UI components for common cinema patterns. Seat maps, session pickers, order summaries, loyalty badges. The building blocks for any cinema-facing application.

**`@theatrical/analytics`** — A typed interface to cinema data warehouses. Query builders, export utilities, charting data preparation.

**`@theatrical/events`** — Real-time event capabilities for cinema platforms. A polling-based event bridge that detects state changes and delivers typed webhooks. Booking notifications. Session updates. Inventory alerts.

**`@theatrical/templates`** — Complete, working starter applications. A white-label ticketing site. A cinema booking app. A kiosk interface. An analytics dashboard. Deploy in minutes, customise from there.

---

## Why This Matters

Cinema isn't just a venue. It's a protocol for shared cultural experience — the architecture behind the ritual of gathering in a darkened room to feel something together. The technology that serves this protocol should be as thoughtful as the experiences it enables.

Today, every cinema that wants a custom digital experience has to start from scratch: read raw API docs, hand-build request types, figure out authentication flows, solve the same problems every other integrator has already solved. The barrier to building on cinema platforms isn't technical capability — it's developer experience.

Theatrical lowers that barrier to zero.

When building on cinema platforms is easy, more people build. When more people build, the ecosystem grows. When the ecosystem grows, the platform becomes more valuable — for platform vendors, for cinema operators, for the audiences who ultimately benefit from better technology serving the spaces they love.

This is the flywheel that hasn't started spinning yet.

---

## Architecture

Theatrical is structured as a monorepo with independent, tree-shakeable packages. Use the whole toolkit or pick the pieces you need.

```
theatrical/
├── packages/
│   ├── sdk/           → Core API client
│   ├── cli/           → Developer tools
│   ├── react/         → UI components
│   ├── analytics/     → Data & reporting
│   ├── events/        → Real-time event bridge
│   └── templates/     → Starter applications
├── docs/              → Documentation site
├── research/          → Industry analysis
└── examples/          → Working demos
```

Every package is independently versioned, fully typed, comprehensively tested, and documented with JSDoc. The SDK models the cinema domain — sessions, sites, films, orders, members — so the type system itself teaches you how the platform works.

---

## Getting Started

```bash
# Install the SDK
npm install @theatrical/sdk

# Or scaffold a complete project
npx @theatrical/cli init my-cinema-app
```

```typescript
import { TheatricalClient } from '@theatrical/sdk';

const client = new TheatricalClient({
  apiKey: process.env.VISTA_API_KEY,
  environment: 'sandbox',
});

// Browse what's showing
const films = await client.films.nowShowing({ siteId: 'roxy-wellington' });

// Find sessions
const sessions = await client.sessions.list({
  siteId: 'roxy-wellington',
  filmId: films[0].id,
  date: '2026-04-08',
});

// Check availability
const seats = await client.sessions.availability(sessions[0].id);

// Book tickets
const order = await client.orders.create({
  sessionId: sessions[0].id,
  tickets: [
    { type: 'adult', seatId: 'H12' },
    { type: 'adult', seatId: 'H13' },
  ],
});

await client.orders.confirm(order.id);
```

---

## Who Built This

[Bruno Hart](https://github.com/brunohart) — interaction designer & engineer.

This project grew from a simple observation: the cinema industry's most important platform has no developer ecosystem. That gap isn't just a missing feature — it's a missing foundation. Theatrical is an attempt to lay it.

---

## Contributing

Theatrical welcomes contributions. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

---

## Legal Notice

Theatrical is an independent, community-driven open-source project. It is **not** affiliated with, endorsed by, sponsored by, or officially connected to Vista Group International Limited, Vista Entertainment Solutions Limited, or any of their subsidiaries or affiliates.

"Vista", "Vista Group", "Vista Cloud", "OCAPI", "Movio", "Maccs", "Flicks", "Veezi", "Horizon", "Numero", and "Powster" are trademarks or registered trademarks of Vista Group International Limited and/or its affiliates. All other trademarks are the property of their respective owners.

Theatrical uses publicly documented APIs in accordance with their published documentation. Users of Theatrical are responsible for ensuring their own use complies with any applicable terms of service, API agreements, and licensing requirements of the underlying platform providers.

This software is provided "as is" without warranty. See [LICENSE](LICENSE) for details.

---

## License

Core packages (SDK, CLI): MIT © 2026 Bruno Hart
Premium packages (Events, Analytics, React, Templates): [BSL 1.1](LICENSE-BSL.md)
