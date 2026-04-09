import {
  TheatricalError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
} from './index';
import type { VistaErrorBody, VistaErrorEnvelope, VistaFieldError, OcapiErrorEnvelope } from './types';
import { resolveVistaMessage } from './codes';

// ─── Body parsing helpers ────────────────────────────────────────────────────

/**
 * Attempts to parse a Response body as JSON, returning null on failure.
 * We consume the body stream once so callers don't need to guard against
 * double-reads.
 */
async function tryParseBody(response: Response): Promise<VistaErrorBody | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as VistaErrorBody;
  } catch {
    return null;
  }
}

/**
 * Type-guard for the standard Vista error envelope.
 */
function isVistaEnvelope(body: VistaErrorBody): body is VistaErrorEnvelope {
  return typeof body === 'object' && body !== null && ('code' in body || 'message' in body || 'errors' in body);
}

/**
 * Type-guard for OCAPI-style error responses.
 */
function isOcapiEnvelope(body: VistaErrorBody): body is OcapiErrorEnvelope {
  return typeof body === 'object' && body !== null && 'fault' in body;
}

/**
 * Extracts field-level errors from a Vista envelope into the flat map
 * format used by ValidationError.
 */
function extractFieldErrors(errors: VistaFieldError[] | undefined): Record<string, string> {
  if (!errors || errors.length === 0) return {};
  return Object.fromEntries(errors.map((e) => [e.field, e.message]));
}

// ─── Retry-After parsing ─────────────────────────────────────────────────────

/**
 * Parses the Retry-After header, handling both delta-seconds and HTTP-date
 * formats. Returns seconds as a number, defaulting to 60 if unparseable.
 */
function parseRetryAfter(response: Response): number {
  const raw = response.headers.get('Retry-After');
  if (!raw) return 60;

  // Delta-seconds format: "30"
  const seconds = parseInt(raw, 10);
  if (!isNaN(seconds) && seconds >= 0) return seconds;

  // HTTP-date format: "Thu, 09 Apr 2026 18:00:00 GMT"
  const date = new Date(raw);
  if (!isNaN(date.getTime())) {
    const delta = Math.ceil((date.getTime() - Date.now()) / 1000);
    return Math.max(0, delta);
  }

  return 60;
}

// ─── Resource identification ─────────────────────────────────────────────────

/**
 * Extracts a resource type and ID from a Vista error for NotFoundError.
 * Tries to infer from the Vista error code (e.g. SESSION_NOT_FOUND → "Session")
 * or falls back to the URL path.
 */
function extractResource(
  vistaCode: string | undefined,
  requestUrl: string | undefined
): { resource: string; resourceId: string } {
  const CODE_TO_RESOURCE: Record<string, string> = {
    SESSION_NOT_FOUND: 'Session',
    FILM_NOT_FOUND: 'Film',
    SITE_NOT_FOUND: 'Site',
    ORDER_NOT_FOUND: 'Order',
    MEMBER_NOT_FOUND: 'Member',
  };

  const resource = (vistaCode && CODE_TO_RESOURCE[vistaCode]) ?? inferResourceFromUrl(requestUrl);

  // Extract trailing ID segment from URL path (e.g. /sessions/abc-123 → "abc-123")
  const id = requestUrl ? (new URL(requestUrl, 'https://api.vista.co').pathname.split('/').filter(Boolean).pop() ?? 'unknown') : 'unknown';

  return { resource, resourceId: id };
}

function inferResourceFromUrl(url: string | undefined): string {
  if (!url) return 'Resource';
  const segments = url.split('/').filter(Boolean);
  // Find the resource noun — typically the second-to-last segment (before the ID)
  if (segments.length >= 2) {
    const noun = segments[segments.length - 2];
    return noun.charAt(0).toUpperCase() + noun.slice(1, -1); // "sessions" → "Session"
  }
  return 'Resource';
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Parses a failed HTTP Response into a typed TheatricalError.
 *
 * Handles:
 * - 401/403 → AuthenticationError
 * - 429 → RateLimitError (with Retry-After header)
 * - 400/422 → ValidationError (with field-level error map)
 * - 404 → NotFoundError (with resource identification)
 * - 5xx → ServerError
 * - Everything else → TheatricalError with status code
 *
 * @param response - The failed HTTP Response object
 * @param requestUrl - Optional original request URL for resource identification in 404s
 * @returns A typed TheatricalError subclass
 *
 * @example
 * ```typescript
 * const response = await fetch(url, options);
 * if (!response.ok) {
 *   throw await parseErrorResponse(response, url);
 * }
 * ```
 */
export async function parseErrorResponse(
  response: Response,
  requestUrl?: string
): Promise<TheatricalError> {
  const body = await tryParseBody(response);
  const status = response.status;

  // Extract common fields from whichever body shape we have
  let vistaCode: string | undefined;
  let message: string | undefined;
  let requestId: string | undefined;
  let fieldErrors: Record<string, string> = {};

  if (body && isVistaEnvelope(body)) {
    vistaCode = body.code;
    message = body.message;
    requestId = body.requestId;
    fieldErrors = extractFieldErrors(body.errors);
  } else if (body && isOcapiEnvelope(body)) {
    message = body.fault?.message;
    vistaCode = body.fault?.type;
  }

  // Resolve message: prefer API message, fall back to code lookup, then generic
  const resolvedMessage = resolveVistaMessage(vistaCode, message ?? `Request failed with status ${status}`);

  // ── Status-based dispatch ──────────────────────────────────────────────────

  if (status === 401 || status === 403) {
    return new AuthenticationError(resolvedMessage, vistaCode, requestId);
  }

  if (status === 429) {
    const retryAfter = parseRetryAfter(response);
    return new RateLimitError(retryAfter, requestId);
  }

  if (status === 400 || status === 422) {
    return new ValidationError(resolvedMessage, fieldErrors, requestId);
  }

  if (status === 404) {
    const { resource, resourceId } = extractResource(vistaCode, requestUrl);
    return new NotFoundError(resource, resourceId, requestId);
  }

  if (status >= 500) {
    return new ServerError(resolvedMessage, requestId);
  }

  // Fallback for unexpected statuses
  return new TheatricalError(resolvedMessage, status, vistaCode, requestId);
}
