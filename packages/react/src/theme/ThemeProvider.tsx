import React, { createContext, useContext, type ReactNode } from 'react';
import { tokens, type Tokens } from '../tokens';

/**
 * The default `tokens` are declared `as const`, so each value is a literal
 * type (e.g. `accent: '#D4622B'`). That is perfect for reading, but it would
 * reject any brand override — `accent: '#e60026'` is not the literal
 * `'#D4622B'`. `Themeable` widens every leaf back to its primitive so
 * overrides accept arbitrary colours, sizes, and font stacks.
 */
type Themeable<T> = {
  -readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends number
      ? number
      : Themeable<T[K]>;
};

/** Fully-resolved, writable theme — the shape `useTheme()` returns. */
export type Theme = Themeable<Tokens>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** A partial set of token overrides, nested to any depth within a namespace. */
export type ThemeOverrides = DeepPartial<Theme>;

const ThemeContext = createContext<Theme>(tokens);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

interface TheatricalThemeProviderProps {
  children: ReactNode;
  /** Override specific token values. Deep-merged with defaults — partial overrides within each namespace are safe. */
  overrides?: ThemeOverrides;
}

/**
 * Wraps your application in the Theatrical design system. Injects CSS custom
 * properties onto a container div and provides theme tokens via React context.
 *
 * @example
 * ```tsx
 * <TheatricalThemeProvider>
 *   <App />
 * </TheatricalThemeProvider>
 * ```
 */
export function TheatricalThemeProvider({ children, overrides }: TheatricalThemeProviderProps) {
  const theme: Theme = overrides
    ? {
        ...tokens,
        colors: { ...tokens.colors, ...(overrides.colors ?? {}) },
        spacing: { ...tokens.spacing, ...(overrides.spacing ?? {}) },
        typography: {
          ...tokens.typography,
          ...(overrides.typography ?? {}),
          // The nested scales merge per-key so overriding one size or weight
          // doesn't drop the rest of the scale.
          sizes: { ...tokens.typography.sizes, ...(overrides.typography?.sizes ?? {}) },
          weights: { ...tokens.typography.weights, ...(overrides.typography?.weights ?? {}) },
          lineHeights: { ...tokens.typography.lineHeights, ...(overrides.typography?.lineHeights ?? {}) },
        },
        radii: { ...tokens.radii, ...(overrides.radii ?? {}) },
        shadows: { ...tokens.shadows, ...(overrides.shadows ?? {}) },
        transitions: { ...tokens.transitions, ...(overrides.transitions ?? {}) },
      }
    : tokens;

  const cssVars: React.CSSProperties = {
    // Colors
    ['--theatrical-bg' as string]: theme.colors.bg,
    ['--theatrical-surface' as string]: theme.colors.surface,
    ['--theatrical-surface-raised' as string]: theme.colors.surfaceRaised,
    ['--theatrical-border' as string]: theme.colors.border,
    ['--theatrical-accent' as string]: theme.colors.accent,
    ['--theatrical-accent-muted' as string]: theme.colors.accentMuted,
    ['--theatrical-text' as string]: theme.colors.text,
    ['--theatrical-text-muted' as string]: theme.colors.textMuted,
    ['--theatrical-text-disabled' as string]: theme.colors.textDisabled,
    // Seat states
    ['--theatrical-seat-available' as string]: theme.colors.seatAvailable,
    ['--theatrical-seat-taken' as string]: theme.colors.seatTaken,
    ['--theatrical-seat-selected' as string]: theme.colors.seatSelected,
    ['--theatrical-seat-wheelchair' as string]: theme.colors.seatWheelchair,
    ['--theatrical-seat-companion' as string]: theme.colors.seatCompanion,
    ['--theatrical-seat-premium' as string]: theme.colors.seatPremium,
    // Typography
    ['--theatrical-font' as string]: theme.typography.fontFamily,
    ['--theatrical-font-heading' as string]: theme.typography.fontFamilyHeading,
    ['--theatrical-font-mono' as string]: theme.typography.fontFamilyMono,
    // Base
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={cssVars} data-theatrical-theme="dark">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
