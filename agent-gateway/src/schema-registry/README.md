# Schema Registry

## Overview

The **Schema Registry** module (`agent-gateway/src/schema-registry/`) provides JSON Schema-based request and response validation with versioning, compatibility checking, and automatic documentation. It acts as a central registry for all data schemas used across the gateway, enabling schema evolution with backward/forward compatibility guarantees.

The registry stores multiple versions of each named schema, supports deprecation with successor references, and can validate arbitrary data objects against registered schemas. The compatibility checker detects breaking changes such as removed required properties, new required fields without defaults, type changes, and property removals.

### Key Capabilities

- **Schema Versioning**: Register multiple versions of the same schema by name.
- **Compatibility Checking**: Detect breaking changes between schema versions (backward, forward, full, or none).
- **Data Validation**: Validate arbitrary data objects against registered schemas with detailed error messages.
- **Schema Deprecation**: Mark schema versions as deprecated with successor references.
- **Type Checking**: Validates field types, enum values, min/max constraints, and string length constraints.
- **Additional Properties**: Enforces `additionalProperties: false` when specified in the schema.
- **Schema Listing**: List all registered schemas with version history.
- **Statistics**: Track total schemas, versions, and deprecation counts.

---

## File Structure

```
agent-gateway/src/schema-registry/
  index.ts              # Main implementation (SchemaRegistry class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for schema registration events.
- `../infra/index.js` (the shared `logger` singleton) for info/warn logging.

---

## Full API Documentation

### Interfaces

#### `SchemaDefinition`

```ts
interface SchemaDefinition {
  name: string;
  version: string;
  schema: Record<string, any>;
  description?: string;
  deprecated?: boolean;
  successor?: string;  // "name:version" of the successor schema
  createdAt: number;
}
```

| Property      | Type                | Description                              |
|---------------|---------------------|------------------------------------------|
| `name`        | string              | Schema name (e.g., `CreateUserRequest`)  |
| `version`     | string              | Version string (e.g., `1.0.0`)           |
| `schema`      | Record<string, any> | JSON Schema object                       |
| `description` | string?             | Human-readable description               |
| `deprecated`  | boolean?            | Whether this version is deprecated       |
| `successor`   | string?             | Reference to the successor schema        |
| `createdAt`   | number              | Registration timestamp                   |

#### `SchemaCompatibilityResult`

```ts
interface SchemaCompatibilityResult {
  compatible: boolean;
  type: 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
  breakingChanges: string[];
  warnings: string[];
}
```

| Property          | Type       | Description                              |
|-------------------|------------|------------------------------------------|
| `compatible`      | boolean    | Whether the transition is safe           |
| `type`            | string     | Compatibility level                      |
| `breakingChanges` | string[]   | List of breaking changes detected        |
| `warnings`        | string[]   | Non-breaking but noteworthy changes      |

---

### Class: `SchemaRegistry`

Extends `EventEmitter`.

#### Constructor

```ts
constructor()
```

No configuration needed.

#### Methods

##### `register(schema: Omit<SchemaDefinition, 'createdAt'>): SchemaDefinition`

Registers a new schema version. Appends to the version list for the schema name.

Emits `schema:registered`.

```ts
registry.register({
  name: 'CreateUserRequest',
  version: '1.0.0',
  description: 'Request body for creating a user',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'user', 'guest'] },
    },
    required: ['name', 'email'],
    additionalProperties: false,
  },
});
```

##### `getLatest(name: string): SchemaDefinition | null`

Returns the most recently registered version of a schema.

```ts
const latest = registry.getLatest('CreateUserRequest');
```

##### `getVersion(name: string, version: string): SchemaDefinition | null`

Returns a specific version of a schema.

```ts
const v1 = registry.getVersion('CreateUserRequest', '1.0.0');
```

##### `getVersions(name: string): SchemaDefinition[]`

Returns all versions of a schema.

##### `checkCompatibility(name: string, oldVersion: string, newVersion: string): SchemaCompatibilityResult`

Compares two versions of the same schema and detects breaking changes.

Checks performed:
- **Removed required properties**: Warning (non-breaking).
- **New required properties without defaults**: Breaking change.
- **Removed properties**: Breaking change.
- **Type changes**: Breaking change.

```ts
registry.register({
  name: 'CreateUserRequest',
  version: '2.0.0',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      password: { type: 'string' }, // New required field
    },
    required: ['name', 'email', 'password'],
  },
});

const result = registry.checkCompatibility('CreateUserRequest', '1.0.0', '2.0.0');
console.log(result.compatible); // false
console.log(result.breakingChanges); // ["New required property 'password' added without default"]
```

##### `validate(name: string, version: string | undefined, data: any): { valid: boolean; errors: string[] }`

Validates data against a schema. If `version` is `undefined`, uses the latest version.

Validations performed:
- **Required fields**: Checks for missing required fields.
- **Type checking**: Validates field types against schema definitions.
- **Enum validation**: Checks that enum values are in the allowed set.
- **Min/max**: Validates numeric minimum and maximum values.
- **String length**: Validates `minLength` and `maxLength`.
- **Additional properties**: Rejects unknown fields if `additionalProperties: false`.

```ts
const result = registry.validate('CreateUserRequest', '1.0.0', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'superuser', // Invalid enum value
});

