import React, { useEffect, useRef, useState } from 'react';
import { tokens } from '../../tokens';
import type { PointsDisplayProps } from './types';

const SIZE_MAP = {
  sm: { number: tokens.typography.sizes.xl, label: tokens.typography.sizes.xs },
  md: { number: tokens.typography.sizes.xxl, label: tokens.typography.sizes.sm },
  lg: { number: tokens.typography.sizes.display, label: tokens.typography.sizes.md },
};

const ANIMATION_DURATION_MS = 900;
const FRAME_INTERVAL_MS = 16; // ~60fps

/**
 * Points balance display with a smooth count-up animation on mount.
 * Uses setInterval for broad environment compatibility (browser + test).
 *
 * @example
 * ```tsx
 * <PointsDisplay points={2840} label="points available" size="lg" />
 * ```
 */
export function PointsDisplay({ points, animate = true, label = 'points', size = 'md' }: PointsDisplayProps) {
  const { number: numSize, label: labelSize } = SIZE_MAP[size];
  const [displayed, setDisplayed] = useState(animate ? 0 : points);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || points === 0) {
      setDisplayed(points);
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * points));
      if (progress >= 1 && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    }, FRAME_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [points, animate]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        style={{
          fontSize: numSize,
          fontWeight: tokens.typography.weights.bold,
          color: tokens.colors.accent,
          lineHeight: tokens.typography.lineHeights.tight,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
        aria-label={`${points} ${label}`}
      >
        {displayed.toLocaleString('en-NZ')}
      </span>
      <span
        style={{
          fontSize: labelSize,
          color: tokens.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: tokens.typography.weights.medium,
        }}
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}
