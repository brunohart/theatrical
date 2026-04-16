import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoyaltyResource } from '../../src/resources/loyalty';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type { LoyaltyMember, LoyaltyTier, PointsTransaction, RedemptionOption } from '../../src/types/loyalty';
import type { PaginatedResponse } from '../../src/types/pagination';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: LoyaltyResource;
  mockGet: ReturnType<typeof vi.fn>;
  mockPost: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const http = { get: mockGet, post: mockPost } as unknown as TheatricalHTTPClient;
  return { resource: new LoyaltyResource(http), mockGet, mockPost };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** Gold tier — Hoyts VIP level */
function createMockTier(overrides: Partial<LoyaltyTier> = {}): LoyaltyTier {
  return {
    id: 'tier_gold',
    name: 'Gold',
    level: 3,
    benefits: ['Priority booking', '1 free ticket per month', 'Concession discount 15%'],
    pointsThreshold: 5000,
    ...overrides,
  };
}

/**
 * Realistic loyalty member fixture — Hemi Walker, frequent Hoyts Sylvia Park
 * patron with Gold tier status.
 */
function createMockMember(overrides: Partial<LoyaltyMember> = {}): LoyaltyMember {
  return {
    id: 'mem_hemi_walker_012',
    email: 'hemi.walker@example.co.nz',
    firstName: 'Hemi',
    lastName: 'Walker',
    tier: createMockTier(),
    points: 2340,
    lifetimePoints: 8900,
    memberSince: '2022-03-15',
    active: true,
    lastActivityDate: '2026-04-10',
    ...overrides,
  };
}

/** Points earn transaction — purchase at Hoyts Sylvia Park. */
function createMockTransaction(overrides: Partial<PointsTransaction> = {}): PointsTransaction {
  return {
    id: 'txn_hoyts_sp_wildrobot_20260410',
    memberId: 'mem_hemi_walker_012',
    type: 'earn',
    points: 68,
    balanceAfter: 2340,
    description: 'Purchase at Hoyts Sylvia Park — The Wild Robot',
    createdAt: '2026-04-10T19:45:00+12:00',
    orderId: 'ord_hoyts_sp_wildrobot_20260410',
    siteId: 'site_hoyts_sylvia_park',
    ...overrides,
  };
}

/** Free ticket redemption option. */
function createMockRedemptionOption(overrides: Partial<RedemptionOption> = {}): RedemptionOption {
  return {
    id: 'redeem_free_adult_ticket',
    name: 'Free Adult Ticket',
    description: 'Redeem points for a free adult standard ticket at any Hoyts cinema.',
    pointsCost: 1500,
    category: 'ticket',
    available: true,
    ...overrides,
  };
}

function createMockTransactionPage(
  items: PointsTransaction[] = [createMockTransaction()],
  overrides: Partial<PaginatedResponse<PointsTransaction>> = {},
): PaginatedResponse<PointsTransaction> {
  return {
    data: items,
    total: items.length,
    hasMore: false,
    strategy: 'cursor',
    nextCursor: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Smoke test
// ---------------------------------------------------------------------------

describe('LoyaltyResource', () => {
  it('instantiates with an HTTP client', () => {
    const { resource } = createMockHTTPClient();
    expect(resource).toBeInstanceOf(LoyaltyResource);
  });
});

// ---------------------------------------------------------------------------
// getMember()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.getMember()', () => {
  let resource: LoyaltyResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('calls GET /ocapi/v1/loyalty/members/:id', async () => {
    const member = createMockMember();
    mockGet.mockResolvedValueOnce(member);

    const result = await resource.getMember('mem_hemi_walker_012');

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/loyalty/members/mem_hemi_walker_012');
    expect(result).toEqual(member);
  });

  it('returns the full member including tier and points', async () => {
    const member = createMockMember({ points: 2340 });
    mockGet.mockResolvedValueOnce(member);

    const result = await resource.getMember('mem_hemi_walker_012');
    expect(result.tier.name).toBe('Gold');
    expect(result.points).toBe(2340);
  });
});

