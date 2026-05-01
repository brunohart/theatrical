import type { HorizonQueryResult } from '../types';
import type { CsvExportOptions } from './types';

function escapeCsvValue(value: string | number | null, delimiter: string): string {
  if (value === null) return '';
  const str = String(value);
  const needsQuoting = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r');
  if (!needsQuoting) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts a Horizon query result into a CSV string.
 *
 * @example
 * ```ts
 * const csv = toCSV(result, { delimiter: ',', includeHeaders: true });
 * fs.writeFileSync('admissions.csv', csv);
 * ```
 */
export function toCSV(result: HorizonQueryResult, options: CsvExportOptions = {}): string {
  const { delimiter = ',', includeHeaders = true, columns } = options;

  if (result.rows.length === 0) {
    if (!includeHeaders || !columns?.length) return '';
    return columns.map((c) => escapeCsvValue(c, delimiter)).join(delimiter) + '\n';
  }

  const cols = columns ?? Object.keys(result.rows[0]);
  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(cols.map((c) => escapeCsvValue(c, delimiter)).join(delimiter));
  }

  for (const row of result.rows) {
    lines.push(cols.map((c) => escapeCsvValue(row[c] ?? null, delimiter)).join(delimiter));
  }

  return lines.join('\n') + '\n';
}
