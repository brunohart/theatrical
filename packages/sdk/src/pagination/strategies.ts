export type PaginationStrategy = 'cursor' | 'offset' | 'keyset';

export interface PaginationConfig {
  strategy: PaginationStrategy;
  defaultPageSize: number;
  maxPageSize: number;
}

export const VISTA_PAGINATION_CONFIG: PaginationConfig = {
  strategy: 'offset',
  defaultPageSize: 50,
  maxPageSize: 500,
};

export function clampPageSize(requested: number, config = VISTA_PAGINATION_CONFIG): number {
  return Math.min(Math.max(1, requested), config.maxPageSize);
}
