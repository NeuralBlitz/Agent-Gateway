# Cron Scheduler (`src/cron/`)

> **Persistent, distributed cron scheduling with execution tracking, retry logic, missed execution recovery, and concurrency control.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Cron Expression Syntax](#cron-expression-syntax)
6. [Usage Examples](#usage-examples)
7. [Job Execution Model](#job-execution-model)
8. [Retry Logic](#retry-logic)
9. [Concurrency Control](#concurrency-control)
10. [Error Handling](#error-handling)
11. [Integration Points](#integration-points)
12. [Best Practices](#best-practices)
13. [Related Documentation](#related-documentation)

---

## Overview

The `cron/` module provides an **enterprise-grade cron job scheduler** for the Agent Gateway. It supports scheduling recurring tasks with standard cron expressions, automatic retry on failure, execution history tracking, concurrency control, and missed-execution catch-up.

### Key Features

- **Standard cron expressions** -- 5-field format (minute, hour, dayOfMonth, month, dayOfWeek)
- **Execution tracking** -- full history with start/end times, status, and errors
- **Retry with exponential backoff** -- configurable max retries per job
- **Concurrency control** -- limit how many instances of a job can run simultaneously
- **Timeout enforcement** -- jobs are killed after a configurable duration
- **Catch-up scheduling** -- optionally run missed executions after downtime
- **Event-driven** -- emits events for job start, completion, and failure
- **Run on demand** -- trigger any job immediately outside of its schedule
- **Graceful shutdown** -- stop all scheduled jobs cleanly

### Common Use Cases in Agent Gateway

| Use Case | Schedule | Description |
|----------|----------|-------------|
| Health checks | `*/5 * * * *` | Check provider API health every 5 minutes |
| Log rotation | `0 0 * * *` | Rotate and archive logs at midnight |
| Cache warming | `*/15 * * * *` | Refresh cached data every 15 minutes |
| Metrics aggregation | `0 * * * *` | Aggregate hourly metrics |
| Token usage reports | `0 0 * * 1` | Weekly token usage report (Monday) |
| Session cleanup | `0 */6 * * *` | Clean up expired sessions every 6 hours |
| Config backup | `0 */4 * * *` | Backup config every 4 hours |

---

## File Structure

```
cron/
├── index.ts          # CronScheduler, CronParser, factory, type definitions
```

The module is self-contained in a single file (~230 lines) with the scheduler, a minimal cron expression parser, and all execution tracking logic.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       CronScheduler                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Job Registry                                          │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Job A    │  │ Job B    │  │ Job C    │            │  │
│  │  │ */5 * *  │  │ 0 0 * *  │  │ 0 * * *  │            │  │
│  │  │ enabled  │  │ disabled │  │ enabled  │            │  │
│  │  └────┬─────┘  └──────────┘  └────┬─────┘            │  │
│  └───────┼───────────────────────────┼───────────────────┘  │
│          │                           │                       │
│  ┌───────▼───────────────────────────▼───────────────────┐  │
│  │  Timer Map (setTimeout for next execution)            │  │
│  │                                                        │  │
│  │  Timer(A) --> 2.3min                                  │  │
│  │  Timer(C) --> 23.1min                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Running Map (jobId -> active execution count)        │  │
│  │                                                        │  │
│  │  Job A: 1 running (max: 1)                            │  │
│  │  Job C: 0 running (max: 3)                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Execution History (per job, max 100 entries)         │  │
│  │                                                        │  │
│  │  Job A: [exec1, exec2, exec3, ...]                    │  │
│  │  Job C: [exec1, exec2, ...]                           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Execution Flow

```
Register Job
    │
    ▼
Calculate next execution time
    │
    ▼
setTimeout(delay)
    │
    ▼
Timer fires ─────────────────────────────────┐
    │                                        │
    ▼                                        │
Check concurrency limit                       │
    │                                        │
    ├── Exceeded ──► Skip (log warning)      │
    │                                        │
    ▼                                        │
Create execution record                       │
    │                                        │
    ▼                                        │
Run handler with timeout                     │
    │                                        │
    ├── Success ──► Mark completed            │
    │                                        │
    └── Failure ──► Retry with backoff ──────┘
    │                                        │
    ▼                                        │
Store execution in history                   │
    │                                        │
    ▼                                        │
Schedule next execution ─────────────────────┘
```

---

## Class API

### Types

```typescript
type CronStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface CronJob {
  id: string;                    // Unique job ID (auto-generated if not provided)
  name: string;                  // Human-readable name
  schedule: string;              // Cron expression (5 fields)
  handler: () => Promise<void>;  // Async function to execute
  enabled: boolean;              // Whether the job is active
  maxConcurrency: number;        // Max concurrent executions (default: 1)
  timeoutMs: number;             // Execution timeout in ms (default: 300000 = 5 min)
  maxRetries: number;            // Max retries on failure (default: 0)
  catchUp: boolean;              // Whether to catch up missed executions (default: false)
  metadata?: Record<string, any>;// Arbitrary metadata
  executions: CronExecution[];   // Execution history
  createdAt: number;             // Registration timestamp
  lastExecutionAt?: number;      // Last execution timestamp
  nextExecutionAt?: number;      // Next scheduled execution timestamp
}

interface CronExecution {
  id: string;                    // Unique execution ID
  jobId: string;                 // Parent job ID
  scheduledAt: number;           // When execution was scheduled
  startedAt?: number;            // When execution started
  completedAt?: number;          // When execution completed
  status: CronStatus;            // Current status
  error?: string;                // Error message (if failed)
  retryCount: number;            // Number of retries performed
  durationMs?: number;           // Execution duration
}
```

### `CronScheduler` Class

```typescript
class CronScheduler extends EventEmitter {
  constructor()

  // Job management
  register(job: Omit<CronJob, 'id' | 'executions' | 'createdAt' | 'nextExecutionAt'>): CronJob
  unregister(jobId: string): boolean
  toggle(jobId: string, enabled: boolean): boolean

  // Execution
  async runNow(jobId: string): Promise<void>

  // Inspection
  getJobs(): CronJob[]
  getJob(jobId: string): CronJob | undefined
  getExecutions(jobId: string, limit?: number): CronExecution[]
  getStats(): {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    totalExecutions: number;
    failedExecutions: number;
  }

  // Lifecycle
  stop(): void

  // Events
  on(event: 'job:started', listener: (data: { job: CronJob; execution: CronExecution }) => void): this
  on(event: 'job:completed', listener: (data: { job: CronJob; execution: CronExecution }) => void): this
  on(event: 'job:failed', listener: (data: { job: CronJob; execution: CronExecution; error: Error }) => void): this
}
```

### Factory Function

```typescript
function createCronScheduler(): CronScheduler
```

---

## Cron Expression Syntax

The parser supports the standard **5-field cron expression**:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 both = Sunday)
│ │ │ │ │
* * * * *
```

### Supported Patterns

| Pattern | Meaning |
|---------|---------|
| `*` | Every unit |
| `5` | Specific value |
| `*/5` | Every 5 units |
| `1-5` | Range (1, 2, 3, 4, 5) |
| `1-10/2` | Range with step (1, 3, 5, 7, 9) |
| `1,3,5` | List (1, 3, 5) |

### Common Expressions

| Expression | Description |
|-----------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour, on the hour |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 1` | Every Monday at midnight |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `30 2 * * *` | Daily at 2:30 AM |
| `0 0 1 * *` | First of every month |

---

## Usage Examples

### Registering a Job

```typescript
import { createCronScheduler } from '../cron/index.js';

const scheduler = createCronScheduler();

// Health check every 5 minutes
scheduler.register({
  name: 'health-check',
  schedule: '*/5 * * * *',
  enabled: true,
  handler: async () => {
    const providers = await checkAllProviders();
    for (const provider of providers) {
      if (!provider.healthy) {
        logger.warn({ provider: provider.name }, 'Provider unhealthy');
        await sendAlert(`Provider ${provider.name} is down`);
      }
    }
  },
});
```

### With Retry and Timeout

```typescript
// Daily log rotation with retry
scheduler.register({
  name: 'log-rotation',
  schedule: '0 0 * * *',
  enabled: true,
  maxRetries: 3,
  timeoutMs: 60000, // 1 minute timeout
  handler: async () => {
    await rotateLogs();
    await compressOldLogs();
  },
});
```

### With Concurrency Control

```typescript
// Cache warming that can have multiple concurrent instances
scheduler.register({
  name: 'cache-warm',
  schedule: '*/15 * * * *',
  enabled: true,
  maxConcurrency: 3, // Allow up to 3 concurrent runs
  handler: async () => {
    await warmProviderCaches();
  },
});
```

### Enable/Disable Jobs

```typescript
// Disable a job
scheduler.toggle('health-check', false);

// Re-enable
scheduler.toggle('health-check', true);

// Remove a job entirely
scheduler.unregister('log-rotation');
```

### Run on Demand

```typescript
// Execute immediately outside of schedule
await scheduler.runNow('health-check');
```

### Inspect Jobs and History

```typescript
// Get all jobs
const jobs = scheduler.getJobs();
for (const job of jobs) {
  console.log(`${job.name}: next=${new Date(job.nextExecutionAt).toISOString()}`);
}

// Get execution history for a job
const executions = scheduler.getExecutions('health-check', 10);
for (const exec of executions) {
  console.log(`${exec.status} in ${exec.durationMs}ms at ${new Date(exec.startedAt).toISOString()}`);
}

// Get scheduler stats
const stats = scheduler.getStats();
console.log(`Jobs: ${stats.enabledJobs}/${stats.totalJobs}, Executions: ${stats.totalExecutions}, Failed: ${stats.failedExecutions}`);
```

### Event Listening

```typescript
scheduler.on('job:started', ({ job, execution }) => {
  logger.info({ job: job.name, executionId: execution.id }, `Job started: ${job.name}`);
});

scheduler.on('job:completed', ({ job, execution }) => {
  logger.info(
    { job: job.name, duration: execution.durationMs },
    `Job completed: ${job.name}`,
  );
});

scheduler.on('job:failed', ({ job, execution, error }) => {
  logger.error(
    { job: job.name, error: execution.error },
    `Job failed: ${job.name}`,
  );
});
```

---

## Job Execution Model

### Registration

When a job is registered:
1. Default values are applied for optional fields
2. A unique ID is generated if not provided (`cron-<uuid>`)
3. The next execution time is calculated
4. A `setTimeout` is scheduled

### Execution

Each execution follows this sequence:
1. **Concurrency check** -- if `runningCount >= maxConcurrency`, the execution is skipped
2. **Execution record created** -- with `scheduledAt` timestamp and `pending` status
3. **Handler called** -- wrapped in a `Promise.race` with the timeout
4. **On success** -- status set to `completed`, duration calculated
5. **On failure** -- retry logic is applied (see below)
6. **History stored** -- execution record added to job's history (max 100 per job)

### Catch-Up

If `catchUp` is `true` and the next scheduled time is already in the past (e.g., after server restart), the job runs immediately:

```typescript
if (delay <= 0) {
  if (job.catchUp) {
    this.executeJob(job);
  }
  this.scheduleNext(job); // Schedule the next occurrence
  return;
}
```

---

## Retry Logic

Failed jobs are retried with **exponential backoff**:

```typescript
// On failure
if (execution.retryCount < job.maxRetries) {
  execution.retryCount++;
  execution.status = 'pending';
  const retryDelay = Math.pow(2, execution.retryCount) * 1000;

  // Retry 1: 2^1 * 1000 = 2 seconds
  // Retry 2: 2^2 * 1000 = 4 seconds
  // Retry 3: 2^3 * 1000 = 8 seconds
  // Retry 4: 2^4 * 1000 = 16 seconds

  setTimeout(() => this.executeJob(job), retryDelay);
}
```

Retry behavior is configurable:
- `maxRetries: 0` (default) -- no retries, fail immediately
- `maxRetries: 3` -- up to 3 retries with 2s, 4s, 8s delays
- `maxRetries: 5` -- up to 5 retries with 2s, 4s, 8s, 16s, 32s delays

---

## Concurrency Control

The `maxConcurrency` setting controls how many instances of a job can run simultaneously:

```typescript
const runningCount = this.running.get(job.id) || 0;
if (runningCount >= job.maxConcurrency) {
  logger.warn({ jobId: job.id }, 'Cron job skipped -- max concurrency reached');
  return;
}
```

| maxConcurrency | Behavior |
|---------------|----------|
| `1` (default) | Only one instance at a time; overlapping executions are skipped |
| `N` | Up to N concurrent instances; additional executions are skipped |
| `Infinity` | No limit; every scheduled time triggers a new execution |

This is important for long-running jobs that might overlap with their next scheduled execution.

---

## Error Handling

### Job Timeout

Jobs are wrapped in `Promise.race` with a timeout. If the handler doesn't complete within `timeoutMs`:

```typescript
await Promise.race([
  job.handler(),
  new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error(`Job timeout after ${job.timeoutMs}ms`)), job.timeoutMs),
  ),
]);
```

The timeout error is treated as a normal failure -- retry logic applies if configured.

### Scheduler Errors

Errors in cron expression parsing are caught and logged:

```typescript
try {
  const nextTime = CronParser.next(job.schedule, new Date());
  // ...
} catch (err: any) {
  logger.error({ jobId: job.id, err }, `Failed to schedule cron job: ${job.name}`);
}
```

### Invalid Expressions

Invalid cron expressions throw during scheduling:

```typescript
CronParser.next('invalid');
// Error: "Invalid cron expression: invalid"

CronParser.next('* * * *');  // Only 4 fields
// Error: "Invalid cron expression: * * * *"
```

### Graceful Shutdown

```typescript
// Stop all scheduled jobs
scheduler.stop();

// This clears all setTimeout timers
// Jobs that are currently running are NOT interrupted
```

---

## Integration Points

### With `src/dashboard/`

Expose scheduler state to the real-time dashboard:

```typescript
dashboard.registerProvider('metrics', async () => {
  const stats = scheduler.getStats();
  return {
    ...stats,
    jobs: scheduler.getJobs().map(j => ({
      name: j.name,
      schedule: j.schedule,
      enabled: j.enabled,
      nextExecution: j.nextExecutionAt,
      lastStatus: j.executions[j.executions.length - 1]?.status,
    })),
  };
}, 5000); // Broadcast every 5 seconds
```

### With `src/feature-flags/`

Conditionally enable jobs based on feature flags:

```typescript
const flagManager = createFeatureFlagManager();

scheduler.register({
  name: 'experimental-cache',
  schedule: '*/10 * * * *',
  enabled: flagManager.evaluate('experimental-cache', {}),
  handler: async () => {
    // Experimental feature
  },
});
```

### With `src/connection-pool/`

Use connection pools within scheduled jobs:

```typescript
scheduler.register({
  name: 'db-cleanup',
  schedule: '0 */6 * * *',
  enabled: true,
  handler: async () => {
    await dbPool.use(async (client) => {
      await client.query('DELETE FROM expired_sessions WHERE expires_at < NOW()');
    });
  },
});
```

### With `src/infra/` (Logger)

All job lifecycle events are logged with structured metadata:

```
INFO  { jobId: "abc-123", name: "health-check", schedule: "*/5 * * * *" } Cron job registered
WARN  { jobId: "abc-123", name: "health-check" } Cron job skipped -- max concurrency reached
DEBUG { jobId: "abc-123", name: "health-check", duration: 234 } Cron job completed: health-check
ERROR { jobId: "abc-123", name: "health-check", err: "..." } Cron job failed: health-check
WARN  { jobId: "abc-123", retry: 1, maxRetries: 3, delay: 2000 } Cron job failed, retrying: health-check
```

---

## Best Practices

1. **Use descriptive job names** -- the name appears in logs, dashboard, and error messages.

2. **Set appropriate timeouts** -- the default 5-minute timeout is generous. For quick jobs (health checks), set it to 10-30 seconds. For long-running jobs (data exports), increase it.

3. **Enable retry for non-idempotent jobs with caution** -- if a job performs side effects (sending emails, writing data), ensure retries don't cause duplicate actions.

4. **Use catchUp for critical jobs** -- if a job must not miss any executions (e.g., data aggregation), set `catchUp: true`.

5. **Monitor failed executions** -- check `getStats().failedExecutions` regularly and set up alerts for non-zero values.

6. **Keep execution history manageable** -- the default max of 100 entries per job is reasonable. Increase only if you need longer audit trails.

7. **Don't block the handler** -- the handler should be async and non-blocking. Avoid `setTimeout` or long-running sync operations inside the handler.

8. **Test cron expressions** -- verify your cron expression produces the expected schedule before deploying to production.

---

## Related Documentation

- [`src/dashboard/`](../dashboard/README.md) -- Monitor scheduled jobs in real-time
- [`src/feature-flags/`](../feature-flags/README.md) -- Toggle job behavior via feature flags
- [`src/connection-pool/`](../connection-pool/README.md) -- Use pooled connections in jobs
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [crontab.guru](https://crontab.guru/) -- Interactive cron expression editor
