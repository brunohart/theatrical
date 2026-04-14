/**
 * @module templates
 * Project template definitions for the `theatrical init` command.
 *
 * Each template defines a set of files to scaffold when creating a new
 * cinema platform project. Templates are composable — the fullstack and
 * worker templates extend the default template with additional files.
 *
 * Available templates:
 * - `default`   — Minimal TypeScript + SDK client
 * - `fullstack` — Express API + React frontend
 * - `worker`    — Background event processor
 */

/** Available project template identifiers */
export type ProjectTemplate = 'default' | 'fullstack' | 'worker';

/** All valid template names for validation */
export const VALID_TEMPLATES: readonly ProjectTemplate[] = [
  'default',
  'fullstack',
  'worker',
] as const;

/** Metadata and file list for a project template */
export interface TemplateDefinition {
  /** Template identifier */
  name: ProjectTemplate;
  /** Human-readable description */
  description: string;
  /** Files to write during scaffolding */
  files: TemplateFile[];
}

/** A single file in a template */
export interface TemplateFile {
  /** Relative path from project root */
  path: string;
  /** File contents */
  content: string;
}

/** Options that templates use to customize output */
export interface TemplateContext {
  /** Project name for package.json */
  projectName: string;
  /** Optional API key to embed in .env */
  apiKey?: string;
}

/**
 * Check whether a string is a valid project template name.
 */
export function isValidTemplate(value: string): value is ProjectTemplate {
  return VALID_TEMPLATES.includes(value as ProjectTemplate);
}

/**
 * Get a template definition by name.
 *
 * @param template - Template name
 * @param context - Project context for template rendering
 * @returns Template definition with rendered files
 */
export function getTemplate(
  template: ProjectTemplate,
  context: TemplateContext
): TemplateDefinition {
  const builders: Record<ProjectTemplate, () => TemplateDefinition> = {
    default: () => buildDefaultTemplate(context),
    fullstack: () => buildFullstackTemplate(context),
    worker: () => buildWorkerTemplate(context),
  };

  return builders[template]();
}

/**
 * Get metadata for all available templates (for display in help/prompts).
 */
export function listTemplates(): Array<{ name: ProjectTemplate; description: string }> {
  return [
    { name: 'default', description: 'Minimal TypeScript project with Theatrical SDK' },
    { name: 'fullstack', description: 'Express API + React frontend with SDK integration' },
    { name: 'worker', description: 'Background worker for cinema event processing' },
  ];
}

// ─── Template Builders ────────────────────────────────────

function buildDefaultTemplate(ctx: TemplateContext): TemplateDefinition {
  return {
    name: 'default',
    description: 'Minimal TypeScript project with Theatrical SDK',
    files: [
      packageJson(ctx),
      tsConfig(),
      envFile(ctx),
      envExample(),
      gitignore(),
      entryPoint(),
    ],
  };
}

function buildFullstackTemplate(ctx: TemplateContext): TemplateDefinition {
  const base = buildDefaultTemplate(ctx);
  return {
    name: 'fullstack',
    description: 'Express API + React frontend with Theatrical SDK',
    files: [...base.files, serverFile()],
  };
}

function buildWorkerTemplate(ctx: TemplateContext): TemplateDefinition {
  const base = buildDefaultTemplate(ctx);
  return {
    name: 'worker',
    description: 'Background worker for cinema event processing',
    files: [...base.files, workerFile()],
  };
}

// ─── File Generators ──────────────────────────────────────

function packageJson(ctx: TemplateContext): TemplateFile {
  return {
    path: 'package.json',
    content: JSON.stringify(
      {
        name: ctx.projectName,
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
  };
}

function tsConfig(): TemplateFile {
  return {
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
  };
}

function envFile(ctx: TemplateContext): TemplateFile {
  return {
    path: '.env',
    content: [
      '# Theatrical SDK Configuration',
      `THEATRICAL_API_KEY=${ctx.apiKey ?? 'your-api-key-here'}`,
      'THEATRICAL_API_URL=https://api.vista.co/ocapi/v1',
      '',
    ].join('\n'),
  };
}

function envExample(): TemplateFile {
  return {
    path: '.env.example',
    content: [
      '# Theatrical SDK Configuration',
      'THEATRICAL_API_KEY=your-api-key-here',
      'THEATRICAL_API_URL=https://api.vista.co/ocapi/v1',
      '',
    ].join('\n'),
  };
}

function gitignore(): TemplateFile {
  return {
    path: '.gitignore',
    content: ['node_modules', 'dist', '.env', 'coverage', '*.log', ''].join('\n'),
  };
}

function entryPoint(): TemplateFile {
  return {
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
      '}',
      '',
      "main().catch(console.error);",
      '',
    ].join('\n'),
  };
}

function serverFile(): TemplateFile {
  return {
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
      '  console.log(`Cinema API running on http://localhost:${port}`);',
      '});',
      '',
    ].join('\n'),
  };
}

function workerFile(): TemplateFile {
  return {
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
      "  console.log('Cinema event worker starting...');",
      '',
      '  setInterval(async () => {',
      '    try {',
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
  };
}
