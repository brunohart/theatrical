/**
 * @module inspect
 * Barrel export for the inspect subsystem.
 */

export { formatResponse, highlightJSON, formatDuration, formatCount, formatTable } from './formatter.js';
export { resolveRoute, buildRequestUrl, VALID_RESOURCES, VALID_ACTIONS } from './routes.js';
export type {
  InspectResource,
  InspectAction,
  InspectOptions,
  InspectResult,
  ResourceRoute,
} from './types.js';
