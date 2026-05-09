import type { TheatricalEvent, EventCategory } from './types';

export type EventFilter = (event: TheatricalEvent) => boolean;

export function byCategory(category: EventCategory): EventFilter {
  return (event) => event.category === category;
}

export function bySite(siteId: string): EventFilter {
  return (event) => {
    const data = event.data as Record<string, unknown>;
    return data?.siteId === siteId;
  };
}

export function combinedFilter(...filters: EventFilter[]): EventFilter {
  return (event) => filters.every(f => f(event));
}
