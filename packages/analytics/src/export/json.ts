import type { HorizonQueryResult } from '../types';
import type { JsonExportOptions } from './types';

/**
 * Converts a Horizon query result into a JSON string.
 *
 * @example
 * ```ts
 * const json = toJSON(result, { pretty: true, includeMetadata: true });
 * fs.writeFileSync('report.json', json);
 * ```
 */
export function toJSON(result: HorizonQueryResult, options: JsonExportOptions = {}): string {
  const { pretty = false, includeMetadata = false } = options;
  const indent = pretty ? 2 : undefined;

  if (!includeMetadata) {
    return JSON.stringify(result.rows, null, indent);
  }

  const output = {
    rows: result.rows,
    metadata: {
      total: result.total,
      hasMore: result.hasMore,
      queryTimeMs: result.queryTimeMs,
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    },
  };

  return JSON.stringify(output, null, indent);
}
