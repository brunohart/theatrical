import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 to `target` using requestAnimationFrame and an ease-out cubic curve.
 * Re-triggers whenever `target` changes. Returns the current animated value.
 *
 * @example
 * ```tsx
 * const displayPoints = useCountUp(member.points, 1200);
 * // → 0 → ... → 2840 over 1.2 seconds
 * ```
 */
export function useCountUp(target: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let startTime: number | null = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.round(target * easeOut(progress)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}
