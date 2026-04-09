# Event Store

## Overview

The **Event Store** module (`agent-gateway/src/event-store/`) provides event sourcing infrastructure with snapshot-based state reconstruction, temporal queries, correlation tracking, and full audit trail capabilities. It implements the core event sourcing pattern where state changes are captured as immutable, append-only events, and current state is reconstructed by replaying events from a snapshot or from the beginning of the event stream.

The store tracks events per aggregate (identified by `aggregateId` and `aggregateType`), maintains version numbers for optimistic concurrency, and supports periodic snapshotting to optimize replay performance. Events can be queried by type, aggregate, time range, and correlation ID, enabling comprehensive audit and debugging capabilities.

### Key Capabilities

- **Append-Only Event Log**: Events are immutable and append-only, providing a complete audit trail.
- **Aggregate Versioning**: Each aggregate has a monotonically increasing version number for concurrency control.
- **Snapshotting**: Periodic snapshots (configurable interval) optimize replay performance by reducing the number of events that need to be replayed.
- **State Reconstruction**: `replay()` method replays events from the latest snapshot through a state handler function.
- **Temporal Queries**: Query events by time range for time-travel debugging.
- **Correlation Tracking**: Events can carry `correlationId` and `causationId` for tracing related event chains.
- **Event Streaming**: `getStream()` returns the full event stream for building read models or projections.
- **Automatic Trimming**: Old events per aggregate are trimmed (after snapshot point) when `maxEventsPerAggregate` is exceeded.

---

## File Structure

```
agent-gateway/src/event-store/
  index.ts              # Main implementation (EventStore class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for event and snapshot lifecycle events.
- `crypto` (`randomUUID`) for event ID generation.
- `../infra/index.js` (the shared `logger` singleton) -- available for custom integrations.

---

## Full API Documentation

### Interfaces

#### `DomainEvent`

```ts
interface DomainEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  version: number;
  timestamp: number;
  correlationId?: string;
  causationId?: string;
}
```

| Property        | Type                  | Description                              |
|-----------------|-----------------------|------------------------------------------|
| `id`            | string                | Auto-generated UUID                      |
| `aggregateId`   | string                | ID of the aggregate this event belongs to|
| `aggregateType` | string                | Type of the aggregate (e.g., `User`)     |
| `type`          | string                | Event type (e.g., `UserCreated`)         |
| `data`          | Record<string, any>   | Event payload                            |
| `metadata`      | Record<string, any>   | Event metadata (e.g., `userId`, `ip`)    |
| `version`       | number                | Auto-incremented aggregate version       |
| `timestamp`     | number                | Auto-generated event timestamp           |
| `correlationId` | string?               | ID linking related events across chains  |
| `causationId`   | string?               | ID of the event that caused this one     |

#### `Snapshot`

```ts
interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: Record<string, any>;
  timestamp: number;
}
```

#### `EventStoreConfig`

| Property                | Type   | Default | Description                              |
|-------------------------|--------|---------|------------------------------------------|
| `snapshotInterval`      | number | `100`   | Snapshot every N events per aggregate    |
| `maxEventsPerAggregate` | number | `10000` | Max events kept per aggregate            |

---

### Class: `EventStore`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(config?: EventStoreConfig)
```

#### Methods

##### `async append(event: Omit<DomainEvent, 'id' | 'version' | 'timestamp'>): Promise<DomainEvent>`

Appends a new event to the store. Auto-generates `id`, `version`, and `timestamp`. Increments the aggregate's version.

Triggers a snapshot if the new version is a multiple of `snapshotInterval`.

Emits `event:appended`.

```ts
const event = await store.append({
  aggregateId: 'user-123',
  aggregateType: 'User',
  type: 'UserCreated',
  data: { name: 'Alice', email: 'alice@example.com' },
  metadata: { userId: 'admin-1', ip: '192.168.1.1' },
  correlationId: 'corr-abc',
});
```

##### `getEvents(aggregateId: string, fromVersion?: number): DomainEvent[]`

Returns all events for an aggregate. If `fromVersion` is provided, returns only events with version greater than that value (useful for replay from snapshot).

```ts
const events = store.getEvents('user-123');
const newEvents = store.getEvents('user-123', 5); // Events after version 5
```

##### `getAllEvents(filter?: { type?, aggregateType?, after? }): DomainEvent[]`

Returns all events in the store with optional filtering.

