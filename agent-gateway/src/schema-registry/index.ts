// @ts-nocheck
/**
 * Enterprise Schema Registry
 * JSON Schema-based request/response validation with versioning,
 * compatibility checking, and automatic documentation.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface SchemaDefinition {
  name: string;
  version: string;
  schema: Record<string, any>;
  description?: string;
  deprecated?: boolean;
  successor?: string; // name:version of successor
  createdAt: number;
}

export interface SchemaCompatibilityResult {
  compatible: boolean;
  type: 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
  breakingChanges: string[];
  warnings: string[];
}

export class SchemaRegistry extends EventEmitter {
  private schemas: Map<string, SchemaDefinition[]> = new Map();

  /** Register a schema */
  register(schema: Omit<SchemaDefinition, 'createdAt'>): SchemaDefinition {
    const full: SchemaDefinition = { ...schema, createdAt: Date.now() };
    const versions = this.schemas.get(schema.name) || [];
    versions.push(full);
    this.schemas.set(schema.name, versions);

    logger.info({ name: schema.name, version: schema.version }, 'Schema registered');
    this.emit('schema:registered', full);
    return full;
  }

  /** Get latest schema version */
  getLatest(name: string): SchemaDefinition | null {
    const versions = this.schemas.get(name);
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  /** Get specific version */
  getVersion(name: string, version: string): SchemaDefinition | null {
    const versions = this.schemas.get(name);
    if (!versions) return null;
    return versions.find((s) => s.version === version) || null;
  }

  /** Get all versions */
  getVersions(name: string): SchemaDefinition[] {
    return this.schemas.get(name) || [];
  }

  /** Check compatibility between versions */
  checkCompatibility(name: string, oldVersion: string, newVersion: string): SchemaCompatibilityResult {
    const oldSchema = this.getVersion(name, oldVersion);
    const newSchema = this.getVersion(name, newVersion);

    if (!oldSchema || !newSchema) {
      return { compatible: false, type: 'NONE', breakingChanges: ['Version not found'], warnings: [] };
    }

    const breakingChanges: string[] = [];
    const warnings: string[] = [];

    const oldProps = oldSchema.schema.properties || {};
    const newProps = newSchema.schema.properties || {};
    const oldRequired = new Set(oldSchema.schema.required || []);
    const newRequired = new Set(newSchema.schema.required || []);

    // Check removed required properties
    for (const prop of oldRequired) {
      if (!newRequired.has(prop) && newProps[prop]) {
        warnings.push(`Property '${prop}' is no longer required`);
      }
    }

    // Check new required properties (breaking)
    for (const prop of newRequired) {
      if (!oldRequired.has(prop) && !oldProps[prop]) {
        breakingChanges.push(`New required property '${prop}' added without default`);
      }
    }

    // Check removed properties (breaking)
    for (const prop of Object.keys(oldProps)) {
      if (!newProps[prop]) {
        breakingChanges.push(`Property '${prop}' removed`);
      }
    }

    // Check type changes (breaking)
    for (const prop of Object.keys(oldProps)) {
      if (newProps[prop] && oldProps[prop].type !== newProps[prop].type) {
        breakingChanges.push(`Property '${prop}' type changed from '${oldProps[prop].type}' to '${newProps[prop].type}'`);
      }
    }

    // Determine compatibility type
    let type: SchemaCompatibilityResult['type'] = 'FULL';
    if (breakingChanges.length > 0) {
      type = 'NONE';
    } else if (warnings.length > 0) {
      type = 'BACKWARD';
    }

    return { compatible: breakingChanges.length === 0, type, breakingChanges, warnings };
  }

  /** Validate data against a schema */
  validate(name: string, version: string | undefined, data: any): { valid: boolean; errors: string[] } {
    const schema = version ? this.getVersion(name, version) : this.getLatest(name);
    if (!schema) return { valid: false, errors: [`Schema not found: ${name}`] };

    const errors: string[] = [];
    const props = schema.schema.properties || {};
    const required = schema.schema.required || [];

    // Check required fields
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check field types
    for (const [field, value] of Object.entries(data)) {
      const propSchema = props[field];
      if (!propSchema) {
        // Additional properties not allowed if specified
        if (schema.schema.additionalProperties === false) {
          errors.push(`Unknown field: ${field}`);
        }
        continue;
      }

      if (propSchema.type && typeof value !== propSchema.type && value !== null) {
        errors.push(`Field '${field}' expected type '${propSchema.type}', got '${typeof value}'`);
      }

      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(`Field '${field}' value '${value}' not in allowed values: ${propSchema.enum.join(', ')}`);
      }

      if (propSchema.minimum !== undefined && typeof value === 'number' && value < propSchema.minimum) {
        errors.push(`Field '${field}' value ${value} is below minimum ${propSchema.minimum}`);
      }

      if (propSchema.maximum !== undefined && typeof value === 'number' && value > propSchema.maximum) {
        errors.push(`Field '${field}' value ${value} exceeds maximum ${propSchema.maximum}`);
      }

      if (propSchema.minLength !== undefined && typeof value === 'string' && value.length < propSchema.minLength) {
        errors.push(`Field '${field}' length ${value.length} is below minimum ${propSchema.minLength}`);
      }

      if (propSchema.maxLength !== undefined && typeof value === 'string' && value.length > propSchema.maxLength) {
        errors.push(`Field '${field}' length ${value.length} exceeds maximum ${propSchema.maxLength}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /** Deprecate a schema version */
  deprecate(name: string, version: string, successor?: string): boolean {
    const schema = this.getVersion(name, version);
    if (!schema) return false;

    schema.deprecated = true;
    if (successor) schema.successor = successor;
    logger.warn({ name, version, successor }, 'Schema deprecated');
    return true;
  }

  /** List all schemas */
  list(): Array<{ name: string; versions: string[]; latest: string }> {
    const result: Array<{ name: string; versions: string[]; latest: string }> = [];

    for (const [name, versions] of this.schemas) {
      result.push({
        name,
        versions: versions.map((v) => v.version),
        latest: versions[versions.length - 1].version,
      });
    }

    return result;
  }

  /** Get stats */
  getStats(): { totalSchemas: number; totalVersions: number; deprecated: number } {
    let totalVersions = 0;
    let deprecated = 0;

    for (const [, versions] of this.schemas) {
      totalVersions += versions.length;
      deprecated += versions.filter((v) => v.deprecated).length;
    }

    return { totalSchemas: this.schemas.size, totalVersions, deprecated };
  }
}

export function createSchemaRegistry(): SchemaRegistry {
  return new SchemaRegistry();
}