console.log(result.valid); // false
console.log(result.errors); // ["Field 'role' value 'superuser' not in allowed values: admin, user, guest"]
```

##### `deprecate(name: string, version: string, successor?: string): boolean`

Marks a schema version as deprecated. Optionally specifies a successor schema.

```ts
registry.deprecate('CreateUserRequest', '1.0.0', 'CreateUserRequest:2.0.0');
```

##### `list(): Array<{ name, versions, latest }>`

Lists all registered schemas with their version histories.

```ts
const schemas = registry.list();
// [
//   { name: 'CreateUserRequest', versions: ['1.0.0', '2.0.0'], latest: '2.0.0' },
//   { name: 'UpdateUserRequest', versions: ['1.0.0'], latest: '1.0.0' },
// ]
```

##### `getStats(): { totalSchemas, totalVersions, deprecated }`

Returns registry statistics.

---

### Factory Function

```ts
function createSchemaRegistry(): SchemaRegistry
```

Convenience factory.

---

## Configuration Options

The `SchemaRegistry` has no constructor configuration. All settings are per-schema via the `SchemaDefinition`.

---

## Usage Examples

### Registering Multiple Schemas

```ts
import { createSchemaRegistry } from './index.js';

const registry = createSchemaRegistry();

// Request schemas
registry.register({
  name: 'CreateUserRequest',
  version: '1.0.0',
  description: 'Create a new user',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string' },
    },
    required: ['name', 'email'],
    additionalProperties: false,
  },
});

registry.register({
  name: 'UpdateUserRequest',
  version: '1.0.0',
  description: 'Update an existing user',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string' },
    },
    additionalProperties: false,
  },
});

// Response schemas
registry.register({
  name: 'UserResponse',
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      createdAt: { type: 'number' },
    },
    required: ['id', 'name', 'email', 'createdAt'],
  },
});
```

### Express Validation Middleware

```ts
import express from 'express';
import { createSchemaRegistry } from './index.js';

const app = express();
const registry = createSchemaRegistry();
app.use(express.json());

// Register schemas at startup
registry.register({ /* ... CreateUserRequest ... */ });

app.post('/api/users', (req, res) => {
  const validation = registry.validate('CreateUserRequest', undefined, req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validation.errors.join(', '),
      },
    });
  }

  // Process valid request...
});
```

### Schema Evolution with Compatibility Check

```ts
// Version 1
registry.register({
  name: 'UserPreferences',
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['light', 'dark'] },
      language: { type: 'string' },
    },
    required: ['theme'],
  },
});

// Version 2 -- adding a new required field (breaking)
registry.register({
  name: 'UserPreferences',
  version: '2.0.0',
  schema: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['light', 'dark'] },
      language: { type: 'string' },
      notifications: { type: 'boolean' }, // New required field
    },
    required: ['theme', 'notifications'],
  },
});

// Check compatibility
const compat = registry.checkCompatibility('UserPreferences', '1.0.0', '2.0.0');
if (!compat.compatible) {
  console.warn('Breaking changes:', compat.breakingChanges);
  // May need a migration strategy or API version bump
}
```

### Schema Deprecation

```ts
registry.deprecate('OldUserSchema', '1.0.0', 'UserSchema:2.0.0');

const schema = registry.getVersion('OldUserSchema', '1.0.0');
if (schema?.deprecated) {
  console.log(`This schema is deprecated. Use ${schema.successor} instead.`);
}
```

### Registry Overview

```ts
const schemas = registry.list();
for (const s of schemas) {
  console.log(`${s.name}: ${s.versions.length} version(s), latest: ${s.latest}`);
}

const stats = registry.getStats();
console.log(`Total schemas: ${stats.totalSchemas}`);
console.log(`Total versions: ${stats.totalVersions}`);
console.log(`Deprecated: ${stats.deprecated}`);
```

---

## Integration Points

- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md`): The pipeline's `Middleware.validate(schema)` can use schemas registered in the schema registry for request validation.
- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/README.md`): Validation failures map to the `VALIDATION_ERROR` error code with structured details.
- **Response Transformer** (`/home/runner/workspace/agent-gateway/src/response-transformer/README.md`): Response schemas can be registered and used to validate outgoing data.
- **Event Store** (`/home/runner/workspace/agent-gateway/src/event-store/README.md`): Event data schemas can be registered in the registry for validation before appending to the event store.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Schema registration and deprecation are logged.

---

## Error Handling

- **Schema Not Found**: `validate()` returns `{ valid: false, errors: ['Schema not found: ${name}'] }` if the schema does not exist.
- **Compatibility Check**: Returns `{ compatible: false, type: 'NONE', breakingChanges: ['Version not found'] }` if either version does not exist.
- **Additional Properties**: When `additionalProperties: false` is set in the schema, unknown fields produce validation errors.
- **Type Mismatches**: Null values are allowed for any field type (null is not validated against the type constraint).

---

## Compatibility Types

| Type         | Meaning                                                     |
|--------------|-------------------------------------------------------------|
| `FULL`       | No breaking changes and no warnings; fully compatible       |
| `BACKWARD`   | No breaking changes, but warnings exist (e.g., optional field removed) |
| `FORWARD`    | Currently treated as `BACKWARD` in the implementation       |
| `NONE`       | Breaking changes detected; not compatible                   |

---

## Related Documentation

- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Built-in `Middleware.validate()` for request validation.
- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- `VALIDATION_ERROR` error code for validation failures.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Response envelope formatting after validation.
- [Event Store](/home/runner/workspace/agent-gateway/src/event-store/README.md) -- Event data schema validation.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
