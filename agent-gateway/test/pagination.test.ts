import { describe, it, expect } from 'vitest';
import { Paginator } from '../src/pagination/index.js';

describe('Paginator', () => {
  const largeDataset = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `item-${i}` }));

  describe('offset', () => {
    it('should return first page with default params', () => {
      const result = Paginator.offset(largeDataset, {});
      expect(result.data.length).toBe(20); // default pageSize
      expect(result.pageInfo.page).toBe(1);
      expect(result.pageInfo.pageSize).toBe(20);
    });

    it('should respect custom page and pageSize', () => {
      const result = Paginator.offset(largeDataset, { page: 2, pageSize: 10 });
      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(10);
      expect(result.pageInfo.page).toBe(2);
    });

    it('should set hasNextPage correctly', () => {
      const page1 = Paginator.offset(largeDataset, { page: 1, pageSize: 20 });
      expect(page1.pageInfo.hasNextPage).toBe(true);

      const page3 = Paginator.offset(largeDataset, { page: 3, pageSize: 20 });
      expect(page3.pageInfo.hasNextPage).toBe(false); // Only 10 items left
    });

    it('should set hasPrevPage correctly', () => {
      const page1 = Paginator.offset(largeDataset, { page: 1, pageSize: 20 });
      expect(page1.pageInfo.hasPrevPage).toBe(false);

      const page2 = Paginator.offset(largeDataset, { page: 2, pageSize: 20 });
      expect(page2.pageInfo.hasPrevPage).toBe(true);
    });

    it('should set cursor values correctly', () => {
      const result = Paginator.offset(largeDataset, { page: 1, pageSize: 5 });
      expect(result.pageInfo.startCursor).toBe('0');
      expect(result.pageInfo.endCursor).toBe('4');
    });

    it('should return total count', () => {
      const result = Paginator.offset(largeDataset, { page: 1, pageSize: 10 });
      expect(result.pageInfo.total).toBe(50);
    });

    it('should cap pageSize at 100', () => {
      const result = Paginator.offset(largeDataset, { page: 1, pageSize: 200 });
      expect(result.pageInfo.pageSize).toBe(100);
      expect(result.data.length).toBe(50); // All data fits in 100
    });

    it('should return empty data for page beyond end', () => {
      const result = Paginator.offset(largeDataset, { page: 100, pageSize: 10 });
      expect(result.data).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should handle empty dataset', () => {
      const result = Paginator.offset([], { page: 1, pageSize: 10 });
      expect(result.data).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPrevPage).toBe(false);
      expect(result.pageInfo.total).toBe(0);
    });

    it('should handle dataset smaller than pageSize', () => {
      const small = [{ id: 1, name: 'only' }];
      const result = Paginator.offset(small, { page: 1, pageSize: 10 });
      expect(result.data.length).toBe(1);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('cursor', () => {
    it('should return first page without cursor', () => {
      const result = Paginator.cursor(largeDataset, { limit: 10 });
      expect(result.data.length).toBe(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPrevPage).toBe(false);
    });

    it('should return next page after cursor', () => {
      // Get first page
      const page1 = Paginator.cursor(largeDataset, { limit: 10 });
      const endCursor = page1.pageInfo.endCursor;

      // Get next page using cursor
      const page2 = Paginator.cursor(largeDataset, { cursor: endCursor, limit: 10 });
      expect(page2.data.length).toBe(10);
      expect(page2.data[0].id).toBe(10); // First item after cursor
      expect(page2.pageInfo.hasPrevPage).toBe(true);
    });

    it('should set cursor fields correctly', () => {
      const result = Paginator.cursor(largeDataset, { limit: 5 });
      expect(result.pageInfo.startCursor).toBe('0');
      expect(result.pageInfo.endCursor).toBe('4');
    });

    it('should return hasPrevPage when cursor is provided', () => {
      const result = Paginator.cursor(largeDataset, { cursor: '5', limit: 5 });
      expect(result.pageInfo.hasPrevPage).toBe(true);
    });

    it('should handle cursor at end of data', () => {
      const result = Paginator.cursor(largeDataset, { cursor: '49', limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should handle unknown cursor', () => {
      const result = Paginator.cursor(largeDataset, { cursor: 'nonexistent', limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should cap limit at 100', () => {
      const result = Paginator.cursor(largeDataset, { limit: 200 });
      expect(result.pageInfo.pageSize).toBe(100);
      expect(result.data.length).toBe(50);
    });

    it('should handle empty dataset', () => {
      const result = Paginator.cursor([], { limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.pageInfo.startCursor).toBeUndefined();
      expect(result.pageInfo.endCursor).toBeUndefined();
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should use custom cursorField', () => {
      const data = [
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
        { name: 'c', value: 3 },
      ];

      const result = Paginator.cursor(data, { limit: 2 }, 'name');
      expect(result.pageInfo.startCursor).toBe('a');
      expect(result.pageInfo.endCursor).toBe('b');

      const next = Paginator.cursor(data, { cursor: 'b', limit: 2 }, 'name');
      expect(next.data.length).toBe(1);
      expect(next.data[0].name).toBe('c');
    });

    it('should handle remaining items less than limit', () => {
      const result = Paginator.cursor(largeDataset, { cursor: '45', limit: 10 });
      expect(result.data.length).toBe(4); // items 46, 47, 48, 49
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});
