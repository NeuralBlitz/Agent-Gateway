---
name: Elasticsearch
description: Distributed search and analytics engine with full-text search, log aggregation, and real-time data exploration capabilities
license: MIT
compatibility:
  - Python 3.8+
  - elasticsearch-py 8.0+
  - opensearch-py 2.0+
audience: Backend developers, data engineers, DevOps engineers
category: databases
---

# Elasticsearch

## What I Do

I provide guidance on Elasticsearch, the distributed search and analytics engine. I help with index design, query construction, aggregations, full-text search optimization, log aggregation with the ELK stack, and cluster management.

## When to Use Me

- Implementing full-text search with relevance scoring
- Log aggregation and analysis (ELK/EFK stack)
- Real-time dashboards and metrics
- Application search functionality
- Security analytics and SIEM
- Product/search recommendations
- Autocomplete and suggestion features

## Core Concepts

- **Indices**: Logical namespaces for documents
- **Documents**: JSON objects with unique _id
- **Mappings**: Schema definition for fields
- **Analyzers**: Tokenization and text processing
- **Query DSL**: JSON-based query language
- **Aggregations**: Data summarization (buckets, metrics)
- **Clusters**: Group of nodes working together
- **Shards**: Index fragments for distribution
- **Replicas**: Shard copies for fault tolerance
- **Ingest Pipelines**: Document transformation before indexing

## Code Examples

### Basic Index Operations

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(["http://localhost:9200"])

def create_product_index() -> None:
    es.indices.create(
        index="products",
        body={
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 1,
                "analysis": {
                    "analyzer": {
                        "product_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "asciifolding"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "name": {"type": "text", "analyzer": "product_analyzer"},
                    "description": {"type": "text"},
                    "price": {"type": "float"},
                    "category": {"type": "keyword"},
                    "created_at": {"type": "date"}
                }
            }
        }
    )

def index_product(product_id: str, product_data: dict) -> None:
    es.index(index="products", id=product_id, document=product_data)
```

### Search Queries

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(["http://localhost:9200"])

def search_products(query: str, category: str = None, limit: int = 20) -> list:
    must = [
        {"multi_match": {
            "query": query,
            "fields": ["name^3", "description"],
            "fuzziness": "AUTO"
        }}
    ]
    
    if category:
        must.append({"term": {"category": category}})
    
    response = es.search(
        index="products",
        body={
            "query": {"bool": {"must": must}},
            "size": limit,
            "_source": ["name", "price", "category"]
        }
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]
```

### Aggregations

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(["http://localhost:9200"])

def get_category_stats() -> dict:
    response = es.search(
        index="products",
        body={
            "size": 0,
            "aggs": {
                "categories": {
                    "terms": {"field": "category", "size": 20},
                    "aggs": {
                        "avg_price": {"avg": {"field": "price"}},
                        "price_ranges": {
                            "range": {
                                "field": "price",
                                "ranges": [
                                    {"key": "budget", "to": 50},
                                    {"key": "mid", "from": 50, "to": 200},
                                    {"key": "premium", "from": 200}
                                ]
                            }
                        }
                    }
                }
            }
        }
    )
    return response["aggregations"]["categories"]
```

### Autocomplete with Completion Suggester

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(["http://localhost:9200"])

def create_search_suggestions() -> None:
    es.indices.create(
        index="products-suggest",
        body={
            "settings": {
                "analysis": {
                    "analyzer": {
                        "autocomplete": {
                            "type": "custom",
                            "tokenizer": "autocomplete",
                            "filter": ["lowercase"]
                        },
                        "autocomplete_search": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase"]
                        }
                    },
                    "tokenizer": {
                        "autocomplete": {
                            "type": "edge_ngram",
                            "min_gram": 2,
                            "max_gram": 20,
                            "token_chars": ["letter", "digit"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "name": {
                        "type": "text",
                        "analyzer": "autocomplete",
                        "search_analyzer": "autocomplete_search"
                    },
                    "suggest": {
                        "type": "completion",
                        "analyzer": "simple"
                    }
                }
            }
        }
    )

def suggest_products(prefix: str) -> list:
    response = es.search(
        index="products-suggest",
        body={
            "suggest": {
                "product-suggest": {
                    "prefix": prefix,
                    "completion": {
                        "field": "suggest",
                        "size": 5,
                        "skip_duplicates": True
                    }
                }
            }
        }
    )
    return response["suggest"]["product-suggest"][0]["options"]
```

## Best Practices

1. Design indices based on retention and access patterns
2. Use ILM (Index Lifecycle Management) for data retention
3. Size shards appropriately (20-50GB target)
4. Use index templates for consistent mappings
5. Implement proper analyzers for text fields
6. Use filter context for exact matches (faster)
7. Consider parent/child relationships carefully
8. Monitor cluster health and resource usage
9. Use cross-cluster search for large datasets
10. Implement proper security (XPack/security)

## Common Patterns

**Log Analysis Pipeline:**
```python
def analyze_error_logs(time_range: str = "24h"):
    response = es.search(
        index="logs-*",
        body={
            "query": {"match": {"level": "ERROR"}},
            "aggs": {
                "by_hour": {
                    "date_histogram": {"field": "@timestamp", "interval": "hour"},
                    "aggs": {
                        "unique_errors": {"cardinality": {"field": "message.keyword"}}
                    }
                }
            }
        }
    )
    return response
```

**Pagination with Search After:**
```python
def scroll_search(index: str, batch_size: int = 1000):
    response = es.search(index=index, size=batch_size, sort=[{"_id": "asc"}])
    
    while response["hits"]["hits"]:
        yield [hit["_source"] for hit in response["hits"]["hits"]]
        
        last_sort = response["hits"]["hits"][-1]["sort"]
        response = es.search(
            index=index,
            body={
                "size": batch_size,
                "sort": [{"_id": "asc"}],
                "search_after": last_sort
            }
        )
```
