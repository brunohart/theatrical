import React from 'react';
import { tokens } from '../../tokens';
import type { SeatData, SeatState } from './types';

const STATE_COLORS: Record<SeatState, string> = {
  available: tokens.colors.seatAvailable,
  taken: tokens.colors.seatTaken,
  selected: tokens.colors.seatSelected,
  wheelchair: tokens.colors.seatWheelchair,
  companion: tokens.colors.seatCompanion,
  premium: tokens.colors.seatPremium,
};

const STATE_LABELS: Record<SeatState, string> = {
  available: 'Available',
  taken: 'Taken',
  selected: 'Selected',
  wheelchair: 'Wheelchair',
  companion: 'Companion',
  premium: 'Premium',
};

interface SeatProps {
  seat: SeatData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function Seat({ seat, isSelected, onSelect, disabled }: SeatProps) {
  const isInteractive = (seat.state === 'available' || seat.state === 'premium' || isSelected) && !disabled;
  const effectiveState: SeatState = isSelected ? 'selected' : seat.state;
  const bg = STATE_COLORS[effectiveState];

  function handleClick() {
    if (isInteractive) onSelect(seat.id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && isInteractive) {
      e.preventDefault();
      onSelect(seat.id);
    }
  }

  const ariaLabel = `Seat ${seat.row}${seat.number} — ${STATE_LABELS[effectiveState]}`;

  return (
    <button
      role="gridcell"
      aria-selected={isSelected}
      aria-label={ariaLabel}
      aria-disabled={!isInteractive}
      tabIndex={isInteractive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-seat-id={seat.id}
      data-seat-state={effectiveState}
      style={{
        width: 28,
        height: 24,
        margin: 2,
        borderRadius: tokens.radii.sm,
        border: isSelected ? `2px solid ${tokens.colors.accent}` : '2px solid transparent',
        backgroundColor: bg,
        cursor: isInteractive ? 'pointer' : 'default',
        opacity: seat.state === 'taken' ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: tokens.typography.sizes.xs,
        color: tokens.colors.text,
        fontWeight: tokens.typography.weights.medium,
        transition: tokens.transitions.fast,
        padding: 0,
        flexShrink: 0,
        boxShadow: isSelected ? tokens.shadows.glow : 'none',
      }}
    >
      {seat.label ?? seat.number}
    </button>
  );
}
