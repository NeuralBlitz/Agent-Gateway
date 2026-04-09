---
name: MongoDB
description: Leading NoSQL document database with flexible schema, horizontal scaling, and powerful query capabilities
license: MIT
compatibility:
  - Python 3.8+
  - pymongo 4.0+
  - motor 3.0+ (async)
  - mongoengine 0.27+
audience: Backend developers, full-stack developers, DevOps engineers
category: databases
---

# MongoDB

## What I Do

I provide guidance on MongoDB, a document-oriented NoSQL database with flexible JSON-like documents. I help with document modeling, aggregation pipelines, indexing strategies, replication, sharding, and working with the MongoDB Atlas cloud service.

## When to Use Me

- Building applications with evolving/unpredictable schemas
- Need for horizontal scalability through sharding
- Real-time analytics with aggregation pipelines
- Content management systems
- Mobile backends with offline sync
- IoT data storage with high write throughput

## Core Concepts

- **Documents**: BSON format with dynamic schema
- **Collections**: Groups of documents (like tables)
- **ObjectId**: Unique identifier with timestamp
- **Indexes**: Single field, compound, text, geospatial, hashed
- **Aggregation Pipeline**: Multi-stage data processing
- **Transactions**: Multi-document ACID transactions (4.0+)
- **Replica Sets**: Automatic failover and data redundancy
- **Sharding**: Horizontal data distribution across clusters
- **$lookup**: SQL-style JOINs between collections
- **Change Streams**: Real-time data change notifications

## Code Examples

### Basic Connection and Document Operations

```python
from pymongo import MongoClient
from datetime import datetime
from typing import Optional

client = MongoClient("mongodb://localhost:27017")
db = client["app_db"]
users = db["users"]

def create_user(email: str, name: str) -> str:
    doc = {
        "email": email,
        "name": name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "active": True
    }
    result = users.insert_one(doc)
    return str(result.inserted_id)

def get_user_by_email(email: str) -> Optional[dict]:
    return users.find_one({"email": email})
```

### Aggregation Pipeline

```python
from pymongo import MongoClient
from datetime import datetime, timedelta

client = MongoClient("mongodb://localhost:27017")
db = client["app_db"]
orders = db["orders"]

def get_top_customers(limit: int = 10) -> list:
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$customer_id",
            "total_spent": {"$sum": "$amount"},
            "order_count": {"$sum": 1}
        }},
        {"$sort": {"total_spent": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "customer"
        }},
        {"$unwind": "$customer"},
        {"$project": {
            "name": "$customer.name",
            "email": "$customer.email",
            "total_spent": 1,
            "order_count": 1
        }}
    ]
    return list(orders.aggregate(pipeline))
```

### Transactions

```python
from pymongo import MongoClient
from bson import ObjectId

client = MongoClient("mongodb://localhost:27017")
db = client["app_db"]

def transfer_credits(from_user: str, to_user: str, amount: float) -> bool:
    with client.start_session() as session:
        with session.start_transaction():
            from_acc = db.accounts.find_one({"user_id": from_user}, session=session)
            if not from_acc or from_acc["credits"] < amount:
                raise ValueError("Insufficient credits")
            
            db.accounts.update_one(
                {"user_id": from_user},
                {"$inc": {"credits": -amount}},
                session=session
            )
            db.accounts.update_one(
                {"user_id": to_user},
                {"$inc": {"credits": amount}},
                session=session
            )
    return True
```

### Geospatial Query

```python
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["app_db"]
stores = db["stores"]

def find_nearby_stores(lng: float, lat: float, max_km: float = 10) -> list:
    return list(stores.find({
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": max_km * 1000
            }
        }
    }))
```

## Best Practices

1. Design schemas based on application query patterns
2. Use embedded documents to reduce joins
3. Create indexes for frequently queried fields
4. Use `$lookup` sparingly; prefer denormalization
5. Implement proper document validation rules
6. Use bulk_write for batch operations
7. Configure appropriate write concern levels
8. Monitor index size and query performance
9. Use projection to limit returned fields
10. Implement TTL indexes for automatic data expiration

## Common Patterns

**Document Versioning:**
```python
{
    "_id": ObjectId("..."),
    "current_version": 3,
    "versions": [
        {"version": 1, "data": {...}},
        {"version": 2, "data": {...}},
        {"version": 3, "data": {...}}
    ]
}
```

**Soft Delete:**
```python
users.update_one(
    {"_id": user_id},
    {"$set": {"deleted_at": datetime.utcnow(), "active": False}}
)
# Query: {"active": True, "deleted_at": None}
```

**Change Streams:**
```python
with db.orders.watch([{"$match": {"operationType": "insert"}}]) as stream:
    for change in stream:
        print(f"New order: {change['fullDocument']['order_id']}")
```
