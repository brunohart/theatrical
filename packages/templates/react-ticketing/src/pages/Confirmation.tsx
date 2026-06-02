import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { T } from '../theme';
import { Poster } from '../components/Poster';
import { filmOf } from '../lib/cinema';

interface Booked {
  filmId: string; filmTitle: string; screen: string; format: string; time: string; seats: string[]; price: number;
}

export function ConfirmationPage() {
  const navigate = useNavigate();
  const state = (useLocation().state ?? null) as Booked | null;
  if (!state) { navigate('/'); return null; }
  const film = filmOf(state.filmId);

  const total = state.seats.length * state.price;
  const when = new Date(state.time).toLocaleString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true });

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
        style={{ display: 'flex', textAlign: 'left', background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px -50px rgba(27,45,79,0.5)' }}>
        <div style={{ width: 120, flexShrink: 0 }}>
          <Poster film={film} height={200} />
        </div>
        {/* perforation */}
        <div style={{ width: 2, background: `repeating-linear-gradient(180deg, ${T.border} 0 7px, transparent 7px 14px)` }} />
        <div style={{ padding: '22px 24px', flex: 1 }}>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{state.filmTitle}</div>
          <Row label="When" value={when} />
          <Row label="Where" value={`${state.screen} · ${state.format}`} />
          <Row label="Seats" value={state.seats.join(', ')} />
          <Row label="Total" value={`$${total.toFixed(2)} NZD`} />
          <div style={{ marginTop: 16, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', color: T.muted }}>
            ROXY · WELLINGTON · {state.seats.length} ADMIT
          </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, width: 48, flexShrink: 0, paddingTop: 2 }}>{label}</span>
      <span style={{ fontFamily: T.body, fontSize: 14, color: T.inkSoft }}>{value}</span>
    </div>
  );
}
