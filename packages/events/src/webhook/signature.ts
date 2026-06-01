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

/**
 * Verify a webhook signature against a received signature header.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param payload - The raw JSON string body received
 * @param secret - The shared secret for this endpoint
 * @param receivedSignature - The signature from the X-Theatrical-Signature header
 * @returns true if the signature is valid
 */
export function verifySignature(
  payload: string,
  secret: string,
  receivedSignature: string,
): boolean {
  const expected = computeSignature(payload, secret);

  // Accept either the raw hex digest or the "sha256=<hex>" header form.
  const received = receivedSignature.startsWith('sha256=')
    ? receivedSignature.slice('sha256='.length)
    : receivedSignature;

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(received, 'hex');

  // Length check first: timingSafeEqual throws on unequal-length buffers.
  // A mismatched length already means the signature is invalid, so this
  // does not leak anything useful about the secret.
  if (a.length !== b.length) return false;

  // Constant-time comparison — prevents timing attacks on signature verification.
  return timingSafeEqual(a, b);
}
