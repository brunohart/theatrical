import { describe, it, expect } from 'vitest';
import { apiPath } from '../../src/http/path';
import { ValidationError } from '../../src/errors';
import { TheatricalHTTPClient } from '../../src/http/client';
import { OrdersResource } from '../../src/resources/orders';
import { LoyaltyResource } from '../../src/resources/loyalty';
import type { TokenManager } from '../../src/auth/token-manager';

describe('apiPath', () => {
  it('leaves ordinary IDs untouched', () => {
    expect(apiPath`/ocapi/v1/orders/${'ord_evt_qst_wildrobot_20260412'}/confirm`).toBe(
      '/ocapi/v1/orders/ord_evt_qst_wildrobot_20260412/confirm',
    );
  });

  it('encodes separators so an ID stays a single path segment', () => {
    expect(apiPath`/ocapi/v1/orders/${'abc/refund#'}/confirm`).toBe('/ocapi/v1/orders/abc%2Frefund%23/confirm');
    expect(apiPath`/ocapi/v1/orders/${'abc?force=true'}/cancel`).toBe('/ocapi/v1/orders/abc%3Fforce%3Dtrue/cancel');
  });

  it('rejects empty and dot segments, which the URL parser would resolve', () => {
    for (const segment of ['', '.', '..']) {
      expect(() => apiPath`/ocapi/v1/films/${segment}`).toThrow(ValidationError);
    }
  });
});

describe('resource IDs reach the wire as one segment', () => {
  function capture() {
    const urls: string[] = [];
    const http = new TheatricalHTTPClient({
      baseUrl: 'https://api.vista.co',
      timeout: 1000,
      maxRetries: 0,
      debug: false,
      tokenManager: { getToken: async () => 'operator-token' } as unknown as TokenManager,
      onRequest: [
        (config) => {
          urls.push(config.url);
          throw new Error('captured');
        },
      ],
    });
    return { http, urls };
  }

  it('orders.confirm() cannot be redirected to the refund endpoint', async () => {
    const { http, urls } = capture();
    await new OrdersResource(http).confirm('abc/refund#').catch(() => {});
    expect(urls).toEqual(['https://api.vista.co/ocapi/v1/orders/abc%2Frefund%23/confirm']);
  });

  it('loyalty.getMember() cannot traverse to another member', async () => {
    const { http, urls } = capture();
    await new LoyaltyResource(http).getMember('mem_attacker/../mem_victim').catch(() => {});
    expect(urls).toEqual(['https://api.vista.co/ocapi/v1/loyalty/members/mem_attacker%2F..%2Fmem_victim']);
  });

  it('rejects a bare ".." before any request is sent', async () => {
    const { http, urls } = capture();
    await expect(new OrdersResource(http).get('..')).rejects.toBeInstanceOf(ValidationError);
    expect(urls).toEqual([]);
  });
});
