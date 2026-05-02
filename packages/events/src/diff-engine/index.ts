export type DiffEventType = 'added' | 'removed' | 'changed';

export interface DiffEvent<T> {
  type: DiffEventType;
  item: T;
  previous?: T;
}

/**
 * Pure diff function — no timers, no state, independently testable.
 *
 * Compares two arrays by `id`. Items present only in `current` are 'added',
 * items present only in `previous` are 'removed', items present in both where
 * JSON serialisation differs are 'changed'.
 */
export function diff<T extends { id: string }>(
  current: T[],
  previous: T[],
): DiffEvent<T>[] {
  const events: DiffEvent<T>[] = [];

  const prevMap = new Map<string, T>(previous.map((item) => [item.id, item]));
  const currMap = new Map<string, T>(current.map((item) => [item.id, item]));

  for (const item of current) {
    const prev = prevMap.get(item.id);
    if (!prev) {
      events.push({ type: 'added', item });
    } else if (JSON.stringify(item) !== JSON.stringify(prev)) {
      events.push({ type: 'changed', item, previous: prev });
    }
  }

  for (const item of previous) {
    if (!currMap.has(item.id)) {
      events.push({ type: 'removed', item });
    }
  }

  return events;
}
