/**
 * OpenAPI codegen types — shared between parser, generator, and templates.
 */

/**
 * Parsed OpenAPI schema — a simplified representation
 * of an OpenAPI 3.x specification ready for code generation.
 */
export interface ParsedOpenAPISpec {
  /** API title from spec.info.title */
  title: string;

  /** API description from spec.info.description */
  description?: string;

  /** API version from spec.info.version */
  version: string;

  /** Parsed paths and operations */
  paths: ParsedPath[];

  /** Parsed schema definitions */
  schemas: ParsedSchema[];
}

/**
 * A parsed path (endpoint) from the OpenAPI spec.
 */
export interface ParsedPath {
  /** Path pattern (e.g., "/sessions", "/sessions/{id}") */
  path: string;

  /** HTTP methods defined for this path */
  operations: ParsedOperation[];
}

/**
 * A parsed operation (method) on a path.
 */
export interface ParsedOperation {
  /** HTTP method: GET, POST, PUT, DELETE, etc. */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  /** Operation identifier from spec.operationId */
  operationId: string;

  /** Operation summary (brief description) */
  summary?: string;

  /** Operation description */
  description?: string;

  /** Request body schema reference or inline schema */
  requestBody?: ParsedSchema;

  /** Response schemas (keyed by status code, e.g., "200", "400") */
  responses: Record<string, ParsedSchema>;

  /** Path parameters */
  parameters: ParsedParameter[];
}

/**
 * A parsed parameter (query, path, header, or cookie).
 */
export interface ParsedParameter {
  /** Parameter name */
  name: string;

  /** Parameter location: query, path, header, or cookie */
  in: 'query' | 'path' | 'header' | 'cookie';

  /** Whether parameter is required */
  required: boolean;

  /** TypeScript type for the parameter */
  type: string;

  /** Parameter description */
  description?: string;
}

/**
 * A parsed schema — represents a type definition or inline object.
 */
export interface ParsedSchema {
  /** Schema name (from definitions, or generated if inline) */
  name: string;

  /** Schema type: object, string, number, boolean, array, etc. */
  type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'enum' | 'union';

  /** Description (from schema.description) */
  description?: string;

  /** Properties if type is 'object' */
  properties?: Record<string, ParsedSchemaProperty>;

  /** Required fields if type is 'object' */
  required?: string[];

  /** Array element type if type is 'array' */
  items?: ParsedSchema;

  /** Enum values if type is 'enum' */
  enumValues?: string[];

  /** Union member types if type is 'union' */
  unions?: ParsedSchema[];

  /** Whether this schema is a reference to a reusable definition */
  isReference?: boolean;
}

/**
 * A property within an object schema.
 */
export interface ParsedSchemaProperty {
  /** Property name */
  name: string;

  /** Whether property is required */
  required: boolean;

  /** The schema for this property */
  schema: ParsedSchema;

  /** Property description */
  description?: string;
}

/**
 * Configuration for code generation.
 */
export interface CodegenConfig {
  /** Output directory for generated files */
  outputDir: string;

  /** Whether to generate Zod schemas */
  includeZod: boolean;

  /** Whether to generate JSDoc comments */
  includeJSDoc: boolean;

  /** Package name for imports (e.g., '@my-api/types') */
  packageName?: string;
}

/**
 * Generated code output — TypeScript types and optional Zod schemas.
 */
export interface GeneratedCode {
  /** Generated TypeScript type definitions */
  types: string;

  /** Generated Zod schemas (if enabled) */
  zod?: string;

  /** Generated barrel export file contents (if needed) */
  barrel?: string;
}
