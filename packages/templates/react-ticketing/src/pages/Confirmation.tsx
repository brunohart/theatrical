import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderSummary, PaymentForm, MemberCard, LoyaltyBadge } from '@theatrical/react';
import type { LoyaltyMemberData } from '@theatrical/react';
import { useBooking } from '../context/BookingContext';

export function ConfirmationPage() {
  const { client, state, dispatch } = useBooking();
  const navigate = useNavigate();
  const [member, setMember] = useState<LoyaltyMemberData | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (!state.order) { navigate('/'); return; }
    client.loyalty.getMember('mem_hemi_walker_5528')
      .then(m => {
        setMember(m as unknown as LoyaltyMemberData);
        dispatch({ type: 'SET_MEMBER', member: m });
      })
      .catch(() => { /* loyalty is optional */ });
  }, [client, state.order, navigate, dispatch]);

  const session = state.session;
  const order = state.order;
  if (!session || !order) return null;

  const pricePerSeat = session.priceFrom ?? 19.50;
  const subtotal = state.selectedSeatIds.length * pricePerSeat;
  const tax = subtotal * 0.15;
  const loyaltyDiscount = member ? subtotal * 0.1 : 0;
  const total = subtotal + tax - loyaltyDiscount;

  const lineItems = state.selectedSeatIds.map((seatId) => ({
    id: seatId,
    type: 'ticket' as const,
    label: `${session.filmTitle} — Seat ${seatId}`,
    quantity: 1,
    unitPrice: pricePerSeat,
    totalPrice: pricePerSeat,
    currency: 'NZD',
  }));

  const priceBreakdown = {
    subtotal,
    tax,
    discounts: member ? [{ label: 'Gold member 10% discount', amount: loyaltyDiscount }] : [],
    loyaltyDiscount: member ? loyaltyDiscount : undefined,
    total,
    currency: 'NZD',
  };

  if (paymentDone) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎬</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f5f5f0', marginBottom: 12 }}>You're booked!</h1>
        <p style={{ color: '#8a8a85', marginBottom: 32 }}>
          Check your email for your tickets. Enjoy {session.filmTitle}.
        </p>
        <button
          onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }}
          style={{
            background: '#c9a227', color: '#0a0a0b', border: 'none', borderRadius: 8,
            padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Back to films
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => navigate('/booking')}
        style={{ color: '#c9a227', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}
      >
        ← Back to seats
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f5f5f0', marginBottom: 32 }}>Review & Pay</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {member && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f0' }}>Loyalty Member</h2>
                <LoyaltyBadge member={{ tier: member.tier as any, points: member.points }} />
              </div>
              <MemberCard member={member} showBenefits={false} showProgress />
            </div>
          )}

          <PaymentForm
            amountMinor={Math.round(total * 100)}
            currency="NZD"
            onPaymentComplete={(result) => { if (result.success) setPaymentDone(true); }}
          />
        </div>

        <OrderSummary
          lineItems={lineItems}
          priceBreakdown={priceBreakdown}
          sessionDetails={{
            filmTitle: session.filmTitle,
            cinema: 'Roxy Cinema, Wellington',
            screenName: session.screenName,
            startTime: session.startTime,
            format: session.format,
            seats: state.selectedSeatIds,
          }}
        />
      </div>
    </div>
  );
}
