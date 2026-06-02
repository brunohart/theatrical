import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { T } from '../theme';
import { Poster } from '../components/Poster';
import { filmOf } from '../lib/cinema';
import { useIsMobile } from '../lib/responsive';

interface Booked {
  filmId: string; filmTitle: string; screen: string; format: string; time: string; seats: string[]; price: number;
}

export function ConfirmationPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const state = (useLocation().state ?? null) as Booked | null;
  if (!state) { navigate('/'); return null; }
  const film = filmOf(state.filmId);

  const total = state.seats.length * state.price;
  const when = new Date(state.time).toLocaleString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true });

  // The stub art is a bare, recoloured panel (no title) — the film's palette + motif,
  // so the ticket reads as designed key art and never has to wrap a long title.
  const artBand = isMobile ? 132 : 168;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px clamp(20px,5vw,40px) 96px', textAlign: 'center' }}>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.orange }}>
        Booking confirmed
      </motion.p>
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, ...T.spring }}
        style={{ fontFamily: T.display, fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: T.ink, letterSpacing: '-0.03em', margin: '12px 0 32px' }}>
        Enjoy the show.
      </motion.h1>

      {/* the ticket */}
      <motion.div initial={{ opacity: 0, y: 28, rotateX: 14 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.26, ...T.spring }}
        style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', textAlign: 'left', background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px -50px rgba(27,45,79,0.5)' }}>
        <div style={{ flexShrink: 0, height: artBand, width: isMobile ? 'auto' : 156 }}>
          <Poster film={film} height={artBand} bare />
        </div>
        {/* perforation — vertical on desktop, horizontal on mobile */}
        {isMobile
          ? <div style={{ height: 2, background: `repeating-linear-gradient(90deg, ${T.border} 0 7px, transparent 7px 14px)` }} />
          : <div style={{ width: 2, background: `repeating-linear-gradient(180deg, ${T.border} 0 7px, transparent 7px 14px)` }} />}
        <div style={{ position: 'relative', padding: '22px 24px 30px', flex: 1, overflow: 'hidden' }}>
          <div style={{ fontFamily: T.display, fontSize: 'clamp(18px,5vw,22px)', fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{state.filmTitle}</div>
          <Row label="When" value={when} />
          <Row label="Where" value={`${state.screen} · ${state.format}`} />
          <Row label="Seats" value={state.seats.join(', ')} />
          <Row label="Total" value={`$${total.toFixed(2)} NZD`} />
          <div style={{ marginTop: 16, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', color: T.muted }}>
            ROXY · WELLINGTON · {state.seats.length} ADMIT
          </div>
          <Stamp />
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ color: T.muted, margin: '28px 0 24px', fontSize: 14 }}>
        Tickets sent to your phone. The auditorium opens 20 minutes before the show.
      </motion.p>
      <button data-hot onClick={() => navigate('/')}
        style={{ background: T.ink, color: T.bg, border: 'none', borderRadius: 10, padding: '12px 26px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.body }}>
        Back to the board
      </button>
    </div>
  );
}

/** Washed-out rubber-stamp watermark — a final hand-finished flourish. */
function Stamp() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', right: 14, bottom: 12, transform: 'rotate(-7deg)',
        opacity: 0.16, pointerEvents: 'none', filter: 'blur(0.4px)',
        color: T.navy, border: `1.5px solid ${T.navy}`, borderRadius: 7,
        padding: '4px 9px 5px', textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: T.mono, fontSize: 6.5, letterSpacing: '0.2em', marginBottom: 1 }}>BROUGHT TO YOU BY</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: T.display, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>
        <svg width="10" height="10" viewBox="0 0 32 32" style={{ display: 'block' }}>
          <rect width="32" height="32" rx="6" fill={T.navy} />
          <rect x="8" y="8" width="16" height="16" rx="3" fill={T.orange} />
          <rect x="13" y="13" width="6" height="6" rx="1.5" fill={T.bg} />
        </svg>
        THEATRICAL
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, width: 48, flexShrink: 0, paddingTop: 2 }}>{label}</span>
      <span style={{ fontFamily: T.body, fontSize: 14, color: T.inkSoft }}>{value}</span>
    </div>
  );
}