// ---------------------------------------------------------------------------
// authenticate()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.authenticate()', () => {
  let resource: LoyaltyResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('calls POST /ocapi/v1/loyalty/authenticate with credentials', async () => {
    const member = createMockMember();
    mockPost.mockResolvedValueOnce(member);

    const result = await resource.authenticate('hemi.walker@example.co.nz', 'secret123');

    expect(mockPost).toHaveBeenCalledWith('/ocapi/v1/loyalty/authenticate', {
      body: { email: 'hemi.walker@example.co.nz', password: 'secret123' },
    });
    expect(result.id).toBe('mem_hemi_walker_012');
  });
});

// ---------------------------------------------------------------------------
// getPointsBalance()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.getPointsBalance()', () => {
  let resource: LoyaltyResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('calls GET /ocapi/v1/loyalty/members/:id/points', async () => {
    const balance = { points: 2340, lifetimePoints: 8900 };
    mockGet.mockResolvedValueOnce(balance);

    const result = await resource.getPointsBalance('mem_hemi_walker_012');

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/loyalty/members/mem_hemi_walker_012/points');
    expect(result.points).toBe(2340);
    expect(result.lifetimePoints).toBe(8900);
  });
});

// ---------------------------------------------------------------------------
// getHistory()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.getHistory()', () => {
  let resource: LoyaltyResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('calls GET /ocapi/v1/loyalty/members/:id/history without filter', async () => {
    const page = createMockTransactionPage();
    mockGet.mockResolvedValueOnce(page);

    const result = await resource.getHistory('mem_hemi_walker_012');

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/loyalty/members/mem_hemi_walker_012/history',
      { params: undefined },
    );
    expect(result.data).toHaveLength(1);
  });

  it('passes filter params to the HTTP client', async () => {
    const page = createMockTransactionPage();
    mockGet.mockResolvedValueOnce(page);

    await resource.getHistory('mem_hemi_walker_012', { type: 'earn', limit: 10 });

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/loyalty/members/mem_hemi_walker_012/history',
      { params: { type: 'earn', limit: 10 } },
    );
  });

  it('returns transactions with correct shape', async () => {
    const tx = createMockTransaction({ type: 'redeem', points: -1500, balanceAfter: 840 });
    const page = createMockTransactionPage([tx]);
    mockGet.mockResolvedValueOnce(page);

    const result = await resource.getHistory('mem_hemi_walker_012');
    expect(result.data[0].type).toBe('redeem');
    expect(result.data[0].points).toBe(-1500);
  });
});

// ---------------------------------------------------------------------------
// listRedemptionOptions()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.listRedemptionOptions()', () => {
  let resource: LoyaltyResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('calls GET /ocapi/v1/loyalty/members/:id/redemptions', async () => {
    const options = [createMockRedemptionOption()];
    mockGet.mockResolvedValueOnce(options);

    const result = await resource.listRedemptionOptions('mem_hemi_walker_012');

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/loyalty/members/mem_hemi_walker_012/redemptions',
    );
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('ticket');
  });
});

// ---------------------------------------------------------------------------
// redeemPoints()
// ---------------------------------------------------------------------------

describe('LoyaltyResource.redeemPoints()', () => {
  let resource: LoyaltyResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('calls POST /ocapi/v1/loyalty/members/:id/redeem with input', async () => {
    const tx = createMockTransaction({
      type: 'redeem',
      points: -1500,
      balanceAfter: 840,
      description: 'Free Adult Ticket — Hoyts Sylvia Park',
    });
    mockPost.mockResolvedValueOnce(tx);

    const result = await resource.redeemPoints('mem_hemi_walker_012', {
      optionId: 'redeem_free_adult_ticket',
      orderId: 'ord_hoyts_sp_20260417',
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/ocapi/v1/loyalty/members/mem_hemi_walker_012/redeem',
      { body: { optionId: 'redeem_free_adult_ticket', orderId: 'ord_hoyts_sp_20260417' } },
    );
    expect(result.type).toBe('redeem');
    expect(result.balanceAfter).toBe(840);
  });

  it('returns a transaction with negative points for a redemption', async () => {
    const tx = createMockTransaction({ type: 'redeem', points: -500, balanceAfter: 1840 });
    mockPost.mockResolvedValueOnce(tx);

    const result = await resource.redeemPoints('mem_hemi_walker_012', {
      optionId: 'redeem_concession_discount',
    });
    expect(result.points).toBeLessThan(0);
  });
});
