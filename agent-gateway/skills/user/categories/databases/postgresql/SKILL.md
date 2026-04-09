---
name: PostgreSQL
description: Advanced open-source relational database system with strong ACID compliance, complex queries, and enterprise features
license: MIT
compatibility:
  - Python 3.8+
  - psycopg2 2.9+
  - asyncpg 0.25+
  - SQLAlchemy 1.4+
audience: Backend developers, data engineers, DevOps engineers
category: databases
---

# PostgreSQL

## What I Do

I provide expert guidance on PostgreSQL, the world's most advanced open-source relational database. I help you design schemas, write optimized queries, configure extensions, implement transactions, and leverage advanced features like JSONB, full-text search, and window functions.

## When to Use Me

- Building data-intensive applications requiring ACID compliance
- Implementing complex analytical queries and reporting
- Working with structured/semi-structured data (JSONB)
- Need for advanced indexing strategies (GIN, GiST, BRIN)
- Full-text search and geospatial queries (PostGIS)
- High-concurrency transaction processing

## Core Concepts

- **ACID Transactions**: Atomic, Consistent, Isolated, Durable guarantees
- **MVCC**: Multi-Version Concurrency Control for high concurrency
- **JSONB**: Binary JSON for semi-structured data with indexing
- **Index Types**: B-tree, Hash, GIN, GiST, SP-GiST, BRIN
- **Window Functions**: ROW_NUMBER(), RANK(), LAG(), LEAD()
- **CTEs**: Common Table Expressions for complex queries
- **PostGIS**: Geospatial data extensions
- **Full-Text Search**: tsvector, tsquery, ranking
- **Replication**: Streaming replication, logical replication
- **Partitioning**: Table partitioning for large datasets

## Code Examples

### Basic Connection and Query

```python
import psycopg2
from psycopg2.extras import RealDictCursor

def get_user_by_id(user_id: int) -> dict:
    conn = psycopg2.connect(
        host="localhost",
        database="app_db",
        user="admin",
        password="secret",
        port=5432
    )
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, email, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            return cur.fetchone()
    finally:
        conn.close()
```

### Using JSONB for Semi-Structured Data

```python
import psycopg2

def add_user_preference(user_id: int, preferences: dict) -> None:
    conn = psycopg2.connect("dbname=app_db user=admin password=secret")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (id, preferences)
                VALUES (%s, %s)
                ON CONFLICT (id) DO UPDATE
                SET preferences = users.preferences || EXCLUDED.preferences
                """,
                (user_id, json.dumps(preferences))
            )
            conn.commit()
    finally:
        conn.close()

def find_users_by_preference(key: str, value: str) -> list:
    conn = psycopg2.connect("dbname=app_db user=admin")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, preferences
                FROM users
                WHERE preferences @> %s::jsonb
                """,
                (json.dumps({key: value}),)
            )
            return cur.fetchall()
    finally:
        conn.close()
```

### Transaction with Savepoint

```python
import psycopg2
from psycopg2 import sql

def transfer_funds(from_id: int, to_id: int, amount: float) -> bool:
    conn = psycopg2.connect("dbname=bank user=admin")
    try:
        with conn.cursor() as cur:
            conn.autocommit = False
            cur.execute("SELECT balance FROM accounts WHERE id = %s FOR UPDATE", (from_id,))
            from_balance = cur.fetchone()[0]
            if from_balance < amount:
                return False
            
            cur.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s", (amount, from_id))
            cur.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (amount, to_id))
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.autocommit = True
        conn.close()
```

### Full-Text Search

```python
import psycopg2

def search_documents(query: str, limit: int = 10) -> list:
    conn = psycopg2.connect("dbname=docs user=admin")
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, content,
                       ts_rank(setweight(to_tsvector(title), 'A') ||
                              setweight(to_tsvector(content), 'B'),
                              websearch_to_tsquery(%s)) as rank
                FROM documents
                WHERE to_tsvector(title || ' ' || content) @@ websearch_to_tsquery(%s)
                ORDER BY rank DESC
                LIMIT %s
                """,
                (query, query, limit)
            )
            return cur.fetchall()
    finally:
        conn.close()
```

## Best Practices

1. Use connection pooling (pgbouncer) for high concurrency
2. Always use parameterized queries to prevent SQL injection
3. Create appropriate indexes based on query patterns
4. Use EXPLAIN ANALYZE to understand query plans
5. Partition large tables by date or key ranges
6. Use COPY for bulk data imports instead of INSERT
7. Set appropriate `work_mem` for complex queries
8. Use prepared statements for frequently executed queries
9. Implement proper vacuum and autovacuum configuration
10. Use replication for high availability and read scaling

## Common Patterns

**Soft Delete with Deleted At:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX idx_users_deleted ON users (deleted_at) WHERE deleted_at IS NULL;
```

**Upsert Pattern:**
```sql
INSERT INTO stats (user_id, views, clicks)
VALUES (123, 1, 0)
ON CONFLICT (user_id) DO UPDATE
SET views = stats.views + EXCLUDED.views,
    clicks = stats.clicks + EXCLUDED.clicks;
```

**Recursive CTE for Hierarchies:**
```sql
WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id, 0 as level
    FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, ot.level + 1
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.id
) SELECT * FROM org_tree;
```
