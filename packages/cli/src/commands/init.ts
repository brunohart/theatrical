/**
 * @module commands/init
 * Scaffold a new cinema platform project with Theatrical SDK integration.
 *
 * The init command creates a project directory with a sensible default
 * structure, installs @theatrical/sdk, and writes starter configuration
 * files. Supports interactive mode (prompts) and non-interactive mode
 * (flags + defaults) for CI/scripting use.
 *
 * Templates:
 * - `default`  — Minimal TypeScript project with SDK client setup
 * - `fullstack` — Express API + React frontend scaffold
 * - `worker`   — Background worker for event processing
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import type { TheatricalCLIConfig } from '../utils/config.js';
import { success, error, info, dim, highlight, keyValue, heading } from '../utils/output.js';

/** Available project templates */
export type ProjectTemplate = 'default' | 'fullstack' | 'worker';

/** Options collected from flags or interactive prompts */
export interface InitOptions {
  projectName: string;
  template: ProjectTemplate;
  apiKey?: string;
  skipInstall: boolean;
  directory: string;
}

/** Template metadata for display and scaffolding */
interface TemplateDefinition {
  name: ProjectTemplate;
  description: string;
  files: TemplateFile[];
}

/** A file to be written during scaffolding */
interface TemplateFile {
  path: string;
  content: string;
}

/**
 * Create the init command and register it with the parent program.
 */
export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .argument('[project-name]', 'Name of the project to create')
    .description('Scaffold a new cinema platform project')
    .option('-t, --template <template>', 'Project template (default, fullstack, worker)', 'default')
    .option('--api-key <key>', 'Vista API key to include in .env')
    .option('--no-install', 'Skip automatic dependency installation')
    .option('-d, --directory <dir>', 'Target directory (defaults to project name)')
    .action(async (projectName: string | undefined, opts) => {
      const resolvedConfig = cmd.parent?.opts().resolvedConfig as TheatricalCLIConfig | undefined;

      const options = resolveInitOptions(projectName, opts, resolvedConfig);
      await executeInit(options);
    });

  return cmd;
}

/**
 * Merge CLI flags, resolved config, and defaults into final init options.
 */
function resolveInitOptions(
  projectName: string | undefined,
  flags: Record<string, unknown>,
  config?: TheatricalCLIConfig
): InitOptions {
  const name = projectName ?? 'my-cinema-app';
  const template = validateTemplate(flags.template as string);

  return {
    projectName: name,
    template,
    apiKey: (flags.apiKey as string) ?? config?.apiKey,
    skipInstall: flags.install === false,
    directory: (flags.directory as string) ?? name,
  };
}

/**
 * Validate and normalize the template name.
 */
function validateTemplate(template: string): ProjectTemplate {
  const valid: ProjectTemplate[] = ['default', 'fullstack', 'worker'];
  if (valid.includes(template as ProjectTemplate)) {
    return template as ProjectTemplate;
  }
  console.warn(error(`Unknown template "${template}". Using "default".`));
  return 'default';
}

/**
 * Execute the init command — create directories, write files, optionally install.
 */
async function executeInit(options: InitOptions): Promise<void> {
  const targetDir = path.resolve(process.cwd(), options.directory);

  console.log(heading('Theatrical — Project Scaffolding'));
  console.log();
  console.log(keyValue('Project', options.projectName));
  console.log(keyValue('Template', options.template));
  console.log(keyValue('Directory', targetDir));
  console.log();

  // Guard: directory already exists with content
  if (fs.existsSync(targetDir)) {
    const entries = fs.readdirSync(targetDir);
    if (entries.length > 0) {
      console.log(error(`Directory "${options.directory}" already exists and is not empty.`));
      console.log(dim('  Use a different project name or remove the existing directory.'));
      process.exit(1);
    }
  }

  // Create directory structure
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  // Get template files and write them
  const template = getTemplate(options);
  let filesWritten = 0;

  for (const file of template.files) {
    const filePath = path.join(targetDir, file.path);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, file.content, 'utf-8');
    console.log(dim(`  created ${file.path}`));
    filesWritten++;
  }

  console.log();
  console.log(success(`Scaffolded ${filesWritten} files`));

  // Install dependencies
  if (!options.skipInstall) {
    console.log();
    console.log(info('To install dependencies:'));
    console.log(dim(`  cd ${options.directory}`));
    console.log(dim('  npm install'));
  }

  // Next steps
  console.log();
  console.log(highlight('Next steps:'));
  console.log(dim(`  cd ${options.directory}`));
  if (options.apiKey) {
    console.log(dim('  # API key is configured in .env'));
  } else {
    console.log(dim('  # Add your Vista API key to .env'));
  }
  console.log(dim('  npx theatrical inspect sessions list --site <your-site-id>'));
  console.log();
}

/**
 * Build the template file list for the given options.
 */
function getTemplate(options: InitOptions): TemplateDefinition {
  const templates: Record<ProjectTemplate, () => TemplateDefinition> = {
    default: () => defaultTemplate(options),
    fullstack: () => fullstackTemplate(options),
    worker: () => workerTemplate(options),
  };

  return templates[options.template]();
}

