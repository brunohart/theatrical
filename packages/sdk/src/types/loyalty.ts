/** A loyalty program member */
export interface LoyaltyMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  memberSince: string;
  subscriptionId?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  benefits: string[];
  pointsThreshold: number;
}
