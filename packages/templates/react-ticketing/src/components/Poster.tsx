import React from 'react';
import type { Film } from '../lib/cinema';

/**
 * Bespoke film-poster artwork. No external images — every poster is composed
 * from the film's own palette + a motif, in the Roxy house style (think
 * minimalist A24/Criterion key art). A missing photo can never break it, and
 * the lineup reads as one designed season rather than scraped thumbnails.
 */
export function Poster({ film, height = 300 }: { film: Film; height?: number }) {
  const compact = height < 130;
  const ground = `linear-gradient(155deg, ${dark(film.accent, 0.32)} 0%, ${film.accent} 56%, ${dark(film.accent, 0.58)} 100%)`;
  const titleSize = Math.max(15, Math.min(30, height * 0.13));

  return (
    <div style={{ height, position: 'relative', overflow: 'hidden', background: ground }}>
      {motif(film.motif, film.accent2, compact)}
      {/* film-grain / vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 100% at 50% -10%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(120% 120% at 50% 120%, rgba(0,0,0,0.55), transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.10, mixBlendMode: 'overlay', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>")' }} />

      {!compact && (
        <>
          <div style={{ position: 'absolute', top: 13, left: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={badge()}>{film.classification}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.72)' }}>{film.year}</span>
          </div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', marginBottom: 7, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>{film.tagline}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: titleSize, lineHeight: 0.98, letterSpacing: '-0.02em', color: '#F0EDE6', textShadow: '0 2px 18px rgba(0,0,0,0.45)' }}>{film.title}</div>
            <div style={{ marginTop: 9, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.58)' }}>{film.genres.join(' · ').toUpperCase()}</div>
          </div>
        </>
      )}
    </div>
  );
}

/** Each motif is an abstract, poster-scale composition keyed off the film. */
function motif(kind: number, hl: string, compact: boolean) {
  const k = ((kind % 4) + 4) % 4;
  if (k === 0) {
    // ORB — a sun/planet/spotlight rising from the upper field.
    return (
      <>
        <div style={{ position: 'absolute', top: compact ? '-30%' : '-22%', left: '50%', transform: 'translateX(-50%)', width: '128%', aspectRatio: '1', borderRadius: '50%', background: `radial-gradient(circle at 50% 50%, ${light(hl, 0.2)} 0%, ${hl} 34%, transparent 62%)`, opacity: 0.92 }} />
        <div style={{ position: 'absolute', top: compact ? '-10%' : '2%', left: '50%', transform: 'translateX(-50%)', width: '70%', aspectRatio: '1', borderRadius: '50%', border: `1px solid ${light(hl, 0.35)}`, opacity: 0.35 }} />
      </>
    );
  }
  if (k === 1) {
    // BEAMS — vertical projector light streaking down.
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(99deg, transparent 0 14px, ${hl}14 14px 15px)`, opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: '-12%', left: '58%', width: '34%', height: '124%', transform: 'rotate(8deg)', background: `linear-gradient(180deg, ${light(hl, 0.3)} 0%, transparent 78%)`, opacity: 0.55, filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', top: '-12%', left: '26%', width: '4%', height: '124%', transform: 'rotate(8deg)', background: light(hl, 0.4), opacity: 0.7 }} />
      </>
    );
  }
  if (k === 2) {
    // ARC — concentric horizons swelling from below.
    return (
      <>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', bottom: `${-58 + i * 16}%`, left: '50%', transform: 'translateX(-50%)', width: `${150 - i * 26}%`, aspectRatio: '1', borderRadius: '50%', border: `1.5px solid ${hl}`, opacity: 0.16 + i * 0.16 }} />
        ))}
        <div style={{ position: 'absolute', bottom: '-46%', left: '50%', transform: 'translateX(-50%)', width: '70%', aspectRatio: '1', borderRadius: '50%', background: `radial-gradient(circle, ${hl} 0%, transparent 64%)`, opacity: 0.5 }} />
      </>
    );
  }
  // RIFT — a diagonal seam splitting the field.
  return (
    <>
      <div style={{ position: 'absolute', inset: '-20%', background: `linear-gradient(118deg, transparent 0 47%, ${light(hl, 0.35)} 49.4% 50.6%, transparent 53%)`, opacity: 0.85 }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(118deg, ${dark(hl, 0.2)} 0 49%, transparent 49% 100%)`, opacity: 0.45 }} />
      <div style={{ position: 'absolute', top: compact ? '8%' : '14%', right: '14%', width: '30%', aspectRatio: '1', borderRadius: '50%', background: `radial-gradient(circle, ${light(hl, 0.2)} 0%, transparent 65%)`, opacity: 0.6 }} />
    </>
  );
}

const badge = (): React.CSSProperties => ({
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  color: '#11151F', background: 'rgba(240,237,230,0.94)', padding: '2px 7px', borderRadius: 4,
});

// ---- tiny colour helpers (hex → mixed rgb) ----
function chan(h: string) { const x = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); }
function mix(h: string, t: number[], p: number) { const a = chan(h); const m = a.map((v, i) => Math.round(v + (t[i]! - v) * p)); return `rgb(${m[0]},${m[1]},${m[2]})`; }
function dark(h: string, p: number) { return mix(h, [0, 0, 0], p); }
function light(h: string, p: number) { return mix(h, [255, 255, 255], p); }
