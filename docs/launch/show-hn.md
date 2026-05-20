# Show HN: Theatrical — Polyglot SDKs for cinema platform APIs

I built a developer toolkit for cinema technology — the kind of infrastructure
that powers ticket sales, seat selection, loyalty programmes, and concession
ordering across thousands of cinemas worldwide.

Cinema platforms process billions in annual transaction volume, but the developer
ecosystem around them is essentially zero. No typed clients, no CLI tools, no
component libraries. Every integrator starts from scratch.

Theatrical is the missing developer experience layer:

- **TypeScript SDK** — Zod-validated, 8 resource modules, mock mode with NZ
  cinema fixture data. 274 tests.
- **Python SDK** — async-first with httpx + pydantic v2, mypy strict clean. 337
  tests.
- **C# SDK** — .NET 8, exponential backoff retry, System.Text.Json. 272 tests.
- **CLI** — `theatrical inspect sessions list --site roxy-wellington`
- **React components** — SeatMap, SessionPicker, OrderSummary
- **Event bridge** — poll-based real-time events from request-response APIs

Same API surface across all three languages. Same types, same mock data, same
test patterns.

The SDK handles auth (token refresh), rate limiting (retry with backoff), typed
errors (RateLimitError carries retryAfter), and mock mode (develop without API
credentials). The event bridge adds real-time change detection on top of
request-response APIs — session sold out, order confirmed, film added.

Five research essays on the architecture and economics of cinema platform
technology: https://theatrical.dev/essays/

MIT licensed (SDK + CLI). BSL 1.1 for React components, analytics, and events.

https://github.com/brunohart/theatrical
https://theatrical.dev
