import { z } from 'zod';

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

/**
 * Zod schema for TheatricalConfig — used for runtime validation.
 *
 * Validates that required fields are present and that optional fields
 * conform to expected types and value ranges.
 */
export const theatricalConfigSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'apiKey must not be empty')
    .regex(/^[A-Za-z0-9_-]+$/, 'apiKey must contain only alphanumeric characters, hyphens, and underscores'),

  environment: z
    .enum(['sandbox', 'staging', 'production'])
    .optional()
    .default('sandbox'),

  baseUrl: z
    .string()
    .url('baseUrl must be a valid URL')
    .optional(),

  timeout: z
    .number()
    .int('timeout must be an integer')
    .positive('timeout must be a positive number')
    .max(120_000, 'timeout must not exceed 120000ms')
    .optional()
    .default(30_000),

  maxRetries: z
    .number()
    .int('maxRetries must be an integer')
    .min(0, 'maxRetries must be 0 or greater')
    .max(10, 'maxRetries must not exceed 10')
    .optional()
    .default(3),

  debug: z.boolean().optional().default(false),
});

/**
 * Validated and defaulted TheatricalConfig — all optional fields are resolved.
 */
export type ValidatedTheatricalConfig = z.infer<typeof theatricalConfigSchema>;
