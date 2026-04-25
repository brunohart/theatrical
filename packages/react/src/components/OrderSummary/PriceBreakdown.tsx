import React from 'react';
import { tokens } from '../../tokens';
import type { PriceBreakdownData } from './types';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownData;
}

function Row({
  label,
  amount,
  currency,
  muted = false,
  negative = false,
  accent = false,
}: {
  label: string;
  amount: number;
  currency: string;
  muted?: boolean;
  negative?: boolean;
  accent?: boolean;
}) {
  const color = accent
    ? tokens.colors.accent
    : negative
    ? tokens.colors.success
    : muted
    ? tokens.colors.textMuted
    : tokens.colors.text;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${tokens.spacing.xs}px 0` }}>
      <span style={{ fontSize: tokens.typography.sizes.sm, color }}>{label}</span>
      <span style={{ fontSize: tokens.typography.sizes.sm, color, fontWeight: tokens.typography.weights.medium }}>
        {negative ? '–' : ''}{currency}{Math.abs(amount).toFixed(2)}
      </span>
    </div>
  );
}

export function PriceBreakdown({ breakdown }: PriceBreakdownProps) {
  const currency = breakdown.currency ?? '$';

  return (
    <div
      style={{
        marginTop: tokens.spacing.md,
        paddingTop: tokens.spacing.md,
        borderTop: `1px solid ${tokens.colors.border}`,
      }}
    >
      <Row label="Subtotal" amount={breakdown.subtotal} currency={currency} muted />
      {breakdown.serviceFee !== undefined && breakdown.serviceFee > 0 && (
        <Row label="Service fee" amount={breakdown.serviceFee} currency={currency} muted />
      )}
      <Row label={breakdown.taxLabel ?? 'Tax (incl. GST)'} amount={breakdown.tax} currency={currency} muted />
      {breakdown.discounts.map((d) => (
        <Row key={d.label} label={d.label} amount={d.amount} currency={currency} negative />
      ))}
      {breakdown.loyaltyDiscount !== undefined && breakdown.loyaltyDiscount > 0 && (
        <Row
          label={`Loyalty points (${breakdown.loyaltyPointsRedeemed ?? 0} pts)`}
          amount={breakdown.loyaltyDiscount}
          currency={currency}
          accent
          negative
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: tokens.spacing.sm,
          paddingTop: tokens.spacing.sm,
          borderTop: `1px solid ${tokens.colors.border}`,
        }}
      >
        <span
          style={{
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.bold,
            color: tokens.colors.text,
          }}
        >
          Total
        </span>
        <span
          style={{
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.bold,
            color: tokens.colors.accent,
          }}
        >
          {currency}{breakdown.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
