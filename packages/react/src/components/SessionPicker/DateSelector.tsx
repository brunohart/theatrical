import React from 'react';
import { tokens } from '../../tokens';

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  /** Number of days to show from today (default 14) */
  dayCount?: number;
}

function formatDateLabel(dateStr: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString('en-NZ', { weekday: 'short' }),
    day: d.toLocaleDateString('en-NZ', { day: 'numeric' }),
    month: d.toLocaleDateString('en-NZ', { month: 'short' }),
  };
}

function generateDates(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function DateSelector({ selectedDate, onDateSelect, dayCount = 14 }: DateSelectorProps) {
  const dates = generateDates(dayCount);

  return (
    <div
      style={{
        display: 'flex',
        gap: tokens.spacing.xs,
        overflowX: 'auto',
        paddingBottom: tokens.spacing.sm,
        scrollbarWidth: 'thin',
      }}
      role="listbox"
      aria-label="Select date"
    >
      {dates.map((date) => {
        const isSelected = date === selectedDate;
        const { weekday, day, month } = formatDateLabel(date);
        return (
          <button
            key={date}
            role="option"
            aria-selected={isSelected}
            onClick={() => onDateSelect(date)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
              borderRadius: tokens.radii.md,
              border: `1px solid ${isSelected ? tokens.colors.accent : tokens.colors.border}`,
              backgroundColor: isSelected ? `${tokens.colors.accent}22` : tokens.colors.surface,
              color: isSelected ? tokens.colors.accent : tokens.colors.text,
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: 56,
              transition: tokens.transitions.fast,
            }}
          >
            <span style={{ fontSize: tokens.typography.sizes.xs, color: tokens.colors.textMuted }}>
              {weekday}
            </span>
            <span
              style={{
                fontSize: tokens.typography.sizes.xl,
                fontWeight: tokens.typography.weights.bold,
                lineHeight: tokens.typography.lineHeights.tight,
              }}
            >
              {day}
            </span>
            <span style={{ fontSize: tokens.typography.sizes.xs, color: tokens.colors.textMuted }}>
              {month}
            </span>
          </button>
        );
      })}
    </div>
  );
}
