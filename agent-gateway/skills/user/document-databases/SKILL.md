---
name: document-databases
description: Document-oriented databases
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---

## What I do
- Design document schemas
- Implement MongoDB-style operations
- Optimize document queries

## When to use me
When working with document databases like MongoDB, CouchDB.

## Document Operations
```python
class DocumentStore:
    """Document database operations"""
    
    def __init__(self, connection):
        self.db = connection
    
    def insert_document(self, collection: str, document: dict):
        """Insert a document"""
        return self.db[collection].insert_one(document)
    
    def find_documents(self, collection: str, 
                      query: dict = None,
                      projection: dict = None):
        """Query documents"""
        return self.db[collection].find(query or {}, projection)
    
    def update_document(self, collection: str, 
                       query: dict, update: dict):
        """Update documents"""
        return self.db[collection].update_many(query, update)
    
    def aggregate(self, collection: str, pipeline: list):
        """Run aggregation pipeline"""
        return self.db[collection].aggregate(pipeline)
```

### Aggregation Pipeline
```python
class AggregationExamples:
    """Aggregation pipeline examples"""
    
    @staticmethod
    def match_group_project():
        return [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$category", 
                       "count": {"$sum": 1}}},
            {"$project": {"category": "$_id", "count": 1, 
                         "_id": 0}}
        ]
```
