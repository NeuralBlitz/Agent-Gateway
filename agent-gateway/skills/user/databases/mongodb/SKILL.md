---
name: mongodb
description: MongoDB document database management, aggregation pipelines, and data modeling
category: databases
---
# MongoDB

## What I do

I am a leading NoSQL document database that stores data in flexible, JSON-like documents with dynamic schemas. I excel at handling unstructured and semi-structured data, providing horizontal scalability through sharding, and supporting rich query capabilities including full-text search, geospatial queries, and complex aggregations. I am designed for rapid development, scalability, and handling diverse data types in modern applications.

## When to use me

- Building applications with rapidly evolving schemas or unknown data structures
- Content management systems and catalogs with variable attributes
- Real-time analytics and IoT data ingestion
- Mobile applications requiring offline sync capabilities
- Applications needing flexible nested data structures
- Systems requiring horizontal scalability and high availability
- Rapid prototyping and iterative development
- Managing user-generated content with diverse structures

## Core Concepts

1. **Documents and Collections**: Data stored as BSON documents within collections; no fixed schema requirement
2. **BSON (Binary JSON)**: Binary-encoded serialization supporting additional data types (ObjectId, Date, Binary)
3. **ObjectId**: Auto-generated 12-byte unique identifier consisting of timestamp, machine identifier, process ID, and counter
4. **Indexes**: Support for single field, compound, multi-key, text, geospatial (2dsphere, 2d), and wildcard indexes
5. **Aggregation Pipeline**: Multi-stage data processing framework for transformations, filtering, and aggregations
6. **Sharding**: Horizontal partitioning of data across multiple servers for scalability
7. **Replication**:Replica sets provide high availability with automatic failover
8. **Transactions**: Multi-document ACID transactions (MongoDB 4.0+) for complex operations
9. **Data Modeling**: Embedding vs referencing based on access patterns, cardinality, and size
10. **Change Streams**: Real-time data change notifications for event-driven architectures

## Code Examples

### Basic Connection and CRUD Operations

```python
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["app_database"]

def create_user(user_data):
    user_doc = {
        "email": user_data["email"],
        "name": user_data["name"],
        "password_hash": user_data["password_hash"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "profile": user_data.get("profile", {})
    }
    result = db.users.insert_one(user_doc)
    return str(result.inserted_id)

def get_user_by_email(email):
    return db.users.find_one({"email": email})

def get_user_with_orders(user_id):
    from bson import ObjectId
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["orders"] = list(db.orders.find({"user_id": ObjectId(user_id)}).sort("created_at", -1))
    return user

def update_user_profile(user_id, profile_updates):
    from bson import ObjectId
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {**profile_updates, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

def delete_user(user_id):
    from bson import ObjectId
    with db.client.start_session() as session:
        with session.start_transaction():
            db.orders.delete_many({"user_id": ObjectId(user_id)}, session=session)
            result = db.users.delete_one({"_id": ObjectId(user_id)}, session=session)
            return result.deleted_count > 0
```

### Aggregation Pipeline for Analytics

