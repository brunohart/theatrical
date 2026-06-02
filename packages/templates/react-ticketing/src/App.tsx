/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from './theme';
import { Chrome } from './components/Chrome';
import { Timeboard } from './components/Timeboard';
import { MissionControl } from './components/MissionControl';
import { CodeSeam } from './components/CodeSeam';
import { SeatsPage } from './pages/Seats';
import { ConfirmationPage } from './pages/Confirmation';
import { usePulse, filmOf, SCREENS, type PulseState } from './lib/cinema';

type Lens = 'audience' | 'operator' | 'developer';
const LENSES: { id: Lens; label: string; desc: string }[] = [
  { id: 'audience', label: 'Audience', desc: 'What a moviegoer sees — browse the live board and book.' },
  { id: 'operator', label: 'Operator', desc: 'What a cinema manager sees — the building’s live pulse.' },
  { id: 'developer', label: 'Developer', desc: 'What you ship — the whole thing in a few lines of @theatrical.' },
];

function Nav() {
  const now = new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <nav style={{ position: 'sticky', top: 'clamp(14px,2.4vw,26px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 clamp(20px,5vw,40px)', borderBottom: `1px solid ${T.border}`, background: 'rgba(240,237,230,0.82)', backdropFilter: 'blur(10px)' }}>
      <a href="/" data-hot style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: T.navy, boxShadow: `inset 0 0 0 4px ${T.bg}, inset 0 0 0 8px ${T.orange}` }} />
        <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', color: T.navy }}>theatrical</span>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, background: T.surfaceRaised, border: `1px solid ${T.border}`, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.1em' }}>LIVE DEMO</span>
      </a>
      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} /> Roxy · Wellington · {now}
      </span>
    </nav>
  );
}

