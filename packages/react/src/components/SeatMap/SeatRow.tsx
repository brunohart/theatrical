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
        justifyContent: 'center',
        marginBottom: tokens.spacing.xs,
        position: 'relative',
      }}
      role="row"
      aria-label={`Row ${row.rowLabel}`}
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          width: 24,
          textAlign: 'right',
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
