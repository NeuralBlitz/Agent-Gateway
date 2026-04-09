import { describe, it, expect } from 'vitest';
import { createApiVersionManager } from '../src/api-versioning/index.js';

describe('ApiVersionManager', () => {
  describe('getVersions', () => {
    it('should have v1 by default', () => {
      const manager = createApiVersionManager();
      const versions = manager.getVersions();
      expect(versions.some(v => v.version === 'v1')).toBe(true);
    });
  });

  describe('deprecate', () => {
    it('should set deprecation info on a version', () => {
      const manager = createApiVersionManager();
      manager.deprecate('v1', '2027-01-01', 'https://docs.example.com/migrate-v2');
      const versions = manager.getVersions();
      const v1 = versions.find(v => v.version === 'v1');
      expect(v1?.deprecatedAt).toBeDefined();
      expect(v1?.migrationGuide).toBe('https://docs.example.com/migrate-v2');
    });
  });

  describe('createRouter', () => {
    it('should create an Express router', () => {
      const manager = createApiVersionManager();
      const router = manager.createRouter();
      expect(router).toBeDefined();
      expect(typeof router.handle).toBe('function');
    });
  });
});
