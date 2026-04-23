import React from 'react';
import { tokens } from '../../tokens';
import type { SeatState } from './types';

const LEGEND_ITEMS: Array<{ state: SeatState; label: string; color: string }> = [
  { state: 'available', label: 'Available', color: tokens.colors.seatAvailable },
  { state: 'selected', label: 'Selected', color: tokens.colors.seatSelected },
  { state: 'taken', label: 'Taken', color: tokens.colors.seatTaken },
  { state: 'premium', label: 'Premium', color: tokens.colors.seatPremium },
  { state: 'wheelchair', label: 'Wheelchair', color: tokens.colors.seatWheelchair },
  { state: 'companion', label: 'Companion', color: tokens.colors.seatCompanion },
];

export function SeatLegend() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacing.md,
        marginTop: tokens.spacing.lg,
        paddingTop: tokens.spacing.md,
        borderTop: `1px solid ${tokens.colors.border}`,
      }}
      aria-label="Seat legend"
    >
      {LEGEND_ITEMS.map(({ state, label, color }) => (
        <div key={state} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
          <div
            style={{
              width: 16,
              height: 14,
              borderRadius: tokens.radii.sm,
              backgroundColor: color,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: tokens.typography.sizes.xs, color: tokens.colors.textMuted }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
