import type { TheatricalHTTPClient } from '../http/client';
import type { MemberSubscription, SubscriptionPlan } from '../types/subscription';

/**
 * Subscriptions resource — plans and member subscriptions.
 */
export class SubscriptionsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>('/ocapi/v1/subscriptions/plans');
  }

  async getMemberSubscription(memberId: string): Promise<MemberSubscription> {
    return this.http.get<MemberSubscription>(`/ocapi/v1/subscriptions/members/${memberId}`);
  }
}
