export interface Subscription {
  id: string;
  planId: string;
  memberId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  renewalDate: string;
  bookingsUsed: number;
  bookingsRemaining?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'annual';
  bookingsIncluded?: number;
  benefits: string[];
}
