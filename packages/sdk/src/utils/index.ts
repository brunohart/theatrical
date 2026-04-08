/**
 * Utility functions for the Theatrical SDK
 */

/** Format a date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}

/** Check if a string is a valid ISO date */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export { validateConfig } from './validate-config';
