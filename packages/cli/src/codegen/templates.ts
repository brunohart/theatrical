/**
 * Code generation templates — sample OpenAPI specs and output examples.
 */

/**
 * Sample OpenAPI 3.0 specification for testing codegen.
 * Represents a simple cinema API with sessions and sites.
 */
export const sampleOpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Cinema API',
    description: 'A simple cinema management API',
    version: '1.0.0',
  },
  paths: {
    '/sessions': {
      get: {
        operationId: 'listSessions',
        summary: 'List cinema sessions',
        description: 'Returns a list of available cinema sessions.',
        parameters: [
          {
            name: 'siteId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by cinema site ID',
          },
          {
            name: 'date',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by date (ISO 8601)',
          },
        ],
        responses: {
          '200': {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SessionList',
                },
              },
            },
          },
        },
      },
    },
    '/sites/{siteId}': {
      get: {
        operationId: 'getSite',
        summary: 'Get site details',
        parameters: [
          {
            name: 'siteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The site ID',
          },
        ],
        responses: {
          '200': {
            description: 'Site details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Site',
                },
              },
            },
          },
          '404': {
            description: 'Site not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Session ID' },
          filmTitle: { type: 'string', description: 'Film title' },
          startTime: { type: 'string', description: 'Start time (ISO 8601)' },
          format: {
            type: 'string',
            enum: ['2D', '3D', 'IMAX'],
            description: 'Presentation format',
          },
          seatsAvailable: { type: 'number', description: 'Available seats' },
        },
        required: ['id', 'filmTitle', 'startTime', 'format', 'seatsAvailable'],
      },
      SessionList: {
        type: 'object',
        properties: {
          sessions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Session' },
          },
          total: { type: 'number' },
        },
        required: ['sessions', 'total'],
      },
      Site: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          city: { type: 'string' },
          screens: { type: 'number' },
        },
        required: ['id', 'name', 'city', 'screens'],
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['code', 'message'],
      },
    },
  },
};

/**
 * Template for generated TypeScript types output.
 */
export const generatedTypesTemplate = `/**
 * Generated from Cinema API v1.0.0
 * A simple cinema management API
 */

/**
 * Session
 */
export interface Session {
  /** Session ID */
  id: string;
  /** Film title */
  filmTitle: string;
  /** Start time (ISO 8601) */
  startTime: string;
  /** Presentation format */
  format: 'string' | '3D' | 'IMAX';
  /** Available seats */
  seatsAvailable: number;
}

/**
 * SessionList
 */
export interface SessionList {
  sessions: Session[];
  total: number;
}

/**
 * Site
 */
export interface Site {
  id: string;
  name: string;
  city: string;
  screens: number;
}

/**
 * Error
 */
export interface Error {
  code: string;
  message: string;
}
`;

/**
 * Template for generated Zod schemas output.
 */
export const generatedZodTemplate = `import { z } from "zod";

export const sessionSchema = z.object({
  id: z.string(),
  filmTitle: z.string(),
  startTime: z.string(),
  format: z.enum(['2D', '3D', 'IMAX']),
  seatsAvailable: z.number(),
});

export const sessionListSchema = z.object({
  sessions: z.array(sessionSchema),
  total: z.number(),
});

export const siteSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  screens: z.number(),
});

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
`;
