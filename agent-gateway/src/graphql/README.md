# GraphQL Gateway (`src/graphql/`)

> **GraphQL schema stitching, federation, and API gateway integration for unified data access across services.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Type Definitions](#type-definitions)
5. [Class API](#class-api)
6. [Usage Examples](#usage-examples)
7. [Schema Generation (SDL)](#schema-generation-sdl)
8. [Service Proxying](#service-proxying)
9. [Error Handling](#error-handling)
10. [Integration Points](#integration-points)
11. [Metrics and Monitoring](#metrics-and-monitoring)
12. [Best Practices](#best-practices)
13. [Limitations and Future Enhancements](#limitations-and-future-enhancements)
14. [Related Documentation](#related-documentation)

---

## Overview

The `graphql/` module provides a **lightweight GraphQL gateway** for the Agent Gateway. It serves as a unified entry point for GraphQL operations, supporting:

- **Custom schema definition** -- Register types, queries, mutations, and subscriptions programmatically
- **Service proxying** -- Forward queries to upstream GraphQL services when no local resolver exists
- **SDL generation** -- Generate Schema Definition Language from registered operations
- **Operation metrics** -- Track query counts, error rates, and registered entity counts
- **Event-driven architecture** -- Extends `EventEmitter` for lifecycle hooks

This module is designed as a programmatic schema builder rather than a full GraphQL parser. It manages its own registry of operations and proxies to upstream services when needed. It is ideal for:

- **Schema stitching** -- Combining multiple GraphQL services into a single gateway
- **API gateway pattern** -- Routing GraphQL queries to appropriate backend services
- **Custom resolvers** -- Defining gateway-level resolvers that orchestrate multiple services
- **Schema documentation** -- Auto-generating SDL from registered operations

---

## File Structure

```
graphql/
└── index.ts          # GraphQLGateway class, factory, type definitions
```

The module is implemented in a single file (~195 lines) containing the `GraphQLGateway` class with full type definitions for GraphQL types, queries, mutations, subscriptions, and services.

---

## Architecture

```
                    Client Query
                         │
                         ▼
              ┌─────────────────────┐
              │   GraphQLGateway    │
              │                     │
              │  1. Parse query     │
              │  2. Extract op name │
              │  3. Lookup resolver │
              └─────────┬───────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌───────────────────────┐
    │ Local Resolver│      │ Upstream Service Proxy│
    │ Found in map  │      │ (fetch to service URL)│
    └───────┬───────┘      └───────────┬───────────┘
            │                          │
            ▼                          ▼
    ┌───────────────┐      ┌───────────────────────┐
    │ Execute local │      │ POST to upstream URL  │
    │ resolver fn   │      │ with query + variables│
    └───────┬───────┘      └───────────┬───────────┘
            │                          │
            └──────────┬───────────────┘
                       ▼
              ┌─────────────────────┐
              │  Return result with │
              │  { data, extensions }│
              │  or { errors }      │
              └─────────────────────┘
```

---

## Type Definitions

### GraphQL Field

```typescript
interface GraphQLField {
  name: string;
  type: string;
  description?: string;
  args?: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
  deprecated?: boolean;
  deprecationReason?: string;
}
```

### GraphQL Type

```typescript
interface GraphQLType {
  name: string;
  kind: 'object' | 'input' | 'enum' | 'scalar' | 'union' | 'interface';
  description?: string;
  fields?: Record<string, GraphQLField>;
  values?: string[];  // For enum types
}
```

### GraphQL Query

```typescript
interface GraphQLQuery {
  name: string;
  description?: string;
  args?: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
  returnType: string;
  resolver: (args: any, context: any) => Promise<any>;
  deprecated?: boolean;
}
```

### GraphQL Mutation

```typescript
interface GraphQLMutation {
  name: string;
  description?: string;
  args: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
  returnType: string;
  resolver: (args: any, context: any) => Promise<any>;
}
```

### GraphQL Subscription

```typescript
interface GraphQLSubscription {
  name: string;
  description?: string;
  returnType: string;
  filter?: (payload: any, args: any, context: any) => boolean;
}
```

### GraphQL Service

```typescript
interface GraphQLService {
  name: string;
  url: string;
  schema?: string;
  introspection?: any;
  headers?: Record<string, string>;
}
```

---

## Class API

### `GraphQLGateway` Class

```typescript
class GraphQLGateway extends EventEmitter {
  // Type registration
  registerType(type: GraphQLType): void

  // Operation registration
  registerQuery(query: GraphQLQuery): void
  registerMutation(mutation: GraphQLMutation): void
  registerSubscription(subscription: GraphQLSubscription): void

  // Service registration
  registerService(service: GraphQLService): void

  // Query execution
  execute(
    query: string,
    variables?: Record<string, any>,
    context?: any
  ): Promise<any>

  // Schema generation
  generateSDL(): string

  // Statistics
  getStats(): {
    queries: number;
    mutations: number;
    subscriptions: number;
    services: number;
    types: number;
    totalQueries: number;
    errorCount: number;
  }
}
```

### Factory Function

```typescript
function createGraphQLGateway(): GraphQLGateway
```

---

## Usage Examples

### Basic Setup with Queries and Mutations

```typescript
import { createGraphQLGateway } from '../graphql/index.js';

const gateway = createGraphQLGateway();

// Register a query
gateway.registerQuery({
  name: 'Query.user',
  description: 'Get user by ID',
  args: {
    id: { type: 'ID!', description: 'User ID', required: true },
  },
  returnType: 'User',
  resolver: async (args, context) => {
    return {
      id: args.id,
      name: 'John Doe',
      email: 'john@example.com',
    };
  },
});

// Register a mutation
gateway.registerMutation({
  name: 'Mutation.createUser',
  description: 'Create a new user',
  args: {
    name: { type: 'String!', required: true },
    email: { type: 'String!', required: true },
  },
  returnType: 'User',
  resolver: async (args, context) => {
    const user = await db.users.create({
      name: args.name,
      email: args.email,
    });
    return user;
  },
});

// Execute a query
const result = await gateway.execute(
  'query user($id: ID!) { user(id: $id) { id name email } }',
  { id: '123' },
  { userId: 'admin' }
);

console.log(result);
// {
//   data: { id: '123', name: 'John Doe', email: 'john@example.com' },
//   extensions: { latency: 42 }
// }
```

### Registering Custom Types

```typescript
const gateway = createGraphQLGateway();

// Register an enum type
gateway.registerType({
  name: 'UserRole',
  kind: 'enum',
  values: ['ADMIN', 'USER', 'MODERATOR'],
});

// Register an object type
gateway.registerType({
  name: 'User',
  kind: 'object',
  fields: {
    id: { name: 'id', type: 'ID!' },
    name: { name: 'name', type: 'String!' },
    email: { name: 'email', type: 'String!' },
    role: { name: 'role', type: 'UserRole' },
  },
});

// Register an input type
gateway.registerType({
  name: 'CreateUserInput',
  kind: 'input',
  fields: {
    name: { name: 'name', type: 'String!' },
    email: { name: 'email', type: 'String!' },
    role: { name: 'role', type: 'UserRole' },
  },
});

// Register a scalar
gateway.registerType({
  name: 'DateTime',
  kind: 'scalar',
});
```

### Registering Subscriptions

```typescript
gateway.registerSubscription({
  name: 'Subscription.userCreated',
  description: 'Triggered when a new user is created',
  returnType: 'User',
  filter: (payload, args, context) => {
    // Only send to subscribers interested in this user's tenant
    return payload.tenantId === context.tenantId;
  },
});
```

### Proxying to Upstream Services

```typescript
// Register an upstream GraphQL service
gateway.registerService({
  name: 'users-service',
  url: 'http://users-service:4000/graphql',
  headers: {
    'Authorization': `Bearer ${process.env.USERS_SERVICE_TOKEN}`,
  },
});

gateway.registerService({
  name: 'products-service',
  url: 'http://products-service:4001/graphql',
  headers: {
    'X-API-Key': process.env.PRODUCTS_API_KEY,
  },
});

// Queries without local resolvers are proxied to the first registered service
const result = await gateway.execute(`
  query {
    allProducts {
      id
      name
      price
    }
  }
`);
// Proxied to products-service since no local resolver exists for this query
```

### Integrating with Express

```typescript
import express from 'express';
import { createGraphQLGateway } from '../graphql/index.js';

const app = express();
app.use(express.json());

const gateway = createGraphQLGateway();
// ... register queries, mutations, services ...

app.post('/graphql', async (req, res) => {
  const { query, variables } = req.body;
  const context = {
    userId: req.headers['x-user-id'],
    tenantId: req.headers['x-tenant-id'],
  };

  const result = await gateway.execute(query, variables, context);
  res.json(result);
});
```

---

## Schema Generation (SDL)

The gateway can generate SDL from all registered types and operations:

```typescript
const sdl = gateway.generateSDL();
console.log(sdl);
```

### Generated SDL Output

For registered types and operations, the output looks like:

```graphql
enum UserRole {
  ADMIN
  USER
  MODERATOR
}

scalar DateTime

type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole
}

input CreateUserInput {
  name: String!
  email: String!
  role: UserRole
}

type Query {
  user(id: ID!): User
}

type Mutation {
  createUser(name: String!, email: String!): User
}

type Subscription {
  userCreated: User
}
```

### SDL Generation Rules

| Element | SDL Format |
|---------|-----------|
| Enum | `enum Name { VALUE1\n  VALUE2 }` |
| Scalar | `scalar Name` |
| Input | `input Name {\n  field: Type\n}` |
| Object | `type Name {\n  field(args): Type\n}` |
| Query | `type Query {\n  queryName(args): ReturnType\n}` |
| Mutation | `type Mutation {\n  mutationName(args): ReturnType\n}` |
| Subscription | `type Subscription {\n  subName: ReturnType\n}` |

Types are rendered first, followed by Query, Mutation, and Subscription types (only if they have registered operations).

---

## Service Proxying

When `execute()` is called and no local resolver matches the operation name, the gateway proxies the query to the first registered upstream service:

```typescript
private async proxyToService(query: string, variables?: Record<string, any>): Promise<any> {
  const service = this.services.values().next().value;
  if (!service) {
    throw new Error('No upstream GraphQL service registered');
  }

  const response = await fetch(service.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...service.headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Upstream service error: ${response.status}`);
  }

  return response.json();
}
```

### Proxy Behavior

- Uses the **first** registered service as the fallback target
- Forwards the raw query, variables, and service-configured headers
- Returns the upstream response directly to the client
- Throws on HTTP errors (non-2xx responses)

---

## Error Handling

### Execution Errors

When a local resolver throws, the gateway catches the error and returns a standard GraphQL error format:

```typescript
{
  errors: [{
    message: err.message,
    extensions: { code: 'INTERNAL_ERROR' }
  }]
}
```

### Service Proxy Errors

- **No service registered**: Throws `"No upstream GraphQL service registered"`
- **HTTP error**: Throws `"Upstream service error: <status>"`
- **Network error**: Propagates the fetch error, caught and returned as `{ errors: [...] }`

### Operation Name Extraction

The gateway extracts the operation name from the query string using regex:

```typescript
const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
```

If no operation name is found, it defaults to `'anonymous'`. The resolver lookup uses this key (e.g., `Query.getUser`).

---

## Integration Points

### With `src/middleware/` (Validation)

Combine with Zod-based validation for input schemas:

```typescript
import { createValidationManager } from '../middleware/validation.js';

const validation = createValidationManager();
validation.addRule({
  method: 'POST',
  path: /^\/graphql$/,
  body: z.object({
    query: z.string(),
    variables: z.record(z.any()).optional(),
  }),
});

app.post('/graphql', validation.middleware(), async (req, res) => {
  const result = await gateway.execute(req.body.query, req.body.variables);
  res.json(result);
});
```

### With `src/middleware/` (Rate Limiting)

Apply rate limits specifically to GraphQL endpoints:

```typescript
import { createRateLimitManager } from '../middleware/rate-limit.js';

const rateLimiter = createRateLimitManager();
rateLimiter.addRule({
  name: 'graphql',
  max: 100,
  window: 60,
  keyFn: (req) => `graphql:${req.user?.id || req.ip || 'unknown'}`,
  pathPattern: /\/graphql/,
});

app.post('/graphql', rateLimiter.middleware(), ...);
```

### With `src/openapi/`

Document the GraphQL gateway as REST endpoints:

```typescript
import { createOpenApiGenerator } from '../openapi/index.js';

const openapi = createOpenApiGenerator({
  title: 'Agent Gateway GraphQL API',
  version: '1.0.0',
  description: 'GraphQL API for unified data access',
});

openapi.addPath('/graphql', 'post', {
  summary: 'Execute GraphQL query',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            variables: { type: 'object' },
          },
        },
      },
    },
  },
  responses: {
    '200': { description: 'GraphQL response' },
  },
});
```

### With `src/infra/` (Logger)

All service registrations and query executions are logged:

```typescript
logger.info({ service: service.name, url: service.url }, 'GraphQL service registered');
logger.debug({ operation: operationName, latency, variables }, 'GraphQL query executed');
logger.error({ query, variables, err }, 'GraphQL execution error');
```

---

## Metrics and Monitoring

The gateway tracks comprehensive statistics:

```typescript
const stats = gateway.getStats();
// {
//   queries: 5,           // Number of registered queries
//   mutations: 3,         // Number of registered mutations
//   subscriptions: 2,     // Number of registered subscriptions
//   services: 2,          // Number of registered upstream services
//   types: 4,             // Number of registered custom types
//   totalQueries: 1523,   // Total queries executed (lifetime)
//   errorCount: 12        // Total errors encountered
// }
```

---

## Best Practices

1. **Register upstream services first** -- If a query does not match a local resolver, it will be proxied to the first registered service. Order matters.

2. **Use descriptive operation names** -- The operation name extracted from the query string is used to look up resolvers. Use `Query.getUser` or `Mutation.createUser` patterns.

3. **Validate inputs before execution** -- Combine with the `middleware/validation.ts` module to validate query variables before passing them to resolvers.

4. **Monitor query latency** -- The `extensions.latency` field in results provides execution timing. Track this in your metrics pipeline.

5. **Use context for auth** -- Pass authentication context (user ID, tenant ID, roles) through the `context` parameter to resolvers.

6. **Register types for SDL** -- Even though the gateway does not enforce the schema at runtime, registering types enables SDL generation for documentation and client tooling.

7. **Handle upstream service failures** -- The proxy function throws on non-2xx responses. Wrap calls in try/catch for graceful degradation.

---

## Limitations and Future Enhancements

### Current Limitations

- **Simplified query parsing** -- Uses regex for operation name extraction. Does not parse or validate the full GraphQL AST.
- **Single upstream service fallback** -- Proxies to the first registered service, not routing based on query content.
- **No schema stitching** -- Does not automatically merge schemas from upstream services.
- **No subscription pub/sub** -- Subscriptions are registered but the actual pub/sub mechanism is not implemented.
- **No field-level resolvers** -- Resolvers are at the operation level, not per-field.

### Recommended Enhancements

- Integrate a full GraphQL parser (e.g., `graphql-js`) for proper query validation
- Implement content-based routing to select the correct upstream service
- Add Apollo Federation or schema stitching support
- Implement a proper pub/sub system for subscriptions
- Add DataLoader for batching and caching

---

## Related Documentation

- [`src/openapi/`](../openapi/README.md) -- OpenAPI spec generation for documenting the GraphQL endpoint
- [`src/middleware/`](../middleware/README.md) -- Rate limiting and validation middleware for GraphQL routes
- [`src/api-gateway/`](../api-gateway/README.md) -- Main API gateway that may host the GraphQL endpoint
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [`src/agents/`](../agents/README.md) -- Agent services that may be queried via GraphQL
