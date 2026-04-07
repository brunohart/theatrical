import type { TheatricalHTTPClient } from '../http/client';
import type { LoyaltyMember } from '../types/loyalty';

/**
 * Loyalty resource — member management, points, tiers.
 */
export class LoyaltyResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async getMember(memberId: string): Promise<LoyaltyMember> {
    return this.http.get<LoyaltyMember>(`/ocapi/v1/loyalty/members/${memberId}`);
  }

  async authenticate(email: string, password: string): Promise<LoyaltyMember> {
    return this.http.post<LoyaltyMember>('/ocapi/v1/loyalty/authenticate', {
      body: { email, password },
    });
  }
}
