# Changelog

All notable changes to Theatrical are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security
- `@theatrical/sdk` — every ID interpolated into a request path is encoded as
  exactly one segment (`apiPath`), and `''`, `.` and `..` are refused. An ID
  such as `abc/refund#` could turn `orders.confirm()` into a refund, and
  `mem_a/../mem_b` could read another member's record, with the operator token.
- `@theatrical/cli` — the template sync skips every `.env*` file but
  `.env.example`; a key in `.env.local` or `.env.production` would have been
  embedded in the generated template, the npm tarball and every scaffold.
- `@theatrical/events` — `verifySignature` accepts only a 64-hex-digit
  signature (it accepted a valid digest followed by garbage), returns `false`
  for a missing header instead of throwing, and takes an opt-in
  `toleranceSeconds` replay window over the signed `timestamp`.
- Workflows run with `contents: read`, keep no credential after checkout, and
  pin every action to a commit (the PyPI publisher was on the moving
  `release/v1` branch in the job that mints the publishing token).

### Fixed
- `@theatrical/events` — a watcher's state store holds the last poll, not every
  item it has ever seen, so a long-running watcher's memory and per-poll cost no
  longer grow with every order that passes through a rolling window. A film that
  leaves the catalogue fires `film.removed` once, not on every poll after.

### Added
- `@theatrical/events` — `rememberPolls` on every watcher (default 10): how many
  polls in a row an item may be missing and still be recognised when it returns.
  An order missing from one truncated response is not created twice, and a status
  change made while it was missing still fires `booking.confirmed`.

## [0.1.2] — 2026-06-11

Patch releases for two TypeScript packages. All other packages are unchanged.

### Fixed
- `@theatrical/react` 0.1.2 — theme overrides accept arbitrary brand values;
  override widening and nested merge now covered by tests (62 tests, up from 57).
- `@theatrical/events` 0.1.2 — `node:crypto` kept out of the browser entry so
  bundlers no longer choke; webhook signing remains Node-only.

## [0.1.1] — 2026-06-11

Patch wave across the five TypeScript packages, rolled out 2–11 June. The C#
(`Theatrical.Sdk`) and Python (`theatrical`) SDKs remain at 0.1.0 — no changes.

### Added
- `@theatrical/cli` 0.1.1 — `react-ticketing` embedded as a first-class `init`
  template, so scaffolding works standalone without a registry fetch.

### Fixed
- `@theatrical/sdk` 0.1.1 — mock-mode order creation returns a well-formed order.
- `@theatrical/react` 0.1.1 — visually distinct seat-state colors in SeatMap.
- `@theatrical/events` 0.1.1 — watchers compile clean, are browser-safe, and are
  exported from the package root.
- `@theatrical/analytics` 0.1.1 — restored the intended public API surface.
- CLI scaffolds reference `npx @theatrical/cli` (not the bare bin name), include
  `@theatrical/cli` as a devDependency, and ship a `.gitignore`.

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

[0.1.2]: https://github.com/brunohart/theatrical/releases/tag/v0.1.2
[0.1.1]: https://github.com/brunohart/theatrical/releases/tag/v0.1.1
[0.1.0]: https://github.com/brunohart/theatrical/releases/tag/v0.1.0
