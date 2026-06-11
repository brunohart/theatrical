#!/usr/bin/env node
/**
 * Sync the react-ticketing starter from packages/templates into an embedded
 * TypeScript module so the published CLI can scaffold it standalone.
 *
 * - `file:` workspace dependencies become registry semver ranges
 * - the package name becomes a {{PROJECT_NAME}} placeholder
 * - node_modules / dist / .env are never embedded
 *
 * Run from packages/cli:  node scripts/sync-templates.mjs
 * The generated module is committed; re-run after editing the template.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(here, '../../templates/react-ticketing');
const outFile = path.resolve(here, '../src/templates/react-ticketing.generated.ts');

/** Registry ranges for workspace deps embedded in the scaffolded package.json. */
const REGISTRY_VERSIONS = {
  '@theatrical/sdk': '^0.1.0',
  '@theatrical/react': '^0.1.0',
  '@theatrical/events': '^0.1.0',
  '@theatrical/cli': '^0.1.0',
};

const SKIP = new Set(['node_modules', 'dist', '.env', '.turbo']);

function collect(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collect(abs, rel));
    } else {
      files.push({ path: rel, content: fs.readFileSync(abs, 'utf-8') });
    }
  }
  return files;
}

function transformPackageJson(content) {
  const pkg = JSON.parse(content);
  pkg.name = '{{PROJECT_NAME}}';
  for (const depType of ['dependencies', 'devDependencies']) {
    const deps = pkg[depType];
    if (!deps) continue;
    for (const [name, range] of Object.entries(deps)) {
      if (range.startsWith('file:')) {
        const replacement = REGISTRY_VERSIONS[name];
        if (!replacement) throw new Error(`No registry version mapped for workspace dep ${name}`);
        deps[name] = replacement;
      }
    }
  }
  // The scaffold's printed next steps use `npx theatrical …` — make it resolve locally.
  pkg.devDependencies = { '@theatrical/cli': REGISTRY_VERSIONS['@theatrical/cli'], ...pkg.devDependencies };
  return JSON.stringify(pkg, null, 2) + '\n';
}

const files = collect(templateDir).map((f) =>
  f.path === 'package.json' ? { ...f, content: transformPackageJson(f.content) } : f
);

if (files.length === 0) throw new Error(`No template files found in ${templateDir}`);

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Embedded copy of packages/templates/react-ticketing, produced by
 * scripts/sync-templates.mjs so the published CLI can scaffold the
 * starter without access to the monorepo. Re-run the script after
 * changing the template source.
 */

import type { TemplateFile } from './index.js';

export const REACT_TICKETING_FILES: readonly TemplateFile[] = `;

fs.writeFileSync(outFile, banner + JSON.stringify(files, null, 2) + ' as const;\n', 'utf-8');
console.log(`Embedded ${files.length} files from react-ticketing into ${path.relative(process.cwd(), outFile)}`);