```ts
const userEvents = store.getAllEvents({ aggregateType: 'User' });
const recentEvents = store.getAllEvents({ after: Date.now() - 3600000 }); // Last hour
const createdEvents = store.getAllEvents({ type: 'UserCreated' });
```

##### `getVersion(aggregateId: string): number`

Returns the current version number for an aggregate.

```ts
const version = store.getVersion('user-123');
```

##### `async createSnapshot(aggregateId: string, aggregateType: string, state?: Record<string, any>): Promise<Snapshot>`

Creates a manual snapshot for an aggregate. If `state` is not provided, the snapshot state defaults to `{ events: events.map(e => ({ type: e.type, data: e.data })) }`.

Emits `snapshot:created`.

```ts
await store.createSnapshot('user-123', 'User', {
  name: 'Alice',
  email: 'alice@example.com',
  version: 10,
});
```

##### `getSnapshot(aggregateId: string): Snapshot | undefined`

Returns the latest snapshot for an aggregate.

##### `replay(aggregateId: string, handler: (event: DomainEvent, state: any) => any): any`

Replays events to reconstruct aggregate state. Starts from the latest snapshot (if available) or from the beginning.

The `handler` function is called for each event and should return the updated state.

```ts
const state = store.replay('user-123', (event, state) => {
  switch (event.type) {
    case 'UserCreated':
      return { ...event.data };
    case 'UserEmailChanged':
      return { ...state, email: event.data.newEmail };
    case 'UserRenamed':
      return { ...state, name: event.data.newName };
    default:
      return state;
  }
});

console.log(state); // { name: 'Alice', email: 'new@example.com' }
```

##### `queryByTime(from: number, to: number, limit?: number): DomainEvent[]`

Queries events within a specific time range. Default limit is 1000.

```ts
const events = store.queryByTime(
  Date.now() - 3600000, // 1 hour ago
  Date.now(),
  500
);
```

##### `queryByCorrelation(correlationId: string): DomainEvent[]`

Returns all events with a specific correlation ID.

```ts
const correlatedEvents = store.queryByCorrelation('corr-abc');
```

##### `getStream(afterSequence?: number): DomainEvent[]`

Returns the full event stream, optionally starting after a specific sequence number (version).

```ts
const allEvents = store.getStream();
const newEvents = store.getStream(lastProcessedVersion);
```

##### `getStats(): { totalEvents, totalSnapshots, aggregates, byType }`

Returns store statistics.

```ts
const stats = store.getStats();
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Snapshots: ${stats.totalSnapshots}`);
console.log(`Aggregates: ${stats.aggregates}`);
console.log(`By type:`, stats.byType);
```

#### Private Methods

- **`trimAggregate(aggregateId)`**: Removes old events for an aggregate when `maxEventsPerAggregate` is exceeded. Keeps events after the latest snapshot version.

---

### Factory Function

```ts
function createEventStore(config?: EventStoreConfig): EventStore
```

Convenience factory.

---

## Configuration Options

```ts
const store = createEventStore({
  snapshotInterval: 50,      // Snapshot every 50 events
  maxEventsPerAggregate: 5000, // Keep max 5000 events per aggregate
});
```

---

## Usage Examples

### Full Event Sourcing Cycle

```ts
import { createEventStore } from './index.js';

const store = createEventStore({ snapshotInterval: 10 });

// 1. Append events
await store.append({
  aggregateId: 'order-1',
  aggregateType: 'Order',
  type: 'OrderCreated',
  data: { items: ['item-1', 'item-2'], total: 99.99 },
  metadata: { userId: 'user-123' },
  correlationId: 'corr-order-1',
});

await store.append({
  aggregateId: 'order-1',
  aggregateType: 'Order',
  type: 'OrderPaid',
  data: { paymentMethod: 'credit_card', amount: 99.99 },
  metadata: { userId: 'user-123' },
  correlationId: 'corr-order-1',
  causationId: '<id-of-OrderCreated-event>',
});

await store.append({
  aggregateId: 'order-1',
  aggregateType: 'Order',
  type: 'OrderShipped',
  data: { carrier: 'FedEx', trackingNumber: '1Z999AA10123456784' },
  metadata: { userId: 'warehouse-bot' },
  correlationId: 'corr-order-1',
});

// 2. Reconstruct state via replay
const orderState = store.replay('order-1', (event, state) => {
  switch (event.type) {
    case 'OrderCreated':
      return { status: 'created', items: event.data.items, total: event.data.total };
    case 'OrderPaid':
      return { ...state, status: 'paid', payment: event.data };
    case 'OrderShipped':
      return { ...state, status: 'shipped', shipping: event.data };
    default:
      return state;
  }
});

