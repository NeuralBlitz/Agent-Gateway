import { describe, it, expect, beforeEach } from 'vitest';
import { createCircuitBreaker, CircuitOpenError } from '../src/circuit-breaker/index.js';

describe('CircuitBreaker', () => {
  describe('execute', () => {
    it('should execute successful function', async () => {
      const cb = createCircuitBreaker('test-ok');
      const result = await cb.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should handle failed execution', async () => {
      const cb = createCircuitBreaker('test-fail', { failureThreshold: 2 });
      await expect(cb.execute(async () => { throw new Error('fail'); })).rejects.toThrow('fail');
    });

    it('should open circuit after threshold failures', async () => {
      const cb = createCircuitBreaker('test-open', { failureThreshold: 2, recoveryTimeoutMs: 5000 });
      // Fail twice
      for (let i = 0; i < 2; i++) {
        try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
      }
      expect(cb.getState()).toBe('open');
      // Should now throw CircuitOpenError
      await expect(cb.execute(async () => 'ok')).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('getState and reset', () => {
    it('should start in closed state', () => {
      const cb = createCircuitBreaker('test-state');
      expect(cb.getState()).toBe('closed');
    });

    it('should reset to closed', () => {
      const cb = createCircuitBreaker('test-reset', { failureThreshold: 1 });
      cb.open();
      expect(cb.getState()).toBe('open');
      cb.reset();
      expect(cb.getState()).toBe('closed');
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      const cb = createCircuitBreaker('test-stats');
      await cb.execute(async () => 'ok');
      const stats = cb.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalCalls).toBe('number');
    });
  });
});
