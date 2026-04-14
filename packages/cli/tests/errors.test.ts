import { describe, it, expect } from 'vitest';
import {
  CLIError,
  ConfigError,
  AuthenticationError,
  FileNotFoundError,
  APIError,
  ValidationError,
  formatCLIError,
} from '../src/errors.js';

describe('CLI error types', () => {
  describe('CLIError', () => {
    it('should set default exit code to 1', () => {
      const err = new CLIError('Something went wrong');
      expect(err.exitCode).toBe(1);
      expect(err.message).toBe('Something went wrong');
      expect(err.name).toBe('CLIError');
    });

    it('should accept custom exit code', () => {
      const err = new CLIError('Custom', { exitCode: 42 });
      expect(err.exitCode).toBe(42);
    });

    it('should accept optional hint', () => {
      const err = new CLIError('Failed', { hint: 'Try again later' });
      expect(err.hint).toBe('Try again later');
    });

    it('should extend Error', () => {
      const err = new CLIError('test');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('ConfigError', () => {
    it('should use EX_CONFIG exit code (78)', () => {
      const err = new ConfigError('Bad config format');
      expect(err.exitCode).toBe(78);
      expect(err.name).toBe('ConfigError');
    });

    it('should extend CLIError', () => {
      const err = new ConfigError('test');
      expect(err).toBeInstanceOf(CLIError);
    });
  });

  describe('AuthenticationError', () => {
    it('should use EX_NOPERM exit code (77)', () => {
      const err = new AuthenticationError();
      expect(err.exitCode).toBe(77);
      expect(err.name).toBe('AuthenticationError');
    });

    it('should include hint about setting API key', () => {
      const err = new AuthenticationError();
      expect(err.hint).toContain('THEATRICAL_API_KEY');
    });

    it('should use default message when none provided', () => {
      const err = new AuthenticationError();
      expect(err.message).toBe('API authentication failed');
    });

    it('should accept custom message', () => {
      const err = new AuthenticationError('Token expired');
      expect(err.message).toBe('Token expired');
    });
  });

  describe('FileNotFoundError', () => {
    it('should use EX_NOINPUT exit code (66)', () => {
      const err = new FileNotFoundError('/path/to/missing.yaml');
      expect(err.exitCode).toBe(66);
      expect(err.path).toBe('/path/to/missing.yaml');
    });

    it('should include path in message', () => {
      const err = new FileNotFoundError('openapi.yaml');
      expect(err.message).toContain('openapi.yaml');
    });
  });

  describe('APIError', () => {
    it('should capture HTTP status code', () => {
      const err = new APIError('Not found', 404);
      expect(err.statusCode).toBe(404);
      expect(err.exitCode).toBe(69);
    });

    it('should capture Vista error code when provided', () => {
      const err = new APIError('Session expired', 400, 'VISTA_SESSION_EXPIRED');
      expect(err.vistaCode).toBe('VISTA_SESSION_EXPIRED');
      expect(err.hint).toContain('VISTA_SESSION_EXPIRED');
    });

    it('should have no hint when no Vista code', () => {
      const err = new APIError('Server error', 500);
      expect(err.vistaCode).toBeUndefined();
      expect(err.hint).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should use EX_USAGE exit code (64)', () => {
      const err = new ValidationError('template', 'must be default, fullstack, or worker');
      expect(err.exitCode).toBe(64);
      expect(err.field).toBe('template');
    });

    it('should include field name in message', () => {
      const err = new ValidationError('siteId', 'cannot be empty');
      expect(err.message).toContain('siteId');
      expect(err.message).toContain('cannot be empty');
    });
  });

  describe('formatCLIError', () => {
    it('should format basic error with indentation', () => {
      const err = new CLIError('Connection refused');
      const output = formatCLIError(err);
      expect(output).toContain('theatrical: Connection refused');
    });

    it('should include hint on separate line when present', () => {
      const err = new CLIError('Auth failed', { hint: 'Check your API key' });
      const output = formatCLIError(err);
      expect(output).toContain('hint: Check your API key');
    });

    it('should not include hint line when no hint', () => {
      const err = new CLIError('Simple error');
      const output = formatCLIError(err);
      expect(output).not.toContain('hint:');
    });
  });
});
