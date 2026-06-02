import React from 'react';
import { motion } from 'framer-motion';
import { T } from '../theme';

interface Seam { tag: string; powers: string; caption: string; code: string; }

const SEAMS: Seam[] = [
  {
    tag: '@theatrical/events',
    powers: 'the live event stream',
    caption: 'Poll → diff → emit. Five lines turn a request-response API into a heartbeat.',
    code: `import { BookingWatcher } from '@theatrical/events';

const watcher = new BookingWatcher({
  fetch: (signal) => client.orders.list({}, signal),
});

watcher.on('booking.confirmed', ({ order }) => {
  stream.push(order);   // the pulse reaches the UI
});

watcher.start();`,
  },
  {
    tag: '@theatrical/sdk',
    powers: 'the live board',
    caption: 'Typed, autocompleted, zero credentials in mock mode — real NZ cinema fixtures.',
    code: `import { TheatricalClient } from '@theatrical/sdk';

const client = TheatricalClient.createMock();

const { data: films } = await client.films.nowShowing();
const sessions = await client.sessions.list({
  siteId: 'roxy-wellington',
});`,
  },
  {
    tag: '@theatrical/react',
    powers: 'step inside',
    caption: 'ARIA seat selection, wheelchair + companion markers, themeable, cinema-aware.',
    code: `import { SeatMap } from '@theatrical/react';

<SeatMap
  rows={rows}
  selectedSeatIds={selected}
  onSeatSelect={toggle}
  maxSelectable={8}
/>;`,
  },
  {
    tag: 'the slope',
    powers: 'mission control',
    caption: 'The interesting fact is never the count. It is the rate of change.',
    code: `// the photograph says: 88 seats sold
// the pulse says:
const eta = (session.capacity - session.sold) / session.velocity;
//  → "Poor Things 7:15 — sells out in ~6 minutes"`,
  },
];

export function CodeSeam() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px,5vh,52px) clamp(20px,5vw,40px) 96px' }}>
      <header style={{ marginBottom: 40 }}>
        <span style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.orange }}>Developer view</span>
        <h1 style={{ fontFamily: T.display, fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: T.ink, margin: '12px 0 0' }}>
          The whole thing is <span style={{ color: T.orange }}>a few dozen lines.</span>
        </h1>
        <p style={{ color: T.muted, marginTop: 12, fontSize: 16, maxWidth: '58ch', lineHeight: 1.5 }}>
          Everything you just watched — the breathing board, the seat maps, the slopes — sits on top of Theatrical. Here is the wiring.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,440px), 1fr))', gap: 24 }}>
        {SEAMS.map((s, i) => (
          <motion.div key={s.tag} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, ...T.spring }}
            style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', background: T.surfaceRaised }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <code style={{ fontFamily: T.mono, fontSize: 13, color: T.orange }}>{s.tag}</code>
              <span style={{ color: T.muted, fontSize: 13 }}> &nbsp;powers {s.powers}</span>
              <p style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}>{s.caption}</p>
            </div>
            <Code code={s.code} />
          </motion.div>
        ))}
      </div>

      <p style={{ marginTop: 36, textAlign: 'center', color: T.muted, fontSize: 15 }}>
        <code style={{ fontFamily: T.mono, color: T.inkSoft }}>npx @theatrical/cli init</code> &nbsp;·&nbsp; build the future of cinema this afternoon.
      </p>
    </div>
  );
}

/** Restrained syntax tone: package names cinnabar, comments dimmed, the rest soft. */
function Code({ code }: { code: string }) {
  return (
    <pre style={{ margin: 0, padding: '18px 20px', background: T.navyDeep, overflowX: 'auto', fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.7, color: '#C6D0E2' }}>
      {code.split('\n').map((line, i) => {
        const ci = line.indexOf('//');
        const codePart = ci >= 0 ? line.slice(0, ci) : line;
        const comment = ci >= 0 ? line.slice(ci) : '';
        const segs = codePart.split(/(@theatrical\/[a-z]+|'[^']*')/g);
        return (
          <div key={i}>
            {segs.map((seg, j) =>
              seg.startsWith('@theatrical/') ? <span key={j} style={{ color: T.orangeSoft }}>{seg}</span>
              : seg.startsWith("'") ? <span key={j} style={{ color: '#9DD3A8' }}>{seg}</span>
              : <span key={j}>{seg}</span>,
            )}
            {comment && <span style={{ color: '#6E7E9C', fontStyle: 'italic' }}>{comment}</span>}
            {line === '' ? '​' : ''}
          </div>
        );
      })}
    </pre>
  );
}
