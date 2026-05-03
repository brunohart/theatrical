import type { MenuItem } from '@theatrical/sdk';
import { BaseWatcher, BaseWatcherConfig } from './base-watcher';

export interface InventoryLowPayload {
  item: MenuItem;
  timestamp: string;
}

export interface InventoryRestockedPayload {
  item: MenuItem;
  previous: MenuItem;
  timestamp: string;
}

export interface MenuUpdatedPayload {
  item: MenuItem;
  previous: MenuItem;
  timestamp: string;
}

export type InventoryEvents = {
  'inventory.low': InventoryLowPayload;
  'inventory.restocked': InventoryRestockedPayload;
  'menu.updated': MenuUpdatedPayload;
};

export type InventoryWatcherConfig = Omit<BaseWatcherConfig<MenuItem>, 'intervalMs'> & {
  intervalMs?: number;
};

/**
 * Watches food & beverage inventory for stock changes and menu updates.
 *
 * Events:
 * - `inventory.low` — menu item availability dropped (isAvailable became false)
 * - `inventory.restocked` — menu item became available again
 * - `menu.updated` — menu item details changed (price, description, dietary tags)
 *
 * @example
 * ```typescript
 * const watcher = new InventoryWatcher({
 *   fetch: (signal) => client.foodAndBeverage.menu({ siteId: 'site-001' }),
 * });
 * watcher.on('inventory.low', ({ item }) => alertConcessionStaff(item));
 * watcher.start();
 * ```
 */
export class InventoryWatcher extends BaseWatcher<MenuItem, InventoryEvents> {
  constructor(config: InventoryWatcherConfig) {
    super({ ...config, intervalMs: config.intervalMs ?? 30_000 });
  }

  protected handleUpdate(current: MenuItem[], previous: MenuItem[]): void {
    const timestamp = new Date().toISOString();
    const events = this.diff(current, previous);

    for (const event of events) {
      if (event.type === 'changed') {
        const prev = event.previous!;
        const curr = event.item;

        // Availability transitions
        if (prev.isAvailable && !curr.isAvailable) {
          this.emit('inventory.low', { item: curr, timestamp });
        } else if (!prev.isAvailable && curr.isAvailable) {
          this.emit('inventory.restocked', {
            item: curr,
            previous: prev,
            timestamp,
          });
        }

        // General menu item changes (price, description, dietary flags)
        const metadataChanged =
          prev.price !== curr.price ||
          prev.name !== curr.name ||
          prev.description !== curr.description ||
          JSON.stringify(prev.dietary) !== JSON.stringify(curr.dietary);

        if (metadataChanged) {
          this.emit('menu.updated', {
            item: curr,
            previous: prev,
            timestamp,
          });
        }
      }
    }
  }
}
