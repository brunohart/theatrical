import type { MetricPoint, AggregationType } from './types';

export function aggregate(points: MetricPoint[], type: AggregationType): number {
  if (points.length === 0) return 0;
  const values = points.map(p => p.value).sort((a, b) => a - b);

  switch (type) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min': return values[0];
    case 'max': return values[values.length - 1];
    case 'count': return values.length;
    case 'p50': return percentile(values, 50);
    case 'p95': return percentile(values, 95);
    case 'p99': return percentile(values, 99);
  }
}

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
