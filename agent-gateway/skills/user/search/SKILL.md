---
name: search
description: Search implementation and optimization
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: database
---
## What I do
- Implement search functionality
- Use Elasticsearch effectively
- Design search indexes
- Handle search queries
- Optimize search performance
- Implement fuzzy matching
- Handle faceted search
- Implement search suggestions

## When to use me
When implementing search functionality or optimizing search.

## Elasticsearch Client
```python
from elasticsearch import Elasticsearch
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class SearchQuery:
    """Search query parameters."""
    query: str
    filters: Dict[str, Any] = None
    sort: List[Dict] = None
    page: int = 1
    page_size: int = 10
    highlight: bool = True
    aggregations: List[str] = None


class ElasticsearchClient:
    """Elasticsearch client wrapper."""
    
    def __init__(self, hosts: List[str]) -> None:
        self.client = Elasticsearch(hosts=hosts)
    
    def search(
        self,
        index: str,
        query: SearchQuery
    ) -> Dict[str, Any]:
        """Execute search query."""
        es_query = self._build_query(query)
        
        body = {"query": es_query}
        
        if query.sort:
            body["sort"] = query.sort
        
        if query.highlight:
            body["highlight"] = {
                "fields": {
                    "content": {},
                    "title": {},
                }
            }
        
        if query.aggregations:
            body["aggs"] = self._build_aggregations(query.aggregations)
        
        # Pagination
        from_index = (query.page - 1) * query.page_size
        body["from"] = from_index
        body["size"] = query.page_size
        
        return self.client.search(index=index, body=body)
    
    def _build_query(self, query: SearchQuery) -> Dict[str, Any]:
        """Build Elasticsearch query."""
        must = []
        filter_clauses = []
        
        # Full-text search
        if query.query:
            must.append({
                "multi_match": {
                    "query": query.query,
                    "fields": ["title^3", "content^2", "tags", "description"],
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                }
            })
        
        # Filters
        if query.filters:
            for field, value in query.filters.items():
                if isinstance(value, list):
                    filter_clauses.append({
                        "terms": {field: value}
                    })
                else:
                    filter_clauses.append({
                        "term": {field: value}
                    })
        
        # Combine
        es_query = {
            "bool": {
                "must": must if must else [{"match_all": {}}],
                "filter": filter_clauses,
            }
        }
        
        return es_query
    
    def _build_aggregations(self, fields: List[str]) -> Dict[str, Any]:
        """Build aggregations for faceted search."""
        aggs = {}
        
        for field in fields:
            aggs[field] = {
                "terms": {
                    "field": field,
                    "size": 20,
                }
            }
        
        return aggs


# Usage
es_client = ElasticsearchClient(["localhost:9200"])

results = es_client.search(
    index="products",
    query=SearchQuery(
        query="wireless headphones",
        filters={"category": ["electronics"], "brand": ["sony"]},
        sort=[{"price": {"order": "asc"}}],
        page=1,
        page_size=20,
        aggregations=["category", "brand", "price_range"],
    )
)
```

## Full-Text Search
```sql
-- PostgreSQL full-text search

-- Create tsvector column
ALTER TABLE products
ADD COLUMN search_vector tsvector;

-- Update search vector
UPDATE products
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(tags, '')), 'C');

-- Create index
CREATE INDEX idx_products_search
ON products USING GIN(search_vector);

-- Search query
SELECT id, name, ts_rank(search_vector, query) AS rank
FROM products,
     to_tsquery('english', 'wireless & headphones') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;


-- With ranking and highlighting
SELECT 
    id,
    name,
    ts_rank_cd(search_vector, query) AS rank,
    ts_headline('english', description, query) AS highlighted_description
FROM products,
     to_tsquery('english', 'wireless <-> headphones') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

## Search Suggestions
```python
from typing import List, Tuple


class SearchSuggestions:
    """Implement search autocomplete/suggestions."""
    
    def __init__(self, es_client: ElasticsearchClient) -> None:
        self.client = es_client
    
    def get_suggestions(
        self,
        query: str,
        size: int = 10,
        field: str = "name.suggest"
    ) -> List[str]:
        """Get search suggestions for autocomplete."""
        if len(query) < 2:
            return []
        
        es_query = {
            "suggest": {
                "product-suggest": {
                    "prefix": query,
                    "completion": {
                        "field": field,
                        "size": size,
                        "skip_duplicates": True,
                        "fuzzy": {
                            "fuzziness": "AUTO",
                        }
                    }
                }
            }
        }
        
        result = self.client.client.suggest(
            index="products",
            body=es_query
        )
        
        suggestions = []
        for suggestion in result['suggest']['product-suggest'][0]['options']:
            suggestions.append(suggestion['text'])
        
        return suggestions
    
    def get_popular_searches(self, user_id: str = None) -> List[Tuple[str, int]]:
        """Get popular search queries."""
        # Could come from analytics or Redis
        return [
            ("headphones", 1500),
            ("laptop", 1200),
            ("phone", 1000),
            ("wireless", 800),
            ("bluetooth", 600),
        ]
    
    def get_related_searches(self, query: str) -> List[str]:
        """Get related search queries."""
        # Use Elasticsearch more-like-this or terms suggester
        return []
