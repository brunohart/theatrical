import type { TheatricalConfig } from '../../src/types/config';

export function createMockConfig(overrides?: Partial<TheatricalConfig>): TheatricalConfig {
  return {
    apiKey: 'test_key_theatrical_sdk',
    environment: 'sandbox',
    timeout: 5000,
    maxRetries: 1,
    debug: false,
    ...overrides,
  };
}

export const TEST_API_KEY = 'test_key_theatrical_sdk';
export const TEST_BASE_URL = 'https://api.sandbox.theatrical.dev';
