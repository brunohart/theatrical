import React, { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeatMap } from '@theatrical/react';
import type { SeatRowData } from '@theatrical/react';
import { useBooking } from '../context/BookingContext';
import type { Seat } from '@theatrical/sdk';

function seatsToRows(seats: Seat[]): SeatRowData[] {
  const byRow = new Map<string, Seat[]>();
  for (const seat of seats) {
    const row = byRow.get(seat.row) ?? [];
    row.push(seat);
    byRow.set(seat.row, row);
  }
  return Array.from(byRow.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats
        .sort((a, b) => a.number - b.number)
        .map(s => ({
          id: s.id,
          row: s.row,
          number: s.number,
          state: s.status === 'taken' ? ('taken' as const) : ('available' as const),
          label: `${s.row}${s.number}`,
        })),
    }));
}

export function BookingPage() {
  const { client, state, dispatch } = useBooking();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SeatRowData[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const session = state.session;

  useEffect(() => {
    if (!session) { navigate('/'); return; }
    client.sessions.availability(session.id)
      .then(avail => setRows(seatsToRows(avail.seats)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client, session, navigate]);

  function handleSeatSelect(seatId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else if (next.size < 8) {
        next.add(seatId);
      }
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

  if (!session) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => navigate(`/film/${session.filmId}`)}
        style={{ color: '#c9a227', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}
      >
        ← Back to sessions
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f5f5f0' }}>{session.filmTitle}</h1>
        <p style={{ color: '#8a8a85', marginTop: 6 }}>
          {session.screenName} · {new Date(session.startTime).toLocaleString('en-NZ', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })}
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#8a8a85' }}>Loading seat map…</p>
      ) : (
        <SeatMap
          rows={rows}
          selectedSeatIds={selectedIds}
          onSeatSelect={handleSeatSelect}
          maxSelectable={8}
          screenLabel="Screen"
        />
      )}

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#8a8a85', fontSize: 14 }}>
          {selectedIds.size} seat{selectedIds.size !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={confirmSeats}
          disabled={selectedIds.size === 0 || confirming}
          style={{
            background: selectedIds.size > 0 ? '#c9a227' : '#3a3a3f',
            color: selectedIds.size > 0 ? '#0a0a0b' : '#6a6a65',
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
