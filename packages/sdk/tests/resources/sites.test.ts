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

// ---------------------------------------------------------------------------
// get() — single site retrieval
// ---------------------------------------------------------------------------

describe('SitesResource.get()', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches a site from the correct endpoint path', async () => {
    mockGet.mockResolvedValueOnce(createRoxySite());

    await resource.get('site_roxy_wellington');

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites/site_roxy_wellington');
  });

  it('returns site address with correct NZ postal format', async () => {
    mockGet.mockResolvedValueOnce(createRoxySite());

    const result = await resource.get('site_roxy_wellington');

    expect(result.address.line1).toBe('5 Park Road');
    expect(result.address.city).toBe('Wellington');
    expect(result.address.postalCode).toBe('6022');
    expect(result.address.country).toBe('NZ');
  });

  it('returns site location coordinates', async () => {
    mockGet.mockResolvedValueOnce(createEmbassySite());

    const result = await resource.get('site_embassy_wellington');

    expect(result.location.latitude).toBeCloseTo(-41.2942, 4);
    expect(result.location.longitude).toBeCloseTo(174.7843, 4);
  });

  it('returns site operational configuration', async () => {
    mockGet.mockResolvedValueOnce(createRoxySite());

    const result = await resource.get('site_roxy_wellington');

    expect(result.config.bookingLeadTime).toBe(30);
    expect(result.config.maxTicketsPerOrder).toBe(10);
    expect(result.config.loyaltyEnabled).toBe(true);
    expect(result.config.fnbEnabled).toBe(true);
  });

  it('returns timezone and currency for the region', async () => {
    mockGet.mockResolvedValueOnce(createRoxySite());

    const result = await resource.get('site_roxy_wellington');

    expect(result.timezone).toBe('Pacific/Auckland');
    expect(result.currency).toBe('NZD');
  });

  it('returns isActive flag for operational status', async () => {
    const inactive = createRoxySite({ isActive: false });
    mockGet.mockResolvedValueOnce(inactive);

    const result = await resource.get('site_roxy_wellington');

    expect(result.isActive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// screens() — auditorium configuration retrieval
// ---------------------------------------------------------------------------

describe('SitesResource.screens()', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches screens from the correct endpoint path', async () => {
    const screens: Screen[] = [
      { id: 'scr_embassy_main', name: 'Grand Theatre', seatCount: 810, formats: ['2D', 'IMAX', 'Dolby Atmos'], isAccessible: true },
    ];
    mockGet.mockResolvedValueOnce(screens);

    await resource.screens('site_embassy_wellington');

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites/site_embassy_wellington/screens');
  });

  it('returns screen formats for format-aware booking', async () => {
    const screens: Screen[] = [
      { id: 'scr_event_1', name: 'Screen 1', seatCount: 350, formats: ['2D', 'IMAX'], isAccessible: true },
      { id: 'scr_event_4', name: 'Gold Lounge', seatCount: 48, formats: ['2D', '4DX'], isAccessible: true },
    ];
    mockGet.mockResolvedValueOnce(screens);

    const result = await resource.screens('site_event_queen_street');

    expect(result[0].formats).toContain('IMAX');
    expect(result[1].formats).toContain('4DX');
  });

  it('returns accessibility status for each screen', async () => {
    const screens: Screen[] = [
      { id: 'scr_roxy_1', name: 'Main Auditorium', seatCount: 174, formats: ['2D'], isAccessible: true },
      { id: 'scr_roxy_2', name: 'Lounge', seatCount: 42, formats: ['2D'], isAccessible: false },
    ];
    mockGet.mockResolvedValueOnce(screens);

    const result = await resource.screens('site_roxy_wellington');

    const accessible = result.filter(s => s.isAccessible);
    const notAccessible = result.filter(s => !s.isAccessible);
    expect(accessible).toHaveLength(1);
    expect(notAccessible).toHaveLength(1);
    expect(accessible[0].name).toBe('Main Auditorium');
  });

  it('returns seat capacity for each screen', async () => {
    const screens: Screen[] = [
      { id: 'scr_embassy_main', name: 'Grand Theatre', seatCount: 810, formats: ['2D', 'IMAX'], isAccessible: true },
    ];
    mockGet.mockResolvedValueOnce(screens);

    const result = await resource.screens('site_embassy_wellington');

    expect(result[0].seatCount).toBe(810);
  });
});

// ---------------------------------------------------------------------------
// nearby() — geographic radius search
// ---------------------------------------------------------------------------

