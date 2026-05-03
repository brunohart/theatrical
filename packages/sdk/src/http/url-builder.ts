import { serializeQueryParams, type QueryValue } from './query-params';

export class UrlBuilder {
  constructor(private readonly baseUrl: string) {}

  build(path: string, params?: Record<string, QueryValue>): string {
    const normalizedBase = this.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}${serializeQueryParams(params)}`;
  }
}
