# Pagination

Enterprise pagination utilities providing both cursor-based and offset-based pagination strategies for API responses in the Agent Gateway. This module standardizes pagination across all endpoints, ensuring consistent `PageInfo` objects, efficient slicing, and configurable page size limits.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Interfaces](#interfaces)
    - [PageResult\<T\>](#pageresultt)
    - [PageInfo](#pageinfo)
    - [PaginationParams](#paginationparams)
  - [Paginator Class](#paginator-class)
  - [offset()](#offset)
  - [cursor()](#cursor)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Cursor vs. Offset Comparison](#cursor-vs-offset-comparison)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Performance Characteristics](#performance-characteristics)
- [Related Documentation](#related-documentation)

## Overview

Pagination is a fundamental requirement for any API that returns collections of data. Without pagination, large datasets can cause memory exhaustion, slow response times, and poor user experience. The `Paginator` module provides two complementary strategies:

| Strategy | Method | Best For |
|----------|--------|----------|
| Offset-based | `Paginator.offset()` | Simple page navigation (page 1, 2, 3), user-facing UIs |
| Cursor-based | `Paginator.cursor()` | Infinite scroll, real-time data, large datasets, GraphQL-style APIs |

Both strategies return a standardized `PageResult<T>` envelope containing the data slice and a `PageInfo` object with navigation metadata (`hasNextPage`, `hasPrevPage`, `startCursor`, `endCursor`, `total`, `page`, `pageSize`).

**Key features:**
- Maximum page size enforcement (default: 20, capped at 100)
- Consistent response shape across all paginated endpoints
- Cursor encoding/decoding for stable pagination across data mutations
- Support for both numbered pages and opaque cursors

## File Structure

```
/home/runner/workspace/agent-gateway/src/pagination/
  index.ts          # Paginator class, PageResult, PageInfo, PaginationParams interfaces
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { Paginator, PageResult, PageInfo, PaginationParams } from '../pagination/index.js';
// or with the full absolute path:
// import { Paginator, PageResult, PageInfo, PaginationParams } from '/home/runner/workspace/agent-gateway/src/pagination/index.js';
```

## API Reference

### Interfaces

#### PageResult\<T\>

The standard envelope returned by both pagination methods.

```typescript
export interface PageResult<T> {
  /** The slice of data for the current page */
  data: T[];
  /** Metadata for navigating to adjacent pages */
  pageInfo: PageInfo;
}
```

#### PageInfo

Contains all metadata necessary for a client to navigate between pages.

```typescript
export interface PageInfo {
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPrevPage: boolean;
  /** Cursor identifying the first item in the current page */
  startCursor?: string;
  /** Cursor identifying the last item in the current page */
  endCursor?: string;
  /** Total number of items across all pages (not available in cursor mode) */
  total?: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}
```

#### PaginationParams

The input parameters accepted by both pagination methods.

```typescript
export interface PaginationParams {
  /** Page number (1-indexed), used by offset pagination */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Opaque cursor identifying the start position, used by cursor pagination */
  cursor?: string;
  /** Maximum items to return, used by cursor pagination */
  limit?: number;
}
```

### Paginator Class

The `Paginator` class exposes two static methods. No instantiation is required.

```typescript
export class Paginator {
  static offset<T>(data: T[], params: PaginationParams): PageResult<T>;
  static cursor<T>(data: T[], params: PaginationParams, cursorField?: string): PageResult<T>;
}
```

### offset()

Performs offset-based pagination on an in-memory array.

**Signature:**
```typescript
static offset<T>(data: T[], params: PaginationParams): PageResult<T>
```

**Parameters:**
- `data: T[]` -- The full array of items to paginate.
- `params: PaginationParams` -- Pagination parameters:
  - `page` (default: `1`) -- The 1-indexed page number.
  - `pageSize` (default: `20`, max: `100`) -- Items per page.

**Returns:** `PageResult<T>` -- A paginated result with the data slice and page info.

**Algorithm:**
1. Calculate `start = (page - 1) * pageSize`.
2. Calculate `end = start + pageSize`.
3. Slice the array: `data.slice(start, end)`.
4. Determine `hasMore = end < data.length`.
5. Return the slice with computed `PageInfo`.

**Example:**
```typescript
const allUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'Diana' },
  { id: 5, name: 'Eve' },
];

const result = Paginator.offset(allUsers, { page: 2, pageSize: 2 });
// Result:
// {
//   data: [{ id: 3, name: 'Charlie' }, { id: 4, name: 'Diana' }],
//   pageInfo: {
//     hasNextPage: true,
//     hasPrevPage: true,
//     startCursor: '2',
//     endCursor: '3',
//     total: 5,
//     page: 2,
//     pageSize: 2,
//   },
// }
```

### cursor()

Performs cursor-based pagination on an in-memory array.

**Signature:**
```typescript
static cursor<T>(data: T[], params: PaginationParams, cursorField?: string): PageResult<T>
```

**Parameters:**
- `data: T[]` -- The full array of items to paginate.
- `params: PaginationParams` -- Pagination parameters:
  - `cursor` (optional) -- The cursor value to start after. If omitted, starts from the beginning.
  - `limit` (default: `20`, max: `100`) -- Maximum items to return.
- `cursorField` (default: `'id'`) -- The field name used as the cursor identifier on each item.

**Returns:** `PageResult<T>` -- A paginated result with the data slice and page info.

**Algorithm:**
1. If a `cursor` is provided, find its index in the data array and slice from the next position.
2. Take up to `limit` items from the filtered array.
3. Extract `startCursor` and `endCursor` from the first and last items in the slice.
4. Set `page: 1` (cursor pagination does not use page numbers).

**Example:**
```typescript
const allUsers = [
  { id: 'usr_1', name: 'Alice' },
  { id: 'usr_2', name: 'Bob' },
  { id: 'usr_3', name: 'Charlie' },
  { id: 'usr_4', name: 'Diana' },
  { id: 'usr_5', name: 'Eve' },
];

// First page
const page1 = Paginator.cursor(allUsers, { limit: 2 });
// page1.pageInfo.endCursor = 'usr_2'

// Second page, using cursor from page 1
const page2 = Paginator.cursor(allUsers, { cursor: 'usr_2', limit: 2 });
// Result:
// {
//   data: [{ id: 'usr_3', name: 'Charlie' }, { id: 'usr_4', name: 'Diana' }],
//   pageInfo: {
//     hasNextPage: true,
//     hasPrevPage: true,
//     startCursor: 'usr_3',
//     endCursor: 'usr_4',
//     page: 1,
//     pageSize: 2,
//   },
// }
```

## Configuration Options

The `Paginator` module has no external configuration. All defaults are hardcoded:

| Parameter | Default | Maximum | Description |
|-----------|---------|---------|-------------|
| Offset `pageSize` | 20 | 100 | Items per page for offset pagination |
| Cursor `limit` | 20 | 100 | Items per page for cursor pagination |
| Cursor field | `'id'` | -- | Field used as the cursor identifier |

To change defaults, pass explicit parameters in each call:

```typescript
Paginator.offset(data, { page: 1, pageSize: 50 });
Paginator.cursor(data, { limit: 50 }, 'createdAt');
```

## Usage Examples

### REST API Endpoint with Offset Pagination

```typescript
import express from 'express';
import { Paginator } from '/home/runner/workspace/agent-gateway/src/pagination/index.js';

const app = express();

app.get('/api/users', async (req, res) => {
  const allUsers = await db.users.findAll();

  const result = Paginator.offset(allUsers, {
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
  });

  res.json({
    data: result.data,
    pageInfo: result.pageInfo,
  });
});
```

### GraphQL Cursor Pagination

```typescript
import { Paginator } from '/home/runner/workspace/agent-gateway/src/pagination/index.js';

const resolvers = {
  Query: {
    messages: async (_parent, args) => {
      const allMessages = await db.messages.findAll({ order: [['createdAt', 'DESC']] });

      return Paginator.cursor(allMessages, {
        cursor: args.cursor,
        limit: args.first || 20,
      }, 'id');
    },
  },
};
```

### Infinite Scroll API

```typescript
import { Paginator } from '/home/runner/workspace/agent-gateway/src/pagination/index.js';

app.get('/api/feed', async (req, res) => {
  const posts = await db.posts.findAll({ order: [['createdAt', 'DESC']] });

  const result = Paginator.cursor(posts, {
    cursor: req.query.cursor as string,
    limit: parseInt(req.query.limit as string) || 10,
  }, 'id');

  res.json({
    posts: result.data,
    nextCursor: result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null,
  });
});
```

## Cursor vs. Offset Comparison

| Criterion | Offset Pagination | Cursor Pagination |
|-----------|-------------------|-------------------|
| Stability under inserts | Poor -- items shift between pages | Excellent -- cursor anchors to a specific item |
| Total count | Included in `PageInfo.total` | Not available (requires separate query) |
| Jump to page N | Direct: set `page: N` | Not possible -- must paginate sequentially |
| Performance on large datasets | O(offset) to skip | O(1) with indexed cursor field |
| Real-time data | May show duplicates or skip items | Consistent -- anchored to cursor position |
| Best use case | Admin dashboards, numbered page UIs | Infinite scroll, feeds, GraphQL APIs |

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Search Engine | `/home/runner/workspace/agent-gateway/src/search-engine/` | Search results are paginated via `Paginator.offset()` with `page` and `pageSize` from `SearchQuery`. |
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Apply pagination middleware at the gateway layer for all list endpoints. |
| GraphQL | `/home/runner/workspace/agent-gateway/src/graphql/` | Cursor pagination aligns with Relay/GraphQL connection specifications. |
| Data Transformer | `/home/runner/workspace/agent-gateway/src/data-transformer/` | Transform paginated results with field mapping after pagination. |
| Response Transformer | `/home/runner/workspace/agent-gateway/src/response-transformer/` | Shape `PageResult` envelopes for client-specific response formats. |

## Error Handling

- **Out-of-bounds page:** If `page` exceeds the available data, `offset()` returns an empty `data` array with `hasNextPage: false` and `hasPrevPage: true`.
- **Missing cursor:** If `cursor` does not match any item, `cursor()` falls back to returning the first `limit` items.
- **Empty array:** Both methods return a valid `PageResult` with an empty `data` array and `hasNextPage: false`.
- **No exceptions:** Neither method throws. All edge cases are handled gracefully.

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| `offset()` | O(1) slice (after data loaded) | O(pageSize) for result |
| `cursor()` | O(n) for cursor lookup + O(limit) for slice | O(limit) for result |
| Memory | Requires full dataset in memory | Requires full dataset in memory |

**Important:** Both methods operate on in-memory arrays. For database-level pagination, apply `LIMIT`/`OFFSET` or `WHERE id > cursor` at the query level, then wrap the results with this module for consistent response formatting.

## Related Documentation

- [Search Engine](/home/runner/workspace/agent-gateway/src/search-engine/README.md) -- Search results include built-in pagination with `page` and `pageSize`.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level pagination middleware patterns.
- [GraphQL](/home/runner/workspace/agent-gateway/src/graphql/README.md) -- GraphQL connection pattern using cursor pagination.
- [Data Transformer](/home/runner/workspace/agent-gateway/src/data-transformer/README.md) -- Transform paginated data with field operations.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Shape pagination envelopes for different API versions.