describe('SitesResource.nearby()', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('passes lat/lng/radius to the OCAPI endpoint', async () => {
    mockGet.mockResolvedValueOnce([createRoxySite()]);

    await resource.nearby(-41.2865, 174.7762, 5);

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sites', {
      params: { latitude: -41.2865, longitude: 174.7762, radius: 5 },
    });
  });

  it('returns cinemas within range of central Wellington', async () => {
    const wellingtonSites = [createRoxySite(), createEmbassySite()];
    mockGet.mockResolvedValueOnce(wellingtonSites);

    const result = await resource.nearby(-41.2865, 174.7762, 10);

    expect(result).toHaveLength(2);
    expect(result.map(s => s.name)).toContain('Roxy Cinema');
    expect(result.map(s => s.name)).toContain('Embassy Theatre');
  });

  it('returns empty list when no cinemas within radius', async () => {
    mockGet.mockResolvedValueOnce([]);

    const result = await resource.nearby(-45.8788, 170.5028, 1);

    expect(result).toHaveLength(0);
  });

  it('returns sites from a different city with appropriate coordinates', async () => {
    mockGet.mockResolvedValueOnce([createEventQueenStreetSite()]);

    const result = await resource.nearby(-36.8509, 174.7645, 5);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Event Cinemas Queen Street');
    expect(result[0].address.city).toBe('Auckland');
  });
});

// ---------------------------------------------------------------------------
// Zod validation — malformed response rejection
// ---------------------------------------------------------------------------

describe('SitesResource — Zod schema validation', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('rejects a site with latitude out of range', async () => {
    const malformed = createRoxySite();
    malformed.location.latitude = -200;
    mockGet.mockResolvedValueOnce([malformed]);

    await expect(resource.list()).rejects.toThrow();
  });

  it('rejects a site with longitude out of range', async () => {
    const malformed = createRoxySite();
    malformed.location.longitude = 999;
    mockGet.mockResolvedValueOnce([malformed]);

    await expect(resource.list()).rejects.toThrow();
  });

  it('rejects a site missing required name field', async () => {
    const malformed = { ...createRoxySite() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (malformed as any).name;
    mockGet.mockResolvedValueOnce(malformed);

    await expect(resource.get('site_roxy_wellington')).rejects.toThrow();
  });

  it('rejects a screen with zero seat count', async () => {
    const screens = [{ id: 'scr_broken', name: 'Empty Screen', seatCount: 0, formats: ['2D'], isAccessible: false }];
    mockGet.mockResolvedValueOnce(screens);

    await expect(resource.screens('site_test')).rejects.toThrow();
  });

  it('rejects a screen with no formats', async () => {
    const screens = [{ id: 'scr_broken', name: 'No Format Screen', seatCount: 100, formats: [], isAccessible: true }];
    mockGet.mockResolvedValueOnce(screens);

    await expect(resource.screens('site_test')).rejects.toThrow();
  });

  it('rejects a site with invalid two-letter country code', async () => {
    const malformed = createRoxySite();
    malformed.address.country = 'NEW ZEALAND';
    mockGet.mockResolvedValueOnce([malformed]);

    await expect(resource.list()).rejects.toThrow();
  });

  it('rejects a site with invalid currency code length', async () => {
    const malformed = createRoxySite({ currency: 'NZ' });
    mockGet.mockResolvedValueOnce([malformed]);

    await expect(resource.list()).rejects.toThrow();
  });

  it('accepts a site without optional amenities', async () => {
    const site = createRoxySite({ amenities: undefined });
    mockGet.mockResolvedValueOnce([site]);

    const result = await resource.list();

    expect(result).toHaveLength(1);
    expect(result[0].amenities).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Error propagation — HTTP errors surface from resource methods
// ---------------------------------------------------------------------------

describe('SitesResource — error propagation', () => {
  let resource: SitesResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('propagates a not-found error from get()', async () => {
    const notFound = Object.assign(new Error('Site not found'), { statusCode: 404 });
    mockGet.mockRejectedValueOnce(notFound);

    await expect(resource.get('site_nonexistent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('propagates a network error from list()', async () => {
    mockGet.mockRejectedValueOnce(new Error('fetch failed'));

    await expect(resource.list()).rejects.toThrow('fetch failed');
  });

  it('propagates a rate-limit error from nearby()', async () => {
    const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
      statusCode: 429,
      retryAfter: 60,
    });
    mockGet.mockRejectedValueOnce(rateLimitError);

    await expect(resource.nearby(-41.2865, 174.7762, 10)).rejects.toMatchObject({
      statusCode: 429,
      retryAfter: 60,
    });
  });

  it('propagates a server error from screens()', async () => {
    const serverError = Object.assign(new Error('Internal server error'), { statusCode: 500 });
    mockGet.mockRejectedValueOnce(serverError);

    await expect(resource.screens('site_roxy_wellington')).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
