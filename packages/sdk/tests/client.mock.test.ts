import { describe, it, expect } from 'vitest';
import { TheatricalClient } from '../src/client';

describe('TheatricalClient.createMock()', () => {
  it('returns a client without requiring an API key', () => {
    const client = TheatricalClient.createMock();
    expect(client).toBeInstanceOf(TheatricalClient);
  });

  it('exposes all resource accessors', () => {
    const client = TheatricalClient.createMock();
    expect(client.films).toBeDefined();
    expect(client.sessions).toBeDefined();
    expect(client.sites).toBeDefined();
    expect(client.orders).toBeDefined();
    expect(client.loyalty).toBeDefined();
    expect(client.subscriptions).toBeDefined();
  });

  it('returns mock film data from films.nowShowing()', async () => {
    const client = TheatricalClient.createMock();
    const films = await client.films.nowShowing();
    expect(Array.isArray(films)).toBe(true);
    expect(films.length).toBeGreaterThan(0);
    expect(films[0].title).toBe('The Holdovers');
    expect(films[0].isNowShowing).toBe(true);
  });

  it('returns mock session data from sessions.list()', async () => {
    const client = TheatricalClient.createMock();
    const result = await client.sessions.list({ siteId: 'site_roxy_wellington' });
    expect(Array.isArray(result.sessions)).toBe(true);
    expect(result.sessions.length).toBeGreaterThan(0);
    expect(result.sessions[0].filmTitle).toBe('The Holdovers');
  });

  it('returns mock site data from sites.list()', async () => {
    const client = TheatricalClient.createMock();
    const sites = await client.sites.list();
    expect(Array.isArray(sites)).toBe(true);
    expect(sites[0].name).toBe('Roxy Cinema');
    expect(sites[0].currency).toBe('NZD');
  });

  it('accepts fixture overrides for custom mock data', async () => {
    const client = TheatricalClient.createMock({
      '/ocapi/v1/films/now-showing': [
        {
          id: 'film_custom_001',
          title: 'Custom Film',
          synopsis: 'A custom film for testing.',
          genres: ['drama'],
          runtime: 90,
          rating: { classification: 'G' },
          releaseDate: '2026-04-01',
          cast: [],
          director: 'Custom Director',
          isNowShowing: true,
          isComingSoon: false,
        },
      ],
    });
    const films = await client.films.nowShowing();
    expect(films[0].title).toBe('Custom Film');
  });
});
