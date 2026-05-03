import { describe, it, expect } from 'vitest';
import { toCSV } from '../../src/export/csv';
import type { HorizonQueryResult } from '../../src/types';

const NZ_FILM_RESULT: HorizonQueryResult = {
  rows: [
    { film: 'The Wild Robot', site: 'Embassy Theatre Wellington', admissions: 1850, revenue: 29970.50 },
    { film: 'Conclave', site: 'Roxy Cinema Miramar', admissions: 2100, revenue: 34020.00 },
    { film: 'Paddington in Peru', site: 'Penthouse Cinema', admissions: 975, revenue: 15787.50 },
    { film: 'The Brutalist', site: 'Embassy Theatre Wellington', admissions: 620, revenue: 10044.00 },
  ],
  total: 4,
  hasMore: false,
  queryTimeMs: 142,
};

const EMPTY_RESULT: HorizonQueryResult = {
  rows: [],
  total: 0,
  hasMore: false,
  queryTimeMs: 8,
};

describe('toCSV()', () => {
  it('produces header row + data rows by default', () => {
    const csv = toCSV(NZ_FILM_RESULT);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('film,site,admissions,revenue');
    expect(lines).toHaveLength(5);
  });

  it('omits header row when includeHeaders is false', () => {
    const csv = toCSV(NZ_FILM_RESULT, { includeHeaders: false });
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('The Wild Robot');
    expect(lines).toHaveLength(4);
  });

  it('respects custom delimiter', () => {
    const csv = toCSV(NZ_FILM_RESULT, { delimiter: '\t' });
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe('film\tsite\tadmissions\trevenue');
  });

  it('filters and orders columns when columns option provided', () => {
    const csv = toCSV(NZ_FILM_RESULT, { columns: ['film', 'admissions'] });
    const header = csv.split('\n')[0];
    expect(header).toBe('film,admissions');
    expect(csv).not.toContain('revenue');
  });

  it('escapes values containing the delimiter', () => {
    const result: HorizonQueryResult = {
      rows: [{ name: 'Hart, Bruno', value: 42 }],
      total: 1,
      hasMore: false,
      queryTimeMs: 5,
    };
    const csv = toCSV(result);
    expect(csv).toContain('"Hart, Bruno"');
  });

  it('escapes values containing double-quotes', () => {
    const result: HorizonQueryResult = {
      rows: [{ title: 'She said "hello"', count: 1 }],
      total: 1,
      hasMore: false,
      queryTimeMs: 5,
    };
    const csv = toCSV(result);
    expect(csv).toContain('"She said ""hello"""');
  });

  it('represents null values as empty strings', () => {
    const result: HorizonQueryResult = {
      rows: [{ film: 'Test', revenue: null }],
      total: 1,
      hasMore: false,
      queryTimeMs: 5,
    };
    const csv = toCSV(result);
    expect(csv.trim().split('\n')[1]).toBe('Test,');
  });

  it('returns empty string for empty result with no columns option', () => {
    expect(toCSV(EMPTY_RESULT)).toBe('');
  });

  it('returns header row for empty result when columns specified', () => {
    const csv = toCSV(EMPTY_RESULT, { columns: ['film', 'admissions'] });
    expect(csv.trim()).toBe('film,admissions');
  });
});
