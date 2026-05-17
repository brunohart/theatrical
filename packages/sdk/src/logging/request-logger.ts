import { Logger } from './logger';

export class RequestLogger {
  private readonly logger: Logger;

  constructor(debug: boolean) {
    this.logger = new Logger(debug ? 'debug' : 'warn', 'theatrical:http');
  }

  logRequest(method: string, url: string, requestId?: string): void {
    this.logger.debug(`${method} ${url}`, { requestId });
  }

  logResponse(method: string, url: string, status: number, durationMs: number): void {
    this.logger.debug(`${method} ${url} → ${status} (${durationMs}ms)`, { status, durationMs });
  }

  logRetry(method: string, url: string, attempt: number, reason: string): void {
    this.logger.warn(`Retry ${attempt}: ${method} ${url} — ${reason}`);
  }

  logError(method: string, url: string, error: string): void {
    this.logger.error(`${method} ${url} failed: ${error}`);
  }
}
