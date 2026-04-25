import React, { createContext, useContext, type ReactNode } from 'react';
import { tokens, type Tokens } from '../tokens';

const ThemeContext = createContext<Tokens>(tokens);

export function useTheme(): Tokens {
  return useContext(ThemeContext);
}

type DeepPartialTokens = Partial<{
  colors: Partial<Tokens['colors']>;
  spacing: Partial<Tokens['spacing']>;
  typography: Partial<Tokens['typography']>;
  radii: Partial<Tokens['radii']>;
  shadows: Partial<Tokens['shadows']>;
  transitions: Partial<Tokens['transitions']>;
}>;

interface TheatricalThemeProviderProps {
  children: ReactNode;
  /** Override specific token values. Deep-merged with defaults — partial overrides within each namespace are safe. */
  overrides?: DeepPartialTokens;
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
  const theme: Tokens = overrides
    ? {
        ...tokens,
        colors: { ...tokens.colors, ...(overrides.colors ?? {}) },
        spacing: { ...tokens.spacing, ...(overrides.spacing ?? {}) },
        typography: { ...tokens.typography, ...(overrides.typography ?? {}) },
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
