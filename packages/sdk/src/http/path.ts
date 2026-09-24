import { ValidationError } from '../errors';

/**
 * Tagged template for API paths: every interpolated value is encoded as exactly
 * one path segment, so an ID can never add segments, a query string, or a fragment.
 *
 * @example apiPath`/ocapi/v1/orders/${orderId}/confirm`
 */
export function apiPath(strings: TemplateStringsArray, ...values: Array<string | number>): string {
  let out = strings[0];
  values.forEach((value, i) => {
    const segment = String(value);
    // '.' and '..' survive encodeURIComponent and are resolved by the URL parser.
    if (segment === '' || segment === '.' || segment === '..') {
      throw new ValidationError(`Invalid path parameter: ${JSON.stringify(segment)}`);
    }
    out += encodeURIComponent(segment) + strings[i + 1];
  });
  return out;
}
