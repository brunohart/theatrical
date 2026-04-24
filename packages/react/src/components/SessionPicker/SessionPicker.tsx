import React, { useState, useMemo } from 'react';
import { tokens } from '../../tokens';
import { DateSelector } from './DateSelector';
import { SessionCard, type SessionCardData } from './SessionCard';

type GroupBy = 'film' | 'time';

interface TimeWindow {
  label: string;
  startHour: number;
  endHour: number;
}

const TIME_WINDOWS: TimeWindow[] = [
  { label: 'Morning', startHour: 0, endHour: 12 },
  { label: 'Afternoon', startHour: 12, endHour: 17 },
  { label: 'Evening', startHour: 17, endHour: 24 },
];

interface SessionPickerProps {
  sessions: SessionCardData[];
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  /** Group sessions by film title or by time-of-day window */
  groupBy?: GroupBy;
  /** Controlled date. If not provided, today is selected by default. */
  selectedDate?: string;
  /** Called when the selected date changes */
  onDateChange?: (date: string) => void;
  /** Number of days to display in the date scroller */
  dayCount?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

function getHour(session: SessionCardData): number {
  if (session.startTime.includes('T')) {
    return new Date(session.startTime).getHours();
  }
  const [h] = session.startTime.split(':');
  return parseInt(h ?? '0', 10);
}

function groupByFilm(sessions: SessionCardData[]): Map<string, SessionCardData[]> {
  return sessions.reduce((map, session) => {
    const group = map.get(session.filmTitle) ?? [];
    group.push(session);
    map.set(session.filmTitle, group);
    return map;
  }, new Map<string, SessionCardData[]>());
}

function groupByTime(sessions: SessionCardData[]): Map<string, SessionCardData[]> {
  const result = new Map<string, SessionCardData[]>();
  for (const window of TIME_WINDOWS) {
    const windowSessions = sessions.filter((s) => {
      const hour = getHour(s);
      return hour >= window.startHour && hour < window.endHour;
    });
    if (windowSessions.length > 0) result.set(window.label, windowSessions);
  }
  return result;
}

/**
 * Browsable showtime picker. Shows a horizontal date scroller above grouped
 * session cards. Sessions can be grouped by film title or time of day.
 *
 * @example
 * ```tsx
 * <SessionPicker
 *   sessions={sessions}
 *   selectedSessionId={selectedId}
 *   onSessionSelect={setSelectedId}
 *   groupBy="film"
 * />
 * ```
 */
export function SessionPicker({
  sessions,
  selectedSessionId,
  onSessionSelect,
  groupBy = 'film',
  selectedDate,
  onDateChange,
  dayCount = 14,
  isLoading = false,
  emptyMessage = 'No sessions available for this date.',
}: SessionPickerProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [internalDate, setInternalDate] = useState(today);

  const activeDate = selectedDate ?? internalDate;
  function handleDateChange(date: string) {
    setInternalDate(date);
    onDateChange?.(date);
  }

  const groups = useMemo(() => {
    return groupBy === 'film' ? groupByFilm(sessions) : groupByTime(sessions);
  }, [sessions, groupBy]);

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        border: `1px solid ${tokens.colors.border}`,
      }}
    >
      <DateSelector
        selectedDate={activeDate}
        onDateSelect={handleDateChange}
        dayCount={dayCount}
      />

      <div style={{ marginTop: tokens.spacing.lg }}>
        {isLoading ? (
          <p style={{ color: tokens.colors.textMuted, textAlign: 'center', padding: tokens.spacing.xl }}>
            Loading sessions…
          </p>
        ) : sessions.length === 0 ? (
          <p style={{ color: tokens.colors.textMuted, textAlign: 'center', padding: tokens.spacing.xl }}>
            {emptyMessage}
          </p>
        ) : (
          Array.from(groups.entries()).map(([groupLabel, groupSessions]) => (
            <div key={groupLabel} style={{ marginBottom: tokens.spacing.lg }}>
              <h3
                style={{
                  fontSize: tokens.typography.sizes.sm,
                  fontWeight: tokens.typography.weights.semibold,
                  color: tokens.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: tokens.spacing.sm,
                }}
              >
                {groupLabel}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
                {groupSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isSelected={session.id === selectedSessionId}
                    onSelect={onSessionSelect}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
