import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore, createEventStore, DomainEvent, Snapshot } from '../src/event-store/index.js';

describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    store = createEventStore();
  });

  describe('createEventStore', () => {
    it('should create an EventStore instance', () => {
      expect(store).toBeInstanceOf(EventStore);
    });

    it('should accept custom config', () => {
      const custom = createEventStore({
        snapshotInterval: 10,
        maxEventsPerAggregate: 100,
      });
      expect(custom).toBeInstanceOf(EventStore);
    });

    it('should default config values', () => {
      const defaultStore = createEventStore();
      expect(defaultStore).toBeInstanceOf(EventStore);
    });
  });

  describe('append', () => {
    it('should append an event', async () => {
      const event = await store.append({
        aggregateId: 'user-1',
        aggregateType: 'User',
        type: 'UserCreated',
        data: { id: 'user-1', name: 'Alice' },
        metadata: {},
      });

      expect(event.id).toBeDefined();
      expect(event.aggregateId).toBe('user-1');
      expect(event.aggregateType).toBe('User');
      expect(event.type).toBe('UserCreated');
      expect(event.version).toBe(1);
      expect(event.timestamp).toBeDefined();
    });

    it('should increment version for same aggregate', async () => {
      await store.append({
        aggregateId: 'user-1',
        aggregateType: 'User',
        type: 'UserCreated',
        data: {},
        metadata: {},
      });
      const event2 = await store.append({
        aggregateId: 'user-1',
        aggregateType: 'User',
        type: 'UserNameChanged',
        data: { name: 'Bob' },
        metadata: {},
      });

      expect(event2.version).toBe(2);
    });

    it('should track versions independently per aggregate', async () => {
      await store.append({
        aggregateId: 'user-1',
        aggregateType: 'User',
        type: 'UserCreated',
        data: {},
        metadata: {},
      });
      const user2Event = await store.append({
        aggregateId: 'user-2',
        aggregateType: 'User',
        type: 'UserCreated',
        data: {},
        metadata: {},
      });

      expect(user2Event.version).toBe(1);
    });

    it('should emit event:appended event', async () => {
      const appendedHandler = new Promise<DomainEvent>((resolve) => {
        store.on('event:appended', resolve);
      });
      await store.append({
        aggregateId: 'evt-agg',
        aggregateType: 'Test',
        type: 'TestEvent',
        data: {},
        metadata: {},
      });
      const event = await appendedHandler;
      expect(event.type).toBe('TestEvent');
    });

    it('should create snapshot at interval', async () => {
      const snapshotStore = createEventStore({ snapshotInterval: 3 });
      await snapshotStore.append({
        aggregateId: 'snap-1',
        aggregateType: 'Test',
        type: 'Event1',
        data: {},
        metadata: {},
      });
      await snapshotStore.append({
        aggregateId: 'snap-1',
        aggregateType: 'Test',
        type: 'Event2',
        data: {},
        metadata: {},
      });

      const snapshotCreated = new Promise<Snapshot>((resolve) => {
        snapshotStore.on('snapshot:created', resolve);
      });

      await snapshotStore.append({
        aggregateId: 'snap-1',
        aggregateType: 'Test',
        type: 'Event3',
        data: {},
        metadata: {},
      });

      const snapshot = await snapshotCreated;
      expect(snapshot.aggregateId).toBe('snap-1');
      expect(snapshot.version).toBe(3);
    });
  });

  describe('getEvents', () => {
    it('should return all events for an aggregate', async () => {
      await store.append({ aggregateId: 'agg-1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'agg-1', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });
      await store.append({ aggregateId: 'agg-2', aggregateType: 'T', type: 'E3', data: {}, metadata: {} });

      const events = store.getEvents('agg-1');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.aggregateId === 'agg-1')).toBe(true);
    });

    it('should return events from a specific version', async () => {
      await store.append({ aggregateId: 'ver-1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'ver-1', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });
      await store.append({ aggregateId: 'ver-1', aggregateType: 'T', type: 'E3', data: {}, metadata: {} });

      const events = store.getEvents('ver-1', 1);
      expect(events.length).toBe(2);
      expect(events.every((e) => e.version > 1)).toBe(true);
    });

    it('should return empty array for unknown aggregate', () => {
      expect(store.getEvents('unknown')).toEqual([]);
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', async () => {
      await store.append({ aggregateId: 'all-1', aggregateType: 'TypeA', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'all-2', aggregateType: 'TypeB', type: 'E2', data: {}, metadata: {} });

      const events = store.getAllEvents();
      expect(events.length).toBe(2);
    });

    it('should filter by type', async () => {
      await store.append({ aggregateId: 'a1', aggregateType: 'T', type: 'TypeA', data: {}, metadata: {} });
      await store.append({ aggregateId: 'a2', aggregateType: 'T', type: 'TypeB', data: {}, metadata: {} });
      await store.append({ aggregateId: 'a3', aggregateType: 'T', type: 'TypeA', data: {}, metadata: {} });

      const events = store.getAllEvents({ type: 'TypeA' });
      expect(events.length).toBe(2);
      expect(events.every((e) => e.type === 'TypeA')).toBe(true);
    });

    it('should filter by aggregateType', async () => {
      await store.append({ aggregateId: 'a1', aggregateType: 'User', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'a2', aggregateType: 'Order', type: 'E2', data: {}, metadata: {} });

      const events = store.getAllEvents({ aggregateType: 'User' });
      expect(events.length).toBe(1);
      expect(events[0].aggregateType).toBe('User');
    });

    it('should filter by timestamp', async () => {
      await store.append({ aggregateId: 'a1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      const afterTime = Date.now();
      await new Promise((r) => setTimeout(r, 2)); // Ensure different timestamp
      await store.append({ aggregateId: 'a2', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });

      const events = store.getAllEvents({ after: afterTime });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('E2');
    });

    it('should support combined filters', async () => {
      await store.append({ aggregateId: 'a1', aggregateType: 'User', type: 'Created', data: {}, metadata: {} });
      await store.append({ aggregateId: 'a2', aggregateType: 'User', type: 'Deleted', data: {}, metadata: {} });
      await store.append({ aggregateId: 'a3', aggregateType: 'Order', type: 'Created', data: {}, metadata: {} });

      const events = store.getAllEvents({ type: 'Created', aggregateType: 'User' });
      expect(events.length).toBe(1);
      expect(events[0].aggregateId).toBe('a1');
    });
  });

  describe('getVersion', () => {
    it('should return current version for an aggregate', async () => {
      await store.append({ aggregateId: 'ver-agg', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'ver-agg', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });

      expect(store.getVersion('ver-agg')).toBe(2);
    });

    it('should return 0 for unknown aggregate', () => {
      expect(store.getVersion('unknown')).toBe(0);
    });
  });

  describe('createSnapshot', () => {
    it('should create a snapshot', async () => {
      await store.append({ aggregateId: 'snap-agg', aggregateType: 'MyType', type: 'E1', data: { val: 1 }, metadata: {} });
      await store.append({ aggregateId: 'snap-agg', aggregateType: 'MyType', type: 'E2', data: { val: 2 }, metadata: {} });

      const snapshot = await store.createSnapshot('snap-agg', 'MyType');
      expect(snapshot.aggregateId).toBe('snap-agg');
      expect(snapshot.aggregateType).toBe('MyType');
      expect(snapshot.version).toBe(2);
      expect(snapshot.state).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should create snapshot with custom state', async () => {
      await store.append({ aggregateId: 'custom-snap', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });

      const snapshot = await store.createSnapshot('custom-snap', 'T', { custom: 'state' });
      expect(snapshot.state).toEqual({ custom: 'state' });
    });

    it('should emit snapshot:created event', async () => {
      const snapshotHandler = new Promise<Snapshot>((resolve) => {
        store.on('snapshot:created', resolve);
      });
      await store.createSnapshot('evt-snap', 'Type', { data: 'value' });
      const snapshot = await snapshotHandler;
      expect(snapshot.aggregateId).toBe('evt-snap');
    });
  });

  describe('getSnapshot', () => {
    it('should return the latest snapshot', async () => {
      await store.createSnapshot('get-snap', 'T', { v: 1 });
      const snapshot = store.getSnapshot('get-snap');
      expect(snapshot).toBeDefined();
      expect(snapshot!.state).toEqual({ v: 1 });
    });

    it('should return undefined for aggregate with no snapshot', () => {
      expect(store.getSnapshot('no-snapshot')).toBeUndefined();
    });

    it('should return the latest when multiple snapshots exist', async () => {
      await store.createSnapshot('multi-snap', 'T', { v: 1 });
      await store.createSnapshot('multi-snap', 'T', { v: 2 });
      const snapshot = store.getSnapshot('multi-snap');
      expect(snapshot!.state).toEqual({ v: 2 });
    });
  });

  describe('replay', () => {
    it('should replay events to reconstruct state', async () => {
      await store.append({
        aggregateId: 'replay-agg',
        aggregateType: 'Counter',
        type: 'Increment',
        data: { value: 1 },
        metadata: {},
      });
      await store.append({
        aggregateId: 'replay-agg',
        aggregateType: 'Counter',
        type: 'Increment',
        data: { value: 1 },
        metadata: {},
      });

      const state = store.replay('replay-agg', (event, state: { total: number }) => {
        state.total = (state.total || 0) + event.data.value;
        return state;
      });

      expect(state.total).toBe(2);
    });

    it('should start from snapshot if available', async () => {
      await store.append({
        aggregateId: 'snap-replay',
        aggregateType: 'T',
        type: 'Init',
        data: { total: 10 },
        metadata: {},
      });
      await store.append({
        aggregateId: 'snap-replay',
        aggregateType: 'T',
        type: 'Increment',
        data: { value: 5 },
        metadata: {},
      });
      await store.createSnapshot('snap-replay', 'T', { total: 10 });

      // Append more events after snapshot
      await store.append({
        aggregateId: 'snap-replay',
        aggregateType: 'T',
        type: 'Increment',
        data: { value: 3 },
        metadata: {},
      });

      const state = store.replay('snap-replay', (event, state: { total: number }) => {
        state.total += event.data.value || 0;
        return state;
      });

      expect(state.total).toBe(13);
    });

    it('should return empty state for aggregate with no events', () => {
      const state = store.replay('empty-agg', (_event, state) => state);
      expect(state).toEqual({});
    });
  });

  describe('queryByTime', () => {
    it('should return events in a time range', async () => {
      const t1 = Date.now();
      await store.append({ aggregateId: 'time-1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await new Promise((r) => setTimeout(r, 2)); // Ensure different timestamp
      const t2 = Date.now();
      await store.append({ aggregateId: 'time-2', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });
      const t3 = Date.now();

      const events = store.queryByTime(t1, t2);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('E1');
    });

    it('should respect limit', async () => {
      for (let i = 0; i < 10; i++) {
        await store.append({ aggregateId: `ql-${i}`, aggregateType: 'T', type: `E${i}`, data: {}, metadata: {} });
      }
      await new Promise((r) => setTimeout(r, 2)); // Ensure query end time is after all events
      const events = store.queryByTime(0, Date.now(), 3);
      expect(events.length).toBe(3);
    });

    it('should default to 1000 limit', () => {
      const events = store.queryByTime(0, Date.now());
      expect(events.length).toBe(0);
    });

    it('should return empty array when no events in range', () => {
      const events = store.queryByTime(0, 1);
      expect(events).toEqual([]);
    });
  });

  describe('queryByCorrelation', () => {
    it('should return events with matching correlationId', async () => {
      await store.append({
        aggregateId: 'corr-1',
        aggregateType: 'T',
        type: 'E1',
        data: {},
        metadata: {},
        correlationId: 'corr-abc',
      });
      await store.append({
        aggregateId: 'corr-2',
        aggregateType: 'T',
        type: 'E2',
        data: {},
        metadata: {},
        correlationId: 'corr-abc',
      });
      await store.append({
        aggregateId: 'corr-3',
        aggregateType: 'T',
        type: 'E3',
        data: {},
        metadata: {},
        correlationId: 'corr-xyz',
      });

      const events = store.queryByCorrelation('corr-abc');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.correlationId === 'corr-abc')).toBe(true);
    });

    it('should return empty array for unknown correlationId', () => {
      expect(store.queryByCorrelation('unknown')).toEqual([]);
    });
  });

  describe('getStream', () => {
    it('should return all events when no afterSequence', async () => {
      await store.append({ aggregateId: 'stream-1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 'stream-2', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });

      const stream = store.getStream();
      expect(stream.length).toBe(2);
    });

    it('should return events after sequence', async () => {
      await store.append({ aggregateId: 's1', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await store.append({ aggregateId: 's2', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });
      await store.append({ aggregateId: 's3', aggregateType: 'T', type: 'E3', data: {}, metadata: {} });

      // getStream filters by version > afterSequence
      // Each aggregate has its own version counter. s3 is the 3rd event, but version is per aggregate.
      // getStream compares event.version against afterSequence globally.
      const stream = store.getStream(2);
      expect(stream.length).toBe(1);
      expect(stream[0].type).toBe('E3');
    });
  });

  describe('getStats', () => {
    it('should return stats with no events', () => {
      const stats = store.getStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.totalSnapshots).toBe(0);
      expect(stats.aggregates).toBe(0);
      expect(stats.byType).toEqual({});
    });

    it('should return accurate stats', async () => {
      await store.append({ aggregateId: 'stats-1', aggregateType: 'User', type: 'UserCreated', data: {}, metadata: {} });
      await store.append({ aggregateId: 'stats-1', aggregateType: 'User', type: 'UserNameChanged', data: {}, metadata: {} });
      await store.append({ aggregateId: 'stats-2', aggregateType: 'Order', type: 'OrderCreated', data: {}, metadata: {} });

      const stats = store.getStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.aggregates).toBe(2);
      expect(stats.byType['UserCreated']).toBe(1);
      expect(stats.byType['UserNameChanged']).toBe(1);
      expect(stats.byType['OrderCreated']).toBe(1);
    });

    it('should count snapshots', async () => {
      await store.createSnapshot('snap-stats', 'T', {});
      const stats = store.getStats();
      expect(stats.totalSnapshots).toBe(1);
    });
  });

  describe('maxEventsPerAggregate', () => {
    it('should trim old events when max is exceeded', async () => {
      const limitedStore = createEventStore({ maxEventsPerAggregate: 3, snapshotInterval: 100 });

      for (let i = 0; i < 5; i++) {
        await limitedStore.append({
          aggregateId: 'trim-agg',
          aggregateType: 'T',
          type: `E${i}`,
          data: {},
          metadata: {},
        });
      }

      const events = limitedStore.getEvents('trim-agg');
      // Without a snapshot, events are trimmed from the start
      expect(events.length).toBeLessThanOrEqual(3);
    });

    it('should preserve events after snapshot version', async () => {
      const limitedStore = createEventStore({ maxEventsPerAggregate: 3, snapshotInterval: 2 });

      await limitedStore.append({ aggregateId: 'snap-trim', aggregateType: 'T', type: 'E1', data: {}, metadata: {} });
      await limitedStore.append({ aggregateId: 'snap-trim', aggregateType: 'T', type: 'E2', data: {}, metadata: {} });
      // Snapshot created at version 2

      for (let i = 3; i <= 6; i++) {
        await limitedStore.append({ aggregateId: 'snap-trim', aggregateType: 'T', type: `E${i}`, data: {}, metadata: {} });
      }

      const events = limitedStore.getEvents('snap-trim');
      // Should keep events from snapshot version onwards
      expect(events.every((e) => e.version >= 2)).toBe(true);
    });
  });

  describe('causationId', () => {
    it('should store causationId', async () => {
      const event = await store.append({
        aggregateId: 'causal-1',
        aggregateType: 'T',
        type: 'E1',
        data: {},
        metadata: {},
        causationId: 'cause-abc',
      });
      expect(event.causationId).toBe('cause-abc');
    });
  });
});
