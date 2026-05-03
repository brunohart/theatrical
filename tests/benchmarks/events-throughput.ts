/**
 * Events Package Throughput Benchmarks
 *
 * Measures the event bridge pipeline throughput:
 * - DiffEngine: how fast can we detect changes across large item sets?
 * - StateStore: read/write performance under load
 * - TypedEventEmitter: emission overhead vs native EventEmitter
 * - WebhookDelivery: serialization + signature computation overhead
 *
 * Run manually: npx tsx tests/benchmarks/events-throughput.ts
 */

import { diff } from '../../packages/events/src/diff-engine';
import { StateStore } from '../../packages/events/src/state-store';
import { TypedEventEmitter } from '../../packages/events/src/emitter';
import { computeSignature } from '../../packages/events/src/webhook/signature';

// ─── Benchmark Utilities ──────────────────────────────────

function bench(name: string, fn: () => void, iterations = 10_000): void {
  for (let i = 0; i < 100; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  const avgMs = elapsed / iterations;
  const opsPerSec = Math.round(1000 / avgMs);
  console.log(`  ${name}: ${avgMs.toFixed(4)}ms avg (${opsPerSec.toLocaleString()} ops/sec) [${iterations} iterations]`);
}

// ─── Fixture Generators ───────────────────────────────────

interface MockSession {
  id: string;
  filmTitle: string;
  seatsAvailable: number;
  isSoldOut: boolean;
  [key: string]: unknown;
}

function generateSessions(count: number): MockSession[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ses-${String(i).padStart(4, '0')}`,
    filmTitle: `Film ${i % 20}`,
    seatsAvailable: 100 + (i % 50),
    isSoldOut: false,
    siteId: `site-${i % 5}`,
    screenId: `scr-${i % 10}`,
    startTime: `2026-05-03T${(10 + (i % 12)).toString().padStart(2, '0')}:00:00+12:00`,
    format: i % 3 === 0 ? 'IMAX' : '2D',
    priceFrom: 15 + (i % 10),
  }));
}

function mutateRandomSessions(sessions: MockSession[], changeCount: number): MockSession[] {
  const copy = sessions.map((s) => ({ ...s }));
  for (let i = 0; i < changeCount && i < copy.length; i++) {
    copy[i].seatsAvailable -= 5;
    if (copy[i].seatsAvailable <= 0) copy[i].isSoldOut = true;
  }
  return copy;
}

// ─── DiffEngine Benchmarks ────────────────────────────────

console.log('\n📊 Theatrical Events Throughput Benchmarks');
console.log('═'.repeat(60));

console.log('\n🔄 DiffEngine — change detection');

const sessions50 = generateSessions(50);
const sessions50_changed = mutateRandomSessions(sessions50, 5);
bench('diff 50 items (5 changed)', () => { diff(sessions50_changed, sessions50); });

const sessions200 = generateSessions(200);
const sessions200_changed = mutateRandomSessions(sessions200, 20);
bench('diff 200 items (20 changed)', () => { diff(sessions200_changed, sessions200); });

const sessions1000 = generateSessions(1000);
const sessions1000_changed = mutateRandomSessions(sessions1000, 50);
bench('diff 1000 items (50 changed)', () => { diff(sessions1000_changed, sessions1000); }, 1_000);

// ─── StateStore Benchmarks ────────────────────────────────

console.log('\n🗄️  StateStore — read/write performance');

const store = new StateStore<MockSession>();
bench('StateStore.set (single item)', () => {
  store.set('bench-item', { id: 'bench-item', filmTitle: 'Bench', seatsAvailable: 100, isSoldOut: false });
});

for (const s of sessions200) store.set(s.id, s);
bench('StateStore.get (200-item store)', () => { store.get(sessions200[100].id); });
bench('StateStore.getAll (200-item store)', () => { store.getAll(); }, 1_000);

// ─── TypedEventEmitter Benchmarks ─────────────────────────

console.log('\n📡 TypedEventEmitter — emission overhead');

type BenchEvents = { 'session.updated': { id: string; timestamp: string } };
const emitter = new TypedEventEmitter<BenchEvents>();
let received = 0;
emitter.on('session.updated', () => { received++; });

bench('emit typed event (1 listener)', () => {
  emitter.emit('session.updated', { id: 'ses-001', timestamp: '2026-05-03T19:00:00Z' });
});

const emitter5 = new TypedEventEmitter<BenchEvents>();
for (let i = 0; i < 5; i++) emitter5.on('session.updated', () => { received++; });

bench('emit typed event (5 listeners)', () => {
  emitter5.emit('session.updated', { id: 'ses-001', timestamp: '2026-05-03T19:00:00Z' });
});

// ─── Webhook Signature Benchmarks ─────────────────────────

console.log('\n🔐 Webhook — HMAC-SHA256 signature computation');

const smallPayload = JSON.stringify({ event: 'session.soldout', data: { sessionId: 'ses-001' } });
bench('computeSignature (small payload ~80 bytes)', () => { computeSignature(smallPayload, 'whsec_benchmark'); });

const largePayload = JSON.stringify({
  event: 'booking.confirmed',
  data: {
    orderId: 'ord-bench',
    tickets: Array.from({ length: 10 }, (_, i) => ({
      id: `tkt-${i}`,
      seatId: `H${i}`,
      price: 19.50,
    })),
    total: 195.00,
    currency: 'NZD',
  },
});
bench(`computeSignature (large payload ~${largePayload.length} bytes)`, () => {
  computeSignature(largePayload, 'whsec_benchmark');
});

console.log(`\n✅ Throughput benchmarks complete (${received.toLocaleString()} events received)\n`);
