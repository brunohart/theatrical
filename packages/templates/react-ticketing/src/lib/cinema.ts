import { useEffect, useRef, useState } from 'react';
import { EventEmitter } from '@theatrical/events';

/**
 * The living cinema.
 *
 * A request-response API hands you a photograph. This engine turns the
 * photograph back into a pulse: it mutates real state over time, then a
 * poll → diff → emit loop (the exact shape of @theatrical/events) converts
 * state into a typed event stream. The UI listens to the pulse, not the photo.
 */

export interface Film {
  id: string;
  title: string;
  year: number;
  runtime: number;
  classification: string;
  genres: string[];
  synopsis: string;
  poster: string;       // TMDB artwork
  accent: string;       // dominant colour, for cinematic lighting
}

export interface ScreenSpec {
  id: string;
  name: string;
  format: 'Standard' | 'IMAX' | 'Gold Class' | 'Boutique';
  /** rows of seat counts — every auditorium is shaped differently */
  layout: number[];
  aisleAfter?: number[]; // seat indices to add an aisle gap after
}

export interface LiveSession {
  id: string;
  filmId: string;
  screenId: string;
  startTime: string;     // ISO
  priceFrom: number;
  capacity: number;
  sold: number;          // mutated live
  velocity: number;      // seats/sec pressure
  soldOut: boolean;
}

export type PulseEvent =
  | { kind: 'booking.confirmed'; id: string; filmTitle: string; time: string; seats: number; at: number }
  | { kind: 'session.soldout'; id: string; filmTitle: string; time: string; at: number }
  | { kind: 'fnb.ordered'; id: string; item: string; at: number }
  | { kind: 'loyalty.tier'; id: string; member: string; tier: string; at: number };

