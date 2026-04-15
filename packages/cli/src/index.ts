/**
 * @module @theatrical/cli
 * Developer CLI for cinema platform APIs.
 *
 * Commands:
 * - `theatrical init`     — Scaffold a new project with SDK integration
 * - `theatrical codegen`  — Generate TypeScript types from OpenAPI specs
 * - `theatrical inspect`  — Interactive API explorer with formatted output
 *
 * @example
 * ```bash
 * # Initialize a new cinema app project
 * theatrical init my-cinema-app --template default
 *
 * # Generate types from a Vista OpenAPI spec
 * theatrical codegen --spec ./openapi.yaml --output ./src/types
 *
 * # Explore API responses interactively
 * theatrical inspect sessions list --site abc123 --date 2026-04-15
 * ```
 */

import { Command } from 'commander';
import { printBanner } from './utils/output.js';
import { resolveConfig } from './utils/config.js';
import { createInitCommand } from './commands/init.js';
import { createCodegenCommand } from './commands/codegen.js';
import { createInspectCommand } from './commands/inspect.js';

/** Package version — injected at build time, fallback for development */
const VERSION = '0.1.0';

/**
 * Create and configure the root Commander program.
 *
 * This is the main entry point for the CLI. It sets up the root command,
 * global options, and registers subcommands. Each subcommand is defined
 * in its own module under `./commands/`.
 *
 * @returns Configured Commander program ready to parse argv
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('theatrical')
    .description('Developer toolkit for cinema platform APIs')
    .version(VERSION, '-v, --version', 'Display the CLI version')
    .option('--no-color', 'Disable colored output')
    .option('--verbose', 'Enable verbose logging')
    .option(
      '--format <format>',
      'Output format: json, table, or pretty',
      'pretty'
    )
    .option('--config <path>', 'Path to config file')
    .option('--api-url <url>', 'Override the API base URL')
    .option('--api-key <key>', 'API authentication key')
    .hook('preAction', async (thisCommand) => {
      const opts = thisCommand.opts();

      // Resolve configuration with CLI flags as overrides
      const config = await resolveConfig({
        verbose: opts.verbose ?? undefined,
        color: opts.color ?? undefined,
        outputFormat: opts.format ?? undefined,
        apiUrl: opts.apiUrl ?? undefined,
        apiKey: opts.apiKey ?? undefined,
      });

      // Attach resolved config to the command for subcommands to access
      thisCommand.setOptionValue('resolvedConfig', config);

      // Print banner in verbose mode
      if (config.verbose) {
        printBanner(VERSION);
      }
    });

  // Register all subcommands
  program.addCommand(createInitCommand());
  program.addCommand(createCodegenCommand());
  program.addCommand(createInspectCommand());

  return program;
}

/**
 * Run the CLI program with process.argv.
 * This is called from the bin entry point.
 */
export async function run(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}
