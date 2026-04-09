---
name: database
description: Database design and management fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: database
---
## What I do
- Design database schemas
- Normalize data structures
- Create indexes for performance
- Write efficient queries
- Handle transactions
- Implement data integrity
- Optimize queries
- Manage database connections

## When to use me
When designing databases or writing queries.

## Schema Design
```sql
-- Normalized schema
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status) WHERE status = 'pending';
```

## Query Optimization
```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 20;

-- Avoid SELECT *
-- Use covering indexes
-- Pagination with LIMIT/OFFSET
-- Batch operations
```
