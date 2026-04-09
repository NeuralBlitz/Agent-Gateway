# Security Scanner

Enterprise security scanning and vulnerability detection module for the Agent Gateway. This module provides request/response inspection, threat detection (SQL injection, XSS, path traversal, command injection), IP reputation tracking, automated blocking, request rate monitoring, and comprehensive security statistics.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [ThreatLevel](#threatlevel)
    - [ThreatDetection](#threatdetection)
    - [IpReputation](#ipreputation)
    - [SecurityConfig](#securityconfig)
  - [SecurityScanner Class](#securityscanner-class)
  - [scanRequest()](#scanrequest)
  - [blockIp()](#blockip)
  - [unblockIp()](#unblockip)
  - [getIpReputation()](#getipreputation)
  - [getDetections()](#getdetections)
  - [getStats()](#getstats)
  - [Factory Function](#factory-function)
- [Threat Detection Reference](#threat-detection-reference)
  - [SQL Injection Detection](#sql-injection-detection)
  - [XSS Detection](#xss-detection)
  - [Path Traversal Detection](#detection)
  - [Command Injection Detection](#command-injection-detection)
  - [Rate Limiting](#rate-limiting)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Scoring System](#scoring-system)
- [Limitations and Best Practices](#limitations-and-best-practices)
- [Related Documentation](#related-documentation)

## Overview

The `SecurityScanner` is a defensive layer that inspects incoming HTTP requests for known attack patterns and suspicious behavior. It combines signature-based threat detection with IP reputation tracking to provide a comprehensive security assessment for each request.

**Key features:**
- **Multi-vector threat detection:** SQL injection, XSS, path traversal, command injection.
- **IP reputation tracking:** Cumulative threat scoring per IP with historical tracking.
- **Automated blocking:** IPs exceeding a configurable score threshold are automatically blocked.
- **Manual block/unblock:** Administrators can manually block or unblock IPs.
- **Request validation:** Enforces limits on request size, URL length, and header count.
- **Rate monitoring:** Tracks request counts per IP and flags excessive rates.
- **Event-driven:** Emitted events for threat detection and IP blocking/unblocking.
- **Statistics:** Breakdown of detections by type, level, and top offender IPs.

### Request Scan Flow

```
Incoming Request
    │
    ├── Check blocked IP list ──▶ BLOCKED? ──▶ Return 403
    ├── Check blocked user agent ──▶ Add threat + score
    ├── Check URL length ──▶ Exceeds limit? ──▶ Add threat + score
    ├── Check header count ──▶ Exceeds limit? ──▶ Add threat + score
    ├── SQL injection scan ──▶ Pattern match? ──▶ Add threat + score
    ├── XSS scan ──▶ Pattern match? ──▶ Add threat + score
    ├── Path traversal scan ──▶ Pattern match? ──▶ Add threat + score
    ├── Command injection scan ──▶ Pattern match? ──▶ Add threat + score
    ├── Request rate check ──▶ Exceeds threshold? ──▶ Add threat + score
    │
    └── Total score >= autoBlockThreshold? ──▶ Auto-block IP
    │
    └── Return { blocked, threats, score }
```

## File Structure

```
/home/runner/workspace/agent-gateway/src/security-scanner/
  index.ts          # SecurityScanner class, all interfaces
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { SecurityScanner, createSecurityScanner } from '../security-scanner/index.js';
// or with the full absolute path:
// import { SecurityScanner, createSecurityScanner } from '/home/runner/workspace/agent-gateway/src/security-scanner/index.js';
```

## API Reference

### Types and Interfaces

#### ThreatLevel

```typescript
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
```

#### ThreatDetection

A single detected threat.

```typescript
export interface ThreatDetection {
  id: string;
  type: string;
  level: ThreatLevel;
  description: string;
  source: string; // IP address
  details: Record<string, any>;
  timestamp: number;
  blocked: boolean;
}
```

#### IpReputation

IP reputation tracking data.

```typescript
export interface IpReputation {
  ip: string;
  score: number; // 0-100, higher = more suspicious
  threats: string[];
  country?: string;
  asn?: string;
  lastSeen?: number;
  blocked: boolean;
}
```

#### SecurityConfig

Configuration for the security scanner.

```typescript
export interface SecurityConfig {
  /** Max request size in bytes (default: 10MB) */
  maxRequestSize?: number;
  /** Max header count (default: 50) */
  maxHeaderCount?: number;
  /** Max URL length (default: 2048) */
  maxUrlLength?: number;
  /** Blocked IP list */
  blockedIps?: string[];
  /** Blocked user agent patterns */
  blockedUserAgents?: string[];
  /** Enable SQL injection detection (default: true) */
  detectSqlInjection?: boolean;
  /** Enable XSS detection (default: true) */
  detectXss?: boolean;
  /** Enable path traversal detection (default: true) */
  detectPathTraversal?: boolean;
  /** Enable command injection detection (default: true) */
  detectCommandInjection?: boolean;
  /** Auto-block threshold (0-100, default: 80) */
  autoBlockThreshold?: number;
}
```

### SecurityScanner Class

Extends `EventEmitter` for security event observability.

```typescript
export class SecurityScanner extends EventEmitter {
  constructor(config?: SecurityConfig);

  scanRequest(req: {
    ip?: string;
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    userAgent?: string;
  }): { blocked: boolean; threats: ThreatDetection[]; score: number };

  blockIp(ip: string): void;
  unblockIp(ip: string): void;
  getIpReputation(ip: string): IpReputation | undefined;
  getDetections(limit?: number, type?: string): ThreatDetection[];
  getStats(): {
    totalDetections: number;
    blockedIps: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    topOffenders: Array<{ ip: string; score: number; threats: number }>;
  };
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `threat:detected` | `{ ip, threats, score, blocked }` | Threats were detected in a request |
| `ip:blocked` | `{ ip }` | An IP was blocked (manually or automatically) |
| `ip:unblocked` | `{ ip }` | An IP was unblocked |

### scanRequest()

Scans an incoming request for security threats.

**Signature:**
```typescript
scanRequest(req: {
  ip?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  userAgent?: string;
}): { blocked: boolean; threats: ThreatDetection[]; score: number }
```

**Parameters:**
- `req` -- A simplified request object. At minimum, `ip` and `url` should be provided for effective scanning.

**Returns:**
- `blocked` -- Whether the request should be blocked.
- `threats` -- Array of detected threats.
- `score` -- Cumulative threat score (0-100).

**Checks performed (in order):**
1. Blocked IP check (immediate block, score 100).
2. Blocked user agent check (+40 points).
3. URL length check (+20 points).
4. Header count check (+10 points).
5. SQL injection detection (+60 points).
6. XSS detection (+50 points).
7. Path traversal detection (+40 points).
8. Command injection detection (+70 points).
9. Request rate check (+30 points).

### blockIp()

Manually blocks an IP address.

**Signature:**
```typescript
blockIp(ip: string): void
```

**Behavior:**
- Adds the IP to the blocked set.
- Sets IP reputation to 100.
- Emits `ip:blocked` event.

### unblockIp()

Manually unblocks an IP address.

**Signature:**
```typescript
unblockIp(ip: string): void
```

**Behavior:**
- Removes the IP from the blocked set.
- Updates the reputation's `blocked` flag to `false`.
- Emits `ip:unblocked` event.

### getIpReputation()

Returns the reputation data for an IP.

**Signature:**
```typescript
getIpReputation(ip: string): IpReputation | undefined
```

### getDetections()

Returns recent threat detections.

**Signature:**
```typescript
getDetections(limit?: number, type?: string): ThreatDetection[]
```

**Parameters:**
- `limit` (default: 100) -- Maximum detections to return.
- `type` (optional) -- Filter by detection type (e.g., `'sql_injection'`, `'xss'`).

### getStats()

Returns comprehensive security statistics.

**Signature:**
```typescript
getStats(): {
  totalDetections: number;
  blockedIps: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  topOffenders: Array<{ ip: string; score: number; threats: number }>;
}
```

### Factory Function

```typescript
export function createSecurityScanner(config?: SecurityConfig): SecurityScanner
```

Convenience factory for creating a configured scanner.

## Threat Detection Reference

### SQL Injection Detection

Scans the request URL, body, and headers for SQL injection patterns.

**Patterns detected:**
| Pattern | Example |
|---------|---------|
| SQL keywords with FROM/INTO/WHERE | `UNION SELECT ... FROM`, `DROP TABLE` |
| Tautology attacks | `' OR '1'='1`, `" OR "1"="1` |
| Time-based injection | `WAITFOR DELAY`, `SLEEP(5)` |
| Comment injection | `--`, `/* ... */` |
| Benchmark attacks | `BENCHMARK(...)` |

**Threat level:** `critical` (+60 points)

### XSS Detection

Scans for cross-site scripting patterns.

**Patterns detected:**
| Pattern | Example |
|---------|---------|
| Script tags | `<script>`, `<script src="...">` |
| JavaScript protocol | `javascript:...` |
| Event handlers | `onload=`, `onerror=`, `onclick=`, `onmouseover=` |
| Eval calls | `eval(...)` |
| DOM manipulation | `document.cookie`, `document.write`, `document.location` |
| Window manipulation | `window.location`, `window.open`, `window.alert` |
| Embedded objects | `<iframe>`, `<object>`, `<embed>` |

**Threat level:** `high` (+50 points)

### Path Traversal Detection

Detects directory traversal attempts in URLs.

**Patterns detected:**
| Pattern | Description |
|---------|-------------|
| `../` and `..\` | Standard traversal |
| `%2e%2e%2f` | URL-encoded traversal |
| `%2e%2e/` | Partially encoded |
| `..%2f` | Partially encoded |
| `%2e%2e%5c` | URL-encoded backslash |

**Threat level:** `high` (+40 points)

### Command Injection Detection

Detects shell command injection patterns. Requires **both** a shell metacharacter **and** a suspicious command keyword to trigger.

**Metacharacters:** `;`, `|`, `` ` ``, `$`, `(`, `)`, `{`, `}`, `[`, `]`

**Command keywords:** `cat`, `ls`, `dir`, `whoami`, `id`, `uname`, `pwd`, `wget`, `curl`, `nc`, `bash`, `sh`, `cmd`, `powershell`

**Threat level:** `critical` (+70 points)

### Rate Limiting

Tracks request counts per IP in 60-second windows.

**Threshold:** 1,000 requests per minute.

**Threat level:** `medium` (+30 points)

**Note:** This is a basic rate check within the security scanner. For comprehensive rate limiting with multiple algorithms and configurable rules, use the Rate Limit Engine at `/home/runner/workspace/agent-gateway/src/rate-limit-engine/`.

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxRequestSize` | 10,485,760 (10MB) | Maximum request body size in bytes |
| `maxHeaderCount` | 50 | Maximum number of request headers |
| `maxUrlLength` | 2,048 | Maximum URL length in characters |
| `blockedIps` | `[]` | Initial list of blocked IP addresses |
| `blockedUserAgents` | `[]` | User agent substrings to block |
| `detectSqlInjection` | `true` | Enable SQL injection pattern detection |
| `detectXss` | `true` | Enable XSS pattern detection |
| `detectPathTraversal` | `true` | Enable path traversal pattern detection |
| `detectCommandInjection` | `true` | Enable command injection pattern detection |
| `autoBlockThreshold` | 80 | Threat score threshold for automatic IP blocking |

## Usage Examples

### Express.js Security Middleware

```typescript
import express from 'express';
import { createSecurityScanner } from '/home/runner/workspace/agent-gateway/src/security-scanner/index.js';

const app = express();
app.use(express.json());

const scanner = createSecurityScanner({
  maxRequestSize: 5 * 1024 * 1024, // 5MB
  maxUrlLength: 1024,
  blockedUserAgents: ['sqlmap', 'nikto', 'nmap', 'masscan'],
  autoBlockThreshold: 70,
});

// Security scanning middleware
app.use((req, res, next) => {
  const result = scanner.scanRequest({
    ip: req.ip,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    userAgent: req.headers['user-agent'],
  });

  if (result.blocked) {
    return res.status(403).json({
      error: 'Request blocked',
      threats: result.threats.map((t) => ({ type: t.type, level: t.level, description: t.description })),
      score: result.score,
    });
  }

  // Attach security score to request for downstream middleware
  (req as any).securityScore = result.score;
  (req as any).securityThreats = result.threats;

  next();
});
```

### Admin Panel for Security Management

```typescript
// View blocked IPs
app.get('/api/admin/security/blocked-ips', (_req, res) => {
  const stats = scanner.getStats();
  res.json({
    blockedIps: stats.blockedIps,
    topOffenders: stats.topOffenders,
    byType: stats.byType,
    byLevel: stats.byLevel,
  });
});

// View recent detections
app.get('/api/admin/security/detections', (req, res) => {
  const type = req.query.type as string;
  const limit = parseInt(req.query.limit as string) || 100;
  const detections = scanner.getDetections(limit, type);
  res.json(detections);
});

// Block an IP manually
app.post('/api/admin/security/block-ip', express.json(), (req, res) => {
  scanner.blockIp(req.body.ip);
  res.json({ message: `IP ${req.body.ip} blocked` });
});

// Unblock an IP
app.post('/api/admin/security/unblock-ip', express.json(), (req, res) => {
  scanner.unblockIp(req.body.ip);
  res.json({ message: `IP ${req.body.ip} unblocked` });
});

// Check IP reputation
app.get('/api/admin/security/ip/:ip', (req, res) => {
  const reputation = scanner.getIpReputation(req.params.ip);
  res.json(reputation || { ip: req.params.ip, score: 0, blocked: false });
});
```

### Blocking Suspicious User Agents

```typescript
const scanner = createSecurityScanner({
  blockedUserAgents: [
    'sqlmap',     // SQL injection tool
    'nikto',      // Web vulnerability scanner
    'nmap',       // Network scanner
    'masscan',    // Port scanner
    'dirbuster',  // Directory brute-forcer
    'gobuster',   // DNS/directory brute-forcer
    'hydra',      // Password cracker
    'burpsuite',  // Web security testing
  ],
});
```

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Input Sanitizer | `/home/runner/workspace/agent-gateway/src/input-sanitizer/` | The Input Sanitizer actively sanitizes dangerous input; the Security Scanner detects and blocks malicious requests. Use together: scanner detects, sanitizer neutralizes. |
| Rate Limit Engine | `/home/runner/workspace/agent-gateway/src/rate-limit-engine/` | The Security Scanner has a basic rate check (1000 req/min); the Rate Limit Engine provides configurable multi-algorithm rate limiting. |
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Apply security scanning as the first middleware layer at the gateway edge. |
| Observability Engine | `/home/runner/workspace/agent-gateway/src/observability-engine/` | Track security detections as metrics and set up alerts for high threat volumes. |
| Middleware | `/home/runner/workspace/agent-gateway/src/middleware/` | Security scanning as a standard middleware layer. |
| Error Handler | `/home/runner/workspace/agent-gateway/src/error-handler/` | Return appropriate error responses for blocked requests. |

## Error Handling

- **No exceptions:** The `scanRequest()` method never throws. It always returns a result object.
- **Invalid input:** Missing or undefined fields in the request object are handled gracefully. If `ip` is undefined, it defaults to `'unknown'`.
- **JSON serialization:** When scanning the request body, non-string bodies are serialized via `JSON.stringify()`. If serialization fails, the body is skipped.
- **Detection storage:** Detections are capped at 10,000 entries. Olest entries are dropped when the limit is exceeded.
- **Rate counter reset:** Request counters are reset every 60 seconds per IP. If a counter entry is older than 60 seconds, it is replaced.

## Scoring System

Each detected threat adds a configurable number of points to the cumulative score:

| Threat Type | Points | Level |
|-------------|--------|-------|
| Blocked IP | 100 | `critical` |
| Command injection | 70 | `critical` |
| SQL injection | 60 | `critical` |
| XSS | 50 | `high` |
| Path traversal | 40 | `high` |
| Blocked user agent | 40 | `high` |
| Rate exceeded | 30 | `medium` |
| URL too long | 20 | `medium` |
| Too many headers | 10 | `low` |

**Auto-blocking:** When the cumulative score reaches `autoBlockThreshold` (default: 80), the IP is automatically added to the blocked list. The IP's reputation score is set to the cumulative score (capped at 100).

**IP reputation accumulation:** Each subsequent scan adds to the IP's cumulative reputation score: `newScore = min(100, existingScore + currentScore)`. This means repeat offenders accumulate a worse reputation over time.

## Limitations and Best Practices

1. **Pattern-based detection:** All threat detection is based on regex pattern matching. Sophisticated attackers may use obfuscation or encoding to bypass patterns. Always use defense-in-depth with parameterized queries, output encoding, and CSP headers.
2. **No Unicode normalization:** The scanner does not normalize Unicode characters. Attackers may use Unicode homoglyphs to bypass pattern matching.
3. **In-memory state:** Blocked IPs, detection history, and IP reputation are stored in memory and lost on restart. For persistence, integrate with a database or external blocklist service.
4. **Single-instance only:** The scanner does not coordinate across multiple gateway instances. An IP blocked on one instance is not automatically blocked on others.
5. **Complement with sanitization:** Detection is not the same as neutralization. Use the Input Sanitizer (`/home/runner/workspace/agent-gateway/src/input-sanitizer/`) to actively sanitize input even when threats are not detected.
6. **Tune thresholds:** The default `autoBlockThreshold` of 80 may be too aggressive or too lenient for your use case. Monitor false positives and adjust accordingly.
7. **Rate limiting:** The built-in rate check (1000 req/min) is basic. Use the Rate Limit Engine for production-grade rate limiting.

## Related Documentation

- [Input Sanitizer](/home/runner/workspace/agent-gateway/src/input-sanitizer/README.md) -- Active input sanitization to complement threat detection.
- [Rate Limit Engine](/home/runner/workspace/agent-gateway/src/rate-limit-engine/README.md) -- Comprehensive multi-algorithm rate limiting.
- [Ratelimit](/home/runner/workspace/agent-gateway/src/ratelimit/README.md) -- Simpler rate limiter with throttler.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level security middleware.
- [Observability Engine](/home/runner/workspace/agent-gateway/src/observability-engine/README.md) -- Monitoring and alerting on security events.
- [Middleware](/home/runner/workspace/agent-gateway/src/middleware/README.md) -- Request/response middleware patterns.
