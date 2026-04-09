# Pipeline Engine

Enterprise data pipeline orchestration engine for the Agent Gateway. This module provides ETL (Extract, Transform, Load) pipeline orchestration with typed stages, batch processing, retry logic, error handling with continue-on-error support, backpressure management, and comprehensive run monitoring.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [PipelineStageType](#pipelinestagetype)
    - [PipelineStage](#pipelinestage)
    - [PipelineContext](#pipelinecontext)
    - [PipelineRun](#pipelinerun)
    - [PipelineDefinition](#pipelinedefinition)
  - [PipelineEngine Class](#pipelineengine-class)
  - [register()](#register)
  - [execute()](#execute)
  - [getRun()](#getrun)
  - [listRuns()](#listruns)
  - [cancelRun()](#cancelrun)
  - [getStats()](#getstats)
  - [Factory Function](#factory-function)
- [Stage Types](#stage-types)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Pipeline Engine vs. Pipeline](#pipeline-engine-vs-pipeline)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Batch Processing and Backpressure](#batch-processing-and-backpressure)
- [Performance Characteristics](#performance-characteristics)
- [Related Documentation](#related-documentation)

## Overview

The `PipelineEngine` provides a structured way to define and execute multi-stage data processing pipelines. Each pipeline consists of ordered stages, each with a type, a processing function, and optional configuration for batching, retries, and error handling.

**Key features:**
- **Typed stages:** Eight predefined stage types (`extract`, `transform`, `filter`, `validate`, `enrich`, `aggregate`, `load`, `custom`) for semantic clarity.
- **Batch processing:** Stages can process data in configurable batches for improved throughput.
- **Retry with backoff:** Each stage can be configured with max retries and a retry delay.
- **Continue on error:** Stages can be configured to log and continue past errors rather than failing the entire pipeline.
- **Run tracking:** Every execution is tracked with per-stage input/output counts, durations, and error details.
- **Cancellation:** Running pipelines can be cancelled.
- **Event-driven:** Emitted events for pipeline and stage lifecycle transitions.

### Pipeline Execution Flow

```
register(pipelineDef) ──▶ execute(pipelineId, input)
  ├── Stage 1 (extract):   input ──▶ processed ──▶
  ├── Stage 2 (transform): processed ──▶ processed ──▶
  ├── Stage 3 (filter):    processed ──▶ filtered ──▶
  ├── Stage 4 (load):      filtered ──▶ output
  └── PipelineRun result with per-stage stats
```

## File Structure

```
/home/runner/workspace/agent-gateway/src/pipeline-engine/
  index.ts          # PipelineEngine class, all interfaces
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { PipelineEngine, createPipelineEngine } from '../pipeline-engine/index.js';
// or with the full absolute path:
// import { PipelineEngine, createPipelineEngine } from '/home/runner/workspace/agent-gateway/src/pipeline-engine/index.js';
```

## API Reference

### Types and Interfaces

#### PipelineStageType

```typescript
export type PipelineStageType =
  | 'extract'    // Data ingestion / fetching
  | 'transform'  // Data transformation
  | 'filter'     // Data filtering
  | 'validate'   // Data validation
  | 'enrich'     // Data enrichment (adding fields from external sources)
  | 'aggregate'  // Data aggregation / grouping
  | 'load'       // Data output / storage
  | 'custom';    // Custom processing
```

#### PipelineStage

A single stage in a pipeline.

```typescript
export interface PipelineStage {
  id: string;
  name: string;
  type: PipelineStageType;
  description?: string;
  /** Process function: processes one item at a time */
  process: (data: any, context: PipelineContext) => Promise<any>;
  /** Batch processing function */
  processBatch?: (data: any[], context: PipelineContext) => Promise<any[]>;
  /** Batch size threshold */
  batchSize?: number;
  /** Batch timeout in ms */
  batchTimeout?: number;
  /** Max retries on failure */
  maxRetries?: number;
  /** Retry delay in ms */
  retryDelay?: number;
  /** Whether to continue on error */
  continueOnError?: boolean;
  /** Error handler */
  onError?: (error: Error, data: any, context: PipelineContext) => void;
  /** Stage dependencies (stage IDs this stage depends on) */
  dependsOn?: string[];
}
```

#### PipelineContext

Context passed to each stage during execution.

```typescript
export interface PipelineContext {
  pipelineId: string;
  runId: string;
  stageId?: string;
  metadata: Record<string, any>;
  startTime: number;
  recordCount: number;
  errorCount: number;
}
```

#### PipelineRun

Tracks the execution of a pipeline.

```typescript
export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  stages: Array<{
    stageId: string;
    name: string;
    status: string;
    inputCount: number;
    outputCount: number;
    durationMs?: number;
    error?: string;
  }>;
  totalInput: number;
  totalOutput: number;
  totalErrors: number;
  startTime: number;
  endTime?: number;
  metadata: Record<string, any>;
}
```

#### PipelineDefinition

The definition of a reusable pipeline.

```typescript
export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  /** Max concurrent stage executions */
  maxConcurrency?: number;
  /** Global error handler */
  onError?: (error: Error, stage: PipelineStage, context: PipelineContext) => void;
  /** Completion callback */
  onComplete?: (run: PipelineRun) => void;
}
```

### PipelineEngine Class

Extends `EventEmitter` for pipeline lifecycle events.

```typescript
export class PipelineEngine extends EventEmitter {
  register(pipeline: PipelineDefinition): void;
  async execute(pipelineId: string, input: any[], metadata?: Record<string, any>): Promise<PipelineRun>;
  getRun(runId: string): PipelineRun | undefined;
  listRuns(pipelineId?: string, status?: PipelineRun['status'], limit?: number): PipelineRun[];
  cancelRun(runId: string): boolean;
  getStats(): {
    totalPipelines: number;
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    avgDurationMs: number;
  };
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `pipeline:registered` | `PipelineDefinition` | A pipeline was registered |
| `pipeline:started` | `PipelineRun` | A pipeline execution started |
| `pipeline:completed` | `PipelineRun` | A pipeline execution completed |
| `pipeline:failed` | `PipelineRun` | A pipeline execution failed |
| `pipeline:cancelled` | `PipelineRun` | A pipeline execution was cancelled |
| `stage:started` | `{ run, stage, inputCount }` | A stage started |
| `stage:completed` | `{ run, stage, inputCount, outputCount, duration }` | A stage completed |
| `stage:failed` | `{ run, stage, error }` | A stage failed |

### register()

Registers a pipeline definition.

**Signature:**
```typescript
register(pipeline: PipelineDefinition): void
```

**Parameters:**
- `pipeline: PipelineDefinition` -- The pipeline with its stages and configuration.

### execute()

Executes a registered pipeline.

**Signature:**
```typescript
async execute(pipelineId: string, input: any[], metadata?: Record<string, any>): Promise<PipelineRun>
```

**Parameters:**
- `pipelineId: string` -- The ID of the registered pipeline.
- `input: any[]` -- The input data array to process through the pipeline.
- `metadata` (optional) -- Arbitrary metadata attached to the run.

**Returns:** `Promise<PipelineRun>` with full execution details.

**Behavior:**
1. Creates a `PipelineRun` with `pending` status.
2. Iterates through stages in order.
3. For each stage, processes all input items (or batches).
4. Tracks input/output counts, duration, and errors per stage.
5. If a stage fails and `continueOnError` is false, the entire pipeline fails.
6. On completion, calls the `onComplete` callback if defined.

### getRun()

Retrieves a specific pipeline run by ID.

**Signature:**
```typescript
getRun(runId: string): PipelineRun | undefined
```

### listRuns()

Lists pipeline runs with optional filters.

**Signature:**
```typescript
listRuns(pipelineId?: string, status?: PipelineRun['status'], limit?: number): PipelineRun[]
```

**Parameters:**
- `pipelineId` (optional) -- Filter by pipeline ID.
- `status` (optional) -- Filter by run status.
- `limit` (default: 100) -- Maximum results to return.

### cancelRun()

Cancels a running pipeline execution.

**Signature:**
```typescript
cancelRun(runId: string): boolean
```

**Returns:** `true` if the run was found and was running (and thus cancelled), `false` otherwise.

### getStats()

Returns aggregate pipeline statistics.

**Signature:**
```typescript
getStats(): {
  totalPipelines: number;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  avgDurationMs: number;
}
```

### Factory Function

```typescript
export function createPipelineEngine(): PipelineEngine
```

## Stage Types

| Type | Purpose | Typical Use |
|------|---------|-------------|
| `extract` | Data ingestion | Fetching data from APIs, databases, files |
| `transform` | Data transformation | Field mapping, type coercion, formatting |
| `filter` | Data filtering | Removing invalid, duplicate, or unwanted records |
| `validate` | Data validation | Schema validation, business rule checks |
| `enrich` | Data enrichment | Adding fields from external sources (lookups, API calls) |
| `aggregate` | Data aggregation | Grouping, summarizing, computing totals |
| `load` | Data output | Writing to databases, APIs, files |
| `custom` | Custom processing | Any processing not fitting the above categories |

## Configuration Options

The `PipelineEngine` itself has no constructor configuration. Configuration is done per-pipeline and per-stage:

| Option | Location | Default | Description |
|--------|----------|---------|-------------|
| `maxRetries` | `PipelineStage` | 0 | Max retry attempts per stage |
| `retryDelay` | `PipelineStage` | `2^attempt * 1000ms` | Delay between retries |
| `continueOnError` | `PipelineStage` | `false` | Whether to continue past stage errors |
| `batchSize` | `PipelineStage` | 100 | Items per batch when `processBatch` is defined |
| `batchTimeout` | `PipelineStage` | Not set | Timeout for batch processing |
| `maxConcurrency` | `PipelineDefinition` | Not set | Max concurrent stage executions |
| `maxRuns` | Internal | 10,000 | Max stored run records (oldest are pruned) |

## Usage Examples

### ETL Pipeline: Import Users from CSV

```typescript
import { createPipelineEngine } from '/home/runner/workspace/agent-gateway/src/pipeline-engine/index.js';

const engine = createPipelineEngine();

engine.register({
  id: 'user-import',
  name: 'User Import Pipeline',
  description: 'Import users from external data source with validation and enrichment',
  stages: [
    {
      id: 'extract',
      name: 'Extract from API',
      type: 'extract',
      process: async (record) => record, // Pass through; data already loaded
      batchSize: 500,
    },
    {
      id: 'validate',
      name: 'Validate Schema',
      type: 'validate',
      process: async (record) => {
        if (!record.email || !record.email.includes('@')) {
          throw new Error('Invalid email');
        }
        if (!record.name || record.name.length < 2) {
          throw new Error('Name too short');
        }
        return record;
      },
      maxRetries: 0,
      continueOnError: true,
    },
    {
      id: 'enrich',
      name: 'Enrich with Geo Data',
      type: 'enrich',
      process: async (record) => {
        // Lookup geo data based on address
        record.geo = await geoService.lookup(record.address);
        return record;
      },
      maxRetries: 3,
      retryDelay: 2000,
      continueOnError: true,
    },
    {
      id: 'transform',
      name: 'Transform Fields',
      type: 'transform',
      process: async (record) => ({
        id: record.id,
        fullName: record.name,
        email: record.email.toLowerCase(),
        city: record.geo?.city || 'Unknown',
        importedAt: new Date().toISOString(),
      }),
    },
    {
      id: 'load',
      name: 'Save to Database',
      type: 'load',
      process: async (record) => db.users.upsert(record),
      batchSize: 100,
      maxRetries: 3,
      onError: (err, data) => console.error('Failed to save user:', data.id, err.message),
    },
  ],
  onComplete: (run) => {
    console.log(`Imported ${run.totalOutput} of ${run.totalInput} users in ${run.endTime! - run.startTime}ms`);
  },
});

// Execute the pipeline
const run = await engine.execute('user-import', rawData, { source: 'partner-api' });
console.log(`Status: ${run.status}, Output: ${run.totalOutput}, Errors: ${run.totalErrors}`);
```

### Monitoring Pipeline Runs

```typescript
// Get recent runs
const runs = engine.listRuns(undefined, undefined, 10);
for (const run of runs) {
  console.log(`Run ${run.id}: ${run.status} - ${run.totalInput} in -> ${run.totalOutput} out`);
}

// Get a specific run
const specificRun = engine.getRun('run-abc123');
for (const stage of specificRun!.stages) {
  console.log(`  Stage ${stage.name}: ${stage.inputCount} in -> ${stage.outputCount} out (${stage.durationMs}ms)`);
}

// Get stats
const stats = engine.getStats();
console.log(`Pipelines: ${stats.totalPipelines}, Runs: ${stats.totalRuns}, Avg duration: ${stats.avgDurationMs}ms`);
```

### Canceling a Long-Running Pipeline

```typescript
const runPromise = engine.execute('large-dataset-import', millionRecords);

// After 30 seconds, check if it's still running and potentially cancel
setTimeout(() => {
  const run = engine.getRun(runPromise.id);
  if (run?.status === 'running') {
    engine.cancelRun(run.id);
    console.log('Pipeline cancelled due to timeout');
  }
}, 30000);
```

## Pipeline Engine vs. Pipeline

| Aspect | Pipeline Engine (this module) | Pipeline (`src/pipeline/`) |
|--------|-------------------------------|---------------------------|
| Location | `/home/runner/workspace/agent-gateway/src/pipeline-engine/` | `/home/runner/workspace/agent-gateway/src/pipeline/` (does not exist) |
| Existence | Yes | **Does not exist** in the codebase |

**Note:** The `src/pipeline/` directory does not exist in the codebase. The `PipelineEngine` at `/home/runner/workspace/agent-gateway/src/pipeline-engine/` is the sole pipeline implementation. A related but distinct concept is the **Middleware Pipeline** at `/home/runner/workspace/agent-gateway/src/middleware-pipeline/`, which handles HTTP request/response middleware chaining rather than data ETL pipelines.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Data Transformer | `/home/runner/workspace/agent-gateway/src/data-transformer/` | Use DataTransformer as a `transform` stage's processing function. |
| Connection Manager | `/home/runner/workspace/agent-gateway/src/connection-manager/` | Use connection pools in `extract` and `load` stages. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Cache enriched or computed data in `enrich` stages. |
| Observability Engine | `/home/runner/workspace/agent-gateway/src/observability-engine/` | Track pipeline stage durations as histogram metrics. |
| Task Scheduler | `/home/runner/workspace/agent-gateway/src/task-scheduler/` | Schedule periodic pipeline executions. |

## Error Handling

- **Stage failure without continueOnError:** If a stage throws and `continueOnError` is `false` (default), the pipeline immediately fails. The `onError` callback (global or stage-level) is invoked. The `PipelineRun` status is set to `failed`.
- **Stage failure with continueOnError:** If `continueOnError` is `true`, the error is logged, the stage is marked `failed`, and the pipeline continues with the next stage using whatever data passed through.
- **Retry logic:** Each stage retries up to `maxRetries` times with exponential backoff (`retryDelay * 2^attempt` or default `2^attempt * 1000ms`).
- **Batch fallback:** If `processBatch` is defined and the batch processing fails, the engine falls back to processing items individually.
- **Null filtering:** Items that resolve to `null` or `undefined` after a stage are automatically filtered out.
- **Run pruning:** When the number of stored runs exceeds 10,000, the oldest completed/failed runs are automatically pruned.

## Batch Processing and Backpressure

When a stage has `processBatch` defined and the input exceeds `batchSize`:

1. Data is split into batches of `batchSize` (default: 100).
2. Each batch is processed via `processBatch(batch, context)`.
3. If `processBatch` throws, the engine falls back to individual item processing via `process(item, context)`.
4. Errors in individual items during fallback are caught and counted (incrementing `context.errorCount`).

This provides a form of backpressure: large datasets are processed in manageable chunks rather than all at once, and the fallback to individual processing ensures partial progress even when batch operations fail.

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| Stage execution (individual) | O(n * stage_cost) | n = input items |
| Stage execution (batch) | O(n / batchSize * batch_cost) | More efficient for I/O-bound stages |
| Error handling | O(1) per error | Logged and tracked |
| Run storage | O(runs) | Pruned at 10,000 runs |
| Memory | O(input + output) per stage | Data flows through pipeline |

## Related Documentation

- [Data Transformer](/home/runner/workspace/agent-gateway/src/data-transformer/README.md) -- Fine-grained field transformations usable within pipeline stages.
- [Task Scheduler](/home/runner/workspace/agent-gateway/src/task-scheduler/README.md) -- Schedule periodic pipeline executions.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- HTTP middleware pipelines (different concern).
- [Connection Manager](/home/runner/workspace/agent-gateway/src/connection-manager/README.md) -- Connection management for extract/load stages.
- [Observability Engine](/home/runner/workspace/agent-gateway/src/observability-engine/README.md) -- Monitoring pipeline performance.
