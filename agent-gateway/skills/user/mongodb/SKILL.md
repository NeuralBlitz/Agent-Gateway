---
name: mongodb
description: MongoDB document database with flexible schema and horizontal scaling
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---
## What I do
- Design document schemas
- Write aggregation pipelines
- Use indexes for performance
- Implement data modeling patterns
- Work with change streams
- Use transactions across collections
- Optimize queries

## When to use me
When building applications with flexible schemas or high write throughput.

## CRUD Operations
```javascript
// Insert
db.users.insertOne({
  name: "John",
  email: "john@example.com",
  tags: ["developer", "admin"],
  profile: { age: 30, city: "NYC" }
});

db.users.insertMany([
  { name: "Alice" },
  { name: "Bob" }
]);

// Query
db.users.find({ name: "John" });
db.users.findOne({ _id: ObjectId("...") });

// Update
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { name: "Jane" } }
);

db.users.updateMany(
  { status: "active" },
  { $set: { verified: true } }
);

// Delete
db.users.deleteOne({ _id: ObjectId("...") });
db.users.deleteMany({ status: "inactive" });
```

## Query Operators
```javascript
// Comparison
db.products.find({ price: { $gt: 100, $lt: 500 } });
db.users.find({ age: { $gte: 18, $lte: 30 } });

// Logical
db.users.find({
  $or: [{ status: "active" }, { role: "admin" }]
});

db.users.find({
  $and: [
    { status: "active" },
    { role: { $ne: "guest" } }
  ]
});

// Element
db.users.find({ email: { $exists: true, $type: "string" } });

// Array
db.users.find({ tags: "developer" });
db.users.find({ tags: { $all: ["admin", "developer"] } });
db.users.find({ "profile.city": "NYC" });

// Regex
db.users.find({ name: { $regex: "^J", $options: "i" } });
```

## Aggregation Pipeline
```javascript
db.orders.aggregate([
  // Match
  { $match: { status: "completed" } },
  
  // Unwind array
  { $unwind: "$items" },
  
  // Group
  { $group: {
    _id: "$customer_id",
    total: { $sum: "$items.price" },
    count: { $sum: 1 }
  }},
  
  // Sort
  { $sort: { total: -1 } },
  
  // Limit
  { $limit: 10 },
  
  // Project (select fields)
  { $project: {
    _id: 0,
    customer: "$_id",
    total: 1,
    count: 1
  }}
]);
```

## More Aggregation
```javascript
// Lookup (join)
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" }
]);

// Add computed fields
{
  $addFields: {
    total: { $sum: "$items.price" },
    discount: {
      $cond: { if: { $gte: ["$total", 100] }, then: 0.1, else: 0 }
    }
  }
}

// Facet (multiple aggregations)
{
  $facet: {
    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
    totalValue: [{ $group: { _id: null, total: { $sum: "$total" } } }]
  }
}
```

## Indexes
```javascript
// Single field
db.users.createIndex({ email: 1 });

// Compound
db.orders.createIndex({ user_id: 1, created_at: -1 });

// Unique
db.users.createIndex({ email: 1 }, { unique: true });

// Text
db.articles.createIndex({ title: "text", content: "text" });
db.articles.find({ $text: { $search: "mongodb" } });

// Partial
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { verified: true } }
);

// Explain
db.users.find({ name: "John" }).explain("executionStats");
```

## Data Modeling
```javascript
// Embedded (one-to-one)
{
  _id: ObjectId("..."),
  name: "John",
  address: {
    street: "123 Main St",
    city: "NYC"
  }
}

// Embedded (one-to-many)
{
  _id: ObjectId("..."),
  name: "John",
  orders: [
    { id: 1, total: 100 },
    { id: 2, total: 200 }
  ]
}

// Reference (many-to-many)
{
  _id: ObjectId("..."),
  name: "Math 101",
  student_ids: [ObjectId("..."), ObjectId("...")]
}
```
