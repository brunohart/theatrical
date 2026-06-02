import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from '../theme';
import { FILMS, SCREENS, type LiveSession, type PulseState } from '../lib/cinema';
import { useIsMobile } from '../lib/responsive';

const film = (id: string) => FILMS.find((f) => f.id === id)!;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });

export function MissionControl({ pulse }: { pulse: PulseState }) {
  const isMobile = useIsMobile();
  const occupancy = Math.round((pulse.totalSold / pulse.capacity) * 100);

  // sellout projections — the slope, not the number
  const now = Date.now();
  const projections = pulse.sessions
    .filter((s) => !s.soldOut && s.velocity > 0 && Date.parse(s.startTime) > now - 30 * 60000)
    .map((s) => ({ s, eta: (s.capacity - s.sold) / s.velocity })) // seconds
    .filter((p) => p.eta < 60 * 60) // within the hour
    .sort((a, b) => a.eta - b.eta)
    .slice(0, 4);

  // occupancy per screen
  const byScreen = Object.values(SCREENS).map((screen) => {
    const ss = pulse.sessions.filter((s) => s.screenId === screen.id);
    const sold = ss.reduce((a, s) => a + Math.floor(s.sold), 0);
    const cap = ss.reduce((a, s) => a + s.capacity, 0) || 1;
    return { screen, pct: Math.round((sold / cap) * 100) };
  });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px,5vh,52px) clamp(20px,5vw,40px) 96px' }}>
      <Head title="Mission control" accent="The operator never looks." sub="The systems that need to know are already informed — the platform's pulse, surfaced. Slope, not snapshot." />

      <div style={{ display: 'flex', gap: 'clamp(20px,4vw,56px)', flexWrap: 'wrap', margin: '8px 0 36px', paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>
        <Vital label="Admissions tonight" value={pulse.totalSold} />
        <Vital label="Box office" value={Math.round(pulse.revenue)} prefix="$" />
        <Vital label="House occupancy" value={occupancy} suffix="%" />
        <Vital label="Live sessions" value={pulse.sessions.filter((s) => !s.soldOut).length} />
        <RevenueSpark value={pulse.revenue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) clamp(280px,30%,360px)', gap: 'clamp(24px,4vw,48px)', alignItems: 'start' }}>
        {/* On mobile the live stream is the headline — surface it first. */}
        {isMobile && <Stream events={pulse.events} isMobile />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* projections */}
          <Panel label="Trajectory — projected sell-outs">
            {projections.length === 0 && <Empty>No sessions trending to sell out right now.</Empty>}
            {projections.map(({ s, eta }) => <Projection key={s.id} s={s} eta={eta} />)}
          </Panel>
          {/* occupancy by screen */}
          <Panel label="House occupancy by screen">
            {byScreen.map(({ screen, pct }) => (
              <div key={screen.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '92px 1fr 40px' : '160px 1fr 48px', gap: 14, alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 13, color: T.inkSoft, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screen.name} <span style={{ color: T.muted, fontSize: 11 }}>· {screen.format}</span></span>
                <div style={{ height: 8, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: T.easeOut }} style={{ height: '100%', borderRadius: 99, background: pct > 85 ? T.red : `linear-gradient(90deg,${T.navy},${T.orange})` }} />
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              </div>
            ))}
          </Panel>
          {/* concessions slope */}
          <Panel label="Concessions — depletion forecast">
            <Concession label="Popcorn (large)" pct={62} note="runs dry ~21:10 · mid-intermission" warn isMobile={isMobile} />
            <Concession label="Choc-tops" pct={84} note="comfortable through tonight" isMobile={isMobile} />
            <Concession label="Craft cider" pct={41} note="reorder before the 20:00 rush" warn isMobile={isMobile} />
          </Panel>
        </div>
        {!isMobile && <Stream events={pulse.events} />}
      </div>
    </div>
  );
}

function Projection({ s, eta }: { s: LiveSession; eta: number }) {
  const f = film(s.filmId);
  const mins = Math.max(1, Math.round(eta / 60));
  const urgent = mins <= 8;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 600, color: T.ink }}>{f.title} <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, fontWeight: 400 }}>· {fmtTime(s.startTime)}</span></div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{s.capacity - Math.floor(s.sold)} seats left · {SCREENS[s.screenId]!.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: urgent ? T.red : T.orange, letterSpacing: '-0.02em' }}>~{mins}m</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>to sell out</div>
      </div>
    </div>
  );
}

