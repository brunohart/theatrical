export { HorizonClient } from './horizon-client';
export type {
  HorizonConfig,
  HorizonAuthMode,
  HorizonMetric,
  HorizonDimension,
  HorizonQuery,
  HorizonQueryResult,
  QueryFilter,
  FilterOperator,
  SortDirection,
  ResultRow,
} from './types';

export { QueryBuilder, FilterBuilder } from './query/index';
export type { ValidDimensionFor } from './query/index';

export type { AnalyticsProvider, TrackEvent, IdentifyEvent } from './providers/base';
export { SegmentProvider } from './providers/segment';
export type { SegmentProviderConfig } from './providers/segment';
export { WebhookProvider } from './providers/webhook';
export type { WebhookProviderConfig } from './providers/webhook';

export { toCSV, toJSON, toDataFrame, toChartData } from './export/index';
export type {
  CsvExportOptions,
  JsonExportOptions,
  DataFrameExportOptions,
  ChartExportOptions,
  DataFrame,
  ChartData,
  ChartDataset,
} from './export/index';
