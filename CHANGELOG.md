# Changelog

All notable changes to Theatrical are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-01

Initial public release — the polyglot developer toolkit for cinema platform APIs.

### Added

**TypeScript (npm)**
- `@theatrical/sdk` (MIT) — type-safe client: GAS auth with token refresh, HTTP
  retry with backoff, token-bucket rate limiting, typed error hierarchy, mock
  mode, and 8 resource modules (sessions, sites, films, orders, loyalty,
  subscriptions, pricing, F&B).
- `@theatrical/cli` (MIT) — `init`, `codegen`, and `inspect` commands.
- `@theatrical/react` (BSL 1.1) — SeatMap, SessionPicker, OrderSummary,
  PaymentForm, and Loyalty components; ARIA-accessible, dark-mode-first.
- `@theatrical/events` (BSL 1.1) — polling event bridge: poll → diff → emit →
  HMAC-SHA256-signed webhooks.
- `@theatrical/analytics` (BSL 1.1) — Horizon client, fluent query builder, and
  CSV/JSON/DataFrame/Chart.js exports.

**C# (NuGet)**
- `Theatrical.Sdk` (.NET 8, MIT) — type-safe client with auth, retry, rate
  limiting, and mock mode.

**Python (PyPI)**
- `theatrical` (3.10+, MIT) — async-first client built on httpx + pydantic v2.

### Engineering
- All TypeScript packages ship dual ESM + CJS builds with type declarations.
- Webhook signature verification uses constant-time comparison
  (`crypto.timingSafeEqual`).
- 1,000+ tests across the three languages; mock data uses real NZ cinema
  fixtures.

[0.1.0]: https://github.com/brunohart/theatrical/releases/tag/v0.1.0
