import React from 'react';
import { tokens } from '../../tokens';
import { TIER_COLORS, TIER_BACKGROUNDS, TIER_LEVELS } from './types';
import { TierIndicator } from './TierIndicator';
import { PointsDisplay } from './PointsDisplay';
import type { MemberCardProps, LoyaltyTierName } from './types';

const TIER_THRESHOLDS: Record<LoyaltyTierName, number> = {
  Bronze: 0,
  Silver: 1000,
  Gold: 5000,
  Platinum: 15000,
};

const NEXT_TIER: Partial<Record<LoyaltyTierName, LoyaltyTierName>> = {
  Bronze: 'Silver',
  Silver: 'Gold',
  Gold: 'Platinum',
};

/**
 * Full loyalty member card. Shows member identity, tier status, points balance,
 * tier progression bar, and benefits list. Premium cinema aesthetic — this card
 * should feel aspirational.
 *
 * @example
 * ```tsx
 * <MemberCard member={loyaltyMember} showBenefits showProgress />
 * ```
 */
export function MemberCard({ member, showBenefits = true, showProgress = true }: MemberCardProps) {
  const tierName = member.tier.name as LoyaltyTierName;
  const tierColor = TIER_COLORS[tierName];
  const tierBg = TIER_BACKGROUNDS[tierName];
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

  const maskedId = `XXXX-XXXX-${member.id.replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

  const nextTier = NEXT_TIER[tierName];
  const currentThreshold = TIER_THRESHOLDS[tierName];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const progressToNext = nextThreshold
    ? Math.min((member.lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold), 1)
    : 1;
  const pointsToNext = nextThreshold ? Math.max(nextThreshold - member.lifetimePoints, 0) : 0;

  const memberSinceYear = member.memberSince ? new Date(member.memberSince).getFullYear() : null;

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tierColor}30`,
        overflow: 'hidden',
        boxShadow: tokens.shadows.md,
      }}
      aria-label={`Loyalty member card for ${member.firstName} ${member.lastName}`}
    >
      {/* Header band */}
      <div
        style={{
          background: `linear-gradient(135deg, ${tierBg} 0%, ${tokens.colors.surface} 100%)`,
          borderBottom: `1px solid ${tierColor}20`,
          padding: `${tokens.spacing.lg}px`,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.md,
        }}
      >
        {/* Avatar */}
        <div
          aria-hidden="true"
          style={{
            width: 52,
            height: 52,
            borderRadius: tokens.radii.full,
            backgroundColor: `${tierColor}20`,
            border: `2px solid ${tierColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.bold,
            color: tierColor,
            boxShadow: `0 0 12px ${tierColor}30`,
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: tokens.typography.sizes.lg,
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.text,
              lineHeight: tokens.typography.lineHeights.tight,
            }}
          >
            {member.firstName} {member.lastName}
          </p>
          <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.textMuted, marginTop: 2 }}>
            {member.email}
          </p>
          <p
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: tokens.colors.textDisabled,
              marginTop: 3,
              letterSpacing: '0.15em',
              fontVariantNumeric: 'tabular-nums',
            }}
            aria-label={`Member ID ending in ${member.id.slice(-4)}`}
          >
            {maskedId}
          </p>
          {memberSinceYear && (
            <p style={{ fontSize: tokens.typography.sizes.xs, color: tokens.colors.textDisabled, marginTop: 2 }}>
              Member since {memberSinceYear}
            </p>
          )}
        </div>

        {/* Tier badge */}
        <div
          style={{
            flexShrink: 0,
            backgroundColor: `${tierColor}15`,
            border: `1px solid ${tierColor}50`,
            borderRadius: tokens.radii.md,
            padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: tokens.colors.textDisabled,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
              marginBottom: 3,
            }}
          >
            Tier
          </p>
          <p
            style={{
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.bold,
              color: tierColor,
              lineHeight: 1,
            }}
          >
            {tierName}
          </p>
        </div>
      </div>

      {/* Points section */}
      <div
        style={{
          padding: `${tokens.spacing.lg}px`,
          display: 'flex',
          justifyContent: 'center',
          borderBottom: `1px solid ${tokens.colors.border}`,
        }}
      >
        <PointsDisplay points={member.points} size="lg" label="points" />
      </div>

      {/* Tier track */}
      {showProgress && (
        <div
          style={{
            padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <TierIndicator currentTier={tierName} showTrack size="sm" />

          {nextTier && (
            <div style={{ marginTop: tokens.spacing.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Progress bar toward next tier */}
              <div style={{ flex: 1, marginRight: tokens.spacing.md }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: tokens.radii.full,
                    backgroundColor: tokens.colors.border,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(progressToNext * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress to ${nextTier}: ${Math.round(progressToNext * 100)}%`}
                    style={{
                      height: '100%',
                      width: `${progressToNext * 100}%`,
                      backgroundColor: TIER_COLORS[nextTier],
                      borderRadius: tokens.radii.full,
                      transition: `width ${tokens.transitions.slow}`,
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: tokens.typography.sizes.xs, color: tokens.colors.textMuted, whiteSpace: 'nowrap' }}>
                {pointsToNext.toLocaleString('en-NZ')} pts to {nextTier}
              </span>
            </div>
          )}

          {!nextTier && (
            <p
              style={{
                marginTop: tokens.spacing.xs,
                fontSize: tokens.typography.sizes.xs,
                color: tierColor,
                textAlign: 'center',
                fontWeight: tokens.typography.weights.medium,
              }}
            >
              Maximum tier achieved
            </p>
          )}
        </div>
      )}

      {/* Benefits */}
      {showBenefits && member.tier.benefits.length > 0 && (
        <div style={{ padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px ${tokens.spacing.lg}px` }}>
          <p
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: tokens.colors.textDisabled,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: tokens.spacing.sm,
            }}
          >
            {tierName} Benefits
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing.xs,
            }}
          >
            {member.tier.benefits.map((benefit: string, i: number) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: tokens.spacing.xs,
                  fontSize: tokens.typography.sizes.sm,
                  color: tokens.colors.textMuted,
                  lineHeight: tokens.typography.lineHeights.normal,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ color: tierColor, flexShrink: 0, lineHeight: tokens.typography.lineHeights.normal }}
                >
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
