/**
 * Enterprise Data Transformer
 * Comprehensive data transformation pipeline with field mapping,
 * type coercion, validation, filtering, and aggregation.
 */

import { logger } from '../infra/index.js';

export type TransformOperation =
  | { type: 'rename'; from: string; to: string }
  | { type: 'remove'; fields: string[] }
  | { type: 'default'; field: string; value: any }
  | { type: 'coerce'; field: string; targetType: 'string' | 'number' | 'boolean' | 'array' | 'object' }
  | { type: 'map'; field: string; fn: (value: any) => any }
  | { type: 'filter'; fn: (item: any) => boolean }
  | { type: 'flatten'; field: string }
  | { type: 'nest'; field: string; target: string }
  | { type: 'compute'; field: string; fn: (data: any) => any }
  | { type: 'validate'; field: string; rule: (value: any) => boolean; message?: string }
  | { type: 'mask'; field: string; maskChar?: string; visibleChars?: number };

export interface TransformConfig {
  name: string;
  operations: TransformOperation[];
  description?: string;
}

export class DataTransformer {
  private config: TransformConfig;
  private stats: { transformed: number; errors: number; filtered: number };

  constructor(config: TransformConfig) {
    this.config = config;
    this.stats = { transformed: 0, errors: 0, filtered: 0 };
  }

  /** Transform a single object */
  transform(data: any): { result: any; errors: string[] } {
    const errors: string[] = [];
    let result = JSON.parse(JSON.stringify(data)); // Deep clone

    for (const op of this.config.operations) {
      try {
        result = this.applyOperation(result, op);
        if (result === null) {
          this.stats.filtered++;
          return { result: null, errors: [] };
        }
      } catch (err: any) {
        errors.push(`Operation '${op.type}' failed: ${err.message}`);
        this.stats.errors++;
        logger.error({ operation: op.type, error: err.message }, 'Transform operation failed');
      }
    }

    this.stats.transformed++;
    return { result, errors };
  }

  /** Transform an array of objects */
  transformArray(data: any[]): { results: any[]; errors: Array<{ index: number; errors: string[] }> } {
    const results: any[] = [];
    const errors: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const { result, errors: itemErrors } = this.transform(data[i]);
      if (result !== null) {
        results.push(result);
      }
      if (itemErrors.length > 0) {
        errors.push({ index: i, errors: itemErrors });
      }
    }

    return { results, errors };
  }

  /** Apply a single operation */
  private applyOperation(data: any, op: TransformOperation): any {
    switch (op.type) {
      case 'rename': {
        const value = this.getField(data, op.from);
        if (value !== undefined) {
          this.setField(data, op.to, value);
          this.deleteField(data, op.from);
        }
        return data;
      }

      case 'remove': {
        for (const field of op.fields) {
          this.deleteField(data, field);
        }
        return data;
      }

      case 'default': {
        const value = this.getField(data, op.field);
        if (value === undefined || value === null) {
          this.setField(data, op.field, op.value);
        }
        return data;
      }

      case 'coerce': {
        const value = this.getField(data, op.field);
        if (value !== undefined) {
          this.setField(data, op.field, this.coerceValue(value, op.targetType));
        }
        return data;
      }

      case 'map': {
        const value = this.getField(data, op.field);
        if (value !== undefined) {
          this.setField(data, op.field, op.fn(value));
        }
        return data;
      }

      case 'filter': {
        return op.fn(data) ? data : null;
      }

      case 'flatten': {
        const value = this.getField(data, op.field);
        if (value && typeof value === 'object') {
          for (const [key, val] of Object.entries(value)) {
            this.setField(data, `${op.field}.${key}`, val);
          }
          delete data[op.field];
        }
        return data;
      }

      case 'nest': {
        const value = this.getField(data, op.field);
        if (value !== undefined) {
          const parts = op.field.split('.');
          const targetParts = op.target.split('.');

          // Create target object if needed
          let target = data;
          for (const part of targetParts) {
            if (!target[part]) target[part] = {};
            target = target[part];
          }

          target[parts[parts.length - 1]] = value;
          this.deleteField(data, op.field);
        }
        return data;
      }

      case 'compute': {
        const computed = op.fn(data);
        this.setField(data, op.field, computed);
        return data;
      }

      case 'validate': {
        const value = this.getField(data, op.field);
        if (!op.rule(value)) {
          throw new Error(op.message || `Validation failed for field '${op.field}'`);
        }
        return data;
      }

      case 'mask': {
        const value = this.getField(data, op.field);
        if (typeof value === 'string' && value.length > 0) {
          const visible = op.visibleChars || 4;
          const maskChar = op.maskChar || '*';
          if (value.length > visible) {
            const masked = maskChar.repeat(value.length - visible) + value.slice(-visible);
            this.setField(data, op.field, masked);
          }
        }
        return data;
      }

      default:
        throw new Error(`Unknown operation type: ${(op as any).type}`);
    }
  }

  /** Get a nested field value */
  private getField(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /** Set a nested field value */
  private setField(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  /** Delete a nested field */
  private deleteField(obj: any, path: string): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) return;
      current = current[parts[i]];
    }
    delete current[parts[parts.length - 1]];
  }

  /** Coerce a value to a target type */
  private coerceValue(value: any, targetType: string): any {
    switch (targetType) {
      case 'string': return String(value);
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }
      case 'boolean': return Boolean(value);
      case 'array': return Array.isArray(value) ? value : [value];
      case 'object': return typeof value === 'object' ? value : { value };
      default: return value;
    }
  }

  /** Get transformation stats */
  getStats(): { transformed: number; errors: number; filtered: number } {
    return { ...this.stats };
  }

  /** Get config */
  getConfig(): TransformConfig {
    return { ...this.config };
  }
}

export function createDataTransformer(config: TransformConfig): DataTransformer {
  return new DataTransformer(config);
}
