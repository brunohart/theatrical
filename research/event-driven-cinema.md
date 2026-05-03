# Event-Driven Cinema

*Why real-time events change everything for cinema operations — and how to build an event bridge when the platform API is request-response.*

---

## The Problem

Cinema management platforms are request-response systems. You ask the API for the current state — available seats, order status, film catalogue — and it tells you. This works well for interactive applications where a human initiates each query. A customer opens the booking page, the app fetches seat availability, the customer selects seats.

But cinema operations need more than request-response. They need awareness of change.

A cinema manager needs to know when a popular session is about to sell out — not because they queried it, but because the system noticed. A concession team needs to know when a large group booking is confirmed — not because they checked the orders list, but because an alert fired. A marketing team needs to know when a new film appears in the catalogue — not because they refreshed the page, but because the event bridge detected the change and notified their systems.

The gap between what cinema operations need (real-time change awareness) and what the API provides (current-state snapshots) is where an event bridge creates the most value.

---

## The Architecture

An event bridge for a request-response API has four components. Each solves a specific problem, and keeping them separate is essential for testability and composability.

### The Poller

The poller calls the API on a regular interval and delivers the raw response data. The design decisions matter:

**`setTimeout` after completion, not `setInterval`**. `setInterval` fires regardless of whether the previous API call has finished. On a slow API or a congested network, `setInterval` causes request overlap — multiple in-flight requests competing for the same connection pool. `setTimeout` after each call completes ensures requests are sequential. The interval is the gap between completions, not between starts.

**`AbortController` for clean shutdown**. A poller that cannot be stopped cleanly is a memory leak. The `start()` method creates an `AbortController`. The `stop()` method calls `abort()`. The polling loop catches `AbortError` and exits silently. This matters in server processes that run for hours — a cinema dashboard monitoring multiple sites needs pollers that start and stop cleanly as sites come online and offline.

**Configurable intervals per resource type**. Session availability changes every few seconds during peak booking periods. Film catalogues change once a day. Loyalty member data changes infrequently. One polling interval does not fit all resources. The event bridge provides sensible defaults: sessions at 10 seconds, orders at 5 seconds, films at 60 seconds, inventory at 30 seconds.

### The Diff Engine

The diff engine compares the current API response against the previous state and produces a list of changes: items added, items removed, items changed.

**Pure function**. `diff<T extends { id: string }>(current: T[], previous: T[])` takes two arrays and returns `DiffEvent<T>[]`. No timer imports, no side effects, no dependencies on the polling infrastructure. This means it can be tested with two array literals — no fake timers, no mock clocks, no async setup.

**Identity-based comparison**. Items are matched by `id`. An item present in `current` but not in `previous` is `added`. An item in `previous` but not in `current` is `removed`. An item in both but with different serialised form is `changed`. The `changed` event carries both the current and previous state, enabling consumers to detect which specific fields changed.

This separation of concerns — the poller handles timing, the diff engine handles comparison — means the diff algorithm can be improved independently of the polling strategy. If the API adds ETags or delta responses in the future, the poller changes but the diff engine stays the same.

### The State Store

The state store persists the most recent known state for each item. The poller delivers fresh data; the state store remembers what was there before.

**TTL support**. A poller that stops for 30 seconds should not serve the last known state as if it were current. TTL-based expiry ensures that stale state is discarded. When `get()` is called for an expired entry, it returns `undefined` and deletes the entry. This makes the event bridge honest about data freshness.

**In-memory by default**. For most cinema use cases — a dashboard monitoring availability, a webhook dispatcher watching orders — an in-memory `Map` with TTL is sufficient. The `StateStore` interface is simple enough that a Redis-backed implementation could be swapped in for high-availability deployments, but the default should be zero-dependency.

### The Typed Event Emitter

The event emitter dispatches typed events to registered listeners. The type system ensures that `emit('booking.confirmed', payload)` is checked at compile time — the payload must match the `BookingConfirmedPayload` shape, or TypeScript rejects the code.

**Extends Node's EventEmitter**. The cinema operations use case — server-side processes monitoring API state — is a Node.js domain. Extending the native `EventEmitter` means the event bridge works with existing Node.js patterns: `process.on('SIGTERM', () => watcher.stop())`, error propagation via `'error'` events, and listener count management via `getMaxListeners()`.

