# Search Engine

Enterprise full-text search engine for the Agent Gateway. This module provides in-memory search with inverted indexing, query parsing, TF-IDF-like ranking, faceting, autocomplete, multi-field search, and configurable text analyzers.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Interfaces](#interfaces)
    - [SearchDocument](#searchdocument)
    - [SearchIndex](#searchindex)
    - [SearchField](#searchfield)
    - [SearchQuery](#searchquery)
    - [SearchResult](#searchresult)
  - [SearchEngine Class](#searchengine-class)
  - [createIndex()](#createindex)
  - [setFieldBoost()](#setfieldboost)
  - [index()](#index)
  - [remove()](#remove)
  - [search()](#search)
  - [autocomplete()](#autocomplete)
  - [getStats()](#getstats)
  - [deleteIndex()](#deleteindex)
  - [listIndexes()](#listindexes)
  - [Factory Function](#factory-function)
- [Text Analyzers](#text-analyzers)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Ranking Algorithm](#ranking-algorithm)
- [Performance Characteristics](#performance-characteristics)
- [Limitations](#limitations)
- [Related Documentation](#related-documentation)

## Overview

The `SearchEngine` module provides a lightweight, in-memory full-text search engine suitable for small to medium-sized datasets. It builds inverted indexes over text fields, supports multiple text analyzers, and provides TF-IDF-like scoring for result ranking.

**Key features:**
- **Inverted indexing:** Term-to-document mapping for fast full-text search.
- **Multiple analyzers:** Standard, whitespace, simple, and keyword tokenizers.
- **Field-level boosts:** Weight certain fields higher in relevance scoring.
- **Faceting:** Generate facet counts for filterable fields.
- **Autocomplete:** Prefix-based term completion.
- **Filtering:** Exact match, range, and array inclusion filters.
- **Highlighting:** Extract matching text fragments with context.
- **Sorting:** Multi-field sort with ascending/descending order.

## File Structure

```
/home/runner/workspace/agent-gateway/src/search-engine/
  index.ts          # SearchEngine class, all interfaces
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { SearchEngine, createSearchEngine } from '../search-engine/index.js';
// or with the full absolute path:
// import { SearchEngine, createSearchEngine } from '/home/runner/workspace/agent-gateway/src/search-engine/index.js';
```

## API Reference

### Interfaces

#### SearchDocument

A document to be indexed.

```typescript
export interface SearchDocument {
  id: string;
  [key: string]: any;
}
```

#### SearchIndex

An index containing documents, an inverted index, and field configuration.

```typescript
export interface SearchIndex {
  name: string;
  fields: SearchField[];
  documents: Map<string, SearchDocument>;
  invertedIndex: Map<string, Set<string>>; // term -> docIds
  fieldBoosts: Record<string, number>;
}
```

#### SearchField

A field definition for an index.

```typescript
export interface SearchField {
  name: string;
  type: 'text' | 'keyword' | 'number' | 'boolean' | 'date';
  searchable?: boolean;   // Whether to include in full-text search (default: true for text)
  filterable?: boolean;   // Whether to support filtering on this field
  sortable?: boolean;     // Whether to support sorting on this field
  facetable?: boolean;    // Whether to support faceting on this field
  analyzer?: 'standard' | 'whitespace' | 'simple' | 'keyword';
}
```

#### SearchQuery

A search query with optional filters, sorting, and pagination.

```typescript
export interface SearchQuery {
  query?: string;                              // Full-text query string
  filters?: Record<string, any>;               // Field filters
  sort?: { field: string; order: 'asc' | 'desc' }[]; // Sort criteria
  page?: number;                               // Page number (default: 1)
  pageSize?: number;                           // Items per page (default: 20, max: 100)
  fields?: string[];                           // Fields for faceting
  highlight?: boolean;                         // Whether to generate highlights
}
```

#### SearchResult

The result of a search operation.

```typescript
export interface SearchResult {
  hits: Array<{
    document: SearchDocument;
    score: number;
    highlights?: Record<string, string[]>;
  }>;
  total: number;
  page: number;
  pageSize: number;
  facets?: Record<string, Array<{ value: any; count: number }>>;
  queryTime: number;
}
```

### SearchEngine Class

Extends `EventEmitter` for indexing events.

```typescript
export class SearchEngine extends EventEmitter {
  createIndex(name: string, fields: SearchField[]): SearchIndex;
  setFieldBoost(indexName: string, fieldName: string, boost: number): boolean;
  index(indexName: string, document: SearchDocument): void;
  remove(indexName: string, documentId: string): boolean;
  search(indexName: string, query: SearchQuery): SearchResult;
  autocomplete(indexName: string, prefix: string, field: string, limit?: number): string[];
  getStats(indexName: string): { documentCount: number; termCount: number; indexSize: number };
  deleteIndex(indexName: string): boolean;
  listIndexes(): Array<{ name: string; documentCount: number; fieldCount: number }>;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `document:indexed` | `{ index, documentId }` | A document was indexed |

### createIndex()

Creates a new search index with the specified field definitions.

**Signature:**
```typescript
createIndex(name: string, fields: SearchField[]): SearchIndex
```

**Parameters:**
- `name: string` -- Unique name for the index.
- `fields: SearchField[]` -- Field definitions for the index.

**Returns:** The created `SearchIndex` object.

### setFieldBoost()

Sets a relevance boost for a specific field.

**Signature:**
```typescript
setFieldBoost(indexName: string, fieldName: string, boost: number): boolean
```

**Parameters:**
- `indexName: string` -- The index name.
- `fieldName: string` -- The field to boost.
- `boost: number` -- Multiplier for the field's relevance score (default: 1.0).

**Returns:** `true` if the index exists, `false` otherwise.

### index()

Indexes a document into the specified index.

**Signature:**
```typescript
index(indexName: string, document: SearchDocument): void
```

**Parameters:**
- `indexName: string` -- The index name.
- `document: SearchDocument` -- The document to index. Must have an `id` field.

**Behavior:**
1. Stores the document in the index's document map.
2. Tokenizes all text fields and adds terms to the inverted index.

### remove()

Removes a document from an index.

**Signature:**
```typescript
remove(indexName: string, documentId: string): boolean
```

**Returns:** `true` if the document was found and removed, `false` otherwise.

### search()

Executes a search query against an index.

**Signature:**
```typescript
search(indexName: string, query: SearchQuery): SearchResult
```

**Parameters:**
- `indexName: string` -- The index name.
- `query: SearchQuery` -- The search query with optional filters, sorting, pagination, and highlighting.

**Returns:** `SearchResult` with hits, total count, page info, facets, and query time.

### autocomplete()

Returns terms that start with the given prefix.

**Signature:**
```typescript
autocomplete(indexName: string, prefix: string, field: string, limit?: number): string[]
```

**Parameters:**
- `indexName: string` -- The index name.
- `prefix: string` -- The prefix to match.
- `field: string` -- The field name (currently used for context; the search scans all terms).
- `limit` (default: 10) -- Maximum results to return.

**Returns:** Array of matching terms.

### getStats()

Returns statistics for an index.

**Signature:**
```typescript
getStats(indexName: string): { documentCount: number; termCount: number; indexSize: number }
```

### deleteIndex()

Deletes an entire index.

**Signature:**
```typescript
deleteIndex(indexName: string): boolean
```

### listIndexes()

Lists all indexes with their document and field counts.

**Signature:**
```typescript
listIndexes(): Array<{ name: string; documentCount: number; fieldCount: number }>
```

### Factory Function

```typescript
export function createSearchEngine(): SearchEngine
```

## Text Analyzers

The engine supports four text analyzers for tokenizing text:

| Analyzer | Tokenization | Stopword Removal | Lowercasing | Best For |
|----------|-------------|-----------------|-------------|----------|
| `standard` | Split on whitespace + punctuation | Yes | Yes | General text search |
| `whitespace` | Split on whitespace only | No | No | Code, identifiers |
| `simple` | Split on non-alphanumeric | Yes | Yes | Simple text, tags |
| `keyword` | No tokenization (whole value) | No | No | Exact match fields |

**Stopwords:** The engine includes a built-in stopword list of 110+ common English words (articles, prepositions, pronouns, auxiliary verbs, etc.).

## Configuration Options

The `SearchEngine` has no constructor configuration. All settings are per-index through field definitions and per-query through `SearchQuery` parameters.

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `page` | `SearchQuery` | 1 | Page number |
| `pageSize` | `SearchQuery` | 20 | Items per page (max: 100) |
| `highlight` | `SearchQuery` | `false` | Whether to generate highlights |
| Field boost | `setFieldBoost()` | 1.0 | Multiplier for field relevance |
| Analyzer | `SearchField.analyzer` | `'standard'` | Tokenizer for text fields |

## Usage Examples

### Creating an Index and Indexing Documents

```typescript
import { createSearchEngine } from '/home/runner/workspace/agent-gateway/src/search-engine/index.js';

const engine = createSearchEngine();

// Create an index for products
engine.createIndex('products', [
  { name: 'title', type: 'text', searchable: true, facetable: false, analyzer: 'standard' },
  { name: 'description', type: 'text', searchable: true, facetable: false, analyzer: 'standard' },
  { name: 'category', type: 'keyword', filterable: true, facetable: true },
  { name: 'price', type: 'number', filterable: true, sortable: true },
  { name: 'inStock', type: 'boolean', filterable: true },
]);

// Boost title matches higher than description
engine.setFieldBoost('products', 'title', 3.0);

// Index documents
engine.index('products', {
  id: 'prod-1',
  title: 'Wireless Bluetooth Headphones',
  description: 'High-quality wireless headphones with noise cancellation',
  category: 'electronics',
  price: 99.99,
  inStock: true,
});

engine.index('products', {
  id: 'prod-2',
  title: 'USB-C Charging Cable',
  description: 'Durable braided USB-C cable, 6 feet long',
  category: 'accessories',
  price: 12.99,
  inStock: true,
});
```

### Full-Text Search with Filters and Sorting

```typescript
const result = engine.search('products', {
  query: 'wireless headphones',
  filters: {
    category: 'electronics',
    price: { gte: 50, lte: 200 },
    inStock: true,
  },
  sort: [{ field: 'price', order: 'asc' }],
  page: 1,
  pageSize: 10,
  highlight: true,
});

console.log(`Found ${result.total} results in ${result.queryTime}ms`);
for (const hit of result.hits) {
  console.log(`Score: ${hit.score}, Title: ${hit.document.title}`);
  if (hit.highlights) {
    console.log('  Highlights:', hit.highlights);
  }
}
```

### Autocomplete

```typescript
const suggestions = engine.autocomplete('products', 'wire', 'title', 5);
// ['wireless']
```

### Faceted Search

```typescript
const result = engine.search('products', {
  query: '',
  fields: ['category'], // Generate facets for the 'category' field
  page: 1,
  pageSize: 20,
});

console.log(result.facets?.category);
// [{ value: 'electronics', count: 15 }, { value: 'accessories', count: 8 }, ...]
```

### Index Management

```typescript
// List all indexes
console.log(engine.listIndexes());

// Get index stats
console.log(engine.getStats('products'));
// { documentCount: 2, termCount: 15, indexSize: 17 }

// Delete an index
engine.deleteIndex('products');
```

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Pagination | `/home/runner/workspace/agent-gateway/src/pagination/` | Search results include built-in pagination, but you can wrap results with `Paginator.offset()` for additional formatting. |
| Data Transformer | `/home/runner/workspace/agent-gateway/src/data-transformer/` | Transform search results (e.g., mask PII, add computed fields) before returning. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Cache search results with tag-based invalidation on data changes. |
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Expose search endpoints through the API gateway. |

## Error Handling

- **Index not found:** `index()`, `search()`, `remove()`, `getStats()`, and `setFieldBoost()` throw errors if the index doesn't exist.
- **Empty search:** Searching with no query and no filters returns all documents with a score of 1.
- **Invalid page:** If the page exceeds available results, an empty `hits` array is returned.
- **No tokenizer errors:** The `tokenize()` method handles edge cases (empty strings, non-string values) gracefully.
- **Highlight generation:** If no matches are found for a term in a field, no highlight is generated for that field.

## Ranking Algorithm

The scoring algorithm is a simplified TF-IDF-like approach:

1. **Exact match:** +10 * boost (the field value exactly matches the search term).
2. **Word boundary match:** +5 * boost (the term appears as a whole word in the field).
3. **Substring match:** +1 * boost (the term appears as a substring).
4. **Term frequency bonus:** +0.5 * boost for each search term found in the field.
5. **Field boost:** Each field has a configurable boost multiplier (default: 1.0).
6. **Inverted index score:** +1 for each term that matches a document.

Scores are summed across all searchable fields and all search terms.

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| `index()` | O(terms in document) | O(terms) in inverted index |
| `search()` full-text | O(query terms * avg docs per term) | O(matching docs) |
| `search()` with filters | O(total docs) for filter pass | O(filtered docs) |
| `search()` sorting | O(n log n) for n matching docs | O(n) |
| `remove()` | O(terms in document) | O(1) |
| `autocomplete()` | O(total terms) linear scan | O(limit) results |

**Note:** This is an in-memory engine. For large datasets (millions of documents), consider integrating with Elasticsearch, Meilisearch, or similar external search engines.

## Limitations

1. **In-memory only:** All data is stored in memory and lost on restart. No persistence layer.
2. **No stemming/lemmatization:** The analyzers do not perform stemming. "running" and "run" are treated as different terms.
3. **No fuzzy search:** Exact term matching only. No edit-distance or phonetic matching.
4. **Linear autocomplete:** Autocomplete scans all terms linearly. For large vocabularies, a trie-based approach would be more efficient.
5. **Single-threaded:** All operations are synchronous. For concurrent access, use external locking or a database-backed search engine.
6. **Unicode support:** The standard analyzer uses `\p{P}` for punctuation splitting, which requires Unicode-aware regex support.

## Related Documentation

- [Pagination](/home/runner/workspace/agent-gateway/src/pagination/README.md) -- Pagination utilities used by search results.
- [Cache Manager](/home/runner/workspace/agent-gateway/src/cache-manager/README.md) -- Caching search results.
- [Data Transformer](/home/runner/workspace/agent-gateway/src/data-transformer/README.md) -- Transforming search results.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Exposing search endpoints.
