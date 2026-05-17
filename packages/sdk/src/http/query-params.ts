export type QueryValue = string | number | boolean | undefined | null;

export function serializeQueryParams(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

export function parseQueryString(query: string): Record<string, string> {
  const result: Record<string, string> = {};
  const cleaned = query.startsWith('?') ? query.slice(1) : query;
  if (!cleaned) return result;
  for (const pair of cleaned.split('&')) {
    const [key, value] = pair.split('=');
    if (key) result[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return result;
}
