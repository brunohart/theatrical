/**
 * Shared test fixtures for Week 1 integration tests.
 *
 * All mock data uses real NZ cinema context:
 * - Roxy Cinema Wellington (independent, boutique)
 * - Embassy Theatre Wellington (heritage, premiere venue)
 * - Event Cinemas Queen Street Auckland (multiplex chain)
 *
 * Films are real titles with plausible screening data.
 */

import { vi } from 'vitest';
import type { TheatricalHTTPClient } from '../../packages/sdk/src/http/client';
import type { Session, SessionListResponse, SeatAvailability } from '../../packages/sdk/src/types/session';
import type { Film, FilmDetail } from '../../packages/sdk/src/types/film';
import type { Site } from '../../packages/sdk/src/types/site';
import type { Order, Ticket, OrderItem } from '../../packages/sdk/src/types/order';
import type { PaginatedResponse } from '../../packages/sdk/src/types/pagination';

// ─── Mock HTTP Client ──────────────────────────────────────

export interface MockHTTPClient {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock HTTP client that can be cast to TheatricalHTTPClient.
 * Integration tests wire this into resource modules directly.
 */
export function createMockHTTP(): MockHTTPClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

export function asHTTPClient(mock: MockHTTPClient): TheatricalHTTPClient {
  return mock as unknown as TheatricalHTTPClient;
}

// ─── Site Fixtures ─────────────────────────────────────────

export const ROXY_WELLINGTON: Site = {
  id: 'site_roxy_wellington',
  name: 'Roxy Cinema',
  address: {
    line1: '5 Park Road',
    city: 'Wellington',
    state: 'Wellington',
    postalCode: '6012',
    country: 'NZ',
  },
  location: { latitude: -41.3007, longitude: 174.7766 },
  screens: [
    { id: 'scr_roxy_1', name: 'Screen 1', seatCount: 250, formats: ['2D', '3D'], isAccessible: true },
    { id: 'scr_roxy_2', name: 'Screen 2', seatCount: 120, formats: ['2D'], isAccessible: true },
    { id: 'scr_roxy_3', name: 'Screen 3', seatCount: 80, formats: ['2D'], isAccessible: false },
  ],
  config: {
    bookingLeadTime: 30,
    maxTicketsPerOrder: 10,
    loyaltyEnabled: true,
    fnbEnabled: true,
  },
  timezone: 'Pacific/Auckland',
  currency: 'NZD',
  isActive: true,
  amenities: [
    { id: 'bar', label: 'Licensed Bar' },
    { id: 'cafe', label: 'Café' },
  ],
};

export const EMBASSY_WELLINGTON: Site = {
  id: 'site_embassy_wellington',
  name: 'Embassy Theatre',
  address: {
    line1: '10 Kent Terrace',
    city: 'Wellington',
    postalCode: '6011',
    country: 'NZ',
  },
  location: { latitude: -41.2949, longitude: 174.7842 },
  screens: [
    { id: 'scr_embassy_main', name: 'Grand Auditorium', seatCount: 550, formats: ['2D', '3D', 'DOLBY_CINEMA'], isAccessible: true },
  ],
  config: {
    bookingLeadTime: 15,
    maxTicketsPerOrder: 12,
    loyaltyEnabled: true,
    fnbEnabled: true,
  },
  timezone: 'Pacific/Auckland',
  currency: 'NZD',
  isActive: true,
  amenities: [
    { id: 'bar', label: 'Licensed Bar' },
    { id: 'heritage', label: 'Heritage Building' },
  ],
};

// ─── Film Fixtures ─────────────────────────────────────────

export const ANORA: Film = {
  id: 'film_anora_2024',
  title: 'Anora',
  synopsis: 'A young sex worker from Brooklyn gets her chance at a Cinderella story when she marries the son of a Russian oligarch.',
  genres: ['drama', 'comedy', 'romance'],
  runtime: 139,
  rating: { classification: 'R16', description: 'Sex scenes, offensive language, drug use' },
  releaseDate: '2024-10-18',
  posterUrl: 'https://images.vista.co/films/anora/poster.jpg',
  cast: [
    { name: 'Mikey Madison', role: 'Anora' },
    { name: 'Mark Eydelshteyn', role: 'Ivan' },
    { name: 'Yura Borisov', role: 'Igor' },
  ],
  director: 'Sean Baker',
  distributor: 'Neon',
  isNowShowing: true,
  isComingSoon: false,
};

export const ANORA_DETAIL: FilmDetail = {
  ...ANORA,
  crew: [
    { name: 'Sean Baker', department: 'Directing', job: 'Director' },
    { name: 'Sean Baker', department: 'Writing', job: 'Writer' },
    { name: 'Drew Daniels', department: 'Camera', job: 'Cinematographer' },
  ],
  ratings: [
    { source: 'IMDB', score: '7.7', outOf: '10' },
    { source: 'Rotten Tomatoes', score: '95', outOf: '100' },
    { source: 'Metacritic', score: '90', outOf: '100' },
  ],
  formats: ['2D'],
  languages: ['en'],
  originalTitle: 'Anora',
  productionCountries: ['US'],
};

export const THE_BRUTALIST: Film = {
  id: 'film_brutalist_2024',
  title: 'The Brutalist',
  synopsis: 'A visionary architect flees post-war Europe and resettles in America, where a wealthy patron recognises his talent.',
  genres: ['drama'],
  runtime: 215,
  rating: { classification: 'R16', description: 'Violence, sex scenes, offensive language, drug use' },
  releaseDate: '2025-01-24',
  posterUrl: 'https://images.vista.co/films/brutalist/poster.jpg',
  cast: [
    { name: 'Adrien Brody', role: 'László Tóth' },
    { name: 'Felicity Jones', role: 'Erzsébet' },
    { name: 'Guy Pearce', role: 'Harrison Lee Van Buren' },
  ],
  director: 'Brady Corbet',
  distributor: 'A24',
  isNowShowing: true,
  isComingSoon: false,
};

// ─── Session Fixtures ──────────────────────────────────────

export const ANORA_SESSION_ROXY: Session = {
  id: 'ses_roxy_anora_20260413_1930',
  filmId: 'film_anora_2024',
  filmTitle: 'Anora',
  siteId: 'site_roxy_wellington',
  screenId: 'scr_roxy_1',
  screenName: 'Screen 1',
  startTime: '2026-04-13T19:30:00+12:00',
  endTime: '2026-04-13T21:49:00+12:00',
  format: '2D',
  isBookable: true,
  isSoldOut: false,
  seatsAvailable: 142,
  seatsTotal: 250,
  priceFrom: 19.50,
  currency: 'NZD',
  attributes: { subtitles: 'English', audio: 'English' },
};

export const BRUTALIST_SESSION_EMBASSY: Session = {
  id: 'ses_embassy_brutalist_20260413_1800',
  filmId: 'film_brutalist_2024',
  filmTitle: 'The Brutalist',
  siteId: 'site_embassy_wellington',
  screenId: 'scr_embassy_main',
  screenName: 'Grand Auditorium',
  startTime: '2026-04-13T18:00:00+12:00',
  endTime: '2026-04-13T21:35:00+12:00',
  format: '2D',
  isBookable: true,
  isSoldOut: false,
  seatsAvailable: 312,
  seatsTotal: 550,
  priceFrom: 24.00,
  currency: 'NZD',
  attributes: { subtitles: 'English', audio: 'English', intermission: 'yes' },
};

// ─── Seat Availability Fixtures ────────────────────────────

export const ROXY_SCREEN1_SEATS: SeatAvailability = {
  sessionId: 'ses_roxy_anora_20260413_1930',
  screenName: 'Screen 1',
  rowCount: 12,
  screenPosition: 'top',
  availableCount: 142,
  totalCount: 250,
  seats: [
    { id: 'H7', row: 'H', number: 7, status: 'available', x: 7, y: 8, isAccessible: false },
    { id: 'H8', row: 'H', number: 8, status: 'available', x: 8, y: 8, isAccessible: false },
    { id: 'H9', row: 'H', number: 9, status: 'available', x: 9, y: 8, isAccessible: false },
    { id: 'H10', row: 'H', number: 10, status: 'taken', x: 10, y: 8, isAccessible: false },
    { id: 'A1', row: 'A', number: 1, status: 'wheelchair', x: 1, y: 1, isAccessible: true },
    { id: 'A2', row: 'A', number: 2, status: 'companion', x: 2, y: 1, isAccessible: true },
    { id: 'K5', row: 'K', number: 5, status: 'reserved', x: 5, y: 11, isAccessible: false },
    { id: 'L12', row: 'L', number: 12, status: 'blocked', x: 12, y: 12, isAccessible: false },
  ],
};

// ─── Order Fixtures ────────────────────────────────────────

export function createDraftOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord_roxy_anora_20260413',
    sessionId: 'ses_roxy_anora_20260413_1930',
    status: 'draft',
    tickets: [],
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    currency: 'NZD',
    createdAt: '2026-04-13T10:00:00+12:00',
    ...overrides,
  };
}

