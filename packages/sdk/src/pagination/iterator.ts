import type { PaginatedResponse } from '../types/pagination';

export type PageFetcher<T> = (offset: number, limit: number) => Promise<PaginatedResponse<T>>;

export async function* paginate<T>(
  fetcher: PageFetcher<T>,
  pageSize = 50,
): AsyncGenerator<T, void, undefined> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetcher(offset, pageSize);
    for (const item of page.data) {
      yield item;
    }
    hasMore = page.hasMore;
    offset += page.data.length;
  }
}

export async function collectAll<T>(
  generator: AsyncGenerator<T, void, undefined>,
  maxItems = Infinity,
): Promise<T[]> {
  const items: T[] = [];
  for await (const item of generator) {
    items.push(item);
    if (items.length >= maxItems) break;
  }
  return items;
}
