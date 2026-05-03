import { describe, it, expect } from 'vitest';
import { toJSON } from '../../src/export/json';
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
