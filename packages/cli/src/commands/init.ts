/**
 * @module commands/init
 * Scaffold a new cinema platform project with Theatrical SDK integration.
 *
 * The init command creates a project directory from a template and writes
 * starter configuration files. Supports non-interactive use (flags +
 * defaults) for CI/scripting.
 *
 * Templates live in ../templates — default, fullstack, worker, and
 * react-ticketing (the living-cinema booking demo).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import type { TheatricalCLIConfig } from '../utils/config.js';
import {
  getTemplate,
  isValidTemplate,
  VALID_TEMPLATES,
  type ProjectTemplate,
} from '../templates/index.js';
import { success, error, info, dim, highlight, keyValue, heading } from '../utils/output.js';

/** Options collected from flags or interactive prompts */
export interface InitOptions {
  projectName: string;
  template: ProjectTemplate;
  apiKey?: string;
  skipInstall: boolean;
  directory: string;
}

/**
 * Create the init command and register it with the parent program.
 */
export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .argument('[project-name]', 'Name of the project to create')
    .description('Scaffold a new cinema platform project')
    .option('-t, --template <template>', `Project template (${VALID_TEMPLATES.join(', ')})`, 'default')
    .option('--api-key <key>', 'API key to include in .env')
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
  if (isValidTemplate(template)) {
    return template;
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
  const template = getTemplate(options.template, {
    projectName: options.projectName,
    apiKey: options.apiKey,
  });
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
  if (options.template === 'react-ticketing') {
    console.log(dim('  npm install'));
    console.log(dim('  npm run dev   # self-contained — no API key required'));
  } else {
    if (options.apiKey) {
      console.log(dim('  # API key is configured in .env'));
    } else {
      console.log(dim('  # Add your platform API key to .env (or omit it to use mock mode)'));
    }
    console.log(dim('  npx theatrical inspect sessions list --site <your-site-id>'));
  }
  console.log();
}
