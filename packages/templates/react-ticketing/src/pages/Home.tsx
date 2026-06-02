import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import type { Film } from '@theatrical/sdk';
import { Poster } from '../components/Poster';

const INK = '#1A1A1A';
const MUTED = '#8A8578';
const ORANGE = '#D4622B';
const BORDER = '#D6D0C4';
const SURFACE = '#FBF8F0';

export function Home() {
  const { client, dispatch } = useBooking();
  const navigate = useNavigate();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.films.nowShowing()
      .then(setFilms)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [client]);

  function selectFilm(film: Film) {
    dispatch({ type: 'SELECT_FILM', film });
    navigate(`/film/${film.id}`);
  }

  if (loading) return <Screen>Loading now showing…</Screen>;
  if (error) return <Screen color="#C4391D">Error: {error}</Screen>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px' }}>
      <header style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: ORANGE, marginBottom: 12 }}>
          Now showing
        </p>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: INK, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          What&rsquo;s on at the Roxy
        </h1>
        <p style={{ color: MUTED, marginTop: 10, fontSize: 16 }}>Roxy Cinema · Wellington</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {films.map(film => (
          <FilmCard key={film.id} film={film} onSelect={selectFilm} />
        ))}
      </div>
    </div>
  );
}

function FilmCard({ film, onSelect }: { film: Film; onSelect: (f: Film) => void }) {
  return (
    <button
      onClick={() => onSelect(film)}
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        width: '100%',
        padding: 0,
      }}
      onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = ORANGE; t.style.transform = 'translateY(-3px)'; t.style.boxShadow = '0 24px 48px -32px rgba(27,45,79,0.45)'; }}
      onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = BORDER; t.style.transform = 'none'; t.style.boxShadow = 'none'; }}
    >
      <Poster title={film.title} posterUrl={film.posterUrl} height={300} classification={film.rating?.classification} />
      <div style={{ padding: '16px 20px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.25 }}>
          {film.title}
        </h2>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {film.synopsis}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, fontSize: 12, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
          <span>{film.runtime} min</span>
          <span>·</span>
          <span>{film.genres?.slice(0, 2).join(', ')}</span>
        </div>
      </div>
    </button>
  );
}

function Screen({ children, color = '#8A8578' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color }}>
      {children}
    </div>
  );
}
