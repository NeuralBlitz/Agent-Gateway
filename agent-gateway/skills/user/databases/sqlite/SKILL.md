---
name: sqlite
description: SQLite lightweight embedded database, single-file storage, and portable applications
category: databases
---
# SQLite

## What I do

I am a self-contained, serverless, zero-configuration, transactional SQL database engine. I store the entire database in a single file, making me ideal for embedded systems, mobile applications, testing environments, and small to medium web applications. Despite my simplicity, I support most of the SQL standard, including ACID transactions, views, triggers, and full-text search extensions. I am the most widely deployed database engine in the world.

## When to use me

- Mobile applications (Android, iOS)
- Desktop applications requiring local storage
- Browser extensions and plugins
- Testing and development environments
- Small to medium websites with low to medium traffic
- Embedded systems and IoT devices
- Data analysis and prototyping
- Caching and session storage
- Configuration and settings storage
- Temporary databases for ETL processes

## Core Concepts

1. **Serverless Architecture**: No separate database server process; database is a single file
2. **Zero Configuration**: No setup, installation, or administration required
3. **ACID Transactions**: Full support for atomic, consistent, isolated, durable transactions
4. **Single File Storage**: Entire database stored in one portable file
5. **SQLite3 File Format**: Stable, cross-platform, and backwards-compatible file format
6. **WAL Mode**: Write-Ahead Logging for better concurrent read/write performance
7. **Full-Text Search (FTS)**: Virtual table module for efficient full-text search
8. **Rowid and Primary Keys**: Auto-incrementing rowid or explicit primary key selection
9. **PRAGMA Statements**: Configuration and diagnostic statements for tuning
10. **Connection Limits**: Recommended connection pool size of 1-2 for file-based locking

## Code Examples

### Basic Connection and CRUD

```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def get_connection(db_path="app.db"):
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_database():
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                SKU TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_products_sku ON products(SKU);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        """)

def create_user(email, name, password_hash):
    with get_connection() as conn:
        cur = conn.execute("""
            INSERT INTO users (email, name, password_hash)
            VALUES (?, ?, ?)
        """, (email, name, password_hash))
        return cur.lastrowid

def get_user_by_id(user_id):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

def get_user_by_email(email):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None

def update_user(user_id, **updates):
    set_clauses = [f"{k} = ?" for k in updates.keys()]
    params = list(updates.values()) + [user_id]
    
    with get_connection() as conn:
        conn.execute(f"""
            UPDATE users SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, params)

def delete_user(user_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return conn.total_changes > 0
```

### Transactions and Concurrency

```python
from sqlite3 import IntegrityError

def transfer_funds(from_account, to_account, amount):
    with get_connection() as conn:
        try:
            cur = conn.execute("SELECT balance FROM accounts WHERE id = ?", (from_account,))
            balance = cur.fetchone()
            
            if not balance or balance[0] < amount:
                raise ValueError("Insufficient funds")
            
            conn.execute("""
                UPDATE accounts SET balance = balance - ? WHERE id = ?
            """, (amount, from_account))
            
            conn.execute("""
                UPDATE accounts SET balance = balance + ? WHERE id = ?
            """, (amount, to_account))
            
            conn.execute("""
                INSERT INTO transactions (from_account, to_account, amount)
                VALUES (?, ?, ?)
            """, (from_account, to_account, amount))
            
            return True
        except IntegrityError as e:
            conn.rollback()
            raise ValueError(f"Transfer failed: {e}")

def batch_create_orders(orders_data):
    with get_connection() as conn:
        try:
            order_ids = []
            for order in orders_data:
                cur = conn.execute("""
                    INSERT INTO orders (user_id, total, status)
                    VALUES (?, ?, 'pending')
                """, (order["user_id"], order["total"]))
                order_id = cur.lastrowid
                
                for item in order["items"]:
                    conn.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES (?, ?, ?, ?)
                    """, (order_id, item["product_id"], item["quantity"], item["price"]))
                
                order_ids.append(order_id)
            
            return order_ids
        except Exception as e:
            conn.rollback()
            raise e

def safe_concurrent_update(key, value, expected_version):
    with get_connection() as conn:
        cur = conn.execute("""
            UPDATE settings SET value = ?, version = version + 1
            WHERE key = ? AND version = ?
        """, (value, key, expected_version))
        
        if cur.rowcount == 0:
            raise ValueError("Concurrent modification detected")
        
        return True
```

### Advanced Queries and Data Analysis

