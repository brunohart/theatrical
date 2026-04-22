/** Cinema-inspired design tokens. Dark mode by default — the natural register of a darkened auditorium. */
export const tokens = {
  colors: {
    /** True black — the void before the film begins */
    bg: '#0a0a0a',
    /** Elevated surface — card backgrounds, panels */
    surface: '#141414',
    /** Raised surface — hover states, modals */
    surfaceRaised: '#1e1e1e',
    /** Subtle dividers and borders */
    border: '#2a2a2a',
    /** Warm gold — the marquee light, the curtain glow */
    accent: '#c9a227',
    /** Muted gold for hover states */
    accentMuted: '#a8821c',
    /** Primary text — high contrast */
    text: '#f5f5f5',
    /** Secondary text — captions, labels */
    textMuted: '#9a9a9a',
    /** Disabled state */
    textDisabled: '#4a4a4a',
    /** Seat: available to book */
    seatAvailable: '#1a3a5c',
    /** Seat: taken by another patron */
    seatTaken: '#2d2d2d',
    /** Seat: selected by current user */
    seatSelected: '#c9a227',
    /** Seat: wheelchair accessible */
    seatWheelchair: '#2d6a4f',
    /** Seat: companion seat (adjacent to wheelchair) */
    seatCompanion: '#40916c',
    /** Seat: premium/recliner */
    seatPremium: '#6a0572',
    /** Success states */
    success: '#22c55e',
    /** Error states */
    error: '#ef4444',
    /** Warning states */
    warning: '#f59e0b',
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
    sm: '0 1px 3px rgba(0,0,0,0.5)',
    md: '0 4px 12px rgba(0,0,0,0.6)',
    lg: '0 8px 24px rgba(0,0,0,0.7)',
    glow: '0 0 12px rgba(201,162,39,0.3)',
  },
  transitions: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
