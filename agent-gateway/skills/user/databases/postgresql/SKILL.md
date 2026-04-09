---
name: postgresql
description: Advanced PostgreSQL database management, query optimization, and performance tuning
category: databases
---
# PostgreSQL

## What I do

I am a powerful, open-source relational database management system (RDBMS) known for its robustness, extensibility, and standards compliance. I support advanced features including ACID transactions, complex queries, foreign keys, triggers, updatable views, and stored procedures. I excel at handling complex data relationships, supporting JSON/JSONB for document-style data, full-text search, and advanced indexing strategies. I am widely used for mission-critical applications requiring data integrity and complex querying capabilities.

## When to use me

- Building enterprise applications requiring ACID compliance and complex transactions
- Applications needing advanced SQL features (window functions, CTEs, recursive queries)
- Systems requiring robust data integrity and referential integrity constraints
- Applications combining relational and document-based data (JSON/JSONB)
- Projects needing strong extensibility with custom types, functions, and extensions
- Data warehousing and analytical workloads with complex aggregations
- Geographic information systems (GIS) with PostGIS extension
- Full-text search applications without external search engines

## Core Concepts

1. **ACID Transactions**: Atomic, Consistent, Isolated, Durable transactions ensure data integrity even during system failures
2. **MVCC (Multi-Version Concurrency Control)**: Allows concurrent reads and writes without locking by maintaining multiple versions of data
3. **Index Types**: B-tree (default), Hash, GiST (geometric), SP-GiST, GIN (generalized inverted index), and BRIN (block range)
4. **JSON/JSONB**: Native support for semi-structured data with full query capabilities on JSON documents
5. **PostgreSQL Extensions**: Modular functionality including PostGIS, pg_cron, pg_partman, and custom extensions
6. **Query Optimization**: Cost-based optimizer using statistics to choose optimal execution plans
7. **Connection Pooling**: pgBouncer or built-in connection pooling for managing database connections
8. **Replication**: Streaming replication, logical replication, and bidirectional replication for high availability
9. **Partitioning**: Table partitioning for managing large datasets and improving query performance
10. **Window Functions**: Advanced analytical queries with ROW_NUMBER, RANK, LAG, LEAD functions

## Code Examples

### Basic Connection and Query Execution

```python
import psycopg2
from psycopg2 import sql
from contextlib import contextmanager

@contextmanager
def get_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="app_db",
        user="app_user",
        password="secure_password",
        port=5432
    )
    try:
        yield conn
    finally:
        conn.close()

def fetch_users_with_orders(limit=100):
    query = """
        SELECT u.id, u.email, u.created_at, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at >= %s
        GROUP BY u.id, u.email, u.created_at
        ORDER BY order_count DESC
        LIMIT %s
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(query, ("2024-01-01", limit))
            return cur.fetchall()

def insert_product_with_categories(product_data, category_ids):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO products (name, description, price, sku)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (product_data["name"], product_data["description"],
                  product_data["price"], product_data["sku"]))
            product_id = cur.fetchone()[0]
            
            cur.executemany("""
                INSERT INTO product_categories (product_id, category_id)
                VALUES (%s, %s)
            """, [(product_id, cat_id) for cat_id in category_ids])
            
            conn.commit()
            return product_id
```

### Advanced Query with JSONB and Window Functions

```python
import json
from psycopg2.extras import Json

def get_user_analytics():
    query = """
        WITH user_purchases AS (
            SELECT 
                user_id,
                created_at::date as purchase_date,
                SUM(total_amount) as daily_total,
                COUNT(*) as purchase_count
            FROM orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY user_id, created_at::date
        )
        SELECT 
            user_id,
            purchase_date,
            daily_total,
            purchase_count,
            SUM(daily_total) OVER (PARTITION BY user_id ORDER BY purchase_date 
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as rolling_7day_total,
            ROW_NUMBER() OVER (PARTITION BY purchase_date ORDER BY daily_total DESC) as daily_rank
        FROM user_purchases
        ORDER BY user_id, purchase_date
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()

def search_products_by_attributes(filters):
    where_clauses = []
    params = []
    
    if "category" in filters:
        where_clauses.append("attributes->>'category' = %s")
        params.append(filters["category"])
    
    if "min_price" in filters:
        where_clauses.append("(attributes->>'price')::decimal >= %s")
        params.append(filters["min_price"])
    
    if "tags" in filters:
        where_clauses.append("attributes->'tags' @> %s::jsonb")
        params.append(json.dumps(filters["tags"]))
    
    query = f"""
        SELECT id, name, attributes
        FROM products
        {'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''}
        ORDER BY (attributes->>'popularity')::int DESC
        LIMIT 50
    """
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()
```

### Transaction Management with Savepoints

