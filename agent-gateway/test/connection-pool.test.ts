import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createConnectionPool } from '../src/connection-pool/index.js';

describe('ConnectionPool', () => {
  let pool: ReturnType<typeof createConnectionPool>;

  beforeEach(async () => {
    let connectionCounter = 0;
    pool = createConnectionPool({
      create: async () => { connectionCounter++; return { id: connectionCounter, healthy: true }; },
      destroy: async () => {},
      validate: async () => true,
    }, { max: 5, min: 0, acquireTimeoutMs: 1000 });
    await pool.init();
  });

  afterEach(async () => {
    await pool.close();
  });

  describe('use helper', () => {
    it('should acquire, use, and release automatically', async () => {
      const result = await pool.use(async (conn: any) => conn.id);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('stats', () => {
    it('should return pool stats', () => {
      const stats = pool.getStats();
      expect(stats).toBeDefined();
    });
  });
});
