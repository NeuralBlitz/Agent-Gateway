import { describe, it, expect } from 'vitest';
import { createFeatureFlagManager } from '../src/feature-flags/index.js';

describe('FeatureFlagManager', () => {
  describe('register', () => {
    it('should register a boolean flag', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'test-bool', type: 'boolean', enabled: true, defaultValue: false, description: 'test' });
      const flag = manager.getFlag('test-bool');
      expect(flag).toBeDefined();
      expect(flag?.enabled).toBe(true);
    });

    it('should register a percentage flag', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'test-pct', type: 'percentage', enabled: true, defaultValue: false, rolloutPercentage: 50, description: 'test' });
      const flag = manager.getFlag('test-pct');
      expect(flag?.rolloutPercentage).toBe(50);
    });
  });

  describe('evaluate', () => {
    it('should return null for unknown flag', () => {
      const manager = createFeatureFlagManager();
      expect(manager.evaluate('nonexistent')).toBeNull();
    });

    it('should return defaultValue for disabled flag', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'disabled-flag', type: 'boolean', enabled: false, defaultValue: 'off', description: '' });
      expect(manager.evaluate('disabled-flag')).toBe('off');
    });

    it('should return true for enabled boolean flag', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'enabled-flag', type: 'boolean', enabled: true, defaultValue: false, description: '' });
      expect(manager.evaluate('enabled-flag')).toBe(true);
    });

    it('should respect tenant overrides', () => {
      const manager = createFeatureFlagManager();
      manager.register({
        key: 'tenant-flag',
        type: 'boolean',
        enabled: true,
        defaultValue: true,
        description: '',
        tenantOverrides: { 'tenant-b': false },
      });
      expect(manager.evaluate('tenant-flag', { tenantId: 'tenant-a' })).toBe(true);
      expect(manager.evaluate('tenant-flag', { tenantId: 'tenant-b' })).toBe(false);
    });

    it('should evaluate targeting rules', () => {
      const manager = createFeatureFlagManager();
      manager.register({
        key: 'targeted-flag',
        type: 'boolean',
        enabled: true,
        defaultValue: false,
        description: '',
        targetingRules: [{ attribute: 'channelId', operator: 'eq', value: 'telegram', result: true }],
      });
      expect(manager.evaluate('targeted-flag', { channelId: 'telegram' })).toBe(true);
    });
  });

  describe('toggle and rollout', () => {
    it('should toggle a flag', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'toggle-flag', type: 'boolean', enabled: true, defaultValue: false, description: '' });
      expect(manager.evaluate('toggle-flag')).toBe(true);
      manager.toggle('toggle-flag', false);
      expect(manager.evaluate('toggle-flag')).toBe(false);
    });

    it('should set rollout percentage', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'rollout-flag', type: 'percentage', enabled: true, defaultValue: false, rolloutPercentage: 0, description: '' });
      manager.setRollout('rollout-flag', 100);
      const flag = manager.getFlag('rollout-flag');
      expect(flag?.rolloutPercentage).toBe(100);
    });
  });

  describe('listFlags and stats', () => {
    it('should list all flags', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'a', type: 'boolean', enabled: true, defaultValue: false, description: '' });
      manager.register({ key: 'b', type: 'boolean', enabled: false, defaultValue: false, description: '' });
      const flags = manager.listFlags();
      expect(flags.some(f => f.key === 'a')).toBe(true);
      expect(flags.some(f => f.key === 'b')).toBe(true);
    });

    it('should return stats', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'a', type: 'boolean', enabled: true, defaultValue: false, description: '' });
      manager.evaluate('a');
      const stats = manager.getStats();
      expect(stats.totalFlags).toBe(1);
      expect(stats.enabledFlags).toBe(1);
      expect(stats.evaluationCount).toBe(1);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate all flags for a context', () => {
      const manager = createFeatureFlagManager();
      manager.register({ key: 'flag1', type: 'boolean', enabled: true, defaultValue: false, description: '' });
      manager.register({ key: 'flag2', type: 'boolean', enabled: false, defaultValue: false, description: '' });
      const results = manager.evaluateAll({ tenantId: 't1' });
      expect(results.flag1).toBe(true);
      expect(results.flag2).toBe(false);
    });
  });
});
