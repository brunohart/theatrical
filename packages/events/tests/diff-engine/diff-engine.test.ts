import { describe, expect, it } from 'vitest';
import { diff } from '../../src/diff-engine';

interface Item {
  id: string;
  name: string;
  status?: string;
}

describe('diff()', () => {
  it('returns empty array when both lists are identical', () => {
    const items: Item[] = [{ id: 'a', name: 'Alpha' }];
    expect(diff(items, items)).toHaveLength(0);
  });

  it('detects added items (present in current, absent from previous)', () => {
    const current: Item[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    const previous: Item[] = [{ id: 'a', name: 'Alpha' }];
    const events = diff(current, previous);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('added');
    expect(events[0].item.id).toBe('b');
    expect(events[0].previous).toBeUndefined();
  });

  it('detects removed items (absent from current, present in previous)', () => {
    const current: Item[] = [{ id: 'a', name: 'Alpha' }];
    const previous: Item[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    const events = diff(current, previous);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('removed');
    expect(events[0].item.id).toBe('b');
  });

  it('detects changed items (same id, different content)', () => {
    const current: Item[] = [{ id: 'a', name: 'Alpha', status: 'confirmed' }];
    const previous: Item[] = [{ id: 'a', name: 'Alpha', status: 'pending' }];
    const events = diff(current, previous);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('changed');
    expect(events[0].item.status).toBe('confirmed');
    expect(events[0].previous?.status).toBe('pending');
  });

  it('returns all three event types in a single diff', () => {
    const current: Item[] = [
      { id: 'a', name: 'Alpha', status: 'confirmed' },
      { id: 'c', name: 'Gamma' },
    ];
    const previous: Item[] = [
      { id: 'a', name: 'Alpha', status: 'pending' },
      { id: 'b', name: 'Beta' },
    ];
    const events = diff(current, previous);
    expect(events.map((e) => e.type).sort()).toEqual(['added', 'changed', 'removed']);
  });

  it('handles empty previous (all items added)', () => {
    const current: Item[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    const events = diff(current, []);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.type === 'added')).toBe(true);
  });

  it('handles empty current (all items removed)', () => {
    const previous: Item[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    const events = diff([], previous);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.type === 'removed')).toBe(true);
  });

  it('handles both lists empty', () => {
    expect(diff([], [])).toHaveLength(0);
  });

  it('is pure — does not mutate input arrays', () => {
    const current: Item[] = [{ id: 'a', name: 'Alpha' }];
    const previous: Item[] = [{ id: 'b', name: 'Beta' }];
    const currentCopy = JSON.stringify(current);
    const previousCopy = JSON.stringify(previous);
    diff(current, previous);
    expect(JSON.stringify(current)).toBe(currentCopy);
    expect(JSON.stringify(previous)).toBe(previousCopy);
  });
});
