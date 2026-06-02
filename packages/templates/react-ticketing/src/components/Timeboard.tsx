import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from '../theme';
import { FILMS, SCREENS, type LiveSession, type PulseState } from '../lib/cinema';

const film = (id: string) => FILMS.find((f) => f.id === id)!;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });

function status(s: LiveSession): { label: string; color: string } {
  if (s.soldOut) return { label: 'SOLD OUT', color: T.red };
  const left = s.capacity - Math.floor(s.sold);
  const pct = s.sold / s.capacity;
  if (left <= 10) return { label: `${left} left`, color: T.orange };
  if (pct > 0.7) return { label: 'Selling fast', color: T.gold };
  return { label: 'Good seats', color: T.green };
}

export function Timeboard({ pulse, onOpen }: { pulse: PulseState; onOpen: (sessionId: string) => void }) {
  const sessions = [...pulse.sessions].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const occupancy = Math.round((pulse.totalSold / pulse.capacity) * 100);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,7vh,72px) clamp(20px,5vw,40px) 96px' }}>
      <header style={{ marginBottom: 36 }}>
        <LiveKicker />
        <h1 style={{ fontFamily: T.display, fontSize: 'clamp(2.4rem,6vw,4.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.98, color: T.ink, margin: '14px 0 0' }}>
          The Roxy is <span style={{ color: T.orange }}>breathing</span>
        </h1>
        <p style={{ color: T.muted, marginTop: 14, fontSize: 17, maxWidth: '46ch', lineHeight: 1.5 }}>
          Every seat below is filling in real time — a live pulse polled, diffed and streamed by{' '}
          <code style={{ fontFamily: T.mono, color: T.inkSoft, background: T.surface, padding: '1px 6px', borderRadius: 4 }}>@theatrical/events</code>.
          Not a snapshot. A heartbeat.
        </p>
      </header>

      {/* live vitals */}
      <div style={{ display: 'flex', gap: 'clamp(20px,4vw,56px)', flexWrap: 'wrap', marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>
        <Vital label="Admissions tonight" value={pulse.totalSold} />
        <Vital label="Box office" value={pulse.revenue} prefix="$" />
        <Vital label="House occupancy" value={occupancy} suffix="%" />
        <Vital label="Live sessions" value={sessions.filter((s) => !s.soldOut).length} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(280px,28%,340px)', gap: 'clamp(24px,4vw,48px)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => <SessionRow key={s.id} s={s} onOpen={onOpen} />)}
        </div>
        <Ticker events={pulse.events} />
      </div>
    </div>
  );
}

function LiveKicker() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.orange }}>
      <motion.span animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 8, height: 8, borderRadius: '50%', background: T.orange, display: 'inline-block' }} />
      Live · Roxy Cinema · Wellington
    </span>
  );
}

function Vital({ label, value, prefix = '', suffix = '' }: { label: string; value: number; prefix?: string; suffix?: string }) {
  return (
    <div>
      <div style={{ fontFamily: T.display, fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {prefix}{value.toLocaleString('en-NZ')}{suffix}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SessionRow({ s, onOpen }: { s: LiveSession; onOpen: (id: string) => void }) {
  const f = film(s.filmId);
  const screen = SCREENS[s.screenId]!;
  const st = status(s);
  const pct = Math.min(100, (s.sold / s.capacity) * 100);
  return (
    <motion.button
      data-hot
      onClick={() => !s.soldOut && onOpen(s.id)}
      whileHover={s.soldOut ? {} : { y: -2 }}
      transition={T.spring}
      style={{
        display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 20, alignItems: 'center',
        textAlign: 'left', width: '100%', padding: '16px 20px', border: `1px solid ${T.border}`,
        borderRadius: 14, background: s.soldOut ? T.surface : T.surfaceRaised, cursor: s.soldOut ? 'default' : 'pointer',
        opacity: s.soldOut ? 0.62 : 1, position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {fmtTime(s.startTime)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.display, fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em' }}>{f.title}</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.08em' }}>{screen.name.toUpperCase()} · {screen.format.toUpperCase()}</span>
        </div>
        {/* live fill bar */}
        <div style={{ marginTop: 10, height: 6, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: T.easeOut }}
            style={{ height: '100%', borderRadius: 99, background: s.soldOut ? T.red : `linear-gradient(90deg, ${T.orange}, ${T.gold})` }} />
        </div>
        <div style={{ marginTop: 7, fontFamily: T.mono, fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(s.sold)} / {s.capacity} seats
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 92 }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: st.color }}>{st.label}</span>
        <span style={{ fontFamily: T.body, fontSize: 13, color: T.muted }}>from ${s.priceFrom.toFixed(2)}</span>
        {!s.soldOut && <span style={{ fontSize: 13, color: T.orange, fontWeight: 600 }}>Book →</span>}
      </div>
    </motion.button>
  );
}

const EV_META: Record<string, { dot: string; label: (e: any) => string }> = {
  'booking.confirmed': { dot: '#52B788', label: (e) => `${e.seats} seat${e.seats > 1 ? 's' : ''} · ${e.filmTitle} ${e.time}` },
  'session.soldout': { dot: '#C4391D', label: (e) => `SOLD OUT · ${e.filmTitle} ${e.time}` },
  'fnb.ordered': { dot: '#C9922A', label: (e) => e.item },
  'loyalty.tier': { dot: '#3E5C8A', label: (e) => `${e.member} → ${e.tier}` },
};

function Ticker({ events }: { events: PulseState['events'] }) {
  return (
    <aside style={{ position: 'sticky', top: 40, border: `1px solid ${T.border}`, borderRadius: 14, background: T.navy, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9D2E2' }}>Event stream</span>
      </div>
      <div style={{ padding: '8px 8px 14px', maxHeight: 520, overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {events.slice(0, 14).map((e: any) => {
            const m = EV_META[e.kind];
            return (
              <motion.div key={e.id ?? e.at + e.kind} layout initial={{ opacity: 0, x: 16, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }} transition={T.spring}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: T.mono, fontSize: 10.5, color: '#7E8CA6', letterSpacing: '0.04em', flexShrink: 0 }}>{e.kind}</span>
                <span style={{ fontFamily: T.body, fontSize: 12.5, color: '#E8ECF3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label(e)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
