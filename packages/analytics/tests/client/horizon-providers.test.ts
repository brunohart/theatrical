import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorizonClient } from '../../src/horizon-client';
import type { AnalyticsProvider, TrackEvent, IdentifyEvent } from '../../src/providers/base';

function makeClient(...providers: AnalyticsProvider[]): HorizonClient {
  return new HorizonClient({
    baseUrl: 'https://horizon.vista.co',
    authMode: 'api-key',
    apiKey: 'key_test',
    tenantId: 'tenant_nz_pvt',
    providers,
  });
}

const sampleEvent: TrackEvent = {
  type: 'session_browsed',
  userId: 'mem_hemi_walker_5528',
  properties: { filmId: 'film_001', siteId: 'site_roxy_wellington', source: 'search' },
};

describe('HorizonClient provider fan-out', () => {
  describe('track()', () => {
    it('calls track on every registered provider', async () => {
      const providerA: AnalyticsProvider = { name: 'a', track: vi.fn().mockResolvedValue(undefined) };
      const providerB: AnalyticsProvider = { name: 'b', track: vi.fn().mockResolvedValue(undefined) };

      await makeClient(providerA, providerB).track(sampleEvent);

      expect(providerA.track).toHaveBeenCalledWith(sampleEvent);
      expect(providerB.track).toHaveBeenCalledWith(sampleEvent);
    });

    it('calls track even when no providers are registered', async () => {
      await expect(makeClient().track(sampleEvent)).resolves.toBeUndefined();
    });

    it('provider B still receives the event when provider A throws — allSettled semantics', async () => {
      const failing: AnalyticsProvider = {
        name: 'failing',
        track: vi.fn().mockRejectedValue(new Error('network error')),
      };
      const working: AnalyticsProvider = {
        name: 'working',
        track: vi.fn().mockResolvedValue(undefined),
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await makeClient(failing, working).track(sampleEvent);

      expect(working.track).toHaveBeenCalledWith(sampleEvent);
      const [warnMsg] = warnSpy.mock.calls[0];
      expect(warnMsg).toContain('"failing"');
      expect(warnMsg).toContain('session_browsed');
      warnSpy.mockRestore();
    });

    it('logs provider name and event type in the warning', async () => {
      const failingEvent: TrackEvent = { type: 'booking_completed', properties: { orderId: 'ord_001' } };
      const provider: AnalyticsProvider = {
        name: 'posthog',
        track: vi.fn().mockRejectedValue(new Error('timeout')),
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await makeClient(provider).track(failingEvent);

      // single message string contains both provider name and event type
      const [msg] = warnSpy.mock.calls[0];
      expect(msg).toContain('posthog');
      expect(msg).toContain('booking_completed');
      warnSpy.mockRestore();
    });

    it('multiple providers — partial failure still delivers to successful providers', async () => {
      const providers: AnalyticsProvider[] = [
        { name: 'segment', track: vi.fn().mockRejectedValue(new Error('403')) },
        { name: 'webhook', track: vi.fn().mockResolvedValue(undefined) },
        { name: 'movio', track: vi.fn().mockRejectedValue(new Error('timeout')) },
        { name: 'posthog', track: vi.fn().mockResolvedValue(undefined) },
      ];

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      await makeClient(...providers).track(sampleEvent);

      expect(providers[1].track).toHaveBeenCalledWith(sampleEvent);
      expect(providers[3].track).toHaveBeenCalledWith(sampleEvent);
    });
  });

  describe('identify()', () => {
    it('calls identify only on providers that implement it', async () => {
      const withIdentify: AnalyticsProvider = {
        name: 'segment',
        track: vi.fn(),
        identify: vi.fn().mockResolvedValue(undefined),
      };
      const withoutIdentify: AnalyticsProvider = {
        name: 'webhook',
        track: vi.fn(),
      };

      const user: IdentifyEvent = {
        userId: 'mem_hemi_walker_5528',
        traits: { tier: 'gold', pointsBalance: 4200 },
      };

      await makeClient(withIdentify, withoutIdentify).identify(user);

      expect(withIdentify.identify).toHaveBeenCalledWith(user);
    });

    it('provider identify failure does not throw', async () => {
      const failing: AnalyticsProvider = {
        name: 'segment',
        track: vi.fn(),
        identify: vi.fn().mockRejectedValue(new Error('quota exceeded')),
      };

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(makeClient(failing).identify({
        userId: 'u1',
        traits: {},
      })).resolves.toBeUndefined();
    });
  });

  describe('flush()', () => {
    it('calls flush only on providers that implement it', async () => {
      const buffered: AnalyticsProvider = {
        name: 'batched',
        track: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined),
      };
      const realtime: AnalyticsProvider = {
        name: 'webhook',
        track: vi.fn(),
      };

      await makeClient(buffered, realtime).flush();

      expect(buffered.flush).toHaveBeenCalled();
    });

    it('flush with no providers resolves cleanly', async () => {
      await expect(makeClient().flush()).resolves.toBeUndefined();
    });
  });
});
