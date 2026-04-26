import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionPicker } from '@theatrical/react';
import type { SessionCardData } from '@theatrical/react';
import { useBooking } from '../context/BookingContext';
import type { Session } from '@theatrical/sdk';

function toCardData(s: Session): SessionCardData {
  return {
    id: s.id,
    filmTitle: s.filmTitle,
    startTime: s.startTime,
    endTime: s.endTime,
    screenName: s.screenName,
    format: s.format,
    priceFrom: s.priceFrom,
    availableSeats: s.seatsAvailable,
  };
}

export function FilmPage() {
  const { filmId } = useParams<{ filmId: string }>();
  const { client, state, dispatch } = useBooking();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const film = state.film;

  useEffect(() => {
    if (!filmId) return;
    client.sessions.list({ filmId, siteId: 'site_roxy_wellington' })
      .then(r => setSessions(r.sessions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client, filmId]);

  function handleSessionSelect(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    dispatch({ type: 'SELECT_SESSION', session });
    navigate('/booking');
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ color: '#c9a227', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}
      >
        ← Back to films
      </button>

      {film && (
        <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
          <div style={{ flexShrink: 0, width: 120, height: 180, background: '#16161a', borderRadius: 8, overflow: 'hidden' }}>
            {film.posterUrl && (
              <img src={film.posterUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f5f5f0', letterSpacing: '-0.02em' }}>
              {film.title}
            </h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: '#8a8a85' }}>
              <span>{film.rating.classification}</span>
              <span>·</span>
              <span>{film.runtime} min</span>
              <span>·</span>
              <span>{film.genres.slice(0, 2).join(', ')}</span>
            </div>
            <p style={{ marginTop: 16, color: '#b0b0aa', lineHeight: 1.6, fontSize: 15 }}>
              {film.synopsis}
            </p>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f0', marginBottom: 20 }}>Choose a session</h2>

      {loading ? (
        <p style={{ color: '#8a8a85' }}>Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: '#8a8a85' }}>No sessions available.</p>
      ) : (
        <SessionPicker
          sessions={sessions.map(toCardData)}
          selectedSessionId={state.session?.id}
          onSessionSelect={handleSessionSelect}
        />
      )}
    </div>
  );
}
