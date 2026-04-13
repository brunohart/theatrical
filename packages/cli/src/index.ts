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
 * theatrical inspect sessions list --site abc123 --date 2026-04-14
 * ```
 */

import { Command } from 'commander';
import { printBanner } from './utils/output.js';
import { resolveConfig } from './utils/config.js';

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

  // Register subcommands
  // (Commands are registered as the CLI grows — init, codegen, inspect)
  registerPlaceholderCommands(program);

  return program;
}

/**
 * Register placeholder commands that will be implemented in subsequent commits.
 * Each outputs a helpful "coming soon" message with expected functionality.
 */
function registerPlaceholderCommands(program: Command): void {
  program
    .command('init [project-name]')
    .description('Scaffold a new cinema platform project')
    .option('-t, --template <template>', 'Project template to use', 'default')
    .option('--no-install', 'Skip dependency installation')
    .action(async (projectName?: string) => {
      console.log(
        `🎬 theatrical init — scaffold a new project${projectName ? ` "${projectName}"` : ''}`
      );
      console.log('   Implementation coming in the next commit.');
    });

  program
    .command('codegen')
    .description('Generate TypeScript types and Zod schemas from OpenAPI specs')
    .requiredOption('-s, --spec <path>', 'Path to OpenAPI specification file')
    .option(
      '-o, --output <dir>',
      'Output directory for generated types',
      './src/generated'
    )
    .option('--zod', 'Generate Zod schemas alongside TypeScript types', true)
    .action(async () => {
      console.log('🎬 theatrical codegen — generate types from OpenAPI');
      console.log('   Implementation coming soon.');
    });

  program
    .command('inspect <resource> <action>')
    .description('Interactive API explorer with formatted output')
    .option('--site <id>', 'Cinema site ID')
    .option('--date <date>', 'Date filter (YYYY-MM-DD)')
    .option('-o, --output <file>', 'Save response to file')
    .action(async (resource: string, action: string) => {
      console.log(`🎬 theatrical inspect ${resource} ${action}`);
      console.log('   Implementation coming soon.');
    });
}

/**
 * Run the CLI program with process.argv.
 * This is called from the bin entry point.
 */
export async function run(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}
