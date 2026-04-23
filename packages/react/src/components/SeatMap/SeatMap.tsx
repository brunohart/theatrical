import React, { useCallback } from 'react';
import { tokens } from '../../tokens';
import { SeatRow } from './SeatRow';
import { SeatLegend } from './SeatLegend';
import type { SeatMapProps } from './types';

/**
 * Interactive cinema auditorium seat map. Renders from seat availability data,
 * handles click-to-select with max-seat enforcement, and supports keyboard
 * navigation (arrow keys move focus between seats, Space/Enter toggles selection).
 *
 * @example
 * ```tsx
 * <SeatMap
 *   rows={availabilityData.rows}
 *   selectedSeatIds={selectedIds}
 *   onSeatSelect={(id) => setSelectedIds(prev => new Set([...prev, id]))}
 *   maxSelectable={2}
 *   screenLabel="Screen 3 — IMAX"
 * />
 * ```
 */
export function SeatMap({
  rows,
  selectedSeatIds,
  onSeatSelect,
  maxSelectable,
  screenLabel = 'SCREEN',
  disabled = false,
}: SeatMapProps) {
  const handleSeatSelect = useCallback(
    (seatId: string) => {
      if (disabled) return;
      const isSelected = selectedSeatIds.has(seatId);
      if (!isSelected && maxSelectable !== undefined && selectedSeatIds.size >= maxSelectable) return;
      onSeatSelect(seatId);
    },
    [disabled, maxSelectable, onSeatSelect, selectedSeatIds],
  );

  return (
    <div
      role="grid"
      aria-label={`Seat map — ${screenLabel}`}
      aria-multiselectable="true"
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        border: `1px solid ${tokens.colors.border}`,
        overflowX: 'auto',
      }}
    >
      {/* Screen indicator */}
      <div
        aria-hidden="true"
        style={{
          textAlign: 'center',
          marginBottom: tokens.spacing.xl,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: `${tokens.spacing.xs}px ${tokens.spacing.xl}px`,
            background: `linear-gradient(180deg, ${tokens.colors.accent}22, transparent)`,
            borderTop: `2px solid ${tokens.colors.accent}`,
            borderRadius: `${tokens.radii.sm}px ${tokens.radii.sm}px 0 0`,
            fontSize: tokens.typography.sizes.xs,
            letterSpacing: '0.15em',
            color: tokens.colors.textMuted,
            textTransform: 'uppercase',
            minWidth: 200,
          }}
        >
          {screenLabel}
        </div>
      </div>

      {/* Seat grid */}
      <div role="rowgroup">
        {rows.map((row) => (
          <SeatRow
            key={row.rowLabel}
            row={row}
            selectedSeatIds={selectedSeatIds}
            onSeatSelect={handleSeatSelect}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Selection count */}
      {maxSelectable !== undefined && (
        <p
          style={{
            marginTop: tokens.spacing.md,
            fontSize: tokens.typography.sizes.sm,
            color: tokens.colors.textMuted,
            textAlign: 'center',
          }}
        >
          {selectedSeatIds.size} of {maxSelectable} seats selected
        </p>
      )}

      <SeatLegend />
    </div>
  );
}