function Concession({ label, pct, note, warn, isMobile }: { label: string; pct: number; note: string; warn?: boolean; isMobile?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '92px 1fr' : '130px 1fr', gap: 14, alignItems: 'center', padding: '9px 0' }}>
      <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
      <div>
        <div style={{ height: 6, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: warn ? T.orange : T.green }} />
        </div>
        <div style={{ fontSize: 11.5, color: warn ? T.orange : T.muted, marginTop: 4 }}>{note}</div>
      </div>
    </div>
  );
}

function RevenueSpark({ value }: { value: number }) {
  const hist = useRef<number[]>([]);
  if (hist.current[hist.current.length - 1] !== value) hist.current = [...hist.current, value].slice(-40);
  const pts = hist.current;
  const min = Math.min(...pts, value), max = Math.max(...pts, value) || 1;
  const d = pts.map((v, i) => `${(i / Math.max(1, pts.length - 1)) * 120},${28 - ((v - min) / (max - min || 1)) * 26}`).join(' ');
  return (
    <div>
      <svg width={120} height={30} style={{ display: 'block' }}>
        <polyline points={d} fill="none" stroke={T.orange} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginTop: 4 }}>Box office · live</div>
    </div>
  );
}

function Head({ title, accent, sub }: { title: string; accent: string; sub: string }) {
  return (
    <header style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.orange }}>Operator view</span>
      <h1 style={{ fontFamily: T.display, fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: T.ink, margin: '12px 0 0' }}>
        {title}. <span style={{ color: T.muted }}>{accent}</span>
      </h1>
      <p style={{ color: T.muted, marginTop: 12, fontSize: 16, maxWidth: '56ch', lineHeight: 1.5 }}>{sub}</p>
    </header>
  );
}

function Vital({ label, value, prefix = '', suffix = '' }: { label: string; value: number; prefix?: string; suffix?: string }) {
  return (
    <div>
      <div style={{ fontFamily: T.display, fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{prefix}{value.toLocaleString('en-NZ')}{suffix}</div>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${T.border}`, borderRadius: 14, background: T.surfaceRaised, padding: '18px 22px' }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>{label}</div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: T.muted, fontSize: 13, padding: '8px 0' }}>{children}</div>;
}

const EV: Record<string, { dot: string; label: (e: any) => string }> = {
  'booking.confirmed': { dot: '#52B788', label: (e) => `${e.seats} seat${e.seats > 1 ? 's' : ''} · ${e.filmTitle} ${e.time}` },
  'session.soldout': { dot: '#C4391D', label: (e) => `SOLD OUT · ${e.filmTitle} ${e.time}` },
  'fnb.ordered': { dot: '#C9922A', label: (e) => e.item },
  'loyalty.tier': { dot: '#3E5C8A', label: (e) => `${e.member} → ${e.tier}` },
};

function Stream({ events, isMobile }: { events: PulseState['events']; isMobile?: boolean }) {
  return (
    <aside style={{ position: isMobile ? 'static' : 'sticky', top: 96, border: `1px solid ${T.border}`, borderRadius: 14, background: T.navy, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9D2E2' }}>Event stream</span>
        <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: '#7E8CA6' }}>@theatrical/events</span>
      </div>
      <div style={{ padding: '8px 8px 14px', maxHeight: isMobile ? 360 : 560, overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {events.slice(0, isMobile ? 8 : 15).map((e: any) => (
            <motion.div key={e.id ?? e.at + e.kind} layout initial={{ opacity: 0, x: 16, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }} transition={T.spring}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: EV[e.kind].dot, flexShrink: 0 }} />
              <span style={{ fontFamily: T.mono, fontSize: 10.5, color: '#7E8CA6', flexShrink: 0 }}>{e.kind}</span>
              <span style={{ fontFamily: T.body, fontSize: 12.5, color: '#E8ECF3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{EV[e.kind].label(e)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}
