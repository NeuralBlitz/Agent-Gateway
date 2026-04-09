import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createConfigManager } from '../src/config-manager/index.js';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigManager', () => {
  const configPath = join(tmpdir(), `agw-config-test-${Date.now()}.json`);

  beforeEach(() => {
    if (existsSync(configPath)) rmSync(configPath, { force: true });
    writeFileSync(configPath, JSON.stringify({ app: { name: 'test' }, db: { host: 'localhost' } }));
  });

  afterEach(() => {
    if (existsSync(configPath)) rmSync(configPath, { force: true });
  });

  describe('load and get', () => {
    it('should load config from file', () => {
      const cm = createConfigManager({ filePath: configPath });
      cm.load();
      expect(cm.get('app.name')).toBe('test');
    });

    it('should return default value for missing key', () => {
      const cm = createConfigManager({ filePath: configPath });
      cm.load();
      expect(cm.get('missing.key', 'default')).toBe('default');
    });
  });

  describe('set', () => {
    it('should update a config value', () => {
      const cm = createConfigManager({ filePath: configPath });
      cm.load();
      cm.set('app.name', 'updated', 'api');
      expect(cm.get('app.name')).toBe('updated');
    });
  });

  describe('getAll', () => {
    it('should return full config', () => {
      const cm = createConfigManager({ filePath: configPath });
      cm.load();
      const all = cm.getAll();
      expect(all.app).toBeDefined();
      expect(all.db).toBeDefined();
    });
  });

  describe('getHistory', () => {
    it('should track config changes', () => {
      const cm = createConfigManager({ filePath: configPath });
      cm.load();
      cm.set('app.name', 'v2', 'api');
      const history = cm.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
