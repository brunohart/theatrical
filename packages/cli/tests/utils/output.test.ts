import { describe, it, expect } from 'vitest';
import {
  success,
  error,
  warning,
  info,
  dim,
  label,
  highlight,
  link,
  keyValue,
  heading,
  printBanner,
} from '../../src/utils/output.js';

/**
 * Strip ANSI escape codes for assertion clarity.
 */
function stripAnsi(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

describe('output utilities', () => {
  describe('semantic formatters', () => {
    it('should prefix success messages with checkmark', () => {
      const result = stripAnsi(success('Operation complete'));
      expect(result).toBe('✓ Operation complete');
    });

    it('should prefix error messages with cross', () => {
      const result = stripAnsi(error('Something failed'));
      expect(result).toBe('✗ Something failed');
    });

    it('should prefix warning messages with warning symbol', () => {
      const result = stripAnsi(warning('Deprecation notice'));
      expect(result).toBe('⚠ Deprecation notice');
    });

    it('should prefix info messages with info symbol', () => {
      const result = stripAnsi(info('Server started'));
      expect(result).toBe('ℹ Server started');
    });
  });

  describe('text formatters', () => {
    it('should return non-empty string for dim text', () => {
      const result = dim('secondary text');
      expect(result).toBeTruthy();
      expect(stripAnsi(result)).toBe('secondary text');
    });

    it('should return non-empty string for label text', () => {
      const result = label('Important');
      expect(result).toBeTruthy();
      expect(stripAnsi(result)).toBe('Important');
    });

    it('should return non-empty string for highlighted text', () => {
      const result = highlight('value');
      expect(result).toBeTruthy();
      expect(stripAnsi(result)).toBe('value');
    });

    it('should format URLs with underline styling', () => {
      const result = link('https://api.vista.co');
      expect(result).toBeTruthy();
      expect(stripAnsi(result)).toBe('https://api.vista.co');
    });
  });

  describe('compound formatters', () => {
    it('should format key-value pairs with colon separator', () => {
      const result = stripAnsi(keyValue('API Endpoint', 'https://api.vista.co'));
      expect(result).toBe('API Endpoint: https://api.vista.co');
    });

    it('should format headings with underline', () => {
      const result = stripAnsi(heading('Configuration'));
      expect(result).toContain('Configuration');
      expect(result).toContain('─'.repeat('Configuration'.length));
    });
  });

  describe('printBanner', () => {
    it('should output banner with version number', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => logs.push(String(args[0]));

      printBanner('1.2.3');

      console.log = originalLog;

      const banner = logs.join('\n');
      const cleanBanner = stripAnsi(banner);
      expect(cleanBanner).toContain('Theatrical CLI v1.2.3');
      expect(cleanBanner).toContain('Cinema Platform Dev Tools');
    });

    it('should render box characters in banner', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => logs.push(String(args[0]));

      printBanner('0.1.0');

      console.log = originalLog;

      const banner = logs.join('\n');
      const cleanBanner = stripAnsi(banner);
      expect(cleanBanner).toContain('┌');
      expect(cleanBanner).toContain('┘');
      expect(cleanBanner).toContain('│');
    });
  });
});
