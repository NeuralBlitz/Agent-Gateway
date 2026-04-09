---
name: elasticsearch
description: Elasticsearch full-text search engine, indexing strategies, and aggregations
category: databases
---
# Elasticsearch

## What I do

I am a distributed, RESTful search and analytics engine built on Apache Lucene. I excel at full-text search, structured search, analytics, logging, and metrics use cases. I provide near-real-time search capabilities, horizontal scalability, and powerful aggregation frameworks for building search experiences, log analytics dashboards, and operational intelligence platforms. I am the backbone of the ELK (Elasticsearch, Logstash, Kibana) stack.

## When to use me

- Building full-text search functionality for applications
- Log aggregation and analysis platforms
- Real-time analytics and metrics dashboards
- Application performance monitoring (APM)
- Security information and event management (SIEM)
- Product catalogs and e-commerce search
- Document search and content discovery
- Autocomplete and suggestions systems
- Geospatial search and location-based queries

## Core Concepts

1. **Indices and Documents**: Data organized in indices containing JSON documents with unique IDs
2. **Inverted Index**: Data structure enabling fast full-text search by mapping terms to documents
3. **Mapping**: Schema definition defining how documents and fields are stored and indexed
4. **Analyzers**: Tokenization pipelines processing text into searchable terms (standard, custom, language-specific)
5. **Query DSL**: JSON-based query language for complex searches (match, term, range, bool, function_score)
6. **Aggregations**: Framework for computing metrics, buckets, and statistical analysis on data
7. **Sharding and Replication**: Horizontal scaling through index partitioning and data redundancy
8. **集群管理**: Master nodes for coordination, data nodes for storage, ingest nodes for preprocessing
9. **索引生命周期**: Hot-Warm-Cold-Delete architecture for managing time-series data
10. **跨集群搜索**: Cross-cluster search for federated queries across multiple clusters

## Code Examples

### Basic Index Operations and Document Management

```python
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError, ConflictError
from datetime import datetime

es = Elasticsearch(["http://localhost:9200"])

def create_product_index():
    mapping = {
        "settings": {
            "number_of_shards": 3,
            "number_of_replicas": 1,
            "analysis": {
                "analyzer": {
                    "product_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "asciifolding", "product_synonyms"]
                    }
                },
                "filter": {
                    "product_synonyms": {
                        "type": "synonym",
                        "synonyms": [
                            "laptop, notebook, portable computer",
                            "phone, smartphone, mobile"
                        ]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "name": {"type": "text", "analyzer": "product_analyzer"},
                "description": {"type": "text", "analyzer": "standard"},
                "SKU": {"type": "keyword"},
                "price": {"type": "float"},
                "category": {"type": "keyword"},
                "in_stock": {"type": "boolean"},
                "tags": {"type": "keyword"},
                "created_at": {"type": "date"},
                "rating": {"type": "float"},
                "location": {"type": "geo_point"}
            }
        }
    }
    return es.indices.create(index="products", body=mapping)

def index_product(product_data):
    product_doc = {
        **product_data,
        "created_at": datetime.utcnow().isoformat()
    }
    return es.index(index="products", id=product_data["SKU"], document=product_doc)

def get_product(SKU):
    try:
        return es.get(index="products", id=SKU)
    except NotFoundError:
        return None

def update_product(SKU, updates):
    return es.update(index="products", id=SKU, doc=updates)

def delete_product(SKU):
    return es.delete(index="products", id=SKU)

def bulk_index_products(products):
    operations = []
    for product in products:
        operations.append({"index": {"_index": "products", "_id": product["SKU"]}})
        operations.append({**product, "created_at": datetime.utcnow().isoformat()})
    return es.bulk(operations=operations, refresh=True)
```

### Search Queries and Filtering

