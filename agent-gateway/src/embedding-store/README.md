# Embedding Store (`src/embedding-store/`)

> **Vector embedding management with semantic search, similarity matching, and integration with agent memory.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Configuration Options](#configuration-options)
6. [Usage Examples](#usage-examples)
7. [Similarity Metrics](#similarity-metrics)
8. [Search and Retrieval](#search-and-retrieval)
9. [Tagging System](#tagging-system)
10. [Record Lifecycle](#record-lifecycle)
11. [Error Handling](#error-handling)
12. [Integration Points](#integration-points)
13. [Performance Considerations](#performance-considerations)
14. [Best Practices](#best-practices)
15. [Related Documentation](#related-documentation)

---

## Overview

The `embedding-store/` module provides a **vector embedding storage and retrieval system** for the Agent Gateway. It stores text embeddings (dense vector representations of text semantics) and enables semantic similarity search, allowing the agent to find contextually relevant information based on meaning rather than keyword matching.

### Why Embeddings Matter for Agents

Embeddings are fundamental to modern AI agent capabilities:

- **Semantic memory** -- agents can recall and retrieve contextually relevant past interactions
- **Context augmentation** -- find relevant documents to include in the prompt context
- **Knowledge retrieval** -- search stored knowledge by semantic similarity
- **Conversation grounding** -- find the most relevant previous messages for context
- **RAG (Retrieval-Augmented Generation)** -- retrieve relevant documents before generating responses

### Key Features

- **Multiple similarity metrics** -- cosine similarity (default), dot product, and euclidean distance
- **Tag-based filtering** -- narrow search to specific categories or types
- **Configurable dimensions** -- supports any embedding dimension (default: 1536 for OpenAI)
- **Threshold filtering** -- exclude results below a minimum similarity score
- **Auto-generated IDs** -- SHA-256 hash of text content for deduplication
- **Metadata storage** -- attach arbitrary JSON metadata to each record
- **In-memory storage** -- fast, no external dependencies for the memory backend
- **Backend abstraction** -- designed to support SQLite, Pinecone, Weaviate backends

---

## File Structure

```
embedding-store/
├── index.ts          # EmbeddingStore class, similarity functions, factory, type definitions
```

The module is implemented in a single file (~160 lines) with the store class, three similarity functions, and factory helper.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      EmbeddingStore                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │               Records Array                             │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ EmbeddingRecord                                    │  │  │
│  │  │  id: "a1b2c3d4..."  (SHA-256 hash of text)       │  │  │
│  │  │  text: "The agent helped with configuration"       │  │  │
│  │  │  embedding: [0.12, -0.34, 0.56, ...] (1536 dims) │  │  │
│  │  │  metadata: { source: "chat", userId: "u1" }       │  │  │
│  │  │  tags: ["support", "config"]                       │  │  │
│  │  │  createdAt: 1712345678901                          │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [Record 1]  [Record 2]  [Record 3]  ...  [Record N]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Similarity Functions                        │  │
│  │                                                         │  │
│  │  cosineSimilarity(a, b)     -- default                  │  │
│  │  dotProduct(a, b)                                       │  │
│  │  euclideanSimilarity(a, b)                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Search Pipeline                              │  │
│  │                                                         │  │
│  │  1. Validate query embedding dimensions                  │  │
│  │  2. Filter by tags (if specified)                       │  │
│  │  3. Compute similarity for each candidate               │  │
│  │  4. Filter by threshold                                 │  │
│  │  5. Sort by score (descending)                          │  │
│  │  6. Return top N results                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### ID Generation

Record IDs are generated from the SHA-256 hash of the text content, truncated to 16 hex characters:

```typescript
const id = createHash('sha256').update(text).digest('hex').slice(0, 16);
```

This ensures:
- **Deterministic** -- the same text always produces the same ID
- **Deduplication** -- adding the same text twice replaces the previous record (since the array stores unique references)
- **Short** -- 16 hex chars (64 bits) is short enough for readability but long enough to avoid collisions in practice

Note: The current implementation appends to the array, so duplicate texts will create duplicate entries. True deduplication would require checking for existing IDs before adding.

---

## Class API

### Types

```typescript
interface EmbeddingRecord {
  id: string;                    // SHA-256 hash of text (16 hex chars)
  text: string;                  // Original text content
  embedding: number[];           // Dense vector (dimensions must match config)
  metadata: Record<string, any>; // Arbitrary metadata
  createdAt: number;             // Unix timestamp in ms
  tags: string[];                // Tags for categorization and filtering
}

interface SearchResult {
  record: EmbeddingRecord;       // The matched record
  score: number;                 // Similarity score (0-1 for cosine/euclidean, unbounded for dot)
}

interface EmbeddingStoreConfig {
  backend?: string;              // Storage backend: 'memory' | 'sqlite' | 'pinecone' | 'weaviate'
  dimensions?: number;           // Embedding dimensions (default: 1536)
  metric?: string;               // Similarity metric: 'cosine' | 'dot' | 'euclidean'
  maxRecords?: number;           // Maximum records for memory backend (default: 100000)
}
```

### `EmbeddingStore` Class

```typescript
class EmbeddingStore {
  constructor(config?: EmbeddingStoreConfig)

  // Write operations
  async add(
    text: string,
    embedding: number[],
    metadata?: Record<string, any>,
    tags?: string[],
  ): Promise<EmbeddingRecord>

  // Read operations
  search(
    queryEmbedding: number[],
    limit?: number,
    threshold?: number,
    tags?: string[],
  ): SearchResult[]

  async searchByText(
    query: string,
    embedFn: (text: string) => Promise<number[]>,
    limit?: number,
    threshold?: number,
    tags?: string[],
  ): Promise<SearchResult[]>

  get(id: string): EmbeddingRecord | undefined
  getAll(): EmbeddingRecord[]

  // Delete operations
  delete(ids: string[]): number
  deleteByTag(tag: string): number

  // Maintenance
  clear(): void
  getStats(): {
    totalRecords: number;
    dimensions: number;
    metric: string;
    backend: string;
    tags: Record<string, number>;
  }
}
```

### Factory Function

```typescript
function createEmbeddingStore(config?: EmbeddingStoreConfig): EmbeddingStore
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backend` | `string` | `'memory'` | Storage backend. Currently only `memory` is implemented; `sqlite`, `pinecone`, and `weaviate` are reserved |
| `dimensions` | `number` | `1536` | Embedding vector dimensions. Match your embedding model (OpenAI ada-002: 1536, text-embedding-3-small: 1536, text-embedding-3-large: 3072) |
| `metric` | `string` | `'cosine'` | Similarity metric: `cosine`, `dot`, or `euclidean` |
| `maxRecords` | `number` | `100000` | Maximum number of records in memory. Oldest records are removed when exceeded |

### Embedding Dimension Reference

| Model | Dimensions |
|-------|-----------|
| OpenAI `text-embedding-ada-002` | 1536 |
| OpenAI `text-embedding-3-small` | 1536 |
| OpenAI `text-embedding-3-large` | 3072 |
| Cohere `embed-english-v3.0` | 1024 |
| Cohere `embed-multilingual-v3.0` | 1024 |
| SentenceTransformers `all-MiniLM-L6-v2` | 384 |
| SentenceTransformers `all-mpnet-base-v2` | 768 |

---

## Usage Examples

### Basic Store Setup

```typescript
import { createEmbeddingStore } from '../embedding-store/index.js';

// Default: cosine similarity, 1536 dimensions (OpenAI)
const store = createEmbeddingStore();

// Custom configuration
const store = createEmbeddingStore({
  dimensions: 768,
  metric: 'cosine',
  maxRecords: 50000,
});
```

### Adding Embeddings

```typescript
// Add a record with embedding (from an external model)
const record = await store.add(
  'The user asked about configuring the circuit breaker pattern.',
  [0.012, -0.034, 0.056, /* ... 1536 values ... */],
  { source: 'conversation', sessionId: 'sess-123', userId: 'user-42' },
  ['support', 'circuit-breaker', 'configuration'],
);

console.log(record.id); // "a1b2c3d4e5f6g7h8" (SHA-256 truncated)
```

### Searching with Embedding Vector

```typescript
// Search for semantically similar records
const results = store.search(
  queryEmbedding, // [0.015, -0.029, 0.061, ...]
  5,              // top 5 results
  0.7,            // minimum similarity threshold
  ['support'],    // filter to 'support' tag only
);

for (const result of results) {
  console.log(`Score: ${result.score.toFixed(3)} - ${result.record.text}`);
}
// Score: 0.923 - The user asked about configuring the circuit breaker pattern.
// Score: 0.847 - Circuit breaker configuration guide for production.
// Score: 0.712 - How to set up resilience patterns in the gateway.
```

### Searching by Text

```typescript
// Provide an embedding function to convert text to vectors
async function embedText(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  const data = await response.json();
  return data.data[0].embedding;
}

const results = await store.searchByText(
  'How do I configure the circuit breaker?',
  embedText,
  10,   // top 10
  0.5,  // threshold
  ['support', 'docs'],
);
```

### Getting and Deleting Records

```typescript
// Get a specific record by ID
const record = store.get('a1b2c3d4e5f6g7h8');
if (record) {
  console.log(record.text);
}

// Delete specific records
const deleted = store.delete(['a1b2c3d4', 'e5f6g7h8']);
console.log(`Deleted ${deleted} records`);

// Delete by tag
const deletedByTag = store.deleteByTag('deprecated');
console.log(`Deleted ${deletedByTag} records with 'deprecated' tag`);

// Clear all records
store.clear();
```

### Inspecting Stats

```typescript
const stats = store.getStats();
console.log(stats);
// {
//   totalRecords: 1523,
//   dimensions: 1536,
//   metric: 'cosine',
//   backend: 'memory',
//   tags: {
//     support: 450,
//     docs: 320,
//     circuit-breaker: 85,
//     configuration: 120,
//     ...
//   }
// }
```

---

## Similarity Metrics

### Cosine Similarity (Default)

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

- **Range**: -1 to 1 (typically 0 to 1 for normalized embeddings)
- **Interpretation**: Measures the angle between two vectors; 1 means identical direction
- **Best for**: Most use cases, especially with normalized embeddings (like OpenAI's)

### Dot Product

```typescript
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
```

- **Range**: Unbounded (depends on vector magnitudes)
- **Interpretation**: Sum of element-wise products; higher means more aligned
- **Best for**: When vector magnitude is meaningful (e.g., TF-IDF)

### Euclidean Similarity

```typescript
function euclideanSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return 1 / (1 + Math.sqrt(sum));
}
```

- **Range**: 0 to 1 (inverted distance)
- **Interpretation**: 1 means identical vectors; 0 means maximally different
- **Best for**: When absolute distance between vectors matters

---

## Search and Retrieval

### Search Pipeline

1. **Validate dimensions** -- query embedding must match store's configured dimensions
2. **Filter by tags** -- if tags are specified, only consider records with matching tags
3. **Compute similarity** -- apply the configured similarity function to each candidate
4. **Filter by threshold** -- exclude results below the minimum score
5. **Sort** -- order by score descending
6. **Limit** -- return the top N results

### Threshold Recommendations

| Threshold | Use Case | Behavior |
|-----------|----------|----------|
| `0.0` | Return all results | No filtering |
| `0.5` | Loose matching | Broad semantic similarity |
| `0.7` | Moderate matching | Related but specific topics |
| `0.8` | Tight matching | Very similar content |
| `0.9` | Near-duplicate detection | Almost identical meaning |

### Tag Filtering

Tags act as a pre-filter before similarity computation:

```typescript
// Only search within records tagged 'docs' or 'faq'
const results = store.search(queryEmbedding, 10, 0.7, ['docs', 'faq']);

// A record matches if it has ANY of the specified tags
// tags.some((t) => r.tags.includes(t))
```

---

## Tagging System

Tags provide a lightweight categorization system for embedding records:

```typescript
// Add with tags
await store.add(
  'How to configure retry logic for providers',
  embedding,
  { author: 'docs-team' },
  ['docs', 'retry', 'providers', 'configuration'],
);

// Search with tag filter
const results = store.search(queryEmbedding, 10, 0.5, ['docs']);

// Delete all records with a tag
store.deleteByTag('deprecated');
```

### Tag Stats

The `getStats()` method provides a count of records per tag:

```typescript
const stats = store.getStats();
console.log(stats.tags);
// { docs: 320, retry: 45, providers: 85, configuration: 120, deprecated: 15 }
```

---

## Record Lifecycle

### Creation

Records are created via `add()`:
1. Text and embedding are validated (dimension check)
2. ID is generated from SHA-256 hash of text
3. Record is appended to the array
4. If `maxRecords` is exceeded, the oldest record is removed (FIFO)

### Retrieval

Records are retrieved via `search()` or `searchByText()`:
1. Query embedding is validated
2. Candidates are filtered by tags (if specified)
3. Similarity is computed for each candidate
4. Results below threshold are excluded
5. Results are sorted by score and limited

### Deletion

Records can be deleted by:
- **ID** -- `delete(['id1', 'id2'])` removes specific records
- **Tag** -- `deleteByTag('deprecated')` removes all records with the given tag
- **All** -- `clear()` removes all records

### Expiration

The memory backend enforces a maximum record count (`maxRecords`). When exceeded, the oldest records (first added) are removed. This provides a basic TTL mechanism based on insertion order.

---

## Error Handling

### Dimension Mismatch

Adding or searching with wrong embedding dimensions throws a synchronous error:

```typescript
// Store configured for 1536 dimensions
store.add('text', [0.1, 0.2], {});
// Error: "Embedding dimension mismatch: expected 1536, got 2"

store.search([0.1, 0.2]);
// Error: "Embedding dimension mismatch"
```

### Dimension Mismatch in searchByText

If the provided `embedFn` returns vectors of the wrong dimension, the error is thrown by the underlying `search()` call:

```typescript
await store.searchByText('query', async (text) => {
  // Returns wrong dimensions
  return [0.1, 0.2];
});
// Error: "Embedding dimension mismatch"
```

### Empty Store

Searching an empty store returns an empty array (no error):

```typescript
const store = createEmbeddingStore();
const results = store.search([0.1, 0.2, 0.3]);
console.log(results); // []
```

---

## Integration Points

### With AI Providers (Embedding Generation)

The store requires embeddings from an external model. The most common source is OpenAI's embedding API:

```typescript
async function openaiEmbed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

const store = createEmbeddingStore({ dimensions: 1536 });

// Index a conversation
const embedding = await openaiEmbed(userMessage);
await store.add(userMessage, embedding, { role: 'user' }, ['conversation']);

// Search later
const results = await store.searchByText('Tell me about configuration', openaiEmbed, 5, 0.7);
```

### With `src/content-moderator/`

Moderate content before storing:

```typescript
const modResult = moderator.moderate(text);
if (!modResult.blocked) {
  const embedding = await embedFn(text);
  await store.add(text, embedding, { moderated: true }, modResult.categories.map(c => c.name));
}
```

### With `src/connection-pool/`

When using persistent backends (SQLite, Pinecone, Weaviate), connection pooling manages the database connections:

```typescript
const store = createEmbeddingStore({ backend: 'sqlite' });
// Underlying SQLite connections managed by ConnectionPool
```

### With `src/feature-flags/`

Control embedding store behavior via feature flags:

```typescript
if (flagManager.evaluate('semantic-memory', { tenantId })) {
  const results = await store.searchByText(query, embedFn);
  // Use results to enrich agent context
}
```

### With `src/cron/`

Periodic store maintenance:

```typescript
scheduler.register({
  name: 'embedding-store-stats',
  schedule: '0 * * * *', // Hourly
  handler: async () => {
    const stats = store.getStats();
    logger.info(stats, 'Embedding store hourly stats');
  },
});
```

---

## Performance Considerations

### Memory Usage

Each record stores:
- Text content (variable)
- Embedding vector (dimensions * 8 bytes for float64)
- Metadata (variable)
- Tags (small)

For 1536-dimensional embeddings:
- 1536 * 8 = 12,288 bytes per embedding vector
- 100,000 records = ~1.2 GB for embeddings alone

### Search Complexity

Search is **O(n)** -- every record's embedding is compared to the query. For 100,000 records with 1536 dimensions:
- 100,000 * 1536 = 153,600,000 floating point operations per search
- On modern hardware, this takes approximately 10-50ms

### Optimization Strategies

| Strategy | When to Use | Trade-off |
|----------|-------------|-----------|
| Tag filtering | Always filter by category first | Reduces candidate set |
| Lower dimensions | Use smaller models (384-dim MiniLM) | Less accurate but faster |
| Reduce maxRecords | Limit stored records | Older data is lost |
| Batch searches | Group multiple queries | Amortize iteration cost |
| Use persistent backend | For > 100K records | SQLite/Pinecone/Weaviate for scale |

---

## Best Practices

1. **Match dimensions to your embedding model** -- configure the store with the exact dimensions of your embedding provider.

2. **Use tags for coarse filtering** -- filter by tags before similarity search to reduce the candidate set.

3. **Set appropriate thresholds** -- start with 0.7 for cosine similarity and tune based on your use case.

4. **Use `searchByText` for convenience** -- pass your embedding function once and reuse it for all searches.

5. **Store useful metadata** -- include source, timestamp, user ID, and session ID in metadata for auditability.

6. **Monitor store size** -- use `getStats()` to track record count and tag distribution.

7. **Clean up stale data** -- periodically delete deprecated or expired records using `deleteByTag()` or `delete()`.

8. **Use the right metric** -- cosine similarity is best for most cases; use dot product when magnitude matters; use euclidean for absolute distance.

---

## Related Documentation

- [`src/connection-pool/`](../connection-pool/README.md) -- Connection management for persistent backends
- [`src/content-moderator/`](../content-moderator/README.md) -- Moderate content before storing
- [`src/feature-flags/`](../feature-flags/README.md) -- Toggle semantic memory features
- [`src/cron/`](../cron/README.md) -- Scheduled store maintenance
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings) -- Embedding model documentation
- [Understanding Embeddings](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings) -- Conceptual guide
