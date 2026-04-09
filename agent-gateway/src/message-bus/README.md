# Message Bus

## Overview

The **Message Bus** module (`agent-gateway/src/message-bus/`) provides an in-process publish/subscribe messaging system with message history, replay capabilities, pattern matching, and dead letter queue handling. It enables decoupled inter-module communication within the gateway, allowing modules to publish events without knowing which modules will consume them.

The bus supports topic-based subscriptions (exact match), wildcard subscriptions (`*` for all topics), and glob-style pattern matching (`session:*`, `user.?.*`). Messages that fail during handler execution are automatically routed to a dead letter queue for later inspection and retry.

### Differences from `src/eventbus/`

The agent gateway also contains an **eventbus** module at [`/home/runner/workspace/agent-gateway/src/eventbus/`](/home/runner/workspace/agent-gateway/src/eventbus/). Key differences:

| Aspect | `src/message-bus/` | `src/eventbus/` |
|--------|-------------------|-----------------|
| **Purpose** | General-purpose internal pub/sub for any inter-module communication | Gateway-specific event bus for lifecycle events (message in/out, session changes, agent states) |
| **Message Model** | Generic `BusMessage` with `topic`, `payload`, `headers`, `correlationId` | Typed `GatewayEvent` with strict `GatewayEventType` union (25 specific event types) |
| **Topic Model** | Free-form string topics with glob pattern matching (`session:*`, `user.?`) | Typed events using `GatewayEventType` literal strings |
| **Pattern Matching** | Supports glob patterns (`*`, `?`) for topic subscriptions | No pattern matching; exact event type matching only |
| **Replay** | Built-in `replay()` to re-deliver historical messages to a handler | No replay capability |
| **Dead Letters** | Stores failed messages with error info; supports `retryDeadLetter()` | Stores failed events in dead letter list; no retry |
| **Headers** | Rich headers map (`Record<string, string>`) with auto-populated `x-message-id`, `x-timestamp`, `x-correlation-id` | `metadata` object with structured fields (`channel`, `userId`, `sessionId`, `provider`) |
| **Global Instance** | No global singleton; each instance is independent | Provides `getEventBus()` global singleton |
| **Processing Model** | Synchronous handler iteration within `publish()` | Async queue with sequential processing (`processQueue`) |
| **Priority** | No priority support | Supports priority-based handler ordering |
| **Once Subscriptions** | No `once` option | Supports `once: true` for single-execution subscriptions |

Use `message-bus/` for general inter-module messaging with pattern matching and replay. Use `eventbus/` for gateway lifecycle events with typed event names and priority-based processing.

### Key Capabilities

- **Topic-Based Pub/Sub**: Subscribe to exact topic names or use glob patterns.
- **Wildcard Subscriptions**: `subscribeAll()` or `subscribe('*', handler)` to receive all messages.
- **Message History**: Configurable history buffer (default 10,000 messages) for replay and debugging.
- **Message Replay**: Replay historical messages for a topic to a new handler.
- **Dead Letter Queue**: Failed messages are captured with error context and can be retried.
- **Correlation IDs**: Built-in `x-correlation-id` header support for request tracing.
- **Async Delivery**: All handlers are awaited; errors in one handler do not block others.
- **Statistics**: Topic counts, handler counts, and per-topic message volume.

---

## File Structure

```
agent-gateway/src/message-bus/
  index.ts              # Main implementation (MessageBus class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for bus-level event emission.
- `crypto` (`randomUUID`) for message ID generation.
- `../infra/index.js` (the shared `logger` singleton) for debug/warn/error logging.

---

## Full API Documentation

### Types

#### `BusMessage`

```ts
interface BusMessage {
  id: string;
  topic: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: number;
  source?: string;
  correlationId?: string;
}
```

Auto-populated headers:
- `x-message-id`: The message's UUID.
- `x-timestamp`: Epoch ms when the message was published.
- `x-correlation-id`: Copied from `headers['x-correlation-id']` if provided.

#### `MessageHandler`

```ts
type MessageHandler = (message: BusMessage) => void | Promise<void>;
```

---

### Class: `MessageBus`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(maxHistory?: number, maxDeadLetters?: number)
```

