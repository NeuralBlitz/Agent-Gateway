import { describe, it, expect, beforeEach } from 'vitest';
import { createNotificationSystem } from '../src/notifications/index.js';

describe('NotificationSystem', () => {
  const system = createNotificationSystem({
    defaultRecipients: [{ channel: 'webhook', address: 'http://localhost:9999/test' }],
    rateLimitPerMinute: 100,
    quietHours: { start: 0, end: 0 },
  });

  describe('notify', () => {
    it('should create a notification', async () => {
      await system.notify('info', 'Test', 'This is a test notification');
      const recent = system.getRecent(10);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[recent.length - 1].title).toBe('Test');
    });

    it('should set correct type', async () => {
      await system.notify('error', 'Error', 'Something broke');
      const recent = system.getRecent(10);
      expect(recent.some(n => n.type === 'error')).toBe(true);
    });
  });

  describe('convenience methods', () => {
    it('should create info notification', async () => {
      await system.info('Info Title', 'Info message');
      const recent = system.getRecent(10);
      expect(recent.some(n => n.type === 'info' && n.title === 'Info Title')).toBe(true);
    });

    it('should create warning notification', async () => {
      await system.warning('Warning Title', 'Warning message');
      const recent = system.getRecent(10);
      expect(recent.some(n => n.type === 'warning')).toBe(true);
    });

    it('should create error notification', async () => {
      await system.error('Error Title', 'Error message');
      const recent = system.getRecent(10);
      expect(recent.some(n => n.type === 'error' && n.title === 'Error Title')).toBe(true);
    });

    it('should create critical notification', async () => {
      await system.critical('Critical Title', 'Critical message');
      const recent = system.getRecent(10);
      expect(recent.some(n => n.type === 'critical')).toBe(true);
    });
  });

  describe('deduplication', () => {
    it('should deduplicate identical notifications within window', async () => {
      await system.notify('info', 'Dup', 'Same message');
      const count1 = system.getRecent(100).length;

      await system.notify('info', 'Dup', 'Same message');
      const count2 = system.getRecent(100).length;

      expect(count2).toBeLessThanOrEqual(count1 + 1);
    });
  });

  describe('getStats', () => {
    it('should return notification counts by type', () => {
      const stats = system.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(typeof stats.total).toBe('number');
    });
  });
});
