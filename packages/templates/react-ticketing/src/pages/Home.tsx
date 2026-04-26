import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FILMS, type MockFilm } from '../data/mock';
import { useBooking } from '../context/BookingContext';

const GENRE_COLORS: Record<string, string> = {
  Thriller: '#e53e3e',
  'Neo-noir': '#805ad5',
  'Sci-fi': '#3182ce',
};

function FilmCard({ film }: { film: MockFilm }) {
  const { selectFilm } = useBooking();
  const navigate = useNavigate();
  const accentColor = GENRE_COLORS[film.genre] ?? '#718096';

  function handleSelect() {
    selectFilm(film);
    navigate(`/film/${film.id}`);
  }

  return (
    <article
      onClick={handleSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
      tabIndex={0}
      role="button"
      aria-label={`Book tickets for ${film.title}`}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: `1px solid ${accentColor}33`,
        borderRadius: 12,
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.borderColor = accentColor;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${accentColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}33`;
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div
        style={{
          height: 180,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${accentColor}33 0%, #0a0a0a 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
        }}
      >
        🎬
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: accentColor,
            background: `${accentColor}18`,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {film.genre}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#718096' }}>
          {film.classification} · {film.duration} min
        </span>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5f5f5', lineHeight: 1.3 }}>
        {film.title}
      </h2>

      <p style={{ fontSize: '0.85rem', color: '#a0aec0', lineHeight: 1.6, flexGrow: 1 }}>
        {film.synopsis.length > 120 ? film.synopsis.slice(0, 120) + '…' : film.synopsis}
      </p>

      <div
        style={{
          marginTop: 'auto',
          padding: '0.6rem 1rem',
          background: accentColor,
          borderRadius: 6,
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#fff',
        }}
      >
        Book Now
      </div>
    </article>
  );
}

export function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #a0aec0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}
        >
          Now Showing
        </h1>
        <p style={{ color: '#718096', fontSize: '0.95rem' }}>
          Select a film to view sessions and book your seats
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {MOCK_FILMS.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </main>
  );
}
