import { createHmac } from 'node:crypto';

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
  if (expected.length !== receivedSignature.length) return false;

  // Constant-time comparison
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(receivedSignature, 'hex');
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}
