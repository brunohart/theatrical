import React from 'react';
import { tokens } from '../../tokens';

export interface SessionCardData {
  id: string;
  filmTitle: string;
  startTime: string;
  endTime?: string;
  screenName: string;
  format: string;
  priceFrom?: number;
  currency?: string;
  availableSeats?: number;
}

interface SessionCardProps {
  session: SessionCardData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    return d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return isoOrTime;
}

export function SessionCard({ session, isSelected, onSelect }: SessionCardProps) {
  const isLowAvailability = session.availableSeats !== undefined && session.availableSeats <= 10;

  return (
    <button
      onClick={() => onSelect(session.id)}
      aria-pressed={isSelected}
      aria-label={`${formatTime(session.startTime)} — ${session.screenName} — ${session.format}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: tokens.spacing.md,
        borderRadius: tokens.radii.md,
        border: `1px solid ${isSelected ? tokens.colors.accent : tokens.colors.border}`,
        backgroundColor: isSelected ? `${tokens.colors.accent}18` : tokens.colors.surface,
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 120,
        transition: tokens.transitions.fast,
        boxShadow: isSelected ? tokens.shadows.glow : 'none',
      }}
    >
      <span
        style={{
          fontSize: tokens.typography.sizes.xl,
          fontWeight: tokens.typography.weights.bold,
          color: isSelected ? tokens.colors.accent : tokens.colors.text,
          lineHeight: tokens.typography.lineHeights.tight,
        }}
      >
        {formatTime(session.startTime)}
      </span>
      <span
        style={{
          fontSize: tokens.typography.sizes.xs,
          color: tokens.colors.textMuted,
          marginTop: tokens.spacing.xs,
        }}
      >
        {session.screenName}
      </span>
      <span
        style={{
          fontSize: tokens.typography.sizes.xs,
          color: tokens.colors.textMuted,
        }}
      >
        {session.format}
      </span>
      {session.priceFrom !== undefined && (
        <span
          style={{
            fontSize: tokens.typography.sizes.sm,
            color: tokens.colors.accent,
            marginTop: tokens.spacing.xs,
            fontWeight: tokens.typography.weights.semibold,
          }}
        >
          from {session.currency ?? '$'}{session.priceFrom.toFixed(2)}
        </span>
      )}
      {isLowAvailability && (
        <span
          style={{
            fontSize: tokens.typography.sizes.xs,
            color: tokens.colors.warning,
            marginTop: tokens.spacing.xs,
          }}
        >
          {session.availableSeats} seats left
        </span>
      )}
    </button>
  );
}
