import type { HorizonQueryResult, ResultRow } from '../types';

/**
 * Options for CSV export.
 */
export interface CsvExportOptions {
  /** Column delimiter (default: ',') */
  delimiter?: string;
  /** Whether to include a header row (default: true) */
  includeHeaders?: boolean;
  /** Ordered column names to include. If omitted, all columns from the first row are used. */
  columns?: string[];
}

/**
 * Options for JSON export.
 */
export interface JsonExportOptions {
  /** Whether to pretty-print the output (default: false) */
  pretty?: boolean;
  /** Whether to include query metadata (total, queryTimeMs, hasMore) in the output (default: false) */
  includeMetadata?: boolean;
}

/**
 * Column-oriented DataFrame representation of a query result.
 *
 * Each column is a named array of values. This format is compatible with
 * pandas DataFrames, Apache Arrow, and most BI charting libraries.
 */
export interface DataFrame {
  /** Ordered column names */
  columns: string[];
  /** Inferred column types */
  columnTypes: Record<string, 'string' | 'number' | 'null'>;
  /** Column-oriented data — parallel arrays, one per column */
  data: Record<string, Array<string | number | null>>;
  /** Total row count (from the query result envelope) */
  rowCount: number;
}

/**
 * Chart.js / D3-compatible dataset structure.
 */
export interface ChartDataset {
  /** Metric name used as the dataset label */
  label: string;
  /** Numeric values aligned with `labels` */
  data: number[];
}

/**
 * Chart-ready data extracted from a Horizon result.
 */
export interface ChartData {
  /** Labels derived from the chosen dimension (x-axis categories) */
  labels: string[];
  /** One dataset per requested metric */
  datasets: ChartDataset[];
}

/**
 * Options for chart data export.
 */
export interface ChartExportOptions {
  /** Dimension field to use as chart labels (default: first dimension in the result) */
  labelDimension?: string;
  /** Metric fields to include as datasets (default: all metrics present in rows) */
  valueMetrics?: string[];
}

/**
 * Options for DataFrame export.
 */
export interface DataFrameExportOptions {
  /** Ordered column names to include. If omitted, all columns from the first row are used. */
  columns?: string[];
}

export type { HorizonQueryResult, ResultRow };
