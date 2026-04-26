import React from 'react';
import { tokens } from '../../tokens';
import { TIER_COLORS, TIER_BACKGROUNDS } from './types';
import type { LoyaltyBadgeProps } from './types';

/**
 * Compact loyalty status badge — tier colour + tier name + points balance.
 * Use in nav bars, checkout summaries, or anywhere space is tight.
 *
 * @example
 * ```tsx
 * <LoyaltyBadge member={{ tier: { name: 'Gold', ... }, points: 2840 }} />
 * <LoyaltyBadge member={member} compact />
 * ```
 */
export function LoyaltyBadge({ member, compact = false }: LoyaltyBadgeProps) {
  const tierName = member.tier.name;
  const color = TIER_COLORS[tierName];
  const bg = TIER_BACKGROUNDS[tierName];

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          backgroundColor: bg,
          border: `1px solid ${color}40`,
          borderRadius: tokens.radii.full,
          padding: '2px 8px',
        }}
        aria-label={`${tierName} member, ${member.points.toLocaleString('en-NZ')} points`}
        role="status"
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: tokens.radii.full,
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: tokens.typography.sizes.xs,
            fontWeight: tokens.typography.weights.semibold,
            color,
            lineHeight: 1,
          }}
        >
          {tierName}
        </span>
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacing.sm,
        backgroundColor: bg,
        border: `1px solid ${color}40`,
        borderRadius: tokens.radii.lg,
        padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
      }}
      role="status"
      aria-label={`${tierName} loyalty member with ${member.points.toLocaleString('en-NZ')} points`}
    >
      {/* Tier icon */}
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: tokens.radii.full,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: tokens.typography.sizes.md,
          boxShadow: `0 0 8px ${color}30`,
        }}
      >
        {tierIcon(tierName)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span
          style={{
            fontSize: tokens.typography.sizes.sm,
            fontWeight: tokens.typography.weights.bold,
            color,
            lineHeight: tokens.typography.lineHeights.tight,
          }}
        >
          {tierName}
        </span>
        <span
          style={{
            fontSize: tokens.typography.sizes.xs,
            color: tokens.colors.textMuted,
            lineHeight: tokens.typography.lineHeights.tight,
          }}
        >
          {member.points.toLocaleString('en-NZ')} pts
        </span>
      </div>
    </div>
  );
}

function tierIcon(tier: string): string {
  switch (tier) {
    case 'Platinum': return '★';
    case 'Gold':     return '◆';
    case 'Silver':   return '◈';
    default:         return '◉';
  }
}
