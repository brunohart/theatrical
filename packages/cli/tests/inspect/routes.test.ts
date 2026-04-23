import { describe, it, expect } from 'vitest';
import {
  resolveRoute,
  buildRequestUrl,
  VALID_RESOURCES,
  VALID_ACTIONS,
} from '../../src/inspect/routes';
import type { InspectOptions } from '../../src/inspect/types';

describe('resolveRoute', () => {
  it('resolves sessions list route', () => {
    const route = resolveRoute('sessions', 'list');
    expect(route).not.toBeNull();
    expect(route!.method).toBe('GET');
    expect(route!.path).toBe('/ocapi/v1/sessions');
  });

  it('resolves films get route', () => {
    const route = resolveRoute('films', 'get');
    expect(route).not.toBeNull();
    expect(route!.path).toContain(':id');
  });

  it('resolves loyalty search route', () => {
    const route = resolveRoute('loyalty', 'search');
    expect(route).not.toBeNull();
    expect(route!.method).toBe('GET');
  });

  it('returns null for unknown resource', () => {
    expect(resolveRoute('unknown', 'list')).toBeNull();
  });

  it('returns null for unknown action', () => {
    expect(resolveRoute('sessions', 'delete')).toBeNull();
  });

  it('resolves all valid resource + action combinations', () => {
    for (const resource of VALID_RESOURCES) {
      for (const action of VALID_ACTIONS) {
        const route = resolveRoute(resource, action);
        expect(route, `${resource}/${action}`).not.toBeNull();
        expect(route!.method).toBeDefined();
        expect(route!.path).toBeDefined();
        expect(route!.description).toBeDefined();
      }
    }
  });
});

describe('buildRequestUrl', () => {
  const baseUrl = 'https://api.vista.co';

  it('builds a basic list URL', () => {
    const route = resolveRoute('sessions', 'list')!;
    const url = buildRequestUrl(route, baseUrl, {});
    expect(url).toBe('https://api.vista.co/ocapi/v1/sessions');
  });

  it('substitutes :id parameter', () => {
    const route = resolveRoute('films', 'get')!;
    const url = buildRequestUrl(route, baseUrl, {}, 'film_12345');
    expect(url).toBe('https://api.vista.co/ocapi/v1/films/film_12345');
  });

  it('adds site query parameter', () => {
    const route = resolveRoute('sessions', 'list')!;
    const options: InspectOptions = { site: 'site_abc' };
    const url = buildRequestUrl(route, baseUrl, options);
    expect(url).toContain('siteId=site_abc');
  });

  it('adds date query parameter', () => {
    const route = resolveRoute('sessions', 'list')!;
    const options: InspectOptions = { date: '2026-04-15' };
    const url = buildRequestUrl(route, baseUrl, options);
    expect(url).toContain('date=2026-04-15');
  });

  it('adds search query parameter', () => {
    const route = resolveRoute('sites', 'search')!;
    const options: InspectOptions = { query: 'Roxy Wellington' };
    const url = buildRequestUrl(route, baseUrl, options);
    expect(url).toContain('q=Roxy');
  });

  it('adds limit parameter', () => {
    const route = resolveRoute('films', 'list')!;
    const options: InspectOptions = { limit: 10 };
    const url = buildRequestUrl(route, baseUrl, options);
    expect(url).toContain('limit=10');
  });

  it('combines multiple query parameters', () => {
    const route = resolveRoute('sessions', 'list')!;
    const options: InspectOptions = { site: 'abc', date: '2026-04-15', limit: 5 };
    const url = buildRequestUrl(route, baseUrl, options);
    expect(url).toContain('siteId=abc');
    expect(url).toContain('date=2026-04-15');
    expect(url).toContain('limit=5');
  });

  it('encodes special characters in ID', () => {
    const route = resolveRoute('sites', 'get')!;
    const url = buildRequestUrl(route, baseUrl, {}, 'site with spaces');
    expect(url).toContain('site%20with%20spaces');
  });

  it('throws when a :id route is called without an id', () => {
    // Regression for cr-023: previously the literal ":id" was left in the
    // URL, so the request silently hit /ocapi/v1/films/:id and came back
    // as an opaque 404. Fail at build time instead.
    const route = resolveRoute('films', 'get')!;
    expect(() => buildRequestUrl(route, baseUrl, {})).toThrow(/requires an id/);
  });
});

describe('constants', () => {
  it('exports valid resources', () => {
    expect(VALID_RESOURCES).toContain('sessions');
    expect(VALID_RESOURCES).toContain('sites');
    expect(VALID_RESOURCES).toContain('films');
    expect(VALID_RESOURCES).toContain('orders');
    expect(VALID_RESOURCES).toContain('loyalty');
  });

  it('exports valid actions', () => {
    expect(VALID_ACTIONS).toContain('list');
    expect(VALID_ACTIONS).toContain('get');
    expect(VALID_ACTIONS).toContain('search');
  });
});
