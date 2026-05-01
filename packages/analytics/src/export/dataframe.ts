import type { HorizonQueryResult } from '../types';
import type { DataFrame, DataFrameExportOptions } from './types';

function inferColumnType(values: Array<string | number | null>): 'string' | 'number' | 'null' {
  for (const v of values) {
    if (v === null) continue;
    return typeof v === 'number' ? 'number' : 'string';
  }
  return 'null';
}

/**
 * Converts a Horizon query result into a column-oriented DataFrame.
 *
 * The DataFrame format is compatible with pandas DataFrames, Apache Arrow,
 * and most BI charting libraries. Each column is a named array of values.
 *
 * @example
 * ```ts
 * const df = toDataFrame(result);
 * // df.data['admissions'] → [1850, 2100, 975, ...]
 * // df.columns → ['film', 'site', 'admissions']
 * ```
 */
export function toDataFrame(result: HorizonQueryResult, options: DataFrameExportOptions = {}): DataFrame {
  const { columns: requestedCols } = options;

  const cols = requestedCols ?? (result.rows.length > 0 ? Object.keys(result.rows[0]) : []);

  const data: Record<string, Array<string | number | null>> = {};
  for (const col of cols) {
    data[col] = result.rows.map((row) => row[col] ?? null);
  }

  const columnTypes: Record<string, 'string' | 'number' | 'null'> = {};
  for (const col of cols) {
    columnTypes[col] = inferColumnType(data[col]);
  }

  return {
    columns: cols,
    columnTypes,
    data,
    rowCount: result.rows.length,
  };
}
