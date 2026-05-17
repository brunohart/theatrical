export interface SessionTimerState {
  minutesUntilStart: number;
  isStartingSoon: boolean;
  isInProgress: boolean;
  isEnded: boolean;
  formattedCountdown: string;
}

export function calculateSessionState(startTime: string, endTime: string, now = new Date()): SessionTimerState {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = start.getTime() - now.getTime();
  const minutesUntilStart = Math.floor(diffMs / 60_000);

  const isInProgress = now >= start && now < end;
  const isEnded = now >= end;
  const isStartingSoon = minutesUntilStart > 0 && minutesUntilStart <= 30;

  let formattedCountdown = '';
  if (minutesUntilStart > 60) {
    const hours = Math.floor(minutesUntilStart / 60);
    formattedCountdown = `${hours}h ${minutesUntilStart % 60}m`;
  } else if (minutesUntilStart > 0) {
    formattedCountdown = `${minutesUntilStart}m`;
  } else if (isInProgress) {
    formattedCountdown = 'Now showing';
  } else {
    formattedCountdown = 'Ended';
  }

  return { minutesUntilStart, isStartingSoon, isInProgress, isEnded, formattedCountdown };
}
