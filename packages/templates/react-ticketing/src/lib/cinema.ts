import { useEffect, useRef, useState } from 'react';
import { BookingWatcher, SessionWatcher } from '@theatrical/events';

/**
 * The living cinema.
 *
 * A request-response API hands you a photograph. This engine mutates real state
 * over time, then the REAL @theatrical/events watchers (BookingWatcher,
 * SessionWatcher) poll → diff → emit a typed event stream. The UI listens to the
 * pulse, not the photo. "From snapshot to pulse," wired to the published package.
 */

export interface Film {
  id: string; title: string; year: number; runtime: number; classification: string;
  genres: string[]; synopsis: string; poster: string; accent: string;
}
export interface ScreenSpec {
  id: string; name: string; format: 'Standard' | 'IMAX' | 'Gold Class' | 'Boutique';
  layout: number[]; aisleAfter?: number[];
}
export interface LiveSession {
  id: string; filmId: string; screenId: string; startTime: string;
  priceFrom: number; capacity: number; sold: number; velocity: number; soldOut: boolean;
}
interface LiveOrder { id: string; status: 'pending' | 'confirmed'; filmTitle: string; time: string; seats: number; }

export type PulseEvent =
  | { kind: 'booking.confirmed'; id: string; filmTitle: string; time: string; seats: number; at: number }
  | { kind: 'session.soldout'; id: string; filmTitle: string; time: string; at: number }
  | { kind: 'fnb.ordered'; id: string; item: string; at: number }
  | { kind: 'loyalty.tier'; id: string; member: string; tier: string; at: number };

