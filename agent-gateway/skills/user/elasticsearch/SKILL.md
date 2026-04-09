---
name: elasticsearch
description: Elasticsearch distributed search and analytics engine
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---
## What I do
- Design Elasticsearch indices
- Write complex queries
- Use aggregations
- Configure analyzers
- Handle mappings
- Optimize performance
- Use Beats and Logstash

## When to use me
When building full-text search, log analytics, or real-time applications.

## Mappings
```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "english",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "content": {
        "type": "text"
      },
      "author": {
        "type": "keyword"
      },
      "published_at": {
        "type": "date"
      },
      "views": {
        "type": "integer"
      },
      "tags": {
        "type": "keyword"
      },
      "location": {
        "type": "geo_point"
      }
    }
  }
}
```

## Queries
```json
// Match query
{
  "query": {
    "match": {
      "title": "elasticsearch guide"
    }
  }
}

// Boolean query
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "elasticsearch" } }
      ],
      "filter": [
        { "term": { "status": "published" } }
      ],
      "should": [
        { "match": { "content": "tutorial" } }
      ],
      "must_not": [
        { "term": { "author": "banned" } }
      ]
    }
  }
}

// Multi-match
{
  "query": {
    "multi_match": {
      "query": "search engine",
      "fields": ["title^2", "content"]
    }
  }
}

// Nested query
{
  "query": {
    "nested": {
      "path": "comments",
      "query": {
        "match": { "comments.text": "great" }
      }
    }
  }
}
```

## Aggregations
```json
{
  "size": 0,
  "aggs": {
    "avg_views": {
      "avg": { "field": "views" }
    },
    "by_status": {
      "terms": { "field": "status" }
    },
    "by_author": {
      "terms": { "field": "author", "size": 10 }
    },
    "publish_dates": {
      "date_histogram": {
        "field": "published_at",
        "calendar_interval": "month"
      }
    }
  }
}
```

## Ingest Pipeline
```json
{
  "description": "Process logs",
  "processors": [
    {
      "grok": {
        "field": "message",
        "patterns": ["%{TIMESTAMP:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}"]
      }
    },
    {
      "date": {
        "field": "timestamp",
        "formats": ["ISO8601"]
      }
    },
    {
      "lowercase": {
        "field": "level"
      }
    },
    {
      "remove": {
        "field": "timestamp"
      }
    }
  ]
}
```

## Python Client
```python
from elasticsearch import Elasticsearch

es = Elasticsearch(["http://localhost:9200"])

# Create index
es.indices.create(index="documents", body={
    "mappings": {
        "properties": {
            "title": {"type": "text"},
            "content": {"type": "text"},
            "date": {"type": "date"}
        }
    }
})

# Index document
es.index(index="documents", id=1, body={
    "title": "Elasticsearch Guide",
    "content": "Learn Elasticsearch",
    "date": "2024-01-01"
})

# Search
result = es.search(index="documents", body={
    "query": {
        "match": {"content": "elasticsearch"}
    }
})

for hit in result["hits"]["hits"]:
    print(hit["_source"])
```

## Performance Tips
```json
// Filter context over query for filters
{
  "query": {
    "bool": {
      "filter": [  // Use filter, not must
        { "term": { "status": "active" } }
      ]
    }
  }
}

// Pagination
{
  "query": { "match_all": {} },
  "from": 10000,
  "size": 10
}

// Better: search_after for deep pagination
{
  "query": { "match_all": {} },
  "search_after": ["value", "id"],
  "size": 10
}
```
