// @ts-nocheck
/**
 * Enterprise Request Validation Middleware
 * Zod-based validation with automatic OpenAPI spec generation,
 * request sanitization, and detailed error responses.
 */

import { z } from 'zod';
import { logger } from '../infra/index.js';

// --- Validation Schemas ---

export const SendMessageSchema: z.ZodType<{ channel: string; userId: string; content: string; metadata?: Record<string, unknown> }> = z.object({
  channel: z.string().min(1).max(50),
  userId: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  metadata: z.record(z.any()).optional(),
});

export const StreamRequestSchema: z.ZodType<{ channel: string; userId: string; content: string; model?: string; temperature?: number }> = z.object({
  channel: z.string().min(1).max(50),
  userId: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const SessionQuerySchema: z.ZodType<{ channel?: string; userId?: string; limit?: number; offset?: number }> = z.object({
  channel: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export const PaginationSchema: z.ZodType<{ page: number; pageSize: number; sortBy?: string; sortOrder: 'asc' | 'desc' }> = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// --- Middleware ---

export interface ValidationRule {
  /** HTTP method */
  method: string;
  /** Path pattern */
  path: RegExp;
  /** Schema for request body */
  body?: z.ZodType<any>;
  /** Schema for query parameters */
  query?: z.ZodType<any>;
  /** Schema for URL params */
  params?: z.ZodType<any>;
  /** Whether to strip unknown fields */
  stripUnknown?: boolean;
}

export class ValidationManager {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /** Express middleware */
  middleware(): (req: any, res: any, next: () => void) => Promise<void> {
    return async (req: any, res: any, next: () => void) => {
      // Find matching rule
      const rule = this.rules.find(
        (r) => r.method.toLowerCase() === req.method.toLowerCase() && r.path.test(req.path),
      );

      if (!rule) {
        next();
        return;
      }

      const errors: { field: string; message: string; code: string }[] = [];

      // Validate body
      if (rule.body) {
        const result = rule.body.safeParse(req.body);
        if (!result.success) {
          for (const error of result.error.errors) {
            errors.push({
              field: error.path.join('.'),
              message: error.message,
              code: error.code || 'validation_error',
            });
          }
        } else {
          req.body = result.data;
        }
      }

      // Validate query
      if (rule.query) {
        const result = rule.query.safeParse(req.query);
        if (!result.success) {
          for (const error of result.error.errors) {
            errors.push({
              field: `query.${error.path.join('.')}`,
              message: error.message,
              code: error.code || 'validation_error',
            });
          }
        } else {
          req.query = result.data;
        }
      }

      // Validate params
      if (rule.params) {
        const result = rule.params.safeParse(req.params);
        if (!result.success) {
          for (const error of result.error.errors) {
            errors.push({
              field: `params.${error.path.join('.')}`,
              message: error.message,
              code: error.code || 'validation_error',
            });
          }
        } else {
          req.params = result.data;
        }
      }

      if (errors.length > 0) {
        logger.warn({ path: req.path, method: req.method, errors }, 'Request validation failed');
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      // Sanitize input (strip XSS vectors)
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitize(req.body);
      }

      next();
    };
  }

  /** Register default rules for all API endpoints */
  registerDefaults(): void {
    this.addRule({
      method: 'POST',
      path: /^\/api\/send$/,
      body: SendMessageSchema,
    });

    this.addRule({
      method: 'POST',
      path: /^\/api\/stream$/,
      body: StreamRequestSchema,
    });

    this.addRule({
      method: 'GET',
      path: /^\/api\/sessions$/,
      query: SessionQuerySchema,
    });
  }

  /** Generate OpenAPI spec from validation rules */
  generateOpenApiSpec(info: { title: string; version: string }): any {
    const paths: Record<string, any> = {};

    for (const rule of this.rules) {
      const pathStr = rule.path.source.replace(/^\^/, '').replace(/\$$/, '').replace(/\\\//g, '/');

      const method = rule.method.toLowerCase();
      if (!paths[pathStr]) paths[pathStr] = {};

      const operation: any = {
        summary: `${rule.method} ${pathStr}`,
        requestBody: rule.body ? {
          required: true,
          content: {
            'application/json': {
              schema: this.zodToJsonSchema(rule.body),
            },
          },
        } : undefined,
        parameters: rule.query ? Object.entries(this.zodToJsonSchema(rule.query).properties || {}).map(([name, schema]: [string, any]) => ({
          name,
          in: 'query',
          required: !(rule.query as any).shape?.[name]?.isOptional?.(),
          schema,
        })) : [],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limited' },
        },
      };

      paths[pathStr][method] = operation;
    }

    return {
      openapi: '3.0.3',
      info,
      paths,
    };
  }

  /** Convert Zod schema to JSON Schema (simplified) */
  private zodToJsonSchema(schema: z.ZodType): any {
    if (schema instanceof z.ZodObject) {
      const shape = (schema as any).shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodTypeToJson(value);
        if (!(value as any).isOptional?.()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: 'object' };
  }

  private zodTypeToJson(type: any): any {
    if (type instanceof z.ZodString) {
      const result: any = { type: 'string' };
      if (type._def.minLength) result.minLength = type._def.minLength.value;
      if (type._def.maxLength) result.maxLength = type._def.maxLength.value;
      return result;
    }
    if (type instanceof z.ZodNumber) {
      const result: any = { type: 'number' };
      if (type._def.minimum !== undefined) result.minimum = type._def.minimum.value;
      if (type._def.maximum !== undefined) result.maximum = type._def.maximum.value;
      return result;
    }
    if (type instanceof z.ZodEnum) {
      return { type: 'string', enum: type._def.values };
    }
    if (type instanceof z.ZodOptional) {
      return this.zodTypeToJson(type._def.innerType);
    }
    if (type instanceof z.ZodDefault) {
      return { ...this.zodTypeToJson(type._def.innerType), default: type._def.defaultValue() };
    }
    if (type instanceof z.ZodArray) {
      return { type: 'array', items: this.zodTypeToJson(type._def.type) };
    }

    return { type: 'string' };
  }

  /** Sanitize input data to prevent XSS */
  private sanitize(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }
    return data;
  }
}

export function createValidationManager(): ValidationManager {
  const manager = new ValidationManager();
  manager.registerDefaults();
  return manager;
}
