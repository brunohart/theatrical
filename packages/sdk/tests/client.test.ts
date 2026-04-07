import { describe, it, expect } from 'vitest';
import { TheatricalClient } from '../src/client';

describe('TheatricalClient', () => {
  it('instantiates with minimal config', () => {
    const client = new TheatricalClient({
      apiKey: 'test-key',
      environment: 'sandbox',
    });

    expect(client).toBeDefined();
    expect(client.sessions).toBeDefined();
    expect(client.sites).toBeDefined();
    expect(client.films).toBeDefined();
    expect(client.orders).toBeDefined();
    expect(client.loyalty).toBeDefined();
    expect(client.subscriptions).toBeDefined();
    expect(client.pricing).toBeDefined();
    expect(client.fnb).toBeDefined();
  });

  it('exposes all resource accessors', () => {
    const client = new TheatricalClient({
      apiKey: 'test-key',
      environment: 'production',
    });

    // Each resource should be a stable reference (lazy singleton)
    expect(client.sessions).toBe(client.sessions);
    expect(client.films).toBe(client.films);
  });
});
