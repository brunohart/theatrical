import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function Confirmation() {
  const navigate = useNavigate();
  const { state, reset } = useBooking();

  if (!state.confirmationRef) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center', color: '#718096' }}>
        <p>No booking found.</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Browse films
        </button>
      </main>
    );
  }

  function handleNewBooking() {
    reset();
    navigate('/');
  }

  const session = state.selectedSession;
  const film = state.selectedFilm;
  const seats = Array.from(state.selectedSeatIds);

  return (
    <main
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '3rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #276749 0%, #48bb78 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.25rem',
          boxShadow: '0 0 32px #48bb7844',
        }}
      >
        ✓
      </div>

      <div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f5f5f5',
            marginBottom: '0.4rem',
          }}
        >
          Booking Confirmed
        </h1>
        <p style={{ color: '#718096', fontSize: '0.9rem' }}>
          Your seats are reserved. Enjoy the show!
        </p>
      </div>

      <div
        style={{
          width: '100%',
          background: '#1a1a2e',
          border: '1px solid #2d3748',
          borderRadius: 12,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#718096', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Booking Reference
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#48bb78',
              letterSpacing: '0.08em',
            }}
          >
            {state.confirmationRef}
          </span>
        </div>

        {film && (
          <div>
            <div style={{ color: '#718096', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              Film
            </div>
            <div style={{ color: '#f5f5f5', fontWeight: 600 }}>{film.title}</div>
          </div>
        )}

        {session && (
          <>
            <div>
              <div style={{ color: '#718096', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                Session
              </div>
              <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{formatDateTime(session.startTime)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: '#718096', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                  Cinema
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>Embassy Theatre</div>
              </div>
              <div>
                <div style={{ color: '#718096', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                  Screen
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{session.screenName} · {session.format}</div>
              </div>
            </div>
          </>
        )}

        {seats.length > 0 && (
          <div>
            <div style={{ color: '#718096', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Seats ({seats.length})
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {seats.map((id) => (
                <span
                  key={id}
                  style={{
                    background: '#276749',
                    color: '#f0fff4',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p style={{ color: '#718096', fontSize: '0.82rem', lineHeight: 1.6 }}>
        A confirmation email has been sent to your registered address. Present your booking reference at the
        cinema or use the Theatrical app to display your e-ticket.
      </p>

      <button
        onClick={handleNewBooking}
        style={{
          padding: '0.75rem 2rem',
          borderRadius: 8,
          border: '1px solid #2d3748',
          background: 'transparent',
          color: '#e2e8f0',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#1a1a2e')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        Book another film
      </button>
    </main>
  );
}
