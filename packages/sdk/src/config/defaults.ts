import type { TheatricalConfig } from '../types/config';

export const DEFAULT_CONFIG: Required<Omit<TheatricalConfig, 'apiKey' | 'baseUrl'>> = {
  environment: 'sandbox',
  timeout: 30_000,
  maxRetries: 3,
  debug: false,
};

export const MAX_TIMEOUT_MS = 120_000;
export const MAX_RETRIES = 10;
export const MIN_API_KEY_LENGTH = 8;
