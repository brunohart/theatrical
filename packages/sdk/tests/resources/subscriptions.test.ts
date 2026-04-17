import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionsResource } from '../../src/resources/subscriptions';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type {
  MemberSubscription,
  SubscriptionPlan,
  SubscriptionBenefit,
  SubscriptionUsage,
} from '../../src/types/subscription';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: SubscriptionsResource;
  mockGet: ReturnType<typeof vi.fn>;
  mockPost: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const http = { get: mockGet, post: mockPost } as unknown as TheatricalHTTPClient;
  return { resource: new SubscriptionsResource(http), mockGet, mockPost };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** Hoyts Cinema Pass — monthly 3-film plan used widely across NZ/AU sites. */
function createMockBenefit(overrides: Partial<SubscriptionBenefit> = {}): SubscriptionBenefit {
  return {
    id: 'benefit_companion_pass',
    category: 'companion',
    name: 'Companion Pass',
    description: 'Bring a friend for free once per month',
    usesPerPeriod: 1,
    active: true,
    ...overrides,
  };
}

function createMockPlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
  return {
    id: 'plan_hoyts_cinema_pass',
    name: 'Hoyts Cinema Pass',
    description: 'Watch up to 3 films per month at any Hoyts NZ cinema',
    price: 29.99,
    currency: 'NZD',
    interval: 'monthly',
    bookingsIncluded: 3,
    available: true,
    benefits: [
      createMockBenefit(),
      {
        id: 'benefit_fb_discount',
        category: 'concession',
        name: 'F&B Discount',
        description: '15% off food and beverage at the candy bar',
        active: true,
      },
    ],
    ...overrides,
  };
}

/** Active subscription for Aroha Tane — Hoyts Sylvia Park patron. */
function createMockSubscription(overrides: Partial<MemberSubscription> = {}): MemberSubscription {
  return {
    id: 'sub_aroha_tane_009',
    planId: 'plan_hoyts_cinema_pass',
    memberId: 'mem_aroha_tane_009',
    status: 'active',
    startDate: '2026-01-15',
    renewalDate: '2026-05-15',
    autoRenew: true,
    ...overrides,
  };
}

