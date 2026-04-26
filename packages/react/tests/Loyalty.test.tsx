import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoyaltyBadge } from '../src/components/Loyalty/LoyaltyBadge';
import { MemberCard } from '../src/components/Loyalty/MemberCard';
import { TierIndicator } from '../src/components/Loyalty/TierIndicator';
import { PointsDisplay } from '../src/components/Loyalty/PointsDisplay';
import type { LoyaltyMemberData } from '../src/components/Loyalty/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const bronzeMember: LoyaltyMemberData = {
  id: 'mem-001',
  email: 'aroha.ngata@example.co.nz',
  firstName: 'Aroha',
  lastName: 'Ngata',
  tier: {
    name: 'Bronze',
    level: 1,
    benefits: ['Tuesday discount', 'Birthday free ticket'],
    pointsThreshold: 0,
  },
  points: 320,
  lifetimePoints: 320,
  memberSince: '2024-08-01',
  active: true,
};

const goldMember: LoyaltyMemberData = {
  id: 'mem-002',
  email: 'tama.iti@example.co.nz',
  firstName: 'Tama',
  lastName: 'Iti',
  tier: {
    name: 'Gold',
    level: 3,
    benefits: ['Priority booking', '10% off concessions', 'Monthly double-points day'],
    pointsThreshold: 5000,
  },
  points: 7420,
  lifetimePoints: 9840,
  memberSince: '2022-03-15',
  active: true,
};

const platinumMember: LoyaltyMemberData = {
  id: 'mem-003',
  email: 'hemi.walker@example.co.nz',
  firstName: 'Hemi',
  lastName: 'Walker',
  tier: {
    name: 'Platinum',
    level: 4,
    benefits: [
      'Unlimited bring-a-friend sessions',
      'Private screening access',
      'Director Q&A invitations',
      'Complimentary premium seating upgrades',
    ],
    pointsThreshold: 15000,
  },
  points: 24350,
  lifetimePoints: 38900,
  memberSince: '2020-01-10',
  active: true,
};

// ── LoyaltyBadge ─────────────────────────────────────────────────────────────

describe('LoyaltyBadge', () => {
  it('renders tier name and points for default (non-compact) layout', () => {
    render(<LoyaltyBadge member={{ tier: goldMember.tier, points: goldMember.points }} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', expect.stringContaining('Gold'));
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', expect.stringContaining('7,420'));
  });

  it('renders compact variant with tier name', () => {
    render(<LoyaltyBadge member={{ tier: bronzeMember.tier, points: bronzeMember.points }} compact />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Bronze');
  });

  it('renders all four tiers without errors', () => {
    const tiers = [bronzeMember, goldMember, platinumMember, {
      ...bronzeMember,
      tier: { name: 'Silver' as const, level: 2, benefits: [], pointsThreshold: 1000 },
      points: 1500,
    }];
    tiers.forEach(({ tier, points }) => {
      const { unmount } = render(<LoyaltyBadge member={{ tier, points }} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      unmount();
    });
  });

  it('formats points with locale separators', () => {
    render(<LoyaltyBadge member={{ tier: platinumMember.tier, points: platinumMember.points }} />);
    // 24350 → "24,350 pts" in en-NZ
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', expect.stringContaining('24,350'));
  });
});

// ── TierIndicator ─────────────────────────────────────────────────────────────

describe('TierIndicator', () => {
  it('renders with accessible label for current tier', () => {
    render(<TierIndicator currentTier="Gold" />);
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('aria-label', expect.stringContaining('Gold'));
    expect(el).toHaveAttribute('aria-label', expect.stringContaining('level 3'));
  });

  it('shows all four tier labels in track mode', () => {
    render(<TierIndicator currentTier="Silver" showTrack />);
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('renders single tier without track', () => {
    render(<TierIndicator currentTier="Platinum" showTrack={false} />);
    expect(screen.getByLabelText('Loyalty tier: Platinum')).toBeInTheDocument();
    // No tier track — only current tier name shown
    expect(screen.queryByText('Bronze')).not.toBeInTheDocument();
  });

  it('renders at all three sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<TierIndicator currentTier="Gold" size={size} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
      unmount();
    });
  });
});

// ── PointsDisplay ─────────────────────────────────────────────────────────────

describe('PointsDisplay', () => {
  beforeEach(() => vi.useFakeTimers());

  it('renders final points immediately when animate=false', () => {
    render(<PointsDisplay points={2840} animate={false} />);
    expect(screen.getByLabelText('2840 points')).toBeInTheDocument();
  });

  it('uses custom label', () => {
    render(<PointsDisplay points={500} animate={false} label="points available" />);
    expect(screen.getByLabelText('500 points available')).toBeInTheDocument();
    expect(screen.getByText('points available')).toBeInTheDocument();
  });

  it('renders zero points without error', () => {
    render(<PointsDisplay points={0} animate={false} />);
    expect(screen.getByLabelText('0 points')).toBeInTheDocument();
  });

  it('has aria-live region for accessibility', () => {
    const { container } = render(<PointsDisplay points={1000} animate={false} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
  });

  it('renders at all three sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<PointsDisplay points={100} animate={false} size={size} />);
      expect(screen.getByLabelText('100 points')).toBeInTheDocument();
      unmount();
    });
  });
});

// ── MemberCard ────────────────────────────────────────────────────────────────

describe('MemberCard', () => {
  it('renders member name and email', () => {
    render(<MemberCard member={goldMember} />);
    expect(screen.getByText('Tama Iti')).toBeInTheDocument();
    expect(screen.getByText('tama.iti@example.co.nz')).toBeInTheDocument();
  });

  it('renders member since year', () => {
    render(<MemberCard member={goldMember} />);
    expect(screen.getByText(/Member since 2022/)).toBeInTheDocument();
  });

  it('renders tier name in badge', () => {
    render(<MemberCard member={goldMember} />);
    // Tier badge in the header
    expect(screen.getAllByText('Gold').length).toBeGreaterThan(0);
  });

  it('renders benefits list when showBenefits=true', () => {
    render(<MemberCard member={goldMember} showBenefits />);
    expect(screen.getByText('Priority booking')).toBeInTheDocument();
    expect(screen.getByText('10% off concessions')).toBeInTheDocument();
  });

  it('hides benefits when showBenefits=false', () => {
    render(<MemberCard member={goldMember} showBenefits={false} />);
    expect(screen.queryByText('Priority booking')).not.toBeInTheDocument();
  });

  it('shows progress to next tier for non-platinum members', () => {
    render(<MemberCard member={goldMember} showProgress />);
    // Progress bar pointing to Platinum
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(screen.getByText(/pts to Platinum/)).toBeInTheDocument();
  });

  it('shows "Maximum tier achieved" for Platinum', () => {
    render(<MemberCard member={platinumMember} showProgress />);
    expect(screen.getByText('Maximum tier achieved')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders avatar initials', () => {
    render(<MemberCard member={bronzeMember} />);
    // Avatar initials AN for Aroha Ngata
    expect(screen.getByLabelText(/Loyalty member card for Aroha Ngata/)).toBeInTheDocument();
  });

  it('hides progress section when showProgress=false', () => {
    render(<MemberCard member={goldMember} showProgress={false} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders Platinum benefits list', () => {
    render(<MemberCard member={platinumMember} showBenefits />);
    expect(screen.getByText('Private screening access')).toBeInTheDocument();
    expect(screen.getByText('Director Q&A invitations')).toBeInTheDocument();
  });
});
