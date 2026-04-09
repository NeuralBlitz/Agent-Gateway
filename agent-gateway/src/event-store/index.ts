/**
 * Enterprise Event Sourcing
 * Event store with snapshots, replay, and temporal queries
 * for full audit trail and state reconstruction.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface DomainEvent {
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
  sequenceNumber: number;
}

export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: Record<string, any>;
  timestamp: number;
}

export interface EventStoreConfig {
  /** Snapshot interval */
  snapshotInterval?: number;
  /** Max events to keep per aggregate */
  maxEventsPerAggregate?: number;
}

export class EventStore extends EventEmitter {
  private config: Required<EventStoreConfig>;
  private events: DomainEvent[] = [];
  private snapshots: Map<string, Snapshot> = new Map();
  private aggregateVersions: Map<string, number> = new Map();
  private _globalSequence: number = 0;

  constructor(config: EventStoreConfig = {}) {
    super();
    this.config = {
      snapshotInterval: config.snapshotInterval || 100,
      maxEventsPerAggregate: config.maxEventsPerAggregate || 10000,
    };
    // Prevent MaxListenersExceededWarning with high subscriber counts
    this.setMaxListeners(100);
  }

  /** Append an event */
  async append(event: Omit<DomainEvent, 'id' | 'version' | 'timestamp' | 'sequenceNumber'>): Promise<DomainEvent> {
    const aggregateVersion = (this.aggregateVersions.get(event.aggregateId) || 0) + 1;
    this._globalSequence += 1;

    const fullEvent: DomainEvent = {
      ...event,
      id: randomUUID(),
      version: aggregateVersion,
      timestamp: Date.now(),
      sequenceNumber: this._globalSequence,
    };

    this.events.push(fullEvent);
    this.aggregateVersions.set(event.aggregateId, aggregateVersion);

    // Enforce max events per aggregate
    this.trimAggregate(event.aggregateId);

    // Snapshot if needed
    if (aggregateVersion % this.config.snapshotInterval === 0) {
      await this.createSnapshot(event.aggregateId, event.aggregateType);
    }

    // Emit events (with error protection)
    try {
      this.emit('event:appended', fullEvent);
    } catch (err: any) {
      logger.error({ event: fullEvent.type, err }, 'Event store append listener failed');
    }
    return fullEvent;
  }

  /** Get events for an aggregate */
  getEvents(aggregateId: string, fromVersion?: number): DomainEvent[] {
    const events = this.events.filter((e) => e.aggregateId === aggregateId);
    if (fromVersion !== undefined) {
      return events.filter((e) => e.version > fromVersion);
    }
    return events;
  }

  /** Get all events */
  getAllEvents(filter?: { type?: string; aggregateType?: string; after?: number }): DomainEvent[] {
    let events = [...this.events];

    if (filter?.type) events = events.filter((e) => e.type === filter.type);
    if (filter?.aggregateType) events = events.filter((e) => e.aggregateType === filter.aggregateType);
    if (filter?.after) events = events.filter((e) => e.timestamp > filter.after!);

    return events;
  }

  /** Get current version for an aggregate */
  getVersion(aggregateId: string): number {
    return this.aggregateVersions.get(aggregateId) || 0;
  }

  /** Create a snapshot */
  async createSnapshot(aggregateId: string, aggregateType: string, state?: Record<string, any>): Promise<Snapshot> {
    const events = this.getEvents(aggregateId);
    const version = events.length;

    const snapshot: Snapshot = {
      aggregateId,
      aggregateType,
      version,
      state: state || { events: events.map((e) => ({ type: e.type, data: e.data })) },
      timestamp: Date.now(),
    };

    this.snapshots.set(aggregateId, snapshot);
    try {
      this.emit('snapshot:created', snapshot);
    } catch (err: any) {
      logger.error({ err }, 'Event store snapshot listener failed');
    }
    return snapshot;
  }

  /** Get latest snapshot */
  getSnapshot(aggregateId: string): Snapshot | undefined {
    return this.snapshots.get(aggregateId);
  }

  /** Replay events to reconstruct state */
  replay(aggregateId: string, handler: (event: DomainEvent, state: any) => any): any {
    const snapshot = this.getSnapshot(aggregateId);
    let state = snapshot ? { ...snapshot.state } : {};

    const events = this.getEvents(aggregateId, snapshot?.version);

    for (const event of events) {
      state = handler(event, state) || state;
    }

    return state;
  }

  /** Query events by time range */
  queryByTime(from: number, to: number, limit: number = 1000): DomainEvent[] {
    return this.events
      .filter((e) => e.timestamp >= from && e.timestamp < to)
      .slice(0, limit);
  }

  /** Query events by correlation */
  queryByCorrelation(correlationId: string): DomainEvent[] {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  /** Get event stream */
  getStream(afterSequence?: number): DomainEvent[] {
    if (afterSequence === undefined) return [...this.events];
    return this.events.filter((e) => e.sequenceNumber > afterSequence);
  }

  /** Trim old events for an aggregate */
  private trimAggregate(aggregateId: string): void {
    const events = this.events.filter((e) => e.aggregateId === aggregateId);
    if (events.length > this.config.maxEventsPerAggregate) {
      const toRemove = events.length - this.config.maxEventsPerAggregate;
      // Get the most recent events to keep, sorted by sequence number
      const sorted = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      const keepIds = new Set(sorted.slice(toRemove).map((e) => e.id));
      this.events = this.events.filter((e) => e.aggregateId !== aggregateId || keepIds.has(e.id));
    }
  }

  /** Get stats */
  getStats(): {
    totalEvents: number;
    totalSnapshots: number;
    aggregates: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    for (const event of this.events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      totalSnapshots: this.snapshots.size,
      aggregates: this.aggregateVersions.size,
      byType,
    };
  }
}

export function createEventStore(config?: EventStoreConfig): EventStore {
  return new EventStore(config);
}
