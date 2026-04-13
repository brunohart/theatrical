/**
 * @module config
 * Configuration management for the Theatrical CLI.
 *
 * Resolves configuration from multiple sources with the following precedence:
 * 1. Command-line flags (highest)
 * 2. Environment variables (THEATRICAL_*)
 * 3. Project-local .theatricalrc / theatrical.config.js
 * 4. User-level ~/.config/theatrical/config.json
 * 5. Built-in defaults (lowest)
 *
 * Uses cosmiconfig for automatic config file discovery.
 */

import { cosmiconfig } from 'cosmiconfig';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

/** CLI configuration shape */
export interface TheatricalCLIConfig {
  /** Vista API base URL */
  apiUrl: string;
  /** API authentication key */
  apiKey?: string;
  /** Default cinema site ID for commands that accept --site */
  defaultSiteId?: string;
  /** Output format: json, table, or pretty */
  outputFormat: 'json' | 'table' | 'pretty';
  /** Enable verbose logging */
  verbose: boolean;
  /** Color output (auto-detected, can be overridden) */
  color: boolean;
  /** Custom headers to include in API requests */
  headers?: Record<string, string>;
}

/** Default configuration values */
const DEFAULTS: TheatricalCLIConfig = {
  apiUrl: 'https://api.vista.co/ocapi/v1',
  outputFormat: 'pretty',
  verbose: false,
  color: true,
};

/** Environment variable prefix */
const ENV_PREFIX = 'THEATRICAL_';

/** Config directory under user home */
const CONFIG_DIR = '.config/theatrical';
const CONFIG_FILE = 'config.json';

/**
 * Resolve the full CLI configuration by merging all sources.
 *
 * @param overrides - Command-line flag overrides (highest priority)
 * @returns Resolved configuration
 */
export async function resolveConfig(
  overrides: Partial<TheatricalCLIConfig> = {}
): Promise<TheatricalCLIConfig> {
  const fileConfig = await loadFileConfig();
  const envConfig = loadEnvConfig();

  return {
    ...DEFAULTS,
    ...fileConfig,
    ...envConfig,
    ...stripUndefined(overrides),
  };
}

/**
 * Load configuration from the nearest config file.
 * Searches up from cwd for .theatricalrc, theatrical.config.js, etc.
 */
async function loadFileConfig(): Promise<Partial<TheatricalCLIConfig>> {
  const explorer = cosmiconfig('theatrical', {
    searchPlaces: [
      '.theatricalrc',
      '.theatricalrc.json',
      '.theatricalrc.yaml',
      '.theatricalrc.yml',
      'theatrical.config.js',
      'theatrical.config.cjs',
      'theatrical.config.mjs',
      'package.json',
    ],
  });

  try {
    const result = await explorer.search();
    if (result && !result.isEmpty) {
      return result.config as Partial<TheatricalCLIConfig>;
    }
  } catch {
    // Config file exists but is malformed — fall through to defaults
  }

  // Fall back to user-level config
  return loadUserConfig();
}

/**
 * Load user-level configuration from ~/.config/theatrical/config.json.
 */
function loadUserConfig(): Partial<TheatricalCLIConfig> {
  const configPath = path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE);

  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw) as Partial<TheatricalCLIConfig>;
    }
  } catch {
    // Corrupted config — fall through
  }

  return {};
}

/**
 * Extract configuration from environment variables.
 * Maps THEATRICAL_API_URL → apiUrl, THEATRICAL_API_KEY → apiKey, etc.
 */
function loadEnvConfig(): Partial<TheatricalCLIConfig> {
  const config: Partial<TheatricalCLIConfig> = {};

  const apiUrl = process.env[`${ENV_PREFIX}API_URL`];
  if (apiUrl) config.apiUrl = apiUrl;

  const apiKey = process.env[`${ENV_PREFIX}API_KEY`];
  if (apiKey) config.apiKey = apiKey;

  const siteId = process.env[`${ENV_PREFIX}DEFAULT_SITE_ID`];
  if (siteId) config.defaultSiteId = siteId;

  const format = process.env[`${ENV_PREFIX}OUTPUT_FORMAT`];
  if (format === 'json' || format === 'table' || format === 'pretty') {
    config.outputFormat = format;
  }

  const verbose = process.env[`${ENV_PREFIX}VERBOSE`];
  if (verbose === '1' || verbose === 'true') config.verbose = true;

  const color = process.env[`${ENV_PREFIX}NO_COLOR`];
  if (color === '1' || color === 'true') config.color = false;

  return config;
}

/**
 * Save configuration to the user-level config file.
 * Creates the directory structure if it doesn't exist.
 */
export async function saveUserConfig(
  config: Partial<TheatricalCLIConfig>
): Promise<string> {
  const configDir = path.join(os.homedir(), CONFIG_DIR);
  const configPath = path.join(configDir, CONFIG_FILE);

  // Merge with existing user config
  const existing = loadUserConfig();
  const merged = { ...existing, ...config };

  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  return configPath;
}

/**
 * Get the path to the user config file.
 */
export function getUserConfigPath(): string {
  return path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE);
}

/**
 * Remove undefined values from an object so they don't override
 * lower-priority config sources during spread.
 */
function stripUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}