// ─── Curated programme — Roxy Cinema, Wellington. Of-the-moment, varied. ───
export const FILMS: Film[] = [
  { id: 'mando-grogu', title: 'The Mandalorian & Grogu', year: 2026, runtime: 124, classification: 'PG', genres: ['Sci-Fi', 'Adventure'], synopsis: 'The galaxy’s most unlikely duo take on a mission that will reshape the New Republic.', poster: '', accent: '#3E6B4F' },
  { id: 'sinners', title: 'Sinners', year: 2025, runtime: 137, classification: 'R16', genres: ['Horror', 'Thriller'], synopsis: 'Twin brothers return to their hometown to start again, only to discover an evil waiting to welcome them back.', poster: '', accent: '#7A2E2E' },
  { id: 'mickey-17', title: 'Mickey 17', year: 2025, runtime: 137, classification: 'M', genres: ['Sci-Fi', 'Comedy'], synopsis: 'An expendable employee on a human expedition to colonise an ice world discovers what it means to be replaced.', poster: '', accent: '#2E5E7A' },
  { id: 'dune-two', title: 'Dune: Part Two', year: 2024, runtime: 166, classification: 'M', genres: ['Sci-Fi', 'Adventure'], synopsis: 'Paul Atreides unites with the Fremen to wage war against House Harkonnen and avenge his family.', poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', accent: '#C9922A' },
  { id: 'poor-things', title: 'Poor Things', year: 2023, runtime: 141, classification: 'R18', genres: ['Comedy', 'Romance'], synopsis: 'The incredible tale of the fantastical evolution of Bella Baxter, brought back to life by an unorthodox scientist.', poster: 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg', accent: '#2E7D8F' },
  { id: 'a-complete-unknown', title: 'A Complete Unknown', year: 2024, runtime: 140, classification: 'M', genres: ['Drama', 'Music'], synopsis: '19-year-old Bob Dylan arrives in New York and changes the course of American music forever.', poster: '', accent: '#8A6E3A' },
  { id: 'the-holdovers', title: 'The Holdovers', year: 2023, runtime: 133, classification: 'M', genres: ['Comedy', 'Drama'], synopsis: 'A cranky teacher at a New England prep school is forced to remain on campus over the holidays with a troubled student.', poster: 'https://image.tmdb.org/t/p/w500/VyTl4LWBYBHK7bnsLk6fyZHGz2.jpg', accent: '#C26B3A' },
  { id: 'past-lives', title: 'Past Lives', year: 2023, runtime: 105, classification: 'M', genres: ['Drama', 'Romance'], synopsis: 'Two childhood friends reunite two decades after one emigrates, confronting destiny, love, and the choices that make a life.', poster: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg', accent: '#3E5C8A' },
];

export const SCREENS: Record<string, ScreenSpec> = {
  'screen-1': { id: 'screen-1', name: 'Screen 1', format: 'Standard', layout: [12, 14, 14, 16, 16, 16, 14, 12], aisleAfter: [5, 10] },
  'screen-2': { id: 'screen-2', name: 'Screen 2', format: 'IMAX', layout: [18, 20, 22, 22, 24, 24, 22, 20, 18], aisleAfter: [6, 16] },
  'roxy-lounge': { id: 'roxy-lounge', name: 'The Roxy Lounge', format: 'Gold Class', layout: [4, 4, 6, 6, 6], aisleAfter: [2] },
  'kiosk': { id: 'kiosk', name: 'Boutique 3', format: 'Boutique', layout: [6, 8, 8, 10, 8], aisleAfter: [4] },
};
const SCREEN_IDS = Object.keys(SCREENS);
const seatsIn = (s: ScreenSpec) => s.layout.reduce((a, b) => a + b, 0);

function buildProgramme(now: number): LiveSession[] {
  const sessions: LiveSession[] = [];
  const base = new Date(now); base.setHours(11, 0, 0, 0);
  const slots = [0, 2, 3.5, 5, 6.5, 8, 9.25]; // hours from 11am
  let i = 0;
  for (const h of slots) {
    const perSlot = h >= 5 ? 2 : 1; // busier in the evening
    for (let k = 0; k < perSlot; k++) {
      const film = FILMS[i % FILMS.length]!;       // cycle through the whole catalogue → minimal repeats
      const screen = SCREENS[SCREEN_IDS[(i + k) % SCREEN_IDS.length]!]!;
      const start = new Date(base.getTime() + h * 3600_000);
      const cap = seatsIn(screen);
      const eveningHeat = h >= 6 ? 1.7 : 1;
      const premiumHeat = screen.format === 'Gold Class' || screen.format === 'IMAX' ? 1.4 : 1;
      const startSold = Math.floor(cap * (0.2 + ((i * 17) % 45) / 100));
      sessions.push({
        id: `s-${film.id}-${i}`, filmId: film.id, screenId: screen.id, startTime: start.toISOString(),
        priceFrom: screen.format === 'Gold Class' ? 45 : screen.format === 'IMAX' ? 28 : 18.5,
        capacity: cap, sold: Math.min(startSold, cap),
        velocity: 0.045 * eveningHeat * premiumHeat * (0.6 + ((i * 13) % 50) / 50), soldOut: false,
      });
      i++;
    }
  }
  return sessions;
}

const FNB = ['Large popcorn', 'Roxy choc-top', 'Craft cider', 'Negroni', 'Kombucha', 'Salted caramel gelato'];
const NAMES = ['Hemi W.', 'Aroha T.', 'Sione F.', 'Mei L.', 'Jack R.', 'Priya N.', 'Tama K.', 'Eve S.'];
const TIERS = ['Silver', 'Gold', 'Platinum'];
export const filmOf = (id: string) => FILMS.find((f) => f.id === id)!;
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });

export class LiveCinema {
  sessions: LiveSession[];
  private orders: LiveOrder[] = [];
  private seed = 7;
  private oid = 0;
  constructor(now: number) { this.sessions = buildProgramme(now); }
  private rnd() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }

  /** Advance the world `dt` seconds; mutate seats + maintain the order book. */
  tick(dt: number, now: number) {
    // confirm last tick's pending orders (so the watcher sees a status transition)
    for (const o of this.orders) if (o.status === 'pending') o.status = 'confirmed';
    for (const s of this.sessions) {
      if (s.soldOut) continue;
      const minsToStart = (Date.parse(s.startTime) - now) / 60000;
      const window = minsToStart > -30 && minsToStart < 240 ? 1 : 0.15;
      const add = s.velocity * window * (0.5 + this.rnd()) * dt;
      const before = Math.floor(s.sold);
      s.sold = Math.min(s.capacity, s.sold + add);
      if (s.sold >= s.capacity - 0.5) { s.sold = s.capacity; s.soldOut = true; }
      const delta = Math.floor(s.sold) - before;
      if (delta > 0) this.orders.push({ id: `o${this.oid++}`, status: 'pending', filmTitle: filmOf(s.filmId).title, time: timeOf(s.startTime), seats: delta });
    }
    if (this.orders.length > 80) this.orders = this.orders.slice(-80);
  }
  // fresh snapshots each poll → the JSON diff can see status / isSoldOut transitions
  getOrders() { return this.orders.map((o) => ({ ...o })); }
  getSessions() { return this.sessions.map((s) => ({ id: s.id, isSoldOut: s.soldOut, filmTitle: filmOf(s.filmId).title, time: timeOf(s.startTime) })); }
}

