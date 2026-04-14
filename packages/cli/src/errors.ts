/**
 * @module errors
 * Structured error types for the Theatrical CLI.
 *
 * These error classes provide consistent error handling across all commands.
 * Each error type maps to a specific failure scenario and carries enough
 * context for the top-level handler to render a helpful message.
 */

/**
 * Base error for all CLI-specific failures.
 * Extends native Error with an exit code for process.exit().
 */
export class CLIError extends Error {
  /** Process exit code to use when this error bubbles to top level */
  readonly exitCode: number;

  /** Optional hint shown below the error message */
  readonly hint?: string;

  constructor(message: string, options?: { exitCode?: number; hint?: string }) {
    super(message);
    this.name = 'CLIError';
    this.exitCode = options?.exitCode ?? 1;
    this.hint = options?.hint;
  }
}

/**
 * Thrown when configuration is invalid or cannot be loaded.
 *
 * @example
 * ```typescript
 * throw new ConfigError('Invalid API URL format', {
 *   hint: 'API URL must start with https://',
 * });
 * ```
 */
export class ConfigError extends CLIError {
  constructor(message: string, options?: { hint?: string }) {
    super(message, { exitCode: 78, ...options }); // EX_CONFIG
    this.name = 'ConfigError';
  }
}

/**
 * Thrown when API authentication fails (missing key, expired token, etc.).
 */
export class AuthenticationError extends CLIError {
  constructor(message: string = 'API authentication failed') {
    super(message, {
      exitCode: 77, // EX_NOPERM
      hint: 'Set your API key with: theatrical --api-key <key> or THEATRICAL_API_KEY env var',
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when a required file or directory is not found.
 */
export class FileNotFoundError extends CLIError {
  /** The path that was not found */
  readonly path: string;

  constructor(filePath: string) {
    super(`File not found: ${filePath}`, {
      exitCode: 66, // EX_NOINPUT
    });
    this.name = 'FileNotFoundError';
    this.path = filePath;
  }
}

/**
 * Thrown when an API request fails with a non-retryable status.
 */
export class APIError extends CLIError {
  /** HTTP status code from the API response */
  readonly statusCode: number;

  /** Vista-specific error code, if present */
  readonly vistaCode?: string;

  constructor(
    message: string,
    statusCode: number,
    vistaCode?: string
  ) {
    super(message, {
      exitCode: 69, // EX_UNAVAILABLE
      hint: vistaCode
        ? `Vista error code: ${vistaCode} — check the API docs for details`
        : undefined,
    });
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.vistaCode = vistaCode;
  }
}

/**
 * Thrown when command input validation fails.
 */
export class ValidationError extends CLIError {
  /** The field or parameter that failed validation */
  readonly field: string;

  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`, {
      exitCode: 64, // EX_USAGE
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Format a CLIError for display, including the hint if present.
 */
export function formatCLIError(err: CLIError): string {
  const lines = [`  theatrical: ${err.message}`];
  if (err.hint) {
    lines.push(`  hint: ${err.hint}`);
  }
  return lines.join('\n');
}