console.log(orderState);
// { status: 'shipped', items: [...], total: 99.99, payment: {...}, shipping: {...} }

// 3. Query by correlation
const allCorrelated = store.queryByCorrelation('corr-order-1');
console.log(`Order-1 has ${allCorrelated.length} events`);

// 4. Check version
console.log(`Order version: ${store.getVersion('order-1')}`); // 3
```

### Building a Read Model (Projection)

```ts
// Subscribe to new events and build a read model
bus.subscribe('event:appended', async (msg) => {
  const event = msg.payload;

  if (event.aggregateType === 'Order') {
    switch (event.type) {
      case 'OrderCreated':
        await readModel.orders.insert({
          id: event.aggregateId,
          status: 'created',
          createdAt: event.timestamp,
        });
        break;
      case 'OrderPaid':
        await readModel.orders.update(
          { id: event.aggregateId },
          { status: 'paid' }
        );
        break;
    }
  }
});
```

### Temporal Query

```ts
// What happened in the last hour?
const recentEvents = store.queryByTime(
  Date.now() - 3600000,
  Date.now(),
  1000
);

// Group by aggregate
const byAggregate = {};
for (const event of recentEvents) {
  if (!byAggregate[event.aggregateId]) {
    byAggregate[event.aggregateId] = [];
  }
  byAggregate[event.aggregateId].push(event);
}
```

### Manual Snapshot

```ts
// After a complex operation, force a snapshot
const currentState = store.replay('user-456', complexReducer);
await store.createSnapshot('user-456', 'User', currentState);
```

---

## Integration Points

- **Message Bus** (`/home/runner/workspace/agent-gateway/src/message-bus/README.md`): Events appended to the store can be published on the message bus for real-time projection updates.
- **Session Manager** (`/home/runner/workspace/agent-gateway/src/session-manager/README.md`): Session message history can be modeled as domain events for full session replay.
- **Schema Registry** (`/home/runner/workspace/agent-gateway/src/schema-registry/README.md`): Event data can be validated against registered schemas before appending.
- **Webhook Manager** (`/home/runner/workspace/agent-gateway/src/webhook-manager/README.md`): New events can trigger webhook notifications to external systems.
- **Event Bus** (`/home/runner/workspace/agent-gateway/src/eventbus/`): Domain events from the store can be forwarded to the gateway event bus.

---

## Error Handling

- **No Duplicate Detection**: The store does not check for duplicate events (same `aggregateId`, `type`, `data`). Idempotency must be handled by the caller.
- **Snapshot State**: If no custom `state` is provided to `createSnapshot()`, the snapshot state defaults to a simplified event list. Consumers should provide their own state for meaningful snapshots.
- **Event Trimming**: When `maxEventsPerAggregate` is exceeded, events before the latest snapshot version are removed. If no snapshot exists, no events are trimmed.
- **Empty Aggregates**: Querying events for a non-existent aggregate returns an empty array; no error is thrown.
- **Replay Handler Errors**: The `replay()` method does not catch errors thrown by the handler. Errors propagate to the caller.

---

## Event Sourcing Patterns

### Correlation Chains

```
Request arrives --> correlationId: 'corr-abc'
  --> Event A (correlationId: 'corr-abc')
    --> Event B (correlationId: 'corr-abc', causationId: eventA.id)
      --> Event C (correlationId: 'corr-abc', causationId: eventB.id)

Query: store.queryByCorrelation('corr-abc') returns [A, B, C]
```

### Snapshot Strategy

- **Frequency**: Default is every 100 events. Adjust based on event volume and replay cost.
- **Custom State**: Provide meaningful state snapshots (not raw event lists) for efficient replay.
- **Snapshot-Only Replay**: After a snapshot, only events newer than the snapshot version need to be replayed.

---

## Related Documentation

- [Message Bus](/home/runner/workspace/agent-gateway/src/message-bus/README.md) -- Pub/sub for broadcasting appended events.
- [Session Manager](/home/runner/workspace/agent-gateway/src/session-manager/README.md) -- Session events for event-sourced sessions.
- [Schema Registry](/home/runner/workspace/agent-gateway/src/schema-registry/README.md) -- Event data schema validation.
- [Webhook Manager](/home/runner/workspace/agent-gateway/src/webhook-manager/README.md) -- External event notifications.
- [Event Bus](/home/runner/workspace/agent-gateway/src/eventbus/) -- Gateway lifecycle events.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
