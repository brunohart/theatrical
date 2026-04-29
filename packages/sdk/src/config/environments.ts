import type { TheatricalEnvironment } from '../types/config';

const ENVIRONMENT_URLS: Record<TheatricalEnvironment, string> = {
  sandbox: 'https://api.sandbox.vista.co',
  staging: 'https://api.staging.vista.co',
  production: 'https://api.vista.co',
};

export function resolveBaseUrl(environment: TheatricalEnvironment, baseUrlOverride?: string): string {
  if (baseUrlOverride) return baseUrlOverride.replace(/\/$/, '');
  return ENVIRONMENT_URLS[environment];
}

export function isValidEnvironment(value: string): value is TheatricalEnvironment {
  return value === 'sandbox' || value === 'staging' || value === 'production';
}
