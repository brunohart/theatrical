/**
 * @module output
 * Colored terminal output utilities for the Theatrical CLI.
 *
 * Provides semantic formatting functions that wrap chalk for consistent
 * output styling across all CLI commands. Using these helpers instead of
 * raw chalk ensures visual consistency and makes it easy to adjust the
 * color palette in one place.
 */

import chalk from 'chalk';

/** Format a success message (green) */
export function success(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/** Format an error message (red) */
export function error(message: string): string {
  return chalk.red(`✗ ${message}`);
}

/** Format a warning message (yellow) */
export function warning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/** Format an info message (blue) */
export function info(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/** Format a dim/secondary message */
export function dim(message: string): string {
  return chalk.dim(message);
}

/** Format a label (bold) */
export function label(message: string): string {
  return chalk.bold(message);
}

/** Format a highlighted value (cyan) */
export function highlight(message: string): string {
  return chalk.cyan(message);
}

/** Format a URL or path (underline + cyan) */
export function link(url: string): string {
  return chalk.cyan.underline(url);
}

/**
 * Print a styled header banner for the CLI.
 *
 * @example
 * ```
 * printBanner('0.1.0');
 * // ┌──────────────────────────────┐
 * // │  🎬 Theatrical CLI v0.1.0    │
 * // │  Cinema Platform Dev Tools   │
 * // └──────────────────────────────┘
 * ```
 */
export function printBanner(version: string): void {
  const width = 32;
  const top = `┌${'─'.repeat(width)}┐`;
  const bottom = `└${'─'.repeat(width)}┘`;
  const pad = (text: string, len: number) =>
    text + ' '.repeat(Math.max(0, len - stripAnsi(text).length));

  console.log(chalk.dim(top));
  console.log(
    chalk.dim('│') +
      '  ' +
      pad(chalk.bold(`🎬 Theatrical CLI v${version}`), width - 2) +
      chalk.dim('│')
  );
  console.log(
    chalk.dim('│') +
      '  ' +
      pad(chalk.dim('Cinema Platform Dev Tools'), width - 2) +
      chalk.dim('│')
  );
  console.log(chalk.dim(bottom));
}

/**
 * Format a key-value pair for display.
 *
 * @example
 * ```
 * keyValue('API Endpoint', 'https://api.vista.co/v2');
 * // => "API Endpoint: https://api.vista.co/v2"
 * ```
 */
export function keyValue(key: string, value: string): string {
  return `${chalk.bold(key)}: ${chalk.cyan(value)}`;
}

/**
 * Format a section heading with an underline.
 */
export function heading(text: string): string {
  return `\n${chalk.bold.white(text)}\n${chalk.dim('─'.repeat(text.length))}`;
}

/**
 * Strip ANSI escape codes from a string for length calculations.
 */
function stripAnsi(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}
