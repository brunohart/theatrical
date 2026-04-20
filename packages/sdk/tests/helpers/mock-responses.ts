export function createMockSession(overrides?: Record<string, unknown>) {
  return {
    id: 'sess_roxy_20260410_1930',
    filmId: 'film_dune_part_two',
    filmTitle: 'Dune: Part Two',
    siteId: 'site_roxy_wellington',
    screenName: 'Cinema 1',
    startTime: '2026-04-10T19:30:00+12:00',
    endTime: '2026-04-10T22:15:00+12:00',
    format: '2D',
    isBookable: true,
    isSoldOut: false,
    seatsAvailable: 142,
    seatsTotal: 180,
    ...overrides,
  };
}

export function createMockFilm(overrides?: Record<string, unknown>) {
  return {
    id: 'film_dune_part_two',
    title: 'Dune: Part Two',
    synopsis: 'Paul Atreides unites with the Fremen to seek revenge against those who destroyed his family.',
    genres: ['Sci-Fi', 'Adventure'],
    runtime: 166,
    rating: 'M',
    releaseDate: '2024-03-01',
    posterUrl: 'https://images.vista.co/films/dune-2/poster.jpg',
    ...overrides,
  };
}

export function createMockSite(overrides?: Record<string, unknown>) {
  return {
    id: 'site_roxy_wellington',
    name: 'Roxy Cinema Wellington',
    address: '5 Park Road, Miramar, Wellington 6022',
    latitude: -41.3007,
    longitude: 174.7766,
    timezone: 'Pacific/Auckland',
    isActive: true,
    ...overrides,
  };
}
