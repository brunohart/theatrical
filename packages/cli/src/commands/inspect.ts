/**
 * @module commands/inspect
 * Interactive API explorer for cinema platform endpoints.
 *
 * `theatrical inspect <resource> <action> [id]`
 *
 * Makes real API calls with formatted, syntax-highlighted output.
 * Think httpie meets cinema APIs — designed for developers exploring
 * Vista's data model from the terminal.
 *
 * @example
 * ```bash
 * # List sessions at a specific site for today
 * theatrical inspect sessions list --site abc123 --date 2026-04-15
 *
 * # Get a specific film's details
 * theatrical inspect films get film_12345
 *
 * # Search sites by name
 * theatrical inspect sites search --query "Roxy Wellington"
 *
 * # Export response to a file
 * theatrical inspect orders get ord_789 --output order.json
 * ```
 */

import fs from 'fs';
import { Command } from 'commander';
import { resolveRoute, buildRequestUrl, VALID_RESOURCES, VALID_ACTIONS } from '../inspect/routes.js';
import { formatResponse, formatTable, formatCount } from '../inspect/formatter.js';
import * as output from '../utils/output.js';
import type { InspectOptions, InspectResult } from '../inspect/types.js';

/** Default API base URL — Vista Cloud sandbox */
const DEFAULT_API_URL = 'https://api.vista.co';

/**
 * Create the 'theatrical inspect' command.
 *
 * Provides an interactive API explorer that makes HTTP requests to cinema
 * platform endpoints and displays syntax-highlighted responses.
 *
 * @returns Configured Commander command
 */
export function createInspectCommand(): Command {
  return new Command('inspect')
    .description('Interactive API explorer with formatted output')
    .argument('<resource>', `API resource: ${VALID_RESOURCES.join(', ')}`)
    .argument('<action>', `Action: ${VALID_ACTIONS.join(', ')}`)
    .argument('[id]', 'Resource ID (required for "get" action)')
    .option('--site <id>', 'Cinema site ID for scoping requests')
    .option('--date <date>', 'Date filter (YYYY-MM-DD)')
    .option('-q, --query <text>', 'Search query string')
    .option('-o, --output <file>', 'Save response to file (JSON)')
    .option('-n, --limit <count>', 'Maximum results to return', parseInt)
    .option('--table', 'Display results as a table (for list actions)')
    .action(async (resource: string, action: string, id: string | undefined, cmdOptions: any) => {
      try {
        await runInspect(resource, action, id, cmdOptions);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(output.error(message));
        process.exit(1);
      }
    });
}

/**
 * Execute an inspect request.
 *
 * Resolves the route, builds the URL, makes the HTTP request,
 * and formats the response for terminal display.
 */
async function runInspect(
  resource: string,
  action: string,
  id: string | undefined,
  cmdOptions: Record<string, unknown>
): Promise<void> {
  // Validate resource
  if (!VALID_RESOURCES.includes(resource as any)) {
    throw new Error(
      `Unknown resource "${resource}". Valid resources: ${VALID_RESOURCES.join(', ')}`
    );
  }

  // Validate action
  if (!VALID_ACTIONS.includes(action as any)) {
    throw new Error(
      `Unknown action "${action}". Valid actions: ${VALID_ACTIONS.join(', ')}`
    );
  }

  // Require ID for get action
  if (action === 'get' && !id) {
    throw new Error(
      `The "get" action requires a resource ID. Usage: theatrical inspect ${resource} get <id>`
    );
  }

  // Resolve route
  const route = resolveRoute(resource, action);
  if (!route) {
    throw new Error(`No route defined for ${resource} ${action}`);
  }

  // Build options
  const options: InspectOptions = {
    site: cmdOptions.site as string | undefined,
    date: cmdOptions.date as string | undefined,
    query: cmdOptions.query as string | undefined,
    output: cmdOptions.output as string | undefined,
    limit: cmdOptions.limit as number | undefined,
    noColor: cmdOptions.noColor as boolean | undefined,
  };

  // Resolve API URL from parent command config or default
  const parent = cmdOptions.parent as Record<string, unknown> | undefined;
  const parentOptsFn = parent?.opts as (() => Record<string, unknown>) | undefined;
  const parentOpts = parentOptsFn?.() ?? {};
  const apiUrl = (parentOpts.apiUrl as string) ?? DEFAULT_API_URL;
  const apiKey = parentOpts.apiKey as string | undefined;

  // Build request URL
  const url = buildRequestUrl(route, apiUrl, options, id);

  // Display request info
  console.log(output.heading(`${route.method} ${resource}/${action}`));
  console.log(output.dim(route.description));
  console.log(output.keyValue('URL', url));
  console.log('');

  // Execute request
  const result = await executeRequest(url, route.method, apiKey);

  // Format and display response
  if (cmdOptions.table && Array.isArray(result.data)) {
    // Table format for list results
    console.log(formatCount(result.data));
    console.log(formatTable(result.data as Record<string, unknown>[]));
  } else {
    // Default: syntax-highlighted JSON
    const formatted = formatResponse(result.data, {
      color: !options.noColor,
      method: result.method,
      url: result.url,
      statusCode: result.status,
      timing: { startMs: 0, endMs: result.durationMs },
    });
    console.log(formatted);
  }

  // Save to file if requested
  if (options.output) {
    const json = JSON.stringify(result.data, null, 2);
    fs.writeFileSync(options.output, json, 'utf-8');
    console.log('');
    console.log(output.success(`Response saved to ${options.output}`));
  }
}

/**
 * Execute an HTTP request and return the parsed result.
 *
 * @param url - Full request URL
 * @param method - HTTP method
 * @param apiKey - Optional API key for Authorization header
 * @returns Parsed response with timing information
 */
export async function executeRequest(
  url: string,
  method: string,
  apiKey?: string
): Promise<InspectResult> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'theatrical-cli/0.1.0',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const startMs = performance.now();

  const response = await fetch(url, {
    method,
    headers,
  });

  const endMs = performance.now();
  const durationMs = endMs - startMs;

  // Parse response body
  let data: unknown;
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    // Try JSON parse anyway — some APIs don't set content-type properly
    try {
      data = JSON.parse(text);
    } catch {
      data = { _raw: text };
    }
  }

  // Collect response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    headers: responseHeaders,
    data,
    durationMs,
    url,
    method,
  };
}
