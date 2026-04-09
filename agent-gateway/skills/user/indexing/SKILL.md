---
name: indexing
description: Database indexing strategies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---

## What I do
- Design efficient indexes
- Choose index types
- Optimize query performance

## When to use me
When creating database indexes.

## Index Types

### B-Tree Index
```python
class BTreeIndex:
    """B-Tree index implementation"""
    
    def __init__(self, order: int = 3):
        self.root = BTreeNode(order)
        self.order = order
    
    def insert(self, key: any, value: any):
        """Insert key-value pair"""
        root = self.root
        
        if root.is_full():
            new_root = BTreeNode(self.order)
            new_root.children.append(self.root)
            new_root.split_child(0)
            self.root = new_root
        
        self.root.insert_non_full(key, value)
    
    def search(self, key: any) -> any:
        """Search for key"""
        return self.root.search(key)
```

### Hash Index
```python
class HashIndex:
    """Hash-based index"""
    
    def __init__(self, size: int = 100):
        self.buckets = [[] for _ in range(size)]
        self.size = size
    
    def _hash(self, key: any) -> int:
        return hash(key) % self.size
    
    def insert(self, key: any, value: any):
        """Insert with hash collision handling"""
        bucket = self._hash(key)
        self.buckets[bucket].append((key, value))
    
    def search(self, key: any) -> any:
        """Search for key"""
        bucket = self._hash(key)
        for k, v in self.buckets[bucket]:
            if k == key:
                return v
        return None
```

### Composite Index
```python
class CompositeIndex:
    """Multi-column index"""
    
    def __init__(self, columns: List[str]):
        self.columns = columns
        self.index = {}
    
    def create_key(self, row: dict) -> tuple:
        """Create composite key from row"""
        return tuple(row.get(col) for col in self.columns)
    
    def insert(self, row: dict):
        """Insert row into index"""
        key = self.create_key(row)
        self.index[key] = row
    
    def search(self, **criteria) -> List[dict]:
        """Search using partial key"""
        partial = tuple(criteria.get(col) for col in self.columns)
        
        return [row for key, row in self.index.items()
                if key[:len(partial)] == partial]
```

### Index Selection
```python
class IndexSelector:
    """Choose appropriate indexes"""
    
    @staticmethod
    def recommend_indexes(queries: List[dict]) -> List[dict]:
        """Recommend indexes based on queries"""
        recommendations = []
        
        for query in queries:
            if "WHERE" in query:
                recommendations.append({
                    "columns": query["where_columns"],
                    "type": "btree",
                    "reason": "Equality/range query"
                })
            
            if "ORDER BY" in query:
                recommendations.append({
                    "columns": query["order_columns"],
                    "type": "btree",
                    "reason": "Sort optimization"
                })
        
        return recommendations
```
