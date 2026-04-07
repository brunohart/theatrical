/**
 * Vista platform environments
 */
export type TheatricalEnvironment = 'sandbox' | 'staging' | 'production';

/**
 * Configuration for the TheatricalClient
 */
export interface TheatricalConfig {
  /** Vista API key — obtain from your Vista representative */
  apiKey: string;

  /** Target environment. Defaults to 'sandbox' */
  environment?: TheatricalEnvironment;

  /** Override the base URL. Normally derived from environment */
  baseUrl?: string;

  /** Request timeout in milliseconds. Defaults to 30000 */
  timeout?: number;

  /** Maximum retry attempts for failed requests. Defaults to 3 */
  maxRetries?: number;

  /** Enable debug logging. Defaults to false */
  debug?: boolean;
}
