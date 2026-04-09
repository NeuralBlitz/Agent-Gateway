import { describe, it, expect, beforeEach } from 'vitest';
import { createAuditLogger, getAuditLogger } from '../src/audit/index.js';
import { RateLimitManager, createRateLimitManager } from '../src/middleware/rate-limit.js';

describe('AuditLogger', () => {
  beforeEach(() => {
    // Reset global instance
    createAuditLogger({ persistToDisk: false, maxInMemory: 1000 });
  });

  it('should log an event and retrieve it', async () => {
    const audit = createAuditLogger({ persistToDisk: false, maxInMemory: 100 });
    await audit.log({
      type: 'auth:login',
      actor: 'user-123',
      actorType: 'user',
      sourceIp: '127.0.0.1',
      data: { method: 'password' },
    });

    const events = audit.getRecent(10);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('auth:login');
    expect(events[0].actor).toBe('user-123');
  });

  it('should chain hashes for tamper detection', async () => {
    const audit = createAuditLogger({ persistToDisk: false, maxInMemory: 100 });
    await audit.log({ type: 'system:start', actor: 'system', actorType: 'system', data: {} });
    await audit.log({ type: 'auth:login', actor: 'user-1', actorType: 'user', data: {} });
    await audit.log({ type: 'message:send', actor: 'user-1', actorType: 'user', data: {} });

    const result = audit.verifyChain();
    expect(result.valid).toBe(true);
  });

  it('should search by type', async () => {
    const audit = createAuditLogger({ persistToDisk: false, maxInMemory: 100 });
    await audit.log({ type: 'auth:login', actor: 'a', actorType: 'user', data: {} });
    await audit.log({ type: 'auth:login', actor: 'b', actorType: 'user', data: {} });
    await audit.log({ type: 'message:send', actor: 'a', actorType: 'user', data: {} });

    const logins = audit.searchByType('auth:login');
    expect(logins).toHaveLength(2);
  });

  it('should search by actor', async () => {
    const audit = createAuditLogger({ persistToDisk: false, maxInMemory: 100 });
    await audit.log({ type: 'auth:login', actor: 'alice', actorType: 'user', data: {} });
    await audit.log({ type: 'message:send', actor: 'bob', actorType: 'user', data: {} });
    await audit.log({ type: 'session:create', actor: 'alice', actorType: 'user', data: {} });

    const events = audit.searchByActor('alice');
    expect(events).toHaveLength(2);
  });

  it('should return stats', async () => {
    const audit = createAuditLogger({ persistToDisk: false, maxInMemory: 100 });
    await audit.log({ type: 'auth:login', actor: 'a', actorType: 'user', data: {} });
    await audit.log({ type: 'message:send', actor: 'a', actorType: 'user', data: {} });

    const stats = audit.getStats();
    expect(stats.totalEvents).toBe(2);
    expect(stats.eventTypes['auth:login']).toBe(1);
    expect(stats.eventTypes['message:send']).toBe(1);
  });
});

describe('RateLimitManager (enterprise)', () => {
  it('should create with default rules', () => {
    const manager = createRateLimitManager({ rules: RateLimitManager.defaultRules() });
    expect(manager).toBeDefined();
  });

  it('should add and remove rules', () => {
    const manager = createRateLimitManager();
    manager.addRule({ name: 'test-rule', max: 10, window: 60, keyFn: () => 'test' });
    manager.removeRule('test-rule');
  });

  it('should allow requests under limit', () => {
    const manager = createRateLimitManager({
      rules: [{ name: 'ip-limit', max: 5, window: 60, keyFn: () => 'ip:127.0.0.1' }],
    });

    // Simulate requests via the counter
    const result = (manager as any).memoryLimiter.check('ip:127.0.0.1', 5, 60);
    expect(result.allowed).toBe(true);
  });

  it('should rate limit when exceeded', () => {
    const limiter = (new RateLimitManager() as any).memoryLimiter;

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      limiter.check('test-key', 5, 60);
    }

    const result = limiter.check('test-key', 5, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset a key', () => {
    const limiter = (new RateLimitManager() as any).memoryLimiter;

    for (let i = 0; i < 5; i++) {
      limiter.check('reset-key', 5, 60);
    }

    limiter.reset('reset-key');
    const result = limiter.check('reset-key', 5, 60);
    expect(result.allowed).toBe(true);
  });

  it('should return default rules', () => {
    const rules = RateLimitManager.defaultRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r: any) => r.name === 'global')).toBe(true);
    expect(rules.some((r: any) => r.name === 'per-ip')).toBe(true);
    expect(rules.some((r: any) => r.name === 'per-user')).toBe(true);
  });
});