```python
from bson import ObjectId
from datetime import datetime, timedelta

def get_sales_analytics(start_date, end_date):
    pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total"},
            "avg_order_value": {"$avg": "$total"},
            "unique_customers": {"$addToSet": "$user_id"}
        }},
        {"$project": {
            "date": "$_id",
            "total_orders": 1,
            "total_revenue": 1,
            "avg_order_value": 1,
            "unique_customers": {"$size": "$unique_customers"}
        }},
        {"$sort": {"date": 1}}
    ]
    return list(db.orders.aggregate(pipeline))

def get_top_products(limit=10):
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "total_quantity": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": {"$multiply": ["$items.quantity", "$items.price"]}}
        }},
        {"$lookup": {
            "from": "products",
            "localField": "_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$project": {
            "name": "$product.name",
            "total_quantity": 1,
            "total_revenue": 1
        }},
        {"$sort": {"total_revenue": -1}},
        {"$limit": limit}
    ]
    return list(db.order_items.aggregate(pipeline))

def get_user_segmentation():
    pipeline = [
        {"$lookup": {
            "from": "orders",
            "localField": "_id",
            "foreignField": "user_id",
            "as": "orders"
        }},
        {"$project": {
            "name": 1,
            "email": 1,
            "total_orders": {"$size": "$orders"},
            "total_spent": {"$sum": "$orders.total"},
            "last_order_date": {"$max": "$orders.created_at"}
        }},
        {"$addFields": {
            "segment": {
                "$switch": {
                    "branches": [
                        {"case": {"$gte": ["$total_orders", 10]}, "then": "premium"},
                        {"case": {"$gte": ["$total_orders", 5]}, "then": "regular"},
                        {"case": {"$gte": ["$total_orders", 1]}, "then": "occasional"}
                    ],
                    "default": "new"
                }
            }
        }}
    ]
    return list(db.users.aggregate(pipeline))

def get_category_performance():
    pipeline = [
        {"$unwind": "$items"},
        {"$lookup": {
            "from": "products",
            "localField": "items.product_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$group": {
            "_id": "$product.category",
            "total_sales": {"$sum": {"$multiply": ["$items.quantity", "$items.price"]}},
            "total_quantity": {"$sum": "$items.quantity"},
            "order_count": {"$sum": 1}
        }},
        {"$sort": {"total_sales": -1}}
    ]
    return list(db.orders.aggregate(pipeline))
```

### Complex Queries and Indexing

```python
from pymongo import ASCENDING, DESCENDING, TEXT

def create_product_indexes():
    db.products.create_index([("name", TEXT), ("description", TEXT)], default_language="english")
    db.products.create_index([("category", ASCENDING), ("price", DESCENDING)])
    db.products.create_index([("SKU", ASCENDING)], unique=True)
    db.products.create_index([("tags", ASCENDING)])
    db.products.create_index([("created_at", DESCENDING)])

def search_products(query, filters=None):
    search_filter = {"$text": {"$search": query}}
    
    if filters:
        if "min_price" in filters:
            search_filter.setdefault("$and", []).append({"price": {"$gte": filters["min_price"]}})
        if "max_price" in filters:
            search_filter.setdefault("$and", []).append({"price": {"$lte": filters["max_price"]}})
        if "category" in filters:
            search_filter["category"] = filters["category"]
    
    return db.products.find(
        search_filter,
        {"score": {"$meta": "textScore"}}
    ).sort("score", {"$meta": "textScore"}).limit(50)

def find_nearby_stores(location, max_distance_meters=5000):
    return db.stores.find({
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": location},
                "$maxDistance": max_distance_meters
            }
        }
    })

def get_products_by_tags(tags, match_all=False):
    operator = "$all" if match_all else "$in"
    return db.products.find({"tags": {operator: tags}})

def get_inventory_alerts(threshold=10):
    return list(db.products.aggregate([
        {"$match": {"stock": {"$lte": threshold}}},
        {"$project": {
            "name": 1,
            "SKU": 1,
            "stock": 1,
            "reorder_point": "$reorder_level",
            "status": {
                "$cond": {"if": {"$lte": ["$stock", 5]}, "then": "critical", "else": "low"}
            }
        }},
        {"$sort": {"stock": 1}}
    ]))
```

### Transactions and Batch Operations

