# Input Sanitizer

Enterprise-grade input sanitization and XSS protection module for the Agent Gateway. This module provides a comprehensive set of static methods to sanitize user input across multiple attack vectors including cross-site scripting (XSS), SQL injection, path traversal, command injection, and malicious URLs.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [InputSanitizer Class](#inputsanitizer-class)
  - [sanitizeHtml()](#sanitizehtml)
  - [sanitizePath()](#sanitizepath)
  - [sanitizeSql()](#sanitizesql)
  - [sanitizeCommand()](#sanitizecommand)
  - [sanitizeUrl()](#sanitizeurl)
  - [sanitizeObject()](#sanitizeobject)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Related Documentation](#related-documentation)

## Overview

The `InputSanitizer` module is a defensive layer that transforms potentially dangerous user input into safe equivalents before the data reaches business logic, databases, or rendering pipelines. It operates as a static utility class -- no instantiation is required -- and covers five distinct sanitization contexts:

| Context | Method | Primary Threats Mitigated |
|---------|--------|--------------------------|
| HTML | `sanitizeHtml()` | XSS, HTML injection |
| File paths | `sanitizePath()` | Path traversal, directory escape |
| SQL | `sanitizeSql()` | SQL injection, DROP/DELETE attacks |
| Shell commands | `sanitizeCommand()` | Command injection, shell escape |
| URLs | `sanitizeUrl()` | Protocol smuggling (javascript:, data:) |
| Objects | `sanitizeObject()` | Bulk field sanitization with per-field rules |

All methods are pure functions with no side effects, making them safe for use in middleware, request handlers, data pipelines, and any other context where untrusted input enters the system.

## File Structure

```
/home/runner/workspace/agent-gateway/src/input-sanitizer/
  index.ts          # Main InputSanitizer class with all static methods
  README.md         # This documentation file
```

The module is intentionally compact: a single `index.ts` file exports the `InputSanitizer` class. There are no external dependencies beyond the TypeScript standard library.

## Installation and Import

No separate installation is required; the module ships as part of the Agent Gateway codebase. Import it directly:

```typescript
import { InputSanitizer } from '../input-sanitizer/index.js';
// or with the full absolute path:
// import { InputSanitizer } from '/home/runner/workspace/agent-gateway/src/input-sanitizer/index.js';
```

## API Reference

### InputSanitizer Class

The `InputSanitizer` class exposes only static methods. It is not intended to be instantiated.

```typescript
export class InputSanitizer {
  static sanitizeHtml(input: string): string;
  static sanitizePath(input: string): string;
  static sanitizeSql(input: string): string;
  static sanitizeCommand(input: string): string;
  static sanitizeUrl(input: string): string;
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    rules: Record<string, 'html' | 'path' | 'sql' | 'command' | 'url'>
  ): T;
}
```

### sanitizeHtml()

Escapes HTML special characters to prevent XSS and HTML injection attacks.

**Signature:**
```typescript
static sanitizeHtml(input: string): string
```

**Parameters:**
- `input: string` -- The raw string that may contain HTML or script content.

**Returns:** `string` -- The sanitized string with all HTML special characters replaced by their entity equivalents.

**Transformations applied:**
| Character | Replacement |
|-----------|-------------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#x27;` |
| `/` | `&#x2F;` |

**Example:**
```typescript
const raw = '<script>alert("XSS")</script>';
const safe = InputSanitizer.sanitizeHtml(raw);
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
```

### sanitizePath()

Removes path traversal sequences and restricts path characters to a safe whitelist.

**Signature:**
```typescript
static sanitizePath(input: string): string
```

**Parameters:**
- `input: string` -- A file path or path segment that may contain traversal attempts.

**Returns:** `string` -- A sanitized path with `..` sequences removed, backslashes normalized to forward slashes, and non-whitelisted characters stripped.

**Transformations applied:**
1. All `../` and `..\` sequences are removed.
2. Backslashes (`\`) are normalized to forward slashes (`/`).
3. Only alphanumeric characters, underscores, hyphens, periods, and forward slashes are retained.

**Example:**
```typescript
const raw = '../../../etc/passwd';
const safe = InputSanitizer.sanitizePath(raw);
// Result: 'etcpasswd' (dots and slashes outside the whitelist are removed)

const raw2 = 'uploads\\images\\photo.jpg';
const safe2 = InputSanitizer.sanitizePath(raw2);
// Result: 'uploads/images/photo.jpg'
```

### sanitizeSql()

Strips SQL metacharacters and dangerous SQL keywords to mitigate injection attacks.

**Signature:**
```typescript
static sanitizeSql(input: string): string
```

**Parameters:**
- `input: string` -- User input that may be incorporated into a SQL query.

**Returns:** `string` -- The input with dangerous SQL characters (`'`, `"`, `;`, `\`) and keywords removed.

**Characters removed:** `'`, `"`, `;`, `\`

**Keywords removed (case-insensitive):** `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, `EXEC`, `UNION`, `SELECT`

**Example:**
```typescript
const raw = "'; DROP TABLE users; --";
const safe = InputSanitizer.sanitizeSql(raw);
// Result: '  TABLE users ' (dangerous chars and keywords removed)
```

**Important note:** This method is a defense-in-depth measure. Parameterized queries should always be the primary defense against SQL injection. This sanitizer provides an additional layer for scenarios where dynamic SQL construction is unavoidable.

### sanitizeCommand()

Removes shell metacharacters that could enable command injection.

**Signature:**
```typescript
static sanitizeCommand(input: string): string
```

**Parameters:**
- `input: string` -- Input that may be used in a shell command context.

**Returns:** `string` -- The input with shell metacharacters removed.

**Characters removed:** `;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `{`, `}`, `[`, `]`, `!`, `#`, `~`

**Example:**
```typescript
const raw = 'filename; rm -rf /';
const safe = InputSanitizer.sanitizeCommand(raw);
// Result: 'filename rm rf '
```

### sanitizeUrl()

Validates and sanitizes URLs, allowing only HTTP and HTTPS protocols.

**Signature:**
```typescript
static sanitizeUrl(input: string): string
```

**Parameters:**
- `input: string` -- A URL string that may use dangerous protocols (e.g., `javascript:`, `data:`, `vbscript:`).

**Returns:** `string` -- The validated URL if it uses `http:` or `https:`; otherwise, an empty string.

**Behavior:**
1. Attempts to parse the input as a `URL` object.
2. Checks that the protocol is `http:` or `https:`.
3. Returns the canonical `href` if valid; returns `''` if invalid or using a disallowed protocol.

**Example:**
```typescript
InputSanitizer.sanitizeUrl('https://example.com/path');
// Result: 'https://example.com/path'

InputSanitizer.sanitizeUrl('javascript:alert(1)');
// Result: ''

InputSanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>');
// Result: ''

InputSanitizer.sanitizeUrl('not-a-valid-url');
// Result: ''
```

### sanitizeObject()

Applies sanitization rules to multiple fields of an object in a single call.

**Signature:**
```typescript
static sanitizeObject<T extends Record<string, any>>(
  obj: T,
  rules: Record<string, 'html' | 'path' | 'sql' | 'command' | 'url'>
): T
```

**Parameters:**
- `obj: T` -- The object whose string-valued fields need sanitization.
- `rules: Record<string, 'html' | 'path' | 'sql' | 'command' | 'url'>` -- A mapping from field names to sanitization types. Only fields listed in `rules` are sanitized; other fields pass through unchanged.

**Returns:** `T` -- A shallow copy of the object with specified fields sanitized.

**Example:**
```typescript
const userInput = {
  name: '<script>alert(1)</script>',
  avatar: 'javascript:void(0)',
  bio: 'Hello world',
  settingsPath: '../../config',
};

const sanitized = InputSanitizer.sanitizeObject(userInput, {
  name: 'html',
  avatar: 'url',
  settingsPath: 'path',
});

// Result:
// {
//   name: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;',
//   avatar: '',
//   bio: 'Hello world',        // not in rules, unchanged
//   settingsPath: 'config',
// }
```

## Configuration Options

This module has no runtime configuration. All sanitization rules are hardcoded into the regex patterns and logic. If customization is needed (e.g., allowing additional HTML tags, supporting different SQL dialects), create a wrapper module that delegates to `InputSanitizer` and applies post-processing.

## Usage Examples

### Express.js Middleware Integration

```typescript
import { InputSanitizer } from '/home/runner/workspace/agent-gateway/src/input-sanitizer/index.js';
import express from 'express';

const app = express();
app.use(express.json());

// Sanitize request body before route handlers
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const rules: Record<string, 'html' | 'url'> = {};
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        rules[key] = 'html'; // Default to HTML sanitization
      }
    }
    if (Object.keys(rules).length > 0) {
      req.body = InputSanitizer.sanitizeObject(req.body, rules);
    }
  }
  next();
});
```

### Sanitizing Query Parameters

```typescript
import { InputSanitizer } from '/home/runner/workspace/agent-gateway/src/input-sanitizer/index.js';

// In a route handler
app.get('/search', (req, res) => {
  const query = InputSanitizer.sanitizeSql(req.query.q as string);
  const redirectUrl = InputSanitizer.sanitizeUrl(req.query.redirect as string);

  if (!redirectUrl && req.query.redirect) {
    return res.status(400).json({ error: 'Invalid redirect URL' });
  }

  // Proceed with sanitized values
  db.search(query).then(results => res.json(results));
});
```

### File Upload Path Sanitization

```typescript
import { InputSanitizer } from '/home/runner/workspace/agent-gateway/src/input-sanitizer/index.js';
import path from 'path';

function sanitizeUploadPath(userPath: string): string {
  const sanitized = InputSanitizer.sanitizePath(userPath);
  const uploadDir = '/var/uploads';
  const resolved = path.resolve(uploadDir, sanitized);

  // Double-check that the resolved path is within the upload directory
  if (!resolved.startsWith(uploadDir)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}
```

## Integration Points

The `InputSanitizer` module integrates with several other modules in the Agent Gateway:

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Security Scanner | `/home/runner/workspace/agent-gateway/src/security-scanner/` | The Security Scanner uses regex-based threat detection; InputSanitizer provides active sanitization. Use together for defense-in-depth. |
| Middleware | `/home/runner/workspace/agent-gateway/src/middleware/` | Apply sanitization as a middleware layer before request processing. |
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Sanitize all inbound request payloads at the gateway edge. |
| Data Transformer | `/home/runner/workspace/agent-gateway/src/data-transformer/` | Chain sanitization as a `map` operation in transformation pipelines. |
| GraphQL | `/home/runner/workspace/agent-gateway/src/graphql/` | Sanitize input arguments and mutation payloads. |

## Error Handling

- **Non-throwing design:** None of the sanitization methods throw exceptions for malformed input. They always return a string (or an empty string in the case of `sanitizeUrl` for invalid URLs).
- **`sanitizeUrl`** catches URL parsing errors internally and returns `''`.
- **`sanitizeObject`** only processes string-valued fields. Non-string fields are left unchanged.
- **Shallow copy:** `sanitizeObject` creates a shallow copy of the input object. Nested objects are not deep-cloned; only the top-level string fields listed in `rules` are mutated.

## Security Considerations

1. **Defense in depth:** Input sanitization is one layer of a multi-layered security strategy. It should complement -- not replace -- parameterized queries, output encoding, CSP headers, and other controls.
2. **Allow-list vs. deny-list:** The HTML and command sanitizers use deny-lists (removing known-dangerous characters/keywords). Deny-lists can miss novel attack vectors. Prefer allow-list validation where feasible.
3. **SQL sanitizer limitations:** The SQL sanitizer removes keywords but cannot prevent all injection patterns. Always use parameterized queries as the primary defense.
4. **Unicode normalization:** The current implementation does not perform Unicode normalization. Sophisticated attackers may use Unicode homoglyphs to bypass regex-based checks. Consider adding a Unicode normalization step if your application handles internationalized input.
5. **Performance:** All methods use synchronous regex operations. For high-throughput scenarios, benchmark the sanitizer under load to ensure it does not become a bottleneck.

## Related Documentation

- [Security Scanner](/home/runner/workspace/agent-gateway/src/security-scanner/README.md) -- Complementary threat detection and IP reputation module.
- [Data Transformer](/home/runner/workspace/agent-gateway/src/data-transformer/README.md) -- Data transformation pipelines that can incorporate sanitization steps.
- [Middleware](/home/runner/workspace/agent-gateway/src/middleware/README.md) -- Request/response middleware patterns for applying sanitization.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Edge-level input validation and routing.
- [Content Moderator](/home/runner/workspace/agent-gateway/src/content-moderator/README.md) -- Content-level moderation for user-generated content.
