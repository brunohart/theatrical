/** Loyalty tier levels available in Vista cinema programs. */
export type LoyaltyTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/** A loyalty program tier with benefits and point thresholds. */
export interface LoyaltyTier {
  id: string;
  name: LoyaltyTierName;
  /** Numeric rank: 1 = Bronze … 4 = Platinum */
  level: number;
  benefits: string[];
  /** Lifetime points required to reach this tier. */
  pointsThreshold: number;
}

/** A loyalty program member. */
export interface LoyaltyMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: LoyaltyTier;
  /** Current redeemable points balance. */
  points: number;
  /** All-time accumulated points (never decremented). */
  lifetimePoints: number;
  memberSince: string;
  /** Linked subscription plan ID, if any. */
  subscriptionId?: string;
  /** ISO-8601 date of most recent transaction. */
  lastActivityDate?: string;
  /** Whether the member account is currently active. */
  active: boolean;
}

/** A single points earn or redeem transaction. */
export interface PointsTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  /** Signed net change — negative for redemptions and expirations. */
  balanceAfter: number;
  description: string;
  /** ISO-8601 datetime */
  createdAt: string;
  /** Order reference for earn/redeem transactions, if applicable. */
  orderId?: string;
  /** Cinema site reference, if applicable. */
  siteId?: string;
}

/** An option that members can redeem points for. */
export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  /** Points cost to redeem. */
  pointsCost: number;
  category: 'ticket' | 'concession' | 'upgrade' | 'merchandise';
  /** Whether the option is currently available. */
  available: boolean;
  /** ISO-8601 expiry date of the offer, if limited. */
  expiresAt?: string;
}

/** Input payload for redeeming points against an option. */
export interface RedeemPointsInput {
  optionId: string;
  /** Order to apply the redemption to, if applicable. */
  orderId?: string;
  /** Quantity of the option to redeem (default 1). */
  quantity?: number;
}

/** Filters for querying a member's transaction history. */
export interface PointsHistoryFilter {
  type?: PointsTransaction['type'];
  /** ISO-8601 start date (inclusive) */
  from?: string;
  /** ISO-8601 end date (inclusive) */
  to?: string;
  limit?: number;
  offset?: number;
}
