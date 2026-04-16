import type { TheatricalHTTPClient } from '../http/client';
import type {
  LoyaltyMember,
  PointsTransaction,
  RedemptionOption,
  RedeemPointsInput,
  PointsHistoryFilter,
} from '../types/loyalty';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Loyalty resource — member management, points, tiers.
 *
 * Wraps the Vista OCAPI loyalty endpoints for full member lifecycle management:
 * authentication, balance queries, transaction history, and points redemption.
 */
export class LoyaltyResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * Fetch a loyalty member by their unique ID.
   *
   * @param memberId - Vista loyalty member identifier
   */
  async getMember(memberId: string): Promise<LoyaltyMember> {
    return this.http.get<LoyaltyMember>(`/ocapi/v1/loyalty/members/${memberId}`);
  }

  /**
   * Authenticate a member using their email address and password (cookie-based
   * session). Returns the authenticated member record on success.
   *
   * @param email    - Member's registered email
   * @param password - Account password (transmitted over TLS)
   */
  async authenticate(email: string, password: string): Promise<LoyaltyMember> {
    return this.http.post<LoyaltyMember>('/ocapi/v1/loyalty/authenticate', {
      body: { email, password },
    });
  }

  /**
   * Return the current redeemable points balance for a member.
   *
   * @param memberId - Vista loyalty member identifier
   */
  async getPointsBalance(memberId: string): Promise<{ points: number; lifetimePoints: number }> {
    return this.http.get<{ points: number; lifetimePoints: number }>(
      `/ocapi/v1/loyalty/members/${memberId}/points`,
    );
  }

  /**
   * Retrieve a paginated transaction history for a member.
   *
   * @param memberId - Vista loyalty member identifier
   * @param filter   - Optional date range, type, and pagination filters
   */
  async getHistory(
    memberId: string,
    filter?: PointsHistoryFilter,
  ): Promise<PaginatedResponse<PointsTransaction>> {
    return this.http.get<PaginatedResponse<PointsTransaction>>(
      `/ocapi/v1/loyalty/members/${memberId}/history`,
      { params: filter as Record<string, string | number | boolean | undefined> | undefined },
    );
  }

  /**
   * List available redemption options for the loyalty program.
   * Options are filtered to those the member is eligible for based on their
   * tier and current points balance.
   *
   * @param memberId - Vista loyalty member identifier
   */
  async listRedemptionOptions(memberId: string): Promise<RedemptionOption[]> {
    return this.http.get<RedemptionOption[]>(
      `/ocapi/v1/loyalty/members/${memberId}/redemptions`,
    );
  }

  /**
   * Redeem points against a catalog option for a member.
   * Deducts points from the member's balance and applies the benefit.
   *
   * @param memberId - Vista loyalty member identifier
   * @param input    - Redemption option, optional order linkage, and quantity
   */
  async redeemPoints(memberId: string, input: RedeemPointsInput): Promise<PointsTransaction> {
    return this.http.post<PointsTransaction>(
      `/ocapi/v1/loyalty/members/${memberId}/redeem`,
      { body: input },
    );
  }
}