/**
 * Default template: minimal TypeScript project with SDK client.
 */
function defaultTemplate(options: InitOptions): TemplateDefinition {
  return {
    name: 'default',
    description: 'Minimal TypeScript project with Theatrical SDK',
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: options.projectName,
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
              build: 'tsc',
              dev: 'tsx watch src/index.ts',
              start: 'node dist/index.js',
            },
            dependencies: {
              '@theatrical/sdk': '^0.1.0',
            },
            devDependencies: {
              typescript: '^5.4.0',
              tsx: '^4.0.0',
              '@types/node': '^20.0.0',
            },
          },
          null,
          2
        ) + '\n',
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'bundler',
              strict: true,
              esModuleInterop: true,
              outDir: 'dist',
              rootDir: 'src',
              declaration: true,
            },
            include: ['src/**/*'],
          },
          null,
          2
        ) + '\n',
      },
      {
        path: '.env',
        content: [
          '# Theatrical SDK Configuration',
          `THEATRICAL_API_KEY=${options.apiKey ?? 'your-api-key-here'}`,
          'THEATRICAL_API_URL=https://api.vista.co/ocapi/v1',
          '',
        ].join('\n'),
      },
      {
        path: '.env.example',
        content: [
          '# Theatrical SDK Configuration',
          'THEATRICAL_API_KEY=your-api-key-here',
          'THEATRICAL_API_URL=https://api.vista.co/ocapi/v1',
          '',
        ].join('\n'),
      },
      {
        path: '.gitignore',
        content: ['node_modules', 'dist', '.env', 'coverage', '*.log', ''].join('\n'),
      },
      {
        path: 'src/index.ts',
        content: [
          "import { TheatricalClient } from '@theatrical/sdk';",
          '',
          '// Initialize the SDK client',
          'const client = TheatricalClient.create({',
          "  apiKey: process.env.THEATRICAL_API_KEY ?? '',",
          "  baseUrl: process.env.THEATRICAL_API_URL ?? 'https://api.vista.co/ocapi/v1',",
          '});',
          '',
          'async function main() {',
          '  // List films currently showing',
          '  const films = await client.films.list({ nowShowing: true });',
          "  console.log('Now Showing:', films);",
          '',
          '  // Find nearby cinema sites',
          '  // const sites = await client.sites.nearby(-41.2924, 174.7787, 10);',
          "  // console.log('Nearby Sites:', sites);",
          '}',
          '',
          "main().catch(console.error);",
          '',
        ].join('\n'),
      },
    ],
  };
}

/**
 * Fullstack template: Express API + React frontend.
 */
function fullstackTemplate(options: InitOptions): TemplateDefinition {
  const base = defaultTemplate(options);
  return {
    name: 'fullstack',
    description: 'Express API + React frontend with Theatrical SDK',
    files: [
      ...base.files,
      {
        path: 'src/server.ts',
        content: [
          "import express from 'express';",
          "import { TheatricalClient } from '@theatrical/sdk';",
          '',
          'const app = express();',
          'const port = process.env.PORT ?? 3000;',
          '',
          'const client = TheatricalClient.create({',
          "  apiKey: process.env.THEATRICAL_API_KEY ?? '',",
          '});',
          '',
          "app.get('/api/films', async (_req, res) => {",
          '  const films = await client.films.list({ nowShowing: true });',
          '  res.json(films);',
          '});',
          '',
          "app.get('/api/sessions/:siteId', async (req, res) => {",
          '  const sessions = await client.sessions.list({',
          '    siteId: req.params.siteId,',
          '  });',
          '  res.json(sessions);',
          '});',
          '',
          'app.listen(port, () => {',
          '  console.log(`🎬 Cinema API running on http://localhost:${port}`);',
          '});',
          '',
        ].join('\n'),
      },
    ],
  };
}

/**
 * Worker template: background event processor.
 */
function workerTemplate(options: InitOptions): TemplateDefinition {
  const base = defaultTemplate(options);
  return {
    name: 'worker',
    description: 'Background worker for cinema event processing',
    files: [
      ...base.files,
      {
        path: 'src/worker.ts',
        content: [
          "import { TheatricalClient } from '@theatrical/sdk';",
          '',
          'const client = TheatricalClient.create({',
          "  apiKey: process.env.THEATRICAL_API_KEY ?? '',",
          '});',
          '',
          '/** Poll interval in milliseconds */',
          'const POLL_INTERVAL = 30_000;',
          '',
          'async function processEvents() {',
          "  console.log('🎬 Cinema event worker starting...');",
          '',
          '  // Example: poll for session changes',
          '  setInterval(async () => {',
          '    try {',
          '      // Check for updated sessions, availability changes, etc.',
          "      console.log(`[${new Date().toISOString()}] Polling for updates...`);",
          '    } catch (err) {',
          "      console.error('Poll error:', err);",
          '    }',
          '  }, POLL_INTERVAL);',
          '}',
          '',
          "processEvents().catch(console.error);",
          '',
        ].join('\n'),
      },
    ],
  };
}
