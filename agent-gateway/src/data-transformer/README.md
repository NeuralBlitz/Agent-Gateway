# Data Transformer

Enterprise data transformation pipeline for the Agent Gateway. This module provides a comprehensive set of field-level transformation operations including renaming, removal, defaulting, type coercion, mapping, filtering, flattening, nesting, computed fields, validation, and data masking. Transformations can be composed into named pipelines and applied to single objects or arrays.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [TransformOperation](#transformoperation)
    - [TransformConfig](#transformconfig)
  - [DataTransformer Class](#datatransformer-class)
  - [transform()](#transform)
  - [transformArray()](#transformarray)
  - [getStats()](#getstats)
  - [getConfig()](#getconfig)
  - [Factory Function](#factory-function)
- [Transform Operation Reference](#transform-operation-reference)
  - [rename](#rename)
  - [remove](#remove)
  - [default](#default)
  - [coerce](#coerce)
  - [map](#map)
  - [filter](#filter)
  - [flatten](#flatten)
  - [nest](#nest)
  - [compute](#compute)
  - [validate](#validate)
  - [mask](#mask)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Performance Characteristics](#performance-characteristics)
- [Related Documentation](#related-documentation)

## Overview

The `DataTransformer` module implements a declarative transformation pipeline where each operation is defined as a typed operation object. Operations are applied sequentially in the order they appear in the configuration. This approach makes transformations:

- **Readable:** The pipeline definition documents the data shape changes.
- **Composable:** Multiple operations can be chained.
- **Reusable:** Named configurations can be applied to multiple datasets.
- **Safe:** Each operation is individually try/catched; failures in one operation don't break the entire pipeline.

**Key features:**
- 11 distinct operation types covering common data transformation needs.
- Deep field access via dot-notation paths (e.g., `'user.address.city'`).
- Safe field get/set/delete for nested objects.
- Type coercion with safe defaults.
- Data masking for PII protection.
- Per-item and batch processing with error tracking.

## File Structure

```
/home/runner/workspace/agent-gateway/src/data-transformer/
  index.ts          # DataTransformer class, TransformOperation, TransformConfig
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { DataTransformer, createDataTransformer } from '../data-transformer/index.js';
// or with the full absolute path:
// import { DataTransformer, createDataTransformer } from '/home/runner/workspace/agent-gateway/src/data-transformer/index.js';
```

## API Reference

### Types and Interfaces

#### TransformOperation

A discriminated union of all supported transformation operations.

```typescript
export type TransformOperation =
  | { type: 'rename'; from: string; to: string }
  | { type: 'remove'; fields: string[] }
  | { type: 'default'; field: string; value: any }
  | { type: 'coerce'; field: string; targetType: 'string' | 'number' | 'boolean' | 'array' | 'object' }
  | { type: 'map'; field: string; fn: (value: any) => any }
  | { type: 'filter'; fn: (item: any) => boolean }
  | { type: 'flatten'; field: string }
  | { type: 'nest'; field: string; target: string }
  | { type: 'compute'; field: string; fn: (data: any) => any }
  | { type: 'validate'; field: string; rule: (value: any) => boolean; message?: string }
  | { type: 'mask'; field: string; maskChar?: string; visibleChars?: number };
```

#### TransformConfig

The configuration for a named transformation pipeline.

```typescript
export interface TransformConfig {
  name: string;
  operations: TransformOperation[];
  description?: string;
}
```

### DataTransformer Class

```typescript
export class DataTransformer {
  constructor(config: TransformConfig);

  transform(data: any): { result: any; errors: string[] };
  transformArray(data: any[]): {
    results: any[];
    errors: Array<{ index: number; errors: string[] }>;
  };
  getStats(): { transformed: number; errors: number; filtered: number };
  getConfig(): TransformConfig;
}
```

### transform()

Applies the transformation pipeline to a single object.

**Signature:**
```typescript
transform(data: any): { result: any; errors: string[] }
```

**Parameters:**
- `data: any` -- The object to transform.

**Returns:** An object containing:
- `result` -- The transformed object, or `null` if the object was filtered out.
- `errors` -- Array of error messages from failed operations.

**Behavior:**
1. Deep-clones the input to avoid mutating the original.
2. Applies each operation in sequence.
3. If a `filter` operation returns `false`, the object is removed (returns `null`).
4. If any operation throws, the error is captured in the `errors` array and the pipeline continues with the next operation.

### transformArray()

Applies the transformation pipeline to an array of objects.

**Signature:**
```typescript
transformArray(data: any[]): {
  results: any[];
  errors: Array<{ index: number; errors: string[] }>;
}
```

**Parameters:**
- `data: any[]` -- The array of objects to transform.

**Returns:**
- `results` -- Array of successfully transformed objects (filtered-out items excluded).
- `errors` -- Array of error records with the original index and per-item errors.

### getStats()

Returns transformation statistics.

**Signature:**
```typescript
getStats(): { transformed: number; errors: number; filtered: number }
```

### getConfig()

Returns the transformation configuration.

**Signature:**
```typescript
getConfig(): TransformConfig
```

### Factory Function

```typescript
export function createDataTransformer(config: TransformConfig): DataTransformer
```

Convenience factory for creating a configured transformer instance.

## Transform Operation Reference

### rename

Renames a field from one path to another.

```typescript
{ type: 'rename'; from: string; to: string }
```

**Example:**
```typescript
{ type: 'rename', from: 'user_name', to: 'username' }
```

**Behavior:** Reads the value at `from`, writes it to `to`, then deletes the original field. Supports nested paths (`'user.address.city'`).

### remove

Removes one or more fields from the object.

```typescript
{ type: 'remove'; fields: string[] }
```

**Example:**
```typescript
{ type: 'remove', fields: ['internal_id', 'temp_data', '_debug'] }
```

### default

Sets a default value for a field if it is `undefined` or `null`.

```typescript
{ type: 'default'; field: string; value: any }
```

**Example:**
```typescript
{ type: 'default', field: 'status', value: 'active' }
```

### coerce

Converts a field's value to a target type.

```typescript
{ type: 'coerce'; field: string; targetType: 'string' | 'number' | 'boolean' | 'array' | 'object' }
```

**Coercion rules:**
| Target | Behavior |
|--------|----------|
| `string` | `String(value)` |
| `number` | `Number(value)`, defaults to `0` if `NaN` |
| `boolean` | `Boolean(value)` |
| `array` | Returns array as-is, or wraps non-array in `[value]` |
| `object` | Returns object as-is, or wraps in `{ value }` |

**Example:**
```typescript
{ type: 'coerce', field: 'age', targetType: 'number' }
```

### map

Applies a custom function to a field's value.

```typescript
{ type: 'map'; field: string; fn: (value: any) => any }
```

**Example:**
```typescript
{ type: 'map', field: 'email', fn: (v) => v.toLowerCase() }
```

### filter

Removes the entire object if the predicate returns `false`.

```typescript
{ type: 'filter'; fn: (item: any) => boolean }
```

**Example:**
```typescript
{ type: 'filter', fn: (item) => item.status !== 'deleted' }
```

### flatten

Flattens a nested object's fields to the top level with prefixed keys.

```typescript
{ type: 'flatten'; field: string }
```

**Example:**
```typescript
// Input: { user: { name: 'Alice', age: 30 } }
{ type: 'flatten', field: 'user' }
// Output: { 'user.name': 'Alice', 'user.age': 30 }
```

### nest

Moves a field into a nested object structure.

```typescript
{ type: 'nest'; field: string; target: string }
```

**Example:**
```typescript
// Input: { firstName: 'Alice', lastName: 'Smith' }
{ type: 'nest', field: 'firstName', target: 'name' }
// Output: { name: { firstName: 'Alice' }, lastName: 'Smith' }
```

### compute

Computes a new field from the entire object.

```typescript
{ type: 'compute'; field: string; fn: (data: any) => any }
```

**Example:**
```typescript
{ type: 'compute', field: 'fullName', fn: (d) => `${d.firstName} ${d.lastName}` }
```

### validate

Validates a field's value against a rule function. Throws on failure.

```typescript
{ type: 'validate'; field: string; rule: (value: any) => boolean; message?: string }
```

**Example:**
```typescript
{
  type: 'validate',
  field: 'email',
  rule: (v) => /^[^@]+@[^@]+\.[^@]+$/.test(v),
  message: 'Invalid email format',
}
```

### mask

Masks a string field, showing only the last N characters.

```typescript
{ type: 'mask'; field: string; maskChar?: string; visibleChars?: number }
```

**Parameters:**
- `maskChar` (default: `'*'`) -- The character to use for masking.
- `visibleChars` (default: `4`) -- Number of trailing characters to reveal.

**Example:**
```typescript
// Input: { ssn: '123-45-6789' }
{ type: 'mask', field: 'ssn', visibleChars: 4, maskChar: 'X' }
// Output: { ssn: 'XXXXXXX6789' }
```

## Configuration Options

The `DataTransformer` is configured through its `TransformConfig`:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique name for the transformation pipeline |
| `operations` | `TransformOperation[]` | Ordered list of operations to apply |
| `description` | `string` (optional) | Human-readable description |

## Usage Examples

### User Profile Transformation

```typescript
import { createDataTransformer } from '/home/runner/workspace/agent-gateway/src/data-transformer/index.js';

const userTransform = createDataTransformer({
  name: 'user-profile',
  description: 'Transform user profile data for API response',
  operations: [
    // Remove internal fields
    { type: 'remove', fields: ['password_hash', 'internal_notes'] },

    // Rename fields for client-friendly naming
    { type: 'rename', from: 'created_at', to: 'createdAt' },
    { type: 'rename', from: 'updated_at', to: 'updatedAt' },

    // Mask PII
    { type: 'mask', field: 'phone', visibleChars: 4, maskChar: '*' },

    // Compute derived fields
    { type: 'compute', field: 'displayName', fn: (d) => `${d.firstName} ${d.lastName}` },

    // Set defaults
    { type: 'default', field: 'role', value: 'user' },

    // Coerce types
    { type: 'coerce', field: 'age', targetType: 'number' },
  ],
});

const user = {
  firstName: 'John',
  lastName: 'Doe',
  password_hash: '$2a$10$...',
  phone: '555-123-4567',
  age: '30',
  role: null,
  created_at: '2024-01-01',
  internal_notes: 'VIP customer',
};

const { result, errors } = userTransform.transform(user);
// result: { firstName, lastName, phone: '********4567', displayName: 'John Doe', age: 30, role: 'user', createdAt }
```

### Batch Processing with Error Tracking

```typescript
const { results, errors } = userTransform.transformArray(users);

console.log(`Transformed ${results.length} of ${users.length} users`);

for (const err of errors) {
  console.error(`User at index ${err.index}: ${err.errors.join(', ')}`);
}
```

### Data Migration Pipeline

```typescript
const migration = createDataTransformer({
  name: 'v1-to-v2-migration',
  operations: [
    { type: 'flatten', field: 'address' },
    { type: 'rename', from: 'name', to: 'fullName' },
    { type: 'coerce', field: 'price', targetType: 'number' },
    { type: 'validate', field: 'email', rule: (v) => v.includes('@'), message: 'Email required' },
  ],
});
```

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Version Manager | `/home/runner/workspace/agent-gateway/src/api-version-manager/` | Use `transformResponse()` for version-specific field mapping, then chain DataTransformer for additional shaping. |
| Response Transformer | `/home/runner/workspace/agent-gateway/src/response-transformer/` | DataTransformer provides fine-grained field operations; Response Transformer provides higher-level response envelope transformations. |
| Search Engine | `/home/runner/workspace/agent-gateway/src/search-engine/` | Transform search results (e.g., mask PII, compute relevance scores) before returning. |
| Pipeline Engine | `/home/runner/workspace/agent-gateway/src/pipeline-engine/` | Use DataTransformer as a `transform` stage in a data pipeline. |
| Security Scanner | `/home/runner/workspace/agent-gateway/src/security-scanner/` | Apply `mask` operations to sensitive fields before returning responses. |

## Error Handling

- **Per-operation isolation:** Each operation is wrapped in try/catch. A failure in one operation does not stop the pipeline; the error is recorded and the next operation is attempted.
- **Validation errors:** The `validate` operation throws if the rule returns `false`. This is caught and recorded in the errors array.
- **Filter removes items:** When a `filter` operation returns `false`, the entire item is excluded. `transform()` returns `{ result: null, errors: [] }` for filtered items.
- **Deep clone:** The input is deep-cloned via `JSON.parse(JSON.stringify(data))`, so the original object is never mutated. This also means the input must be JSON-serializable.
- **Unknown operation types:** If an operation has an unrecognized `type`, an error is thrown: `"Unknown operation type: <type>"`.

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| Deep clone | O(n) where n = serialized size | Via JSON.parse/stringify |
| Field get/set/delete (nested) | O(depth) where depth = dot-notation segments | Traverses nested paths |
| `map`, `compute` | O(1) + user function cost | User-provided function complexity |
| `validate` | O(1) + user function cost | User-provided rule function |
| `filter` | O(1) + user function cost | User-provided predicate |

## Related Documentation

- [API Version Manager](/home/runner/workspace/agent-gateway/src/api-version-manager/README.md) -- Version-specific response transformations.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Higher-level response envelope transformations.
- [Pipeline Engine](/home/runner/workspace/agent-gateway/src/pipeline-engine/README.md) -- Compose DataTransformer as a pipeline stage.
- [Search Engine](/home/runner/workspace/agent-gateway/src/search-engine/README.md) -- Transform search results before returning.
- [Input Sanitizer](/home/runner/workspace/agent-gateway/src/input-sanitizer/README.md) -- Sanitize input data before transformation.