// ─── Curated programme — Roxy Cinema, Wellington ───
export const FILMS: Film[] = [
  { id: 'poor-things', title: 'Poor Things', year: 2023, runtime: 141, classification: 'R18', genres: ['Comedy', 'Drama', 'Romance'], synopsis: 'The incredible tale of the fantastical evolution of Bella Baxter, brought back to life by an unorthodox scientist.', poster: 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg', accent: '#2E7D8F' },
  { id: 'the-holdovers', title: 'The Holdovers', year: 2023, runtime: 133, classification: 'M', genres: ['Comedy', 'Drama'], synopsis: 'A cranky history teacher at a New England prep school is forced to remain on campus over the holidays with a troubled student.', poster: 'https://image.tmdb.org/t/p/w500/VyTl4LWBYBHK7bnsLk6fyZHGz2.jpg', accent: '#C26B3A' },
  { id: 'dune-two', title: 'Dune: Part Two', year: 2024, runtime: 166, classification: 'M', genres: ['Sci-Fi', 'Adventure'], synopsis: 'Paul Atreides unites with the Fremen to wage war against House Harkonnen and avenge his family.', poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', accent: '#C9922A' },
  { id: 'past-lives', title: 'Past Lives', year: 2023, runtime: 105, classification: 'M', genres: ['Drama', 'Romance'], synopsis: 'Two childhood friends are reunited two decades after one of them emigrates, confronting destiny, love, and the choices that make a life.', poster: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg', accent: '#3E5C8A' },
];

export const SCREENS: Record<string, ScreenSpec> = {
  'screen-1': { id: 'screen-1', name: 'Screen 1', format: 'Standard', layout: [12, 14, 14, 16, 16, 16, 14, 12], aisleAfter: [5, 10] },
  'screen-2': { id: 'screen-2', name: 'Screen 2', format: 'IMAX', layout: [18, 20, 22, 22, 24, 24, 22, 20, 18], aisleAfter: [6, 16] },
  'roxy-lounge': { id: 'roxy-lounge', name: 'The Roxy Lounge', format: 'Gold Class', layout: [4, 4, 6, 6, 6], aisleAfter: [2] },
  'kiosk': { id: 'kiosk', name: 'Boutique 3', format: 'Boutique', layout: [6, 8, 8, 10, 8], aisleAfter: [4] },
};

const SCREEN_IDS = Object.keys(SCREENS);

function seatsIn(s: ScreenSpec) { return s.layout.reduce((a, b) => a + b, 0); }

/** Build tonight's programme — deterministic so SSR/build is stable. */
function buildProgramme(now: number): LiveSession[] {
  const sessions: LiveSession[] = [];
  const base = new Date(now);
  base.setHours(11, 0, 0, 0);
  const slots = [0, 2.5, 5, 6.5, 8, 9.5]; // hours from 11am
  let i = 0;
  for (const film of FILMS) {
    const picks = slots.filter((_, idx) => (idx + FILMS.indexOf(film)) % 2 === 0).slice(0, 3);
    for (const h of picks) {
      const screen = SCREENS[SCREEN_IDS[i % SCREEN_IDS.length]!]!;
      const start = new Date(base.getTime() + h * 3600_000);
      const cap = seatsIn(screen);
      // evening + premium screens run hotter
      const eveningHeat = h >= 6 ? 1.7 : 1;
      const premiumHeat = screen.format === 'Gold Class' || screen.format === 'IMAX' ? 1.4 : 1;
      const startSold = Math.floor(cap * (0.25 + ((i * 17) % 40) / 100));
      sessions.push({
        id: `s-${film.id}-${i}`,
        filmId: film.id,
        screenId: screen.id,
        startTime: start.toISOString(),
        priceFrom: screen.format === 'Gold Class' ? 45 : screen.format === 'IMAX' ? 28 : 18.5,
        capacity: cap,
        sold: Math.min(startSold, cap),
        velocity: 0.04 * eveningHeat * premiumHeat * (0.6 + ((i * 13) % 50) / 50),
        soldOut: false,
      });
      i++;
    }
  }
  return sessions;
}

const FNB = ['Large popcorn', 'Roxy choc-top', 'Craft cider', 'Negroni', 'Kombucha', 'Salted caramel gelato'];
const NAMES = ['Hemi W.', 'Aroha T.', 'Sione F.', 'Mei L.', 'Jack R.', 'Priya N.', 'Tama K.', 'Eve S.'];
const TIERS = ['Silver', 'Gold', 'Platinum'];

export class LiveCinema {
  readonly emitter = new EventEmitter();
  sessions: LiveSession[];
  private prev: Map<string, number> = new Map();
  private seed = 1;

  constructor(now: number) {
    this.sessions = buildProgramme(now);
    this.sessions.forEach((s) => this.prev.set(s.id, s.sold));
  }

  private rnd() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }

  /** Advance the world `dt` seconds, then poll → diff → emit. */
  tick(dt: number, nowMs: number) {
    const now = nowMs;
    // 1) mutate state (the building breathes)
    for (const s of this.sessions) {
      if (s.soldOut) continue;
      const start = Date.parse(s.startTime);
      const minsToStart = (start - now) / 60000;
      // sessions about to start sell hardest; long-past ones settle
      const window = minsToStart > -30 && minsToStart < 240 ? 1 : 0.15;
      const pressure = s.velocity * window * (0.5 + this.rnd());
      const add = pressure * dt;
      s.sold = Math.min(s.capacity, s.sold + add);
      if (s.sold >= s.capacity - 0.5) { s.sold = s.capacity; s.soldOut = true; }
    }
    // 2) poll → diff → emit (this is precisely what @theatrical/events does)
    for (const s of this.sessions) {
      const before = this.prev.get(s.id) ?? s.sold;
      const delta = Math.floor(s.sold) - Math.floor(before);
      const film = FILMS.find((f) => f.id === s.filmId)!;
      const time = new Date(s.startTime).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (delta > 0) {
        void this.emitter.emit({ type: 'booking.confirmed', category: 'booking', timestamp: new Date(now).toISOString(), data: { id: s.id, filmTitle: film.title, time, seats: delta, at: now } } as never);
      }
      if (s.soldOut && before < s.capacity) {
        void this.emitter.emit({ type: 'session.soldout', category: 'session', timestamp: new Date(now).toISOString(), data: { id: s.id, filmTitle: film.title, time, at: now } } as never);
      }
      this.prev.set(s.id, s.sold);
    }
    // 3) ambient flavour events
    if (this.rnd() > 0.55) {
      void this.emitter.emit({ type: 'fnb.ordered', category: 'fnb', timestamp: new Date(now).toISOString(), data: { id: 'f' + now, item: FNB[Math.floor(this.rnd() * FNB.length)], at: now } } as never);
    }
    if (this.rnd() > 0.9) {
      void this.emitter.emit({ type: 'loyalty.tier', category: 'loyalty', timestamp: new Date(now).toISOString(), data: { id: 'l' + now, member: NAMES[Math.floor(this.rnd() * NAMES.length)], tier: TIERS[Math.floor(this.rnd() * TIERS.length)], at: now } } as never);
    }
  }
}

export interface PulseState {
  sessions: LiveSession[];
  events: PulseEvent[];
  totalSold: number;
  capacity: number;
  revenue: number;
}

/**
 * React binding. Starts the engine, listens to the typed event stream, and
 * re-renders the UI on every heartbeat. `prefers-reduced-motion` slows it down.
 */
export function usePulse(): PulseState {
  const [, force] = useState(0);
  const ref = useRef<LiveCinema>();
  const eventsRef = useRef<PulseEvent[]>([]);

  if (!ref.current) ref.current = new LiveCinema(Date.now());

  // Seed the stream so the pulse is visibly alive on first paint.
  if (!eventsRef.current.length) {
    const c = ref.current;
    const now = Date.now();
    const seedFnb = ['Large popcorn', 'Roxy choc-top', 'Craft cider'];
    eventsRef.current = c.sessions.slice(0, 6).flatMap((s, i) => {
      const f = FILMS.find((x) => x.id === s.filmId)!;
      const time = new Date(s.startTime).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });
      const out: PulseEvent[] = [{ kind: 'booking.confirmed', id: 'seed-b' + i, filmTitle: f.title, time, seats: 1 + (i % 3), at: now - i * 3500 }];
      if (i % 3 === 0) out.push({ kind: 'fnb.ordered', id: 'seed-f' + i, item: seedFnb[i % 3]!, at: now - i * 3500 - 1200 });
      return out;
    }).sort((a, b) => b.at - a.at);
  }

  useEffect(() => {
    const cinema = ref.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Listen to the typed event stream — this is the "pulse" reaching the UI.
    const subs = (['booking.confirmed', 'session.soldout', 'fnb.ordered', 'loyalty.tier'] as const).map((t) =>
      cinema.emitter.on(t, (e: any) => {
        eventsRef.current = [{ ...e.data, kind: t } as PulseEvent, ...eventsRef.current].slice(0, 28);
      }),
    );
    const stepMs = reduce ? 1500 : 650; // heartbeat cadence
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    let timer = 0;
    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      acc += t - last;
      last = t;
      if (acc >= stepMs) {
        cinema.tick(acc / 1000, Date.now());
        acc = 0;
        force((n) => (n + 1) % 1_000_000);
      }
    }
    if (reduce) {
      timer = window.setInterval(() => { cinema.tick(2, Date.now()); force((n) => n + 1); }, stepMs);
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => { cancelAnimationFrame(raf); clearInterval(timer); subs.forEach((u) => u()); };
  }, []);

  const cinema = ref.current!;
  const totalSold = cinema.sessions.reduce((a, s) => a + Math.floor(s.sold), 0);
  const capacity = cinema.sessions.reduce((a, s) => a + s.capacity, 0);
  const revenue = cinema.sessions.reduce((a, s) => a + Math.floor(s.sold) * s.priceFrom, 0);
  return { sessions: cinema.sessions, events: eventsRef.current, totalSold, capacity, revenue };
}