```python
def search_products(query, filters=None, page=1, per_page=20):
    search_query = {
        "query": {
            "bool": {
                "must": [
                    {"multi_match": {
                        "query": query,
                        "fields": ["name^3", "description", "tags^2"],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }}
                ],
                "filter": []
            }
        },
        "from": (page - 1) * per_page,
        "size": per_page,
        "sort": [
            {"_score": "desc"},
            {"rating": "desc"},
            {"price": "asc" if filters.get("sort") == "price_asc" else "desc"}
        ],
        "highlight": {
            "fields": {
                "name": {},
                "description": {"fragment_size": 150}
            }
        }
    }
    
    if filters:
        if "category" in filters:
            search_query["query"]["bool"]["filter"].append({"term": {"category": filters["category"]}})
        if "min_price" in filters:
            search_query["query"]["bool"]["filter"].append({"range": {"price": {"gte": filters["min_price"]}}})
        if "max_price" in filters:
            search_query["query"]["bool"]["filter"].append({"range": {"price": {"lte": filters["max_price"]}}})
        if "in_stock" in filters:
            search_query["query"]["bool"]["filter"].append({"term": {"in_stock": filters["in_stock"]}})
        if "tags" in filters:
            search_query["query"]["bool"]["filter"].append({"terms": {"tags": filters["tags"]}})
    
    return es.search(index="products", body=search_query)

def autocomplete(prefix, field="name", limit=10):
    return es.search(index="products", body={
        "query": {
            "match_phrase_prefix": {
                field: {"query": prefix, "max_expansions": 50}
            }
        },
        "size": limit,
        "_source": ["name", "SKU", "price"]
    })

def search_with_function_score(query, boost_factors=None):
    return es.search(index="products", body={
        "query": {
            "function_score": {
                "query": {"match_all": {}},
                "functions": [
                    {"field_value_factor": {"field": "rating", "factor": 1.2, "modifier": "log1p", "missing": 1}},
                    {"filter": {"term": {"in_stock": True}}, "weight": 2}
                ],
                "score_mode": "sum",
                "boost_mode": "multiply"
            }
        },
        "size": 50
    })

def fuzzy_search(query, fuzziness="AUTO"):
    return es.search(index="products", body={
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["name", "description"],
                "fuzziness": fuzziness
            }
        }
    })

def find_similar_products(SKU, limit=10):
    return es.search(index="products", body={
        "query": {
            "more_like_this": {
                "fields": ["name", "description", "tags"],
                "like": [{"_index": "products", "_id": SKU}],
                "min_term_freq": 1,
                "min_doc_freq": 1,
                "max_query_terms": 25
            }
        },
        "size": limit
    })
```

### Aggregations and Analytics

```python
def get_product_aggregations(category_filter=None):
    query = {"match_all": {}} if not category_filter else {"term": {"category": category_filter}}
    
    return es.search(index="products", body={
        "query": query,
        "size": 0,
        "aggs": {
            "categories": {"terms": {"field": "category", "size": 50}},
            "price_stats": {"stats": {"field": "price"}},
            "price_ranges": {
                "range": {
                    "field": "price",
                    "ranges": [
                        {"key": "budget", "to": 50},
                        {"key": "mid-range", "from": 50, "to": 200},
                        {"key": "premium", "from": 200}
                    ]
                }
            },
            "avg_rating_by_category": {
                "terms": {"field": "category", "size": 20},
                "aggs": {
                    "avg_rating": {"avg": {"field": "rating"}}
                }
            },
            "top_tags": {"terms": {"field": "tags", "size": 30}},
            "stock_status": {"terms": {"field": "in_stock"}}
        }
    })

def get_sales_analytics(start_date, end_date):
    return es.search(index="sales", body={
        "query": {
            "range": {"created_at": {"gte": start_date, "lte": end_date}}
        },
        "size": 0,
        "aggs": {
            "daily_sales": {
                "date_histogram": {
                    "field": "created_at",
                    "calendar_interval": "day"
                },
                "aggs": {
                    "total_revenue": {"sum": {"field": "amount"}},
                    "avg_order_value": {"avg": {"field": "amount"}},
                    "unique_customers": {"cardinality": {"field": "customer_id"}}
                }
            },
            "by_category": {
                "terms": {"field": "category"},
                "aggs": {
                    "revenue": {"sum": {"field": "amount"}}
                }
            }
        }
    })

def get_top_selling_products(limit=10):
    return es.search(index="sales", body={
        "query": {"match_all": {}},
        "size": 0,
        "aggs": {
            "products": {
                "terms": {"field": "product_id", "size": limit},
                "aggs": {
                    "total_revenue": {"sum": {"field": "amount"}},
                    "total_quantity": {"sum": {"field": "quantity"}}
                }
            }
        }
    })

def get_time_series_metrics(metric_field, interval="1h"):
    return es.search(index="metrics", body={
        "query": {"match_all": {}},
        "size": 0,
        "aggs": {
            "timeseries": {
                "date_histogram": {"field": "timestamp", "calendar_interval": interval},
                "aggs": {
                    "avg_value": {"avg": {"field": metric_field}},
                    "max_value": {"max": {"field": metric_field}},
                    "min_value": {"min": {"field": metric_field}},
                    "percentiles": {"percentiles": {"field": metric_field, "percents": [50, 90, 95, 99]}}
                }
            }
        }
    })
```

