import type {
  ParsedOpenAPISpec,
  ParsedPath,
  ParsedOperation,
  ParsedParameter,
  ParsedSchema,
  ParsedSchemaProperty,
} from './types';

/**
 * OpenAPI 3.x parser — extracts types and operations from a specification.
 */
export class OpenAPIParser {
  /**
   * Parse an OpenAPI 3.x specification object.
   * Supports JSON and YAML (if pre-parsed to objects).
   *
   * @param spec - Raw OpenAPI specification object
   * @returns Parsed specification ready for code generation
   * @throws Error if spec is invalid or missing required fields
   */
  parse(spec: any): ParsedOpenAPISpec {
    if (!spec || typeof spec !== 'object') {
      throw new Error('OpenAPI spec must be a valid object');
    }

    if (!spec.info) {
      throw new Error('OpenAPI spec missing required field: info');
    }

    if (!spec.info.title) {
      throw new Error('OpenAPI spec missing required field: info.title');
    }

    if (!spec.info.version) {
      throw new Error('OpenAPI spec missing required field: info.version');
    }

    const paths = this.parsePaths(spec.paths || {});
    const schemas = this.parseSchemas(spec.components?.schemas || {});

    return {
      title: spec.info.title,
      description: spec.info.description,
      version: spec.info.version,
      paths,
      schemas,
    };
  }

  /**
   * Parse OpenAPI paths (endpoints).
   */
  private parsePaths(pathsObj: Record<string, any>): ParsedPath[] {
    return Object.entries(pathsObj).map(([path, pathItem]) => ({
      path,
      operations: this.parseOperations(pathItem),
    }));
  }

  /**
   * Parse operations (HTTP methods) for a path item.
   */
  private parseOperations(pathItem: any): ParsedOperation[] {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const;
    const operations: ParsedOperation[] = [];

    for (const method of methods) {
      const operation = pathItem[method];
      if (operation && typeof operation === 'object') {
        operations.push({
          method: method.toUpperCase() as ParsedOperation['method'],
          operationId: operation.operationId || `${method}_unknown`,
          summary: operation.summary,
          description: operation.description,
          requestBody: operation.requestBody
            ? this.parseRequestBody(operation.requestBody)
            : undefined,
          responses: this.parseResponses(operation.responses || {}),
          parameters: this.parseParameters(operation.parameters || []),
        });
      }
    }

    return operations;
  }

  /**
   * Parse request body definition.
   */
  private parseRequestBody(requestBody: any): ParsedSchema {
    if (!requestBody.content) {
      throw new Error('Request body missing content');
    }

    // Typically application/json
    const jsonContent = requestBody.content['application/json'];
    if (!jsonContent) {
      throw new Error('Request body missing application/json content type');
    }

    return this.parseSchemaObject(jsonContent.schema, 'RequestBody');
  }

  /**
   * Parse response definitions.
   */
  private parseResponses(responsesObj: Record<string, any>): Record<string, ParsedSchema> {
    const responses: Record<string, ParsedSchema> = {};

    for (const [status, response] of Object.entries(responsesObj)) {
      if (response && typeof response === 'object' && response.content) {
        const jsonContent = response.content['application/json'];
        if (jsonContent) {
          responses[status] = this.parseSchemaObject(jsonContent.schema, `Response${status}`);
        }
      }
    }

    return responses;
  }

  /**
   * Parse parameters (query, path, header, cookie).
   */
  private parseParameters(parameters: any[]): ParsedParameter[] {
    return parameters.map((param) => ({
      name: param.name,
      in: param.in as ParsedParameter['in'],
      required: param.required === true,
      type: this.schemaToTypeString(param.schema),
      description: param.description,
    }));
  }

  /**
   * Parse a schema object (from definitions or inline).
   */
  private parseSchemaObject(schema: any, defaultName: string): ParsedSchema {
    if (!schema) {
      return { name: defaultName, type: 'object' };
    }

    // Handle $ref references
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop() || defaultName;
      return {
        name: refName,
        type: 'object',
        isReference: true,
      };
    }

    // Handle enums
    if (Array.isArray(schema.enum)) {
      return {
        name: defaultName,
        type: 'enum',
        description: schema.description,
        enumValues: schema.enum.map(String),
      };
    }

    // Handle arrays
    if (schema.type === 'array') {
      return {
        name: defaultName,
        type: 'array',
        description: schema.description,
        items: schema.items ? this.parseSchemaObject(schema.items, `${defaultName}Item`) : undefined,
      };
    }

    // Handle objects
    if (schema.type === 'object' || schema.properties) {
      const properties: Record<string, ParsedSchemaProperty> = {};
      const required = schema.required || [];

      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
          properties[propName] = {
            name: propName,
            required: required.includes(propName),
            schema: this.parseSchemaObject(propSchema as any, propName),
            description: (propSchema as any)?.description,
          };
        }
      }

      return {
        name: defaultName,
        type: 'object',
        description: schema.description,
        properties,
        required,
      };
    }

    // Handle primitives
    return {
      name: defaultName,
      type: (schema.type as ParsedSchema['type']) || 'object',
      description: schema.description,
    };
  }

  /**
   * Parse schema definitions (components/schemas).
   */
  private parseSchemas(schemasObj: Record<string, any>): ParsedSchema[] {
    return Object.entries(schemasObj).map(([name, schema]) => {
      const parsed = this.parseSchemaObject(schema, name);
      parsed.name = name;
      return parsed;
    });
  }

  /**
   * Convert a schema to a TypeScript type string (for parameters).
   */
  private schemaToTypeString(schema: any): string {
    if (!schema) return 'unknown';

    if (schema.type === 'string') {
      if (Array.isArray(schema.enum)) {
        return schema.enum.map((v: string) => `'${v}'`).join(' | ');
      }
      return 'string';
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      return 'number';
    }

    if (schema.type === 'boolean') {
      return 'boolean';
    }

    if (schema.type === 'array') {
      return `${this.schemaToTypeString(schema.items)}[]`;
    }

    return 'unknown';
  }
}

/**
 * Parse an OpenAPI specification from a string (JSON or YAML).
 * @param content - Raw specification content
 * @returns Parsed specification object
 */
export function parseOpenAPIFromString(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    // Try YAML parsing if JSON fails
    // For now, just throw — full YAML support requires a library
    throw new Error(
      'Failed to parse specification as JSON. YAML parsing requires yaml package.'
    );
  }
}
