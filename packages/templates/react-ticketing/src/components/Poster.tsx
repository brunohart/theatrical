import React, { useState } from 'react';

/**
 * Film poster. Renders real artwork when `posterUrl` is provided, otherwise a
 * branded gradient placeholder with the title set in Space Grotesk — so a
 * missing image never reads as "broken", it reads as a stylised title card.
 */
export function Poster({
  title,
  posterUrl,
  height = 300,
  classification,
}: {
  title: string;
  posterUrl?: string;
  height?: number;
  classification?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (posterUrl && !errored) {
    return (
      <div style={{ height, background: '#1B2D4F', position: 'relative', overflow: 'hidden' }}>
        <img
          src={posterUrl}
          alt={title}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {classification && <ClassBadge value={classification} />}
      </div>
    );
  }

  // Deterministic accent angle per title so cards feel distinct.
  const seed = Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 120 + (seed % 80);

  const compact = height < 130;
  const monogram = title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  return (
    <div
      style={{
        height,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(${angle}deg, #1B2D4F 0%, #14213D 55%, #1A1A1A 100%)`,
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-end',
        justifyContent: compact ? 'center' : 'flex-start',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 70% 10%, rgba(212,98,43,0.28), transparent 60%)' }} />
      {!compact && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, background: 'repeating-linear-gradient(180deg, transparent 0 10px, rgba(240,237,230,0.10) 10px 20px)' }} />}
      {compact ? (
        <span style={{ position: 'relative', fontFamily: "'Space Grotesk', sans-serif", fontSize: Math.min(28, height * 0.34), fontWeight: 700, color: 'rgba(240,237,230,0.92)', letterSpacing: '-0.02em' }}>{monogram}</span>
      ) : (
        <div style={{ position: 'relative', padding: '22px 22px 24px', width: '100%' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: 'rgba(240,237,230,0.55)', textTransform: 'uppercase', marginBottom: 8 }}>Now showing</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.02em', lineHeight: 1.05 }}>{title}</div>
        </div>
      )}
      {classification && !compact && <ClassBadge value={classification} />}
    </div>
  );
}

function ClassBadge({ value }: { value: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: '#F0EDE6',
        background: 'rgba(212,98,43,0.92)',
        padding: '3px 8px',
        borderRadius: 4,
      }}
    >
      {value}
    </span>
  );
}
