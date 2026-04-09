import { describe, it, expect } from 'vitest';
import { createHealthChecker } from '../src/health/index.js';

describe('HealthChecker', () => {
  describe('register and check', () => {
    it('should register and run a healthy check', async () => {
      const checker = createHealthChecker();
      checker.register({
        name: 'test-ok',
        check: async () => true,
        required: true,
        timeout: 5000,
      });

      const status = await checker.check();
      expect(status.overall).toBe('healthy');
      expect(status.checks['test-ok'].status).toBe('healthy');
    });

    it('should fail when required check fails', async () => {
      const checker = createHealthChecker();
      checker.register({
        name: 'required-fail',
        check: async () => false,
        required: true,
        timeout: 5000,
      });

      const status = await checker.check();
      expect(status.overall).toBe('unhealthy');
    });

    it('should degrade when optional check fails', async () => {
      const checker = createHealthChecker();
      checker.register({
        name: 'optional-fail',
        check: async () => false,
        required: false,
        timeout: 5000,
      });

      const status = await checker.check();
      expect(status.overall).toBe('degraded');
    });
  });

  describe('unregister', () => {
    it('should unregister a check', async () => {
      const checker = createHealthChecker();
      checker.register({
        name: 'temp-check',
        check: async () => true,
        required: false,
        timeout: 5000,
      });

      expect(checker.unregister('temp-check')).toBe(true);

      const status = await checker.check();
      expect(status.checks['temp-check']).toBeUndefined();
    });
  });

  describe('getLastStatus', () => {
    it('should return last check result', async () => {
      const checker = createHealthChecker();
      checker.register({
        name: 'status-check',
        check: async () => true,
        required: true,
        timeout: 5000,
      });

      await checker.check();
      const last = checker.getLastStatus();
      expect(last).toBeDefined();
      expect(last?.overall).toBe('healthy');
    });
  });
});
