import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SitesResource } from '../../src/resources/sites';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type { Site, Screen } from '../../src/types/site';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: SitesResource;
  mockGet: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const http = { get: mockGet } as unknown as TheatricalHTTPClient;
  return { resource: new SitesResource(http), mockGet };
}

// ---------------------------------------------------------------------------
// Fixture factories — realistic NZ cinema data
// ---------------------------------------------------------------------------

/** Roxy Cinema Wellington — beloved independent cinema in Miramar. */
function createRoxySite(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site_roxy_wellington',
    name: 'Roxy Cinema',
    address: {
      line1: '5 Park Road',
      line2: 'Miramar',
      city: 'Wellington',
      postalCode: '6022',
      country: 'NZ',
    },
    location: { latitude: -41.3007, longitude: 174.8166 },
    screens: [
      { id: 'scr_roxy_1', name: 'Main Auditorium', seatCount: 174, formats: ['2D', 'Dolby Surround'], isAccessible: true },
      { id: 'scr_roxy_2', name: 'Lounge', seatCount: 42, formats: ['2D'], isAccessible: false },
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
      { id: 'cafe', label: 'Roxy Café' },
    ],
    ...overrides,
  };
}

/** Embassy Theatre Wellington — the grand premiere venue. */
function createEmbassySite(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site_embassy_wellington',
    name: 'Embassy Theatre',
    address: {
      line1: '10 Kent Terrace',
      city: 'Wellington',
      postalCode: '6011',
      country: 'NZ',
    },
    location: { latitude: -41.2942, longitude: 174.7843 },
    screens: [
      { id: 'scr_embassy_main', name: 'Grand Theatre', seatCount: 810, formats: ['2D', 'IMAX', 'Dolby Atmos'], isAccessible: true },
    ],
    config: {
      bookingLeadTime: 15,
      maxTicketsPerOrder: 20,
      loyaltyEnabled: true,
      fnbEnabled: true,
    },
    timezone: 'Pacific/Auckland',
    currency: 'NZD',
    isActive: true,
    amenities: [
      { id: 'imax', label: 'IMAX' },
      { id: 'bar', label: 'Embassy Bar' },
      { id: 'vip_lounge', label: 'VIP Lounge', icon: 'star' },
    ],
    ...overrides,
  };
}

/** Event Cinemas Queen Street Auckland — large multiplex. */
function createEventQueenStreetSite(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site_event_queen_street',
    name: 'Event Cinemas Queen Street',
    address: {
      line1: '291 Queen Street',
      city: 'Auckland',
      postalCode: '1010',
      country: 'NZ',
    },
    location: { latitude: -36.8509, longitude: 174.7645 },
    screens: [
      { id: 'scr_event_1', name: 'Screen 1', seatCount: 350, formats: ['2D', 'IMAX'], isAccessible: true },
      { id: 'scr_event_2', name: 'Screen 2', seatCount: 220, formats: ['2D', '3D'], isAccessible: true },
      { id: 'scr_event_3', name: 'Screen 3', seatCount: 180, formats: ['2D'], isAccessible: false },
      { id: 'scr_event_4', name: 'Gold Lounge', seatCount: 48, formats: ['2D', '4DX'], isAccessible: true },
    ],
    config: {
      bookingLeadTime: 20,
      maxTicketsPerOrder: 15,
      loyaltyEnabled: true,
      fnbEnabled: true,
    },
    timezone: 'Pacific/Auckland',
    currency: 'NZD',
    isActive: true,
    amenities: [
      { id: 'imax', label: 'IMAX' },
      { id: 'gold_class', label: 'Gold Class' },
      { id: '4dx', label: '4DX Experience' },
      { id: 'parking', label: 'Parking Available', icon: 'car' },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Smoke test — resource instantiation
// ---------------------------------------------------------------------------

describe('SitesResource', () => {
  it('instantiates with an HTTP client', () => {
    const { resource } = createMockHTTPClient();
    expect(resource).toBeInstanceOf(SitesResource);
  });
});

// ---------------------------------------------------------------------------
// list() — fetching and filtering sites
// ---------------------------------------------------------------------------

describe('SitesResource.list()', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches sites from the correct OCAPI endpoint', async () => {
    mockGet.mockResolvedValueOnce([createRoxySite()]);

    await resource.list();

    expect(mockGet).toHaveBeenCalledOnce();
    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites', expect.any(Object));
  });

  it('returns multiple NZ cinema sites', async () => {
    const sites = [createRoxySite(), createEmbassySite(), createEventQueenStreetSite()];
    mockGet.mockResolvedValueOnce(sites);

    const result = await resource.list();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Roxy Cinema');
    expect(result[1].name).toBe('Embassy Theatre');
    expect(result[2].name).toBe('Event Cinemas Queen Street');
  });

  it('passes text search query as parameter', async () => {
    mockGet.mockResolvedValueOnce([createEmbassySite()]);

    await resource.list({ query: 'Embassy' });

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites', {
      params: { query: 'Embassy' },
    });
  });

  it('passes geographic filter parameters together', async () => {
    mockGet.mockResolvedValueOnce([createRoxySite()]);

    await resource.list({ latitude: -41.2865, longitude: 174.7762, radius: 10 });

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites', {
      params: { latitude: -41.2865, longitude: 174.7762, radius: 10 },
    });
  });

  it('returns an empty list when no sites match', async () => {
    mockGet.mockResolvedValueOnce([]);

    const result = await resource.list({ query: 'nonexistent' });

    expect(result).toHaveLength(0);
  });

  it('returns site amenities when present', async () => {
    mockGet.mockResolvedValueOnce([createEmbassySite()]);

    const result = await resource.list();
    const embassy = result[0];

    expect(embassy.amenities).toBeDefined();
    expect(embassy.amenities!).toHaveLength(3);
    expect(embassy.amenities!.some(a => a.id === 'imax')).toBe(true);
  });

  it('returns screen configurations embedded in each site', async () => {
    mockGet.mockResolvedValueOnce([createEventQueenStreetSite()]);

    const result = await resource.list();

    expect(result[0].screens).toHaveLength(4);
    expect(result[0].screens[3].name).toBe('Gold Lounge');
    expect(result[0].screens[3].seatCount).toBe(48);
  });
});