| Parameter        | Type   | Default  | Description                          |
|------------------|--------|----------|--------------------------------------|
| `maxHistory`     | number | `10000`  | Max messages in history buffer       |
| `maxDeadLetters` | number | `1000`   | Max messages in dead letter queue    |

#### Methods

##### `async publish(topic: string, payload: any, headers?: Record<string, string>, source?: string): Promise<BusMessage>`

Publishes a message to the bus. Stores in history, delivers to all matching handlers (exact topic, wildcard `*`, and glob patterns). Failed handlers are captured in the dead letter queue.

Returns the published message.

Also emits `message` (all messages) and `message:${topic}` (topic-specific) events on the bus itself.

```ts
const msg = await bus.publish('session:created', {
  sessionId: 'sess-123',
  userId: 'user-456',
}, { 'x-correlation-id': 'corr-abc' }, 'session-manager');
```

##### `subscribe(topic: string, handler: MessageHandler): () => void`

Subscribes to a topic. Returns an unsubscribe function.

```ts
const unsub = bus.subscribe('session:created', (msg) => {
  console.log('Session created:', msg.payload.sessionId);
});

// Later:
unsub();
```

##### `subscribeAll(handler: MessageHandler): () => void`

Subscribes to all topics (wildcard).

```ts
bus.subscribeAll((msg) => {
  console.log(`[${msg.topic}]`, msg.payload);
});
```

##### `getHistory(topic?: string, limit?: number): BusMessage[]`

Returns recent messages from history. Filter by topic if provided. Default limit is 100.

```ts
const recent = bus.getHistory('session:created', 50);
```

##### `async replay(topic: string, handler: MessageHandler, since?: number): Promise<number>`

Replays all historical messages for a topic to the provided handler. Optionally filter by `since` timestamp.

Returns the count of successfully replayed messages.

```ts
const count = await bus.replay('session:created', (msg) => {
  rebuildCache(msg.payload);
});
console.log(`Replayed ${count} messages`);
```

##### `getDeadLetters(limit?: number): BusMessage[]`

Returns recent dead letter messages. Default limit is 50.

##### `async retryDeadLetter(message: BusMessage): Promise<boolean>`

Removes a message from the dead letter queue and re-publishes it. Returns `true` if the message was found and retried.

##### `clearDeadLetters(): number`

Clears the entire dead letter queue. Returns the count of removed messages.

##### `getStats(): { topics, totalHandlers, historySize, deadLetterCount, byTopic }`

Returns statistics about the bus.

```ts
const stats = bus.getStats();
console.log(`Topics: ${stats.topics}`);
console.log(`Handlers: ${stats.totalHandlers}`);
console.log(`Dead letters: ${stats.deadLetterCount}`);
console.log(`By topic:`, stats.byTopic);
```

#### Private Methods

- **`getPatternHandlers(topic: string)`**: Matches a topic string against registered glob patterns (using `*` and `?` wildcards).

---

### Factory Function

```ts
function createMessageBus(maxHistory?: number, maxDeadLetters?: number): MessageBus
```

Convenience factory.

---

## Configuration Options

```ts
const bus = createMessageBus(
  50000,   // Keep 50,000 messages in history
  5000     // Keep 5,000 dead letters
);
```

---

## Usage Examples

### Basic Pub/Sub

```ts
import { createMessageBus } from './index.js';

const bus = createMessageBus();

// Subscribe
bus.subscribe('user:created', (msg) => {
  console.log('New user:', msg.payload.userId);
});

// Publish
await bus.publish('user:created', {
  userId: 'user-123',
  email: 'user@example.com',
});
```

### Pattern Matching

```ts
// Subscribe to all session events
bus.subscribe('session:*', (msg) => {
  console.log(`Session event: ${msg.topic}`);
});

// Subscribe to all user events
bus.subscribe('user.*', (msg) => {
  console.log(`User event: ${msg.topic}`);
});

// Publish -- matches 'session:*' pattern
await bus.publish('session:created', { sessionId: 'sess-1' });
await bus.publish('session:updated', { sessionId: 'sess-1' });
```

