import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageBus, createMessageBus, BusMessage } from '../src/message-bus/index.js';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = createMessageBus(1000, 100);
  });

  describe('createMessageBus', () => {
    it('should create a MessageBus instance', () => {
      expect(bus).toBeInstanceOf(MessageBus);
    });

    it('should accept custom maxHistory and maxDeadLetters', () => {
      const customBus = createMessageBus(500, 50);
      expect(customBus).toBeInstanceOf(MessageBus);
    });
  });

  describe('publish', () => {
    it('should publish a message and return it', async () => {
      const message = await bus.publish('test-topic', { data: 'value' });
      expect(message).toBeDefined();
      expect(message.topic).toBe('test-topic');
      expect(message.payload).toEqual({ data: 'value' });
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it('should assign a unique id to each message', async () => {
      const m1 = await bus.publish('topic', 'a');
      const m2 = await bus.publish('topic', 'b');
      expect(m1.id).not.toBe(m2.id);
    });

    it('should include custom headers', async () => {
      const message = await bus.publish('topic', 'payload', { 'x-custom': 'value' });
      expect(message.headers['x-custom']).toBe('value');
    });

    it('should set x-message-id header', async () => {
      const message = await bus.publish('topic', 'payload');
      expect(message.headers['x-message-id']).toBe(message.id);
    });

    it('should set x-timestamp header', async () => {
      const message = await bus.publish('topic', 'payload');
      expect(message.headers['x-timestamp']).toBeDefined();
    });

    it('should set correlationId from headers', async () => {
      const message = await bus.publish('topic', 'payload', { 'x-correlation-id': 'corr-123' });
      expect(message.correlationId).toBe('corr-123');
    });

    it('should set source', async () => {
      const message = await bus.publish('topic', 'payload', {}, 'my-service');
      expect(message.source).toBe('my-service');
    });

    it('should store message in history', async () => {
      await bus.publish('history-topic', 'data');
      const history = bus.getHistory('history-topic');
      expect(history.length).toBe(1);
      expect(history[0].payload).toBe('data');
    });
  });

  describe('subscribe', () => {
    it('should receive published messages', async () => {
      const handler = vi.fn();
      bus.subscribe('sub-topic', handler);
      await bus.publish('sub-topic', { key: 'value' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload).toEqual({ key: 'value' });
    });

    it('should return an unsubscribe function', async () => {
      const handler = vi.fn();
      const unsubscribe = bus.subscribe('unsub-topic', handler);
      await bus.publish('unsub-topic', 'first');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await bus.publish('unsub-topic', 'second');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers on same topic', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.subscribe('multi-topic', h1);
      bus.subscribe('multi-topic', h2);

      await bus.publish('multi-topic', 'data');
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it('should not receive messages from other topics', async () => {
      const handler = vi.fn();
      bus.subscribe('topic-a', handler);
      await bus.publish('topic-b', 'data');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('subscribeAll (wildcard)', () => {
    it('should receive messages from all topics', async () => {
      const handler = vi.fn();
      bus.subscribeAll(handler);

      await bus.publish('topic-1', 'data1');
      await bus.publish('topic-2', 'data2');
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should return an unsubscribe function', async () => {
      const handler = vi.fn();
      const unsubscribe = bus.subscribeAll(handler);
      await bus.publish('wild-1', 'a');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await bus.publish('wild-2', 'b');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('pattern matching handlers', () => {
    it('should match wildcard pattern with *', async () => {
      const handler = vi.fn();
      bus.subscribe('user.*', handler);

      await bus.publish('user.created', { id: 1 });
      await bus.publish('user.deleted', { id: 2 });
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should match ? single character wildcard', async () => {
      const handler = vi.fn();
      bus.subscribe('log.?', handler);

      await bus.publish('log.a', 'data');
      await bus.publish('log.ab', 'data');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not match non-matching pattern', async () => {
      const handler = vi.fn();
      bus.subscribe('api.*', handler);

      await bus.publish('web.request', 'data');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return all history when no topic specified', async () => {
      await bus.publish('h1', 'a');
      await bus.publish('h2', 'b');
      const history = bus.getHistory();
      expect(history.length).toBe(2);
    });

    it('should filter by topic', async () => {
      await bus.publish('topic-a', 'a');
      await bus.publish('topic-b', 'b');
      await bus.publish('topic-a', 'c');
      const history = bus.getHistory('topic-a');
      expect(history.length).toBe(2);
      expect(history.every((m) => m.topic === 'topic-a')).toBe(true);
    });

    it('should respect limit', async () => {
      for (let i = 0; i < 20; i++) {
        await bus.publish('limit-topic', `msg-${i}`);
      }
      const history = bus.getHistory('limit-topic', 5);
      expect(history.length).toBe(5);
    });
  });

  describe('replay', () => {
    it('should replay messages for a topic', async () => {
      await bus.publish('replay-topic', 'msg1');
      await bus.publish('replay-topic', 'msg2');

      const handler = vi.fn();
      const count = await bus.replay('replay-topic', handler);
      expect(count).toBe(2);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should replay with since filter', async () => {
      await bus.publish('replay-since', 'old');
      await new Promise((r) => setTimeout(r, 5)); // Ensure different timestamp
      const sinceTime = Date.now();
      await bus.publish('replay-since', 'new');

      const handler = vi.fn();
      const count = await bus.replay('replay-since', handler, sinceTime);
      expect(count).toBe(1);
    });

    it('should handle replay handler errors gracefully', async () => {
      await bus.publish('replay-err', 'msg');
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('replay error');
      });
      const count = await bus.replay('replay-err', handler);
      expect(count).toBe(0);
    });

    it('should return 0 for topic with no messages', async () => {
      const count = await bus.replay('nonexistent', vi.fn());
      expect(count).toBe(0);
    });
  });

  describe('dead letters', () => {
    it('should store failed messages as dead letters', async () => {
      const failingHandler = vi.fn().mockImplementation(() => {
        throw new Error('handler error');
      });
      bus.subscribe('dead-topic', failingHandler);

      await bus.publish('dead-topic', 'data');
      const deadLetters = bus.getDeadLetters();
      expect(deadLetters.length).toBe(1);
      expect(deadLetters[0].topic).toBe('dead-topic');
      expect(deadLetters[0].headers['x-error']).toBe('handler error');
    });

    it('should respect maxDeadLetters limit', async () => {
      const smallBus = createMessageBus(1000, 3);
      const failingHandler = vi.fn().mockImplementation(() => {
        throw new Error('fail');
      });

      for (let i = 0; i < 5; i++) {
        smallBus.subscribe(`dlq-topic-${i}`, failingHandler);
        await smallBus.publish(`dlq-topic-${i}`, `msg-${i}`);
      }

      const deadLetters = smallBus.getDeadLetters();
      expect(deadLetters.length).toBeLessThanOrEqual(3);
    });

    it('should return dead letters with limit', async () => {
      for (let i = 0; i < 5; i++) {
        const failingHandler = vi.fn().mockImplementation(() => {
          throw new Error(`error-${i}`);
        });
        bus.subscribe(`dl-topic-${i}`, failingHandler);
        await bus.publish(`dl-topic-${i}`, `msg-${i}`);
      }

      const deadLetters = bus.getDeadLetters(2);
      expect(deadLetters.length).toBe(2);
    });

    it('should retry a dead letter', async () => {
      const handler = vi.fn().mockImplementationOnce(() => {
        throw new Error('first fail');
      });
      bus.subscribe('retry-dl-topic', handler);

      await bus.publish('retry-dl-topic', 'data');
      const deadLetters = bus.getDeadLetters();
      expect(deadLetters.length).toBe(1);

      const result = await bus.retryDeadLetter(deadLetters[0]);
      expect(result).toBe(true);
      expect(bus.getDeadLetters().length).toBe(0);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should return false when retrying non-existent dead letter', async () => {
      const result = await bus.retryDeadLetter({ id: 'non-existent', topic: 'x', payload: null, headers: {}, timestamp: 0 } as BusMessage);
      expect(result).toBe(false);
    });

    it('should clear all dead letters', async () => {
      for (let i = 0; i < 3; i++) {
        const failingHandler = vi.fn().mockImplementation(() => {
          throw new Error('fail');
        });
        bus.subscribe(`clear-topic-${i}`, failingHandler);
        await bus.publish(`clear-topic-${i}`, `msg-${i}`);
      }

      const cleared = bus.clearDeadLetters();
      expect(cleared).toBe(3);
      expect(bus.getDeadLetters().length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      bus.subscribe('stats-topic', vi.fn());
      await bus.publish('stats-topic', 'data');
      const stats = bus.getStats();

      expect(stats.topics).toBeGreaterThanOrEqual(1);
      expect(stats.totalHandlers).toBeGreaterThanOrEqual(1);
      expect(stats.historySize).toBe(1);
      expect(stats.deadLetterCount).toBe(0);
      expect(stats.byTopic).toHaveProperty('stats-topic');
    });

    it('should track byTopic correctly', async () => {
      await bus.publish('t1', 'a');
      await bus.publish('t1', 'b');
      await bus.publish('t2', 'c');

      const stats = bus.getStats();
      expect(stats.byTopic['t1']).toBe(2);
      expect(stats.byTopic['t2']).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit message event', async () => {
      const messageHandler = vi.fn();
      bus.on('message', messageHandler);
      await bus.publish('event-topic', 'data');
      expect(messageHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit message:{topic} event', async () => {
      const topicHandler = vi.fn();
      bus.on('message:my-topic', topicHandler);
      await bus.publish('my-topic', 'data');
      expect(topicHandler).toHaveBeenCalledTimes(1);
      expect(topicHandler.mock.calls[0][0].topic).toBe('my-topic');
    });
  });

  describe('maxHistory', () => {
    it('should cap history at maxHistory', async () => {
      const smallBus = createMessageBus(5, 100);
      for (let i = 0; i < 10; i++) {
        await smallBus.publish('cap-topic', `msg-${i}`);
      }
      expect(smallBus.getHistory().length).toBe(5);
    });
  });

  describe('multiple handler failures', () => {
    it('should continue delivering to other handlers when one fails', async () => {
      const failing = vi.fn().mockImplementation(() => {
        throw new Error('fail');
      });
      const success = vi.fn();

      bus.subscribe('partial-fail', failing);
      bus.subscribe('partial-fail', success);

      await bus.publish('partial-fail', 'data');
      expect(failing).toHaveBeenCalledTimes(1);
      expect(success).toHaveBeenCalledTimes(1);
    });
  });
});
