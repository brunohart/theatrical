import type { HorizonQueryResult } from '../types';
import type { ChartData, ChartExportOptions } from './types';

/**
 * Converts a Horizon query result into Chart.js / D3-compatible chart data.
 *
 * One dataset is produced per metric. Labels come from the chosen dimension column.
 * Null metric values are coerced to 0 so chart libraries don't break.
 *
 * @example
 * ```ts
 * const chart = toChartData(result, {
 *   labelDimension: 'film',
 *   valueMetrics: ['admissions', 'revenue'],
 * });
 * // chart.labels → ['The Wild Robot', 'Conclave', 'Paddington in Peru']
 * // chart.datasets[0] → { label: 'admissions', data: [1850, 2100, 975] }
 * ```
 */
export function toChartData(result: HorizonQueryResult, options: ChartExportOptions = {}): ChartData {
  if (result.rows.length === 0) {
    return { labels: [], datasets: [] };
  }

  const firstRow = result.rows[0];
  const allKeys = Object.keys(firstRow);

  const labelDimension =
    options.labelDimension ?? allKeys.find((k) => typeof firstRow[k] === 'string') ?? allKeys[0];

  const numericKeys = allKeys.filter((k) => {
    const sample = result.rows.find((r) => r[k] !== null)?.[k];
    return typeof sample === 'number';
  });

  const valueMetrics = options.valueMetrics ?? numericKeys;

  const labels = result.rows.map((row) => {
    const label = row[labelDimension];
    return label === null ? '' : String(label);
  });

  const datasets = valueMetrics.map((metric) => ({
    label: metric,
    data: result.rows.map((row) => {
      const v = row[metric];
      return typeof v === 'number' ? v : 0;
    }),
  }));

  return { labels, datasets };
}
