# Utilities

> **Core utility classes and functions for the Agent Gateway**

The `utils` module provides foundational utility classes and functions used throughout the Agent Gateway project. These utilities handle common programming patterns including caching, concurrency control, function debouncing/throttling, and object manipulation. All utilities are designed for production use with TypeScript type safety.

---

## Table of Contents

- [Overview](#overview)
- [Module Structure](#module-structure)
- [RequestDeduplicator](#requestdeduplicator)
- [LruCache](#lrucache)
- [debounce](#debounce)
- [throttle](#throttle)
- [deepClone](#deepclone)
- [flatten](#flatten)
- [unflatten](#unflatten)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Performance Characteristics](#performance-characteristics)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Future Enhancements](#future-enhancements)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/src/utils/index.ts`

The utilities module exports seven core functions/classes:

| Export | Type | Purpose |
|--------|------|---------|
| `RequestDeduplicator` | Class | Coalesce identical in-flight requests into a single execution |
| `LruCache<K, V>` | Class | Least-recently-used cache with O(1) get/set operations |
| `debounce` | Function | Delay function execution until calls stop for a specified period |
| `throttle` | Function | Limit function execution to at most once per time interval |
| `deepClone` | Function | Create a deep copy of any serializable object |
| `flatten` | Function | Convert nested objects to dot-notation flat keys |
| `unflatten` | Function | Reconstruct nested objects from dot-notation flat keys |

---

## Module Structure

```
/home/runner/workspace/agent-gateway/src/utils/
index.ts                  # All utilities in a single barrel file
README.md                 # This documentation
```

All utilities are exported from `index.ts` and are accessible via:

```typescript
import { LruCache, debounce, throttle, deepClone, flatten, unflatten }
  from '/home/runner/workspace/agent-gateway/src/utils/index.js';
```

Or through the main agent-gateway package export:

```typescript
import { LruCache, debounce, throttle, deepClone, flatten, unflatten }
  from 'agent-gateway';
```

---

## RequestDeduplicator

The `RequestDeduplicator` class prevents redundant concurrent operations by coalescing identical in-flight requests. When multiple callers request the same key simultaneously, only the first invocation executes; subsequent callers receive the same promise.

### Constructor

```typescript
class RequestDeduplicator {
  // No constructor arguments needed
}
```

### Methods

#### `deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T>`

Executes `fn()` only if no in-flight request exists for `key`. Returns the existing promise otherwise.

```typescript
const dedup = new RequestDeduplicator();

// First call executes fn()
const result1 = dedup.deduplicate('user:123', () => fetchUser('123'));

// Second call returns the same promise (no duplicate fetch)
const result2 = dedup.deduplicate('user:123', () => fetchUser('123'));

// result1 === result2 (same promise, same underlying request)
```

#### `activeCount: number` (getter)

Returns the number of currently in-flight deduplicated requests.

```typescript
console.log(dedup.activeCount); // 0
dedup.deduplicate('key', slowFn);
console.log(dedup.activeCount); // 1
```

### Use Cases

- **API call deduplication**: Prevent multiple simultaneous requests for the same resource
- **Database query coalescing**: Avoid duplicate queries during concurrent access
- **Provider request deduplication**: When multiple channels request the same AI provider call

### Internal Behavior

1. Check if `key` exists in the `inFlight` map
2. If yes, return the existing promise
3. If no, execute `fn()`, store the promise, and delete it from the map when settled (via `.finally()`)

---

## LruCache

A generic Least-Recently-Used cache implementation with O(1) operations. When the cache reaches capacity, the least recently accessed entry is evicted.

### Constructor

```typescript
class LruCache<K, V> {
  constructor(max: number = 10000);
}
```

### Methods

#### `get(key: K): V | undefined`

Retrieves a value by key. Moves the key to the most-recently-used position on hit.

```typescript
const cache = new LruCache<string, number>(100);
cache.set('a', 1);
const value = cache.get('a'); // 1
const missing = cache.get('b'); // undefined
```

#### `set(key: K, value: V): void`

Inserts or updates a value. Evicts the least recently used entry if at capacity.

```typescript
const cache = new LruCache<string, string>(2);
cache.set('x', 'first');
cache.set('y', 'second');
cache.set('z', 'third'); // Evicts 'x' (LRU)
cache.get('x'); // undefined (evicted)
```

#### `delete(key: K): boolean`

Removes an entry. Returns `true` if the key existed.

```typescript
const deleted = cache.delete('key');
```

#### `has(key: K): boolean`

Checks if a key exists without updating its LRU position.

```typescript
if (cache.has('key')) {
  // Key exists but position unchanged
}
```

#### `clear(): void`

Removes all entries.

```typescript
cache.clear();
console.log(cache.size); // 0
```

#### `size: number` (getter)

Returns the current number of entries.

```typescript
console.log(cache.size);
```

### Use Cases

- **Response caching**: Cache AI provider responses to reduce API calls
- **Session data**: Cache frequently accessed session metadata
- **Config caching**: Cache parsed configuration values
- **Template caching**: Cache compiled template strings

### Performance

- **Get**: O(1) - Map lookup + Map delete + Map set (for LRU reordering)
- **Set**: O(1) - Map operations only
- **Delete**: O(1) - Map delete
- **Memory**: Proportional to `max` entries; no automatic memory-based eviction

---

## debounce

Delays function execution until a specified period elapses without new calls. Returns a Promise-based debounced function.

### Signature

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>>
```

### Usage

```typescript
import { debounce } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const logMessage = debounce((msg: string) => {
  console.log('Debounced:', msg);
  return { logged: true };
}, 300);

// Only the last call executes (after 300ms of silence)
logMessage('hello');  // Cancelled by next call
logMessage('world');  // This one executes after 300ms
const result = await logMessage('final'); // Also awaits result
```

### Important Notes

- Each call returns a Promise that resolves with the debounced function's result
- Only the **last** invocation within the delay window executes
- Previous pending promises resolve with the result of the final execution
- The debounce timer resets on every new call

### Use Cases

- **Config file watching**: Debounce reload events to avoid rapid re-loads
- **Search input**: Delay API calls until user stops typing
- **Metrics flushing**: Batch metrics writes at intervals
- **UI updates**: Throttle rapid state change notifications

---

## throttle

Limits function execution to at most once per specified interval. Calls within the interval are silently dropped.

### Signature

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void
```

### Usage

```typescript
import { throttle } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const logRequest = throttle((path: string, method: string) => {
  console.log(`[${method}] ${path}`);
}, 1000); // At most once per second

logRequest('/api/users', 'GET');   // Executes immediately
logRequest('/api/posts', 'POST');  // Dropped (< 1000ms since last call)
// After 1000ms...
logRequest('/api/status', 'GET');  // Executes
```

### Important Notes

- Throttled functions are **fire-and-forget** (void return)
- Calls within the throttle window are silently ignored
- The first call always executes (no initial delay)

### Use Cases

- **Rate-limited logging**: Prevent log flooding
- **Progress updates**: Limit UI update frequency
- **Metrics sampling**: Reduce metric write frequency
- **Heartbeat throttling**: Limit status ping frequency

---

## deepClone

Creates a deep copy of any serializable value.

### Signature

```typescript
function deepClone<T>(obj: T): T
```

### Usage

```typescript
import { deepClone } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const original = { nested: { array: [1, 2, { deep: true }] } };
const cloned = deepClone(original);
cloned.nested.array[2].deep = false;
console.log(original.nested.array[2].deep); // true (unaffected)
```

### Implementation Details

1. **Primary path**: Uses `structuredClone()` (native, supports Map, Set, Date, RegExp, etc.)
2. **Fallback path**: Uses `JSON.parse(JSON.stringify(obj))` (loses undefined, functions, Symbols)

### Limitations

- Functions cannot be cloned
- `undefined` values are lost in the JSON fallback path
- Circular references may cause infinite loops in the JSON fallback
- `structuredClone` is available in Node.js 17+

---

## flatten

Converts a nested object into a flat object with dot-notation keys.

### Signature

```typescript
function flatten(
  obj: Record<string, any>,
  prefix?: string
): Record<string, any>
```

### Usage

```typescript
import { flatten } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const nested = {
  a: 1,
  b: {
    c: 2,
    d: { e: 3 },
  },
  f: [1, 2, 3], // Arrays are treated as leaf values
};

const flat = flatten(nested);
// { 'a': 1, 'b.c': 2, 'b.d.e': 3, 'f': [1, 2, 3] }
```

### Behavior

- Arrays are treated as leaf values (not recursively flattened)
- `null` values are treated as leaf values
- Plain objects are recursively traversed
- The optional `prefix` parameter prepends a key prefix

---

## unflatten

Reconstructs a nested object from dot-notation keys. The inverse of `flatten`.

### Signature

```typescript
function unflatten(obj: Record<string, any>): Record<string, any>
```

### Usage

```typescript
import { unflatten } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const flat = { 'a': 1, 'b.c': 2, 'b.d.e': 3 };
const nested = unflatten(flat);
// { a: 1, b: { c: 2, d: { e: 3 } } }
```

### Behavior

- Splits keys on `.` delimiter
- Creates intermediate objects as needed
- Later keys override earlier keys if they conflict:
  ```typescript
  unflatten({ 'a.b': 1, 'a': 2 }); // { a: 2 } (overrides nested a.b)
  ```

---

## Usage Examples

### Caching Layer with LRU

```typescript
import { LruCache } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

// Cache provider responses (max 500 entries)
const responseCache = new LruCache<string, any>(500);

async function getCachedResponse(model: string, messages: any[]) {
  const key = `${model}:${JSON.stringify(messages)}`;

  if (responseCache.has(key)) {
    return responseCache.get(key);
  }

  const response = await callAIProvider(model, messages);
  responseCache.set(key, response);
  return response;
}
```

### Request Deduplication

```typescript
import { RequestDeduplicator } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const dedup = new RequestDeduplicator();

async function handleConcurrentRequests(requests: string[]) {
  // All requests for the same key share one execution
  const results = await Promise.all(
    requests.map(req =>
      dedup.deduplicate(req, () => expensiveOperation(req))
    )
  );
  return results;
}
```

### Debounced Config Reload

```typescript
import { debounce } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const reloadConfig = debounce(async () => {
  const config = await loadConfigFromFile();
  applyConfig(config);
}, 500);

// Watch file - multiple rapid events collapse into one reload
watcher.on('change', () => reloadConfig());
```

### Flat Config for Environment Variables

```typescript
import { flatten, unflatten } from '/home/runner/workspace/agent-gateway/src/utils/index.js';

const config = {
  server: { host: '0.0.0.0', port: 3000 },
  auth: { enabled: true, apiKey: 'secret' },
};

// Flatten for environment variable mapping
const flat = flatten(config);
// { 'server.host': '0.0.0.0', 'server.port': 3000, ... }

// Reconstruct after reading from env vars
const restored = unflatten(flat);
```

---

## Integration Points

These utilities are used across the Agent Gateway codebase:

| Utility | Used In | Purpose |
|---------|---------|---------|
| `LruCache` | Cache layer, session management, config parsing | In-memory caching |
| `RequestDeduplicator` | Provider calls, session lookups | Prevent redundant requests |
| `debounce` | Config watchers, metrics flushing | Rate-controlled updates |
| `throttle` | Request logging, status updates | Prevent log flooding |
| `deepClone` | Context management, session snapshots | Safe copying of state |
| `flatten`/`unflatten` | Config serialization, env var mapping | Key transformation |

---

## Performance Characteristics

| Utility | Time Complexity | Space Complexity | Notes |
|---------|----------------|------------------|-------|
| `LruCache.get` | O(1) | O(1) per entry | Map-based implementation |
| `LruCache.set` | O(1) | O(1) per entry | Evicts LRU entry at capacity |
| `RequestDeduplicator.deduplicate` | O(1) | O(N) where N = unique in-flight keys | Promises cleaned up on settlement |
| `debounce` | O(1) | O(1) per debounced function | Single timer per instance |
| `throttle` | O(1) | O(1) per throttled function | Single timestamp per instance |
| `deepClone` | O(N) | O(N) where N = object size | structuredClone preferred |
| `flatten` | O(N * D) | O(N * D) where D = nesting depth | Recursive traversal |
| `unflatten` | O(N * K) | O(N * K) where K = max key parts | String splitting per key |

---

## Error Handling

- **`deepClone`**: Falls back gracefully from `structuredClone` to JSON serialization. Neither approach handles circular references in the fallback path
- **`RequestDeduplicator`**: Propagates rejections from the underlying promise; callers must handle errors
- **`LruCache`**: No errors thrown; all operations are safe for any key type
- **`flatten`/`unflatten`**: No error handling; assumes valid object inputs. Conflicting keys in `unflatten` silently override

---

## Testing

Tests for these utilities are located in:

- `/home/runner/workspace/agent-gateway/test/request-deduplicator.test.ts`

Run tests:

```bash
cd /home/runner/workspace/agent-gateway
npm run test -- request-deduplicator.test.ts
```

The `LruCache`, `debounce`, `throttle`, `flatten`, and `unflatten` functions are tested through integration tests across various test files.

---

## Best Practices

1. **Use `RequestDeduplicator` for idempotent operations**: Only deduplicate operations where concurrent identical calls should produce the same result
2. **Size LruCache appropriately**: Set `max` based on expected working set size and available memory
3. **Debounce user-triggered actions**: Use debounce for config reloads, search inputs, and similar patterns
4. **Throttle high-frequency events**: Use throttle for logging, metrics, and status updates
5. **Prefer `structuredClone`**: `deepClone` already prefers it, but be aware of Node.js version requirements (17+)
6. **Be careful with `flatten`/`unflatten`**: These do not preserve arrays, Maps, Sets, or other complex types

---

## Future Enhancements

Potential improvements for this module:

1. **TTL support for `LruCache`**: Time-based eviction in addition to LRU eviction
2. **Exponential backoff for `RequestDeduplicator`**: Configurable retry delays
3. **Leading-edge debounce**: Option to invoke immediately on first call
4. **Trailing-edge throttle**: Option to invoke on the trailing edge of the interval
5. **Custom key serializer for `flatten`**: Support for Map keys, Symbol keys, and array index flattening
6. **Circular reference handling in `deepClone`**: Detect and preserve reference cycles
7. **Async `debounce` improvements**: Better handling of promise rejections and cancellation
