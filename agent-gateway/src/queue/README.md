# Queue Module

## Overview

The Queue module provides an enterprise-grade, in-memory message queue system for the Agent Gateway. It supports topic-based publish/subscribe messaging with consumer groups, message acknowledgment, priority ordering, visibility timeouts, dead letter handling, and comprehensive queue statistics.

The `MessageQueue` class extends Node.js `EventEmitter` and operates as a persistent, ordered message queue. It uses a polling-based processor that continuously cycles through topics, delivering messages to registered handlers with configurable retry semantics and dead letter queue (DLQ) support.

## File Structure

```
src/queue/
  index.ts          # Message queue implementation (MessageQueue, QueueMessage, factory)
```

The module is a single-file implementation. It imports the shared `logger` from `../infra/index.js` for structured logging of queue lifecycle events.

## Class and Function API

### Interfaces

#### `QueueMessage<T>`

Represents a single message in the queue.

```typescript
interface QueueMessage<T = any> {
  id: string;
  topic: string;
  payload: T;
  priority: number;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  acknowledged: boolean;
  headers?: Record<string, string>;
}
```

| Field           | Type                      | Description                                          |
|-----------------|---------------------------|------------------------------------------------------|
| `id`            | `string`                  | Unique message ID (`<timestamp>-<random>`)           |
| `topic`         | `string`                  | Topic this message belongs to                        |
| `payload`       | `T`                       | Generic payload data                                 |
| `priority`      | `number`                  | Priority (lower number = higher priority)            |
| `createdAt`     | `number`                  | Unix timestamp of message creation                   |
| `attempts`      | `number`                  | Number of delivery attempts                          |
| `maxAttempts`   | `number`                  | Maximum delivery attempts before moving to DLQ       |
| `acknowledged`  | `boolean`                 | Whether the message was successfully acknowledged    |
| `headers`       | `Record<string, string>`  | Optional metadata headers                            |

#### `QueueConfig`

Configuration for the message queue.

```typescript
interface QueueConfig {
  maxMessagesPerTopic?: number;
  maxAttempts?: number;
  visibilityTimeoutMs?: number;
  pollIntervalMs?: number;
}
```

| Field                 | Type      | Description                                      | Default  |
|-----------------------|-----------|--------------------------------------------------|----------|
| `maxMessagesPerTopic` | `number`  | Maximum messages kept in memory per topic        | `100000` |
| `maxAttempts`         | `number`  | Default max delivery attempts per message        | `3`      |
| `visibilityTimeoutMs` | `number`  | Visibility timeout for in-flight messages (ms)   | `30000`  |
| `pollIntervalMs`      | `number`  | Polling interval for the queue processor (ms)    | `100`    |

#### `MessageHandler<T>`

```typescript
type MessageHandler<T = any> = (message: QueueMessage<T>) => Promise<void>;
```

#### `TopicQueue` (Internal)

Internal structure holding per-topic queue state.

```typescript
interface TopicQueue {
  messages: QueueMessage[];
  inFlight: Map<string, { message: QueueMessage; timer: ReturnType<typeof setTimeout> }>;
  deadLetters: QueueMessage[];
}
```

### `MessageQueue` Class

The main message queue class. Extends `EventEmitter`.

#### Constructor

```typescript
constructor(config?: QueueConfig)
```

#### Methods

**`publish<T>(topic: string, payload: T, options?: { priority?: number; headers?: Record<string, string>; maxAttempts?: number }): Promise<QueueMessage<T>>`**

Publishes a message to a topic. Messages are inserted in priority order (lower number = higher priority). If the topic does not exist, it is created automatically. Starts the queue processor if not already running. Returns the created message object.

If the topic exceeds `maxMessagesPerTopic`, the lowest-priority message is dropped.

**`subscribe<T>(topic: string, handler: MessageHandler<T>, groupId?: string): void`**

