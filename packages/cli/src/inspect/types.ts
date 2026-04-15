/**
 * @module inspect/types
 * Type definitions for the inspect command's resource routing and API interaction.
 */

/** Supported API resources for inspection */
export type InspectResource = 'sessions' | 'sites' | 'films' | 'orders' | 'loyalty';

/** Supported actions per resource */
export type InspectAction = 'list' | 'get' | 'search';

/** Parsed options from the inspect command */
export interface InspectOptions {
  /** Cinema site ID for scoping requests */
  site?: string;
  /** Date filter in YYYY-MM-DD format */
  date?: string;
  /** Save response to a file path */
  output?: string;
  /** Search query string */
  query?: string;
  /** Output format override */
  format?: 'json' | 'table' | 'pretty';
  /** Disable colored output */
  noColor?: boolean;
  /** API base URL override */
  apiUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Number of results to return */
  limit?: number;
}

/** Route definition mapping resource + action to API endpoint */
export interface ResourceRoute {
  /** HTTP method */
  method: 'GET' | 'POST';
  /** URL path template with :param placeholders */
  path: string;
  /** Human-readable description */
  description: string;
  /** Required options for this route */
  requiredOptions?: (keyof InspectOptions)[];
}

/** API response wrapper */
export interface InspectResult {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response body */
  data: unknown;
  /** Request timing in milliseconds */
  durationMs: number;
  /** The request URL that was called */
  url: string;
  /** HTTP method used */
  method: string;
}