export function createTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tkt_roxy_001',
    type: 'Adult',
    seatId: 'H7',
    seatLabel: 'Row H, Seat 7',
    price: 19.50,
    ...overrides,
  };
}

export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item_flat_white_001',
    name: 'Flat White',
    category: 'Hot Drinks',
    quantity: 1,
    unitPrice: 5.50,
    totalPrice: 5.50,
    ...overrides,
  };
}

export function createOrderWithTickets(): Order {
  const tickets = [
    createTicket({ id: 'tkt_001', seatId: 'H7', seatLabel: 'Row H, Seat 7' }),
    createTicket({ id: 'tkt_002', seatId: 'H8', seatLabel: 'Row H, Seat 8' }),
  ];
  return createDraftOrder({
    status: 'pending',
    tickets,
    subtotal: 39.00,
    tax: 5.85,
    total: 44.85,
  });
}

export function createConfirmedOrder(): Order {
  const tickets = [
    createTicket({ id: 'tkt_001', seatId: 'H7', seatLabel: 'Row H, Seat 7' }),
    createTicket({ id: 'tkt_002', seatId: 'H8', seatLabel: 'Row H, Seat 8' }),
  ];
  return createDraftOrder({
    status: 'confirmed',
    tickets,
    items: [createOrderItem()],
    subtotal: 44.50,
    tax: 6.68,
    discount: 0,
    total: 51.18,
    loyaltyMemberId: 'mem_aroha_tangaroa_007',
    loyaltyPointsEarned: 51,
    confirmedAt: '2026-04-13T10:05:00+12:00',
    updatedAt: '2026-04-13T10:05:00+12:00',
  });
}
