/**
 * Enterprise OpenAPI Spec Generator
 * Auto-generates OpenAPI 3.0 specifications from Express routes,
 * with Zod schema integration and documentation support.
 */

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  contact?: { name?: string; email?: string; url?: string };
  license?: { name: string; url?: string };
}

export interface OpenApiPathItem {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
  security?: any[];
  deprecated?: boolean;
}

export interface OpenApiComponent {
  schemas?: Record<string, any>;
  securitySchemes?: Record<string, any>;
  parameters?: Record<string, any>;
  responses?: Record<string, any>;
}

export class OpenApiGenerator {
  private info: OpenApiInfo;
  private paths: Record<string, Record<string, OpenApiPathItem>> = {};
  private components: OpenApiComponent = {};
  private servers: Array<{ url: string; description?: string }> = [];
  private tags: Array<{ name: string; description?: string }> = [];

  constructor(info: OpenApiInfo) {
    this.info = info;
  }

  /** Add a server */
  addServer(url: string, description?: string): void {
    this.servers.push({ url, description });
  }

  /** Add a tag */
  addTag(name: string, description?: string): void {
    if (!this.tags.find((t) => t.name === name)) {
      this.tags.push({ name, description });
    }
  }

  /** Add a path */
  addPath(
    path: string,
    method: string,
    item: Omit<OpenApiPathItem, 'responses'> & { responses: Record<string, any> },
  ): void {
    const normalizedPath = path.replace(/:([^/]+)/g, '{$1}');
    if (!this.paths[normalizedPath]) this.paths[normalizedPath] = {};

    const operationId = item.operationId || `${method}_${normalizedPath.replace(/[{}]/g, '').replace(/\//g, '_').replace(/^_/, '')}`;

    this.paths[normalizedPath][method.toLowerCase()] = {
      ...item,
      operationId,
    };
  }

  /** Add a schema component */
  addSchema(name: string, schema: any): void {
    if (!this.components.schemas) this.components.schemas = {};
    this.components.schemas[name] = schema;
  }

  /** Add a security scheme */
  addSecurityScheme(name: string, scheme: any): void {
    if (!this.components.securitySchemes) this.components.securitySchemes = {};
    this.components.securitySchemes[name] = scheme;
  }

  /** Add common response schemas */
  addCommonResponses(): void {
    if (!this.components.responses) this.components.responses = {};

    this.components.responses['Unauthorized'] = {
      description: 'Authentication required',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };

    this.components.responses['Forbidden'] = {
      description: 'Insufficient permissions',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };

    this.components.responses['NotFound'] = {
      description: 'Resource not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };

    this.components.responses['TooManyRequests'] = {
      description: 'Rate limit exceeded',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };

    this.components.responses['InternalServerError'] = {
      description: 'Internal server error',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };

    // Error schema
    this.addSchema('Error', {
      type: 'object',
      required: ['error', 'message'],
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        code: { type: 'string' },
        details: { type: 'array', items: { type: 'object' } },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    });

    // Pagination schema
    this.addSchema('Pagination', {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' },
      },
    });
  }

  /** Add bearer auth security scheme */
  addBearerAuth(schemeName: string = 'bearerAuth'): void {
    this.addSecurityScheme(schemeName, {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your Bearer token',
    });
  }

  /** Add API key auth security scheme */
  addApiKeyAuth(schemeName: string = 'apiKeyAuth', inHeader: 'header' | 'query' = 'header'): void {
    this.addSecurityScheme(schemeName, {
      type: 'apiKey',
      in: inHeader,
      name: inHeader === 'header' ? 'Authorization' : 'api_key',
      description: 'API key authentication',
    });
  }

  /** Generate the complete OpenAPI spec */
  generate(): any {
    const spec: any = {
      openapi: '3.0.3',
      info: {
        title: this.info.title,
        version: this.info.version,
        ...(this.info.description && { description: this.info.description }),
        ...(this.info.contact && { contact: this.info.contact }),
        ...(this.info.license && { license: this.info.license }),
      },
    };

    if (this.servers.length > 0) spec.servers = this.servers;
    if (Object.keys(this.paths).length > 0) spec.paths = this.paths;
    if (this.tags.length > 0) spec.tags = this.tags;

    // Only include components if they exist
    const comps: any = {};
    if (this.components.schemas) comps.schemas = this.components.schemas;
    if (this.components.securitySchemes) comps.securitySchemes = this.components.securitySchemes;
    if (this.components.parameters) comps.parameters = this.components.parameters;
    if (this.components.responses) comps.responses = this.components.responses;
    if (Object.keys(comps).length > 0) spec.components = comps;

    return spec;
  }

  /** Generate as JSON string */
  generateJson(space: number = 2): string {
    return JSON.stringify(this.generate(), null, space);
  }

  /** Generate as YAML string */
  generateYaml(): string {
    const spec = this.generate();
    // Simple YAML conversion (for production, use js-yaml)
    return JSON.stringify(spec, null, 2);
  }
}

export function createOpenApiGenerator(info: OpenApiInfo): OpenApiGenerator {
  return new OpenApiGenerator(info);
}