function LensBar({ lens, setLens, onTour }: { lens: Lens; setLens: (l: Lens) => void; onTour: () => void }) {
  const navigate = useNavigate();
  const active = LENSES.find((l) => l.id === lens)!;
  return (
    <div style={{ position: 'sticky', top: 'calc(60px + clamp(14px,2.4vw,26px))', zIndex: 90, background: 'rgba(240,237,230,0.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px clamp(20px,5vw,40px)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.06em' }}>One cinema, live · seen as</span>
        <div style={{ display: 'inline-flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, padding: 3 }}>
          {LENSES.map((l) => {
            const on = l.id === lens;
            return (
              <button key={l.id} data-hot onClick={() => { setLens(l.id); navigate('/'); }}
                style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', padding: '7px 16px', borderRadius: 99, fontFamily: T.body, fontSize: 13.5, fontWeight: 600 }}>
                {on && <motion.span layoutId="lenspill" transition={T.spring} style={{ position: 'absolute', inset: 0, background: T.orange, borderRadius: 99, zIndex: 0 }} />}
                <span style={{ position: 'relative', zIndex: 1, color: on ? T.white : T.inkSoft }}>{l.label}</span>
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 13, color: T.muted, flex: 1, minWidth: 180 }}>{active.desc}</span>
        <button data-hot onClick={onTour}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${T.navy}`, background: 'none', color: T.navy, cursor: 'pointer', padding: '7px 14px', borderRadius: 99, fontFamily: T.body, fontSize: 13, fontWeight: 600 }}>
          ▶ Auto-tour
        </button>
      </div>
    </div>
  );
}

function Home({ lens, pulse }: { lens: Lens; pulse: PulseState }) {
  const navigate = useNavigate();
  if (lens === 'operator') return <MissionControl pulse={pulse} />;
  if (lens === 'developer') return <CodeSeam />;
  return <Timeboard pulse={pulse} onOpen={(id) => navigate(`/book/${id}`)} />;
}

interface TourStep { caption: string; ms: number; run: (ctx: { pulse: PulseState; nav: ReturnType<typeof useNavigate>; setLens: (l: Lens) => void }) => void; }
const TOUR: TourStep[] = [
  { caption: 'One cinema, breathing live. This is what the audience sees — every seat filling in real time.', ms: 5600, run: ({ setLens, nav }) => { setLens('audience'); nav('/'); } },
  { caption: 'Step inside — a centred, per-screen auditorium. Seats keep filling as you choose.', ms: 5600, run: ({ pulse, nav }) => { const s = pulse.sessions.find((x) => !x.soldOut) ?? pulse.sessions[0]!; nav(`/book/${s.id}`); } },
  { caption: 'Booked — a real ticket, in a few taps.', ms: 4600, run: ({ pulse, nav }) => { const s = pulse.sessions.find((x) => !x.soldOut) ?? pulse.sessions[0]!; const f = filmOf(s.filmId); nav('/done', { state: { filmId: f.id, filmTitle: f.title, screen: SCREENS[s.screenId]!.name, format: SCREENS[s.screenId]!.format, time: s.startTime, seats: ['F7', 'F8', 'F9'], price: s.priceFrom } }); } },
  { caption: 'The operator’s view: the pulse surfaced — sell-outs projected before they happen.', ms: 6200, run: ({ setLens, nav }) => { setLens('operator'); nav('/'); } },
  { caption: 'And the whole living system? A few lines of @theatrical. Build it this afternoon.', ms: 6400, run: ({ setLens, nav }) => { setLens('developer'); nav('/'); } },
];

function readLens(): Lens {
  const l = new URLSearchParams(window.location.search).get('lens');
  return (['audience', 'operator', 'developer'] as const).includes(l as Lens) ? (l as Lens) : 'audience';
}

function Shell({ pulse }: { pulse: PulseState }) {
  const [lens, setLens] = useState<Lens>(readLens);
  const [tour, setTour] = useState<number | null>(null);
  const [nudge, setNudge] = useState(false);
  const navigate = useNavigate();
  const onHome = useLocation().pathname === '/';

  // Deep links: ?lens=operator lands on a lens; ?tour=1 auto-plays the tour.
  // Otherwise, a subtle one-time nudge invites the tour.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('tour') === '1') { setTour(0); return; }
    if (!sessionStorage.getItem('th_tour_seen')) {
      const id = window.setTimeout(() => setNudge(true), 1800);
      return () => clearTimeout(id);
    }
  }, []);

  const startTour = () => { sessionStorage.setItem('th_tour_seen', '1'); setNudge(false); setTour(0); };
  const dismissNudge = () => { sessionStorage.setItem('th_tour_seen', '1'); setNudge(false); };

  useEffect(() => {
    if (tour === null) return;
    if (tour >= TOUR.length) { setTour(null); setLens('audience'); navigate('/'); return; }
    TOUR[tour]!.run({ pulse, nav: navigate, setLens });
    const id = window.setTimeout(() => setTour((t) => (t === null ? null : t + 1)), TOUR[tour]!.ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, position: 'relative', paddingInline: 'clamp(0px,2vw,26px)' }}>
      <Chrome />
      <Nav />
      {onHome && <LensBar lens={lens} setLens={setLens} onTour={startTour} />}
      <Routes>
        <Route path="/" element={<Home lens={lens} pulse={pulse} />} />
        <Route path="/book/:sessionId" element={<SeatsPage pulse={pulse} />} />
        <Route path="/done" element={<ConfirmationPage />} />
      </Routes>
      <TourCaption tour={tour} stop={() => { setTour(null); setLens('audience'); navigate('/'); }} />
      <TourNudge show={nudge && tour === null} start={startTour} dismiss={dismissNudge} />
    </div>
  );
}

function TourNudge({ show, start, dismiss }: { show: boolean; start: () => void; dismiss: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={T.spring}
          style={{ position: 'fixed', left: 'clamp(20px,4vw,40px)', bottom: 'clamp(24px,4vw,40px)', zIndex: 480, display: 'flex', alignItems: 'center', gap: 12, background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 99, padding: '8px 10px 8px 16px', boxShadow: '0 22px 44px -28px rgba(27,45,79,0.5)' }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: T.orange }} />
          <span style={{ fontSize: 13.5, color: T.inkSoft }}>New here? Take the 30-second tour.</span>
          <button data-hot onClick={start} style={{ border: 'none', background: T.orange, color: T.white, cursor: 'pointer', borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 600, fontFamily: T.body }}>▶ Play</button>
          <button data-hot onClick={dismiss} aria-label="Dismiss" style={{ border: 'none', background: 'none', color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 6px' }}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TourCaption({ tour, stop }: { tour: number | null; stop: () => void }) {
  return (
    <AnimatePresence>
      {tour !== null && tour < TOUR.length && (
        <motion.div key={tour} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={T.spring}
          style={{ position: 'fixed', left: '50%', bottom: 'clamp(26px,4vw,44px)', transform: 'translateX(-50%)', zIndex: 500, width: 'min(640px, calc(100vw - 48px))' }}>
          <div style={{ background: T.navy, borderRadius: 14, padding: '16px 18px', boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.16em', color: T.orangeSoft, flexShrink: 0 }}>TOUR {tour + 1}/{TOUR.length}</span>
              <span style={{ fontFamily: T.body, fontSize: 14.5, color: '#EEF1F6', lineHeight: 1.45 }}>{TOUR[tour]!.caption}</span>
              <button data-hot onClick={stop} style={{ marginLeft: 'auto', flexShrink: 0, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#C9D2E2', cursor: 'pointer', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontFamily: T.body }}>End</button>
            </div>
            <div style={{ marginTop: 12, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div key={'p' + tour} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: TOUR[tour]!.ms / 1000, ease: 'linear' }} style={{ height: '100%', background: T.orange }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const pulse = usePulse();
  return (
    <BrowserRouter>
      <Shell pulse={pulse} />
    </BrowserRouter>
  );
}
