import type { SessionCardData } from '@theatrical/react';
import type { SeatRowData } from '@theatrical/react';

export interface MockFilm {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  classification: string;
  genre: string;
  posterUrl: string;
  releaseYear: number;
}

export const MOCK_FILMS: MockFilm[] = [
  {
    id: 'film-001',
    title: 'The Last Projection',
    synopsis:
      'A veteran projectionist discovers a reel of film that contains footage of events yet to happen. As screenings begin, the line between cinema and reality dissolves.',
    duration: 118,
    classification: 'M',
    genre: 'Thriller',
    posterUrl: '',
    releaseYear: 2026,
  },
  {
    id: 'film-002',
    title: 'Neon Requiem',
    synopsis:
      'In a city that never sleeps, a jazz musician uncovers a conspiracy that stretches from the underground clubs to the highest floors of power.',
    duration: 132,
    classification: 'R16',
    genre: 'Neo-noir',
    posterUrl: '',
    releaseYear: 2026,
  },
  {
    id: 'film-003',
    title: 'Meridian',
    synopsis:
      'Two astronomers on opposite sides of the world simultaneously detect an anomaly that challenges everything science believes about the cosmos.',
    duration: 145,
    classification: 'G',
    genre: 'Sci-fi',
    posterUrl: '',
    releaseYear: 2026,
  },
];

export function getMockSessions(filmId: string, dateStr: string): SessionCardData[] {
  const base = new Date(dateStr + 'T10:00:00');
  const offsets = [0, 3, 5.5, 8];
  return offsets.map((h, i) => {
    const start = new Date(base.getTime() + h * 3600 * 1000);
    const film = MOCK_FILMS.find((f) => f.id === filmId) ?? MOCK_FILMS[0]!;
    const end = new Date(start.getTime() + (film.duration + 20) * 60 * 1000);
    const formats = ['Standard', 'IMAX', 'Standard', 'Gold Class'];
    return {
      id: `${filmId}-session-${i}`,
      filmTitle: film.title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      screenName: `Screen ${i + 1}`,
      format: formats[i] ?? 'Standard',
      priceFrom: [18.5, 28.0, 18.5, 45.0][i],
      currency: 'NZD',
      availableSeats: [84, 12, 143, 8][i],
    };
  });
}

export function getMockSeatMap(): SeatRowData[] {
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = [8, 10, 12, 12, 14, 14, 12, 10];
  const takenIds = new Set(['B-3', 'B-4', 'C-5', 'C-6', 'C-7', 'D-8', 'E-3', 'F-7', 'F-8']);
  const wheelchairIds = new Set(['A-1', 'A-8']);
  const premiumIds = new Set(['D-6', 'D-7', 'D-8', 'E-6', 'E-7', 'E-8', 'E-9']);

  return rowLabels.map((row, ri) => ({
    rowLabel: row,
    seats: Array.from({ length: seatsPerRow[ri] ?? 10 }, (_, si) => {
      const seatNum = si + 1;
      const key = `${row}-${seatNum}`;
      const state = wheelchairIds.has(key)
        ? ('wheelchair' as const)
        : takenIds.has(key)
          ? ('taken' as const)
          : premiumIds.has(key)
            ? ('premium' as const)
            : ('available' as const);
      return { id: key, row, number: seatNum, state };
    }),
  }));
}