### Correlated Messaging

```ts
// Publish with correlation ID
await bus.publish('agent:started', {
  agentId: 'agent-1',
  sessionId: 'sess-123',
}, {
  'x-correlation-id': 'trace-abc-123',
}, 'agent-manager');

// Handler can read correlation
bus.subscribe('agent:started', (msg) => {
  const correlationId = msg.correlationId;
  console.log('Correlated with trace:', correlationId);
});
```

### Message Replay

```ts
// A new module joins and needs historical data
await bus.replay('config:changed', (msg) => {
  applyConfigChange(msg.payload);
}, Date.now() - 3600000); // Last hour only
```

### Dead Letter Handling

```ts
// Intentionally failing handler
bus.subscribe('order:created', async (msg) => {
  if (msg.payload.invalid) throw new Error('Invalid order');
  // Normal processing...
});

// Check dead letters
const deadLetters = bus.getDeadLetters();
for (const dl of deadLetters) {
  console.log(`Failed message on ${dl.topic}: ${dl.headers['x-error']}`);
}

// Retry a specific dead letter
await bus.retryDeadLetter(deadLetters[0]);
```

### Unsubscribe

```ts
const unsub = bus.subscribe('temp:events', (msg) => {
  handleEvent(msg);
});

// Stop listening
unsub();
```

### Bus-Level Events

```ts
bus.on('message', (msg) => {
  // All messages pass through here
  metrics.increment(`bus.messages.${msg.topic}`);
});

bus.on('message:session:created', (msg) => {
  // Topic-specific event
  alertService.notify('New session created');
});
```

---

## Integration Points

- **Event Bus** (`/home/runner/workspace/agent-gateway/src/eventbus/`): The event bus handles typed gateway lifecycle events. The message bus can be used for general-purpose inter-module messaging. Both can coexist and complement each other.
- **Session Manager** (`/home/runner/workspace/agent-gateway/src/session-manager/README.md`): Session lifecycle events can be published on the message bus for modules that don't directly import the session manager.
- **Webhook Manager** (`/home/runner/workspace/agent-gateway/src/webhook-manager/README.md`): The message bus can relay internal events to the webhook manager for external HTTP dispatch.
- **Event Store** (`/home/runner/workspace/agent-gateway/src/event-store/README.md`): Messages on the bus can be persisted to the event store for durability.
- **Request Tracker** (`/home/runner/workspace/agent-gateway/src/request-tracker/README.md`): Bus messages can carry `correlationId` headers linking them to request traces.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Handler failures and replay operations are logged.

---

## Error Handling

- **Handler Failures**: If a handler throws, the error is caught, the message is added to the dead letter queue with an `x-error` header, and other handlers for the same topic continue executing.
- **Replay Failures**: Failed replay handlers are logged but do not stop the replay of remaining messages.
- **Dead Letter Retry**: `retryDeadLetter()` re-publishes the message, which means it goes through the full delivery pipeline again (including all current handlers and pattern matching).
- **No Message Loss**: Within the configured `maxHistory` and `maxDeadLetters` limits, messages are not lost. Oldest messages are evicted when limits are exceeded.

---

## Topic Naming Conventions

Recommended topic naming pattern: `{domain}:{action}` or `{domain}.{subdomain}.{action}`.

Examples:
- `session:created`, `session:deleted`, `session:updated`
- `user:created`, `user:deleted`
- `agent:started`, `agent:completed`, `agent:error`
- `config:changed`
- `cache:invalidated`

---

## Related Documentation

- [Event Bus](/home/runner/workspace/agent-gateway/src/eventbus/) -- Typed gateway lifecycle events with priority processing.
- [Session Manager](/home/runner/workspace/agent-gateway/src/session-manager/README.md) -- Session lifecycle events.
- [Webhook Manager](/home/runner/workspace/agent-gateway/src/webhook-manager/README.md) -- External webhook delivery triggered by bus messages.
- [Event Store](/home/runner/workspace/agent-gateway/src/event-store/README.md) -- Event sourcing for message persistence.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Correlated tracing with `correlationId`.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
