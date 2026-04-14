import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveConfig, type TheatricalCLIConfig } from '../../src/utils/config.js';

describe('config resolution', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clean env before each test
    delete process.env.THEATRICAL_API_URL;
    delete process.env.THEATRICAL_API_KEY;
    delete process.env.THEATRICAL_DEFAULT_SITE_ID;
    delete process.env.THEATRICAL_OUTPUT_FORMAT;
    delete process.env.THEATRICAL_VERBOSE;
    delete process.env.THEATRICAL_NO_COLOR;
  });

  afterEach(() => {
    // Restore original env
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('THEATRICAL_') && !(key in originalEnv)) {
        delete process.env[key];
      }
    });
  });

  describe('defaults', () => {
    it('should return default API URL when no config is set', async () => {
      const config = await resolveConfig();
      expect(config.apiUrl).toBe('https://api.vista.co/ocapi/v1');
    });

    it('should default to pretty output format', async () => {
      const config = await resolveConfig();
      expect(config.outputFormat).toBe('pretty');
    });

    it('should default verbose to false', async () => {
      const config = await resolveConfig();
      expect(config.verbose).toBe(false);
    });

    it('should default color to true', async () => {
      const config = await resolveConfig();
      expect(config.color).toBe(true);
    });
  });

  describe('environment variables', () => {
    it('should read API URL from THEATRICAL_API_URL', async () => {
      process.env.THEATRICAL_API_URL = 'https://custom.vista.co/v2';
      const config = await resolveConfig();
      expect(config.apiUrl).toBe('https://custom.vista.co/v2');
    });

    it('should read API key from THEATRICAL_API_KEY', async () => {
      process.env.THEATRICAL_API_KEY = 'env-test-key-456';
      const config = await resolveConfig();
      expect(config.apiKey).toBe('env-test-key-456');
    });

    it('should read default site ID from THEATRICAL_DEFAULT_SITE_ID', async () => {
      process.env.THEATRICAL_DEFAULT_SITE_ID = 'roxy-wellington';
      const config = await resolveConfig();
      expect(config.defaultSiteId).toBe('roxy-wellington');
    });

    it('should read output format from THEATRICAL_OUTPUT_FORMAT', async () => {
      process.env.THEATRICAL_OUTPUT_FORMAT = 'json';
      const config = await resolveConfig();
      expect(config.outputFormat).toBe('json');
    });

    it('should ignore invalid output format values', async () => {
      process.env.THEATRICAL_OUTPUT_FORMAT = 'xml';
      const config = await resolveConfig();
      expect(config.outputFormat).toBe('pretty'); // falls back to default
    });

    it('should enable verbose from THEATRICAL_VERBOSE=1', async () => {
      process.env.THEATRICAL_VERBOSE = '1';
      const config = await resolveConfig();
      expect(config.verbose).toBe(true);
    });

    it('should disable color from THEATRICAL_NO_COLOR=true', async () => {
      process.env.THEATRICAL_NO_COLOR = 'true';
      const config = await resolveConfig();
      expect(config.color).toBe(false);
    });
  });

  describe('override precedence', () => {
    it('should prefer CLI overrides over env vars', async () => {
      process.env.THEATRICAL_API_URL = 'https://env-url.vista.co';
      const config = await resolveConfig({ apiUrl: 'https://cli-url.vista.co' });
      expect(config.apiUrl).toBe('https://cli-url.vista.co');
    });

    it('should prefer CLI overrides over defaults', async () => {
      const config = await resolveConfig({ verbose: true, outputFormat: 'json' });
      expect(config.verbose).toBe(true);
      expect(config.outputFormat).toBe('json');
    });

    it('should not override with undefined values', async () => {
      process.env.THEATRICAL_API_KEY = 'env-key';
      const config = await resolveConfig({ apiKey: undefined });
      expect(config.apiKey).toBe('env-key');
    });
  });

  describe('merged config shape', () => {
    it('should return a complete TheatricalCLIConfig object', async () => {
      const config = await resolveConfig();

      // Required fields should always be present
      expect(typeof config.apiUrl).toBe('string');
      expect(typeof config.outputFormat).toBe('string');
      expect(typeof config.verbose).toBe('boolean');
      expect(typeof config.color).toBe('boolean');
    });
  });
});
