---
name: MySQL
description: Popular open-source relational database known for ease of use, reliability, and widespread adoption in web applications
license: MIT
compatibility:
  - Python 3.8+
  - mysql-connector-python 8.0+
  - PyMySQL 1.0+
  - SQLAlchemy 1.4+
audience: Backend developers, web developers, DevOps engineers
category: databases
---

# MySQL

## What I Do

I provide guidance on MySQL, one of the most popular open-source relational databases. I help with schema design, query optimization, replication setup, InnoDB configuration, and best practices for web applications.

## When to Use Me

- Building LAMP/LEMP stack applications
- Web applications requiring reliable data storage
- Need for simple, well-documented database solution
- Implementing read replicas for scaling
- JSON document storage (MySQL 5.7+)
- Full-text search capabilities

## Core Concepts

- **InnoDB**: ACID-compliant storage engine with row-level locking
- **MyISAM**: Legacy engine with full-text indexing (read-heavy scenarios)
- **ACID Properties**: Transaction support with InnoDB
- **Replication**: Master-slave, master-master, GTID-based
- **Index Types**: B-tree, Hash, Full-text, Spatial
- **JSON Support**: JSON data type with functions (MySQL 5.7+)
- **Partitioning**: RANGE, LIST, HASH, KEY partitions
- **Stored Procedures**: Server-side logic execution
- **Triggers**: Automated actions on DML events
- **Query Cache**: Deprecated in 8.0, use application caching instead

## Code Examples

### Basic Connection and Query

```python
import mysql.connector
from mysql.connector import Error

def get_user_by_email(email: str) -> dict:
    conn = mysql.connector.connect(
        host="localhost",
        database="app_db",
        user="admin",
        password="secret"
    )
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, email, name FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
```

### Bulk Insert with Transaction

```python
import mysql.connector

def bulk_insert_users(users: list) -> int:
    conn = mysql.connector.connect(host="localhost", database="app_db", user="admin")
    try:
        cursor = conn.cursor()
        sql = "INSERT INTO users (email, name, created_at) VALUES (%s, %s, NOW())"
        cursor.executemany(sql, [(u['email'], u['name']) for u in users])
        conn.commit()
        return cursor.rowcount
    except Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
```

### Stored Procedure Call

```python
import mysql.connector

def get_user_with_orders(user_id: int) -> tuple:
    conn = mysql.connector.connect(host="localhost", database="app_db", user="admin")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('get_user_and_orders', [user_id])
        results = []
        for result in cursor.stored_results():
            results.extend(result.fetchall())
        return results
    finally:
        cursor.close()
        conn.close()
```

### JSON Column Query

```python
import mysql.connector

def find_products_by_category(category: str) -> list:
    conn = mysql.connector.connect(host="localhost", database="app_db", user="admin")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, name, attributes
            FROM products
            WHERE JSON_CONTAINS(attributes, %s)
            """,
            (json.dumps({'category': category}),)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
```

## Best Practices

1. Use InnoDB as the default storage engine
2. Create indexes based on WHERE and JOIN clauses
3. Use EXPLAIN to analyze query performance
4. Avoid SELECT *; specify needed columns explicitly
5. Use connection pooling for high concurrency
6. Set appropriate `innodb_buffer_pool_size` (70-80% of RAM)
7. Use prepared statements for repeated queries
8. Implement proper backup and recovery procedures
9. Enable slow query log for optimization opportunities
10. Use read replicas for read-heavy workloads

## Common Patterns

**Auto-Increment ID:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Soft Delete:**
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_users_active ON users (deleted_at) WHERE deleted_at IS NULL;
```

**Upsert (MySQL 8.0+):**
```sql
INSERT INTO page_views (page_id, views)
VALUES (123, 1)
ON DUPLICATE KEY UPDATE views = views + 1;
```
