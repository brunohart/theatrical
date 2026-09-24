import { describe, expect, it } from 'vitest';
import { computeSignature, verifySignature } from '../../src/webhook/signature';

describe('computeSignature', () => {
  it('produces a hex-encoded HMAC-SHA256 string', () => {
    const sig = computeSignature('{"event":"test"}', 'secret-key');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces deterministic output for same payload and secret', () => {
    const payload = '{"event":"booking.confirmed","orderId":"ord-001"}';
    const a = computeSignature(payload, 'whsec_embassy');
    const b = computeSignature(payload, 'whsec_embassy');
    expect(a).toBe(b);
  });

  it('produces different signatures for different payloads', () => {
    const a = computeSignature('{"event":"booking.confirmed"}', 'key');
    const b = computeSignature('{"event":"booking.cancelled"}', 'key');
    expect(a).not.toBe(b);
  });

  it('produces different signatures for different secrets', () => {
    const payload = '{"event":"test"}';
    const a = computeSignature(payload, 'secret-one');
    const b = computeSignature(payload, 'secret-two');
    expect(a).not.toBe(b);
  });
});

describe('verifySignature', () => {
  const payload = '{"event":"session.soldout","sessionId":"ses-42"}';
  const secret = 'whsec_embassy_wellington';

  it('returns true for a valid signature', () => {
    const sig = computeSignature(payload, secret);
    expect(verifySignature(payload, secret, sig)).toBe(true);
  });

  it('returns false for a tampered payload', () => {
    const sig = computeSignature(payload, secret);
    const tampered = payload.replace('ses-42', 'ses-99');
    expect(verifySignature(tampered, secret, sig)).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    const sig = computeSignature(payload, secret);
    expect(verifySignature(payload, 'wrong-secret', sig)).toBe(false);
  });

  it('returns false for a truncated signature', () => {
    const sig = computeSignature(payload, secret);
    expect(verifySignature(payload, secret, sig.slice(0, 32))).toBe(false);
  });
});

describe('verifySignature — header hardening', () => {
  const payload = '{"event":"session.soldout","sessionId":"ses-42"}';
  const secret = 'whsec_embassy_wellington';
  const sig = computeSignature(payload, secret);

  it('rejects a valid digest followed by trailing garbage', () => {
    // Buffer.from(hex) stops at the first non-hex character, so this used to pass.
    expect(verifySignature(payload, secret, `sha256=${sig}ZZZZ`)).toBe(false);
  });

  it('returns false (does not throw) when the header is missing', () => {
    expect(verifySignature(payload, secret, undefined)).toBe(false);
    expect(verifySignature(payload, secret, null)).toBe(false);
  });

  it('accepts uppercase hex in the sha256= form', () => {
    expect(verifySignature(payload, secret, `sha256=${sig.toUpperCase()}`)).toBe(true);
  });
});

describe('verifySignature — toleranceSeconds (replay window)', () => {
  const secret = 'whsec_embassy_wellington';
  const now = Date.parse('2026-04-12T19:00:00Z');
  const body = (timestamp: string) =>
    JSON.stringify({ id: 'dlv_1', event: 'booking.confirmed', timestamp, data: {} });
  const header = (b: string) => `sha256=${computeSignature(b, secret)}`;

  it('accepts a delivery signed inside the window', () => {
    const b = body('2026-04-12T18:58:00Z');
    expect(verifySignature(b, secret, header(b), { toleranceSeconds: 300, now })).toBe(true);
  });

  it('rejects a correctly signed but stale (replayed) delivery', () => {
    const b = body('2026-04-12T18:00:00Z');
    expect(verifySignature(b, secret, header(b), { toleranceSeconds: 300, now })).toBe(false);
  });

  it('rejects a signed body with no parseable timestamp when a window is set', () => {
    const b = JSON.stringify({ id: 'dlv_1', event: 'booking.confirmed', data: {} });
    expect(verifySignature(b, secret, header(b), { toleranceSeconds: 300, now })).toBe(false);
    expect(verifySignature('not json', secret, header('not json'), { toleranceSeconds: 300, now })).toBe(false);
  });

  it('keeps the signature-only behaviour when no window is given', () => {
    const b = body('2020-01-01T00:00:00Z');
    expect(verifySignature(b, secret, header(b))).toBe(true);
  });
});
