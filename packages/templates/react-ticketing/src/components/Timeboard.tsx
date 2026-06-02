import React from 'react';
import { motion } from 'framer-motion';
import { T } from '../theme';
import { FILMS, SCREENS, type LiveSession, type PulseState } from '../lib/cinema';
import { Poster } from './Poster';

const film = (id: string) => FILMS.find((f) => f.id === id)!;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });

function status(s: LiveSession): { label: string; color: string } {
  if (s.soldOut) return { label: 'SOLD OUT', color: T.red };
  const left = s.capacity - Math.floor(s.sold);
  if (left <= 10) return { label: `${left} left`, color: T.orange };
  if (s.sold / s.capacity > 0.7) return { label: 'Selling fast', color: T.gold };
  return { label: 'Good seats', color: T.green };
}

export function Timeboard({ pulse, onOpen }: { pulse: PulseState; onOpen: (sessionId: string) => void }) {
  const sessions = [...pulse.sessions].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(28px,5vh,52px) clamp(20px,5vw,40px) 96px' }}>
      <header style={{ marginBottom: 32 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.orange }}>
          <motion.span animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: T.orange }} />
          Now showing · tonight
        </span>
        <h1 style={{ fontFamily: T.display, fontSize: 'clamp(2.2rem,5.5vw,3.8rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: T.ink, margin: '14px 0 0' }}>
          Tonight at the <span style={{ color: T.orange }}>Roxy</span>
        </h1>
        <p style={{ color: T.muted, marginTop: 12, fontSize: 17, maxWidth: '44ch', lineHeight: 1.5 }}>
          Seats are filling in real time. Watch the bars move — then grab yours before they&rsquo;re gone.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.map((s) => <SessionRow key={s.id} s={s} onOpen={onOpen} />)}
      </div>
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
        display: 'grid', gridTemplateColumns: '52px 78px 1fr auto', gap: 18, alignItems: 'center',
        textAlign: 'left', width: '100%', padding: '14px 18px 14px 14px', border: `1px solid ${T.border}`,
        borderRadius: 14, background: s.soldOut ? T.surface : T.surfaceRaised, cursor: s.soldOut ? 'default' : 'pointer',
        opacity: s.soldOut ? 0.62 : 1,
      }}
    >
      <div style={{ width: 52, height: 74, borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <Poster film={f} height={74} />
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 19, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {fmtTime(s.startTime)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.display, fontSize: 18, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em' }}>{f.title}</span>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted, letterSpacing: '0.07em' }}>{screen.name.toUpperCase()} · {screen.format.toUpperCase()}</span>
        </div>
        <div style={{ marginTop: 9, height: 6, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: T.easeOut }}
            style={{ height: '100%', borderRadius: 99, background: s.soldOut ? T.red : `linear-gradient(90deg, ${T.orange}, ${T.gold})` }} />
        </div>
        <div style={{ marginTop: 6, fontFamily: T.mono, fontSize: 10.5, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(s.sold)} / {s.capacity} seats</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 88 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: st.color }}>{st.label}</span>
        <span style={{ fontFamily: T.body, fontSize: 13, color: T.muted }}>from ${s.priceFrom.toFixed(2)}</span>
        {!s.soldOut && <span style={{ fontSize: 13, color: T.orange, fontWeight: 600 }}>Book →</span>}
      </div>
    </motion.button>
  );
}
