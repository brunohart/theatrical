import React from 'react';
import { tokens } from '../../tokens';
import { TIER_COLORS, TIER_LEVELS } from './types';
import type { TierIndicatorProps, LoyaltyTierName } from './types';

const ALL_TIERS: LoyaltyTierName[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const SIZE_MAP = {
  sm: { dot: 10, font: tokens.typography.sizes.xs, gap: tokens.spacing.xs },
  md: { dot: 14, font: tokens.typography.sizes.sm, gap: tokens.spacing.sm },
  lg: { dot: 18, font: tokens.typography.sizes.md, gap: tokens.spacing.md },
};

/**
 * Visual tier progression track showing all four loyalty tiers.
 * Highlights the current tier with its signature colour.
 *
 * @example
 * ```tsx
 * <TierIndicator currentTier="Gold" showTrack size="md" />
 * ```
 */
export function TierIndicator({ currentTier, showTrack = true, size = 'md' }: TierIndicatorProps) {
  const { dot, font, gap } = SIZE_MAP[size];
  const currentLevel = TIER_LEVELS[currentTier];

  if (!showTrack) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: font,
          fontWeight: tokens.typography.weights.semibold,
          color: TIER_COLORS[currentTier],
        }}
        aria-label={`Loyalty tier: ${currentTier}`}
      >
        <span
          style={{
            width: dot,
            height: dot,
            borderRadius: tokens.radii.full,
            backgroundColor: TIER_COLORS[currentTier],
            display: 'inline-block',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {currentTier}
      </span>
    );
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap, width: '100%' }}
      role="img"
      aria-label={`Loyalty tier: ${currentTier}, level ${currentLevel} of 4`}
    >
      {ALL_TIERS.map((tier, idx) => {
        const reached = TIER_LEVELS[tier] <= currentLevel;
        const isCurrent = tier === currentTier;

        return (
          <React.Fragment key={tier}>
            {/* Connector line before (except first) */}
            {idx > 0 && (
              <div
                aria-hidden="true"
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: reached ? TIER_COLORS[tier] : tokens.colors.border,
                  transition: `background-color ${tokens.transitions.slow}`,
                }}
              />
            )}

            {/* Tier node */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: isCurrent ? dot * 1.4 : dot,
                  height: isCurrent ? dot * 1.4 : dot,
                  borderRadius: tokens.radii.full,
                  backgroundColor: reached ? TIER_COLORS[tier] : tokens.colors.surfaceRaised,
                  border: `2px solid ${reached ? TIER_COLORS[tier] : tokens.colors.border}`,
                  boxShadow: isCurrent ? `0 0 8px ${TIER_COLORS[tier]}60` : 'none',
                  transition: `all ${tokens.transitions.normal}`,
                }}
              />
              <span
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  color: reached ? TIER_COLORS[tier] : tokens.colors.textDisabled,
                  fontWeight: isCurrent ? tokens.typography.weights.semibold : tokens.typography.weights.regular,
                  whiteSpace: 'nowrap',
                }}
              >
                {tier}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
