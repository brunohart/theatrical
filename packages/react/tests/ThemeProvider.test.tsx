import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TheatricalThemeProvider, useTheme, type ThemeOverrides } from '../src/index';
import { tokens } from '../src/tokens';

/** Render a probe that captures the resolved theme from context. */
function captureTheme(overrides?: ThemeOverrides) {
  let seen: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    seen = useTheme();
    return null;
  }
  render(
    <TheatricalThemeProvider overrides={overrides}>
      <Probe />
    </TheatricalThemeProvider>
  );
  return seen!;
}

describe('TheatricalThemeProvider', () => {
  it('returns the default tokens when no overrides are passed', () => {
    const theme = captureTheme();
    expect(theme.colors.accent).toBe(tokens.colors.accent);
  });

  it('accepts an arbitrary brand colour and merges it over the defaults', () => {
    // The whole point: a brand hex that is NOT the default literal still
    // typechecks and applies. Regression guard for the as-const widening.
    const overrides: ThemeOverrides = { colors: { accent: '#e60026' } };
    const theme = captureTheme(overrides);

    expect(theme.colors.accent).toBe('#e60026');
    // Untouched colours keep their defaults.
    expect(theme.colors.bg).toBe(tokens.colors.bg);
    expect(theme.colors.text).toBe(tokens.colors.text);
  });

  it('deep-merges nested typography scales without dropping siblings', () => {
    const theme = captureTheme({ typography: { sizes: { xl: '2rem' } } });

    expect(theme.typography.sizes.xl).toBe('2rem');
    // Other sizes survive the partial override.
    expect(theme.typography.sizes.xs).toBe(tokens.typography.sizes.xs);
    expect(theme.typography.fontFamily).toBe(tokens.typography.fontFamily);
  });

  it('does not mutate the shared default tokens', () => {
    captureTheme({ colors: { accent: '#000000' } });
    expect(tokens.colors.accent).toBe('#D4622B');
  });

  it('useTheme returns defaults outside a provider rather than throwing', () => {
    let seen: ReturnType<typeof useTheme> | undefined;
    function Probe() {
      seen = useTheme();
      return null;
    }
    expect(() => render(<Probe />)).not.toThrow();
    expect(seen!.colors.accent).toBe(tokens.colors.accent);
  });
});
