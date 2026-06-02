import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionPicker } from '@theatrical/react';
import type { SessionCardData } from '@theatrical/react';
import { useBooking } from '../context/BookingContext';
import type { Session } from '@theatrical/sdk';
import { Poster } from '../components/Poster';

const INK = '#1A1A1A';
const MUTED = '#8A8578';
const ORANGE = '#D4622B';

const SCREENS = [
  { screenName: 'Screen 1', format: 'Standard', priceFrom: 18.5, hour: 12, minute: 30 },
  { screenName: 'Screen 4 — Gold Class', format: 'Gold Class', priceFrom: 45.0, hour: 15, minute: 45 },
  { screenName: 'Screen 2 — IMAX', format: 'IMAX', priceFrom: 28.0, hour: 18, minute: 30 },
  { screenName: 'Screen 1', format: 'Standard', priceFrom: 18.5, hour: 20, minute: 45 },
];

/** Curated, deterministic sessions for one film on one date. */
function buildSessions(
  film: { id: string; title: string; runtime?: number },
  dateStr: string,
): Session[] {
  const runtime = film.runtime ?? 120;
  return SCREENS.map((s, i) => {
    const start = new Date(`${dateStr}T00:00:00`);
    start.setHours(s.hour, s.minute, 0, 0);
    const end = new Date(start.getTime() + (runtime + 20) * 60 * 1000);
    const avail = [84, 8, 36, 121][i] ?? 50;
    return {
      id: `${film.id}-${dateStr}-${i}`,
      filmId: film.id,
      filmTitle: film.title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      screenName: s.screenName,
      format: s.format,
      priceFrom: s.priceFrom,
      currency: 'NZD',
      seatsAvailable: avail,
    } as unknown as Session;
  });
}

function toCardData(s: Session): SessionCardData {
  return {
    id: s.id,
    filmTitle: s.filmTitle,
    startTime: s.startTime,
    endTime: s.endTime,
    screenName: s.screenName,
    format: s.format,
    priceFrom: s.priceFrom,
    currency: (s as unknown as { currency?: string }).currency,
    availableSeats: (s as unknown as { seatsAvailable?: number }).seatsAvailable,
  };
}

export function FilmPage() {
  const { state, dispatch } = useBooking();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const film = state.film;
  const sessions = useMemo(
    () => (film ? buildSessions(film as never, selectedDate) : []),
    [film, selectedDate],
  );

  function handleSessionSelect(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    dispatch({ type: 'SELECT_SESSION', session });
    navigate('/booking');
  }

  if (!film) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 28 }}
      >
        ← Back to films
      </button>

      <div style={{ display: 'flex', gap: 32, marginBottom: 44, flexWrap: 'wrap' }}>
        <div style={{ flexShrink: 0, width: 150, borderRadius: 12, overflow: 'hidden', border: '1px solid #D6D0C4' }}>
          <Poster title={film.title} posterUrl={film.posterUrl} height={222} classification={film.rating?.classification} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: INK, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {film.title}
          </h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 13, color: MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
            <span>{film.rating?.classification}</span><span>·</span>
            <span>{film.runtime} min</span><span>·</span>
            <span>{film.genres?.slice(0, 2).join(', ')}</span>
          </div>
          <p style={{ marginTop: 18, color: '#4A463E', lineHeight: 1.65, fontSize: 16, maxWidth: '52ch' }}>
            {film.synopsis}
          </p>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, color: INK, marginBottom: 18, letterSpacing: '-0.01em' }}>
        Choose a session
      </h2>

      <SessionPicker
        sessions={sessions.map(toCardData)}
        selectedSessionId={state.session?.id}
        onSessionSelect={handleSessionSelect}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        groupBy="time"
      />
    </div>
  );
}
