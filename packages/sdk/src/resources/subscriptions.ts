import type { TheatricalHTTPClient } from '../http/client';
import type { Subscription, SubscriptionPlan } from '../types/subscription';

/**
 * Subscriptions resource — plans and member subscriptions.
 */
export class SubscriptionsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>('/ocapi/v1/subscriptions/plans');
  }

  async getMemberSubscription(memberId: string): Promise<Subscription> {
    return this.http.get<Subscription>(`/ocapi/v1/subscriptions/members/${memberId}`);
  }
}
