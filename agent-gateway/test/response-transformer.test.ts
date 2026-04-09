import { describe, it, expect } from 'vitest';
import { createResponseTransformer } from '../src/response-transformer/index.js';

describe('ResponseTransformer', () => {
  const transformer = createResponseTransformer({ includeTiming: true });

  describe('success', () => {
    it('should wrap data in envelope', () => {
      const result = transformer.success({ message: 'hello' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: 'hello' });
      expect(result.meta).toBeDefined();
    });

    it('should include custom meta', () => {
      const result = transformer.success({ item: 1 }, { requestId: 'req-1' });
      expect(result.meta.requestId).toBe('req-1');
    });
  });

  describe('error', () => {
    it('should create error envelope', () => {
      const result = transformer.error('NOT_FOUND', 'Resource not found', undefined, 404);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Resource not found');
      expect(result.statusCode).toBe(404);
    });

    it('should include details', () => {
      const result = transformer.error('VALIDATION', 'Invalid input', { field: 'email' });
      expect(result.error.details).toEqual({ field: 'email' });
    });
  });

  describe('paginated', () => {
    it('should wrap array with pagination', () => {
      const result = transformer.paginated([1, 2, 3], 10, 1, 10);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta.pagination).toBeDefined();
      expect(result.meta.pagination.total).toBe(10);
    });
  });
});
