# What Stripe Did for Payments

*Draw the parallel: Stripe → payments :: Theatrical → cinema. A technical comparison with code examples.*

---

## The Before

In 2010, accepting a credit card payment online looked like this:

You registered for a merchant account. You received API documentation — typically 200+ pages of XML schema definitions. You built a SOAP client, managed card tokenisation manually, handled PCI compliance questionnaires, implemented webhook verification without signature libraries, and wrote retry logic for a gateway that returned different error formats for different failure modes.

It worked. Thousands of businesses processed payments this way. But each integration was a multi-week engineering project, and the result was fragile — tightly coupled to the gateway's idiosyncrasies, difficult to test, and expensive to maintain.

Then Stripe published seven lines of code:

```javascript
const stripe = require('stripe')('sk_test_...');
const charge = await stripe.charges.create({
  amount: 2000,
  currency: 'usd',
  source: 'tok_visa',
});
```

The payment gateway underneath was unchanged. The same card networks, the same settlement rails, the same compliance requirements. What changed was the surface area developers interacted with. Stripe built a typed client, predictable error handling, webhook verification, test mode with fixture data, and a CLI — the developer experience layer that turned payment integration from weeks to hours.

---

## The Parallel

Cinema platform APIs today occupy the same position payment gateways occupied in 2010.

The APIs are mature and capable. They process billions in annual transaction volume. The documentation exists. The endpoints work. But building on them requires the same kind of bespoke integration work that building on payment gateways used to require.

Here is what a cinema API call looks like today without developer tooling:

```typescript
// Authenticate with GAS (Global Auth Service)
const tokenResponse = await fetch('https://api.vista.co/ocapi/v1/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey: process.env.API_KEY }),
});
const { access_token, expires_in } = await tokenResponse.json();

// Fetch sessions — manual header management, no type safety
const response = await fetch(
  'https://api.vista.co/ocapi/v1/sessions?' +
    new URLSearchParams({ siteId: 'roxy-wellington', date: '2026-05-03' }),
  {
    headers: { Authorization: `Bearer ${access_token}` },
  }
);

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Is this seconds or an HTTP-date? Need to handle both formats.
  // parseInt returns NaN for HTTP-dates. setTimeout(fn, NaN) fires immediately.
  // A tight retry loop makes the rate limit worse.
}

const data = await response.json();
// data is `any`. No runtime validation. A malformed response
// silently propagates until it causes a TypeError somewhere downstream.
```

Here is the same operation with a developer experience layer:

```typescript
import { TheatricalClient } from '@theatrical/sdk';

const client = TheatricalClient.create({ apiKey: process.env.API_KEY });

// Typed return value. Automatic token refresh. Rate limit handling.
// Zod validates the response shape at the boundary.
const { data: sessions } = await client.sessions.list({
  siteId: 'roxy-wellington',
  date: '2026-05-03',
});

// sessions is Session[] — TypeScript knows every field.
// If the API returns malformed data, ZodError fires here, not three
// function calls later when you access session.startTime on undefined.
```

The API is unchanged. The infrastructure is unchanged. What changed is the developer's experience of building on it.

---

## The Five Layers

Stripe's developer experience is not one thing. It is five layers, each building on the layer below:

### 1. The Typed Client

Stripe's SDK gives every API endpoint a method with typed parameters and return values. You do not read API docs for basic operations — the types are the documentation.

```typescript
// Stripe
const customer = await stripe.customers.create({ email: 'user@example.com' });
// customer.id is string. customer.email is string | null. TypeScript knows.

// Theatrical equivalent
const { data: sites } = await client.sites.list({ query: 'Wellington' });
// sites is Site[]. Each site has typed screens, address, config.
```

### 2. The Error Hierarchy

Stripe errors are typed. A `CardError` carries a `decline_code`. A `RateLimitError` is distinct from an `AuthenticationError`. Each error type has specific recovery logic.

```typescript
// Stripe
try {
  await stripe.charges.create({ ... });
} catch (e) {
  if (e instanceof Stripe.errors.StripeCardError) {
    console.log(e.decline_code); // 'insufficient_funds'
  }
}

// Theatrical equivalent
try {
  await client.orders.confirm(orderId);
} catch (e) {
  if (e instanceof RateLimitError) {
    await sleep(e.retryAfter * 1000);
  } else if (e instanceof NotFoundError) {
    console.log(e.resourceId); // 'ord-expired-123'
  }
}
```

### 3. Test Mode

Stripe's test mode uses `sk_test_` keys to return fixture data without hitting production. Developers build and test their entire integration without a live merchant account.

```typescript
// Stripe: test mode is a key prefix
const stripe = require('stripe')('sk_test_...');

// Theatrical: mock mode is a factory method
const client = TheatricalClient.createMock();
const { data: films } = await client.films.nowShowing();
// Returns NZ cinema fixture data — Embassy Theatre, Roxy Cinema.
// No API key required. Works offline.
```

### 4. Webhook Verification

Stripe signs webhooks with HMAC and provides verification helpers. Without this, every integrator builds their own signature verification — and many get it wrong (timing attacks, missing constant-time comparison).

```typescript
// Stripe
const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

// Theatrical
import { verifySignature } from '@theatrical/events';
const isValid = verifySignature(body, endpointSecret, signatureHeader);
// Constant-time HMAC-SHA256 comparison. Same security properties.
```

### 5. The CLI

Stripe's CLI lets developers trigger test events, tail logs, and forward webhooks to localhost. It turns the development loop from deploy-and-test to develop-and-verify.

```bash
# Stripe
stripe listen --forward-to localhost:3000/webhooks

# Theatrical
theatrical inspect sessions list --site roxy-wellington --date 2026-05-03
# Syntax-highlighted, timed output. No Postman, no curl.
```

---

## What the Parallel Means

The parallel between Stripe and cinema developer tooling is not an analogy. It is a structural observation about platform economics.

Stripe did not build a better payment gateway. They built the developer experience layer that made the existing gateway accessible to millions of developers. The gateway's transaction volume grew because more businesses integrated — not because the gateway itself changed.

Cinema platforms have the same structural opportunity. The APIs process billions in transactions. The endpoints are documented and operational. The constraint on ecosystem growth is not platform capability — it is the developer experience gap between the API and the developers who want to build on it.

Filling that gap does not require building a competing platform. It requires building the same kind of developer tooling that Stripe, Twilio, and Shopify built for their respective industries: typed clients, structured errors, test mode, webhook verification, and CLI tools.

The code patterns are remarkably similar across all these ecosystems — because the developer experience problem is the same problem, regardless of industry. The only difference is the domain types. Instead of charges and customers, you have sessions and orders. Instead of payment intents and invoices, you have seat availability and loyalty points.

The translation layer is what matters. Build it well, and the platform's addressable developer market expands. Build it first, and you define the developer experience for the entire industry.

---

## Conclusion

Stripe did not invent payments. They made payments easy to integrate. The cinema industry has its payments infrastructure — mature, battle-tested platforms processing billions in transactions. What it does not yet have is its Stripe moment: the developer experience layer that makes building on these platforms as natural as `npm install` and a few lines of typed code.

That layer is not a competitor to the platform. It is the bridge between platform capability and developer productivity. Every industry that has built this bridge has seen its ecosystem grow by orders of magnitude.

Cinema is next.
