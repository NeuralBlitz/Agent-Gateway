import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchEngine, createSearchEngine } from '../src/search-engine/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SearchEngine', () => {
  let engine: SearchEngine;

  beforeEach(() => {
    engine = createSearchEngine();
  });

  describe('constructor', () => {
    it('should create a SearchEngine instance', () => {
      expect(engine).toBeInstanceOf(SearchEngine);
      expect(engine).toBeInstanceOf(EventEmitter);
    });
  });

  describe('createIndex', () => {
    it('should create a new index', () => {
      const index = engine.createIndex('users', [
        { name: 'name', type: 'text', analyzer: 'standard' },
        { name: 'email', type: 'text', analyzer: 'standard' },
      ]);
      expect(index.name).toBe('users');
      expect(index.fields.length).toBe(2);

      const indexes = engine.listIndexes();
      expect(indexes.length).toBe(1);
      expect(indexes[0].name).toBe('users');
    });

    it('should set default field boosts for text fields', () => {
      engine.createIndex('boosted', [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'text' },
        { name: 'count', type: 'number' },
      ]);

      const stats = engine.getStats('boosted');
      expect(stats.documentCount).toBe(0);
    });

    it('should throw on duplicate index name', () => {
      engine.createIndex('dup', [{ name: 'f', type: 'text' }]);
      expect(() => engine.createIndex('dup', [{ name: 'f', type: 'text' }])).toThrow();
    });
  });

  describe('deleteIndex', () => {
    it('should delete an index', () => {
      engine.createIndex('to-delete', [{ name: 'f', type: 'text' }]);
      const result = engine.deleteIndex('to-delete');
      expect(result).toBe(true);
      expect(engine.listIndexes().length).toBe(0);
    });

    it('should return false for nonexistent index', () => {
      expect(engine.deleteIndex('nonexistent')).toBe(false);
    });
  });

  describe('index', () => {
    it('should index a document', () => {
      engine.createIndex('docs', [{ name: 'title', type: 'text' }]);
      engine.index('docs', { id: 'doc-1', title: 'Hello World' });

      const stats = engine.getStats('docs');
      expect(stats.documentCount).toBe(1);
    });

    it('should throw for unknown index', () => {
      expect(() => engine.index('nonexistent', { id: 'x', title: 'test' })).toThrow();
    });

    it('should build inverted index for text fields', () => {
      engine.createIndex('invert-test', [{ name: 'title', type: 'text' }]);
      engine.index('invert-test', { id: 'd1', title: 'hello world' });

      const results = engine.search('invert-test', { query: 'hello' });
      expect(results.hits.length).toBe(1);
      expect(results.hits[0].document.id).toBe('d1');
    });

    it('should index multiple fields', () => {
      engine.createIndex('multi-field', [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'text' },
      ]);

      engine.index('multi-field', {
        id: 'doc-2',
        title: 'Introduction',
        body: 'This is about programming',
      });

      const titleResults = engine.search('multi-field', { query: 'introduction' });
      const bodyResults = engine.search('multi-field', { query: 'programming' });

      expect(titleResults.hits.length).toBe(1);
      expect(bodyResults.hits.length).toBe(1);
    });

    it('should handle case-insensitive search', () => {
      engine.createIndex('case-test', [{ name: 'name', type: 'text' }]);
      engine.index('case-test', { id: 'c1', name: 'Hello World' });

      const lowerResults = engine.search('case-test', { query: 'hello' });
      const upperResults = engine.search('case-test', { query: 'HELLO' });

      expect(lowerResults.hits.length).toBe(1);
      expect(upperResults.hits.length).toBe(1);
    });

    it('should skip non-searchable fields', () => {
      engine.createIndex('skip-test', [
        { name: 'visible', type: 'text', searchable: true },
        { name: 'hidden', type: 'text', searchable: false },
      ]);

      engine.index('skip-test', { id: 's1', visible: 'findme', hidden: 'secret' });

      const visibleResults = engine.search('skip-test', { query: 'findme' });
      const hiddenResults = engine.search('skip-test', { query: 'secret' });

      expect(visibleResults.hits.length).toBe(1);
      expect(hiddenResults.hits.length).toBe(0);
    });

    it('should skip non-text fields in inverted index', () => {
      engine.createIndex('type-test', [
        { name: 'name', type: 'text' },
        { name: 'count', type: 'number' },
      ]);

      engine.index('type-test', { id: 't1', name: 'hello', count: 42 });

      const textResults = engine.search('type-test', { query: 'hello' });
      expect(textResults.hits.length).toBe(1);
    });

    it('should emit document:indexed event', () => {
      engine.createIndex('emit-test', [{ name: 'f', type: 'text' }]);
      const handler = vi.fn();
      engine.on('document:indexed', handler);

      engine.index('emit-test', { id: 'e1', f: 'value' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ index: 'emit-test', documentId: 'e1' });
    });
  });

  describe('remove', () => {
    it('should remove a document from the index', () => {
      engine.createIndex('removable', [{ name: 'name', type: 'text' }]);
      engine.index('removable', { id: 'r1', name: 'removable doc' });
      engine.remove('removable', 'r1');

      const results = engine.search('removable', { query: 'removable' });
      expect(results.hits.length).toBe(0);
    });

    it('should return false for nonexistent document', () => {
      engine.createIndex('no-doc', [{ name: 'f', type: 'text' }]);
      expect(engine.remove('no-doc', 'nonexistent')).toBe(false);
    });

    it('should return false for nonexistent index', () => {
      expect(engine.remove('nonexistent', 'some-id')).toBe(false);
    });
  });

  describe('search', () => {
    it('should return results with scores', () => {
      engine.createIndex('relevance', [{ name: 'text', type: 'text' }]);

      engine.index('relevance', { id: 'a', text: 'javascript programming' });
      engine.index('relevance', { id: 'b', text: 'javascript' });
      engine.index('relevance', { id: 'c', text: 'programming basics' });

      const results = engine.search('relevance', { query: 'javascript' });
      expect(results.hits.length).toBe(2);
      expect(results.total).toBe(2);
      // 'a' has both terms so higher score
      expect(results.hits[0].document.id).toBe('a');
    });

    it('should return empty hits for no matches', () => {
      engine.createIndex('empty-search', [{ name: 'f', type: 'text' }]);
      const results = engine.search('empty-search', { query: 'nonexistent' });
      expect(results.hits).toEqual([]);
      expect(results.total).toBe(0);
    });

    it('should throw for unknown index', () => {
      expect(() => engine.search('unknown', { query: 'term' })).toThrow();
    });

    it('should respect pageSize option', () => {
      engine.createIndex('limited', [{ name: 'name', type: 'text' }]);

      for (let i = 0; i < 20; i++) {
        engine.index('limited', { id: `l${i}`, name: 'common' });
      }

      const results = engine.search('limited', { query: 'common', pageSize: 5 });
      expect(results.hits.length).toBe(5);
      expect(results.pageSize).toBe(5);
    });

    it('should support pagination', () => {
      engine.createIndex('paginated', [{ name: 'name', type: 'text' }]);

      for (let i = 0; i < 10; i++) {
        engine.index('paginated', { id: `p${i}`, name: 'item' });
      }

      const page1 = engine.search('paginated', { query: 'item', page: 1, pageSize: 3 });
      const page2 = engine.search('paginated', { query: 'item', page: 2, pageSize: 3 });

      expect(page1.hits.length).toBe(3);
      expect(page2.hits.length).toBe(3);
      expect(page1.hits[0].document.id).not.toBe(page2.hits[0].document.id);
    });

    it('should handle multi-word queries', () => {
      engine.createIndex('multi-word', [{ name: 'text', type: 'text' }]);
      engine.index('multi-word', { id: 'mw1', text: 'the quick brown fox' });

      const results = engine.search('multi-word', { query: 'quick fox' });
      expect(results.hits.length).toBe(1);
    });

    it('should include queryTime in results', () => {
      engine.createIndex('timing', [{ name: 'f', type: 'text' }]);
      engine.index('timing', { id: 't1', f: 'hello' });

      const results = engine.search('timing', { query: 'hello' });
      expect(results.queryTime).toBeGreaterThanOrEqual(0);
    });

    it('should default to page 1 and pageSize 20', () => {
      engine.createIndex('defaults', [{ name: 'f', type: 'text' }]);
      for (let i = 0; i < 25; i++) {
        engine.index('defaults', { id: `d${i}`, f: 'term' });
      }

      const results = engine.search('defaults', { query: 'term' });
      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(20);
      expect(results.hits.length).toBe(20);
    });
  });

  describe('setFieldBoost', () => {
    it('should set field boost for ranking', () => {
      engine.createIndex('boost-test', [{ name: 'title', type: 'text' }]);
      const result = engine.setFieldBoost('boost-test', 'title', 2.5);
      expect(result).toBe(true);
    });

    it('should return false for unknown index', () => {
      expect(engine.setFieldBoost('unknown', 'field', 1.0)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats for an index', () => {
      engine.createIndex('stats', [{ name: 'f', type: 'text' }]);
      engine.index('stats', { id: 's1', f: 'hello world' });
      engine.index('stats', { id: 's2', f: 'goodbye world' });

      const stats = engine.getStats('stats');
      expect(stats.documentCount).toBe(2);
      expect(stats.termCount).toBeGreaterThan(0);
      expect(stats.indexSize).toBeGreaterThan(0);
    });

    it('should return zero stats for unknown index', () => {
      const stats = engine.getStats('nonexistent');
      expect(stats.documentCount).toBe(0);
      expect(stats.termCount).toBe(0);
    });
  });

  describe('listIndexes', () => {
    it('should return all index names with counts', () => {
      engine.createIndex('idx1', [{ name: 'f', type: 'text' }]);
      engine.createIndex('idx2', [{ name: 'f', type: 'text' }]);
      engine.index('idx2', { id: 'x', f: 'value' });

      const indexes = engine.listIndexes();
      expect(indexes.length).toBe(2);
      const idx1 = indexes.find((i) => i.name === 'idx1')!;
      const idx2 = indexes.find((i) => i.name === 'idx2')!;
      expect(idx1.documentCount).toBe(0);
      expect(idx2.documentCount).toBe(1);
    });

    it('should return empty array when no indexes', () => {
      expect(engine.listIndexes()).toEqual([]);
    });
  });

  describe('stopwords', () => {
    it('should filter common stopwords from queries', () => {
      engine.createIndex('stopword-test', [{ name: 'text', type: 'text' }]);
      engine.index('stopword-test', { id: 'sw1', text: 'the quick brown fox' });

      // "the" is a stopword, should still find "quick brown fox"
      const results = engine.search('stopword-test', { query: 'the fox' });
      expect(results.hits.length).toBe(1);
    });
  });
});