```python
from psycopg2 import DatabaseError

def process_order_with_inventory(order_data, items):
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("BEGIN")
                
                cur.execute("""
                    INSERT INTO orders (user_id, total, status)
                    VALUES (%s, %s, 'pending')
                    RETURNING id
                """, (order_data["user_id"], order_data["total"]))
                order_id = cur.fetchone()[0]
                
                cur.execute("SAVEPOINT before_items")
                
                for item in items:
                    cur.execute("""
                        UPDATE inventory 
                        SET quantity = quantity - %s 
                        WHERE product_id = %s AND quantity >= %s
                    """, (item["quantity"], item["product_id"], item["quantity"]))
                    
                    if cur.rowcount == 0:
                        cur.execute("ROLLBACK TO SAVEPOINT before_items")
                        raise ValueError(f"Insufficient inventory for product {item['product_id']}")
                    
                    cur.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES (%s, %s, %s, %s)
                    """, (order_id, item["product_id"], item["quantity"], item["price"]))
                
                cur.execute("COMMIT")
                return order_id
                
            except (DatabaseError, ValueError) as e:
                cur.execute("ROLLBACK")
                raise e
```

### Using COPY for Bulk Operations

```python
import io
from psycopg2.extras import execute_values

def bulk_insert_products(products):
    with get_connection() as conn:
        with conn.cursor() as cur:
            execute_values(cur, """
                INSERT INTO products (name, sku, price, category, attributes, created_at)
                VALUES %s
                ON CONFLICT (sku) DO UPDATE SET
                    name = EXCLUDED.name,
                    price = EXCLUDED.price,
                    attributes = EXCLUDED.attributes,
                    updated_at = CURRENT_TIMESTAMP
            """, products)
            conn.commit()

def export_orders_to_csv(start_date, end_date):
    query = """
        COPY (
            SELECT o.id, o.created_at, u.email, p.name, oi.quantity, oi.price
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.created_at BETWEEN %s AND %s
            ORDER BY o.created_at
        ) TO STDOUT WITH CSV HEADER
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            buffer = io.StringIO()
            cur.copy_expert(query, buffer, size=8192)
            return buffer.getvalue()

def import_products_from_csv(csv_file):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TEMP TABLE temp_products (
                    name TEXT, sku TEXT, price DECIMAL, category TEXT
                ) ON COMMIT DROP
            """)
            buffer = io.StringIO(csv_file)
            cur.copy_from(buffer, "temp_products", columns=("name", "sku", "price", "category"), sep=",")
            
            cur.execute("""
                INSERT INTO products (name, sku, price, category)
                SELECT name, sku, price, category FROM temp_products
                ON CONFLICT (sku) DO NOTHING
            """)
            conn.commit()
```

### Using Asynchronous Connections

```python
import asyncio
import asyncpg

async def fetch_user_stats(user_id):
    conn = await asyncpg.connect(
        host="localhost",
        database="app_db",
        user="app_user",
        password="secure_password"
    )
    try:
        async with conn.transaction():
            user = await conn.fetchrow("""
                SELECT id, email, created_at FROM users WHERE id = $1
            """, user_id)
            
            orders = await conn.fetch("""
                SELECT COUNT(*) as total_orders, SUM(total) as total_spent
                FROM orders WHERE user_id = $1
            """, user_id)
            
            return {"user": dict(user), "orders": dict(orders[0])}
    finally:
        await conn.close()

async def bulk_insert_events(events):
    conn = await asyncpg.connect(
        host="localhost",
        database="app_db",
        user="app_user",
        password="secure_password"
    )
    try:
        await conn.executemany("""
            INSERT INTO events (user_id, event_type, metadata, created_at)
            VALUES ($1, $2, $3, $4)
        """, events)
    finally:
        await conn.close()

async def get_dashboard_metrics():
    conn = await asyncpg.connect(
        host="localhost",
        database="app_db",
        user="app_user",
        password="secure_password"
    )
    try:
        queries = [
            ("SELECT COUNT(*) FROM users", "total_users"),
            ("SELECT COUNT(*) FROM orders WHERE created_at > CURRENT_DATE", "today_orders"),
            ("SELECT SUM(total) FROM orders WHERE created_at > CURRENT_DATE", "today_revenue"),
            ("SELECT COUNT(*) FROM products WHERE stock < 10", "low_stock_products")
        ]
        
        results = await asyncio.gather(
            *[conn.fetchval(query) for query, _ in queries]
        )
        
        return dict(zip([name for _, name in queries], results))
    finally:
        await conn.close()
```

## Best Practices

1. **Use Connection Pooling**: Implement connection pooling with pgBouncer to handle connection overhead and prevent connection exhaustion under load
2. **Optimize Indexes**: Create appropriate indexes based on query patterns; use EXPLAIN ANALYZE to identify missing indexes
3. **Partition Large Tables**: Use table partitioning for tables exceeding 10GB or with clear partition keys (time-based, range-based)
4. **Implement Proper Backups**: Use pg_basebackup for physical backups and pg_dump for logical backups; test restoration regularly
5. **Configure Appropriate Checkpoint Intervals**: Tune checkpoint_completion_target and checkpoint_segments for write-heavy workloads
6. **Use Prepared Statements**: For frequently executed queries, use prepared statements to reduce planning overhead
7. **Monitor Query Performance**: Track slow queries using pg_stat_statements and set appropriate log_min_duration_statement
8. **Implement Proper Vacuuming**: Configure autovacuum appropriately and run manual VACUUM ANALYZE when needed
9. **Use Proper Data Types**: Choose appropriate data types (INT vs BIGINT, VARCHAR limits, JSONB vs TEXT) for storage efficiency
10. **Secure Your Instance**: Use SSL/TLS for connections, implement proper authentication (md5, scram-sha-256), and restrict network access
