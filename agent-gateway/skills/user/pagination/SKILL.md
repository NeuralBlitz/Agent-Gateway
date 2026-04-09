---
name: pagination
description: API pagination design and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design pagination for REST APIs
- Implement cursor-based pagination
- Handle offset-based pagination
- Optimize for large datasets
- Support sorting and filtering
- Design consistent response formats
- Handle edge cases
- Document pagination behavior

## When to use me
When implementing pagination in APIs or queries.

## Pagination Strategies

### Offset-Based Pagination
```sql
-- Simple offset pagination
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;  -- Page 3 (20 per page)
```

**Pros:**
- Simple to implement
- Easy to navigate to specific pages
- URLs are shareable

**Cons:**
- Performance degrades with large offsets
- Inconsistent results with changing data
- Cannot efficiently skip to end

### Cursor-Based Pagination
```sql
-- Cursor pagination using created_at and id
SELECT * FROM posts
WHERE (created_at, id) < (LAST_CURSOR_CREATED_AT, LAST_CURSOR_ID)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Pros:**
- Consistent performance regardless of offset
- Handles real-time data better
- More efficient for large datasets

**Cons:**
- Cannot jump to random page
- More complex implementation
- Requires unique, ordered cursor

### Keyset Pagination
```sql
-- Keyset pagination for sorted results
SELECT * FROM posts
WHERE status = 'published'
  AND (score, id) < (LAST_SCORE, LAST_ID)
ORDER BY score DESC, id DESC
LIMIT 20;
```

## Cursor-Based Implementation
```python
from dataclasses import dataclass
from typing import Generic, TypeVar, List, Optional, Dict, Any
import base64
import json


T = TypeVar('T')


@dataclass
class Cursor:
    """Base64-encoded cursor containing ordering values."""
    values: tuple
    created_at: str  # ISO format timestamp

    def encode(self) -> str:
        """Encode cursor to base64 string."""
        data = {
            'v': list(self.values),
            'c': self.created_at,
        }
        return base64.urlsafe_b64encode(
            json.dumps(data).encode('utf-8')
        ).decode('utf-8')

    @classmethod
    def decode(cls, cursor_str: str) -> Optional['Cursor']:
        """Decode cursor from base64 string."""
        try:
            data = json.loads(
                base64.urlsafe_b64decode(
                    cursor_str.encode('utf-8')
                ).decode('utf-8')
            )
            return cls(values=tuple(data['v']), created_at=data['c'])
        except Exception:
            return None


class Paginator(Generic[T]):
    """Cursor-based paginator for API results."""

    def __init__(
        self,
        queryset,
        limit: int = 20,
        max_limit: int = 100
    ) -> None:
        self.queryset = queryset
        self.limit = limit
        self.max_limit = min(limit, max_limit)

    def paginate(
        self,
        cursor_str: Optional[str] = None,
        sort_by: str = 'created_at',
        sort_order: str = 'desc'
    ) -> Dict[str, Any]:
        """Get paginated results."""
        limit = self.max_limit

        # Decode cursor
        cursor = None
        if cursor_str:
            cursor = Cursor.decode(cursor_str)
            if cursor:
                # Extract cursor values (exclude timestamp)
                cursor_values = cursor.values
            else:
                cursor_values = None
        else:
            cursor_values = None

        # Build query
        query = self.queryset

        if cursor_values and sort_order == 'desc':
            # For descending, use < comparison
            filters = {
                f'{sort_by}__lt': cursor_values[0],
            }
            if len(cursor_values) > 1:
                filters['id__lt'] = cursor_values[1]
            query = query.filter(**filters)

        # Order and limit
        order = '-' + sort_by if sort_order == 'desc' else sort_by
        items = query.order_by(order)[:limit + 1]

        # Check if there are more results
        has_next = len(items) > limit
        items = items[:limit]

        # Build response
        next_cursor = None
        if has_next and items:
            last_item = items[-1]
            next_cursor = Cursor(
                values=(getattr(last_item, sort_by), last_item.id),
                created_at=datetime.utcnow().isoformat()
            ).encode()

        return {
            'items': items,
            'next_cursor': next_cursor,
            'has_next': has_next,
        }


def paginated_response(
    items: List[Any],
    next_cursor: Optional[str] = None,
    has_next: bool = False,
    total_count: Optional[int] = None
) -> Dict[str, Any]:
    """Build standardized paginated API response."""
    response = {
        'data': items,
        'pagination': {
            'next_cursor': next_cursor,
            'has_next': has_next,
        }
    }

    if total_count is not None:
        response['pagination']['total'] = total_count

    return response
