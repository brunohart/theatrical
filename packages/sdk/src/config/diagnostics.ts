import type { TheatricalConfig } from '../types/config';
import { SDK_VERSION } from '../version';
import { resolveBaseUrl } from './environments';

export interface DiagnosticInfo {
  sdkVersion: string;
  environment: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  debug: boolean;
  runtime: string;
}

export function getDiagnosticInfo(config: TheatricalConfig): DiagnosticInfo {
  return {
    sdkVersion: SDK_VERSION,
    environment: config.environment ?? 'sandbox',
    baseUrl: resolveBaseUrl(config.environment ?? 'sandbox', config.baseUrl),
    timeout: config.timeout ?? 30_000,
    maxRetries: config.maxRetries ?? 3,
    debug: config.debug ?? false,
    runtime: typeof process !== 'undefined' ? `Node.js ${process.version}` : 'unknown',
  };
}
