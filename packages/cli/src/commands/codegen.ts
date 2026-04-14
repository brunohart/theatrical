import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { OpenAPIParser } from '../codegen/parser';
import { CodeGenerator } from '../codegen/generator';
import type { CodegenConfig } from '../codegen/types';

/**
 * Create the 'theatrical codegen' command.
 *
 * Generates TypeScript types and Zod schemas from an OpenAPI specification.
 *
 * @example
 * ```bash
 * theatrical codegen openapi.json --output src/types
 * theatrical codegen https://example.com/openapi.json --zod --output src/schemas
 * ```
 */
export function createCodegenCommand(): Command {
  return new Command('codegen')
    .description('Generate TypeScript types from OpenAPI specifications')
    .argument('<spec>', 'Path or URL to OpenAPI spec (JSON or YAML)')
    .option('--output <dir>', 'Output directory', './src/generated')
    .option('--zod', 'Include Zod schemas', false)
    .option('--jsdoc', 'Include JSDoc comments', true)
    .option('--package-name <name>', 'Package name for imports', undefined)
    .action(async (spec, options) => {
      try {
        await runCodegen(spec, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}

/**
 * Execute codegen from a spec file or URL.
 */
async function runCodegen(specInput: string, options: any): Promise<void> {
  // Load spec from file or URL
  let specContent: string;

  if (specInput.startsWith('http://') || specInput.startsWith('https://')) {
    specContent = await fetchSpec(specInput);
  } else {
    specContent = fs.readFileSync(specInput, 'utf-8');
  }

  // Parse OpenAPI spec
  let specObj: any;
  try {
    specObj = JSON.parse(specContent);
  } catch {
    throw new Error('Failed to parse spec — ensure it is valid JSON (YAML not yet supported)');
  }

  const parser = new OpenAPIParser();
  const parsedSpec = parser.parse(specObj);

  // Configure code generation
  const config: CodegenConfig = {
    outputDir: options.output,
    includeZod: options.zod === true,
    includeJSDoc: options.jsdoc !== false,
    packageName: options.packageName,
  };

  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Generate code
  const generator = new CodeGenerator(config);
  const generated = generator.generate(parsedSpec);

  // Write types file
  const typesPath = path.join(config.outputDir, 'index.ts');
  fs.writeFileSync(typesPath, generated.types, 'utf-8');
  console.log(`✓ Generated types: ${typesPath}`);

  // Write Zod schemas if enabled
  if (generated.zod && config.includeZod) {
    const zodPath = path.join(config.outputDir, 'schemas.ts');
    fs.writeFileSync(zodPath, generated.zod, 'utf-8');
    console.log(`✓ Generated Zod schemas: ${zodPath}`);
  }

  // Write barrel export if present
  if (generated.barrel) {
    const barrelPath = path.join(config.outputDir, 'index.ts');
    fs.appendFileSync(barrelPath, '\n\n' + generated.barrel, 'utf-8');
  }

  console.log(`\nCodegen complete. Generated ${config.includeZod ? 'types and schemas' : 'types'} in ${config.outputDir}`);
}

/**
 * Fetch OpenAPI spec from a URL.
 * @param url - URL to fetch from
 * @returns Spec content as string
 */
async function fetchSpec(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch spec from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
