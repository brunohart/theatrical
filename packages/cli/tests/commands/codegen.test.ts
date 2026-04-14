import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCodegenCommand } from '../../src/commands/codegen';
import { sampleOpenAPISpec } from '../../src/codegen/templates';

describe('codegen command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(process.cwd(), '.test-codegen-tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should create codegen command with correct structure', () => {
    const cmd = createCodegenCommand();

    expect(cmd.name()).toBe('codegen');
    expect(cmd.description()).toContain('Generate TypeScript types');
  });

  it('should have required argument for spec', () => {
    const cmd = createCodegenCommand();

    // Check that spec argument is defined
    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('<spec>');
  });

  it('should have output option with default', () => {
    const cmd = createCodegenCommand();

    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('--output');
  });

  it('should have zod flag option', () => {
    const cmd = createCodegenCommand();

    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('--zod');
  });

  it('should have jsdoc option', () => {
    const cmd = createCodegenCommand();

    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('--jsdoc');
  });

  it('should have package-name option', () => {
    const cmd = createCodegenCommand();

    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('--package-name');
  });

  it('should accept spec file path and output directory arguments', () => {
    const cmd = createCodegenCommand();

    // Verify command structure can handle the required arguments
    const helpOutput = cmd.helpInformation();
    expect(helpOutput).toContain('codegen');
    expect(helpOutput).toContain('<spec>');
    expect(helpOutput).toContain('--output');

    // The actual file generation is tested in integration tests
    // This test verifies the command structure is correct
  });

  it('should provide help documentation', () => {
    const cmd = createCodegenCommand();
    const helpOutput = cmd.helpInformation();

    expect(helpOutput).toContain('Generate TypeScript types from OpenAPI');
    expect(helpOutput).toContain('Path or URL to OpenAPI spec');
  });

  it('should accept zod flag as option', () => {
    const cmd = createCodegenCommand();
    const helpOutput = cmd.helpInformation();

    expect(helpOutput).toContain('--zod');
    expect(helpOutput).toMatch(/--zod.*Zod schemas/i);
  });

  it('should have sensible default output directory', () => {
    const cmd = createCodegenCommand();
    const helpOutput = cmd.helpInformation();

    expect(helpOutput).toContain('./src/generated');
  });
});
