import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRegistry, createSchemaRegistry, SchemaDefinition } from '../src/schema-registry/index.js';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = createSchemaRegistry();
  });

  describe('createSchemaRegistry', () => {
    it('should create a SchemaRegistry instance', () => {
      expect(registry).toBeInstanceOf(SchemaRegistry);
    });
  });

  describe('register', () => {
    it('should register a schema', () => {
      const schema = registry.register({
        name: 'User',
        version: '1.0.0',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });

      expect(schema.name).toBe('User');
      expect(schema.version).toBe('1.0.0');
      expect(schema.createdAt).toBeDefined();
      expect(schema.deprecated).toBeUndefined();
    });

    it('should register multiple versions of same schema', () => {
      registry.register({
        name: 'User',
        version: '1.0.0',
        schema: { properties: { id: { type: 'number' } } },
      });
      registry.register({
        name: 'User',
        version: '2.0.0',
        schema: { properties: { id: { type: 'number' }, name: { type: 'string' } } },
      });

      const versions = registry.getVersions('User');
      expect(versions.length).toBe(2);
    });

    it('should emit schema:registered event', () => {
      const registeredHandler = new Promise<SchemaDefinition>((resolve) => {
        registry.on('schema:registered', resolve);
      });
      registry.register({
        name: 'EventSchema',
        version: '1.0.0',
        schema: { properties: {} },
      });
      return expect(registeredHandler).resolves.toHaveProperty('name', 'EventSchema');
    });

    it('should support description field', () => {
      const schema = registry.register({
        name: 'Described',
        version: '1.0.0',
        schema: { properties: {} },
        description: 'This is a described schema',
      });
      expect(schema.description).toBe('This is a described schema');
    });
  });

  describe('getLatest', () => {
    it('should return the latest registered version', () => {
      registry.register({
        name: 'Latest',
        version: '1.0.0',
        schema: { properties: { a: { type: 'string' } } },
      });
      registry.register({
        name: 'Latest',
        version: '2.0.0',
        schema: { properties: { a: { type: 'string' }, b: { type: 'number' } } },
      });

      const latest = registry.getLatest('Latest');
      expect(latest).not.toBeNull();
      expect(latest!.version).toBe('2.0.0');
    });

    it('should return null for unknown schema', () => {
      expect(registry.getLatest('Unknown')).toBeNull();
    });
  });

  describe('getVersion', () => {
    it('should return a specific version', () => {
      registry.register({
        name: 'Versioned',
        version: '1.0.0',
        schema: { properties: {} },
      });
      registry.register({
        name: 'Versioned',
        version: '2.0.0',
        schema: { properties: {} },
      });

      const v1 = registry.getVersion('Versioned', '1.0.0');
      expect(v1).not.toBeNull();
      expect(v1!.version).toBe('1.0.0');
    });

    it('should return null for non-existent version', () => {
      registry.register({
        name: 'SingleVer',
        version: '1.0.0',
        schema: { properties: {} },
      });
      expect(registry.getVersion('SingleVer', '99.0.0')).toBeNull();
    });

    it('should return null for unknown schema', () => {
      expect(registry.getVersion('Unknown', '1.0.0')).toBeNull();
    });
  });

  describe('getVersions', () => {
    it('should return all versions of a schema', () => {
      registry.register({ name: 'Multi', version: '1.0.0', schema: { properties: {} } });
      registry.register({ name: 'Multi', version: '1.1.0', schema: { properties: {} } });
      registry.register({ name: 'Multi', version: '2.0.0', schema: { properties: {} } });

      const versions = registry.getVersions('Multi');
      expect(versions.length).toBe(3);
      expect(versions.map((v) => v.version)).toEqual(['1.0.0', '1.1.0', '2.0.0']);
    });

    it('should return empty array for unknown schema', () => {
      expect(registry.getVersions('Unknown')).toEqual([]);
    });
  });

  describe('checkCompatibility', () => {
    it('should return FULL compatible when no changes', () => {
      registry.register({
        name: 'Compat',
        version: '1.0.0',
        schema: { properties: { id: { type: 'number' } } },
      });
      registry.register({
        name: 'Compat',
        version: '1.0.1',
        schema: { properties: { id: { type: 'number' } } },
      });

      const result = registry.checkCompatibility('Compat', '1.0.0', '1.0.1');
      expect(result.compatible).toBe(true);
      expect(result.type).toBe('FULL');
      expect(result.breakingChanges).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should detect removed property as breaking', () => {
      registry.register({
        name: 'Breaking',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
      });
      registry.register({
        name: 'Breaking',
        version: '2.0.0',
        schema: {
          properties: { id: { type: 'number' } },
          required: ['id'],
        },
      });

      const result = registry.checkCompatibility('Breaking', '1.0.0', '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.type).toBe('NONE');
      expect(result.breakingChanges.some((b) => b.includes("'name' removed"))).toBe(true);
    });

    it('should detect new required property as breaking', () => {
      registry.register({
        name: 'NewRequired',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' } },
          required: ['id'],
        },
      });
      registry.register({
        name: 'NewRequired',
        version: '2.0.0',
        schema: {
          properties: { id: { type: 'number' }, email: { type: 'string' } },
          required: ['id', 'email'],
        },
      });

      const result = registry.checkCompatibility('NewRequired', '1.0.0', '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.some((b) => b.includes("'email'"))).toBe(true);
    });

    it('should detect type change as breaking', () => {
      registry.register({
        name: 'TypeChange',
        version: '1.0.0',
        schema: { properties: { id: { type: 'number' } } },
      });
      registry.register({
        name: 'TypeChange',
        version: '2.0.0',
        schema: { properties: { id: { type: 'string' } } },
      });

      const result = registry.checkCompatibility('TypeChange', '1.0.0', '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.some((b) => b.includes("'id' type changed"))).toBe(true);
    });

    it('should return BACKWARD when property no longer required', () => {
      registry.register({
        name: 'Backward',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
      });
      registry.register({
        name: 'Backward',
        version: '2.0.0',
        schema: {
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id'],
        },
      });

      const result = registry.checkCompatibility('Backward', '1.0.0', '2.0.0');
      expect(result.compatible).toBe(true);
      expect(result.type).toBe('BACKWARD');
      expect(result.warnings.some((w) => w.includes("'name' is no longer required"))).toBe(true);
    });

    it('should return NONE when version not found', () => {
      registry.register({
        name: 'MissingVer',
        version: '1.0.0',
        schema: { properties: {} },
      });

      const result = registry.checkCompatibility('MissingVer', '1.0.0', '99.0.0');
      expect(result.compatible).toBe(false);
      expect(result.type).toBe('NONE');
      expect(result.breakingChanges).toContain('Version not found');
    });
  });

  describe('validate', () => {
    it('should validate valid data', () => {
      registry.register({
        name: 'ValidUser',
        version: '1.0.0',
        schema: {
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });

      const result = registry.validate('ValidUser', '1.0.0', { id: 1, name: 'Alice' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing required fields', () => {
      registry.register({
        name: 'RequiredUser',
        version: '1.0.0',
        schema: {
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });

      const result = registry.validate('RequiredUser', '1.0.0', { id: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should detect type mismatches', () => {
      registry.register({
        name: 'TypedUser',
        version: '1.0.0',
        schema: {
          properties: {
            age: { type: 'number' },
          },
        },
      });

      const result = registry.validate('TypedUser', '1.0.0', { age: 'not a number' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("'age'"))).toBe(true);
    });

    it('should detect enum violations', () => {
      registry.register({
        name: 'EnumUser',
        version: '1.0.0',
        schema: {
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
      });

      const result = registry.validate('EnumUser', '1.0.0', { status: 'unknown' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("'status'"))).toBe(true);
    });

    it('should detect minimum violations', () => {
      registry.register({
        name: 'MinUser',
        version: '1.0.0',
        schema: {
          properties: {
            age: { type: 'number', minimum: 18 },
          },
        },
      });

      const result = registry.validate('MinUser', '1.0.0', { age: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("'age'"))).toBe(true);
    });

    it('should detect maximum violations', () => {
      registry.register({
        name: 'MaxUser',
        version: '1.0.0',
        schema: {
          properties: {
            score: { type: 'number', maximum: 100 },
          },
        },
      });

      const result = registry.validate('MaxUser', '1.0.0', { score: 150 });
      expect(result.valid).toBe(false);
    });

    it('should detect minLength violations', () => {
      registry.register({
        name: 'MinLen',
        version: '1.0.0',
        schema: {
          properties: {
            name: { type: 'string', minLength: 3 },
          },
        },
      });

      const result = registry.validate('MinLen', '1.0.0', { name: 'ab' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("'name'"))).toBe(true);
    });

    it('should detect maxLength violations', () => {
      registry.register({
        name: 'MaxLen',
        version: '1.0.0',
        schema: {
          properties: {
            name: { type: 'string', maxLength: 5 },
          },
        },
      });

      const result = registry.validate('MaxLen', '1.0.0', { name: 'Alexander' });
      expect(result.valid).toBe(false);
    });

    it('should detect unknown fields when additionalProperties is false', () => {
      registry.register({
        name: 'StrictUser',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' } },
          additionalProperties: false,
        },
      });

      const result = registry.validate('StrictUser', '1.0.0', { id: 1, unknown: 'field' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown field'))).toBe(true);
    });

    it('should allow unknown fields when additionalProperties is not false', () => {
      registry.register({
        name: 'FlexibleUser',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' } },
        },
      });

      const result = registry.validate('FlexibleUser', '1.0.0', { id: 1, extra: 'ok' });
      expect(result.valid).toBe(true);
    });

    it('should use latest version when version is undefined', () => {
      registry.register({
        name: 'AutoVer',
        version: '1.0.0',
        schema: {
          properties: { id: { type: 'number' } },
          required: ['id'],
        },
      });
      registry.register({
        name: 'AutoVer',
        version: '2.0.0',
        schema: {
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
      });

      const result = registry.validate('AutoVer', undefined, { id: 1, name: 'test' });
      expect(result.valid).toBe(true);
    });

    it('should return error for unknown schema', () => {
      const result = registry.validate('NonExistent', '1.0.0', {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Schema not found'))).toBe(true);
    });

    it('should allow null values without type error', () => {
      registry.register({
        name: 'Nullable',
        version: '1.0.0',
        schema: {
          properties: { name: { type: 'string' } },
        },
      });

      const result = registry.validate('Nullable', '1.0.0', { name: null });
      expect(result.valid).toBe(true);
    });
  });

  describe('deprecate', () => {
    it('should deprecate a schema version', () => {
      registry.register({
        name: 'Deprecated',
        version: '1.0.0',
        schema: { properties: {} },
      });

      const result = registry.deprecate('Deprecated', '1.0.0');
      expect(result).toBe(true);

      const schema = registry.getVersion('Deprecated', '1.0.0');
      expect(schema!.deprecated).toBe(true);
    });

    it('should set successor', () => {
      registry.register({
        name: 'WithSuccessor',
        version: '1.0.0',
        schema: { properties: {} },
      });

      registry.deprecate('WithSuccessor', '1.0.0', 'WithSuccessor:2.0.0');
      const schema = registry.getVersion('WithSuccessor', '1.0.0');
      expect(schema!.successor).toBe('WithSuccessor:2.0.0');
    });

    it('should return false for non-existent version', () => {
      const result = registry.deprecate('NonExistent', '1.0.0');
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all schemas', () => {
      registry.register({ name: 'ListA', version: '1.0.0', schema: { properties: {} } });
      registry.register({ name: 'ListA', version: '2.0.0', schema: { properties: {} } });
      registry.register({ name: 'ListB', version: '1.0.0', schema: { properties: {} } });

      const list = registry.list();
      expect(list.length).toBe(2);

      const listA = list.find((s) => s.name === 'ListA');
      expect(listA).toBeDefined();
      expect(listA!.versions).toEqual(['1.0.0', '2.0.0']);
      expect(listA!.latest).toBe('2.0.0');
    });

    it('should return empty array when no schemas registered', () => {
      expect(registry.list()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return stats with no schemas', () => {
      const stats = registry.getStats();
      expect(stats.totalSchemas).toBe(0);
      expect(stats.totalVersions).toBe(0);
      expect(stats.deprecated).toBe(0);
    });

    it('should return accurate stats', () => {
      registry.register({ name: 'StatsA', version: '1.0.0', schema: { properties: {} } });
      registry.register({ name: 'StatsA', version: '2.0.0', schema: { properties: {} } });
      registry.register({ name: 'StatsB', version: '1.0.0', schema: { properties: {} } });
      registry.deprecate('StatsA', '1.0.0');

      const stats = registry.getStats();
      expect(stats.totalSchemas).toBe(2);
      expect(stats.totalVersions).toBe(3);
      expect(stats.deprecated).toBe(1);
    });
  });
});
