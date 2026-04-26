import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import type { Film } from '@theatrical/sdk';

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

  if (loading) return <LoadingScreen message="Loading now showing…" />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#f5f5f0', letterSpacing: '-0.02em' }}>
          Now Showing
        </h1>
        <p style={{ color: '#8a8a85', marginTop: 8 }}>Roxy Cinema · Wellington</p>
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
        background: '#16161a',
        border: '1px solid #2a2a2f',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 0.15s, border-color 0.15s',
        width: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c9a227'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2f'; }}
    >
      <div style={{ height: 180, background: '#0f0f12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {film.posterUrl ? (
          <img src={film.posterUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#3a3a3f', fontSize: 48 }}>🎬</span>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>
        <span style={{ fontSize: 11, color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {film.rating.classification}
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f0', marginTop: 6, lineHeight: 1.3 }}>
          {film.title}
        </h2>
        <p style={{ fontSize: 13, color: '#8a8a85', marginTop: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {film.synopsis}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: '#6a6a65' }}>
          <span>{film.runtime} min</span>
          <span>·</span>
          <span>{film.genres.slice(0, 2).join(', ')}</span>
        </div>
      </div>
    </button>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#8a8a85' }}>
      {message}
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#e05a5a' }}>
      Error: {message}
    </div>
  );
}