export interface PulseState {
  sessions: LiveSession[]; events: PulseEvent[];
  totalSold: number; capacity: number; revenue: number;
}

export function usePulse(): PulseState {
  const [, force] = useState(0);
  const ref = useRef<LiveCinema>();
  const eventsRef = useRef<PulseEvent[]>([]);
  if (!ref.current) ref.current = new LiveCinema(Date.now());

  if (!eventsRef.current.length) {
    const c = ref.current; const now = Date.now();
    eventsRef.current = c.sessions.slice(0, 6).map((s, i) => {
      const f = filmOf(s.filmId);
      return { kind: 'booking.confirmed', id: 'seed' + i, filmTitle: f.title, time: timeOf(s.startTime), seats: 1 + (i % 3), at: now - i * 3200 } as PulseEvent;
    });
  }

  useEffect(() => {
    const cinema = ref.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const push = (e: PulseEvent) => { eventsRef.current = [e, ...eventsRef.current].slice(0, 30); };

    // REAL @theatrical/events watchers — poll → diff → emit.
    const interval = reduce ? 1600 : 750;
    const booking = new BookingWatcher({ fetch: async () => cinema.getOrders() as never, intervalMs: interval });
    const session = new SessionWatcher({ fetch: async () => cinema.getSessions() as never, intervalMs: interval });
    booking.on('booking.confirmed', (e: any) => push({ kind: 'booking.confirmed', id: e.order.id, filmTitle: e.order.filmTitle, time: e.order.time, seats: e.order.seats, at: Date.now() }));
    session.on('session.soldout', (e: any) => push({ kind: 'session.soldout', id: e.session.id, filmTitle: e.session.filmTitle, time: e.session.time, at: Date.now() }));
    booking.start(); session.start();

    const stepMs = reduce ? 1500 : 700;
    let last = performance.now(); let acc = 0; let raf = 0; let timer = 0; let amb = 0;
    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      acc += t - last; last = t;
      if (acc >= stepMs) {
        cinema.tick(acc / 1000, Date.now()); acc = 0;
        if (++amb % 2 === 0) push(Math.random() > 0.5
          ? { kind: 'fnb.ordered', id: 'f' + Date.now(), item: FNB[Math.floor(Math.random() * FNB.length)]!, at: Date.now() }
          : { kind: 'loyalty.tier', id: 'l' + Date.now(), member: NAMES[Math.floor(Math.random() * NAMES.length)]!, tier: TIERS[Math.floor(Math.random() * TIERS.length)]!, at: Date.now() });
        force((n) => (n + 1) % 1_000_000);
      }
    }
    if (reduce) { timer = window.setInterval(() => { cinema.tick(2, Date.now()); force((n) => n + 1); }, stepMs); }
    else { raf = requestAnimationFrame(frame); }
    return () => { cancelAnimationFrame(raf); clearInterval(timer); booking.stop(); session.stop(); };
  }, []);

  const c = ref.current!;
  const totalSold = c.sessions.reduce((a, s) => a + Math.floor(s.sold), 0);
  const capacity = c.sessions.reduce((a, s) => a + s.capacity, 0);
  const revenue = c.sessions.reduce((a, s) => a + Math.floor(s.sold) * s.priceFrom, 0);
  return { sessions: c.sessions, events: eventsRef.current, totalSold, capacity, revenue };
}
