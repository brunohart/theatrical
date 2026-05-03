import { describe, it, expect } from 'vitest';
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
