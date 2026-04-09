# Workflow Engine

> **State machine-based workflow orchestration for the Agent Gateway**

The `WorkflowEngine` module provides a powerful, event-driven state machine for defining and executing complex multi-step workflows. It supports action steps, conditional branching, parallel execution, delays, loops, and sub-workflow composition. This module is part of the Agent Gateway project and is used to orchestrate complex message processing pipelines, agent task sequences, and automated operational workflows.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Step Types](#step-types)
- [Workflow Lifecycle](#workflow-lifecycle)
- [Usage Examples](#usage-examples)
- [Events](#events)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Timeout Management](#timeout-management)
- [Performance Considerations](#performance-considerations)
- [Testing](#testing)
- [Integration Points](#integration-points)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Workflow Engine (`/home/runner/workspace/agent-gateway/src/workflow/index.ts`) implements a directed graph-based execution model where each node represents a step and edges define the control flow between steps. Workflows are defined declaratively using `WorkflowDefinition` objects and executed asynchronously through the `WorkflowEngine` class.

Key capabilities:

- **Declarative definitions**: Define workflows as JSON-compatible structures
- **Six step types**: action, condition, parallel, delay, loop, sub-workflow
- **Event-driven**: Full EventEmitter integration for observability
- **Retry support**: Per-step configurable retries with backoff
- **Timeout management**: Both per-step and workflow-level timeouts
- **Execution control**: Start, cancel, pause, and resume workflows
- **Context propagation**: Shared `WorkflowContext` passed between all steps

---

## Architecture

```
WorkflowDefinition
       │
       ▼
┌──────────────────┐
│  WorkflowEngine  │◄── EventEmitter
│                  │
│  definitions:Map │──► WorkflowExecution
│  executions:Map  │──► WorkflowContext
│                  │
│  start() ──────┐ │
│  cancel() ─────┤ │
│  pause() ──────┤ │
│  resume() ─────┤ │
│  getStats() ───┘ │
└──────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│           Step Executor              │
│  ┌─────────┐  ┌──────────┐          │
│  │ action  │  │condition │  ┌─────┐ │
│  │ delay   │  │ parallel │  │loop │ │
│  │sub-work │  │          │  │     │ │
│  └─────────┘  └──────────┘  └─────┘ │
└──────────────────────────────────────┘
```

---

## Core Concepts

### WorkflowDefinition

A `WorkflowDefinition` describes the structure and behavior of a workflow:

```typescript
interface WorkflowDefinition {
  id: string;           // Unique identifier for the workflow
  name: string;         // Human-readable name
  description?: string; // Optional description
  version: string;      // Semantic version string
  steps: WorkflowStep[]; // Array of step definitions
  startStep: string;    // ID of the first step to execute
  timeoutMs?: number;   // Optional overall timeout (default: 5 min)
  continueOnError?: boolean; // Continue execution after step failures
}
```

### WorkflowExecution

A `WorkflowExecution` represents a single run of a workflow:

```typescript
interface WorkflowExecution {
  id: string;                    // Unique execution ID (wf-{uuid})
  workflowId: string;            // Reference to the workflow definition
  status: WorkflowStatus;        // Current execution status
  context: WorkflowContext;      // Shared context object
  currentStep?: string;          // Currently executing step ID
  stepStatuses: Record<string, StepStatus>; // Per-step status map
  startedAt: number;             // Unix timestamp
  completedAt?: number;          // Unix timestamp when finished
  error?: string;                // Error message if failed
  result?: any;                  // Final result object
}
```

### WorkflowContext

The context object is shared across all steps in an execution:

```typescript
interface WorkflowContext {
  [key: string]: any;           // Custom key-value store
  workflowId: string;           // Execution ID
  stepResults: Record<string, any>; // Results from completed steps
  metadata: Record<string, any>; // Arbitrary metadata
}
```

---

## API Reference

### `createWorkflowEngine(): WorkflowEngine`

Factory function to create a new workflow engine instance.

```typescript
import { createWorkflowEngine } from './workflow/index.js';

const engine = createWorkflowEngine();
```

### `WorkflowEngine.register(definition: WorkflowDefinition): void`

Registers a workflow definition. Must be called before starting executions.

```typescript
engine.register({
  id: 'order-processing',
  name: 'Order Processing Pipeline',
  version: '1.0.0',
  steps: [/* ... */],
  startStep: 'validate-order',
});
```

### `WorkflowEngine.start(workflowId: string, initialContext?: Record<string, any>): Promise<WorkflowExecution>`

Starts a new execution of the registered workflow. Returns immediately; execution proceeds asynchronously.

```typescript
const execution = await engine.start('order-processing', {
  orderId: 'ORD-123',
  items: [{ sku: 'ABC', qty: 2 }],
});
```

### `WorkflowEngine.cancel(executionId: string): boolean`

Cancels a running workflow. Returns `true` if successful.

```typescript
const cancelled = engine.cancel(execution.id);
```

### `WorkflowEngine.pause(executionId: string): boolean`

Pauses a running workflow. The workflow can be resumed later.

```typescript
engine.pause(execution.id);
```

### `WorkflowEngine.resume(executionId: string): Promise<void>`

Resumes a paused workflow from its current step.

```typescript
await engine.resume(execution.id);
```

### `WorkflowEngine.getExecution(executionId: string): WorkflowExecution | undefined`

Returns the current state of an execution.

```typescript
const status = engine.getExecution(execution.id);
console.log(status?.status); // 'completed', 'running', etc.
```

### `WorkflowEngine.listExecutions(workflowId?: string, status?: WorkflowStatus): WorkflowExecution[]`

Lists all executions, optionally filtered by workflow ID or status.

```typescript
const running = engine.listExecutions(undefined, 'running');
const allOrders = engine.listExecutions('order-processing');
```

### `WorkflowEngine.getStats(): { totalExecutions: number; byStatus: Record<string, number> }`

Returns aggregate statistics for all tracked executions.

```typescript
const stats = engine.getStats();
// { totalExecutions: 42, byStatus: { completed: 38, failed: 2, running: 2 } }
```

---

## Step Types

### Action Step

Executes a handler function with the workflow context.

```typescript
{
  id: 'send-notification',
  name: 'Send Notification',
  type: 'action',
  handler: async (ctx) => {
    await notifyUser(ctx.userId, ctx.message);
    return { sent: true };
  },
  onSuccess: 'next-step',
  onFailure: 'error-handler',
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 30000,
}
```

### Condition Step

Evaluates a boolean condition and branches execution.

```typescript
{
  id: 'check-premium',
  name: 'Check Premium User',
  type: 'condition',
  condition: async (ctx) => ctx.user.tier === 'premium',
  onSuccess: 'premium-flow',
  onFalse: 'standard-flow',
}
```

### Parallel Step

Executes multiple child steps concurrently.

```typescript
{
  id: 'parallel-tasks',
  name: 'Run Parallel Tasks',
  type: 'parallel',
  children: ['task-a', 'task-b', 'task-c'],
  onSuccess: 'merge-results',
}
```

### Delay Step

Pauses execution for a specified duration.

```typescript
{
  id: 'cooldown',
  name: 'Cooldown Period',
  type: 'delay',
  delayMs: 5000,
  onSuccess: 'resume-work',
}
```

### Loop Step

Repeatedly executes a handler while the loop condition is true.

```typescript
{
  id: 'poll-status',
  name: 'Poll Until Ready',
  type: 'loop',
  loopCondition: async (ctx) => ctx.status !== 'ready',
  handler: async (ctx) => {
    ctx.status = await checkStatus(ctx.jobId);
    return ctx.status;
  },
}
```

### Sub-Workflow Step

Invokes another registered workflow as a sub-process.

```typescript
{
  id: 'process-payment',
  name: 'Process Payment',
  type: 'sub-workflow',
  subWorkflowId: 'payment-processing',
  onSuccess: 'confirm-order',
  onFailure: 'payment-failed',
}
```

---

## Workflow Lifecycle

```
  register()      start()       execute()      complete/fail
       │             │             │                 │
       ▼             ▼             ▼                 ▼
  [Definition] ──► [Pending] ──► [Running] ──► [Completed/Failed]
                       │              │
                       │         pause()/resume()
                       │              │
                       │         cancel()
                       │              ▼
                       │         [Cancelled]
                       │
                  [Paused] ◄──── resume()
```

---

## Usage Examples

### Simple Linear Workflow

```typescript
import { createWorkflowEngine } from '/home/runner/workspace/agent-gateway/src/workflow/index.js';

const engine = createWorkflowEngine();

engine.register({
  id: 'email-pipeline',
  name: 'Email Processing',
  version: '1.0.0',
  steps: [
    {
      id: 'validate',
      name: 'Validate Email',
      type: 'action',
      handler: async (ctx) => {
        const isValid = ctx.email.includes('@');
        ctx.valid = isValid;
        return { isValid };
      },
      onSuccess: 'send',
      onFailure: 'error',
    },
    {
      id: 'send',
      name: 'Send Email',
      type: 'action',
      handler: async (ctx) => {
        await sendEmail(ctx.email, ctx.subject, ctx.body);
        return { sent: true };
      },
    },
    {
      id: 'error',
      name: 'Handle Error',
      type: 'action',
      handler: async (ctx) => {
        await logError('Invalid email', ctx.email);
        return { handled: true };
      },
    },
  ],
  startStep: 'validate',
});

const execution = await engine.start('email-pipeline', {
  email: 'user@example.com',
  subject: 'Welcome',
  body: 'Hello!',
});
```

### Conditional Branching

```typescript
engine.register({
  id: 'triage',
  name: 'Message Triage',
  version: '1.0.0',
  steps: [
    {
      id: 'classify',
      name: 'Classify Message',
      type: 'condition',
      condition: async (ctx) => ctx.message.includes('urgent'),
      onSuccess: 'escalate',
      onFalse: 'queue-normal',
    },
    {
      id: 'escalate',
      name: 'Escalate',
      type: 'action',
      handler: async (ctx) => await escalate(ctx.message),
    },
    {
      id: 'queue-normal',
      name: 'Queue Normally',
      type: 'action',
      handler: async (ctx) => await queue(ctx.message),
    },
  ],
  startStep: 'classify',
});
```

### Parallel Processing

```typescript
engine.register({
  id: 'parallel-fetch',
  name: 'Parallel API Calls',
  version: '1.0.0',
  steps: [
    {
      id: 'fetch-all',
      name: 'Fetch All APIs',
      type: 'parallel',
      children: ['fetch-users', 'fetch-posts', 'fetch-comments'],
    },
    {
      id: 'fetch-users',
      name: 'Fetch Users',
      type: 'action',
      handler: async (ctx) => ctx.users = await fetch('/users'),
    },
    {
      id: 'fetch-posts',
      name: 'Fetch Posts',
      type: 'action',
      handler: async (ctx) => ctx.posts = await fetch('/posts'),
    },
    {
      id: 'fetch-comments',
      name: 'Fetch Comments',
      type: 'action',
      handler: async (ctx) => ctx.comments = await fetch('/comments'),
    },
  ],
  startStep: 'fetch-all',
});
```

---

## Events

The `WorkflowEngine` extends `EventEmitter` and emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `workflow:started` | `WorkflowExecution` | A new execution has been created |
| `workflow:running` | `WorkflowExecution` | Execution has transitioned to running state |
| `workflow:completed` | `WorkflowExecution` | Execution completed successfully |
| `workflow:failed` | `WorkflowExecution` | Execution failed with an error |
| `workflow:cancelled` | `WorkflowExecution` | Execution was cancelled |
| `workflow:paused` | `WorkflowExecution` | Execution was paused |
| `workflow:resumed` | `WorkflowExecution` | A paused execution was resumed |
| `step:started` | `{ execution, step }` | A step has begun execution |
| `step:completed` | `{ execution, step, result }` | A step completed successfully |
| `step:failed` | `{ execution, step, error }` | A step failed (may still retry) |
| `step:retrying` | `{ execution, step, attempt }` | A step is being retried |

### Listening to Events

```typescript
engine.on('workflow:completed', (exec) => {
  console.log(`Workflow ${exec.workflowId} completed in ${exec.completedAt! - exec.startedAt}ms`);
});

engine.on('step:failed', ({ execution, step, error }) => {
  console.error(`Step ${step.id} failed: ${error}`);
});

engine.on('step:retrying', ({ execution, step, attempt }) => {
  console.log(`Retrying step ${step.id}, attempt ${attempt}`);
});
```

---

## Error Handling

### Step-Level Errors

When a step throws an error, the engine checks the `maxRetries` configuration:

1. If retries remain, the step status becomes `retrying` and the step is re-executed after `retryDelayMs`
2. If no retries remain, the step status becomes `failed`
3. If `continueOnError` is `true`, execution continues to `onFailure`
4. If `continueOnError` is `false` (default), the entire workflow fails

### Workflow-Level Errors

- **Timeout**: The entire workflow is terminated if `timeoutMs` is exceeded
- **Unhandled exceptions**: If `continueOnError` is `false`, any unrecoverable step failure stops the workflow
- **Sub-workflow failures**: If a sub-workflow fails, the parent step throws and follows normal error handling

---

## Retry Logic

Each step supports independent retry configuration:

```typescript
{
  id: 'flaky-api',
  name: 'Call External API',
  type: 'action',
  handler: async (ctx) => await callApi(ctx.endpoint),
  maxRetries: 3,        // Up to 3 retries (4 total attempts)
  retryDelayMs: 2000,   // 2 seconds between retries
  timeoutMs: 30000,     // 30 second timeout per attempt
  onFailure: 'fallback', // Where to go after all retries exhausted
}
```

The retry count is tracked in `execution.context.stepResults[step.id + '_retries']`.

---

## Timeout Management

### Workflow Timeout

The entire workflow has a configurable timeout (default: 5 minutes):

```typescript
{
  id: 'long-running',
  name: 'Long Running Process',
  version: '1.0.0',
  timeoutMs: 10 * 60 * 1000, // 10 minutes
  // ...
}
```

### Step Timeout

Individual steps can have their own timeouts:

```typescript
{
  id: 'slow-operation',
  type: 'action',
  handler: async (ctx) => await slowOp(ctx.data),
  timeoutMs: 5000, // This step times out after 5 seconds
}
```

---

## Performance Considerations

- **Execution cap**: The engine maintains a maximum of 10,000 executions in memory. Oldest completed/failed executions are evicted when this limit is reached
- **Async execution**: `start()` returns immediately; workflows run in the background
- **Parallel steps**: Use `parallel` steps to run independent operations concurrently
- **Infinite loop protection**: The engine caps iterations at `steps.length * 100` to prevent runaway loops
- **Sub-workflow polling**: Sub-workflow steps use `setInterval` polling (100ms) to check completion

---

## Testing

The workflow engine is tested in `/home/runner/workspace/agent-gateway/test/workflow.test.ts`. Tests cover:

- Registration and basic execution
- Conditional branching (true/false paths)
- Delay steps
- Cancellation
- Listing executions
- Statistics reporting

Run tests with:

```bash
cd /home/runner/workspace/agent-gateway
npm run test -- workflow.test.ts
```

---

## Integration Points

The Workflow Engine integrates with:

- **Agent Gateway**: Orchestrates multi-step message processing pipelines
- **Hooks System**: Workflow steps can trigger lifecycle hooks
- **Event Bus**: Emits events that can be consumed by other system components
- **Observability**: Logs registration, completion, and failure events via the infra logger
- **Plugin SDK**: Plugins can register and execute custom workflows

---

## Troubleshooting

### Workflow not found error

Ensure the workflow is registered before calling `start()`:

```typescript
engine.register(definition); // Must come first
await engine.start('my-workflow');
```

### Step never completes

- Check that `onSuccess` points to a valid step ID
- Verify the handler function resolves (does not hang)
- Check `timeoutMs` is sufficient for the operation

### Sub-workflow hangs

The sub-workflow uses polling. Ensure the sub-workflow actually completes (reaches `completed` or `failed` status). If the sub-workflow is cancelled or paused, the parent will hang indefinitely.

### Memory growth

The engine caps executions at 10,000. If you see memory issues, consider:
- Monitoring `getStats().totalExecutions`
- Reducing `maxExecutions` by modifying the engine (requires source change)
- Ensuring completed executions are properly evicted
