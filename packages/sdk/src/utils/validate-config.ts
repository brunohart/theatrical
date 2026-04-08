import { ZodError } from 'zod';
import { theatricalConfigSchema, type TheatricalConfig, type ValidatedTheatricalConfig } from '../types/config';
import { ValidationError } from '../errors';

/**
 * Validates a raw TheatricalConfig object against the Zod schema.
 *
 * Throws a `ValidationError` if any fields are invalid, with a field-level
 * error map so callers can surface specific issues.
 *
 * @param config - Raw config object passed by the SDK consumer
 * @returns Validated and defaulted config with all optional fields resolved
 * @throws {ValidationError} if config is invalid
 *
 * @example
 * ```typescript
 * const validated = validateConfig({ apiKey: 'key', environment: 'sandbox' });
 * // validated.timeout === 30000 (default applied)
 * ```
 */
export function validateConfig(config: TheatricalConfig): ValidatedTheatricalConfig {
  try {
    return theatricalConfigSchema.parse(config);
  } catch (err) {
    if (err instanceof ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.');
        fields[path || 'unknown'] = issue.message;
      }
      const firstField = Object.keys(fields)[0] ?? 'config';
      const firstMessage = fields[firstField] ?? 'Invalid configuration';
      throw new ValidationError(
        `Invalid TheatricalConfig: ${firstField} — ${firstMessage}`,
        fields
      );
    }
    throw err;
  }
}
