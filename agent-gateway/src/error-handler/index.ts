// @ts-nocheck
/**
 * Enterprise Error Handler
 * Centralized error classification, formatting, masking,
 * and reporting with structured error codes.
 */

import { logger } from '../infra/index.js';

export type ErrorCategory = 'client' | 'server' | 'upstream' | 'auth' | 'rate-limit' | 'validation' | 'not-found' | 'conflict' | 'forbidden';

export interface ErrorCode {
  code: string;
  category: ErrorCategory;
  statusCode: number;
  message: string;
  userMessage?: string;
  retryable: boolean;
}

export interface ErrorReport {
  code: string;
  category: ErrorCategory;
  statusCode: number;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  traceId?: string;
  timestamp: number;
  stack?: string;
}

export const ErrorCodes: Record<string, ErrorCode> = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', category: 'validation', statusCode: 400, message: 'Request validation failed', userMessage: 'Invalid request format', retryable: false },
  NOT_FOUND: { code: 'NOT_FOUND', category: 'not-found', statusCode: 404, message: 'Resource not found', userMessage: 'The requested resource was not found', retryable: false },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', category: 'auth', statusCode: 401, message: 'Authentication required', userMessage: 'Please authenticate to access this resource', retryable: false },
  FORBIDDEN: { code: 'FORBIDDEN', category: 'forbidden', statusCode: 403, message: 'Insufficient permissions', userMessage: 'You do not have permission to access this resource', retryable: false },
  RATE_LIMITED: { code: 'RATE_LIMITED', category: 'rate-limit', statusCode: 429, message: 'Rate limit exceeded', userMessage: 'Too many requests. Please try again later.', retryable: true },
  CONFLICT: { code: 'CONFLICT', category: 'conflict', statusCode: 409, message: 'Resource conflict', userMessage: 'The request conflicts with current state', retryable: false },
  UPSTREAM_ERROR: { code: 'UPSTREAM_ERROR', category: 'upstream', statusCode: 502, message: 'Upstream service error', userMessage: 'A downstream service is unavailable', retryable: true },
  TIMEOUT: { code: 'TIMEOUT', category: 'server', statusCode: 504, message: 'Request timeout', userMessage: 'The request took too long to process', retryable: true },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', category: 'server', statusCode: 500, message: 'Internal server error', userMessage: 'An unexpected error occurred', retryable: true },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', category: 'server', statusCode: 503, message: 'Service unavailable', userMessage: 'The service is temporarily unavailable', retryable: true },
};

export class ErrorHandler {
  private includeStack: boolean;
  private reportFn?: (report: ErrorReport) => void;

  constructor(includeStack: boolean = false, reportFn?: (report: ErrorReport) => void) {
    this.includeStack = includeStack;
    this.reportFn = reportFn;
  }

  /** Create an error report from an error */
  createReport(err: Error | any, traceId?: string): ErrorReport {
    // If it's a known error code
    if (err.code && ErrorCodes[err.code]) {
      const errorCode = ErrorCodes[err.code];
      return {
        code: errorCode.code,
        category: errorCode.category,
        statusCode: errorCode.statusCode,
        message: errorCode.message,
        userMessage: err.userMessage || errorCode.userMessage,
        details: err.details,
        traceId,
        timestamp: Date.now(),
        stack: this.includeStack ? err.stack : undefined,
      };
    }

    // If it has a statusCode
    if (err.statusCode) {
      const category = this.classifyByStatus(err.statusCode);
      return {
        code: err.code || this.getCodeForStatus(err.statusCode),
        category,
        statusCode: err.statusCode,
        message: err.message || ErrorCodes.INTERNAL_ERROR.message,
        userMessage: this.getUserMessage(err.statusCode, err.message),
        details: err.details,
        traceId,
        timestamp: Date.now(),
        stack: this.includeStack && err.statusCode >= 500 ? err.stack : undefined,
      };
    }

    // Default: internal error
    return {
      code: ErrorCodes.INTERNAL_ERROR.code,
      category: 'server',
      statusCode: 500,
      message: err.message || ErrorCodes.INTERNAL_ERROR.message,
      userMessage: ErrorCodes.INTERNAL_ERROR.userMessage,
      traceId,
      timestamp: Date.now(),
      stack: this.includeStack ? err.stack : undefined,
    };
  }

  /** Format error for API response */
  toResponse(err: Error | any, traceId?: string): { statusCode: number; body: any } {
    const report = this.createReport(err, traceId);

    // Log server errors
    if (report.statusCode >= 500) {
      logger.error({ ...report, originalError: err.message }, `Server error: ${report.code}`);
    }

    // Report to external service if configured
    if (this.reportFn && report.statusCode >= 400) {
      this.reportFn(report);
    }

    // Build response body (strip stack traces for client errors)
    const body: any = {
      success: false,
      error: {
        code: report.code,
        message: report.userMessage,
        ...(report.traceId && { traceId: report.traceId }),
        ...(report.details && { details: report.details }),
      },
    };

    return { statusCode: report.statusCode, body };
  }

  /** Express error handler middleware */
  middleware(): (err: Error, req: any, res: any, next: () => void) => void {
    return (err: Error, req: any, res: any, _next: () => void) => {
      const traceId = req.headers['x-request-id'] as string || req.id;
      const { statusCode, body } = this.toResponse(err, traceId);
      res.status(statusCode).json(body);
    };
  }

  /** Classify error by HTTP status code */
  private classifyByStatus(statusCode: number): ErrorCategory {
    if (statusCode >= 500) return 'server';
    if (statusCode === 401) return 'auth';
    if (statusCode === 403) return 'forbidden';
    if (statusCode === 404) return 'not-found';
    if (statusCode === 409) return 'conflict';
    if (statusCode === 429) return 'rate-limit';
    return 'client';
  }

  /** Get error code for status */
  private getCodeForStatus(statusCode: number): string {
    for (const [, code] of Object.entries(ErrorCodes)) {
      if (code.statusCode === statusCode) return code.code;
    }
    return 'INTERNAL_ERROR';
  }

  /** Get user-friendly message */
  private getUserMessage(statusCode: number, message: string): string {
    const code = Object.values(ErrorCodes).find((c) => c.statusCode === statusCode);
    return code?.userMessage || message || 'An error occurred';
  }
}

export function createErrorHandler(includeStack?: boolean, reportFn?: (report: ErrorReport) => void): ErrorHandler {
  return new ErrorHandler(includeStack, reportFn);
}
