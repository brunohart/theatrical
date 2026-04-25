/**
 * Formats an ISO timestamp or HH:MM time string for display using the NZ locale.
 * For ISO strings, renders weekday, date, and time. For bare time strings, returns as-is.
 */
export function formatTime(isoOrTime: string): string {
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

/** Formats an ISO timestamp to show only the time component. */
export function formatTimeOnly(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    return d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return isoOrTime;
}

export function formatDateLabel(dateStr: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString('en-NZ', { weekday: 'short' }),
    day: d.toLocaleDateString('en-NZ', { day: 'numeric' }),
    month: d.toLocaleDateString('en-NZ', { month: 'short' }),
  };
}
