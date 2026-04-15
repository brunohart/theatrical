/**
 * @module inspect/routes
 * Resource routing table for the inspect command.
 *
 * Maps resource + action pairs to Vista API endpoints. This is the
 * bridge between CLI arguments and HTTP requests — think of it as
 * a lightweight API explorer that knows the shape of cinema platform APIs.
 */

import type { InspectResource, InspectAction, ResourceRoute, InspectOptions } from './types.js';

/**
 * Route table: resource → action → route definition.
 *
 * Each route specifies the HTTP method, URL path template, and any
 * required options. Path templates use :param syntax for substitution.
 */
const ROUTES: Record<InspectResource, Record<InspectAction, ResourceRoute>> = {
  sessions: {
    list: {
      method: 'GET',
      path: '/v2/sessions',
      description: 'List sessions with optional site and date filters',
    },
    get: {
      method: 'GET',
      path: '/v2/sessions/:id',
      description: 'Get a specific session by ID',
    },
    search: {
      method: 'GET',
      path: '/v2/sessions',
      description: 'Search sessions by film, site, or date',
    },
  },

  sites: {
    list: {
      method: 'GET',
      path: '/v2/sites',
      description: 'List all cinema sites',
    },
    get: {
      method: 'GET',
      path: '/v2/sites/:id',
      description: 'Get detailed site information',
    },
    search: {
      method: 'GET',
      path: '/v2/sites',
      description: 'Search sites by name or location',
    },
  },

  films: {
    list: {
      method: 'GET',
      path: '/v2/films',
      description: 'List films — now showing and coming soon',
    },
    get: {
      method: 'GET',
      path: '/v2/films/:id',
      description: 'Get full film details with cast and crew',
    },
    search: {
      method: 'GET',
      path: '/v2/films',
      description: 'Search films by title, genre, or rating',
    },
  },

  orders: {
    list: {
      method: 'GET',
      path: '/v2/orders',
      description: 'List orders for a member or site',
    },
    get: {
      method: 'GET',
      path: '/v2/orders/:id',
      description: 'Get order details with line items',
    },
    search: {
      method: 'GET',
      path: '/v2/orders',
      description: 'Search orders by date range or status',
    },
  },

  loyalty: {
    list: {
      method: 'GET',
      path: '/v2/loyalty/members',
      description: 'List loyalty members',
    },
    get: {
      method: 'GET',
      path: '/v2/loyalty/members/:id',
      description: 'Get loyalty member profile and points balance',
    },
    search: {
      method: 'GET',
      path: '/v2/loyalty/members',
      description: 'Search loyalty members by name or email',
    },
  },
};

/** List of valid resource names */
export const VALID_RESOURCES: InspectResource[] = Object.keys(ROUTES) as InspectResource[];

/** List of valid action names */
export const VALID_ACTIONS: InspectAction[] = ['list', 'get', 'search'];

/**
 * Resolve a resource + action pair to its route definition.
 *
 * @param resource - The API resource (sessions, sites, films, etc.)
 * @param action - The action to perform (list, get, search)
 * @returns The route definition, or null if the combination is invalid
 */
export function resolveRoute(
  resource: string,
  action: string
): ResourceRoute | null {
  const resourceRoutes = ROUTES[resource as InspectResource];
  if (!resourceRoutes) return null;

  const route = resourceRoutes[action as InspectAction];
  return route ?? null;
}

/**
 * Build a full request URL from a route, options, and optional ID.
 *
 * @param route - The resolved route definition
 * @param baseUrl - API base URL
 * @param options - CLI options for query parameters
 * @param id - Optional resource ID for :id substitution
 * @returns Complete URL string
 */
export function buildRequestUrl(
  route: ResourceRoute,
  baseUrl: string,
  options: InspectOptions,
  id?: string
): string {
  // Substitute path parameters
  let path = route.path;
  if (id && path.includes(':id')) {
    path = path.replace(':id', encodeURIComponent(id));
  }

  const url = new URL(path, baseUrl);

  // Add query parameters from options
  if (options.site) {
    url.searchParams.set('siteId', options.site);
  }
  if (options.date) {
    url.searchParams.set('date', options.date);
  }
  if (options.query) {
    url.searchParams.set('q', options.query);
  }
  if (options.limit) {
    url.searchParams.set('limit', String(options.limit));
  }

  return url.toString();
}
