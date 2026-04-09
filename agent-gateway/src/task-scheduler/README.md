# Task Scheduler

Enterprise cron-like job scheduling system for the Agent Gateway. This module provides scheduled job execution with cron expression parsing, retry logic with exponential backoff, execution timeout handling, concurrency control, missed job recovery (catch-up), per-node execution tracking, and comprehensive execution history.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [JobStatus](#jobstatus)
    - [ScheduledJob](#scheduledjob)
    - [JobExecution](#jobexecution)
    - [JobExecutionContext](#jobexecutioncontext)
  - [TaskScheduler Class](#taskscheduler-class)
  - [register()](#register)
  - [unregister()](#unregister)
  - [toggle()](#toggle)
  - [runNow()](#runnow)
  - [getJobs()](#getjobs)
  - [getJob()](#getjob)
  - [getExecutionHistory()](#getexecutionhistory)
  - [getStats()](#getstats)
  - [stop()](#stop)
  - [Factory Functions](#factory-functions)
- [Cron Expression Syntax](#cron-expression-syntax)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Task Scheduler vs. Cron](#task-scheduler-vs-cron)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Execution Model](#execution-model)
- [Distributed Execution Considerations](#distributed-execution-considerations)
- [Related Documentation](#related-documentation)

## Overview

The `TaskScheduler` provides a robust in-process job scheduling system inspired by cron, designed for Node.js applications that need to run periodic tasks without external schedulers.

**Key features:**
- **Cron expression parsing:** Full support for standard 5-field cron expressions (minute, hour, day of month, month, day of week).
- **Retry with exponential backoff:** Failed jobs retry with increasing delays (`2^attempt * 1000ms`).
- **Execution timeouts:** Each job has a configurable timeout; handlers that exceed it are cancelled.
- **Concurrency control:** Limit concurrent executions of the same job.
- **Catch-up mode:** If a job misses its scheduled time (e.g., during downtime), it can be executed immediately on restart.
- **Per-node tracking:** Each scheduler instance has a unique node ID for multi-instance deployments.
- **Execution history:** Per-job history of recent executions with status, duration, and error details.
- **Event-driven:** Events for job registration, start, completion, failure, and toggling.

### Scheduling Flow

```
register(job) ──▶ parseCron(schedule) ──▶ setTimeout for next run
    └── executeJob() ──▶ runWithRetries() ──▶ handler(ctx) with timeout
         └── scheduleNext() ──▶ setTimeout for subsequent run
```

## File Structure

```
/home/runner/workspace/agent-gateway/src/task-scheduler/
  index.ts          # TaskScheduler class, all interfaces, cron parser
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { TaskScheduler, createTaskScheduler } from '../task-scheduler/index.js';
// or with the full absolute path:
// import { TaskScheduler, createTaskScheduler } from '/home/runner/workspace/agent-gateway/src/task-scheduler/index.js';
```

## API Reference

### Types and Interfaces

#### JobStatus

```typescript
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';
```

#### ScheduledJob

A registered scheduled job.

```typescript
export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  /** Cron expression (minute hour dayOfMonth month dayOfWeek) */
  schedule: string;
  /** Job handler function */
  handler: (context: JobExecutionContext) => Promise<void>;
  /** Whether the job is enabled */
  enabled: boolean;
  /** Max concurrent executions */
  maxConcurrency: number;
  /** Execution timeout in ms */
  timeoutMs: number;
  /** Max retries on failure */
  maxRetries: number;
  /** Whether to catch up missed executions */
  catchUp: boolean;
  /** Lock key for distributed execution */
  lockKey?: string;
  /** Tags for organization */
  tags?: string[];
  /** Metadata */
  metadata?: Record<string, any>;
  /** Created at timestamp */
  createdAt: number;
  /** Last execution timestamp */
  lastExecutionAt?: number;
  /** Next scheduled execution timestamp */
  nextExecutionAt?: number;
  /** Execution history */
  executionHistory: JobExecution[];
}
```

#### JobExecution

A single execution record.

```typescript
export interface JobExecution {
  id: string;
  jobId: string;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  status: JobStatus;
  error?: string;
  attempt: number;
  maxAttempts: number;
  durationMs?: number;
  nodeId?: string;
}
```

#### JobExecutionContext

Context passed to the job handler during execution.

```typescript
export interface JobExecutionContext {
  jobId: string;
  executionId: string;
  scheduledAt: number;
  attempt: number;
  metadata: Record<string, any>;
}
```

### TaskScheduler Class

Extends `EventEmitter` for job lifecycle events.

```typescript
export class TaskScheduler {
  constructor(nodeId?: string, maxHistoryPerJob?: number);

  register(job: Omit<ScheduledJob, 'id' | 'createdAt' | 'nextExecutionAt' | 'executionHistory'>): ScheduledJob;
  unregister(jobId: string): boolean;
  toggle(jobId: string, enabled: boolean): boolean;
  async runNow(jobId: string): Promise<void>;
  getJobs(): ScheduledJob[];
  getJob(jobId: string): ScheduledJob | undefined;
  getExecutionHistory(jobId: string, limit?: number): JobExecution[];
  getStats(): {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    totalExecutions: number;
    failedExecutions: number;
  };
  stop(): void;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `job:registered` | `ScheduledJob` | A job was registered |
| `job:unregistered` | `{ jobId }` | A job was unregistered |
| `job:toggled` | `{ jobId, enabled }` | A job was enabled or disabled |
| `job:started` | `{ job, execution }` | A job execution started |
| `job:completed` | `{ job, execution }` | A job execution completed |
| `job:failed` | `{ job, execution, error }` | A job execution failed |
| `scheduler:stopped` | -- | All scheduled jobs were stopped |

### register()

Registers a scheduled job.

**Signature:**
```typescript
register(job: Omit<ScheduledJob, 'id' | 'createdAt' | 'nextExecutionAt' | 'executionHistory'>): ScheduledJob
```

**Parameters:**
- `job` -- The job configuration. Required fields: `name`, `schedule`, `handler`, `enabled`. All other fields have sensible defaults.

**Defaults applied:**
| Field | Default |
|-------|---------|
| `id` | Auto-generated `job-<uuid>` |
| `maxConcurrency` | 1 |
| `timeoutMs` | 300,000 (5 minutes) |
| `maxRetries` | 0 |
| `catchUp` | false |
| `executionHistory` | `[]` |
| `createdAt` | Current timestamp |

### unregister()

Removes a scheduled job and cancels any pending timer.

**Signature:**
```typescript
unregister(jobId: string): boolean
```

### toggle()

Enables or disables a job.

**Signature:**
```typescript
toggle(jobId: string, enabled: boolean): boolean
```

**Behavior:**
- When enabling: schedules the next execution.
- When disabling: clears the pending timer.

### runNow()

Executes a job immediately, outside its scheduled time.

**Signature:**
```typescript
async runNow(jobId: string): Promise<void>
```

### getJobs()

Returns all registered jobs.

**Signature:**
```typescript
getJobs(): ScheduledJob[]
```

### getJob()

Returns a specific job by ID.

**Signature:**
```typescript
getJob(jobId: string): ScheduledJob | undefined
```

### getExecutionHistory()

Returns recent execution history for a job.

**Signature:**
```typescript
getExecutionHistory(jobId: string, limit?: number): JobExecution[]
```

**Parameters:**
- `limit` (default: 10) -- Number of recent executions to return.

### getStats()

Returns scheduler statistics.

**Signature:**
```typescript
getStats(): {
  totalJobs: number;
  enabledJobs: number;
  runningJobs: number;
  totalExecutions: number;
  failedExecutions: number;
}
```

### stop()

Stops all scheduled jobs by clearing all timers.

**Signature:**
```typescript
stop(): void
```

### Factory Functions

```typescript
export function createTaskScheduler(nodeId?: string, maxHistoryPerJob?: number): TaskScheduler
```

## Cron Expression Syntax

The scheduler uses standard 5-field cron expressions:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * *
```

**Supported patterns:**

| Pattern | Meaning |
|---------|---------|
| `*` | Any value |
| `5` | Specific value |
| `*/5` | Every 5 units |
| `1-5` | Range (inclusive) |
| `1,3,5` | List of values |
| `1-10/2` | Every 2 units starting from 1 |

**Common examples:**

| Expression | Schedule |
|------------|----------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour on the hour |
| `0 0 * * *` | Daily at midnight |
| `0 12 * * *` | Daily at noon |
| `0 0 * * 1` | Every Monday at midnight |
| `0 0 1 * *` | First day of every month |
| `30 2 * * *` | Daily at 2:30 AM |
| `0 0 * * 1-5` | Every weekday at midnight |

## Configuration Options

| Option | Constructor Param | Default | Description |
|--------|------------------|---------|-------------|
| `nodeId` | `nodeId` | `node-<8-char-uuid>` | Unique identifier for this scheduler instance |
| `maxHistoryPerJob` | `maxHistoryPerJob` | 100 | Maximum execution history entries kept per job |

Per-job configuration options:

| Option | Default | Description |
|--------|---------|-------------|
| `maxConcurrency` | 1 | Max concurrent executions of this job |
| `timeoutMs` | 300,000 (5 min) | Handler execution timeout |
| `maxRetries` | 0 | Retry attempts on failure |
| `catchUp` | false | Run missed executions on restart |
| `lockKey` | undefined | Distributed lock key (future use) |
| `tags` | undefined | Organizational tags |

## Usage Examples

### Basic Scheduled Jobs

```typescript
import { createTaskScheduler } from '/home/runner/workspace/agent-gateway/src/task-scheduler/index.js';

const scheduler = createTaskScheduler('gateway-node-1');

// Cleanup expired sessions every 5 minutes
scheduler.register({
  name: 'session-cleanup',
  schedule: '*/5 * * * *',
  enabled: true,
  handler: async (ctx) => {
    await db.sessions.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`[${ctx.executionId}] Cleaned up expired sessions`);
  },
});

// Daily report generation at 2:00 AM
scheduler.register({
  name: 'daily-report',
  description: 'Generate and email daily summary report',
  schedule: '0 2 * * *',
  enabled: true,
  maxRetries: 3,
  timeoutMs: 600000, // 10 minutes
  handler: async (ctx) => {
    const report = await analytics.generateDailyReport(new Date());
    await emailService.send({
      to: 'team@example.com',
      subject: `Daily Report - ${new Date().toISOString().slice(0, 10)}`,
      body: report,
    });
  },
  tags: ['reports', 'daily'],
});

// Health check every 30 seconds
scheduler.register({
  name: 'health-check',
  schedule: '*/1 * * * *', // Every minute (minimum resolution)
  enabled: true,
  handler: async () => {
    const status = await checkAllServices();
    if (!status.healthy) {
      await alerting.notify('Service health check failed', status);
    }
  },
  maxRetries: 2,
});
```

### Admin Control

```typescript
// List all jobs
const jobs = scheduler.getJobs();
for (const job of jobs) {
  console.log(`${job.name}: ${job.schedule} (enabled: ${job.enabled})`);
}

// Disable a job
scheduler.toggle('job-abc123', false);

// Re-enable
scheduler.toggle('job-abc123', true);

// Run a job immediately
await scheduler.runNow('daily-report');

// Get execution history
const history = scheduler.getExecutionHistory('daily-report', 5);
for (const exec of history) {
  console.log(`${exec.status} - ${exec.durationMs}ms - attempt ${exec.attempt}/${exec.maxAttempts}`);
}

// Get stats
const stats = scheduler.getStats();
console.log(`Jobs: ${stats.totalJobs}, Executions: ${stats.totalExecutions}, Failures: ${stats.failedExecutions}`);

// Stop all jobs
scheduler.stop();
```

### Monitoring Events

```typescript
scheduler.on('job:started', ({ job, execution }) => {
  console.log(`Job "${job.name}" started (attempt ${execution.attempt}/${execution.maxAttempts})`);
});

scheduler.on('job:completed', ({ job, execution }) => {
  console.log(`Job "${job.name}" completed in ${execution.durationMs}ms`);
});

scheduler.on('job:failed', ({ job, execution, error }) => {
  console.error(`Job "${job.name}" failed on attempt ${execution.attempt}: ${execution.error}`);
});
```

## Task Scheduler vs. Cron

Two scheduling modules exist with overlapping but distinct functionality:

| Aspect | Task Scheduler (this module) | Cron (`src/cron/`) |
|--------|------------------------------|---------------------|
| Location | `/home/runner/workspace/agent-gateway/src/task-scheduler/` | `/home/runner/workspace/agent-gateway/src/cron/` |
| Core class | `TaskScheduler` | `CronScheduler` |
| Cron parsing | Inline in `parseCron()` and `matchField()` | Separate `CronParser` class with `next()` static method |
| Context to handler | `JobExecutionContext` with `jobId`, `executionId`, `scheduledAt`, `attempt`, `metadata` | No context -- handler is `() => Promise<void>` |
| Node tracking | Yes (`nodeId` per scheduler instance, recorded per execution) | No node tracking |
| Execution ID | Yes (`exec-<uuid>`) | Yes (`exec-<uuid>`) |
| Tags | Yes (organizational tags per job) | No tags |
| Lock key | Yes (`lockKey` field for future distributed locking) | No lock key |
| Event: `job:unregistered` | Yes | No |
| Event: `job:toggled` | Yes | No |
| History field name | `executionHistory` | `executions` |
| Retry tracking | `attempt` and `maxAttempts` on `JobExecution` | `retryCount` on `CronExecution` |
| Best for | Production job scheduling with full observability | Simpler cron scheduling with shared parser |

Both modules share nearly identical cron parsing logic (same `matchField()` algorithm, same 525,960-minute search window). The `CronScheduler` at `/home/runner/workspace/agent-gateway/src/cron/` exposes a `CronParser.next()` static method that can be reused independently, while `TaskScheduler` has the parsing logic inlined. Choose `TaskScheduler` for richer metadata, node tracking, and tags; choose `CronScheduler` for a simpler API with a reusable standalone parser.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Pipeline Engine | `/home/runner/workspace/agent-gateway/src/pipeline-engine/` | Schedule periodic pipeline executions. |
| Connection Manager | `/home/runner/workspace/agent-gateway/src/connection-manager/` | Schedule connection pool health checks and cleanup. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Schedule cache warming or periodic invalidation. |
| Observability Engine | `/home/runner/workspace/agent-gateway/src/observability-engine/` | Track job execution durations and failure rates as metrics. |
| Backup | `/home/runner/workspace/agent-gateway/src/backup/` | Schedule periodic database backups. |

## Error Handling

- **Handler exceptions:** If the handler throws, the error message is recorded in the execution record. If retries remain, the job is rescheduled with exponential backoff (`2^attempt * 1000ms`).
- **Timeout:** If the handler exceeds `timeoutMs`, a `"Job timeout after Xms"` error is thrown and treated as a failure.
- **Max concurrency:** If a job is already running at its `maxConcurrency` limit, the scheduled execution is skipped with a warning logged.
- **Invalid cron:** If the cron expression cannot be parsed, an error is logged and the job is not scheduled.
- **Catch-up mode:** If `catchUp` is true and the scheduled time has already passed when the scheduler starts or the job is re-enabled, the job is executed immediately.
- **History overflow:** Execution history is trimmed to `maxHistoryPerJob` entries (default: 100), keeping the most recent entries.

## Execution Model

Each job execution follows this sequence:

1. **Scheduling:** `setTimeout` is set for the next cron-matched time.
2. **Concurrency check:** If the job is already running at `maxConcurrency`, skip.
3. **Execution record:** A `JobExecution` is created with status `pending`.
4. **Handler invocation:** The handler is called with a `JobExecutionContext`.
5. **Timeout race:** `Promise.race` with a timeout promise ensures the handler doesn't run indefinitely.
6. **Completion or failure:** The execution record is updated with status, duration, and error if any.
7. **Retry:** If failed and retries remain, reschedule with backoff.
8. **History storage:** The execution is appended to the job's history (trimmed if over limit).
9. **Next scheduling:** `scheduleNext()` computes the next execution time and sets a new timer.

## Distributed Execution Considerations

The `TaskScheduler` is an **in-process** scheduler. In a multi-instance deployment:

- Each instance runs its own copy of all jobs (no coordination by default).
- The `lockKey` field is reserved for future distributed locking but is not currently implemented.
- For distributed execution, integrate with a distributed lock service (e.g., Redis-based locks) in the job handler:

```typescript
scheduler.register({
  name: 'single-instance-job',
  schedule: '0 * * * *',
  handler: async (ctx) => {
    const acquired = await distributedLock.acquire(ctx.jobId, 60000);
    if (!acquired) return; // Another instance is running this
    try {
      // ... do work
    } finally {
      await distributedLock.release(ctx.jobId);
    }
  },
});
```

## Related Documentation

- [Cron](/home/runner/workspace/agent-gateway/src/cron/README.md) -- Simpler cron scheduler with reusable CronParser.
- [Pipeline Engine](/home/runner/workspace/agent-gateway/src/pipeline-engine/README.md) -- ETL pipelines that can be scheduled.
- [Connection Manager](/home/runner/workspace/agent-gateway/src/connection-manager/README.md) -- Connection management for job handlers.
- [Cache Manager](/home/runner/workspace/agent-gateway/src/cache-manager/README.md) -- Cache warming via scheduled jobs.
- [Observability Engine](/home/runner/workspace/agent-gateway/src/observability-engine/README.md) -- Monitoring job execution metrics.