```

## Faceted Search
```python
@dataclass
class FacetedSearchResult:
    """Faceted search result with aggregations."""
    total_hits: int
    page: int
    page_size: int
    results: List[Dict[str, Any]]
    facets: Dict[str, List[Dict[str, Any]]]
    query: str


class FacetedSearch:
    """Implement faceted search."""
    
    def __init__(self, es_client: ElasticsearchClient) -> None:
        self.client = es_client
    
    def search(
        self,
        index: str,
        query: str,
        facet_fields: List[str],
        page: int = 1,
        page_size: int = 20,
        filters: Dict[str, Any] = None,
    ) -> FacetedSearchResult:
        """Execute faceted search."""
        
        # Build query
        es_query = self._build_faceted_query(query, filters)
        
        # Build aggregations
        aggs = {}
        for field in facet_fields:
            aggs[field] = {
                "terms": {
                    "field": field,
                    "size": 20,
                }
            }
        
        # Execute search
        body = {
            "query": es_query,
            "aggs": aggs,
            "from": (page - 1) * page_size,
            "size": page_size,
        }
        
        result = self.client.client.search(index=index, body=body)
        
        # Parse results
        hits = result['hits']['total']['value']
        results = [hit['_source'] for hit in result['hits']['hits']]
        
        # Parse facets
        facets = {}
        for field in facet_fields:
            facets[field] = [
                {
                    "value": bucket['key'],
                    "count": bucket['doc_count'],
                }
                for bucket in result['aggregations'][field]['buckets']
            ]
        
        return FacetedSearchResult(
            total_hits=hits,
            page=page,
            page_size=page_size,
            results=results,
            facets=facets,
            query=query,
        )
    
    def _build_faceted_query(
        self,
        query: str,
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Build faceted search query."""
        must = []
        filter_clauses = []
        
        if query:
            must.append({
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "content"],
                }
            })
        
        if filters:
            for field, value in filters.items():
                if value:  # Only add if filter has value
                    filter_clauses.append({
                        "term": {field: value}
                    })
        
        return {
            "bool": {
                "must": must if must else [{"match_all": {}}],
                "filter": filter_clauses,
            }
        }
```

## Search Ranking
```python
class SearchRanker:
    """Custom search ranking factors."""
    
    # Weights for different factors
    WEIGHTS = {
        "text_relevance": 1.0,
        "popularity": 0.3,
        "recency": 0.2,
        "rating": 0.1,
        "price": -0.1,
    }
    
    def boost_results(
        self,
        results: List[Dict[str, Any]],
        query: str
    ) -> List[Dict[str, Any]]:
        """Apply ranking boosts to results."""
        
        for result in results:
            boost_score = 0.0
            
            # Text relevance (from Elasticsearch)
            boost_score += result.get('_score', 0) * self.WEIGHTS['text_relevance']
            
            # Popularity boost
            popularity = result.get('view_count', 0) + result.get('sales_count', 0) * 10
            boost_score += self._normalize(popularity, 10000) * self.WEIGHTS['popularity']
            
            # Recency boost
            days_since = (datetime.utcnow() - result.get('created_at', datetime.min)).days
            recency_score = max(0, 1 - days_since / 365)  # Decay over year
            boost_score += recency_score * self.WEIGHTS['recency']
            
            # Rating boost
            avg_rating = result.get('avg_rating', 0)
            boost_score += (avg_rating / 5.0) * self.WEIGHTS['rating']
            
            # Price penalty (for "price" sort)
            if 'price' in result:
                price_factor = 1 / (1 + result['price'] / 100)
                boost_score += price_factor * self.WEIGHTS['price']
            
            result['_boosted_score'] = boost_score
        
        # Sort by boosted score
        results.sort(key=lambda x: x.get('_boosted_score', 0), reverse=True)
        
        return results
    
    def _normalize(self, value: float, max_value: float) -> float:
        """Normalize value to 0-1 range."""
        return min(1.0, value / max_value)
```

## Best Practices
```
1. Design indexes for queries
   - Consider access patterns
   - Use appropriate analyzers

2. Optimize for search speed
   - Use covering indexes
   - Limit returned fields

3. Handle synonyms
   - Map synonyms to common terms
   - Build synonym dictionary

4. Implement pagination
   - Use cursor-based for large datasets
   - Limit page sizes

5. Handle edge cases
   - No results query
   - Misspellings (fuzzy matching)
   - Special characters

6. Secure search
   - Filter by user permissions
   - No information leakage

7. Monitor performance
   - Track query latency
   - Monitor index size

8. Test with real data
   - Test with common queries
   - Test edge cases
   - Test performance under load
```
