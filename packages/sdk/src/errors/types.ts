/**
 * Vista API error response shapes.
 *
 * Vista endpoints return errors in one of several formats depending on
 * the API version and the type of failure. The parser handles all known
 * shapes and falls back gracefully to generic errors for unknown formats.
 */

/**
 * Standard Vista error envelope — most API errors follow this shape.
 */
export interface VistaErrorEnvelope {
  /** HTTP status code (mirrors the response status) */
  status?: number;
  /** Vista-specific error code (e.g. "AUTH_TOKEN_EXPIRED") */
  code?: string;
  /** Human-readable error message */
  message?: string;
  /** Unique request identifier for tracing */
  requestId?: string;
  /** Field-level validation errors */
  errors?: VistaFieldError[];
}

/**
 * Field-level validation error from Vista APIs.
 */
export interface VistaFieldError {
  /** The field path (e.g. "booking.seats[0].type") */
  field: string;
  /** Human-readable description of the validation failure */
  message: string;
  /** Machine-readable error code for the field failure */
  code?: string;
}

/**
 * OCAPI-style error response (used by older Vista integrations).
 */
export interface OcapiErrorEnvelope {
  fault?: {
    type?: string;
    message?: string;
    arguments?: Record<string, unknown>;
  };
}

/**
 * Union of all known Vista API error shapes.
 */
export type VistaErrorBody = VistaErrorEnvelope | OcapiErrorEnvelope | Record<string, unknown>;
