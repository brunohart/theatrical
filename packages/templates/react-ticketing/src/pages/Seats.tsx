import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { T } from '../theme';
import { FILMS, SCREENS, type PulseState } from '../lib/cinema';
import { useIsMobile } from '../lib/responsive';

const ROWS = 'ABCDEFGHIJKLMN';
type SeatState = 'available' | 'taken' | 'premium' | 'wheelchair' | 'companion';
const COLOR: Record<SeatState | 'selected', string> = {
  available: T.navy, taken: T.border, premium: T.gold, wheelchair: '#2A6F97', companion: T.green, selected: T.orange,
};

/** stable hash → [0,1) so a seat's "fill order" is consistent across ticks */
function h(str: string) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return ((x >>> 0) % 1000) / 1000; }

export function SeatsPage({ pulse }: { pulse: PulseState }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const session = pulse.sessions.find((s) => s.id === sessionId);
  const screen = session ? SCREENS[session.screenId] : undefined;

  // per-seat base state (premium band + accessibility), deterministic per screen
  const baseState = useMemo(() => {
    const map = new Map<string, SeatState>();
    if (!screen) return map;
    const midRow = Math.floor(screen.layout.length / 2);
    screen.layout.forEach((count, ri) => {
      const rowL = ROWS[ri];
      for (let c = 1; c <= count; c++) {
        const id = `${rowL}${c}`;
        let st: SeatState = 'available';
        // premium band — best seats, middle rows, centre block
        if ((screen.format === 'Gold Class') || (Math.abs(ri - midRow) <= 1 && c > count * 0.3 && c < count * 0.7)) st = 'premium';
        if (ri === 0 && (c === 1 || c === count)) st = 'wheelchair';
        if (ri === 0 && (c === 2 || c === count - 1)) st = 'companion';
        map.set(id, st);
      }
    });
    return map;
  }, [screen]);

  if (!session || !screen) { navigate('/'); return null; }
  const ses = session;
  const scr = screen;
  const f = FILMS.find((x) => x.id === ses.filmId)!;
  const soldRatio = ses.sold / ses.capacity;
  const seatSize = scr.format === 'Gold Class' ? 30 : scr.layout.some((n) => n >= 22) ? 18 : 22;

  function toggle(id: string, taken: boolean) {
    if (taken) return;
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else if (n.size < 8) n.add(id); return n; });
  }

  function confirm() {
    if (!selected.size) return;
    navigate('/done', { state: { filmId: f.id, filmTitle: f.title, screen: scr.name, format: scr.format, time: ses.startTime, seats: [...selected], price: ses.priceFrom } });
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px clamp(20px,5vw,40px) 96px' }}>
      <button data-hot onClick={() => navigate('/')} style={{ color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>← Back to the board</button>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: T.display, fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{f.title}</h1>
        <p style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>
          {screen.name} · {screen.format} · {new Date(session.startTime).toLocaleString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
        </p>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, background: T.surface, padding: 'clamp(20px,4vw,40px)', overflowX: 'auto' }}>
        {/* the screen */}
        <div style={{ position: 'relative', marginBottom: 34, textAlign: 'center' }}>
          <div style={{ height: 8, width: '62%', margin: '0 auto', borderRadius: '0 0 50% 50%', background: `linear-gradient(180deg, ${T.orange}, transparent)`, boxShadow: `0 0 40px ${T.orange}44` }} />
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.4em', color: T.muted, marginTop: 6 }}>SCREEN</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {screen.layout.map((count, ri) => {
            const rowL = ROWS[ri];
            return (
              <div key={rowL} style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <span style={{ position: 'absolute', left: -22, fontFamily: T.mono, fontSize: 10, color: T.muted }}>{rowL}</span>
                {Array.from({ length: count }, (_, i) => {
                  const c = i + 1;
                  const id = `${rowL}${c}`;
                  const base = baseState.get(id)!;
                  const taken = base !== 'wheelchair' && base !== 'companion' && h(`${screen.id}-${id}`) < soldRatio;
                  const isSel = selected.has(id);
                  const state: SeatState | 'selected' = isSel ? 'selected' : taken ? 'taken' : base;
                  const aisle = screen.aisleAfter?.includes(c) ? 14 : 0;
                  return (
                    <React.Fragment key={id}>
                      <motion.button
                        data-hot
                        onClick={() => toggle(id, taken)}
                        whileHover={taken ? {} : { scale: 1.18 }}
                        animate={{ scale: isSel ? 1.12 : 1 }}
                        transition={T.spring}
                        title={`${id}${base === 'premium' ? ' · Premium' : base === 'wheelchair' ? ' · Accessible' : ''}`}
                        style={{
                          width: seatSize, height: seatSize, borderRadius: screen.format === 'Gold Class' ? 8 : 5,
                          border: 'none', padding: 0, cursor: taken ? 'not-allowed' : 'pointer',
                          background: COLOR[state], boxShadow: isSel ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${T.orange}` : 'none',
                          opacity: taken ? 0.5 : 1,
                        }}
                      />
                      {aisle > 0 && <span style={{ width: aisle }} />}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', fontFamily: T.mono, fontSize: 12, color: T.muted }}>
          {selected.size} of 8 selected · {Math.floor(session.sold)}/{session.capacity} sold
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {(['available', 'selected', 'taken', 'premium', 'wheelchair', 'companion'] as const).map((k) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, textTransform: 'capitalize' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: COLOR[k] }} />{k}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 28, display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center', gap: 18,
        ...(isMobile ? ({
          position: 'sticky', bottom: 'calc(clamp(14px,2.4vw,26px) + 12px)', zIndex: 60,
          background: 'rgba(240,237,230,0.94)', backdropFilter: 'blur(8px)',
          border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 14px',
          boxShadow: '0 18px 40px -26px rgba(27,45,79,0.5)',
        } as React.CSSProperties) : {}),
      }}>
        <span style={{ color: T.muted, fontSize: 14 }}>{selected.size} seat{selected.size !== 1 ? 's' : ''} · ${(selected.size * session.priceFrom).toFixed(2)}</span>
        <motion.button data-hot whileHover={{ scale: selected.size ? 1.03 : 1 }} whileTap={{ scale: 0.97 }} onClick={confirm} disabled={!selected.size}
          style={{ background: selected.size ? T.orange : T.border, color: selected.size ? T.white : T.muted, border: 'none', borderRadius: 10, padding: isMobile ? '12px 22px' : '13px 30px', fontSize: 15, fontWeight: 600, fontFamily: T.body, cursor: selected.size ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
          Confirm seats →
        </motion.button>
      </div>
    </div>
  );
}
