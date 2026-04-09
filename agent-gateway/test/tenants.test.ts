import { describe, it, expect, beforeEach } from 'vitest';
import { TenantManager, createTenantManager } from '../src/tenants/index.js';

describe('TenantManager', () => {
  let manager: TenantManager;

  beforeEach(() => {
    manager = createTenantManager();
  });

  describe('registerTenant', () => {
    it('should register a tenant successfully', async () => {
      const tenant = await manager.registerTenant({
        id: 't1',
        name: 'Test Tenant',
        allowedProviders: ['openai', 'anthropic'],
        allowedChannels: ['telegram', 'discord'],
      });

      expect(tenant.id).toBe('t1');
      expect(tenant.name).toBe('Test Tenant');
      expect(tenant.createdAt).toBeGreaterThan(0);
    });

    it('should track usage on registration', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'Test',
        allowedProviders: [],
        allowedChannels: [],
      });

      const usage = manager.getUsage('t1');
      expect(usage).toBeDefined();
      expect(usage?.dailyTokens).toBe(0);
      expect(usage?.dailyRequests).toBe(0);
    });
  });

  describe('getTenant / listTenants', () => {
    it('should return undefined for unknown tenant', () => {
      expect(manager.getTenant('nonexistent')).toBeUndefined();
    });

    it('should return registered tenant', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const tenant = manager.getTenant('t1');
      expect(tenant?.name).toBe('T1');
    });

    it('should list all tenants', async () => {
      await manager.registerTenant({ id: 'a', name: 'A', allowedProviders: [], allowedChannels: [] });
      await manager.registerTenant({ id: 'b', name: 'B', allowedProviders: [], allowedChannels: [] });
      const tenants = manager.listTenants();
      expect(tenants).toHaveLength(2);
    });
  });

  describe('removeTenant', () => {
    it('should remove tenant and clean up API keys', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      manager.createApiKey('t1', 'test-key');
      const result = manager.removeTenant('t1');
      expect(result).toBe(true);
      expect(manager.getTenant('t1')).toBeUndefined();
      expect(manager.getUsage('t1')).toBeUndefined();
    });

    it('should return false for non-existent tenant', () => {
      expect(manager.removeTenant('nonexistent')).toBe(false);
    });
  });

  describe('API key management', () => {
    it('should create an API key', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const result = manager.createApiKey('t1', 'my-key', ['chat']);
      expect(result.key).toMatch(/^agw_t1_/);
      expect(result.keyId).toBeDefined();
    });

    it('should throw for unknown tenant', async () => {
      expect(() => manager.createApiKey('nonexistent', 'key')).toThrow('Tenant not found');
    });

    it('should validate a correct API key', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const { key } = manager.createApiKey('t1', 'valid-key');
      const result = manager.validateApiKey(key);
      expect(result).not.toBeNull();
      expect(result!.tenant.id).toBe('t1');
    });

    it('should reject an invalid API key', async () => {
      expect(manager.validateApiKey('invalid-key')).toBeNull();
    });

    it('should reject a revoked API key', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const { key, keyId } = manager.createApiKey('t1', 'revokable');
      manager.revokeApiKey(keyId);
      expect(manager.validateApiKey(key)).toBeNull();
    });

    it('should reject an expired API key', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const { key } = manager.createApiKey('t1', 'expiring', ['chat'], Date.now() - 1000);
      expect(manager.validateApiKey(key)).toBeNull();
    });

    it('should revoke API key by ID', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      const { keyId } = manager.createApiKey('t1', 'key');
      expect(manager.revokeApiKey(keyId)).toBe(true);
      expect(manager.revokeApiKey('nonexistent')).toBe(false);
    });
  });

  describe('usage tracking', () => {
    it('should record usage', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      manager.recordUsage('t1', 100);
      manager.recordUsage('t1', 200);

      const usage = manager.getUsage('t1');
      expect(usage?.dailyTokens).toBe(300);
      expect(usage?.dailyRequests).toBe(2);
    });

    it('should check limits — within bounds', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'T1',
        allowedProviders: [],
        allowedChannels: [],
        maxDailyTokens: 10000,
      });

      manager.recordUsage('t1', 500);
      expect(manager.checkLimits('t1')).toEqual({ allowed: true });
    });

    it('should check limits — token limit exceeded', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'T1',
        allowedProviders: [],
        allowedChannels: [],
        maxDailyTokens: 100,
      });

      manager.recordUsage('t1', 150);
      expect(manager.checkLimits('t1')).toEqual({ allowed: false, reason: 'Daily token limit exceeded' });
    });
  });

  describe('reset daily usage', () => {
    it('should reset usage for a specific tenant', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      await manager.registerTenant({ id: 't2', name: 'T2', allowedProviders: [], allowedChannels: [] });
      manager.recordUsage('t1', 100);
      manager.recordUsage('t2', 200);

      manager.resetDailyUsage('t1');

      expect(manager.getUsage('t1')?.dailyTokens).toBe(0);
      expect(manager.getUsage('t2')?.dailyTokens).toBe(200);
    });

    it('should reset all usage', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      await manager.registerTenant({ id: 't2', name: 'T2', allowedProviders: [], allowedChannels: [] });
      manager.recordUsage('t1', 100);
      manager.recordUsage('t2', 200);

      manager.resetDailyUsage();

      expect(manager.getUsage('t1')?.dailyTokens).toBe(0);
      expect(manager.getUsage('t2')?.dailyTokens).toBe(0);
    });
  });

  describe('provider and tool access', () => {
    it('should allow provider when allowedProviders is empty (no restriction)', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      expect(manager.canUseProvider('t1', 'openai')).toBe(true);
      expect(manager.canUseProvider('t1', 'any')).toBe(true);
    });

    it('should allow only whitelisted providers', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'T1',
        allowedProviders: ['openai'],
        allowedChannels: [],
      });
      expect(manager.canUseProvider('t1', 'openai')).toBe(true);
      expect(manager.canUseProvider('t1', 'anthropic')).toBe(false);
    });

    it('should deny tools when toolsEnabled is false', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'T1',
        allowedProviders: [],
        allowedChannels: [],
        toolsEnabled: false,
      });
      expect(manager.canUseTool('t1', 'bash')).toBe(false);
    });

    it('should allow all tools when allowedTools is empty', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      expect(manager.canUseTool('t1', 'bash')).toBe(true);
    });

    it('should allow only whitelisted tools', async () => {
      await manager.registerTenant({
        id: 't1',
        name: 'T1',
        allowedProviders: [],
        allowedChannels: [],
        toolsEnabled: true,
        allowedTools: ['bash', 'filesystem'],
      });
      expect(manager.canUseTool('t1', 'bash')).toBe(true);
      expect(manager.canUseTool('t1', 'web_search')).toBe(false);
    });
  });

  describe('stats', () => {
    it('should return correct stats', async () => {
      await manager.registerTenant({ id: 't1', name: 'T1', allowedProviders: [], allowedChannels: [] });
      manager.createApiKey('t1', 'key1');
      manager.createApiKey('t1', 'key2');

      const stats = manager.getStats();
      expect(stats.tenantCount).toBe(1);
      expect(stats.apiKeyCount).toBe(2);
    });
  });
});
