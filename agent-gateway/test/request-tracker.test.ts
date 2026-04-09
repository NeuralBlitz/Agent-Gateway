import { describe, it, expect, beforeEach } from 'vitest';
import { RequestTracker, createRequestTracker, RequestTrace } from '../src/request-tracker/index.js';

describe('RequestTracker', () => {
  let tracker: RequestTracker;

  beforeEach(() => {
    tracker = createRequestTracker(10000);
  });

  describe('createRequestTracker', () => {
    it('should create a RequestTracker instance', () => {
      expect(tracker).toBeInstanceOf(RequestTracker);
    });

    it('should accept custom maxTraces', () => {
      const custom = createRequestTracker(500);
      expect(custom).toBeInstanceOf(RequestTracker);
    });

    it('should default to 100000 max traces', () => {
      const defaultTracker = createRequestTracker();
      expect(defaultTracker).toBeInstanceOf(RequestTracker);
    });
  });

  describe('startTrace', () => {
    it('should create a trace with required fields', () => {
      const trace = tracker.startTrace('my-service', 'my-operation');
      expect(trace.traceId).toBeDefined();
      expect(trace.spanId).toBeDefined();
      expect(trace.serviceName).toBe('my-service');
      expect(trace.operation).toBe('my-operation');
      expect(trace.status).toBe('ok');
      expect(trace.startTime).toBeDefined();
      expect(trace.tags).toEqual({});
      expect(trace.logs).toEqual([]);
      expect(trace.children).toEqual([]);
    });

    it('should create unique trace IDs', () => {
      const t1 = tracker.startTrace('svc', 'op1');
      const t2 = tracker.startTrace('svc', 'op2');
      expect(t1.traceId).not.toBe(t2.traceId);
      expect(t1.spanId).not.toBe(t2.spanId);
    });

    it('should set parentSpanId when provided', () => {
      const parent = tracker.startTrace('svc', 'parent');
      const child = tracker.startTrace('svc', 'child', parent.spanId);
      expect(child.parentSpanId).toBe(parent.spanId);
    });

    it('should link child to parent', () => {
      const parent = tracker.startTrace('svc', 'parent');
      const child = tracker.startTrace('svc', 'child', parent.spanId);
      expect(parent.children).toContain(child.spanId);
    });

    it('should handle missing parent gracefully', () => {
      const trace = tracker.startTrace('svc', 'orphan', 'non-existent-parent');
      expect(trace.parentSpanId).toBe('non-existent-parent');
    });

    it('should emit trace:complete event on endTrace', () => {
      const completeHandler = new Promise<RequestTrace>((resolve) => {
        tracker.on('trace:complete', resolve);
      });
      const trace = tracker.startTrace('event-svc', 'event-op');
      tracker.endTrace(trace.spanId);
      return expect(completeHandler).resolves.toHaveProperty('spanId', trace.spanId);
    });
  });

  describe('endTrace', () => {
    it('should end a trace with ok status', () => {
      const trace = tracker.startTrace('svc', 'op');
      const completed = tracker.endTrace(trace.spanId);
      expect(completed).not.toBeNull();
      expect(completed!.endTime).toBeDefined();
      expect(completed!.status).toBe('ok');
    });

    it('should end a trace with error status', () => {
      const trace = tracker.startTrace('svc', 'op');
      const completed = tracker.endTrace(trace.spanId, 'error');
      expect(completed!.status).toBe('error');
    });

    it('should default to ok status', () => {
      const trace = tracker.startTrace('svc', 'op');
      const completed = tracker.endTrace(trace.spanId);
      expect(completed!.status).toBe('ok');
    });

    it('should return null for non-existent span', () => {
      const result = tracker.endTrace('non-existent-span');
      expect(result).toBeNull();
    });

    it('should set endTime', () => {
      const trace = tracker.startTrace('svc', 'op');
      const before = Date.now();
      const completed = tracker.endTrace(trace.spanId);
      expect(completed!.endTime).toBeGreaterThanOrEqual(before - 1);
    });
  });

  describe('tag', () => {
    it('should add a tag to a trace', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.tag(trace.spanId, 'http.status', 200);
      expect(trace.tags['http.status']).toBe(200);
    });

    it('should add multiple tags', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.tag(trace.spanId, 'key1', 'val1');
      tracker.tag(trace.spanId, 'key2', 42);
      expect(trace.tags['key1']).toBe('val1');
      expect(trace.tags['key2']).toBe(42);
    });

    it('should silently ignore non-existent span', () => {
      expect(() => tracker.tag('non-existent', 'key', 'value')).not.toThrow();
    });

    it('should overwrite existing tag', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.tag(trace.spanId, 'status', 200);
      tracker.tag(trace.spanId, 'status', 500);
      expect(trace.tags['status']).toBe(500);
    });
  });

  describe('log', () => {
    it('should add a log entry to a trace', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.log(trace.spanId, 'test log message');
      expect(trace.logs.length).toBe(1);
      expect(trace.logs[0].message).toBe('test log message');
      expect(trace.logs[0].level).toBe('info');
      expect(trace.logs[0].timestamp).toBeDefined();
    });

    it('should support custom log level', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.log(trace.spanId, 'error occurred', 'error');
      expect(trace.logs[0].level).toBe('error');
    });

    it('should support multiple log entries', () => {
      const trace = tracker.startTrace('svc', 'op');
      tracker.log(trace.spanId, 'log 1');
      tracker.log(trace.spanId, 'log 2', 'warn');
      expect(trace.logs.length).toBe(2);
    });

    it('should silently ignore non-existent span', () => {
      expect(() => tracker.log('non-existent', 'message')).not.toThrow();
    });
  });

  describe('getTrace', () => {
    it('should return a trace by spanId', () => {
      const trace = tracker.startTrace('svc', 'op');
      const found = tracker.getTrace(trace.spanId);
      expect(found).toBeDefined();
      expect(found!.spanId).toBe(trace.spanId);
    });

    it('should return undefined for non-existent span', () => {
      expect(tracker.getTrace('non-existent')).toBeUndefined();
    });
  });

  describe('getTraceTree', () => {
    it('should return all traces for a traceId', () => {
      const parent = tracker.startTrace('svc', 'parent');
      const child1 = tracker.startTrace('svc', 'child1', parent.spanId);
      const child2 = tracker.startTrace('svc', 'child2', parent.spanId);

      const tree = tracker.getTraceTree(parent.traceId);
      expect(tree.length).toBe(3);
      expect(tree.map((t) => t.spanId)).toContain(parent.spanId);
      expect(tree.map((t) => t.spanId)).toContain(child1.spanId);
      expect(tree.map((t) => t.spanId)).toContain(child2.spanId);
    });

    it('should return empty array for non-existent traceId', () => {
      expect(tracker.getTraceTree('non-existent-trace')).toEqual([]);
    });
  });

  describe('getRecent', () => {
    it('should return recent traces sorted by startTime', () => {
      tracker.startTrace('svc', 'op1');
      tracker.startTrace('svc', 'op2');
      tracker.startTrace('svc', 'op3');

      const recent = tracker.getRecent(2);
      expect(recent.length).toBe(2);
      expect(recent[0].startTime).toBeGreaterThanOrEqual(recent[1].startTime);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        tracker.startTrace('svc', `op-${i}`);
      }
      const recent = tracker.getRecent(3);
      expect(recent.length).toBe(3);
    });

    it('should default to 100 limit', () => {
      expect(tracker.getRecent().length).toBe(0);
    });
  });

  describe('getErrors', () => {
    it('should return only error traces', () => {
      const okTrace = tracker.startTrace('svc', 'ok-op');
      const errorTrace = tracker.startTrace('svc', 'error-op');
      tracker.endTrace(okTrace.spanId, 'ok');
      tracker.endTrace(errorTrace.spanId, 'error');

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].spanId).toBe(errorTrace.spanId);
    });

    it('should sort errors by startTime descending', () => {
      const e1 = tracker.startTrace('svc', 'e1');
      const e2 = tracker.startTrace('svc', 'e2');
      tracker.endTrace(e1.spanId, 'error');
      tracker.endTrace(e2.spanId, 'error');

      const errors = tracker.getErrors();
      expect(errors[0].startTime).toBeGreaterThanOrEqual(errors[1].startTime);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        const t = tracker.startTrace('svc', `err-${i}`);
        tracker.endTrace(t.spanId, 'error');
      }
      const errors = tracker.getErrors(3);
      expect(errors.length).toBe(3);
    });
  });

  describe('getByService', () => {
    it('should return traces for a specific service', () => {
      tracker.startTrace('svc-a', 'op1');
      tracker.startTrace('svc-b', 'op2');
      tracker.startTrace('svc-a', 'op3');

      const traces = tracker.getByService('svc-a');
      expect(traces.length).toBe(2);
      expect(traces.every((t) => t.serviceName === 'svc-a')).toBe(true);
    });

    it('should return empty array for unknown service', () => {
      expect(tracker.getByService('unknown')).toEqual([]);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 5; i++) {
        tracker.startTrace('svc', `op-${i}`);
      }
      const traces = tracker.getByService('svc', 2);
      expect(traces.length).toBe(2);
    });
  });

  describe('getByOperation', () => {
    it('should return traces for a specific operation', () => {
      tracker.startTrace('svc', 'db-query');
      tracker.startTrace('svc', 'http-call');
      tracker.startTrace('svc', 'db-query');

      const traces = tracker.getByOperation('db-query');
      expect(traces.length).toBe(2);
      expect(traces.every((t) => t.operation === 'db-query')).toBe(true);
    });

    it('should return empty array for unknown operation', () => {
      expect(tracker.getByOperation('unknown')).toEqual([]);
    });
  });

  describe('getLatencyPercentiles', () => {
    it('should return zero percentiles when no completed traces', () => {
      const percentiles = tracker.getLatencyPercentiles();
      expect(percentiles).toEqual({ p50: 0, p95: 0, p99: 0, avg: 0 });
    });

    it('should calculate percentiles for completed traces', () => {
      for (let i = 0; i < 100; i++) {
        const trace = tracker.startTrace('svc', `op-${i}`);
        tracker.endTrace(trace.spanId);
      }
      const percentiles = tracker.getLatencyPercentiles();
      expect(percentiles.p50).toBeGreaterThanOrEqual(0);
      expect(percentiles.p95).toBeGreaterThanOrEqual(percentiles.p50);
      expect(percentiles.p99).toBeGreaterThanOrEqual(percentiles.p95);
      expect(percentiles.avg).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStats', () => {
    it('should return stats with no traces', () => {
      const stats = tracker.getStats();
      expect(stats.totalTraces).toBe(0);
      expect(stats.completedTraces).toBe(0);
      expect(stats.errorTraces).toBe(0);
      expect(stats.avgDurationMs).toBe(0);
      expect(stats.byService).toEqual({});
      expect(stats.byOperation).toEqual({});
    });

    it('should return accurate stats', () => {
      const t1 = tracker.startTrace('svc-a', 'op1');
      const t2 = tracker.startTrace('svc-b', 'op2');
      tracker.endTrace(t1.spanId, 'ok');
      tracker.endTrace(t2.spanId, 'error');

      const stats = tracker.getStats();
      expect(stats.totalTraces).toBe(2);
      expect(stats.completedTraces).toBe(2);
      expect(stats.errorTraces).toBe(1);
      expect(stats.byService['svc-a']).toBe(1);
      expect(stats.byService['svc-b']).toBe(1);
      expect(stats.byOperation['op1']).toBe(1);
      expect(stats.byOperation['op2']).toBe(1);
    });

    it('should count unclosed traces separately', () => {
      tracker.startTrace('svc', 'open');
      const stats = tracker.getStats();
      expect(stats.totalTraces).toBe(1);
      expect(stats.completedTraces).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all traces', () => {
      tracker.startTrace('svc', 'op1');
      tracker.startTrace('svc', 'op2');
      tracker.clear();
      expect(tracker.getStats().totalTraces).toBe(0);
    });

    it('should work when already empty', () => {
      expect(() => tracker.clear()).not.toThrow();
    });
  });

  describe('maxTraces enforcement', () => {
    it('should evict oldest traces when max is exceeded', () => {
      const smallTracker = createRequestTracker(3);
      const t1 = smallTracker.startTrace('svc', 'op1');
      smallTracker.startTrace('svc', 'op2');
      smallTracker.startTrace('svc', 'op3');
      smallTracker.startTrace('svc', 'op4');

      expect(smallTracker.getTrace(t1.spanId)).toBeUndefined();
      expect(smallTracker.getStats().totalTraces).toBe(3);
    });
  });
});