**Generic type parameter**. `TypedEventEmitter<Events extends Record<string, unknown>>` constrains the event names and payload types at compile time. Adding a new event to a watcher means adding it to the `Events` type — and TypeScript immediately flags any listener that expects the wrong payload shape.

---

## The Watchers

Watchers are domain-specific compositions of the four components. Each watcher knows what to poll, what changes matter, and what events to emit.

**BookingWatcher**: Polls orders. Emits `booking.created` when a new order appears, `booking.confirmed` when an order transitions to confirmed status, `booking.cancelled` when an order is cancelled. The confirmed transition is the most operationally significant — it is the signal that a booking is finalised and the cinema can prepare (F&B pre-orders, accessibility accommodations, staffing adjustments).

**SessionWatcher**: Polls sessions. Emits `session.added` when a new screening is scheduled, `session.updated` when session metadata changes (time, screen, pricing), `session.soldout` when available seats drop to zero. The sold-out event is a specific transition — it fires only when `isSoldOut` changes from `false` to `true`, not on every poll where `isSoldOut` is `true`.

**FilmWatcher**: Polls the film catalogue. Emits `film.added` when a new release appears, `film.removed` when a film leaves the catalogue, `film.updated` when metadata changes. Film catalogue changes are infrequent but high-impact — a new release triggers marketing automation, website updates, and social media scheduling.

**InventoryWatcher**: Polls F&B menu items. Emits `inventory.low` when an item becomes unavailable, `inventory.restocked` when an item returns to available, `menu.updated` when item metadata changes (price, description, dietary flags). Concession operations depend on real-time availability awareness — running out of a popular item during peak hours requires immediate operational response.

---

## Webhook Delivery

The event bridge detects changes. Webhook delivery externalises those changes.

**HMAC-SHA256 signatures**. Every webhook payload is signed with a per-endpoint shared secret. The signature is transmitted in the `X-Theatrical-Signature` header as `sha256=<hex>`. Recipients verify the signature using constant-time comparison to prevent timing attacks. This is the same pattern that Stripe and GitHub use for webhook verification.

**Retry with exponential backoff**. Failed deliveries are retried with exponentially increasing delays. The first retry waits 1 second, the second waits 2 seconds, the third waits 4 seconds. After the maximum retry count, the delivery is marked as failed with the error reason and attempt count.

**Endpoint isolation via `Promise.allSettled`**. When an event is delivered to multiple endpoints, each delivery is independent. One endpoint returning `500` does not block delivery to other endpoints. This is critical for production reliability — a single misconfigured webhook URL should not prevent other systems from receiving notifications.

---

## Why This Matters

Real-time awareness transforms cinema operations from reactive to proactive.

Without events, a cinema manager checks the dashboard periodically and notices that the 7:15 PM showing is sold out. By then, the social media post could have gone out an hour earlier. The F&B team could have prepared additional stock for the larger-than-expected crowd. The accessibility coordinator could have confirmed wheelchair companion seating arrangements.

With events, the sold-out transition triggers an automated chain: the marketing system schedules a social post, the F&B system adjusts prep quantities, the accessibility coordinator receives an email. The cinema manager does not need to check the dashboard — the systems that need to know are already informed.

This is not futuristic. This is how every mature operations platform works. Payment processors send webhook notifications for successful charges. E-commerce platforms send events for order status changes. Communication platforms send events for message delivery. Cinema operations deserve the same real-time awareness.

The event bridge built on top of a request-response API is a pattern, not a hack. It is the standard approach for adding real-time capabilities to platforms that were designed for request-response interactions. And when the platform eventually adds native event support — WebSocket connections, server-sent events, or a proper webhook system — the event bridge's consumer-facing API stays the same. The watcher interface (`watcher.on('session.soldout', callback)`) does not change. Only the poller's internal implementation switches from HTTP polling to a persistent connection.

Building the event bridge now, on top of the existing API, means cinema developers get real-time capabilities immediately — and the migration to native events, when it comes, is transparent.
