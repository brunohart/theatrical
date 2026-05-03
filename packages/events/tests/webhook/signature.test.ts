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
