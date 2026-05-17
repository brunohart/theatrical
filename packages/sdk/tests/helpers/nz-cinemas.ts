export const NZ_CINEMAS = {
  ROXY_WELLINGTON: {
    id: 'site_roxy_wellington',
    name: 'Roxy Cinema Wellington',
    lat: -41.3007,
    lng: 174.7766,
  },
  EMBASSY_WELLINGTON: {
    id: 'site_embassy_wellington',
    name: 'Embassy Theatre Wellington',
    lat: -41.2924,
    lng: 174.7789,
  },
  EVENT_QUEEN_ST: {
    id: 'site_event_queen_st',
    name: 'Event Cinemas Queen Street',
    lat: -36.8509,
    lng: 174.7645,
  },
  LIGHTHOUSE_PETONE: {
    id: 'site_lighthouse_petone',
    name: 'Light House Cinema Petone',
    lat: -41.2270,
    lng: 174.8715,
  },
  MONTEREY_HOWICK: {
    id: 'site_monterey_howick',
    name: 'Monterey Cinemas Howick',
    lat: -36.8984,
    lng: 174.9347,
  },
} as const;

export const NZ_FILMS = {
  DUNE_PART_TWO: { id: 'film_dune_part_two', title: 'Dune: Part Two', runtime: 166 },
  WICKED: { id: 'film_wicked', title: 'Wicked', runtime: 160 },
  DEADPOOL_WOLVERINE: { id: 'film_deadpool_wolverine', title: 'Deadpool & Wolverine', runtime: 128 },
  INSIDE_OUT_2: { id: 'film_inside_out_2', title: 'Inside Out 2', runtime: 96 },
} as const;
