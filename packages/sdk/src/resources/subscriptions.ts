import type { TheatricalHTTPClient } from '../http/client';
import type {
  MemberSubscription,
  SubscriptionPlan,
  SubscriptionUsage,
  SuspendSubscriptionInput,
  CancelSubscriptionInput,
} from '../types/subscription';

/**
 * Subscriptions resource — cinema pass plans and member subscription lifecycle.
 *
 * Wraps the Vista OCAPI subscription endpoints, covering plan discovery,
 * member subscription state, usage tracking, benefit eligibility checks,
 * and administrative actions (suspend, cancel).
 */
export class SubscriptionsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * List all available subscription plans for a Vista site.
   *
   * Returns only plans that are available for new subscriptions unless
   * {@link includeUnavailable} is set to true (useful for admin UIs).
   *
   * @param siteId            - Vista site identifier to scope plans to
   * @param includeUnavailable - When true, include discontinued plans
   */
  async listPlans(siteId?: string, includeUnavailable?: boolean): Promise<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>('/ocapi/v1/subscriptions/plans', {
      params: {
        ...(siteId ? { siteId } : {}),
        ...(includeUnavailable ? { includeUnavailable: true } : {}),
      },
    });
  }

  /**
   * Retrieve the active (or most recent) subscription for a member.
   *
   * @param memberId - Vista loyalty member identifier
   */
  async getMemberSubscription(memberId: string): Promise<MemberSubscription> {
    return this.http.get<MemberSubscription>(`/ocapi/v1/subscriptions/members/${memberId}`);
  }

  /**
   * Get usage statistics for a member's subscription in the current billing period.
   *
   * Returns booking counts, remaining allowance, and per-benefit usage.
   * Use this before allowing a booking to check whether the member has
   * bookings remaining under their plan.
   *
   * @param memberId - Vista loyalty member identifier
   */
  async getUsage(memberId: string): Promise<SubscriptionUsage> {
    return this.http.get<SubscriptionUsage>(
      `/ocapi/v1/subscriptions/members/${memberId}/usage`,
    );
  }

  /**
   * Check whether a member is eligible to use a specific benefit.
   *
   * Returns true if the benefit is included in their plan, is currently active,
   * and the member has remaining uses for the current period.
   *
   * @param memberId  - Vista loyalty member identifier
   * @param benefitId - Benefit ID from the plan's benefits array
   */
  async checkBenefitEligibility(
    memberId: string,
    benefitId: string,
  ): Promise<{ eligible: boolean; usesRemaining: number | null; reason?: string }> {
    return this.http.get<{ eligible: boolean; usesRemaining: number | null; reason?: string }>(
      `/ocapi/v1/subscriptions/members/${memberId}/benefits/${benefitId}/eligibility`,
    );
  }

  /**
   * Suspend a member's subscription temporarily.
   *
   * The subscription status transitions to `paused`. Billing is paused for the
   * suspension period. If {@link SuspendSubscriptionInput.resumeDate} is
   * provided, the subscription will auto-resume on that date; otherwise it must
   * be manually resumed.
   *
   * @param memberId - Vista loyalty member identifier
   * @param input    - Optional resume date and reason
   */
  async suspend(
    memberId: string,
    input?: SuspendSubscriptionInput,
  ): Promise<MemberSubscription> {
    return this.http.post<MemberSubscription>(
      `/ocapi/v1/subscriptions/members/${memberId}/suspend`,
      { body: input ?? {} },
    );
  }

  /**
   * Cancel a member's subscription.
   *
   * By default cancels at the end of the current billing period. Set
   * {@link CancelSubscriptionInput.immediate} to `true` for an immediate
   * cancellation with no refund.
   *
   * @param memberId - Vista loyalty member identifier
   * @param input    - Whether to cancel immediately and optional reason
   */
  async cancel(
    memberId: string,
    input?: CancelSubscriptionInput,
  ): Promise<MemberSubscription> {
    return this.http.post<MemberSubscription>(
      `/ocapi/v1/subscriptions/members/${memberId}/cancel`,
      { body: input ?? {} },
    );
  }
}
