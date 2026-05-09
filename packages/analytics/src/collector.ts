import type { AnalyticsEvent, MetricPoint } from './types';

export class MetricCollector {
  private buffer: MetricPoint[] = [];
  private readonly maxBufferSize: number;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = maxBufferSize;
  }

  record(name: string, value: number, tags: Record<string, string> = {}): void {
    const point: MetricPoint = { name, value, timestamp: Date.now(), tags };
    this.buffer.push(point);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush(): MetricPoint[] {
    const points = [...this.buffer];
    this.buffer = [];
    return points;
  }

  get pendingCount(): number {
    return this.buffer.length;
  }
}

export class EventTracker {
  private events: AnalyticsEvent[] = [];

  track(name: string, properties: Record<string, string | number | boolean> = {}): void {
    this.events.push({ name, properties, timestamp: Date.now() });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}
