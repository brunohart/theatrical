import type {
  ParsedOpenAPISpec,
  ParsedSchema,
  ParsedSchemaProperty,
  GeneratedCode,
  CodegenConfig,
} from './types';

/**
 * Code generator — converts parsed OpenAPI specs to TypeScript + Zod.
 */
export class CodeGenerator {
  private config: CodegenConfig;

  constructor(config: CodegenConfig) {
    this.config = config;
  }

  /**
   * Generate TypeScript and Zod code from a parsed OpenAPI spec.
   */
  generate(spec: ParsedOpenAPISpec): GeneratedCode {
    const types = this.generateTypes(spec);
    const zod = this.config.includeZod ? this.generateZod(spec) : undefined;
    const barrel = this.generateBarrel(spec);

    return { types, zod, barrel };
  }

  /**
   * Generate TypeScript type definitions.
   */
  private generateTypes(spec: ParsedOpenAPISpec): string {
    const lines: string[] = [];

    // Header comment
    lines.push('/**');
    lines.push(` * Generated from ${spec.title} v${spec.version}`);
    if (spec.description) {
      lines.push(` * ${spec.description}`);
    }
    lines.push(' */');
    lines.push('');

    // Schemas (type definitions)
    for (const schema of spec.schemas) {
      if (this.config.includeJSDoc) {
        lines.push('/**');
        lines.push(` * ${schema.description || schema.name}`);
        lines.push(' */');
      }
      lines.push(...this.generateSchemaType(schema));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a single schema as a TypeScript type.
   */
  private generateSchemaType(schema: ParsedSchema): string[] {
    const lines: string[] = [];

    if (schema.type === 'enum') {
      lines.push(`export type ${schema.name} = ${schema.enumValues?.map((v) => `'${v}'`).join(' | ')};`);
      return lines;
    }

    if (schema.type === 'object' && schema.properties) {
      lines.push(`export interface ${schema.name} {`);
      for (const [propName, prop] of Object.entries(schema.properties)) {
        if (this.config.includeJSDoc && prop.description) {
          lines.push(`  /** ${prop.description} */`);
        }
        const optional = prop.required ? '' : '?';
        const typeStr = this.schemaPropertyToTypeString(prop.schema);
        lines.push(`  ${propName}${optional}: ${typeStr};`);
      }
      lines.push('}');
      return lines;
    }

    if (schema.type === 'array' && schema.items) {
      const itemType = this.schemaToTypeString(schema.items);
      lines.push(`export type ${schema.name} = ${itemType}[];`);
      return lines;
    }

    // Fallback
    lines.push(`export type ${schema.name} = unknown;`);
    return lines;
  }

  /**
   * Generate Zod schemas.
   */
  private generateZod(spec: ParsedOpenAPISpec): string {
    const lines: string[] = [];

    lines.push('import { z } from "zod";');
    lines.push('');

    for (const schema of spec.schemas) {
      lines.push(`export const ${this.toSchemeName(schema.name)} = z.`);
      lines.push(...this.generateZodSchema(schema, ''));
      lines.push(';');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a Zod schema definition.
   */
  private generateZodSchema(schema: ParsedSchema, indent: string): string[] {
    const lines: string[] = [];

    if (schema.type === 'enum' && schema.enumValues) {
      const values = schema.enumValues.map((v) => `'${v}'`).join(', ');
      lines.push(`enum([${values}])`);
      return lines;
    }

    if (schema.type === 'object' && schema.properties) {
      lines.push('object({');
      for (const [propName, prop] of Object.entries(schema.properties)) {
        const propZod = this.generateZodSchemaForProperty(prop);
        const optional = prop.required ? '' : '.optional()';
        lines.push(`  ${propName}: ${propZod}${optional},`);
      }
      lines.push('})');
      return lines;
    }

    if (schema.type === 'array' && schema.items) {
      const itemZod = this.schemaToZodString(schema.items);
      lines.push(`array(${itemZod})`);
      return lines;
    }

    lines.push('unknown()');
    return lines;
  }

  /**
   * Generate Zod for a property within an object.
   */
  private generateZodSchemaForProperty(prop: ParsedSchemaProperty): string {
    return this.schemaToZodString(prop.schema);
  }

  /**
   * Convert a schema to a Zod schema string.
   */
  private schemaToZodString(schema: ParsedSchema): string {
    switch (schema.type) {
      case 'string':
        return 'z.string()';
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'enum':
        if (schema.enumValues) {
          const values = schema.enumValues.map((v) => `'${v}'`).join(', ');
          return `z.enum([${values}])`;
        }
        return 'z.string()';
      case 'array':
        if (schema.items) {
          const itemZod = this.schemaToZodString(schema.items);
          return `z.array(${itemZod})`;
        }
        return 'z.array(z.unknown())';
      case 'object':
        if (schema.properties) {
          const entries = Object.entries(schema.properties)
            .map(([name, prop]) => {
              const propZod = this.schemaToZodString(prop.schema);
              const optional = prop.required ? '' : '.optional()';
              return `${name}: ${propZod}${optional}`;
            })
            .join(', ');
          return `z.object({ ${entries} })`;
        }
        return 'z.object({})';
      default:
        return 'z.unknown()';
    }
  }

  /**
   * Convert a schema to a TypeScript type string.
   */
  private schemaToTypeString(schema: ParsedSchema): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'enum':
        return schema.enumValues?.map((v) => `'${v}'`).join(' | ') || 'string';
      case 'array':
        return schema.items ? `${this.schemaToTypeString(schema.items)}[]` : 'unknown[]';
      case 'object':
        if (schema.isReference) {
          return schema.name;
        }
        if (schema.properties) {
          const entries = Object.entries(schema.properties)
            .map(([name, prop]) => {
              const optional = prop.required ? '' : '?';
              const typeStr = this.schemaToTypeString(prop.schema);
              return `${name}${optional}: ${typeStr}`;
            })
            .join('; ');
          return `{ ${entries} }`;
        }
        return 'object';
      default:
        return 'unknown';
    }
  }

  /**
   * Convert a schema property to a TypeScript type string.
   */
  private schemaPropertyToTypeString(schema: ParsedSchema): string {
    return this.schemaToTypeString(schema);
  }

  /**
   * Generate a barrel export file.
   */
  private generateBarrel(spec: ParsedOpenAPISpec): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(` * Generated barrel export for ${spec.title}`);
    lines.push(' */');
    lines.push('');

    for (const schema of spec.schemas) {
      lines.push(`export type { ${schema.name} } from './${this.toFileName(schema.name)}';`);
    }

    return lines.join('\n');
  }

  /**
   * Convert a schema name to a file name.
   */
  private toFileName(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert a schema name to a Zod schema name.
   */
  private toSchemeName(name: string): string {
    return `${name.charAt(0).toLowerCase()}${name.slice(1)}Schema`;
  }
}
