/** designedbybruno token system — parchment warmth, burnt orange signature, navy structure. */
export const tokens = {
  colors: {
    bg: '#F0EDE6',
    surface: '#F5F0E1',
    surfaceRaised: '#EBE6DA',
    border: '#D6D0C4',
    accent: '#D4622B',
    accentMuted: '#B8532A',
    text: '#1A1A1A',
    textMuted: '#8A8578',
    textDisabled: '#B8B3A8',
    seatAvailable: '#1B2D4F',
    seatTaken: '#D6D0C4',
    seatSelected: '#D4622B',
    seatWheelchair: '#2d6a4f',
    seatCompanion: '#40916c',
    seatPremium: '#1B2D4F',
    success: '#22c55e',
    error: '#C4391D',
    warning: '#D4622B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyHeading: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      display: '2rem',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  shadows: {
    sm: '0 1px 3px rgba(26,26,26,0.08)',
    md: '0 4px 12px rgba(26,26,26,0.1)',
    lg: '0 8px 24px rgba(26,26,26,0.12)',
    glow: '0 0 12px rgba(212,98,43,0.2)',
  },
  transitions: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
