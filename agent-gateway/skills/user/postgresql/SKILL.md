---
name: postgresql
description: PostgreSQL advanced open-source relational database
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---
## What I do
- Design schemas with constraints and indexes
- Write complex queries with CTEs
- Use JSON/JSONB for flexible schemas
- Implement full-text search
- Optimize performance with EXPLAIN
- Manage partitions and inheritance
- Use array and range types

## When to use me
When building production applications requiring ACID compliance and advanced features.

## Basic Operations
```sql
-- Create table with constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Insert
INSERT INTO users (username, email) VALUES ('john', 'john@example.com')
RETURNING id, username;

-- Update with returning
UPDATE users SET status = 'inactive' WHERE id = 1 RETURNING *;

-- Delete
DELETE FROM users WHERE id = 1 RETURNING id;
```

## Queries
```sql
-- CTE (Common Table Expression)
WITH active_users AS (
    SELECT * FROM users WHERE status = 'active'
),
recent_orders AS (
    SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT u.username, COUNT(o.id) as order_count
FROM active_users u
LEFT JOIN recent_orders o ON u.id = o.user_id
GROUP BY u.username;

-- Window functions
SELECT 
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) as dept_avg,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;

-- Lateral join
SELECT u.*, o.*
FROM users u
CROSS JOIN LATERAL (
    SELECT * FROM orders o 
    WHERE o.user_id = u.id 
    ORDER BY o.created_at DESC 
    LIMIT 3
) o;
```

## JSON/JSONB
```sql
-- JSONB column
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB
);

-- Index on JSONB
CREATE INDEX idx_events_data ON events USING GIN (data);

-- Query JSONB
SELECT * FROM events WHERE data->>'type' = 'click';
SELECT * FROM events WHERE data @> '{"user": {"id": 1}}';

-- Transform to rows
SELECT * FROM events, jsonb_array_elements(data->'items') as item;
```

## Array Types
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    tags TEXT[]
);

INSERT INTO products (name, tags) VALUES ('Widget', ARRAY['sale', 'popular']);

SELECT * FROM products WHERE 'sale' = ANY(tags);
SELECT * FROM products WHERE tags @> ARRAY['sale'];
```

## Full-Text Search
```sql
-- Create tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Generate search vector
UPDATE articles 
SET search_vector = to_tsvector('english', title || ' ' || content);

-- Index
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- Search with ranking
SELECT title, ts_rank(search_vector, query) as rank
FROM articles, to_tsquery('english', 'postgres & tutorial')
WHERE search_vector @@ query
ORDER BY rank DESC;
```

## Partitioning
```sql
-- Range partitioning
CREATE TABLE orders (
    id BIGSERIAL,
    created_at TIMESTAMP NOT NULL,
    total DECIMAL(10,2)
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_01 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Performance
```sql
-- Analyze query
EXPLAIN ANALYZE 
SELECT * FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.created_at > '2024-01-01';

-- Partial index
CREATE INDEX idx_active_users ON users (email) WHERE status = 'active';

-- Composite index
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);

-- Covering index
CREATE INDEX idx_orders_covering ON orders (user_id, created_at) INCLUDE (total);
```
