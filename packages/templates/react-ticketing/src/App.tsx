/// <reference types="vite/client" />
import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { T } from './theme';
import { Chrome } from './components/Chrome';
import { Timeboard } from './components/Timeboard';
import { SeatsPage } from './pages/Seats';
import { ConfirmationPage } from './pages/Confirmation';
import { usePulse, type PulseState } from './lib/cinema';

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

function Home({ pulse }: { pulse: PulseState }) {
  const navigate = useNavigate();
  return <Timeboard pulse={pulse} onOpen={(id) => navigate(`/book/${id}`)} />;
}

export default function App() {
  const pulse = usePulse();
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, position: 'relative', paddingInline: 'clamp(0px,2vw,26px)' }}>
        <Chrome />
        <Nav />
        <Routes>
          <Route path="/" element={<Home pulse={pulse} />} />
          <Route path="/book/:sessionId" element={<SeatsPage pulse={pulse} />} />
          <Route path="/done" element={<ConfirmationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
