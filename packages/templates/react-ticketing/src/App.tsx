/// <reference types="vite/client" />
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { T } from './theme';
import { Chrome } from './components/Chrome';
import { Timeboard } from './components/Timeboard';
import { MissionControl } from './components/MissionControl';
import { CodeSeam } from './components/CodeSeam';
import { SeatsPage } from './pages/Seats';
import { ConfirmationPage } from './pages/Confirmation';
import { usePulse, type PulseState } from './lib/cinema';

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

function LensBar({ lens, setLens }: { lens: Lens; setLens: (l: Lens) => void }) {
  const navigate = useNavigate();
  const active = LENSES.find((l) => l.id === lens)!;
  return (
    <div style={{ position: 'sticky', top: 'calc(60px + clamp(14px,2.4vw,26px))', zIndex: 90, background: 'rgba(240,237,230,0.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px clamp(20px,5vw,40px)', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: '0.06em' }}>One cinema, live · seen as</span>
        <div style={{ display: 'inline-flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, padding: 3 }}>
          {LENSES.map((l) => {
            const on = l.id === lens;
            return (
              <button key={l.id} data-hot onClick={() => { setLens(l.id); navigate('/'); }}
                style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', padding: '7px 16px', borderRadius: 99, fontFamily: T.body, fontSize: 13.5, fontWeight: 600, color: on ? T.white : T.inkSoft }}>
                {on && <motion.span layoutId="lenspill" transition={T.spring} style={{ position: 'absolute', inset: 0, background: T.orange, borderRadius: 99, zIndex: -1 }} />}
                {l.label}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 13, color: T.muted, flex: 1, minWidth: 200 }}>{active.desc}</span>
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

function Shell({ pulse }: { pulse: PulseState }) {
  const [lens, setLens] = useState<Lens>('audience');
  const onHome = useLocation().pathname === '/';
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, position: 'relative', paddingInline: 'clamp(0px,2vw,26px)' }}>
      <Chrome />
      <Nav />
      {onHome && <LensBar lens={lens} setLens={setLens} />}
      <Routes>
        <Route path="/" element={<Home lens={lens} pulse={pulse} />} />
        <Route path="/book/:sessionId" element={<SeatsPage pulse={pulse} />} />
        <Route path="/done" element={<ConfirmationPage />} />
      </Routes>
    </div>
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
