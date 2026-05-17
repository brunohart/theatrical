export interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId?: string;
}

export interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99';

export interface MetricQuery {
  name: string;
  aggregation: AggregationType;
  from: string;
  to: string;
  groupBy?: string[];
  filters?: Record<string, string>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  ticketRevenue: number;
  fnbRevenue: number;
  averageOrderValue: number;
  currency: string;
  period: { from: string; to: string };
}

export interface OccupancyMetrics {
  totalSessions: number;
  totalSeats: number;
  seatsSold: number;
  occupancyRate: number;
  soldOutSessions: number;
  period: { from: string; to: string };
}
