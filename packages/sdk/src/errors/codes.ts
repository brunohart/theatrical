/**
 * Vista platform error codes and human-readable message mappings.
 *
 * These codes are returned in Vista API error responses as the `code` field.
 * Mapping them to messages here keeps the parser clean and makes it easy
 * to add new codes as the Vista API evolves.
 */

/**
 * Known Vista API error codes.
 */
export const VISTA_ERROR_CODES = {
  // Auth
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_INSUFFICIENT_SCOPE: 'AUTH_INSUFFICIENT_SCOPE',
  AUTH_API_KEY_INVALID: 'AUTH_API_KEY_INVALID',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  INVALID_CURRENCY: 'INVALID_CURRENCY',

  // Resources
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_SOLD_OUT: 'SESSION_SOLD_OUT',
  SEAT_UNAVAILABLE: 'SEAT_UNAVAILABLE',
  FILM_NOT_FOUND: 'FILM_NOT_FOUND',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_CONFIRMED: 'ORDER_ALREADY_CONFIRMED',
  ORDER_CANCELLATION_WINDOW_EXPIRED: 'ORDER_CANCELLATION_WINDOW_EXPIRED',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
} as const;

export type VistaErrorCode = (typeof VISTA_ERROR_CODES)[keyof typeof VISTA_ERROR_CODES];

/**
 * Human-readable messages for known Vista error codes.
 *
 * Used when the API response message is absent or unhelpfully generic.
 */
export const VISTA_ERROR_MESSAGES: Record<string, string> = {
  [VISTA_ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your access token has expired. Re-authenticate and retry.',
  [VISTA_ERROR_CODES.AUTH_TOKEN_INVALID]: 'The provided access token is invalid.',
  [VISTA_ERROR_CODES.AUTH_TOKEN_MISSING]: 'No access token was provided.',
  [VISTA_ERROR_CODES.AUTH_INSUFFICIENT_SCOPE]: 'The access token does not have the required permissions.',
  [VISTA_ERROR_CODES.AUTH_API_KEY_INVALID]: 'The API key is invalid or has been revoked.',
  [VISTA_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please slow down.',
  [VISTA_ERROR_CODES.QUOTA_EXCEEDED]: 'API quota exceeded for this billing period.',
  [VISTA_ERROR_CODES.VALIDATION_FAILED]: 'One or more fields failed validation.',
  [VISTA_ERROR_CODES.INVALID_PARAMETER]: 'A request parameter contains an invalid value.',
  [VISTA_ERROR_CODES.MISSING_REQUIRED_FIELD]: 'A required field is missing from the request.',
  [VISTA_ERROR_CODES.INVALID_DATE_FORMAT]: 'Date must be in ISO 8601 format (YYYY-MM-DD).',
  [VISTA_ERROR_CODES.INVALID_CURRENCY]: 'Currency code must be a valid ISO 4217 code (e.g. NZD, AUD).',
  [VISTA_ERROR_CODES.SESSION_NOT_FOUND]: 'The requested session does not exist.',
  [VISTA_ERROR_CODES.SESSION_EXPIRED]: 'This session has already passed.',
  [VISTA_ERROR_CODES.SESSION_SOLD_OUT]: 'This session is sold out.',
  [VISTA_ERROR_CODES.SEAT_UNAVAILABLE]: 'One or more selected seats are no longer available.',
  [VISTA_ERROR_CODES.FILM_NOT_FOUND]: 'The requested film does not exist.',
  [VISTA_ERROR_CODES.SITE_NOT_FOUND]: 'The requested cinema site does not exist.',
  [VISTA_ERROR_CODES.ORDER_NOT_FOUND]: 'The requested order does not exist.',
  [VISTA_ERROR_CODES.ORDER_ALREADY_CONFIRMED]: 'This order has already been confirmed.',
  [VISTA_ERROR_CODES.ORDER_CANCELLATION_WINDOW_EXPIRED]: 'The cancellation window for this order has passed.',
  [VISTA_ERROR_CODES.MEMBER_NOT_FOUND]: 'The requested member does not exist.',
  [VISTA_ERROR_CODES.INTERNAL_ERROR]: 'An internal server error occurred. Please try again.',
  [VISTA_ERROR_CODES.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable.',
  [VISTA_ERROR_CODES.UPSTREAM_TIMEOUT]: 'The upstream service timed out.',
};

/**
 * Returns the human-readable message for a Vista error code,
 * falling back to the raw code if unknown.
 */
export function resolveVistaMessage(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return VISTA_ERROR_MESSAGES[code] ?? fallback;
}