Registers a message handler for a topic. Multiple handlers can be registered for the same topic with different `groupId` values for consumer group semantics. The default group is `'default'`.

**`start(): void`**

Starts the queue processor. Begins polling all topics at the configured interval. Safe to call multiple times (no-op if already running).

**`stop(): void`**

Stops the queue processor. Clears the polling interval. Messages already in flight remain in flight.

**`acknowledge(topic: string, messageId: string): boolean`**

Manually acknowledges an in-flight message, clearing its visibility timeout timer. Returns `false` if the topic or in-flight message does not exist.

**`getStats(): { topics: number; pending: number; inFlight: number; deadLetters: number; byTopic: Array<{ topic: string; pending: number; inFlight: number; deadLetters: number }> }`**

Returns aggregate and per-topic queue statistics.

**`getDeadLetters(topic: string): QueueMessage[]`**

Returns all dead letter messages for a given topic.

**`retryDeadLetter(topic: string, messageId: string): boolean`**

Moves a dead letter message back to the pending queue with `attempts` reset to 0. Returns `false` if the topic or dead letter is not found.

**`purge(topic: string): number`**

Removes all messages (pending, in-flight, and dead letters) for a topic. Clears all in-flight timers. Returns the total number of messages removed.

### Factory Function

```typescript
function createMessageQueue(config?: QueueConfig): MessageQueue
```

Convenience factory that returns a new `MessageQueue` instance.

## Configuration Options

| Option                  | Type      | Description                                    | Default   |
|-------------------------|-----------|------------------------------------------------|-----------|
| `maxMessagesPerTopic`   | `number`  | Memory cap per topic                           | 100,000   |
| `maxAttempts`           | `number`  | Default max delivery attempts                  | 3         |
| `visibilityTimeoutMs`   | `number`  | How long a message stays "invisible" while processing | 30,000 |
| `pollIntervalMs`        | `number`  | How often to check for messages                | 100       |

## Usage Examples

### Basic Publish and Subscribe

```typescript
import { createMessageQueue } from './src/queue/index.js';

const queue = createMessageQueue();

// Subscribe to a topic
queue.subscribe('orders', async (message) => {
  console.log('Processing order:', message.payload.orderId);
  await processOrder(message.payload);
  // Message is auto-acknowledged on successful handler completion
});

// Publish messages
await queue.publish('orders', { orderId: 'ORD-001', amount: 49.99 });
await queue.publish('orders', { orderId: 'ORD-002', amount: 120.00 }, {
  priority: 1, // Higher priority (lower number = higher priority)
});
```

### Priority Messaging

```typescript
// Low priority (default)
await queue.publish('notifications', { type: 'promo', user: 'alice' });

// High priority
await queue.publish('notifications', { type: 'alert', user: 'bob' }, {
  priority: -10,
});

// Critical priority
await queue.publish('notifications', { type: 'security', user: 'charlie' }, {
  priority: -100,
});
```

### Consumer Groups

```typescript
// Multiple consumer groups receive the same messages
queue.subscribe('events', async (msg) => {
  await analyticsService.track(msg.payload);
}, 'analytics-group');

queue.subscribe('events', async (msg) => {
  await notificationService.send(msg.payload);
}, 'notification-group');
```

### Dead Letter Handling

```typescript
const queue = createMessageQueue({ maxAttempts: 3 });

// Listen for dead letter events
queue.on('message:dead', (message) => {
  console.error('Message moved to DLQ:', message.id, message.payload);
  // Could forward to a monitoring system or alerting service
});

// Later: inspect and retry dead letters
const deadLetters = queue.getDeadLetters('orders');
for (const dl of deadLetters) {
  if (dl.payload.orderId === 'ORD-001') {
    queue.retryDeadLetter('orders', dl.id);
  }
}
```

### Queue Monitoring

