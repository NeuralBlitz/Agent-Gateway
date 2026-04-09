/**
 * Enterprise Response Transformer
 * Standardized API response formatting, error normalization,
 * pagination envelopes, and field selection/masking.
 */

import { logger } from '../infra/index.js';

export interface ResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  meta?: ResponseMeta;
  requestId?: string;
  timestamp: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  traceId?: string;
}

export interface ResponseMeta {
  pagination?: PaginationInfo;
  timing?: { startMs: number; endMs: number; durationMs: number };
  cache?: { hit: boolean; key?: string };
  version?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TransformerOptions {
  /** API version header */
  apiVersion?: string;
  /** Request ID */
  requestId?: string;
  /** Include timing */
  includeTiming?: boolean;
  /** Include pagination */
  pagination?: { page: number; pageSize: number; total: number };
  /** Fields to include (whitelist) */
  includeFields?: string[];
  /** Fields to exclude (blacklist) */
  excludeFields?: string[];
  /** Fields to mask (replace value) */
  maskFields?: string[];
  /** Mask replacement value */
  maskValue?: string;
}

export class ResponseTransformer {
  private options: TransformerOptions;

  constructor(options: TransformerOptions = {}) {
    this.options = {
      apiVersion: options.apiVersion || 'v2',
      requestId: options.requestId,
      includeTiming: options.includeTiming ?? true,
      pagination: options.pagination,
      includeFields: options.includeFields,
      excludeFields: options.excludeFields,
      maskFields: options.maskFields,
      maskValue: options.maskValue || '***',
    };
  }

  /** Transform a successful response */
  success<T>(data: T, meta?: Partial<ResponseMeta>): ResponseEnvelope<T> {
    const envelope: ResponseEnvelope<T> = {
      success: true,
      data: this.transformData(data),
      meta: this.buildMeta(meta),
      requestId: this.options.requestId,
      timestamp: Date.now(),
    };

    return envelope;
  }

  /** Transform an error response */
  error(code: string, message: string, details?: any, statusCode: number = 500): ResponseEnvelope<never> & { statusCode: number } {
    const envelope = {
      success: false,
      error: {
        code,
        message: this.sanitizeErrorMessage(message, statusCode),
        details: this.options.includeFields ? this.filterFields(details) : details,
        traceId: this.options.requestId,
      },
      meta: this.buildMeta(),
      requestId: this.options.requestId,
      timestamp: Date.now(),
      statusCode,
    };

    logger.error({ code, statusCode, requestId: this.options.requestId }, `API error: ${code}`);
    return envelope;
  }

  /** Transform a paginated response */
  paginated<T>(data: T[], total: number, page: number, pageSize: number, meta?: Partial<ResponseMeta>): ResponseEnvelope<T[]> {
    const totalPages = Math.ceil(total / pageSize);

    return this.success(data, {
      ...meta,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  /** Apply field transformations to data */
  private transformData(data: any): any {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) return data.map((item) => this.transformData(item));
    if (typeof data !== 'object') return data;

    let result = { ...data };

    // Include fields (whitelist)
    if (this.options.includeFields && this.options.includeFields.length > 0) {
      const filtered: Record<string, any> = {};
      for (const field of this.options.includeFields) {
        if (field in result) filtered[field] = result[field];
      }
      result = filtered;
    }

    // Exclude fields (blacklist)
    if (this.options.excludeFields) {
      for (const field of this.options.excludeFields) {
        delete result[field];
      }
    }

    // Mask sensitive fields
    if (this.options.maskFields) {
      for (const field of this.options.maskFields) {
        if (field in result) {
          result[field] = this.options.maskValue;
        }
      }
    }

    return result;
  }

  /** Filter fields from an object */
  private filterFields(data: any): any {
    if (!data || !this.options.includeFields) return data;
    if (Array.isArray(data)) return data.map((item) => this.filterFields(item));
    if (typeof data !== 'object') return data;

    const filtered: Record<string, any> = {};
    for (const field of this.options.includeFields) {
      if (field in data) filtered[field] = data[field];
    }
    return filtered;
  }

  /** Build response metadata */
  private buildMeta(extra?: Partial<ResponseMeta>): ResponseMeta {
    const meta: ResponseMeta = {
      version: this.options.apiVersion,
      ...extra,
    };

    if (this.options.pagination) {
      const p = this.options.pagination;
      meta.pagination = {
        page: p.page,
        pageSize: p.pageSize,
        total: p.total,
        totalPages: Math.ceil(p.total / p.pageSize),
        hasNext: p.page < Math.ceil(p.total / p.pageSize),
        hasPrev: p.page > 1,
      };
    }

    return meta;
  }

  /** Sanitize error messages for external consumption */
  private sanitizeErrorMessage(message: string, statusCode: number): string {
    // Don't expose internal details for 5xx errors
    if (statusCode >= 500) {
      return 'An internal error occurred. Please try again later.';
    }
    return message;
  }
}

export function createResponseTransformer(options?: TransformerOptions): ResponseTransformer {
  return new ResponseTransformer(options);
}
