# OpenAPI Spec Generator (`src/openapi/`)

> **Auto-generates OpenAPI 3.0 specifications from Express routes, with schema integration, security schemes, and documentation support for the Agent Gateway.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Type Definitions](#type-definitions)
5. [Class API](#class-api)
6. [Usage Examples](#usage-examples)
7. [Security Schemes](#security-schemes)
8. [Common Responses and Schemas](#common-responses-and-schemas)
9. [Output Formats](#output-formats)
10. [OpenAPI Specification Structure](#openapi-specification-structure)
11. [Integration Points](#integration-points)
12. [Error Handling](#error-handling)
13. [Best Practices](#best-practices)
14. [Related Documentation](#related-documentation)

---

## Overview

The `openapi/` module provides an **OpenAPI 3.0.3 specification generator** for the Agent Gateway. It enables programmatic construction of API documentation that can be served by tools like Swagger UI, Redoc, or any OpenAPI-compatible viewer.

Key capabilities:

- **OpenAPI 3.0.3 compliance** -- Generates specs compatible with the OpenAPI Specification 3.0.3
- **Path and operation management** -- Add paths with HTTP methods, summaries, descriptions, and tags
- **Security scheme support** -- Bearer token (JWT) and API key authentication schemes
- **Common response schemas** -- Pre-built error and pagination schemas for consistent documentation
- **Component management** -- Add custom schemas, security schemes, parameters, and responses
- **Multiple output formats** -- JSON, YAML (via stringification), and programmatic object access
- **Tag organization** -- Group endpoints by functional area for better documentation navigation

This module is essential for:

- **API documentation** -- Generate Swagger UI-compatible specs for developer reference
- **Client code generation** -- Generate SDKs in multiple languages from the spec
- **API contract testing** -- Use the spec as the source of truth for contract tests
- **Gateway configuration** -- Some API gateways (Kong, Apigee) can import OpenAPI specs
- **Developer onboarding** -- Provide interactive API exploration for new team members

---

## File Structure

```
openapi/
└── index.ts          # OpenApiGenerator class, factory, type definitions
```

The module is implemented in a single file (~200 lines) containing the `OpenApiGenerator` class with full type definitions for OpenAPI components, path items, and info metadata.

---

## Architecture

```
                    OpenApiGenerator
                    constructor(info)
                         │
                         ▼
          ┌─────────────────────────┐
          │   Internal State        │
          │                         │
          │  - info (title, ver)    │
          │  - paths (route map)    │
          │  - components (schemas) │
          │  - servers (base URLs)  │
          │  - tags (groups)        │
          └───────────┬─────────────┘
                      │
            Add paths, schemas,
            security schemes, tags
                      │
                      ▼
          ┌─────────────────────────┐
          │   generate()            │
          │   Assemble complete     │
          │   OpenAPI spec object   │
          └───────────┬─────────────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
      generateJson()      generateYaml()
      (JSON.stringify)    (JSON with indent)
```

---

## Type Definitions

### OpenApiInfo

```typescript
interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}
```

### OpenApiPathItem

```typescript
interface OpenApiPathItem {
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
```

### OpenApiComponent

```typescript
interface OpenApiComponent {
  schemas?: Record<string, any>;
  securitySchemes?: Record<string, any>;
  parameters?: Record<string, any>;
  responses?: Record<string, any>;
}
```

---

## Class API

### `OpenApiGenerator` Class

```typescript
class OpenApiGenerator {
  constructor(info: OpenApiInfo)

  // Server management
  addServer(url: string, description?: string): void

  // Tag management
  addTag(name: string, description?: string): void

  // Path/operation management
  addPath(
    path: string,
    method: string,
    item: Omit<OpenApiPathItem, 'responses'> & { responses: Record<string, any> }
  ): void

  // Schema management
  addSchema(name: string, schema: any): void
  addSecurityScheme(name: string, scheme: any): void

  // Convenience methods
  addCommonResponses(): void
  addBearerAuth(schemeName?: string): void
  addApiKeyAuth(schemeName?: string, inHeader?: 'header' | 'query'): void

  // Output generation
  generate(): any
  generateJson(space?: number): string
  generateYaml(): string
}

function createOpenApiGenerator(info: OpenApiInfo): OpenApiGenerator
```

---

## Usage Examples

### Basic Setup

```typescript
import { createOpenApiGenerator } from '../openapi/index.js';

const openapi = createOpenApiGenerator({
  title: 'Agent Gateway API',
  version: '1.0.0',
  description: 'RESTful API for managing and communicating with AI agents',
  contact: {
    name: 'API Support',
    email: 'api-support@company.com',
    url: 'https://docs.company.com/api',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
});

// Add servers
openapi.addServer('https://api.company.com', 'Production');
openapi.addServer('https://staging-api.company.com', 'Staging');
openapi.addServer('http://localhost:3000', 'Development');

// Add tags for organization
openapi.addTag('Messages', 'Message sending and retrieval');
openapi.addTag('Sessions', 'Agent session management');
openapi.addTag('Streaming', 'Real-time streaming endpoints');
openapi.addTag('Admin', 'Administrative operations');
```

### Adding Paths and Operations

```typescript
// POST /api/send
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message to an agent',
  description: 'Sends a message to the specified channel and returns the response',
  tags: ['Messages'],
  operationId: 'sendMessage',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['channel', 'userId', 'content'],
          properties: {
            channel: { type: 'string', maxLength: 50 },
            userId: { type: 'string', maxLength: 100 },
            content: { type: 'string', maxLength: 10000 },
            metadata: { type: 'object' },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Message sent successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              messageId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    '400': { $ref: '#/components/responses/BadRequest' },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '429': { $ref: '#/components/responses/TooManyRequests' },
  },
  security: [{ bearerAuth: [] }],
});

// GET /api/sessions
openapi.addPath('/api/sessions', 'get', {
  summary: 'List agent sessions',
  description: 'Returns a paginated list of agent sessions',
  tags: ['Sessions'],
  operationId: 'listSessions',
  parameters: [
    {
      name: 'channel',
      in: 'query',
      schema: { type: 'string' },
    },
    {
      name: 'userId',
      in: 'query',
      schema: { type: 'string' },
    },
    {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 1000 },
    },
    {
      name: 'offset',
      in: 'query',
      schema: { type: 'integer', minimum: 0 },
    },
  ],
  responses: {
    '200': {
      description: 'List of sessions',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: { type: 'object' },
              },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          },
        },
      },
    },
    '401': { $ref: '#/components/responses/Unauthorized' },
  },
  security: [{ bearerAuth: [] }],
});

// POST /api/stream
openapi.addPath('/api/stream', 'post', {
  summary: 'Start a streaming conversation with an agent',
  description: 'Opens a persistent streaming connection for real-time responses',
  tags: ['Streaming'],
  operationId: 'startStream',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['channel', 'userId', 'content'],
          properties: {
            channel: { type: 'string', maxLength: 50 },
            userId: { type: 'string', maxLength: 100 },
            content: { type: 'string', maxLength: 10000 },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 },
          },
        },
      },
    },
  },
  responses: {
    '200': { description: 'Streaming connection established' },
    '400': { $ref: '#/components/responses/BadRequest' },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '429': { $ref: '#/components/responses/TooManyRequests' },
  },
  security: [{ bearerAuth: [] }],
});
```

### Serving the Spec

```typescript
import express from 'express';

const app = express();

// Serve OpenAPI JSON for Swagger UI
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapi.generateJson());
});

// Serve as YAML (for Redoc or other YAML consumers)
app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(openapi.generateYaml());
});

// Serve Swagger UI (requires swagger-ui-express)
import swaggerUi from 'swagger-ui-express';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(JSON.parse(openapi.generateJson())));
```

---

## Security Schemes

### Bearer Authentication (JWT)

```typescript
openapi.addBearerAuth();
// Adds:
// components:
//   securitySchemes:
//     bearerAuth:
//       type: http
//       scheme: bearer
//       bearerFormat: JWT
//       description: Enter your Bearer token
```

Custom scheme name:

```typescript
openapi.addBearerAuth('jwtAuth');
```

### API Key Authentication

```typescript
openapi.addApiKeyAuth();
// Adds:
// components:
//   securitySchemes:
//     apiKeyAuth:
//       type: apiKey
//       in: header
//       name: Authorization
//       description: API key authentication
```

API key in query parameter:

```typescript
openapi.addApiKeyAuth('queryApiKey', 'query');
// name: api_key, in: query
```

### Applying Security to Operations

```typescript
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message',
  security: [{ bearerAuth: [] }],
  // ...
});

// Multiple security options (client can use any one)
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message',
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  // ...
});

// No security (public endpoint)
openapi.addPath('/health', 'get', {
  summary: 'Health check',
  security: [],
  responses: { '200': { description: 'OK' } },
});
```

---

## Common Responses and Schemas

### Adding Common Responses

```typescript
openapi.addCommonResponses();
```

This adds the following reusable response schemas:

#### Error Schema

```json
{
  "schemas": {
    "Error": {
      "type": "object",
      "required": ["error", "message"],
      "properties": {
        "error": { "type": "string" },
        "message": { "type": "string" },
        "code": { "type": "string" },
        "details": { "type": "array", "items": { "type": "object" } },
        "requestId": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

#### Pagination Schema

```json
{
  "schemas": {
    "Pagination": {
      "type": "object",
      "properties": {
        "page": { "type": "integer", "minimum": 1 },
        "pageSize": { "type": "integer", "minimum": 1, "maximum": 100 },
        "total": { "type": "integer" },
        "totalPages": { "type": "integer" },
        "hasNext": { "type": "boolean" },
        "hasPrev": { "type": "boolean" }
      }
    }
  }
}
```

#### Reusable Responses

| Response | Description | Schema Reference |
|----------|-------------|-----------------|
| `Unauthorized` | Authentication required | `#/components/schemas/Error` |
| `Forbidden` | Insufficient permissions | `#/components/schemas/Error` |
| `NotFound` | Resource not found | `#/components/schemas/Error` |
| `TooManyRequests` | Rate limit exceeded | `#/components/schemas/Error` |
| `InternalServerError` | Internal server error | `#/components/schemas/Error` |

### Using Common Responses

```typescript
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message',
  responses: {
    '200': { description: 'Message sent' },
    '400': { $ref: '#/components/responses/Unauthorized' },
    '401': { $ref: '#/components/responses/Unauthorized' },
    '403': { $ref: '#/components/responses/Forbidden' },
    '429': { $ref: '#/components/responses/TooManyRequests' },
    '500': { $ref: '#/components/responses/InternalServerError' },
  },
});
```

### Custom Schemas

```typescript
openapi.addSchema('Message', {
  type: 'object',
  required: ['channel', 'userId', 'content'],
  properties: {
    channel: { type: 'string', maxLength: 50 },
    userId: { type: 'string', maxLength: 100 },
    content: { type: 'string', maxLength: 10000 },
    metadata: { type: 'object' },
  },
});

openapi.addSchema('MessageResponse', {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    messageId: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    content: { $ref: '#/components/schemas/Message' },
  },
});
```

---

## Output Formats

### JSON Output

```typescript
const json = openapi.generateJson();
// Returns formatted JSON string with 2-space indentation

const compactJson = openapi.generateJson(0);
// Returns minified JSON (no whitespace)
```

### YAML Output

```typescript
const yaml = openapi.generateYaml();
// Note: Currently returns JSON string (production should use js-yaml)
```

### Programmatic Object

```typescript
const spec = openapi.generate();
// Returns the complete OpenAPI spec as a JavaScript object
// Useful for programmatic manipulation or custom serialization
```

---

## OpenAPI Specification Structure

The generated spec follows this structure:

```yaml
openapi: "3.0.3"
info:
  title: "Agent Gateway API"
  version: "1.0.0"
  description: "..."
  contact:
    name: "..."
    email: "..."
servers:
  - url: "https://api.company.com"
    description: "Production"
tags:
  - name: "Messages"
    description: "Message sending and retrieval"
paths:
  /api/send:
    post:
      summary: "Send a message to an agent"
      operationId: "sendMessage"
      tags: ["Messages"]
      requestBody: { ... }
      responses: { ... }
      security: [{ "bearerAuth": [] }]
components:
  schemas:
    Error: { ... }
    Pagination: { ... }
  securitySchemes:
    bearerAuth: { ... }
  responses:
    Unauthorized: { ... }
    Forbidden: { ... }
```

### Auto-Generated Operation IDs

If no `operationId` is provided, one is auto-generated:

```typescript
// For path "/api/send", method "post"
// Auto-generated: "post_api_send"

// For path "/api/users/{id}", method "get"
// Auto-generated: "get_api_users_{id}"
```

The algorithm replaces `{` and `}` with empty strings, replaces `/` with `_`, and removes the leading underscore.

### Path Normalization

Express-style path parameters are converted to OpenAPI format:

```
Express:  /api/users/:id
OpenAPI:  /api/users/{id}
```

```typescript
addPath('/api/users/:id', 'get', { ... });
// Stored as /api/users/{id} in the spec
```

---

## Integration Points

### With `src/middleware/` (Validation)

The `ValidationManager` in `middleware/validation.ts` has its own `generateOpenApiSpec()` method. Merge its output with the dedicated OpenAPI generator:

```typescript
import { createValidationManager } from '../middleware/validation.js';

const validation = createValidationManager();
const openapi = createOpenApiGenerator({
  title: 'Agent Gateway API',
  version: '1.0.0',
});

// Merge validation-generated paths
const validationSpec = validation.generateOpenApiSpec({
  title: 'Agent Gateway API',
  version: '1.0.0',
});

for (const [path, methods] of Object.entries(validationSpec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    openapi.addPath(path, method, {
      ...operation,
      summary: operation.summary,
      requestBody: operation.requestBody,
      parameters: operation.parameters,
      responses: operation.responses,
    });
  }
}

// Then add security schemes and common responses
openapi.addBearerAuth();
openapi.addCommonResponses();
```

### With `src/middleware/` (Rate Limiting)

Document rate-limited endpoints:

```typescript
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message',
  responses: {
    '200': { description: 'Message sent' },
    '429': {
      description: 'Rate limit exceeded',
      headers: {
        'X-RateLimit-Limit': { schema: { type: 'integer' } },
        'X-RateLimit-Remaining': { schema: { type: 'integer' } },
        'X-RateLimit-Reset': { schema: { type: 'integer' } },
        'Retry-After': { schema: { type: 'integer' } },
      },
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              retryAfter: { type: 'integer' },
            },
          },
        },
      },
    },
  },
});
```

### With ``

Document idempotency headers:

```typescript
openapi.addPath('/api/send', 'post', {
  summary: 'Send a message',
  parameters: [{
    name: 'X-Idempotency-Key',
    in: 'header',
    required: false,
    schema: { type: 'string' },
    description: 'Unique key to ensure idempotent request processing',
  }],
  // ...
});
```

### With `src/infra/` (Logger)

Log spec generation for audit:

```typescript
logger.info({ title: openapiSpec.info.title, version: openapiSpec.info.version }, 'OpenAPI spec generated');
```

---

## Error Handling

### Minimal Error Handling

This module is a spec generator and does not throw errors during normal operation. Invalid inputs are passed through to the generated spec. The following behaviors are notable:

- **Duplicate paths**: Later `addPath()` calls overwrite earlier ones for the same path + method combination
- **Duplicate tags**: `addTag()` is idempotent -- adding the same tag twice has no additional effect
- **Empty components**: Sections with no schemas, security schemes, etc. are omitted from the output
- **Missing info fields**: `description`, `contact`, and `license` are only included if provided

### Server Validation

The module does not validate server URLs. Invalid URLs will appear in the spec and only cause issues when consumers attempt to use them.

---

## Best Practices

1. **Call `addCommonResponses()` early** -- This adds the Error and Pagination schemas that other parts of the spec reference. Call it before adding paths that use `$ref` to common responses.

2. **Use consistent operation IDs** -- Operation IDs are used by code generators. Use descriptive, verb-noun patterns like `sendMessage`, `getUser`, `listSessions`.

3. **Organize with tags** -- Tags make the API documentation navigable. Group related endpoints under the same tag.

4. **Document all error responses** -- Include `4xx` and `5xx` responses with `$ref` to common responses for consistency.

5. **Add descriptions to parameters** -- Parameter descriptions help API consumers understand what each parameter does and what format it expects.

6. **Use $ref for reusable schemas** -- Define schemas once with `addSchema()` and reference them with `$ref` to keep the spec DRY.

7. **Include all authentication methods** -- Add both bearer auth and API key schemes if your gateway supports both, even if individual operations only use one.

8. **Serve the spec alongside the API** -- Serve the OpenAPI JSON at `/openapi.json` and set up Swagger UI at `/api-docs` for interactive exploration.

9. **Version your API** -- Include the API version in the spec's `info.version` field. Update it when making breaking changes.

10. **Keep the spec in sync with routes** -- Use CI checks to validate the spec against actual routes. Consider generating the spec programmatically from route definitions rather than maintaining it manually.

---

## Related Documentation

- [`src/middleware/`](../middleware/README.md) -- Validation middleware with its own OpenAPI generation
- [``](../idempotency/README.md) -- Idempotency system documented in OpenAPI specs
- [`src/api-gateway/`](../api-gateway/README.md) -- Main API gateway that serves the documented endpoints
- [`src/agents/`](../agents/README.md) -- Agent services exposed through the API
- [`src/server/`](../server/README.md) -- Server setup that hosts the API documentation