```typescript
const queue = createMessageQueue();

queue.on('message:published', (msg) => {
  console.log(`Published to ${msg.topic}: ${msg.id}`);
});

queue.on('message:acknowledged', (msg) => {
  console.log(`Acknowledged: ${msg.id}`);
});

// Periodic stats check
setInterval(() => {
  const stats = queue.getStats();
  console.log(`Topics: ${stats.topics}, Pending: ${stats.pending}, In-flight: ${stats.inFlight}, DLQ: ${stats.deadLetters}`);
}, 60000);
```

### Manual Acknowledgment

```typescript
const queue = createMessageQueue();

queue.subscribe('tasks', async (message) => {
  const result = await performTask(message.payload);
  if (result.success) {
    queue.acknowledge('tasks', message.id);
  } else {
    // Let it fail so it retries or goes to DLQ
    throw new Error(result.error);
  }
});
```

### Purge a Topic

```typescript
const removedCount = queue.purge('deprecated-topic');
console.log(`Purged ${removedCount} messages from deprecated-topic`);
```

## Integration Points

### With Pipeline Module

Pipeline output can be published directly to the message queue for async downstream processing:

```typescript
const pipeline = createDataPipeline({ name: 'etl', stages: [/* ... */] });
const queue = createMessageQueue();

pipeline.on('pipeline:complete', async (info) => {
  const results = await pipeline.execute(input);
  for (const result of results) {
    await queue.publish('processed-data', result);
  }
});
```

### With Service Registry

Queue consumers can be registered as service instances in the `ServiceRegistry` (`src/service-registry/`):

```typescript
const registry = createServiceRegistry();
registry.register({
  name: 'order-processor',
  healthCheck: { endpoint: '/health', intervalMs: 10000, timeoutMs: 3000 },
});

queue.subscribe('orders', async (msg) => {
  // Process order...
});
```

### With Tenant Manager

Queue topics can be tenant-scoped using the `TenantManager` (`src/tenant-manager/`):

```typescript
const queue = createMessageQueue();
const tenants = createTenantManager();

queue.subscribe('tenant-events', async (msg) => {
  const tenant = tenants.get(msg.headers?.tenantId);
  if (tenant && tenant.status === 'active') {
    await processTenantEvent(msg.payload);
  }
});
```

### With Rate Limiter

Rate limiting can be applied within queue handlers:

```typescript
queue.subscribe('api-calls', async (msg) => {
  const check = await rateLimiter.check(msg.payload.userId);
  if (!check.allowed) {
    throw new Error('Rate limited'); // Will retry or go to DLQ
  }
  await makeApiCall(msg.payload);
});
```

## Error Handling

### Message Delivery Errors

When a handler throws an error:

1. The error is logged with message ID, topic, and error details.
2. If `attempts < maxAttempts`, the message is re-queued (sorted by priority) for redelivery.
3. If `attempts >= maxAttempts`, the message is moved to the dead letter queue and a `message:dead` event is emitted.

### Visibility Timeout

When a message is picked up for processing, it becomes "in-flight" and is invisible to subsequent polling cycles. If the handler does not complete within `visibilityTimeoutMs`, the message is automatically re-queued. This prevents message loss if a consumer crashes mid-processing.

### Queue Overflow

When a topic reaches `maxMessagesPerTopic`, the lowest-priority message (last in the sorted array) is dropped. This is a back-pressure mechanism to prevent unbounded memory growth.

### Processor Lifecycle

- The queue processor starts automatically on the first `publish()` call.
- It can be stopped with `stop()` and restarted with `start()`.
- Calling `stop()` does not affect in-flight messages -- they remain tracked until their visibility timeout expires or they are acknowledged.

## Related Documentation

- **Pipeline Module**: `/home/runner/workspace/agent-gateway/README.md`
- **Service Registry**: `/home/runner/workspace/agent-gateway/src/service-registry/README.md`
- **Tenant Manager**: `/home/runner/workspace/agent-gateway/src/tenant-manager/README.md`
- **Rate Limiter**: `/home/runner/workspace/agent-gateway/src/rate-limiter/README.md`
