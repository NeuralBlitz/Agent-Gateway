# EventBus (`src/eventbus/`)

> **Event pub/sub system — decoupled communication between gateway components with 24 event types.**

---

## Overview

The `eventbus/` module implements a publish/subscribe event system for Agent Gateway. It allows components to emit events without knowing who will consume them, enabling loose coupling between modules. The EventBus supports prioritized handlers, event history, and a dead letter queue for failed handlers.

With 24 defined event types, the EventBus covers the entire lifecycle of the gateway from startup to message processing to error handling.

---

## File Structure

```
eventbus/
└── index.ts    # EventBus implementation
```

---

## Event Types

The EventBus defines 24 event types:

### Lifecycle Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `gateway:start` | `{ config }` | Gateway starts |
| `gateway:stop` | — | Gateway stops |
| `server:start` | `{ host, port }` | HTTP server starts |
| `server:stop` | — | HTTP server stops |

### Session Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `session:created` | `{ session }` | New session created |
| `session:deleted` | `{ sessionId }` | Session removed |
| `session:saved` | `{ sessionId }` | Session persisted |
| `session:expired` | `{ sessionId }` | Session TTL expired |

### Message Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `message:received` | `{ message, channel }` | Message arrives from channel |
| `message:processed` | `{ message, response }` | Agent response ready |
| `message:error` | `{ message, error }` | Error during processing |
| `message:dropped` | `{ message, reason }` | Message dropped (rate limit, filter) |

### Channel Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `channel:registered` | `{ id, channel }` | Channel added to gateway |
| `channel:unregistered` | `{ id }` | Channel removed |
| `channel:error` | `{ channel, error }` | Channel error |

### Provider Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `provider:registered` | `{ id, provider }` | Provider added to gateway |
| `provider:error` | `{ provider, error }` | Provider API error |

### Tool Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `tool:executed` | `{ name, args, duration }` | Tool execution completed |
| `tool:error` | `{ name, args, error }` | Tool execution failed |

### Plugin Events

| Event | Payload | Fired When |
|-------|---------|-----------|
| `plugin:loaded` | `{ name, version }` | Plugin initialized |
| `plugin:error` | `{ name, error }` | Plugin error |
| `plugin:unloaded` | `{ name }` | Plugin removed |

---

## The `EventBus` Class

### Inheritance

```typescript
class EventBus extends EventEmitter
```

Built on Node.js `EventEmitter` with additional features.

### Core Methods

#### `publish(event: EventType, payload: unknown)`

Publishes an event to all registered handlers:

```typescript
eventBus.publish('message:received', {
  message: channelMessage,
  channel: 'telegram',
});
```

#### `subscribe(event: EventType, handler: EventHandler, priority?: number)`

Subscribes to an event with optional priority:

```typescript
eventBus.subscribe('message:received', async (payload) => {
  console.log(`New message from ${payload.message.from.id}`);
}, 100); // Priority (lower = earlier)
```

#### `unsubscribe(event: EventType, handler: EventHandler)`

Removes a subscription:

```typescript
eventBus.unsubscribe('message:received', myHandler);
```

#### `once(event: EventType, handler: EventHandler)`

Subscribe to an event only once:

```typescript
eventBus.once('gateway:start', () => {
  console.log('Gateway is now running!');
});
```

---

## Priority-Based Execution

Handlers are sorted by priority within each event type. Lower priority values execute first:

```
Event: message:received
  Priority -100: System monitoring handler
  Priority    0: Default logging handler
  Priority  100: Analytics tracking handler
  Priority  200: User notification handler
```

```typescript
// Handler execution
const handlers = this.handlers.get(event) || [];
const sorted = handlers.sort((a, b) => a.priority - b.priority);
for (const handler of sorted) {
  await handler.fn(payload);
}
```

---

## Event History

The EventBus maintains a history of recent events for debugging:

```typescript
class EventBus {
  private history: Array<{ event: string; payload: unknown; timestamp: number }> = [];
  private maxHistory = 1000;

  private recordEvent(event: string, payload: unknown): void {
    this.history.push({ event, payload, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(limit?: number): EventRecord[] {
    return this.history.slice(-limit || this.history.length);
  }
}
```

Query event history via the API:
```bash
curl http://localhost:3000/api/events?limit=50
```

---

## Dead Letter Queue

When a handler fails, the error is caught and the event is added to a dead letter queue:

```typescript
interface DeadLetterEntry {
  event: string;
  payload: unknown;
  handler: string;  // Handler identifier
  error: Error;
  timestamp: number;
  retryCount: number;
}
```

Dead letter entries can be:
- **Retried**: `deadLetterQueue.retry(index)`
- **Inspected**: `deadLetterQueue.list()`
- **Cleared**: `deadLetterQueue.clear()`

This ensures that one handler's failure doesn't prevent other handlers from running.

---

## Global Singleton

The EventBus is exposed as a global singleton:

```typescript
let eventBus: EventBus;

function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = new EventBus();
  }
  return eventBus;
}

export { getEventBus };
```

All modules share the same EventBus instance, ensuring consistent event delivery.

---

## Usage Examples

### Logging All Events

```typescript
const bus = getEventBus();

// Log every event at debug level
for (const eventType of EVENT_TYPES) {
  bus.subscribe(eventType, (payload) => {
    logger.debug({ event: eventType, payload }, 'Event fired');
  }, 999); // Low priority — runs after all other handlers
}
```

### Tracking Message Flow

```typescript
const bus = getEventBus();

let messageCount = 0;
let errorCount = 0;

bus.subscribe('message:received', () => {
  messageCount++;
});

bus.subscribe('message:processed', () => {
  metrics.setGauge('messages_processed', messageCount);
});

bus.subscribe('message:error', () => {
  errorCount++;
  metrics.setGauge('message_errors', errorCount);
});
```

### Plugin Event Integration

```typescript
// In a plugin:
const bus = context.eventBus;

bus.subscribe('session:created', ({ session }) => {
  logger.info(`New session: ${session.id}`);
});

bus.subscribe('tool:executed', ({ name, duration }) => {
  if (duration > 5000) {
    logger.warn({ tool: name, duration }, 'Slow tool execution');
  }
});
```

---

## EventBus vs Hooks

| Aspect | EventBus | Hooks |
|--------|----------|-------|
| **Purpose** | Observation (fire-and-forget) | Modification (can change behavior) |
| **Return values** | None | Can short-circuit or modify |
| **Execution** | Async, doesn't block pipeline | Sync, part of the pipeline |
| **Error handling** | Errors logged, don't affect pipeline | Errors may short-circuit |
| **Use case** | Analytics, logging, monitoring | Filtering, transformation, validation |

Use **EventBus** to observe what happened. Use **Hooks** to change what happens.

---

## Performance Considerations

| Factor | Impact | Mitigation |
|--------|--------|------------|
| Number of handlers | Each handler adds latency | Keep handlers fast, use async queues |
| Event frequency | High-frequency events can overwhelm | Sample or debounce |
| Handler errors | Don't block other handlers | Errors are caught per-handler |
| History size | Memory grows with history | Cap `maxHistory` |

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — Gateway that publishes events
- [`hooks/`](../hooks/README.md) — Lifecycle hooks (different purpose)
- [`observability/`](../observability/README.md) — Metrics that consume events
- [`plugins/`](../plugins/README.md) — Plugins that subscribe to events
