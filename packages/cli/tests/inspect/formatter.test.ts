import { describe, it, expect } from 'vitest';
import {
  highlightJSON,
  formatDuration,
  formatResponse,
  formatCount,
  formatTable,
} from '../../src/inspect/formatter';

describe('highlightJSON', () => {
  it('formats null values', () => {
    const result = highlightJSON(null, { color: false });
    expect(result).toBe('null');
  });

  it('formats string values', () => {
    const result = highlightJSON('hello', { color: false });
    expect(result).toBe('"hello"');
  });

  it('formats number values', () => {
    const result = highlightJSON(42, { color: false });
    expect(result).toBe('42');
  });

  it('formats boolean values', () => {
    const result = highlightJSON(true, { color: false });
    expect(result).toBe('true');
  });

  it('formats empty arrays', () => {
    const result = highlightJSON([], { color: false });
    expect(result).toBe('[]');
  });

  it('formats empty objects', () => {
    const result = highlightJSON({}, { color: false });
    expect(result).toBe('{}');
  });

  it('formats nested objects without color', () => {
    const data = { name: 'Roxy Cinema', screens: 3, active: true };
    const result = highlightJSON(data, { color: false });
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('formats arrays without color', () => {
    const data = [1, 2, 3];
    const result = highlightJSON(data, { color: false });
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it('produces output containing the value regardless of color setting', () => {
    const result = highlightJSON('test', { color: true });
    expect(result).toContain('test');
  });

  it('truncates long strings', () => {
    const longStr = 'a'.repeat(200);
    const result = highlightJSON(longStr, { color: false, maxStringLength: 50 });
    // Should contain truncated content
    expect(result.length).toBeLessThan(210);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds under 1 second', () => {
    expect(formatDuration(142)).toBe('142ms');
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds under 1 minute', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(59999)).toBe('60.0s');
  });

  it('formats minutes', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(135000)).toBe('2m 15s');
  });
});

describe('formatResponse', () => {
  it('includes body content', () => {
    const result = formatResponse({ id: 1 }, { color: false });
    expect(result).toContain('"id"');
    expect(result).toContain('1');
  });

  it('includes timing when provided', () => {
    const result = formatResponse(
      { ok: true },
      { color: false, timing: { startMs: 0, endMs: 142 } }
    );
    expect(result).toContain('142ms');
  });

  it('includes method and status in header', () => {
    const result = formatResponse(
      {},
      { color: false, method: 'GET', statusCode: 200 }
    );
    expect(result).toContain('GET');
    expect(result).toContain('200');
  });
});

describe('formatCount', () => {
  it('counts array items', () => {
    const result = formatCount([1, 2, 3]);
    expect(result).toContain('3 items');
  });

  it('handles singular item', () => {
    const result = formatCount([1]);
    expect(result).toContain('1 item');
    expect(result).not.toContain('items');
  });

  it('counts object fields', () => {
    const result = formatCount({ a: 1, b: 2 });
    expect(result).toContain('2 fields');
  });

  it('returns empty string for non-object values', () => {
    expect(formatCount('string')).toBe('');
    expect(formatCount(42)).toBe('');
  });
});

describe('formatTable', () => {
  it('formats rows as an aligned table', () => {
    const rows = [
      { name: 'Roxy Cinema', city: 'Wellington', screens: 3 },
      { name: 'Embassy Theatre', city: 'Wellington', screens: 1 },
    ];
    const result = formatTable(rows);
    expect(result).toContain('name');
    expect(result).toContain('city');
    expect(result).toContain('Roxy Cinema');
    expect(result).toContain('Embassy Theatre');
  });

  it('handles empty rows', () => {
    const result = formatTable([]);
    expect(result).toContain('no results');
  });

  it('respects column selection', () => {
    const rows = [{ a: 1, b: 2, c: 3 }];
    const result = formatTable(rows, ['a', 'c']);
    expect(result).toContain('a');
    expect(result).toContain('c');
    expect(result).not.toContain('  b  ');
  });
});
