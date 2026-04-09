import { describe, it, expect, beforeEach } from 'vitest';
import { createRequestLogger } from '../src/request-logger/index.js';

describe('RequestLogger', () => {
  let logger: ReturnType<typeof createRequestLogger>;

  beforeEach(() => {
    logger = createRequestLogger({ maxInMemory: 100 });
  });

  describe('log and getRecent', () => {
    it('should log a request', () => {
      logger.log({
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        latencyMs: 50,
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });

      const recent = logger.getRecent(10);
      expect(recent.length).toBe(1);
      expect(recent[0].method).toBe('GET');
      expect(recent[0].path).toBe('/api/test');
    });

    it('should filter by method', () => {
      logger.log({ method: 'GET', path: '/a', statusCode: 200, latencyMs: 10, userAgent: '', ip: '127.0.0.1' });
      logger.log({ method: 'POST', path: '/b', statusCode: 201, latencyMs: 20, userAgent: '', ip: '127.0.0.1' });

      const posts = logger.getRecent(10, { method: 'POST' });
      expect(posts.length).toBe(1);
      expect(posts[0].method).toBe('POST');
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats', () => {
      logger.log({ method: 'GET', path: '/a', statusCode: 200, latencyMs: 100, userAgent: '', ip: '127.0.0.1' });
      logger.log({ method: 'POST', path: '/b', statusCode: 500, latencyMs: 200, userAgent: '', ip: '127.0.0.1' });

      const stats = logger.getStats();
      expect(stats.total).toBe(2);
      expect(stats.errorRate).toBe(0.5);
    });
  });
});
