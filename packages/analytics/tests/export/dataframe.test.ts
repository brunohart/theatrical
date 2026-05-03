import { describe, it, expect } from 'vitest';
import { toDataFrame } from '../../src/export/dataframe';
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

describe('toDataFrame()', () => {
  it('extracts columns from first row', () => {
    const df = toDataFrame(NZ_FILM_RESULT);
    expect(df.columns).toEqual(['film', 'site', 'admissions', 'revenue']);
  });

  it('builds column-oriented data arrays', () => {
    const df = toDataFrame(NZ_FILM_RESULT);
    expect(df.data['film']).toEqual([
      'The Wild Robot',
      'Conclave',
      'Paddington in Peru',
      'The Brutalist',
    ]);
    expect(df.data['admissions']).toEqual([1850, 2100, 975, 620]);
  });

  it('infers column types correctly', () => {
    const df = toDataFrame(NZ_FILM_RESULT);
    expect(df.columnTypes['film']).toBe('string');
    expect(df.columnTypes['admissions']).toBe('number');
  });

  it('reports correct rowCount', () => {
    const df = toDataFrame(NZ_FILM_RESULT);
    expect(df.rowCount).toBe(4);
  });

  it('respects columns filter option', () => {
    const df = toDataFrame(NZ_FILM_RESULT, { columns: ['film', 'admissions'] });
    expect(df.columns).toEqual(['film', 'admissions']);
    expect(Object.keys(df.data)).toEqual(['film', 'admissions']);
  });

  it('maps missing keys to null', () => {
    const sparse: HorizonQueryResult = {
      rows: [{ film: 'A', revenue: 1000 }, { film: 'B' }],
      total: 2,
      hasMore: false,
      queryTimeMs: 10,
    };
    const df = toDataFrame(sparse, { columns: ['film', 'revenue'] });
    expect(df.data['revenue']).toEqual([1000, null]);
  });

  it('handles empty result', () => {
    const df = toDataFrame(EMPTY_RESULT);
    expect(df.columns).toEqual([]);
    expect(df.rowCount).toBe(0);
  });

  it('infers null type for all-null columns', () => {
    const result: HorizonQueryResult = {
      rows: [{ film: null }],
      total: 1,
      hasMore: false,
      queryTimeMs: 5,
    };
    const df = toDataFrame(result);
    expect(df.columnTypes['film']).toBe('null');
  });
});
