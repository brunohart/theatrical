/**
 * Base error class for all Theatrical SDK errors
 */
export class TheatricalError extends Error {
  readonly statusCode: number;
  readonly vistaErrorCode?: string;
  readonly requestId?: string;

  constructor(message: string, statusCode: number, vistaErrorCode?: string, requestId?: string) {
    super(message);
    this.name = 'TheatricalError';
    this.statusCode = statusCode;
    this.vistaErrorCode = vistaErrorCode;
    this.requestId = requestId;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      vistaErrorCode: this.vistaErrorCode,
      requestId: this.requestId,
    };
  }
}

export class AuthenticationError extends TheatricalError {
  constructor(message = 'Authentication failed', vistaErrorCode?: string, requestId?: string) {
    super(message, 401, vistaErrorCode, requestId);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends TheatricalError {
  readonly retryAfter: number;

  constructor(retryAfter: number, requestId?: string) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, 429, undefined, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends TheatricalError {
  readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}, requestId?: string) {
    super(message, 400, undefined, requestId);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends TheatricalError {
  readonly resource: string;
  readonly resourceId: string;

  constructor(resource: string, resourceId: string, requestId?: string) {
    super(`${resource} '${resourceId}' not found`, 404, undefined, requestId);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

export class ServerError extends TheatricalError {
  constructor(message = 'Internal server error', requestId?: string) {
    super(message, 500, undefined, requestId);
    this.name = 'ServerError';
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────
export { parseErrorResponse } from './parser';
export type { VistaErrorBody, VistaErrorEnvelope, VistaFieldError, OcapiErrorEnvelope } from './types';
export { VISTA_ERROR_CODES, VISTA_ERROR_MESSAGES, resolveVistaMessage } from './codes';
export type { VistaErrorCode } from './codes';
