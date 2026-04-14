/**
 * @module utils
 * Barrel export for CLI utility modules.
 *
 * Re-exports output formatting and configuration management utilities
 * so commands can import from a single path:
 *
 * @example
 * ```typescript
 * import { success, error, resolveConfig } from '../utils/index.js';
 * ```
 */

export {
  success,
  error,
  warning,
  info,
  dim,
  label,
  highlight,
  link,
  printBanner,
  keyValue,
  heading,
} from './output.js';

export {
  resolveConfig,
  saveUserConfig,
  getUserConfigPath,
  type TheatricalCLIConfig,
} from './config.js';
