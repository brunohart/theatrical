import { describe, it, expect } from 'vitest';
import {
  TheatricalError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
} from '../src/errors';

describe('Error classes', () => {
  it('TheatricalError serialises to JSON', () => {
    const err = new TheatricalError('something broke', 500, 'VISTA_ERR', 'req-123');
    const json = err.toJSON();

    expect(json.name).toBe('TheatricalError');
    expect(json.message).toBe('something broke');
    expect(json.statusCode).toBe(500);
    expect(json.vistaErrorCode).toBe('VISTA_ERR');
    expect(json.requestId).toBe('req-123');
  });

  it('AuthenticationError defaults to 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe('AuthenticationError');
  });

  it('RateLimitError captures retryAfter', () => {
    const err = new RateLimitError(30, 'req-456');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toContain('30');
  });

  it('ValidationError stores field-level errors', () => {
    const err = new ValidationError('Invalid input', { email: 'required' });
    expect(err.statusCode).toBe(400);
    expect(err.fields.email).toBe('required');
  });

  it('NotFoundError identifies resource and id', () => {
    const err = new NotFoundError('Film', 'tt-1234');
    expect(err.statusCode).toBe(404);
    expect(err.resource).toBe('Film');
    expect(err.resourceId).toBe('tt-1234');
    expect(err.message).toContain('tt-1234');
  });

  it('ServerError defaults to 500', () => {
    const err = new ServerError();
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('ServerError');
  });

  it('all errors extend TheatricalError', () => {
    expect(new AuthenticationError()).toBeInstanceOf(TheatricalError);
    expect(new RateLimitError(10)).toBeInstanceOf(TheatricalError);
    expect(new ValidationError('bad')).toBeInstanceOf(TheatricalError);
    expect(new NotFoundError('Film', '1')).toBeInstanceOf(TheatricalError);
    expect(new ServerError()).toBeInstanceOf(TheatricalError);
  });
});
