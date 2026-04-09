# Health Checker (`src/health-checker/`)

> **Deep dependency health monitoring with configurable checks, degradation thresholds, automatic recovery attempts, and event-driven architecture.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Type Definitions](#type-definitions)
5. [Class API](#class-api)
6. [Configuration Options](#configuration-options)
7. [Usage Examples](#usage-examples)
8. [Default System Checks](#default-system-checks)
9. [Recovery Mechanism](#recovery-mechanism)
10. [Event System](#event-system)
11. [Health Status Determination](#health-status-determination)
12. [Error Handling](#error-handling)
13. [Integration Points](#integration-points)
14. [Differences from ``](#differences-from-srchealth)
15. [Best Practices](#best-practices)
16. [Related Documentation](#related-documentation)

---

## Overview

The `health-checker/` module provides an **advanced, event-driven health monitoring system** for the Agent Gateway. It extends the basic health checking concept with several enterprise-grade features:

- **Event-driven architecture** -- Extends `EventEmitter`, emitting events for check failures, recoveries, and status changes
- **Consecutive failure tracking** -- Tracks how many times each check has failed in a row
- **Automatic recovery** -- After 3 consecutive failures, attempts to run a registered recovery function
- **Version tracking** -- Associates health status with the application version
- **Event loop lag detection** -- Monitors Node.js event loop responsiveness
- **Graceful degradation** -- Three-tier health status: `healthy`, `degraded`, `unhealthy`

This module is the primary health monitoring system for production deployments, providing:

- **Kubernetes liveness/readiness probes** -- HTTP endpoints returning health status
- **Auto-healing** -- Attempts to recover failing services automatically
- **Event stream** -- Real-time monitoring via EventEmitter hooks
- **Failure tracking** -- Distinguishes transient failures from persistent problems

---

## File Structure

```
health-checker/
└── index.ts          # HealthChecker class, factory, type definitions
```

The module is implemented in a single file (~180 lines) containing the `HealthChecker` class extending `EventEmitter`, with full type definitions and default system check registration.

---

## Architecture

```
                    register() calls
                          │
                          ▼
            ┌───────────────────────────┐
            │   Checks Map              │
            │   name -> HealthCheck     │
            │   + consecutiveFailures   │
            │   + recovery function     │
            └──────────┬────────────────┘
                       │
                 check() call
                       │
                       ▼
            ┌───────────────────────────┐
            │   Run each check          │
            │   with individual timeout │
            └───────────┬───────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        Healthy             Unhealthy
              │                   │
              ▼                   ▼
    ┌──────────────────┐  ┌──────────────────────┐
    │ Reset failure    │  │ Increment failures   │
    │ counter          │  │ Emit check:failed    │
    │ Emit recovered   │  │                      │
    │ if was failing   │  │ If failures >= 3:    │
    └────────┬─────────┘  │   Run recovery fn    │
             │            │   If recovery ok:    │
             │            │     Reset, emit      │
             │            │     check:recovered  │
             │            └──────────┬───────────┘
             │                       │
             └───────────┬───────────┘
                         ▼
            ┌───────────────────────────┐
            │   Aggregate results       │
            │   Emit status:changed     │
            └───────────┬───────────────┘
                        ▼
                HealthStatus object
```

---

## Type Definitions

### HealthCheck

```typescript
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  /** Whether this check is required for overall health (default: true) */
  required?: boolean;
  /** Timeout in ms (default: 5000) */
  timeout?: number;
  /** Recovery function to attempt fixing the issue */
  recovery?: () => Promise<boolean>;
}
```

### HealthStatus

```typescript
interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'healthy' | 'unhealthy' | 'timeout';
    duration: number;
    consecutiveFailures: number;
  }>;
  uptime: number;       // seconds since HealthChecker creation
  timestamp: number;    // epoch ms
  version?: string;     // Application version
}
```

---

## Class API

### `HealthChecker` Class

```typescript
class HealthChecker extends EventEmitter {
  constructor(version?: string)

  // Registration
  register(check: HealthCheck): void
  unregister(name: string): boolean

  // Execution
  check(): Promise<HealthStatus>

  // Status retrieval
  getLastStatus(): HealthStatus | undefined

  // Default checks
  registerDefaults(): void

  // Events
  on(event: 'check:failed', listener: (data: { name: string; failures: number }) => void): this
  on(event: 'check:recovered', listener: (data: { name: string; failures: number }) => void): this
  on(event: 'status:changed', listener: (status: HealthStatus) => void): this
}
```

### Factory Function

```typescript
function createHealthChecker(version?: string): HealthChecker
```

---

## Configuration Options

### Per-Check Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | `boolean` | `true` | If `false`, failure makes overall status `degraded` instead of `unhealthy` |
| `timeout` | `number` | `5000` | Timeout in milliseconds for this specific check |
| `recovery` | `() => Promise<boolean>` | `undefined` | Recovery function called after 3 consecutive failures; returns `true` if recovery succeeded |

### Constructor Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | `string` | `undefined` | Application version included in health status reports |

---

## Usage Examples

### Basic Setup

```typescript
import { createHealthChecker } from '../health-checker/index.js';

const healthChecker = createHealthChecker('1.2.3');

// Register a custom check with recovery
healthChecker.register({
  name: 'database',
  required: true,
  timeout: 3000,
  check: async () => {
    const { createClient } = await import('@libsql/client');
    const db = createClient({ url: process.env.DATABASE_URL });
    await db.execute('SELECT 1');
    return true;
  },
  recovery: async () => {
    try {
      // Attempt to reconnect
      await db.reconnect();
      return true;
    } catch {
      return false;
    }
  },
});

// Run all checks
const status = await healthChecker.check();
console.log(status);
// {
//   overall: 'healthy',
//   checks: {
//     database: { status: 'healthy', duration: 15, consecutiveFailures: 0 }
//   },
//   uptime: 3600.5,
//   timestamp: 1712678400000,
//   version: '1.2.3'
// }
```

### Event-Driven Monitoring

```typescript
const healthChecker = createHealthChecker();

// Listen for check failures
healthChecker.on('check:failed', ({ name, failures }) => {
  logger.warn({ check: name, consecutiveFailures: failures }, `Check failed: ${name}`);

  if (failures >= 5) {
    notifications.critical(
      `Persistent Health Check Failure`,
      `Check "${name}" has failed ${failures} times consecutively`,
    );
  }
});

// Listen for recoveries
healthChecker.on('check:recovered', ({ name, failures }) => {
  logger.info({ check: name, previousFailures: failures }, `Check recovered: ${name}`);
  notifications.info(
    `Service Recovered`,
    `Check "${name}" recovered after ${failures} failures`,
  );
});

// Listen for overall status changes
healthChecker.on('status:changed', (status) => {
  dashboard.pushEvent('health', {
    overall: status.overall,
    uptime: status.uptime,
    version: status.version,
  });
});
```

### Express Health Endpoints

```typescript
import express from 'express';
import { createHealthChecker } from '../health-checker/index.js';

const app = express();
const healthChecker = createHealthChecker(process.env.APP_VERSION);
healthChecker.registerDefaults();

// Detailed health endpoint
app.get('/health', async (req, res) => {
  const status = await healthChecker.check();
  const httpStatus = status.overall === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(status);
});

// Readiness probe (Kubernetes)
app.get('/ready', async (req, res) => {
  const status = await healthChecker.check();
  if (status.overall === 'healthy' || status.overall === 'degraded') {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

// Liveness probe
app.get('/live', (req, res) => {
  res.json({ alive: true });
});
```

### Periodic Monitoring

```typescript
const healthChecker = createHealthChecker();
healthChecker.registerDefaults();

// Run checks every 30 seconds
setInterval(async () => {
  await healthChecker.check();
}, 30_000);
```

### Check with Redis Recovery

```typescript
healthChecker.register({
  name: 'redis',
  required: false,
  timeout: 3000,
  check: async () => {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.ping();
    await redis.quit();
    return true;
  },
  recovery: async () => {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      return true;
    } catch {
      return false;
    }
  },
});
```

---

## Default System Checks

When `registerDefaults()` is called, the following system checks are registered:

| Check | Required | Timeout | What It Checks | Threshold |
|-------|----------|---------|----------------|-----------|
| `memory` | No | 1000ms | Heap memory usage | Less than 2GB |
| `event_loop` | No | 2000ms | Event loop responsiveness | Less than 100ms lag |
| `disk` | No | 2000ms | Available disk space | At least 0.5GB |
| `database` | No | 3000ms | Database connectivity via `@libsql/client` | `SELECT 1` succeeds |
| `redis` | No | 3000ms | Redis connectivity via `ioredis` | `ping` succeeds |

### Memory Check

```typescript
this.register({
  name: 'memory',
  required: false,
  timeout: 1000,
  check: async () => {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / (1024 * 1024);
    return heapUsedMB < 2048; // Less than 2GB
  },
});
```

### Event Loop Lag Check

This is unique to `health-checker/` (not in `health/`):

```typescript
this.register({
  name: 'event_loop',
  required: false,
  timeout: 2000,
  check: async () => {
    return new Promise<boolean>((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6;
        resolve(lag < 100); // Less than 100ms lag
      });
    });
  },
});
```

Measures how long it takes for `setImmediate` to fire. If the event loop is blocked, this will exceed 100ms.

### Disk Space Check

```typescript
this.register({
  name: 'disk',
  required: false,
  timeout: 2000,
  check: async () => {
    try {
      const { statfs } = await import('fs/promises');
      const stats = await statfs(process.cwd());
      const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
      return availableGB > 0.5;
    } catch {
      return true;
    }
  },
});
```

### Database Connectivity Check

```typescript
this.register({
  name: 'database',
  required: false,
  timeout: 3000,
  check: async () => {
    if (!process.env.DATABASE_URL) return true; // Not configured
    try {
      const { createClient } = await import('@libsql/client');
      const db = createClient({ url: process.env.DATABASE_URL });
      await db.execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
});
```

### Redis Connectivity Check

```typescript
this.register({
  name: 'redis',
  required: false,
  timeout: 3000,
  check: async () => {
    if (!process.env.REDIS_URL) return true;
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      await redis.ping();
      await redis.quit();
      return true;
    } catch {
      return false;
    }
  },
});
```

---

## Recovery Mechanism

The recovery system automatically attempts to fix failing checks:

```
Check fails (1st time)   --> Increment failure count
Check fails (2nd time)   --> Increment failure count
Check fails (3rd time)   --> Increment failure count
                            --> Run recovery function
                                --> If recovery succeeds: reset counter, mark healthy
                                --> If recovery fails: continue normally
Check fails (4th time)   --> Increment failure count
                            --> Run recovery function (again)
```

### Recovery Function Contract

- Returns `Promise<boolean>` -- `true` if recovery succeeded, `false` otherwise
- Called only when `consecutiveFailures >= 3`
- Called on every subsequent failure after the 3rd
- If recovery succeeds, the check is immediately marked as `healthy` and the failure counter resets to 0

### Recovery Events

When recovery succeeds, two events are emitted:
1. `check:recovered` with the previous failure count
2. The check result is updated to `healthy` in the status

---

## Event System

The `HealthChecker` extends `EventEmitter` and emits three events:

### `check:failed`

Emitted when a health check fails:

```typescript
healthChecker.on('check:failed', ({ name, failures }) => {
  console.log(`Check "${name}" failed (consecutive: ${failures})`);
});
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the failed check |
| `failures` | `number` | Consecutive failure count (after increment) |

### `check:recovered`

Emitted when a check recovers from a previous failure OR when recovery succeeds:

```typescript
healthChecker.on('check:recovered', ({ name, failures }) => {
  console.log(`Check "${name}" recovered after ${failures} failures`);
});
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the recovered check |
| `failures` | `number` | Number of consecutive failures before recovery |

### `status:changed`

Emitted after every `check()` call with the complete health status:

```typescript
healthChecker.on('status:changed', (status) => {
  console.log(`Overall health: ${status.overall}`);
});
```

---

## Health Status Determination

The overall status follows these rules:

```
if (any REQUIRED check fails)       => overall = 'unhealthy'
else if (any OPTIONAL check fails)  => overall = 'degraded'
else                                   => overall = 'healthy'
```

### Per-Check Status Values

| Value | Meaning |
|-------|---------|
| `healthy` | Check returned `true` |
| `unhealthy` | Check returned `false` or threw an error |
| `timeout` | (Note: In health-checker, timeout is treated the same as unhealthy -- the status is always `unhealthy`) |

---

## Error Handling

### Timeout Handling

Each check runs inside a `Promise.race` with a timeout:

```typescript
healthy = await Promise.race([
  check.check(),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Health check timeout')), timeout),
  ),
]);
```

Any rejection (timeout or other error) results in `healthy = false`.

### Recovery Error Handling

Recovery function errors are caught and logged:

```typescript
try {
  const recovered = await check.recovery();
  if (recovered) {
    // Reset counter, mark healthy
  }
} catch (err: any) {
  logger.error({ check: name, err }, `Recovery failed for: ${name}`);
}
```

### Logging

- Failed checks: `logger.warn({ check: name, failures, duration }, 'Health check failed: {name}')`
- Recovery success: `logger.info({ check: name }, 'Recovery successful for: {name}')`
- Recovery failure: `logger.error({ check: name, err }, 'Recovery failed for: {name}')`
- Status change: Logged via `status:changed` event handlers

---

## Integration Points

### With ``

See the "Differences" section below. Both modules provide similar functionality.

### With `src/infra/` (Logger)

All check outcomes and recovery attempts are logged:

```typescript
logger.warn({ check: name, failures: newFailures, duration }, `Health check failed: ${name}`);
logger.info({ check: name, failures }, `Health check recovered: ${name}`);
logger.info({ check: name }, `Recovery successful for: ${name}`);
logger.error({ check: name, err }, `Recovery failed for: ${name}`);
```

### With `src/notifications/`

```typescript
healthChecker.on('check:failed', ({ name, failures }) => {
  if (failures >= 3) {
    notifications.warning(
      `Health Check Failing: ${name}`,
      `${failures} consecutive failures`,
    );
  }
});

healthChecker.on('status:changed', (status) => {
  if (status.overall === 'unhealthy') {
    notifications.critical('System Unhealthy', JSON.stringify(status.checks));
  }
});
```

### With `src/graceful-shutdown/`

Prevent shutdown during unhealthy state:

```typescript
shutdownManager.onCleanup(async () => {
  const status = healthChecker.getLastStatus();
  if (status?.overall === 'unhealthy') {
    logger.warn('Shutting down while unhealthy', status.checks);
  }
});
```

### With `src/dashboard/`

```typescript
healthChecker.on('status:changed', (status) => {
  dashboard.pushEvent('health', {
    overall: status.overall,
    uptime: status.uptime,
    version: status.version,
    checks: Object.entries(status.checks).map(([name, data]) => ({
      name,
      ...data,
    })),
  });
});
```

---

## Differences from ``

| Feature | `health/` | `health-checker/` |
|---------|-----------|-------------------|
| **EventEmitter** | No | Yes |
| **Consecutive failure tracking** | No | Yes |
| **Recovery functions** | No | Yes (auto-triggered at 3 failures) |
| **Version tracking** | No | Yes |
| **Events** | None | `check:failed`, `check:recovered`, `status:changed` |
| **Event loop check** | No | Yes |
| **Memory threshold** | 1GB | 2GB |
| **Disk threshold** | 1GB | 0.5GB |
| **Default check timeouts** | 5000ms | 1000-3000ms (per check) |
| **Dependencies in defaults** | `registerDefaults(deps)` | `registerDefaults()` |
| **Factory function** | `createHealthChecker()` | `createHealthChecker(version?)` |

### When to Use Which

- **Use `health/`** for simple, synchronous health checks with dependency injection
- **Use `health-checker/`** for production monitoring with event-driven architecture, recovery, and failure tracking

---

## Best Practices

1. **Always register defaults** -- Call `registerDefaults()` to get baseline system health monitoring.

2. **Implement recovery functions for critical services** -- Database reconnection, cache invalidation, and service restarts are good recovery candidates.

3. **Listen to `check:failed` for alerting** -- Set up alerts at 3+ consecutive failures to catch problems before they affect users.

4. **Use the event loop check** -- The `event_loop` check is unique to this module and detects event loop blocking, which is critical for Node.js services.

5. **Set version at startup** -- Pass `process.env.APP_VERSION` or equivalent to the constructor for version-correlated health monitoring.

6. **Run checks on a schedule** -- Use `setInterval` to run checks periodically rather than on-demand for continuous monitoring.

7. **Use `getLastStatus()` for HTTP endpoints** -- Avoid re-running checks on every HTTP request; return the cached result instead.

8. **Recovery functions should be idempotent** -- Recovery may be called multiple times. Ensure it is safe to call repeatedly.

---

## Related Documentation

- [``](../health/README.md) -- Simpler health checker without recovery
- [`src/graceful-shutdown/`](../graceful-shutdown/README.md) -- Graceful shutdown orchestration
- [`src/notifications/`](../notifications/README.md) -- Notification system for health alerts
- [`src/dashboard/`](../dashboard/README.md) -- Real-time health status dashboard
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
