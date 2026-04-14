import { describe, it, expect } from 'vitest';
import { OpenAPIParser } from '../../src/codegen/parser';
import { sampleOpenAPISpec } from '../../src/codegen/templates';

describe('OpenAPI Parser', () => {
  const parser = new OpenAPIParser();

  it('should parse valid OpenAPI spec', () => {
    const result = parser.parse(sampleOpenAPISpec);

    expect(result.title).toBe('Cinema API');
    expect(result.version).toBe('1.0.0');
    expect(result.description).toBe('A simple cinema management API');
    expect(result.paths).toHaveLength(2);
    expect(result.schemas).toHaveLength(4);
  });

  it('should throw error for missing info.title', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: { version: '1.0.0' },
      paths: {},
    };

    expect(() => parser.parse(invalidSpec)).toThrow('missing required field: info.title');
  });

  it('should throw error for missing info.version', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: { title: 'API' },
      paths: {},
    };

    expect(() => parser.parse(invalidSpec)).toThrow('missing required field: info.version');
  });

  it('should throw error for missing info object', () => {
    expect(() => parser.parse({ openapi: '3.0.0', paths: {} })).toThrow('missing required field: info');
  });

  it('should throw error for non-object input', () => {
    expect(() => parser.parse(null)).toThrow('must be a valid object');
    expect(() => parser.parse(undefined)).toThrow('must be a valid object');
    expect(() => parser.parse('string')).toThrow('must be a valid object');
  });

  it('should extract paths and operations', () => {
    const result = parser.parse(sampleOpenAPISpec);

    expect(result.paths).toHaveLength(2);

    const sessionsPath = result.paths.find((p) => p.path === '/sessions');
    expect(sessionsPath).toBeDefined();
    expect(sessionsPath!.operations).toHaveLength(1);
    expect(sessionsPath!.operations[0].method).toBe('GET');
    expect(sessionsPath!.operations[0].operationId).toBe('listSessions');
  });

  it('should extract schema definitions', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const sessionSchema = result.schemas.find((s) => s.name === 'Session');
    expect(sessionSchema).toBeDefined();
    expect(sessionSchema!.type).toBe('object');
    expect(sessionSchema!.properties).toBeDefined();
    expect(sessionSchema!.properties!['id']).toBeDefined();
  });

  it('should extract schema properties and required fields', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const sessionSchema = result.schemas.find((s) => s.name === 'Session');
    expect(sessionSchema!.required).toContain('id');
    expect(sessionSchema!.required).toContain('filmTitle');
  });

  it('should handle $ref references in schemas', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const listSchema = result.schemas.find((s) => s.name === 'SessionList');
    expect(listSchema!.properties!['sessions']).toBeDefined();
    expect(listSchema!.properties!['sessions'].schema.type).toBe('array');
  });

  it('should extract enum values', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const sessionSchema = result.schemas.find((s) => s.name === 'Session');
    const formatProp = sessionSchema!.properties!['format'];
    expect(formatProp.schema.type).toBe('enum');
    expect(formatProp.schema.enumValues).toContain('2D');
    expect(formatProp.schema.enumValues).toContain('3D');
  });

  it('should extract parameters', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const sessionsPath = result.paths.find((p) => p.path === '/sessions');
    const listOp = sessionsPath!.operations[0];

    expect(listOp.parameters).toHaveLength(2);
    expect(listOp.parameters[0].name).toBe('siteId');
    expect(listOp.parameters[0].required).toBe(false);
    expect(listOp.parameters[0].type).toBe('string');
  });

  it('should extract operation responses', () => {
    const result = parser.parse(sampleOpenAPISpec);

    const sessionsPath = result.paths.find((p) => p.path === '/sessions');
    const listOp = sessionsPath!.operations[0];

    expect(listOp.responses['200']).toBeDefined();
    expect(listOp.responses['200'].name).toMatch(/Response200|SessionList/);
  });

  it('should handle empty paths and schemas gracefully', () => {
    const minimalSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Minimal API',
        version: '1.0.0',
      },
    };

    const result = parser.parse(minimalSpec);
    expect(result.paths).toHaveLength(0);
    expect(result.schemas).toHaveLength(0);
  });

  it('should handle multiple HTTP methods per path', () => {
    const multiMethodSpec = {
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/items': {
          get: {
            operationId: 'listItems',
            responses: { '200': { description: 'OK' } },
          },
          post: {
            operationId: 'createItem',
            responses: { '201': { description: 'Created' } },
          },
        },
      },
    };

    const result = parser.parse(multiMethodSpec);
    const itemsPath = result.paths[0];
    expect(itemsPath.operations).toHaveLength(2);
    expect(itemsPath.operations[0].method).toBe('GET');
    expect(itemsPath.operations[1].method).toBe('POST');
  });
});