```python
def get_sales_summary(start_date, end_date):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT 
                DATE(o.created_at) as sale_date,
                COUNT(*) as order_count,
                SUM(o.total) as total_revenue,
                AVG(o.total) as avg_order_value
            FROM orders o
            WHERE o.created_at BETWEEN ? AND ?
            GROUP BY DATE(o.created_at)
            ORDER BY sale_date
        """, (start_date, end_date)).fetchall()
        
        return [{"date": row[0], "orders": row[1], "revenue": row[2], "avg_order": row[3]} for row in rows]

def get_top_products(limit=10):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT 
                p.id, p.name, p.category,
                COUNT(oi.id) as total_sold,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.quantity * oi.price) as total_revenue
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
            GROUP BY p.id
            ORDER BY total_revenue DESC
            LIMIT ?
        """, (limit,)).fetchall()
        
        return [dict(row) for row in rows]

def get_user_statistics():
    with get_connection() as conn:
        stats = {}
        
        stats["total_users"] = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        
        stats["users_by_month"] = conn.execute("""
            SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
            FROM users
            GROUP BY month
            ORDER BY month DESC
        """).fetchall()
        
        stats["active_orders"] = conn.execute("""
            SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled', 'delivered')
        "").fetchone()[0]
        
        return stats

def get_running_totals():
    with get_connection() as conn:
        conn.execute("""
            SELECT 
                date,
                revenue,
                SUM(revenue) OVER (ORDER BY date) as running_total
            FROM daily_revenue
            ORDER BY date
        """)

def recursive_category_tree():
    with get_connection() as conn:
        conn.execute("""
            WITH RECURSIVE category_tree AS (
                SELECT id, name, parent_id, 0 as level
                FROM categories WHERE parent_id IS NULL
                UNION ALL
                SELECT c.id, c.name, c.parent_id, ct.level + 1
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT * FROM category_tree ORDER BY level, name
        """)
```

### Full-Text Search Extension

```python
def create_fts_table():
    with get_connection() as conn:
        conn.executescript("""
            CREATE VIRTUAL TABLE products_fts USING fts5(
                name, description, category,
                content='products',
                content_rowid='id'
            );
            
            CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
                INSERT INTO products_fts(rowid, name, description, category)
                VALUES (new.id, new.name, new.description, new.category);
            END;
            
            CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
                INSERT INTO products_fts(products_fts, rowid, name, description, category)
                VALUES ('delete', old.id, old.name, old.description, old.category);
            END;
            
            CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
                INSERT INTO products_fts(products_fts, rowid, name, description, category)
                VALUES ('delete', old.id, old.name, old.description, old.category);
                INSERT INTO products_fts(rowid, name, description, category)
                VALUES (new.id, new.name, new.description, new.category);
            END;
        """)

def search_products(query, limit=50):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT p.*, bm25(products_fts) as score
            FROM products_fts
            JOIN products p ON products_fts.rowid = p.id
            WHERE products_fts MATCH ?
            ORDER BY score
            LIMIT ?
        """, (query, limit)).fetchall()
        
        return [dict(row) for row in rows]

def search_with_highlight(query):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT p.id, p.name, p.description,
                   snippet(products_fts, 0, '<b>', '</b>', '...', 10) as name_snippet,
                   snippet(products_fts, 1, '<b>', '</b>', '...', 10) as desc_snippet
            FROM products_fts
            JOIN products p ON products_fts.rowid = p.id
            WHERE products_fts MATCH ?
            LIMIT 20
        """, (query,)).fetchall()
        
        return [dict(row) for row in rows]
```

### Backup and Maintenance

```python
import shutil
import os

def backup_database(source_path, backup_path):
    shutil.copy2(source_path, backup_path)
    return backup_path

def vacuum_database(db_path="app.db"):
    with get_connection(db_path) as conn:
        conn.execute("VACUUM")

def integrity_check(db_path="app.db"):
    with get_connection(db_path) as conn:
        rows = conn.execute("PRAGMA integrity_check").fetchall()
        return all(row[0] == "ok" for row in rows)

def get_table_info(table_name):
    with get_connection() as conn:
        rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        return [{"name": row[1], "type": row[2], "notnull": row[3], 
                 "pk": row[5]} for row in rows]

def get_database_size(db_path="app.db"):
    return os.path.getsize(db_path) if os.path.exists(db_path) else 0

def enable_wal_mode(db_path="app.db"):
    with get_connection(db_path) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=-64000")
        conn.execute("PRAGMA temp_store=MEMORY")

def show_tables():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        """).fetchall()
        return [row[0] for row in rows]
```

## Best Practices

1. **Use WAL Mode for Better Concurrency**: Enable WAL mode for concurrent read/write performance
2. **Use Parameterized Queries**: Always use parameterized queries to prevent SQL injection
3. **Implement Connection Pooling**: For web applications, use connection pooling libraries
4. **Enable Foreign Keys**: Execute PRAGMA foreign_keys=ON to enforce referential integrity
5. **Use Transactions for Bulk Operations**: Wrap multiple operations in transactions for performance
6. **Add Indexes for Query Optimization**: Create indexes on frequently queried columns
7. **Regular Maintenance**: Run VACUUM periodically to reclaim space and optimize database
8. **Use Appropriate Data Types**: SQLite is flexible but choose appropriate types for compatibility
9. **Handle Timeouts for Concurrent Access**: Set appropriate timeout for busy databases
10. **Backup Regularly**: Use online backup API or file copy for reliable backups
