import React from 'react';
import { tokens } from '../../tokens';
import { LineItem } from './LineItem';
import { PriceBreakdown } from './PriceBreakdown';
import type { OrderSummaryProps } from './types';

function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    return d.toLocaleString('en-NZ', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  return isoOrTime;
}

/**
 * Booking review panel. Displays session context, line items, and a full
 * price breakdown including tax, discounts, and loyalty point redemption.
 *
 * @example
 * ```tsx
 * <OrderSummary
 *   lineItems={order.tickets.map(t => ({ ... }))}
 *   priceBreakdown={{ subtotal: 38.00, tax: 4.94, discounts: [], total: 42.94 }}
 *   sessionDetails={{ filmTitle: 'The Holdovers', cinema: 'Embassy Theatre', ... }}
 * />
 * ```
 */
export function OrderSummary({ lineItems, priceBreakdown, sessionDetails, isLoading = false }: OrderSummaryProps) {
  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: tokens.colors.surface,
          borderRadius: tokens.radii.lg,
          padding: tokens.spacing.lg,
          border: `1px solid ${tokens.colors.border}`,
        }}
      >
        <p style={{ color: tokens.colors.textMuted, textAlign: 'center' }}>Loading order…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        border: `1px solid ${tokens.colors.border}`,
      }}
      aria-label="Order summary"
    >
      <h2
        style={{
          fontSize: tokens.typography.sizes.lg,
          fontWeight: tokens.typography.weights.semibold,
          color: tokens.colors.text,
          marginBottom: tokens.spacing.md,
        }}
      >
        Order Summary
      </h2>

      {/* Session details */}
      {sessionDetails && (
        <div
          style={{
            backgroundColor: tokens.colors.surfaceRaised,
            borderRadius: tokens.radii.md,
            padding: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
            borderLeft: `3px solid ${tokens.colors.accent}`,
          }}
        >
          <p
            style={{
              fontSize: tokens.typography.sizes.md,
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.text,
            }}
          >
            {sessionDetails.filmTitle}
          </p>
          <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.textMuted, marginTop: 4 }}>
            {sessionDetails.cinema} · {sessionDetails.screenName}
          </p>
          <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.textMuted }}>
            {formatTime(sessionDetails.startTime)} · {sessionDetails.format}
          </p>
          {sessionDetails.seats.length > 0 && (
            <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.accent, marginTop: 4 }}>
              Seats: {sessionDetails.seats.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Line items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
        {lineItems.map((item) => (
          <LineItem key={item.id} item={item} />
        ))}
      </div>

      <PriceBreakdown breakdown={priceBreakdown} />
    </div>
  );
}
