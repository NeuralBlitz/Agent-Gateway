// @ts-nocheck
/**
 * Enterprise Search Engine
 * Full-text search with indexing, query parsing, ranking,
 * faceting, autocomplete, and multi-field search support.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export interface SearchDocument {
  id: string;
  [key: string]: any;
}

export interface SearchIndex {
  name: string;
  fields: SearchField[];
  documents: Map<string, SearchDocument>;
  invertedIndex: Map<string, Set<string>>; // term -> docIds
  fieldBoosts: Record<string, number>;
}

export interface SearchField {
  name: string;
  type: 'text' | 'keyword' | 'number' | 'boolean' | 'date';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  facetable?: boolean;
  analyzer?: 'standard' | 'whitespace' | 'simple' | 'keyword';
}

export interface SearchQuery {
  query?: string;
  filters?: Record<string, any>;
  sort?: { field: string; order: 'asc' | 'desc' }[];
  page?: number;
  pageSize?: number;
  fields?: string[];
  highlight?: boolean;
}

export interface SearchResult {
  hits: Array<{ document: SearchDocument; score: number; highlights?: Record<string, string[]> }>;
  total: number;
  page: number;
  pageSize: number;
  facets?: Record<string, Array<{ value: any; count: number }>>;
  queryTime: number;
}

export class SearchEngine extends EventEmitter {
  private indexes: Map<string, SearchIndex> = new Map();
  private stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'don', 'now']);

  /** Create a search index */
  createIndex(name: string, fields: SearchField[]): SearchIndex {
    const index: SearchIndex = {
      name,
      fields,
      documents: new Map(),
      invertedIndex: new Map(),
      fieldBoosts: {},
    };

    // Set default boosts
    for (const field of fields) {
      if (field.searchable !== false && field.type === 'text') {
        index.fieldBoosts[field.name] = 1.0;
      }
    }

    this.indexes.set(name, index);
    logger.info({ index: name, fields: fields.length }, 'Search index created');
    return index;
  }

  /** Set field boost for ranking */
  setFieldBoost(indexName: string, fieldName: string, boost: number): boolean {
    const index = this.indexes.get(indexName);
    if (!index) return false;
    index.fieldBoosts[fieldName] = boost;
    return true;
  }

  /** Index a document */
  index(indexName: string, document: SearchDocument): void {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index not found: ${indexName}`);

    index.documents.set(document.id, document);

    // Build inverted index for text fields
    for (const field of index.fields) {
      if (field.searchable === false || field.type !== 'text') continue;

      const value = document[field.name];
      if (typeof value !== 'string') continue;

      const tokens = this.tokenize(value, field.analyzer || 'standard');

      for (const token of tokens) {
        const term = token.toLowerCase();
        if (!index.invertedIndex.has(term)) {
          index.invertedIndex.set(term, new Set());
        }
        index.invertIndex.get(term)?.add(document.id);
      }
    }

    this.emit('document:indexed', { index: indexName, documentId: document.id });
  }

  /** Remove a document from index */
  remove(indexName: string, documentId: string): boolean {
    const index = this.indexes.get(indexName);
    if (!index) return false;

    index.documents.delete(documentId);

    // Remove from inverted index
    for (const [, docIds] of index.invertedIndex) {
      docIds.delete(documentId);
    }

    return true;
  }

  /** Search an index */
  search(indexName: string, query: SearchQuery): SearchResult {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index not found: ${indexName}`);

    const startTime = Date.now();
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);

    // Get candidate documents
    let candidates = new Set(index.documents.keys());

    // Full-text search
    if (query.query) {
      const searchTerms = this.tokenize(query.query, 'standard');
      const termScores = new Map<string, number>();

      for (const term of searchTerms) {
        const lowerTerm = term.toLowerCase();
        const docIds = index.invertedIndex.get(lowerTerm);
        if (docIds) {
          for (const docId of docIds) {
            termScores.set(docId, (termScores.get(docId) || 0) + 1);
          }
        }
      }

      // Filter to matching documents
      candidates = new Set(termScores.keys());
    }

    // Apply filters
    if (query.filters) {
      candidates = this.applyFilters(index, candidates, query.filters);
    }

    // Score and rank
    const scored = this.scoreDocuments(index, Array.from(candidates), query);

    // Sort
    if (query.sort) {
      for (const sort of query.sort.reverse()) {
        scored.sort((a, b) => {
          const aVal = a.document[sort.field];
          const bVal = b.document[sort.field];
          if (aVal < bVal) return sort.order === 'asc' ? -1 : 1;
          if (aVal > bVal) return sort.order === 'asc' ? 1 : -1;
          return 0;
        });
      }
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    // Paginate
    const total = scored.length;
    const start = (page - 1) * pageSize;
    const pageHits = scored.slice(start, start + pageSize);

    // Generate facets
    const facets = query.fields ? this.generateFacets(index, scored, query.fields) : undefined;

    // Generate highlights
    const hits = pageHits.map((s) => {
      const result: any = { document: s.document, score: s.score };
      if (query.highlight && query.query) {
        result.highlights = this.generateHighlights(s.document, query.query, index.fields);
      }
      return result;
    });

    const queryTime = Date.now() - startTime;

    return {
      hits,
      total,
      page,
      pageSize,
      facets,
      queryTime,
    };
  }

  /** Autocomplete search */
  autocomplete(indexName: string, prefix: string, field: string, limit: number = 10): string[] {
    const index = this.indexes.get(indexName);
    if (!index) return [];

    const results: string[] = [];
    const lowerPrefix = prefix.toLowerCase();

    for (const [term] of index.invertedIndex) {
      if (term.startsWith(lowerPrefix)) {
        results.push(term);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /** Get index stats */
  getStats(indexName: string): { documentCount: number; termCount: number; indexSize: number } {
    const index = this.indexes.get(indexName);
    if (!index) return { documentCount: 0, termCount: 0, indexSize: 0 };

    return {
      documentCount: index.documents.size,
      termCount: index.invertedIndex.size,
      indexSize: index.documents.size + index.invertedIndex.size,
    };
  }

  /** Tokenize text */
  private tokenize(text: string, analyzer: string): string[] {
    switch (analyzer) {
      case 'whitespace':
        return text.split(/\s+/).filter((t) => t.length > 0);
      case 'simple':
        return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0 && !this.stopwords.has(t));
      case 'keyword':
        return [text];
      case 'standard':
      default:
        return text.split(/[\s\p{P}]+/u).filter((t) => t.length > 1 && !this.stopwords.has(t.toLowerCase()));
    }
  }

  /** Apply filters to candidate set */
  private applyFilters(index: SearchIndex, candidates: Set<string>, filters: Record<string, any>): Set<string> {
    const result = new Set(candidates);

    for (const docId of candidates) {
      const doc = index.documents.get(docId);
      if (!doc) {
        result.delete(docId);
        continue;
      }

      for (const [field, value] of Object.entries(filters)) {
        const docValue = doc[field];
        if (Array.isArray(value)) {
          if (!value.includes(docValue)) {
            result.delete(docId);
            break;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Range filter
          if (value.gte !== undefined && docValue < value.gte) { result.delete(docId); break; }
          if (value.gt !== undefined && docValue <= value.gt) { result.delete(docId); break; }
          if (value.lte !== undefined && docValue > value.lte) { result.delete(docId); break; }
          if (value.lt !== undefined && docValue >= value.lt) { result.delete(docId); break; }
        } else if (docValue !== value) {
          result.delete(docId);
          break;
        }
      }
    }

    return result;
  }

  /** Score documents */
  private scoreDocuments(index: SearchIndex, docIds: string[], query: SearchQuery): Array<{ document: SearchDocument; score: number }> {
    if (!query.query) {
      return docIds.map((id) => ({
        document: index.documents.get(id)!,
        score: 1,
      }));
    }

    const searchTerms = this.tokenize(query.query, 'standard').map((t) => t.toLowerCase());
    const scored: Array<{ document: SearchDocument; score: number }> = [];

    for (const docId of docIds) {
      const doc = index.documents.get(docId);
      if (!doc) continue;

      let score = 0;

      for (const field of index.fields) {
        if (field.searchable === false || field.type !== 'text') continue;

        const value = String(doc[field.name] || '');
        const boost = index.fieldBoosts[field.name] || 1.0;

        for (const term of searchTerms) {
          if (value.toLowerCase().includes(term)) {
            // Exact match bonus
            if (value.toLowerCase() === term) score += 10 * boost;
            // Word boundary match
            else if (new RegExp(`\\b${term}\\b`, 'i').test(value)) score += 5 * boost;
            // Substring match
            else score += 1 * boost;
          }
        }

        // TF-IDF-like scoring: frequency matters
        const termFreq = searchTerms.filter((t) => value.toLowerCase().includes(t)).length;
        score += termFreq * 0.5 * boost;
      }

      scored.push({ document: doc, score });
    }

    return scored;
  }

  /** Generate highlights */
  private generateHighlights(document: SearchDocument, queryText: string, fields: SearchField[]): Record<string, string[]> {
    const terms = this.tokenize(queryText, 'standard').map((t) => t.toLowerCase());
    const highlights: Record<string, string[]> = {};

    for (const field of fields) {
      if (field.type !== 'text') continue;
      const value = String(document[field.name] || '');
      if (!value) continue;

      const fragments: string[] = [];
      const lowerValue = value.toLowerCase();

      for (const term of terms) {
        const idx = lowerValue.indexOf(term);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(value.length, idx + term.length + 30);
          let fragment = value.slice(start, end);
          if (start > 0) fragment = '...' + fragment;
          if (end < value.length) fragment = fragment + '...';
          fragments.push(fragment);
        }
      }

      if (fragments.length > 0) {
        highlights[field.name] = fragments;
      }
    }

    return highlights;
  }

  /** Generate facets */
  private generateFacets(index: SearchIndex, scored: Array<{ document: SearchDocument; score: number }>, fields: string[]): Record<string, Array<{ value: any; count: number }>> {
    const facets: Record<string, Array<{ value: any; count: number }>> = {};

    for (const field of fields) {
      const fieldDef = index.fields.find((f) => f.name === field);
      if (!fieldDef || !fieldDef.facetable) continue;

      const counts: Map<any, number> = new Map();

      for (const { document } of scored) {
        const value = document[field];
        if (value !== undefined) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }

      facets[field] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    return facets;
  }

  /** Delete an index */
  deleteIndex(indexName: string): boolean {
    return this.indexes.delete(indexName);
  }

  /** List all indexes */
  listIndexes(): Array<{ name: string; documentCount: number; fieldCount: number }> {
    return Array.from(this.indexes.values()).map((idx) => ({
      name: idx.name,
      documentCount: idx.documents.size,
      fieldCount: idx.fields.length,
    }));
  }
}

export function createSearchEngine(): SearchEngine {
  return new SearchEngine();
}
