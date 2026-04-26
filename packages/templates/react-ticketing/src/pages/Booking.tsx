import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SeatMap, OrderSummary } from '@theatrical/react';
import { getMockSeatMap } from '../data/mock';
import { useBooking } from '../context/BookingContext';
import type { OrderLineItem, PriceBreakdownData } from '@theatrical/react';

const TICKET_PRICE = 18.5;
const SERVICE_FEE = 1.5;
const GST_RATE = 0.1;

function buildOrder(seatIds: Set<string>, session: { filmTitle: string; screenName: string; startTime: string; format: string } | null) {
  const seats = Array.from(seatIds);
  const subtotal = seats.length * TICKET_PRICE;
  const serviceFee = seats.length > 0 ? SERVICE_FEE : 0;
  const taxBase = subtotal + serviceFee;
  const tax = Math.round(taxBase * GST_RATE * 100) / 100;
  const total = taxBase + tax;

  const lineItems: OrderLineItem[] = seats.map((id, i) => ({
    id: `ticket-${i}`,
    type: 'ticket',
    label: `Seat ${id}`,
    description: session ? `${session.filmTitle} · ${session.screenName}` : undefined,
    quantity: 1,
    unitPrice: TICKET_PRICE,
    totalPrice: TICKET_PRICE,
    currency: 'AUD',
  }));

  if (serviceFee > 0) {
    lineItems.push({
      id: 'service-fee',
      type: 'service-fee',
      label: 'Booking fee',
      quantity: 1,
      unitPrice: serviceFee,
      totalPrice: serviceFee,
      currency: 'AUD',
    });
  }

  const priceBreakdown: PriceBreakdownData = {
    subtotal,
    tax,
    taxLabel: 'GST (10%)',
    discounts: [],
    serviceFee,
    total,
    currency: 'AUD',
  };

  return { lineItems, priceBreakdown };
}

export function Booking() {
  const navigate = useNavigate();
  const { state, toggleSeat, confirm } = useBooking();
  const rows = getMockSeatMap();
  const { lineItems, priceBreakdown } = buildOrder(state.selectedSeatIds, state.selectedSession);

  if (!state.selectedSession || !state.selectedFilm) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center', color: '#718096' }}>
        <p>No session selected.</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Browse films
        </button>
      </main>
    );
  }

  function handleConfirm() {
    const ref = 'TH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    confirm(ref);
    navigate('/confirmation');
  }

  const sessionDetails = state.selectedSession
    ? {
        filmTitle: state.selectedFilm?.title ?? '',
        cinema: 'Embassy Theatre',
        screenName: state.selectedSession.screenName,
        startTime: state.selectedSession.startTime,
        format: state.selectedSession.format,
        seats: Array.from(state.selectedSeatIds),
      }
    : undefined;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        onClick={() => navigate(`/film/${state.selectedFilm?.id}`)}
        style={{
          background: 'none',
          border: 'none',
          color: '#a0aec0',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          padding: 0,
        }}
      >
        ← Change session
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5f5f5', marginBottom: '1.75rem' }}>
        Choose Your Seats
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        <div>
          <SeatMap
            rows={rows}
            selectedSeatIds={state.selectedSeatIds}
            onSeatSelect={toggleSeat}
            maxSelectable={6}
            screenLabel={`${state.selectedSession.screenName} — ${state.selectedSession.format}`}
          />
        </div>

        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <OrderSummary
            lineItems={lineItems}
            priceBreakdown={priceBreakdown}
            sessionDetails={sessionDetails}
          />

          <button
            onClick={handleConfirm}
            disabled={state.selectedSeatIds.size === 0}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.875rem',
              borderRadius: 8,
              border: 'none',
              background: state.selectedSeatIds.size > 0 ? '#e53e3e' : '#2d3748',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: state.selectedSeatIds.size > 0 ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s ease',
            }}
          >
            {state.selectedSeatIds.size > 0
              ? `Confirm ${state.selectedSeatIds.size} seat${state.selectedSeatIds.size !== 1 ? 's' : ''} — A$${priceBreakdown.total.toFixed(2)}`
              : 'Select seats to continue'}
          </button>
        </div>
      </div>
    </main>
  );
}
