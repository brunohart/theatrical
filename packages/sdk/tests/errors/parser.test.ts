import { describe, it, expect } from 'vitest';
import {
  parseErrorResponse,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
  TheatricalError,
} from '../../src/errors';

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a mock Response with a JSON body and optional headers.
 */
function mockResponse(
  status: number,
  body: unknown = null,
  headers: Record<string, string> = {}
): Response {
  const bodyText = body !== null ? JSON.stringify(body) : '';
  return new Response(bodyText, {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Creates a mock Response with a plain text body.
 */
function mockTextResponse(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ─── 401 / 403 → AuthenticationError ─────────────────────────────────────────

describe('parseErrorResponse — auth errors', () => {
  it('maps 401 to AuthenticationError', async () => {
    const response = mockResponse(401, {
      code: 'AUTH_TOKEN_EXPIRED',
      message: 'Token has expired',
      requestId: 'req-abc',
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.statusCode).toBe(401);
    expect(error.vistaErrorCode).toBe('AUTH_TOKEN_EXPIRED');
    expect(error.requestId).toBe('req-abc');
  });

  it('maps 403 to AuthenticationError', async () => {
    const response = mockResponse(403, {
      code: 'AUTH_INSUFFICIENT_SCOPE',
      requestId: 'req-scope',
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.statusCode).toBe(401); // AuthenticationError normalises to 401
    expect(error.vistaErrorCode).toBe('AUTH_INSUFFICIENT_SCOPE');
  });

  it('uses Vista message map for known auth code', async () => {
    const response = mockResponse(401, { code: 'AUTH_TOKEN_INVALID' });
    const error = await parseErrorResponse(response);
    expect(error.message).toContain('invalid');
  });
});

// ─── 429 → RateLimitError ────────────────────────────────────────────────────

describe('parseErrorResponse — rate limit errors', () => {
  it('maps 429 to RateLimitError with delta-seconds Retry-After', async () => {
    const response = mockResponse(429, { code: 'RATE_LIMIT_EXCEEDED' }, { 'Retry-After': '30' });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(30);
  });

  it('defaults retryAfter to 60 when Retry-After header is absent', async () => {
    const response = mockResponse(429, {});
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(60);
  });

  it('parses HTTP-date Retry-After header', async () => {
    const futureDate = new Date(Date.now() + 45_000).toUTCString();
    const response = mockResponse(429, {}, { 'Retry-After': futureDate });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(RateLimitError);
    // Allow a small delta for test execution time
    expect((error as RateLimitError).retryAfter).toBeGreaterThan(40);
    expect((error as RateLimitError).retryAfter).toBeLessThanOrEqual(46);
  });
});

// ─── 400 / 422 → ValidationError ────────────────────────────────────────────

describe('parseErrorResponse — validation errors', () => {
  it('maps 400 with field errors to ValidationError', async () => {
    const response = mockResponse(400, {
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      requestId: 'req-val',
      errors: [
        { field: 'booking.seats', message: 'At least one seat is required' },
        { field: 'booking.sessionId', message: 'Must be a valid session ID' },
      ],
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fields['booking.seats']).toBe('At least one seat is required');
    expect((error as ValidationError).fields['booking.sessionId']).toBe('Must be a valid session ID');
    expect(error.requestId).toBe('req-val');
  });

  it('maps 422 to ValidationError', async () => {
    const response = mockResponse(422, {
      code: 'INVALID_PARAMETER',
      message: 'Unprocessable entity',
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400); // ValidationError normalises to 400
  });

  it('ValidationError has empty fields map when no errors array present', async () => {
    const response = mockResponse(400, { message: 'Bad request' });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fields).toEqual({});
  });
});

// ─── 404 → NotFoundError ─────────────────────────────────────────────────────

describe('parseErrorResponse — not found errors', () => {
  it('maps 404 with SESSION_NOT_FOUND code to NotFoundError', async () => {
    const response = mockResponse(404, { code: 'SESSION_NOT_FOUND' });
    const error = await parseErrorResponse(
      response,
      'https://api.vista.co/sessions/sess-001'
    );
    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).resource).toBe('Session');
    expect((error as NotFoundError).resourceId).toBe('sess-001');
  });

  it('maps 404 with FILM_NOT_FOUND to NotFoundError', async () => {
    const response = mockResponse(404, { code: 'FILM_NOT_FOUND' });
    const error = await parseErrorResponse(
      response,
      'https://api.vista.co/films/tt-0111161'
    );
    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).resource).toBe('Film');
    expect((error as NotFoundError).resourceId).toBe('tt-0111161');
  });

  it('falls back to URL-inferred resource name when code is unknown', async () => {
    const response = mockResponse(404, {});
    const error = await parseErrorResponse(
      response,
      'https://api.vista.co/orders/ord-9876'
    );
    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).resourceId).toBe('ord-9876');
  });
});

// ─── 5xx → ServerError ───────────────────────────────────────────────────────

describe('parseErrorResponse — server errors', () => {
  it('maps 500 to ServerError', async () => {
    const response = mockResponse(500, {
      code: 'INTERNAL_ERROR',
      requestId: 'req-srv',
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ServerError);
    expect(error.requestId).toBe('req-srv');
  });

  it('maps 503 to ServerError', async () => {
    const response = mockResponse(503, { message: 'Service unavailable' });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(500); // ServerError normalises to 500
  });
});

// ─── Unknown / malformed bodies ───────────────────────────────────────────────

describe('parseErrorResponse — edge cases', () => {
  it('handles empty response body gracefully', async () => {
    const response = mockTextResponse(500, '');
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ServerError);
  });

  it('handles non-JSON body gracefully', async () => {
    const response = mockTextResponse(400, 'Bad request');
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toContain('400');
  });

  it('handles OCAPI-style error envelope', async () => {
    const response = mockResponse(401, {
      fault: {
        type: 'InvalidAccessTokenException',
        message: 'Access token is invalid.',
      },
    });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Access token is invalid.');
  });

  it('falls back to TheatricalError for unexpected 2-digit status ranges', async () => {
    // 409 Conflict — not explicitly handled, falls through to generic
    const response = mockResponse(409, { message: 'Conflict' });
    const error = await parseErrorResponse(response);
    expect(error).toBeInstanceOf(TheatricalError);
    expect(error.statusCode).toBe(409);
  });
});
