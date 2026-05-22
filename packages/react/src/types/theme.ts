export interface TheatricalTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    seatAvailable: string;
    seatOccupied: string;
    seatSelected: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  fontFamily: {
    sans: string;
    heading: string;
    mono: string;
  };
}

export const defaultTheme: TheatricalTheme = {
  colors: {
    primary: '#1B2D4F',
    secondary: '#D4622B',
    accent: '#D4622B',
    background: '#F0EDE6',
    surface: '#F5F0E1',
    text: '#1A1A1A',
    textMuted: '#8A8578',
    success: '#22c55e',
    warning: '#D4622B',
    error: '#C4391D',
    seatAvailable: '#1B2D4F',
    seatOccupied: '#D6D0C4',
    seatSelected: '#D4622B',
  },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '1rem', full: '9999px' },
  fontFamily: {
    sans: "'Inter', -apple-system, sans-serif",
    heading: "'Space Grotesk', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};
