/**
 * @module inspect/formatter
 * JSON syntax highlighting and response formatting for the inspect command.
 *
 * Transforms raw API responses into readable, syntax-highlighted terminal output.
 * Supports JSON pretty-printing with semantic coloring: strings in green, numbers
 * in cyan, booleans in yellow, nulls dimmed, keys bold.
 */

import chalk from 'chalk';

/** Configuration for response formatting */
export interface FormatOptions {
  /** Enable syntax highlighting (default: true) */
  color?: boolean;
  /** Indentation size in spaces (default: 2) */
  indent?: number;
  /** Truncate string values longer than this (default: 120) */
  maxStringLength?: number;
  /** Include response timing information */
  timing?: { startMs: number; endMs: number };
  /** HTTP status code for header display */
  statusCode?: number;
  /** HTTP method for header display */
  method?: string;
  /** Request URL for header display */
  url?: string;
}

/**
 * Format an API response for terminal display.
 *
 * Combines a response header (method, URL, status, timing) with
 * syntax-highlighted JSON body output.
 *
 * @param data - Parsed JSON response body
 * @param options - Formatting configuration
 * @returns Formatted string ready for console output
 */
export function formatResponse(data: unknown, options: FormatOptions = {}): string {
  const parts: string[] = [];

  // Response header
  if (options.method || options.url || options.statusCode) {
    parts.push(formatResponseHeader(options));
    parts.push('');
  }

  // Body
  parts.push(highlightJSON(data, options));

  // Timing footer
  if (options.timing) {
    const durationMs = options.timing.endMs - options.timing.startMs;
    parts.push('');
    parts.push(chalk.dim(`⏱  ${formatDuration(durationMs)}`));
  }

  return parts.join('\n');
}

/**
 * Syntax-highlight a JSON value for terminal display.
 *
 * Recursively walks the value tree, applying chalk colors:
 * - Keys: bold white
 * - Strings: green
 * - Numbers: cyan
 * - Booleans: yellow
 * - Null: dim
 * - Brackets/braces: dim
 *
 * @param data - Any JSON-serializable value
 * @param options - Formatting options
 * @returns Highlighted string
 */
export function highlightJSON(data: unknown, options: FormatOptions = {}): string {
  const indent = options.indent ?? 2;
  const useColor = options.color !== false;
  const maxStr = options.maxStringLength ?? 120;

  if (!useColor) {
    return JSON.stringify(data, null, indent);
  }

  return colorize(data, 0, indent, maxStr);
}

/**
 * Format the response header line showing method, URL, status, and timing.
 */
function formatResponseHeader(options: FormatOptions): string {
  const parts: string[] = [];

  if (options.method) {
    parts.push(chalk.bold.white(options.method.toUpperCase()));
  }

  if (options.url) {
    parts.push(chalk.cyan.underline(options.url));
  }

  if (options.statusCode) {
    const statusStr = String(options.statusCode);
    if (options.statusCode >= 200 && options.statusCode < 300) {
      parts.push(chalk.green(`${statusStr} OK`));
    } else if (options.statusCode >= 400 && options.statusCode < 500) {
      parts.push(chalk.yellow(`${statusStr} Client Error`));
    } else if (options.statusCode >= 500) {
      parts.push(chalk.red(`${statusStr} Server Error`));
    } else {
      parts.push(chalk.dim(statusStr));
    }
  }

  if (options.timing) {
    const durationMs = options.timing.endMs - options.timing.startMs;
    parts.push(chalk.dim(`(${formatDuration(durationMs)})`));
  }

  return parts.join(' ');
}

/**
 * Recursively colorize a JSON value.
 */
function colorize(value: unknown, depth: number, indent: number, maxStr: number): string {
  const pad = ' '.repeat(depth * indent);
  const innerPad = ' '.repeat((depth + 1) * indent);

  if (value === null) {
    return chalk.dim('null');
  }

  if (value === undefined) {
    return chalk.dim('undefined');
  }

  if (typeof value === 'string') {
    const display = value.length > maxStr
      ? value.slice(0, maxStr) + chalk.dim('…')
      : value;
    return chalk.green(`"${display}"`);
  }

  if (typeof value === 'number') {
    return chalk.cyan(String(value));
  }

  if (typeof value === 'boolean') {
    return chalk.yellow(String(value));
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return chalk.dim('[]');
    }

    const items = value.map(
      (item) => `${innerPad}${colorize(item, depth + 1, indent, maxStr)}`
    );

    return [
      chalk.dim('['),
      items.join(chalk.dim(',') + '\n'),
      `${pad}${chalk.dim(']')}`,
    ].join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return chalk.dim('{}');
    }

    const lines = entries.map(([key, val]) => {
      const colorizedKey = chalk.bold.white(`"${key}"`);
      const colorizedVal = colorize(val, depth + 1, indent, maxStr);
      return `${innerPad}${colorizedKey}${chalk.dim(':')} ${colorizedVal}`;
    });

    return [
      chalk.dim('{'),
      lines.join(chalk.dim(',') + '\n'),
      `${pad}${chalk.dim('}')}`,
    ].join('\n');
  }

  return String(value);
}

/**
 * Format a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "142ms", "1.2s", "2m 15s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a count summary for collections.
 *
 * @param data - Array or object to summarize
 * @returns Summary string (e.g., "3 items", "5 fields")
 */
export function formatCount(data: unknown): string {
  if (Array.isArray(data)) {
    return chalk.dim(`(${data.length} item${data.length === 1 ? '' : 's'})`);
  }
  if (typeof data === 'object' && data !== null) {
    const count = Object.keys(data).length;
    return chalk.dim(`(${count} field${count === 1 ? '' : 's'})`);
  }
  return '';
}

/**
 * Format tabular data as an aligned ASCII table.
 *
 * @param rows - Array of objects with uniform keys
 * @param columns - Column keys to include (defaults to all keys from first row)
 * @returns Formatted table string
 */
export function formatTable(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) {
    return chalk.dim('(no results)');
  }

  const cols = columns ?? Object.keys(rows[0]);

  // Calculate column widths
  const widths = cols.map((col) => {
    const values = rows.map((row) => String(row[col] ?? ''));
    return Math.max(col.length, ...values.map((v) => v.length));
  });

  // Header
  const header = cols
    .map((col, i) => chalk.bold(col.padEnd(widths[i])))
    .join('  ');
  const separator = widths.map((w) => chalk.dim('─'.repeat(w))).join('  ');

  // Rows
  const bodyLines = rows.map((row) =>
    cols
      .map((col, i) => String(row[col] ?? '').padEnd(widths[i]))
      .join('  ')
  );

  return [header, separator, ...bodyLines].join('\n');
}
