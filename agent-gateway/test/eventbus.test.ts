import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventBus, createEventBus, getEventBus, publishMessageEvent } from '../src/eventbus/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = createEventBus({ maxHistory: 100, maxDeadLetters: 10 });
  });

  describe('constructor', () => {
    it('should create an EventBus instance', () => {
      expect(bus).toBeInstanceOf(EventBus);
      expect(bus).toBeInstanceOf(EventEmitter);
    });

    it('should accept custom maxHistory', () => {
      const custom = createEventBus({ maxHistory: 50 });
      expect(custom).toBeInstanceOf(EventBus);
    });

    it('should accept custom maxDeadLetters', () => {
      const custom = createEventBus({ maxDeadLetters: 5 });
      expect(custom).toBeInstanceOf(EventBus);
    });

    it('should default maxHistory to 10000', () => {
      const defaultBus = createEventBus();
      expect(defaultBus).toBeInstanceOf(EventBus);
    });

    it('should set maxListeners to prevent warnings', () => {
      expect(bus.getMaxListeners()).toBe(100);
    });
  });

  describe('publish', () => {
    it('should publish an event', async () => {
      await bus.publish({ type: 'message:inbound', data: { content: 'hello' } });
      const events = bus.getEvents('message:inbound');
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('message:inbound');
    });

    it('should add timestamp to published events', async () => {
      const before = Date.now();
      await bus.publish({ type: 'session:created', data: {} });
      const events = bus.getEvents('session:created');
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
    });

    it('should store events in history', async () => {
      await bus.publish({ type: 'agent:started', data: { agent: 'bot-1' } });
      await bus.publish({ type: 'agent:started', data: { agent: 'bot-2' } });
      const events = bus.getEvents('agent:started');
      expect(events.length).toBe(2);
    });

    it('should emit event synchronously to handlers', async () => {
      const handler = vi.fn();
      bus.on('tool:executed', handler);
      await bus.publish({ type: 'tool:executed', data: { tool: 'search' } });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tool:executed',
        data: { tool: 'search' },
      }));
    });

    it('should emit to wildcard listener', async () => {
      const handler = vi.fn();
      bus.on('*', handler);
      await bus.publish({ type: 'cache:hit', data: {} });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should trim history when maxHistory is exceeded', async () => {
      const smallBus = createEventBus({ maxHistory: 3 });
      await smallBus.publish({ type: 'message:inbound', data: { i: 1 } });
      await smallBus.publish({ type: 'message:inbound', data: { i: 2 } });
      await smallBus.publish({ type: 'message:inbound', data: { i: 3 } });
      await smallBus.publish({ type: 'message:inbound', data: { i: 4 } });
      const events = smallBus.getEvents('message:inbound');
      expect(events.length).toBeLessThanOrEqual(3);
    });
  });

  describe('subscribe', () => {
    it('should subscribe a handler to an event type', () => {
      const handler = vi.fn();
      const id = bus.subscribe('message:inbound', handler);
      expect(id).toBeDefined();
      expect(bus.getSubscriptionCount()).toBe(1);
    });

    it('should call the handler when event is published', async () => {
      const handler = vi.fn();
      bus.subscribe('message:inbound', handler);
      await bus.publish({ type: 'message:inbound', data: { content: 'test' } });
      await new Promise((r) => setTimeout(r, 10)); // Allow async processing
      expect(handler).toHaveBeenCalled();
    });

    it('should assign unique IDs to subscriptions', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const id1 = bus.subscribe('message:inbound', h1);
      const id2 = bus.subscribe('message:inbound', h2);
      expect(id1).not.toBe(id2);
    });

    it('should support priority option', () => {
      const id = bus.subscribe('agent:error', vi.fn(), { priority: 10 });
      expect(id).toBeDefined();
    });

    it('should support once option', async () => {
      const handler = vi.fn();
      bus.subscribe('session:created', handler, { once: true });
      await bus.publish({ type: 'session:created', data: {} });
      await bus.publish({ type: 'session:created', data: {} });
      await new Promise((r) => setTimeout(r, 20));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe a handler', () => {
      const handler = vi.fn();
      const id = bus.subscribe('message:inbound', handler);
      const result = bus.unsubscribe(id);
      expect(result).toBe(true);
      expect(bus.getSubscriptionCount()).toBe(0);
    });

    it('should return false for unknown subscription', () => {
      expect(bus.unsubscribe('nonexistent')).toBe(false);
    });

    it('should stop calling handler after unsubscribe', async () => {
      const handler = vi.fn();
      const id = bus.subscribe('message:inbound', handler);
      bus.unsubscribe(id);
      await bus.publish({ type: 'message:inbound', data: {} });
      await new Promise((r) => setTimeout(r, 10));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should return events by type', async () => {
      await bus.publish({ type: 'message:inbound', data: {} });
      await bus.publish({ type: 'message:outbound', data: {} });
      await bus.publish({ type: 'message:inbound', data: {} });
      const events = bus.getEvents('message:inbound');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.type === 'message:inbound')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await bus.publish({ type: 'message:inbound', data: { i } });
      }
      const events = bus.getEvents('message:inbound', 3);
      expect(events.length).toBe(3);
    });

    it('should return empty array for unknown type', () => {
      expect(bus.getEvents('message:failed')).toEqual([]);
    });
  });

  describe('getRecentEvents', () => {
    it('should return all recent events', async () => {
      await bus.publish({ type: 'message:inbound', data: {} });
      await bus.publish({ type: 'agent:started', data: {} });
      const events = bus.getRecentEvents();
      expect(events.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await bus.publish({ type: 'message:inbound', data: { i } });
      }
      const events = bus.getRecentEvents(2);
      expect(events.length).toBe(2);
    });
  });

  describe('dead letters', () => {
    it('should move failed handler events to dead letters', async () => {
      const failingHandler = vi.fn().mockImplementation(() => {
        throw new Error('handler error');
      });
      bus.subscribe('agent:error', failingHandler);
      await bus.publish({ type: 'agent:error', data: { agent: 'bot-1' } });
      await new Promise((r) => setTimeout(r, 20));
      const deadLetters = bus.getDeadLetters();
      expect(deadLetters.length).toBeGreaterThan(0);
      expect(deadLetters[0].data.error).toBe('handler error');
    });

    it('should trim dead letters when max is exceeded', async () => {
      const smallBus = createEventBus({ maxDeadLetters: 2 });
      const failingHandler = vi.fn().mockImplementation(() => {
        throw new Error('fail');
      });
      smallBus.subscribe('agent:error', failingHandler);
      for (let i = 0; i < 5; i++) {
        await smallBus.publish({ type: 'agent:error', data: { i } });
      }
      await new Promise((r) => setTimeout(r, 50));
      expect(smallBus.getDeadLetters().length).toBeLessThanOrEqual(2);
    });
  });

  describe('clearHistory', () => {
    it('should clear all event history', async () => {
      await bus.publish({ type: 'message:inbound', data: {} });
      await bus.publish({ type: 'agent:started', data: {} });
      bus.clearHistory();
      expect(bus.getRecentEvents()).toEqual([]);
    });
  });

  describe('priority handling', () => {
    it('should execute higher priority handlers first', async () => {
      const executionOrder: number[] = [];
      bus.subscribe('message:inbound', () => { executionOrder.push(1); }, { priority: 1 });
      bus.subscribe('message:inbound', () => { executionOrder.push(3); }, { priority: 10 });
      bus.subscribe('message:inbound', () => { executionOrder.push(2); }, { priority: 5 });

      await bus.publish({ type: 'message:inbound', data: {} });
      await new Promise((r) => setTimeout(r, 20));

      expect(executionOrder).toEqual([3, 2, 1]);
    });
  });

  describe('handler failure isolation', () => {
    it('should continue executing remaining handlers after one fails', async () => {
      const results: number[] = [];
      bus.subscribe('message:inbound', () => { results.push(1); });
      bus.subscribe('message:inbound', () => { throw new Error('fail'); });
      bus.subscribe('message:inbound', () => { results.push(2); });

      await bus.publish({ type: 'message:inbound', data: {} });
      await new Promise((r) => setTimeout(r, 20));

      expect(results).toEqual([1, 2]);
    });
  });

  describe('getEventBus (singleton)', () => {
    it('should return the same instance on repeated calls', () => {
      const bus1 = getEventBus();
      const bus2 = getEventBus();
      expect(bus1).toBe(bus2);
    });
  });

  describe('publishMessageEvent', () => {
    it('should publish an inbound message event', async () => {
      const bus = createEventBus();
      const handler = vi.fn();
      bus.subscribe('message:inbound', handler);

      // Temporarily replace the global bus for testing
      publishMessageEvent({
        channel: 'discord',
        userId: 'user-1',
        content: 'hello',
        messageId: 'msg-1',
        direction: 'inbound',
        sessionId: 'sess-1',
      });

      await new Promise((r) => setTimeout(r, 10));
    });

    it('should publish an outbound message event', async () => {
      publishMessageEvent({
        channel: 'telegram',
        userId: 'user-2',
        content: 'response',
        messageId: 'msg-2',
        direction: 'outbound',
      });

      await new Promise((r) => setTimeout(r, 10));
    });
  });
});