/** Usage for current period (April 2026) — 2 of 3 bookings used. */
function createMockUsage(overrides: Partial<SubscriptionUsage> = {}): SubscriptionUsage {
  return {
    subscriptionId: 'sub_aroha_tane_009',
    memberId: 'mem_aroha_tane_009',
    periodStart: '2026-04-15',
    periodEnd: '2026-05-14',
    bookingsUsed: 2,
    bookingsIncluded: 3,
    bookingsRemaining: 1,
    benefitUsage: { benefit_companion_pass: 0, benefit_fb_discount: 3 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionsResource', () => {
  let resource: SubscriptionsResource;
  let mockGet: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet, mockPost } = createMockHTTPClient());
  });

  // ── listPlans ─────────────────────────────────────────────────────────────

  describe('listPlans', () => {
    it('fetches plans from the correct endpoint', async () => {
      const plans = [createMockPlan()];
      mockGet.mockResolvedValue(plans);

      const result = await resource.listPlans();

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/subscriptions/plans', { params: {} });
      expect(result).toEqual(plans);
    });

    it('passes siteId as a query param when provided', async () => {
      mockGet.mockResolvedValue([]);

      await resource.listPlans('site_hoyts_sylvia_park');

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/subscriptions/plans', {
        params: { siteId: 'site_hoyts_sylvia_park' },
      });
    });

    it('passes includeUnavailable flag when set', async () => {
      mockGet.mockResolvedValue([]);

      await resource.listPlans(undefined, true);

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/subscriptions/plans', {
        params: { includeUnavailable: true },
      });
    });
  });

  // ── getMemberSubscription ─────────────────────────────────────────────────

  describe('getMemberSubscription', () => {
    it('fetches subscription for the given member', async () => {
      const sub = createMockSubscription();
      mockGet.mockResolvedValue(sub);

      const result = await resource.getMemberSubscription('mem_aroha_tane_009');

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009',
      );
      expect(result.status).toBe('active');
      expect(result.autoRenew).toBe(true);
    });
  });

  // ── getUsage ──────────────────────────────────────────────────────────────

  describe('getUsage', () => {
    it('returns usage stats for the current billing period', async () => {
      const usage = createMockUsage();
      mockGet.mockResolvedValue(usage);

      const result = await resource.getUsage('mem_aroha_tane_009');

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/usage',
      );
      expect(result.bookingsUsed).toBe(2);
      expect(result.bookingsRemaining).toBe(1);
    });

    it('handles unlimited plan — bookingsIncluded and bookingsRemaining are null', async () => {
      const usage = createMockUsage({ bookingsIncluded: null, bookingsRemaining: null });
      mockGet.mockResolvedValue(usage);

      const result = await resource.getUsage('mem_aroha_tane_009');

      expect(result.bookingsIncluded).toBeNull();
      expect(result.bookingsRemaining).toBeNull();
    });
  });

  // ── checkBenefitEligibility ───────────────────────────────────────────────

  describe('checkBenefitEligibility', () => {
    it('returns eligible=true when benefit has remaining uses', async () => {
      const eligibility = { eligible: true, usesRemaining: 1 };
      mockGet.mockResolvedValue(eligibility);

      const result = await resource.checkBenefitEligibility(
        'mem_aroha_tane_009',
        'benefit_companion_pass',
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/benefits/benefit_companion_pass/eligibility',
      );
      expect(result.eligible).toBe(true);
      expect(result.usesRemaining).toBe(1);
    });

    it('returns eligible=false with reason when benefit is exhausted', async () => {
      const eligibility = {
        eligible: false,
        usesRemaining: 0,
        reason: 'Companion pass already used this period',
      };
      mockGet.mockResolvedValue(eligibility);

      const result = await resource.checkBenefitEligibility(
        'mem_aroha_tane_009',
        'benefit_companion_pass',
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/already used/i);
    });
  });

  // ── suspend ───────────────────────────────────────────────────────────────

  describe('suspend', () => {
    it('posts to the suspend endpoint and returns updated subscription', async () => {
      const paused = createMockSubscription({ status: 'paused' });
      mockPost.mockResolvedValue(paused);

      const result = await resource.suspend('mem_aroha_tane_009', {
        resumeDate: '2026-05-01',
        reason: 'Overseas travel',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/suspend',
        { body: { resumeDate: '2026-05-01', reason: 'Overseas travel' } },
      );
      expect(result.status).toBe('paused');
    });

    it('sends empty body when no input provided', async () => {
      mockPost.mockResolvedValue(createMockSubscription({ status: 'paused' }));

      await resource.suspend('mem_aroha_tane_009');

      expect(mockPost).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/suspend',
        { body: {} },
      );
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('posts to the cancel endpoint with end-of-period flag by default', async () => {
      const cancelled = createMockSubscription({
        status: 'cancelled',
        cancelledAt: '2026-04-17',
        renewalDate: null,
      });
      mockPost.mockResolvedValue(cancelled);

      const result = await resource.cancel('mem_aroha_tane_009', { reason: 'Too expensive' });

      expect(mockPost).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/cancel',
        { body: { reason: 'Too expensive' } },
      );
      expect(result.status).toBe('cancelled');
      expect(result.renewalDate).toBeNull();
    });

    it('passes immediate=true for instant cancellation', async () => {
      mockPost.mockResolvedValue(createMockSubscription({ status: 'cancelled', renewalDate: null }));

      await resource.cancel('mem_aroha_tane_009', { immediate: true });

      expect(mockPost).toHaveBeenCalledWith(
        '/ocapi/v1/subscriptions/members/mem_aroha_tane_009/cancel',
        { body: { immediate: true } },
      );
    });
  });
});
