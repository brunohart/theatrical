import { describe, it, expect, afterEach } from 'vitest';
import { TheatricalClient } from '../src/client';
import { ValidationError } from '../src/errors';

afterEach(() => {
  TheatricalClient.resetGlobal();
});

describe('TheatricalClient', () => {
  describe('constructor', () => {
    it('instantiates with minimal config', () => {
      const client = new TheatricalClient({
        apiKey: 'test-key',
        environment: 'sandbox',
      });

      expect(client).toBeDefined();
      expect(client.sessions).toBeDefined();
      expect(client.sites).toBeDefined();
      expect(client.films).toBeDefined();
      expect(client.orders).toBeDefined();
      expect(client.loyalty).toBeDefined();
      expect(client.subscriptions).toBeDefined();
      expect(client.pricing).toBeDefined();
      expect(client.fnb).toBeDefined();
    });

    it('exposes all resource accessors as stable lazy references', () => {
      const client = new TheatricalClient({
        apiKey: 'test-key',
        environment: 'production',
      });

      // Each resource should be a stable reference (lazy singleton per instance)
      expect(client.sessions).toBe(client.sessions);
      expect(client.films).toBe(client.films);
      expect(client.sites).toBe(client.sites);
    });

    it('throws ValidationError for empty apiKey', () => {
      expect(() => new TheatricalClient({ apiKey: '' })).toThrow(ValidationError);
    });

    it('throws ValidationError for apiKey with special characters', () => {
      expect(() => new TheatricalClient({ apiKey: 'bad key!' })).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid environment', () => {
      expect(() =>
        new TheatricalClient({ apiKey: 'valid-key', environment: 'invalid' as any })
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for timeout exceeding 120000ms', () => {
      expect(() =>
        new TheatricalClient({ apiKey: 'valid-key', timeout: 200_000 })
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for negative timeout', () => {
      expect(() =>
        new TheatricalClient({ apiKey: 'valid-key', timeout: -1 })
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for maxRetries exceeding 10', () => {
      expect(() =>
        new TheatricalClient({ apiKey: 'valid-key', maxRetries: 50 })
      ).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid baseUrl', () => {
      expect(() =>
        new TheatricalClient({ apiKey: 'valid-key', baseUrl: 'not-a-url' })
      ).toThrow(ValidationError);
    });
  });

  describe('create()', () => {
    it('returns a TheatricalClient instance', () => {
      const client = TheatricalClient.create({ apiKey: 'valid-key' });
      expect(client).toBeInstanceOf(TheatricalClient);
    });

    it('throws ValidationError for invalid config', () => {
      expect(() => TheatricalClient.create({ apiKey: '' })).toThrow(ValidationError);
    });
  });

  describe('global() / setGlobal() / resetGlobal()', () => {
    it('throws before setGlobal is called', () => {
      expect(() => TheatricalClient.global()).toThrow(
        'No global TheatricalClient configured'
      );
    });

    it('returns the configured singleton after setGlobal', () => {
      TheatricalClient.setGlobal({ apiKey: 'global-key', environment: 'sandbox' });
      const client = TheatricalClient.global();
      expect(client).toBeInstanceOf(TheatricalClient);
    });

    it('returns the same instance on repeated global() calls', () => {
      TheatricalClient.setGlobal({ apiKey: 'global-key' });
      expect(TheatricalClient.global()).toBe(TheatricalClient.global());
    });

    it('replaces the singleton when setGlobal is called again', () => {
      TheatricalClient.setGlobal({ apiKey: 'first-key' });
      const first = TheatricalClient.global();

      TheatricalClient.setGlobal({ apiKey: 'second-key' });
      const second = TheatricalClient.global();

      expect(first).not.toBe(second);
    });

    it('clears the singleton after resetGlobal', () => {
      TheatricalClient.setGlobal({ apiKey: 'reset-key' });
      TheatricalClient.resetGlobal();
      expect(() => TheatricalClient.global()).toThrow();
    });

    it('throws ValidationError for invalid config in setGlobal', () => {
      expect(() => TheatricalClient.setGlobal({ apiKey: '' })).toThrow(ValidationError);
    });
  });
});
