# API Version Manager

Enterprise API version management module for the Agent Gateway. This module manages multiple API versions simultaneously, providing deprecation schedules, migration guides, version negotiation from various request sources, automatic response transformation for backward compatibility, and deprecation header generation.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Interfaces](#interfaces)
    - [ApiVersion](#apiversion)
    - [VersionedEndpoint](#versionedendpoint)
    - [VersionNegotiationResult](#versionnegotiationresult)
  - [ApiVersionManager Class](#apiversionmanager-class)
  - [registerVersion()](#registerversion)
  - [registerEndpoint()](#registerendpoint)
  - [negotiate()](#negotiate)
  - [isEndpointAvailable()](#isendpointavailable)
  - [getDeprecationHeaders()](#getdeprecationheaders)
  - [transformResponse()](#transformresponse)
  - [getVersions()](#getversions)
  - [getLatestVersion()](#getlatestversion)
  - [getDeprecatedVersions()](#getdeprecatedversions)
  - [getSunsetVersions()](#getsunsetversions)
  - [deprecate()](#deprecate)
  - [Factory Function](#factory-function)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [API Version Manager vs. API Versioning](#api-version-manager-vs-api-versioning)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Related Documentation](#related-documentation)

## Overview

API versioning is essential for evolving APIs without breaking existing clients. The `ApiVersionManager` provides a centralized registry for API versions and their associated endpoints, with automatic version negotiation from incoming requests and response transformation for backward compatibility.

**Key features:**
- **Multi-source version negotiation:** Extracts the API version from path, headers, Accept header, query parameters, or falls back to a default.
- **Deprecation lifecycle:** Register deprecation dates, sunset dates, and migration guides for each version.
- **Endpoint versioning:** Declare which API versions support which endpoints with min/max version bounds.
- **Response transformation:** Automatically transform responses for older API versions (e.g., v1 flattening).
- **Deprecation headers:** Generate standard `Deprecation`, `Sunset`, and `Link` headers per RFC 8594.
- **Event-driven:** Emits events when versions are registered or deprecated.

### Version Negotiation Priority

The `negotiate()` method checks sources in this order:

1. **Path-based:** `/api/v2/...` extracts `v2`
2. **Header-based:** `X-API-Version: v2`
3. **Accept header:** `application/vnd.api.v2+json`
4. **Query-based:** `?version=v2` or `?api_version=v2`
5. **Default:** Falls back to the latest registered version

## File Structure

```
/home/runner/workspace/agent-gateway/src/api-version-manager/
  index.ts          # ApiVersionManager class, interfaces, factory function
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { ApiVersionManager, createApiVersionManager } from '../api-version-manager/index.js';
// or with the full absolute path:
// import { ApiVersionManager, createApiVersionManager } from '/home/runner/workspace/agent-gateway/src/api-version-manager/index.js';
```

## API Reference

### Interfaces

#### ApiVersion

Represents a registered API version with its lifecycle metadata.

```typescript
export interface ApiVersion {
  /** Version string (e.g., 'v1', 'v2') */
  version: string;
  /** When this version was released (ISO 8601) */
  releasedAt: string;
  /** When this version was deprecated (ISO 8601) */
  deprecatedAt?: string;
  /** When this version will be sunset (ISO 8601) */
  sunsetAt?: string;
  /** Migration guide URL */
  migrationGuide?: string;
  /** Whether this is the current latest version */
  isLatest: boolean;
  /** Breaking changes from previous version */
  breakingChanges?: string[];
  /** New features in this version */
  newFeatures?: string[];
}
```

#### VersionedEndpoint

Represents an endpoint with version availability constraints.

```typescript
export interface VersionedEndpoint {
  /** Endpoint path (e.g., '/api/users') */
  path: string;
  /** HTTP method */
  method: string;
  /** Minimum API version that supports this endpoint */
  minVersion: string;
  /** Maximum API version that supports this endpoint */
  maxVersion?: string;
  /** Whether this endpoint is deprecated */
  deprecated?: boolean;
  /** Deprecation message for clients */
  deprecationMessage?: string;
  /** Alternative endpoint path */
  alternative?: string;
}
```

#### VersionNegotiationResult

The result of version negotiation from an incoming request.

```typescript
export interface VersionNegotiationResult {
  /** The negotiated API version */
  negotiatedVersion: string;
  /** How the version was determined */
  source: 'header' | 'path' | 'query' | 'accept' | 'default';
  /** Whether the negotiated version is deprecated */
  isDeprecated: boolean;
  /** When the version will be sunset */
  sunsetAt?: string;
  /** Migration guide URL for the version */
  migrationGuide?: string;
}
```

### ApiVersionManager Class

Extends `EventEmitter` for version lifecycle events.

```typescript
export class ApiVersionManager extends EventEmitter {
  constructor(versions?: ApiVersion[], defaultVersion?: string);

  registerVersion(version: ApiVersion): void;
  registerEndpoint(endpoint: VersionedEndpoint): void;
  negotiate(req: {
    headers: Record<string, string>;
    path: string;
    query: Record<string, string>;
  }): VersionNegotiationResult;
  isEndpointAvailable(path: string, method: string, version: string):
    { available: boolean; endpoint?: VersionedEndpoint };
  getDeprecationHeaders(version: string): Record<string, string>;
  transformResponse(version: string, data: any, path: string): any;
  getVersions(): ApiVersion[];
  getLatestVersion(): string;
  getDeprecatedVersions(): ApiVersion[];
  getSunsetVersions(): ApiVersion[];
  deprecate(version: string, sunsetAt: string, migrationGuide: string): boolean;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `version:registered` | `ApiVersion` | A new version was registered |
| `version:deprecated` | `ApiVersion` | A version was marked as deprecated |

### registerVersion()

Registers an API version in the version manager.

**Signature:**
```typescript
registerVersion(version: ApiVersion): void
```

**Parameters:**
- `version: ApiVersion` -- The version object with all lifecycle metadata.

### registerEndpoint()

Registers a versioned endpoint.

**Signature:**
```typescript
registerEndpoint(endpoint: VersionedEndpoint): void
```

**Parameters:**
- `endpoint: VersionedEndpoint` -- The endpoint with its version constraints.

### negotiate()

Negotiates the API version from an incoming request.

**Signature:**
```typescript
negotiate(req: {
  headers: Record<string, string>;
  path: string;
  query: Record<string, string>;
}): VersionNegotiationResult
```

**Parameters:**
- `req` -- A simplified request object containing:
  - `headers` -- Request headers (checked for `x-api-version` and `accept`).
  - `path` -- The request path (checked for `/api/vN/` pattern).
  - `query` -- Query parameters (checked for `version` or `api_version`).

**Returns:** `VersionNegotiationResult` with the negotiated version and metadata.

### isEndpointAvailable()

Checks whether a given endpoint is available for a specific API version.

**Signature:**
```typescript
isEndpointAvailable(path: string, method: string, version: string):
  { available: boolean; endpoint?: VersionedEndpoint }
```

**Parameters:**
- `path: string` -- The endpoint path.
- `method: string` -- The HTTP method.
- `version: string` -- The API version to check against.

**Returns:** Object with `available: boolean` and optionally the matching `VersionedEndpoint`.

### getDeprecationHeaders()

Generates standard deprecation headers for a given version.

**Signature:**
```typescript
getDeprecationHeaders(version: string): Record<string, string>
```

**Returns:** A map of header name to value. Returns an empty object if the version is not deprecated.

**Generated headers:**
| Header | Value |
|--------|-------|
| `Deprecation` | `true` |
| `Sunset` | The sunset date |
| `Link` | `<migration-guide-url>; rel="deprecation"; title="Migration Guide"` |
| `X-API-Deprecated-Since` | The deprecation date |
| `X-API-Sunset` | The sunset date (if available) |

### transformResponse()

Transforms a response for version compatibility.

**Signature:**
```typescript
transformResponse(version: string, data: any, path: string): any
```

**Parameters:**
- `version: string` -- The client's API version.
- `data: any` -- The response data to transform.
- `path: string` -- The endpoint path (used to look up endpoint-specific transformations).

**Returns:** The transformed response. Currently supports v1 compatibility by flattening nested `data.data` / `data.meta` structures.

### getVersions()

Returns all registered API versions.

**Signature:**
```typescript
getVersions(): ApiVersion[]
```

### getLatestVersion()

Returns the latest (non-deprecated, `isLatest: true`) version string.

**Signature:**
```typescript
getLatestVersion(): string
```

### getDeprecatedVersions()

Returns all deprecated API versions.

**Signature:**
```typescript
getDeprecatedVersions(): ApiVersion[]
```

### getSunsetVersions()

Returns versions whose sunset date has already passed.

**Signature:**
```typescript
getSunsetVersions(): ApiVersion[]
```

### deprecate()

Marks a version as deprecated.

**Signature:**
```typescript
deprecate(version: string, sunsetAt: string, migrationGuide: string): boolean
```

**Parameters:**
- `version: string` -- The version to deprecate.
- `sunsetAt: string` -- ISO 8601 date when the version will be removed.
- `migrationGuide: string` -- URL to the migration guide.

**Returns:** `true` if the version was found and deprecated, `false` otherwise.

### Factory Function

```typescript
export function createApiVersionManager(
  versions?: ApiVersion[],
  defaultVersion?: string
): ApiVersionManager
```

Convenience factory for creating a pre-configured version manager.

## Configuration Options

The `ApiVersionManager` is configured through its constructor:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `versions` | `ApiVersion[]` | `[]` | Initial set of API versions |
| `defaultVersion` | `string` | `'v1'` or latest | Fallback version when negotiation fails |

## Usage Examples

### Basic Setup

```typescript
import { createApiVersionManager } from '/home/runner/workspace/agent-gateway/src/api-version-manager/index.js';

const versionManager = createApiVersionManager([
  {
    version: 'v1',
    releasedAt: '2024-01-01T00:00:00Z',
    deprecatedAt: '2025-01-01T00:00:00Z',
    sunsetAt: '2025-07-01T00:00:00Z',
    migrationGuide: 'https://docs.example.com/migrate/v1-to-v2',
    isLatest: false,
    breakingChanges: ['Response envelope changed from flat to nested'],
  },
  {
    version: 'v2',
    releasedAt: '2025-01-01T00:00:00Z',
    isLatest: true,
    newFeatures: ['Cursor pagination', 'Field selection', 'Batch operations'],
  },
]);

// Register endpoints
versionManager.registerEndpoint({
  path: '/api/users',
  method: 'GET',
  minVersion: 'v1',
  maxVersion: 'v2',
});

versionManager.registerEndpoint({
  path: '/api/users/batch',
  method: 'POST',
  minVersion: 'v2',
});
```

### Express.js Middleware

```typescript
import express from 'express';

const app = express();

app.use((req, res, next) => {
  const negotiation = versionManager.negotiate({
    headers: req.headers,
    path: req.path,
    query: req.query,
  });

  // Attach version info to request
  (req as any).apiVersion = negotiation.negotiatedVersion;

  // Add deprecation headers
  const depHeaders = versionManager.getDeprecationHeaders(negotiation.negotiatedVersion);
  for (const [header, value] of Object.entries(depHeaders)) {
    res.setHeader(header, value);
  }

  if (negotiation.isDeprecated) {
    console.warn(`Deprecated API version ${negotiation.negotiatedVersion} used by ${req.ip}`);
  }

  next();
});
```

### Versioned Response Transformation

```typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  const apiVersion = (req as any).apiVersion || 'v2';

  // Transform response for the client's API version
  const response = versionManager.transformResponse(apiVersion, user, '/api/users');

  res.json(response);
});
```

### Version Availability Check

```typescript
const check = versionManager.isEndpointAvailable('/api/users/batch', 'POST', 'v1');
if (!check.available) {
  // Endpoint not available in v1
  res.status(404).json({
    error: 'Endpoint not available in this API version',
    minVersion: 'v2',
  });
}
```

## API Version Manager vs. API Versioning

The `ApiVersionManager` (this module) and the broader concept of **API versioning** serve different purposes:

| Aspect | API Version Manager (this module) | General API Versioning |
|--------|-----------------------------------|----------------------|
| Scope | Runtime version negotiation and response transformation | Overall strategy for versioning APIs |
| Responsibilities | Negotiation, deprecation headers, response transforms | URL design, header conventions, documentation |
| Persistence | In-memory registry | Can be persistent across deployments |
| Sibling module | `/home/runner/workspace/agent-gateway/src/api-versioning/` does **not currently exist** | N/A |

**Note:** The `src/api-versioning/` directory referenced in the task description does not currently exist in the codebase. If added in the future, it would likely provide versioning infrastructure at a different layer (e.g., OpenAPI spec generation, versioned route registration, or version-specific middleware chains), while the `ApiVersionManager` focuses on runtime negotiation and response transformation.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Central place to negotiate versions and attach deprecation headers. |
| Response Transformer | `/home/runner/workspace/agent-gateway/src/response-transformer/` | Chain version-specific transformations after the version manager's built-in transforms. |
| OpenAPI | `/home/runner/workspace/agent-gateway/src/openapi/` | Generate versioned OpenAPI specifications from registered versions and endpoints. |
| Middleware | `/home/runner/workspace/agent-gateway/src/middleware/` | Version negotiation as a middleware layer. |
| Error Handler | `/home/runner/workspace/agent-gateway/src/error-handler/` | Return appropriate errors for unsupported API versions. |

## Error Handling

- **Unknown version in negotiation:** Falls back to the default/latest version. No error is thrown.
- **Unknown version in deprecation:** `getDeprecationHeaders()` returns an empty object.
- **Deprecating a non-existent version:** `deprecate()` returns `false`.
- **Endpoint not found:** `isEndpointAvailable()` returns `{ available: false }`.
- **Transformation errors:** The `transformResponse()` method catches structural mismatches gracefully; if the data doesn't match the expected shape, it is returned unchanged.
- **No exceptions for missing data:** All methods handle missing or undefined inputs gracefully.

## Related Documentation

- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level routing and versioning.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Additional response transformations for specific versions.
- [OpenAPI](/home/runner/workspace/agent-gateway/src/openapi/README.md) -- Versioned API specifications.
- [Middleware](/home/runner/workspace/agent-gateway/src/middleware/README.md) -- Middleware patterns for version handling.
- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Error responses for unsupported API versions.