### Geospatial Queries

```python
def search_nearby_stores(location, radius_km=10, limit=20):
    return es.search(index="stores", body={
        "query": {
            "bool": {
                "must": {"match_all": {}},
                "filter": {
                    "geo_distance": {
                        "distance": f"{radius_km}km",
                        "location": location
                    }
                }
            }
        },
        "sort": [
            {"_geo_distance": {
                "location": location,
                "order": "asc",
                "unit": "km"
            }}
        ],
        "size": limit
    })

def search_stores_in_bounds(top_left, bottom_right):
    return es.search(index="stores", body={
        "query": {
            "geo_bounding_box": {
                "location": {
                    "top_left": top_left,
                    "bottom_right": bottom_right
                }
            }
        }
    })

def aggregate_by_location(grid_size="50km"):
    return es.search(index="stores", body={
        "size": 0,
        "aggs": {
            "store_grid": {
                "geotile_grid": {
                    "field": "location",
                    "precision": 12,
                    "size": 1000
                },
                "aggs": {
                    "avg_rating": {"avg": {"field": "rating"}},
                    "store_count": {"value_count": {"field": "id"}}
                }
            }
        }
    })

def find_stores_within_polygon(polygon):
    return es.search(index="stores", body={
        "query": {
            "geo_polygon": {
                "location": {"points": polygon}
            }
        }
    })
```

### Index Management and Optimization

```python
def refresh_index(index_name):
    return es.indices.refresh(index=index_name)

def force_merge_index(index_name, max_segments=1):
    return es.indices.forcemerge(index=index_name, max_num_segments=max_segments)

def update_index_settings(index_name, settings):
    return es.indices.put_settings(index=index_name, body=settings)

def get_index_stats(index_name):
    return es.indices.stats(index=index_name)

def create_index_alias(index_name, alias_name):
    return es.indices.put_alias(index=index_name, name=alias_name)

def rollover_index(alias_name, max_age="7d", max_docs=100000):
    return es.indices.rollover(alias=alias_name, conditions={
        "max_age": max_age,
        "max_docs": max_docs
    })

def reindex_from_remote(source_index, dest_index):
    return es.reindex(body={
        "source": {"remote": {"host": "http://old-cluster:9200"}, "index": source_index},
        "dest": {"index": dest_index}
    }, wait_for_completion=True)

def delete_old_indices(pattern="logs-*", older_than_days=30):
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    indices = es.cat.indices(index=pattern, h="index,creation.date").splitlines()
    
    deleted = []
    for line in indices:
        if line.strip():
            parts = line.split()
            index_name = parts[0]
            creation_date = datetime.fromisoformat(parts[1].replace("T", " ").split(".")[0])
            
            if creation_date < cutoff:
                es.indices.delete(index=index_name)
                deleted.append(index_name)
    
    return deleted
```

## Best Practices

1. **Design Index Mapping Carefully**: Define mappings upfront; changing field types after data exists is costly
2. **Use Appropriate Analyzers**: Choose analyzers based on language and use case; test with _analyze API
3. **Implement Index Lifecycle Management**: Use ILM policies for time-series data (hot-warm-cold-delete)
4. **Optimize Shard Count**: Aim for shards between 20-50GB; avoid too many small shards
5. **Use Query Caching**: Leverage query cache and request cache for repeated aggregations
6. **Implement Proper Refresh Intervals**: Balance index refresh rate with indexing throughput needs
7. **Monitor Cluster Health**: Track cluster stats, shard allocation, and node resource utilization
8. **Use Bulk API for Indexing**: Batch documents for bulk indexing to improve throughput
9. **Implement Cross-Cluster Search**: For multi-region or multi-environment queries
10. **Secure Your Cluster**: Enable authentication, TLS/SSL, and implement network policies
