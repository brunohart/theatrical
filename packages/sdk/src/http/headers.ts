import { SDK_USER_AGENT } from '../version';

export interface RequestHeaders {
  'Content-Type': string;
  Authorization?: string;
  'User-Agent': string;
  'X-Request-Id'?: string;
  'X-SDK-Version'?: string;
}

export function createDefaultHeaders(token?: string, requestId?: string): RequestHeaders {
  const headers: RequestHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': SDK_USER_AGENT,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (requestId) headers['X-Request-Id'] = requestId;
  return headers;
}