```

## API Response Format
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "First Post",
      "author": {
        "id": "123",
        "name": "John Doe"
      },
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Second Post",
      "author": {
        "id": "456",
        "name": "Jane Smith"
      },
      "created_at": "2024-01-14T15:20:00Z"
    }
  ],
  "links": {
    "self": "/api/v1/posts?cursor=abc123&limit=20",
    "first": "/api/v1/posts?limit=20",
    "next": "/api/v1/posts?cursor=def456&limit=20",
    "prev": null
  },
  "meta": {
    "total_count": 1500,
    "page_size": 20,
    "current_page": 1
  }
}
```

## Sorting and Filtering
```python
from enum import Enum


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField:
    """Validate and map sort fields."""
    
    ALLOWED_FIELDS = {
        'created_at',
        'updated_at',
        'title',
        'author_name',
        'popularity',
    }
    
    @classmethod
    def validate(cls, field: str) -> Optional[str]:
        """Return validated field or None."""
        if field in cls.ALLOWED_FIELDS:
            return field
        return None


class FilterParser:
    """Parse and apply filter parameters."""
    
    SUPPORTED_FILTERS = {
        'status': {'draft', 'published', 'archived'},
        'author_id': None,  # Any string
        'created_after': None,  # ISO date
        'created_before': None,
        'has_tags': None,  # Comma-separated
    }
    
    @classmethod
    def parse(cls, params: Dict[str, str]) -> Dict[str, Any]:
        """Parse filter parameters."""
        filters = {}
        
        for key, value in params.items():
            if key in cls.SUPPORTED_FILTERS:
                if key.startswith('created_'):
                    filters[key] = cls._parse_date(value)
                elif key == 'has_tags':
                    filters['tags__in'] = value.split(',')
                else:
                    allowed = cls.SUPPORTED_FILTERS[key]
                    if allowed is None or value in allowed:
                        filters[key] = value
        
        return filters
    
    @staticmethod
    def _parse_date(value: str) -> datetime:
        """Parse ISO date string."""
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError(f"Invalid date format: {value}")
```

## Edge Cases
```python
class PaginationEdgeCases:
    """Handle pagination edge cases."""
    
    @staticmethod
    def handle_empty_results(cursor: Optional[str]) -> Dict[str, Any]:
        """Handle empty result set."""
        return {
            'data': [],
            'links': {
                'self': f"/api/v1/posts?cursor={cursor or ''}",
                'first': "/api/v1/posts",
                'next': None,
                'prev': None,
            },
            'meta': {
                'total': 0,
                'page_size': 20,
            },
        }
    
    @staticmethod
    def handle_single_page(cursor: str, items: List) -> Dict[str, Any]:
        """Handle result set that fits on one page."""
        return {
            'data': items,
            'links': {
                'self': f"/api/v1/posts?cursor={cursor}",
                'first': "/api/v1/posts",
                'next': None,
                'prev': None,
            },
            'meta': {
                'total': len(items),
                'page_size': len(items),
            },
        }
    
    @staticmethod
    def validate_cursor(
        cursor: str,
        max_age_seconds: int = 86400
    ) -> bool:
        """Validate cursor hasn't expired."""
        decoded = Cursor.decode(cursor)
        if not decoded:
            return False
        
        # Check timestamp
        cursor_time = datetime.fromisoformat(decoded.created_at)
        max_age = timedelta(seconds=max_age_seconds)
        
        return datetime.utcnow() - cursor_time < max_age
```

## Different Pagination Styles
```json
// Offset-based (page 2 of 10 items per page)
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 10,
    "total": 100,
    "total_pages": 10,
    "has_next": true,
    "has_prev": true
  }
}

// Cursor-based
{
  "data": [...],
  "pagination": {
    "next_cursor": "abc123...",
    "has_next": true,
    "has_prev": false
  }
}

// Relative (links for next/prev)
{
  "data": [...],
  "links": {
    "self": "/posts?page=2",
    "first": "/posts?page=1",
    "prev": "/posts?page=1",
    "next": "/posts?page=3",
    "last": "/posts?page=10"
  }
}

// Header-based
// Link: </posts?cursor=abc>; rel="next", </posts?cursor=def>; rel="prev"
```
