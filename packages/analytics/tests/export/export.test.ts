import { describe, it, expect } from 'vitest';
import { toCSV } from '../../src/export/csv';
import { toJSON } from '../../src/export/json';
import { toDataFrame } from '../../src/export/dataframe';
import { toChartData } from '../../src/export/chart';
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

// ─── toCSV ───────────────────────────────────────────────────────────────────

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

// ─── toJSON ──────────────────────────────────────────────────────────────────

describe('toJSON()', () => {
  it('returns compact JSON array of rows by default', () => {
    const json = toJSON(NZ_FILM_RESULT);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(4);
    expect(parsed[0].film).toBe('The Wild Robot');
  });

  it('pretty-prints when pretty option is true', () => {
    const json = toJSON(NZ_FILM_RESULT, { pretty: true });
    expect(json).toContain('\n');
    expect(JSON.parse(json)).toHaveLength(4);
  });

  it('includes metadata envelope when includeMetadata is true', () => {
    const json = toJSON(NZ_FILM_RESULT, { includeMetadata: true });
    const parsed = JSON.parse(json) as { rows: unknown[]; metadata: Record<string, unknown> };
    expect(parsed.rows).toHaveLength(4);
    expect(parsed.metadata.total).toBe(4);
    expect(parsed.metadata.queryTimeMs).toBe(142);
    expect(parsed.metadata.hasMore).toBe(false);
  });

  it('includes nextCursor in metadata only when present', () => {
    const withCursor: HorizonQueryResult = { ...NZ_FILM_RESULT, hasMore: true, nextCursor: 'cur_abc' };
    const withoutJson = toJSON(NZ_FILM_RESULT, { includeMetadata: true });
    const withJson = toJSON(withCursor, { includeMetadata: true });

    expect(JSON.parse(withoutJson).metadata.nextCursor).toBeUndefined();
    expect(JSON.parse(withJson).metadata.nextCursor).toBe('cur_abc');
  });

  it('handles empty result', () => {
    const json = toJSON(EMPTY_RESULT);
    expect(JSON.parse(json)).toEqual([]);
  });
});

// ─── toDataFrame ─────────────────────────────────────────────────────────────

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

// ─── toChartData ─────────────────────────────────────────────────────────────

describe('toChartData()', () => {
  it('auto-detects string dimension as label and numeric fields as datasets', () => {
    const chart = toChartData(NZ_FILM_RESULT);
    expect(chart.labels).toEqual([
      'The Wild Robot',
      'Conclave',
      'Paddington in Peru',
      'The Brutalist',
    ]);
    expect(chart.datasets.map((d) => d.label)).toContain('admissions');
    expect(chart.datasets.map((d) => d.label)).toContain('revenue');
  });

  it('uses labelDimension option to pick label column', () => {
    const chart = toChartData(NZ_FILM_RESULT, { labelDimension: 'site' });
    expect(chart.labels[0]).toBe('Embassy Theatre Wellington');
  });

  it('filters datasets to specified valueMetrics', () => {
    const chart = toChartData(NZ_FILM_RESULT, { valueMetrics: ['admissions'] });
    expect(chart.datasets).toHaveLength(1);
    expect(chart.datasets[0].label).toBe('admissions');
    expect(chart.datasets[0].data).toEqual([1850, 2100, 975, 620]);
  });

  it('coerces null metric values to 0', () => {
    const sparse: HorizonQueryResult = {
      rows: [{ film: 'A', admissions: 500 }, { film: 'B', admissions: null }],
      total: 2,
      hasMore: false,
      queryTimeMs: 10,
    };
    const chart = toChartData(sparse, { labelDimension: 'film', valueMetrics: ['admissions'] });
    expect(chart.datasets[0].data).toEqual([500, 0]);
  });

  it('returns empty labels and datasets for empty result', () => {
    const chart = toChartData(EMPTY_RESULT);
    expect(chart.labels).toEqual([]);
    expect(chart.datasets).toEqual([]);
  });

  it('renders label as empty string when dimension value is null', () => {
    const result: HorizonQueryResult = {
      rows: [{ film: null, admissions: 100 }],
      total: 1,
      hasMore: false,
      queryTimeMs: 5,
    };
    const chart = toChartData(result, { labelDimension: 'film', valueMetrics: ['admissions'] });
    expect(chart.labels[0]).toBe('');
  });
});
