/**
 * Enterprise Embedding Store
 * Vector embedding management with semantic search,
 * similarity matching, and integration with agent memory.
 */

import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export interface EmbeddingRecord {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: number;
  tags: string[];
}

export interface SearchResult {
  record: EmbeddingRecord;
  score: number;
}

export interface EmbeddingStoreConfig {
  /** Storage backend: 'memory' | 'sqlite' | 'pinecone' | 'weaviate' */
  backend?: string;
  /** Default embedding dimensions */
  dimensions?: number;
  /** Similarity metric: 'cosine' | 'dot' | 'euclidean' */
  metric?: string;
  /** Max records (for memory backend) */
  maxRecords?: number;
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Dot product similarity */
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Euclidean distance (inverted for similarity) */
function euclideanSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return 1 / (1 + Math.sqrt(sum));
}

export class EmbeddingStore {
  private config: Required<EmbeddingStoreConfig>;
  private records: EmbeddingRecord[] = [];
  private similarityFn: (a: number[], b: number[]) => number;

  constructor(config: EmbeddingStoreConfig = {}) {
    this.config = {
      backend: config.backend || 'memory',
      dimensions: config.dimensions || 1536,
      metric: config.metric || 'cosine',
      maxRecords: config.maxRecords || 100000,
    };

    switch (this.config.metric) {
      case 'dot': this.similarityFn = dotProduct; break;
      case 'euclidean': this.similarityFn = euclideanSimilarity; break;
      default: this.similarityFn = cosineSimilarity;
    }
  }

  /** Add an embedding record */
  async add(text: string, embedding: number[], metadata: Record<string, any> = {}, tags: string[] = []): Promise<EmbeddingRecord> {
    if (embedding.length !== this.config.dimensions) {
      throw new Error(`Embedding dimension mismatch: expected ${this.config.dimensions}, got ${embedding.length}`);
    }

    const id = createHash('sha256').update(text).digest('hex').slice(0, 16);

    const record: EmbeddingRecord = {
      id,
      text,
      embedding,
      metadata,
      createdAt: Date.now(),
      tags,
    };

    this.records.push(record);

    // Enforce max records
    if (this.records.length > this.config.maxRecords) {
      this.records.shift();
    }

    return record;
  }

  /** Search for similar embeddings */
  search(queryEmbedding: number[], limit: number = 10, threshold: number = 0, tags?: string[]): SearchResult[] {
    if (queryEmbedding.length !== this.config.dimensions) {
      throw new Error(`Embedding dimension mismatch`);
    }

    let candidates = this.records;
    if (tags && tags.length > 0) {
      candidates = candidates.filter((r) => tags.some((t) => r.tags.includes(t)));
    }

    const results: SearchResult[] = candidates
      .map((record) => ({
        record,
        score: this.similarityFn(queryEmbedding, record.embedding),
      }))
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /** Search by text (requires an external embedding function) */
  async searchByText(
    query: string,
    embedFn: (text: string) => Promise<number[]>,
    limit: number = 10,
    threshold: number = 0,
    tags?: string[],
  ): Promise<SearchResult[]> {
    const queryEmbedding = await embedFn(query);
    return this.search(queryEmbedding, limit, threshold, tags);
  }

  /** Delete records by ID */
  delete(ids: string[]): number {
    const before = this.records.length;
    this.records = this.records.filter((r) => !ids.includes(r.id));
    return before - this.records.length;
  }

  /** Delete records by tag */
  deleteByTag(tag: string): number {
    const before = this.records.length;
    this.records = this.records.filter((r) => !r.tags.includes(tag));
    return before - this.records.length;
  }

  /** Get record by ID */
  get(id: string): EmbeddingRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  /** Get all records */
  getAll(): EmbeddingRecord[] {
    return [...this.records];
  }

  /** Get stats */
  getStats(): {
    totalRecords: number;
    dimensions: number;
    metric: string;
    backend: string;
    tags: Record<string, number>;
  } {
    const tagCounts: Record<string, number> = {};
    for (const record of this.records) {
      for (const tag of record.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return {
      totalRecords: this.records.length,
      dimensions: this.config.dimensions,
      metric: this.config.metric,
      backend: this.config.backend,
      tags: tagCounts,
    };
  }

  /** Clear all records */
  clear(): void {
    this.records = [];
  }
}

export function createEmbeddingStore(config?: EmbeddingStoreConfig): EmbeddingStore {
  return new EmbeddingStore(config);
}