```python
from bson import ObjectId
from pymongo.errors import BulkWriteError

def create_order_with_inventory_check(user_id, items, shipping_address):
    with db.client.start_session() as session:
        with session.start_transaction():
            for item in items:
                product = db.products.find_one({
                    "_id": item["product_id"],
                    "stock": {"$gte": item["quantity"]}
                }, session=session)
                
                if not product:
                    raise ValueError(f"Insufficient stock for product {item['product_id']}")
            
            order_doc = {
                "user_id": ObjectId(user_id),
                "items": items,
                "total": sum(item["quantity"] * item["price"] for item in items),
                "status": "pending",
                "shipping_address": shipping_address,
                "created_at": datetime.utcnow()
            }
            
            order_result = db.orders.insert_one(order_doc, session=session)
            
            for item in items:
                db.products.update_one(
                    {"_id": item["product_id"]},
                    {"$inc": {"stock": -item["quantity"]}},
                    session=session
                )
            
            return str(order_result.inserted_id)

def bulk_insert_products(products):
    docs = []
    for product in products:
        docs.append({
            "name": product["name"],
            "SKU": product["SKU"],
            "price": product["price"],
            "category": product["category"],
            "stock": product.get("stock", 0),
            "tags": product.get("tags", []),
            "created_at": datetime.utcnow()
        })
    
    try:
        result = db.products.insert_many(docs, ordered=False)
        return len(result.inserted_ids)
    except BulkWriteError as e:
        return e.details.get("nInserted", 0)

def update_prices_by_category(category, price_change_percent):
    return db.products.update_many(
        {"category": category},
        {"$mul": {"price": 1 + price_change_percent / 100}}
    ).modified_count

def migrate_user_data():
    pipeline = [
        {"$match": {"profile.address": {"$exists": True}}},
        {"$addFields": {
            "address": {
                "street": "$profile.address.street",
                "city": "$profile.address.city",
                "state": "$profile.address.state",
                "zip": "$profile.address.zip_code"
            }
        }},
        {"$unset": ["profile.address", "profile.address_old"]}
    ]
    return db.users.update_many(pipeline, {})
```

### Geospatial Queries and Array Operations

```python
def create_store_location(name, address, coordinates):
    db.stores.create_index([("location", "2dsphere")])
    
    store_doc = {
        "name": name,
        "address": address,
        "location": {"type": "Point", "coordinates": coordinates},
        "hours": [
            {"day": "Monday", "open": "09:00", "close": "21:00"},
            {"day": "Tuesday", "open": "09:00", "close": "21:00"},
        ],
        "services": ["pickup", "delivery", "installation"]
    }
    return db.stores.insert_one(store_doc).inserted_id

def search_stores_with_services(services):
    return db.stores.find({"services": {"$all": services}})

def get_orders_with_multiple_items(min_items=3):
    return db.orders.find({"$expr": {"$gte": [{"$size": "$items"], min_items]}})

def get_popular_tags():
    return list(db.products.aggregate([
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]))

def calculate_cart_total(user_id):
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "status": "active"}},
        {"$unwind": "$items"},
        {"$lookup": {
            "from": "products",
            "localField": "items.product_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$group": {
            "_id": "$_id",
            "items": {"$push": {
                "name": "$product.name",
                "quantity": "$items.quantity",
                "price": "$items.price"
            }},
            "subtotal": {"$sum": {"$multiply": ["$items.quantity", "$items.price"]}}
        }}
    ]
    return list(db.carts.aggregate(pipeline))
```

## Best Practices

1. **Design for Query Patterns**: Model data based on how it will be queried, not just how it relates (embed vs reference)
2. **Use Appropriate Indexes**: Create indexes based on actual query patterns; use explain() to analyze performance
3. **Implement Proper Error Handling**: Use try-except blocks and handle DuplicateKeyError for unique constraint violations
4. **Use Projections Wisely**: Limit returned fields with projections to reduce network overhead and memory usage
5. **Batch Operations for Bulk Data**: Use bulk_write() for multiple operations to reduce round trips
6. **Implement Connection Pooling**: MongoClient maintains connection pools; create one instance per application
7. **Use Transactions Judiciously**: Multi-document transactions have overhead; use them only when needed
8. **Monitor with MongoDB Atlas or Ops Manager**: Track performance metrics, slow queries, and index usage
9. **Implement Proper Authentication**: Use SCRAM authentication, enable TLS/SSL, and follow principle of least privilege
10. **Plan for Scaling**: Design sharding keys early; consider document size limits (16MB) and working set size
