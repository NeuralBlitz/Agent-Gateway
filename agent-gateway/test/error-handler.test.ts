import { describe, it, expect } from 'vitest';
import { createErrorHandler } from '../src/error-handler/index.js';

describe('ErrorHandler', () => {
  describe('createReport', () => {
    it('should create an error report', () => {
      const eh = createErrorHandler(true);
      const err = new Error('test error');
      const report = eh.createReport(err, 'trace-1');
      expect(report.message).toBe('test error');
      expect(report.traceId).toBe('trace-1');
    });
  });

  describe('toResponse', () => {
    it('should create a standard error response', () => {
      const eh = createErrorHandler(false);
      const err = new Error('not found');
      const response = eh.toResponse(err);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBeDefined();
    });
  });

  describe('middleware', () => {
    it('should create an express middleware', () => {
      const eh = createErrorHandler();
      const mw = eh.middleware();
      expect(typeof mw).toBe('function');
    });
  });
});
