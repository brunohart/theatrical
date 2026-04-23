import React from 'react';
import { tokens } from '../../tokens';
import { Seat } from './Seat';
import type { SeatRowData } from './types';

interface SeatRowProps {
  row: SeatRowData;
  selectedSeatIds: Set<string>;
  onSeatSelect: (id: string) => void;
  disabled: boolean;
}

export function SeatRow({ row, selectedSeatIds, onSeatSelect, disabled }: SeatRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: tokens.spacing.xs,
      }}
      role="row"
      aria-label={`Row ${row.rowLabel}`}
    >
      <span
        style={{
          width: 24,
          textAlign: 'right',
          marginRight: tokens.spacing.sm,
          fontSize: tokens.typography.sizes.xs,
          color: tokens.colors.textMuted,
          fontWeight: tokens.typography.weights.medium,
          flexShrink: 0,
        }}
      >
        {row.rowLabel}
      </span>
      <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
        {row.seats.map((seat) => (
          <Seat
            key={seat.id}
            seat={seat}
            isSelected={selectedSeatIds.has(seat.id)}
            onSelect={onSeatSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
