import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeatMap } from '@theatrical/react';
import { useBooking } from '../context/BookingContext';
import { getMockSeatMap } from '../data/mock';

const INK = '#1A1A1A';
const MUTED = '#8A8578';
const ORANGE = '#D4622B';
const BORDER = '#D6D0C4';

export function BookingPage() {
  const { client, state, dispatch } = useBooking();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [confirming, setConfirming] = useState(false);

  const session = state.session;
  // Curated, fully-populated seat map (available / premium / wheelchair / taken).
  const rows = useMemo(() => getMockSeatMap(), []);

  function handleSeatSelect(seatId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else if (next.size < 8) next.add(seatId);
      return next;
    });
  }

  async function confirmSeats() {
    if (!session || selectedIds.size === 0) return;
    setConfirming(true);
    dispatch({ type: 'SELECT_SEATS', seatIds: Array.from(selectedIds) });
    try {
      const order = await client.orders.create({
        sessionId: session.id,
        tickets: Array.from(selectedIds).map(seatId => ({ type: 'standard', seatId })),
      });
      dispatch({ type: 'SET_ORDER', order });
      navigate('/confirmation');
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  }

  if (!session) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => navigate(`/film/${(session as unknown as { filmId?: string }).filmId ?? ''}`)}
        style={{ color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 28 }}
      >
        ← Back to sessions
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>
          {session.filmTitle}
        </h1>
        <p style={{ color: MUTED, marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          {session.screenName} · {new Date(session.startTime).toLocaleString('en-NZ', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
          })}
        </p>
      </div>

      <SeatMap
        rows={rows}
        selectedSeatIds={selectedIds}
        onSeatSelect={handleSeatSelect}
        maxSelectable={8}
        screenLabel="Screen"
      />

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18 }}>
        <span style={{ color: MUTED, fontSize: 14 }}>
          {selectedIds.size} seat{selectedIds.size !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={confirmSeats}
          disabled={selectedIds.size === 0 || confirming}
          style={{
            background: selectedIds.size > 0 ? ORANGE : BORDER,
            color: selectedIds.size > 0 ? '#F0EDE6' : MUTED,
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 15,
            fontWeight: 600,
            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {confirming ? 'Confirming…' : 'Confirm seats'}
        </button>
      </div>
    </div>
  );
}
