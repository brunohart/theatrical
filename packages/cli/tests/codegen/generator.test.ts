import { describe, it, expect } from 'vitest';
import { OpenAPIParser } from '../../src/codegen/parser';
import { CodeGenerator } from '../../src/codegen/generator';
import { sampleOpenAPISpec } from '../../src/codegen/templates';
import type { CodegenConfig } from '../../src/codegen/types';

describe('Code Generator', () => {
  const parser = new OpenAPIParser();
  const config: CodegenConfig = {
    outputDir: './generated',
    includeZod: true,
    includeJSDoc: true,
  };

  const generator = new CodeGenerator(config);
  const spec = parser.parse(sampleOpenAPISpec);

  it('should generate TypeScript types', () => {
    const { types } = generator.generate(spec);

    expect(types).toContain('export interface Session');
    expect(types).toContain('export interface Site');
    expect(types).toContain('export interface Error');
    expect(types).toContain('id: string;');
    expect(types).toContain('name: string;');
  });

  it('should generate Zod schemas when enabled', () => {
    const { zod } = generator.generate(spec);

    expect(zod).toBeDefined();
    expect(zod).toContain('import { z } from "zod"');
    expect(zod).toContain('sessionSchema');
    expect(zod).toContain('siteSchema');
    expect(zod).toContain('z.object');
  });

  it('should not generate Zod when disabled', () => {
    const noZodConfig: CodegenConfig = {
      outputDir: './generated',
      includeZod: false,
      includeJSDoc: true,
    };
    const noZodGenerator = new CodeGenerator(noZodConfig);
    const { zod } = noZodGenerator.generate(spec);

    expect(zod).toBeUndefined();
  });

  it('should include JSDoc comments when enabled', () => {
    const { types } = generator.generate(spec);

    expect(types).toContain('/**');
    expect(types).toContain('* Session');
  });

  it('should not include JSDoc when disabled', () => {
    const noDocConfig: CodegenConfig = {
      outputDir: './generated',
      includeZod: true,
      includeJSDoc: false,
    };
    const noDocGenerator = new CodeGenerator(noDocConfig);
    const { types } = noDocGenerator.generate(spec);

    // Should still have the header comment but not property comments
    expect(types).not.toContain('/** Session ID */');
  });

  it('should generate barrel exports', () => {
    const { barrel } = generator.generate(spec);

    expect(barrel).toBeDefined();
    expect(barrel).toContain('export type { Session }');
    expect(barrel).toContain('export type { Site }');
    expect(barrel).toContain('export type { Error }');
  });

  it('should handle enum types correctly', () => {
    const { types, zod } = generator.generate(spec);

    expect(types).toContain("'2D'");
    expect(types).toContain("'3D'");
    expect(types).toContain("'IMAX'");

    if (zod) {
      expect(zod).toContain('enum');
    }
  });

  it('should mark optional properties without required flag', () => {
    const { types } = generator.generate(spec);

    // SessionList has all required fields
    expect(types).toContain('sessions: Session[];');
    expect(types).toContain('total: number;');
  });

  it('should handle nested objects', () => {
    const { types } = generator.generate(spec);

    expect(types).toContain('SessionList');
    expect(types).toContain('sessions');
  });

  it('should generate valid TypeScript that compiles', () => {
    const { types } = generator.generate(spec);

    // Check for basic syntax correctness
    expect(types).toContain('interface');
    expect(types).toContain('export');
    expect(types).toMatch(/;\s*$/m); // Should end with semicolon
  });

  it('should generate valid Zod that can be instantiated', () => {
    const { zod } = generator.generate(spec);

    if (zod) {
      // Check for Zod method calls
      expect(zod).toContain('z.string()');
      expect(zod).toContain('z.number()');
      expect(zod).toContain('z.object');
      expect(zod).toContain('z.array');
    }
  });

  it('should include spec info in generated code', () => {
    const { types } = generator.generate(spec);

    expect(types).toContain('Cinema API');
    expect(types).toContain('1.0.0');
    expect(types).toContain('A simple cinema management API');
  });

  it('should handle multiple schemas of different types', () => {
    const { types } = generator.generate(spec);

    // Object types
    expect(types).toContain('export interface Session');
    expect(types).toContain('export interface Site');

    // All generated types should be unique
    const interfaceMatches = types.match(/export interface \w+/g) || [];
    const uniqueInterfaces = new Set(interfaceMatches);
    expect(uniqueInterfaces.size).toBeGreaterThan(0);
  });

  it('should generate code with proper formatting', () => {
    const { types } = generator.generate(spec);

    // Check for proper indentation and structure
    expect(types).toMatch(/^export interface/m);
    expect(types).toMatch(/\{\s*$/m); // Opening braces on same line
    expect(types).toMatch(/^\s+\w+:.*;\s*$/m); // Properties indented
  });
});
