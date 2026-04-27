export type LoyaltyTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export const TIER_LEVELS: Record<LoyaltyTierName, number> = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
};

/** Cinema-palette colours for each loyalty tier. */
export const TIER_COLORS: Record<LoyaltyTierName, string> = {
  Bronze: '#cd7f32',
  Silver: '#b0b7c3',
  Gold: '#c9a227',
  Platinum: '#e8e4f0',
};

export const TIER_BACKGROUNDS: Record<LoyaltyTierName, string> = {
  Bronze: 'rgba(205,127,50,0.12)',
  Silver: 'rgba(176,183,195,0.12)',
  Gold: 'rgba(201,162,39,0.12)',
  Platinum: 'rgba(232,228,240,0.12)',
};

/** Loyalty tier shape used by React components. */
export interface LoyaltyTierData {
  name: LoyaltyTierName;
  level: number;
  benefits: string[];
  pointsThreshold: number;
}

import type { LoyaltyMember } from '@theatrical/sdk';

/** Loyalty member shape used by React components. Derived from SDK LoyaltyMember to prevent type drift. */
export type LoyaltyMemberData = Pick<
  LoyaltyMember,
  'id' | 'email' | 'firstName' | 'lastName' | 'tier' | 'points' | 'lifetimePoints' | 'memberSince' | 'active'
>;

export interface LoyaltyBadgeProps {
  member: Pick<LoyaltyMemberData, 'tier' | 'points'>;
  /** Compact inline display; defaults to false (pill layout). */
  compact?: boolean;
}

export interface MemberCardProps {
  member: LoyaltyMemberData;
  /** Show the full benefits list; defaults to true. */
  showBenefits?: boolean;
  /** Show the tier progression bar; defaults to true. */
  showProgress?: boolean;
}

export interface TierIndicatorProps {
  currentTier: LoyaltyTierName;
  /** Render all four tiers as a progress track; defaults to true. */
  showTrack?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface PointsDisplayProps {
  points: number;
  /** Animate count-up on mount; defaults to true. */
  animate?: boolean;
  /** Label shown below the number; defaults to 'points'. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
