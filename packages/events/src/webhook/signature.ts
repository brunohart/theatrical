import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Generate an HMAC-SHA256 signature for a webhook payload.
 *
 * The signature is computed over the raw JSON body using the endpoint's shared secret.
 * Recipients verify by computing the same HMAC and comparing in constant time.
 *
 * @param payload - The raw JSON string body
 * @param secret - The shared secret for this endpoint
 * @returns The hex-encoded HMAC-SHA256 signature
 *
 * @example
 * ```typescript
 * const body = JSON.stringify(payload);
 * const sig = computeSignature(body, endpoint.secret);
 * // Header: X-Theatrical-Signature: sha256=<sig>
 * ```
 */
export function computeSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export interface VerifySignatureOptions {
  /**
   * Reject deliveries whose signed `timestamp` is further than this from now.
   * Recommended: 300. Omit to skip the freshness check (signature only).
   */
  toleranceSeconds?: number;
  /** Override the clock (ms since epoch) — for tests. */
  now?: number;
}

/**
 * Verify a webhook signature against a received signature header.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param payload - The raw JSON string body received
 * @param secret - The shared secret for this endpoint
 * @param receivedSignature - The X-Theatrical-Signature header value (missing → false)
 * @param options - Set `toleranceSeconds` to also reject stale (replayed) deliveries
 * @returns true if the signature is valid (and, with a tolerance, fresh)
 */
export function verifySignature(
  payload: string,
  secret: string,
  receivedSignature: string | null | undefined,
  options: VerifySignatureOptions = {},
): boolean {
  if (typeof receivedSignature !== 'string') return false;

  // Accept either the raw hex digest or the "sha256=<hex>" header form.
  const received = receivedSignature.startsWith('sha256=')
    ? receivedSignature.slice('sha256='.length)
    : receivedSignature;

  // Buffer.from(hex) silently stops at the first non-hex char, so validate shape first.
  if (!/^[0-9a-f]{64}$/i.test(received)) return false;

  const expected = Buffer.from(computeSignature(payload, secret), 'hex');
  // Constant-time comparison — prevents timing attacks on signature verification.
  if (!timingSafeEqual(expected, Buffer.from(received, 'hex'))) return false;

  if (options.toleranceSeconds === undefined) return true;

  // The timestamp is inside the signed body, so it cannot be altered without breaking the HMAC.
  let sentAt: number;
  try {
    sentAt = Date.parse((JSON.parse(payload) as { timestamp?: string }).timestamp ?? '');
  } catch {
    return false;
  }
  const now = options.now ?? Date.now();
  return Number.isFinite(sentAt) && Math.abs(now - sentAt) <= options.toleranceSeconds * 1000;
}
