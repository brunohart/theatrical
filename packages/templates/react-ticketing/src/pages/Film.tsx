import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionPicker } from '@theatrical/react';
import { MOCK_FILMS, getMockSessions } from '../data/mock';
import { useBooking } from '../context/BookingContext';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function Film() {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const { state, selectFilm, selectSession } = useBooking();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const film = useMemo(() => MOCK_FILMS.find((f) => f.id === filmId), [filmId]);

  if (!film) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center', color: '#718096' }}>
        <p>Film not found.</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back to films
        </button>
      </main>
    );
  }

  if (!state.selectedFilm || state.selectedFilm.id !== film.id) {
    selectFilm(film);
  }

  const sessions = getMockSessions(film.id, selectedDate);

  function handleSessionSelect(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      selectSession(session);
      navigate('/booking');
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#a0aec0',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        ← All films
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2rem',
          marginBottom: '2.5rem',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            width: 120,
            height: 170,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            flexShrink: 0,
            border: '1px solid #2d3748',
          }}
        >
          🎬
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f5f5f5', lineHeight: 1.2 }}>
            {film.title}
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[film.genre, film.classification, `${film.duration} min`, String(film.releaseYear)].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.75rem',
                  color: '#a0aec0',
                  background: '#1a1a2e',
                  padding: '3px 10px',
                  borderRadius: 4,
                  border: '1px solid #2d3748',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p style={{ color: '#a0aec0', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 520 }}>
            {film.synopsis}
          </p>
        </div>
      </div>

      <section>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Select a Session
        </h2>
        <SessionPicker
          sessions={sessions}
          selectedSessionId={state.selectedSession?.id}
          onSessionSelect={handleSessionSelect}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          dayCount={7}
        />
      </section>
    </main>
  );
}
