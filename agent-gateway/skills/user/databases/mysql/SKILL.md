---
name: mysql
description: MySQL database management, replication, and performance optimization
category: databases
---
# MySQL

## What I do

I am the world's most popular open-source database, known for my reliability, ease of use, and strong community support. I provide a robust RDBMS with full ACID compliance (with InnoDB), efficient replication capabilities, and excellent performance for web applications. I support stored procedures, triggers, views, and a wide range of storage engines including InnoDB (transactional), MyISAM (non-transactional), and Memory. I am the backbone of countless web applications, content management systems, and e-commerce platforms.

## When to use me

- Building web applications with PHP, Python, or Node.js backends
- Content management systems (WordPress, Drupal, Joomla)
- E-commerce platforms requiring reliable transaction processing
- Applications needing easy setup and maintenance
- Projects requiring strong community support and documentation
- Systems needing flexible replication (master-slave, master-master)
- Applications combining relational data with full-text search
- Microservices requiring lightweight, fast database operations

## Core Concepts

1. **Storage Engines**: InnoDB (ACID-compliant, row-level locking), MyISAM (full-text search, table-level locking), Memory (in-memory tables)
2. **ACID Transactions**: InnoDB provides atomic, consistent, isolated, durable transactions with MVCC
3. **Replication**: Master-slave asynchronous/semi-synchronous replication, master-master configuration, Group Replication
4. **Index Types**: B-tree (default), Hash (Memory engine), Full-text (MyISAM, InnoDB), Spatial (R-tree)
5. **Query Cache**: Deprecated in 8.0; use application-level caching instead
6. **Character Set and Collation**: UTF-8 support (utf8mb4 for full Unicode including emojis)
7. **Partitioning**: RANGE, LIST, HASH, KEY partitioning for large tables
8. **JSON Support**: Native JSON data type with functions for querying and manipulation (MySQL 5.7+)
9. **Window Functions**: ROW_NUMBER, RANK, LAG, LEAD (MySQL 8.0+)
10. **Connection Management**: Thread pooling, connection limits, and max_connections configuration

## Code Examples

### Basic Connection and CRUD Operations

```python
import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager

@contextmanager
def get_connection():
    conn = mysql.connector.connect(
        host="localhost",
        database="app_db",
        user="app_user",
        password="secure_password",
        port=3306
    )
    try:
        yield conn
    finally:
        if conn.is_connected():
            conn.close()

def create_user(email, name, password_hash):
    query = """
        INSERT INTO users (email, name, password_hash, created_at)
        VALUES (%s, %s, %s, NOW())
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, (email, name, password_hash))
        conn.commit()
        return cursor.lastrowid

def get_user_with_orders(user_id):
    query = """
        SELECT u.id, u.email, u.name, u.created_at,
               o.id as order_id, o.total, o.status, o.created_at as order_date
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.id = %s
        ORDER BY o.created_at DESC
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        
        user = None
        orders = []
        for row in rows:
            if user is None:
                user = {"id": row["id"], "email": row["email"], 
                       "name": row["name"], "created_at": row["created_at"]}
            if row["order_id"]:
                orders.append({"id": row["order_id"], "total": row["total"],
                              "status": row["status"], "created_at": row["order_date"]})
        
        user["orders"] = orders
        return user

def update_user_email(user_id, new_email):
    query = "UPDATE users SET email = %s, updated_at = NOW() WHERE id = %s"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, (new_email, user_id))
        conn.commit()
        return cursor.rowcount > 0

def delete_inactive_users(days_inactive=365):
    query = "DELETE FROM users WHERE last_login < DATE_SUB(NOW(), INTERVAL %s DAY) AND last_login IS NOT NULL"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, (days_inactive,))
        conn.commit()
        return cursor.rowcount
```

### Transaction Management with Savepoints

```python
from mysql.connector import Error

def transfer_funds(from_account, to_account, amount):
    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            conn.start_transaction()
            
            cursor.execute("SELECT balance FROM accounts WHERE id = %s FOR UPDATE", (from_account,))
            result = cursor.fetchone()
            if not result or result[0] < amount:
                conn.rollback()
                raise ValueError("Insufficient funds")
            
            cursor.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s", (amount, from_account))
            cursor.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (amount, to_account))
            
            cursor.execute("INSERT INTO transactions (from_account, to_account, amount, created_at) VALUES (%s, %s, %s, NOW())",
                          (from_account, to_account, amount))
            
            conn.commit()
            return True
            
        except Error as e:
            conn.rollback()
            raise e

def batch_create_orders(orders_data):
    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            conn.start_transaction()
            
            order_ids = []
            for order in orders_data:
                cursor.execute("""
                    INSERT INTO orders (user_id, total, status, shipping_address, created_at)
                    VALUES (%s, %s, 'pending', %s, NOW())
                """, (order["user_id"], order["total"], order["shipping_address"]))
                order_id = cursor.lastrowid
                
                for item in order["items"]:
                    cursor.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES (%s, %s, %s, %s)
                    """, (order_id, item["product_id"], item["quantity"], item["price"]))
                
                order_ids.append(order_id)
            
            conn.commit()
            return order_ids
            
        except Error as e:
            conn.rollback()
            raise e
```

### Advanced Queries with Window Functions and JSON

```python
import json

def get_sales_analytics(start_date, end_date):
    query = """
        SELECT 
            DATE(created_at) as sale_date,
            COUNT(*) as total_orders,
            SUM(total) as daily_revenue,
            AVG(total) as avg_order_value,
            RANK() OVER (ORDER BY SUM(total) DESC) as revenue_rank
        FROM orders
        WHERE created_at BETWEEN %s AND %s
        GROUP BY DATE(created_at)
        ORDER BY sale_date
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, (start_date, end_date))
        return cursor.fetchall()

def search_products_with_json_filters(filters):
    conditions = []
    params = []
    
    if "category" in filters:
        conditions.append("JSON_EXTRACT(attributes, '$.category') = %s")
        params.append(filters["category"])
    
    if "min_price" in filters:
        conditions.append("JSON_EXTRACT(attributes, '$.price') >= %s")
        params.append(filters["min_price"])
    
    if "in_stock" in filters and filters["in_stock"]:
        conditions.append("JSON_EXTRACT(attributes, '$.in_stock') = true")
    
    query = f"""
        SELECT id, name, SKU, 
               JSON_EXTRACT(attributes, '$.price') as price,
               JSON_EXTRACT(attributes, '$.category') as category
        FROM products
        {'WHERE ' + ' AND '.join(conditions) if conditions else ''}
        ORDER BY CAST(JSON_EXTRACT(attributes, '$.popularity') AS UNSIGNED) DESC
        LIMIT 50
    """
    
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        return cursor.fetchall()

def get_user_rankings():
    query = """
        SELECT 
            u.id,
            u.username,
            COUNT(o.id) as total_orders,
            SUM(o.total) as total_spent,
            ROW_NUMBER() OVER (ORDER BY SUM(o.total) DESC) as rank,
            PERCENT_RANK() OVER (ORDER BY SUM(o.total) DESC) as percentile
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE o.status != 'cancelled'
        GROUP BY u.id
        HAVING COUNT(o.id) > 0
        ORDER BY rank
        LIMIT 100
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        return cursor.fetchall()
```

### Prepared Statements and Bulk Operations

```python
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="app_pool",
    pool_size=10,
    host="localhost",
    database="app_db",
    user="app_user",
    password="secure_password"
)

def get_user_by_email(email):
    conn = connection_pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def bulk_insert_products(products):
    conn = connection_pool.get_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO products (name, SKU, price, category, stock, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """
        cursor.executemany(query, products)
        conn.commit()
        return cursor.rowcount
    finally:
        cursor.close()
        conn.close()

def update_prices_by_category(category, price_multiplier):
    conn = connection_pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE products 
            SET price = ROUND(price * %s, 2),
                updated_at = NOW()
            WHERE category = %s
        """, (price_multiplier, category))
        conn.commit()
        return cursor.rowcount
    finally:
        cursor.close()
        conn.close()

def get_paginated_users(page=1, per_page=50):
    offset = (page - 1) * per_page
    conn = connection_pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) FROM users")
        total = cursor.fetchone()["COUNT(*)"]
        
        cursor.execute("""
            SELECT id, email, name, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        
        return {
            "users": cursor.fetchall(),
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    finally:
        cursor.close()
        conn.close()
```

### Full-Text Search and Stored Procedures

```python
def search_products(query, limit=20):
    search_query = """
        SELECT id, name, description, 
               MATCH(name, description) AGAINST(%s IN NATURAL LANGUAGE MODE) as relevance
        FROM products
        WHERE MATCH(name, description) AGAINST(%s IN NATURAL LANGUAGE MODE)
        ORDER BY relevance DESC
        LIMIT %s
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(search_query, (query, query, limit))
        return cursor.fetchall()

def search_with_boolean_mode(search_terms):
    boolean_query = """
        SELECT id, name, description,
               MATCH(name, description) AGAINST(%s IN BOOLEAN MODE) as relevance
        FROM products
        WHERE MATCH(name, description) AGAINST(%s IN BOOLEAN MODE)
        ORDER BY relevance DESC
        LIMIT 50
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        formatted_terms = " ".join(f"+{term}*" for term in search_terms.split())
        cursor.execute(boolean_query, (formatted_terms, formatted_terms))
        return cursor.fetchall()

def call_stored_procedure_get_order_summary(order_id):
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc("get_order_summary", [order_id])
        for result in cursor.stored_results():
            return result.fetchall()

def call_stored_procedure_with_out_params(user_id):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.callproc("get_user_stats", [user_id, 0, 0])
        cursor.execute("SELECT @total_orders, @total_spent")
        result = cursor.fetchone()
        return {"total_orders": result[0], "total_spent": result[1]}
```

## Best Practices

1. **Use InnoDB Storage Engine**: Always use InnoDB for ACID compliance, row-level locking, and crash recovery
2. **Optimize Queries with EXPLAIN**: Analyze query execution plans to identify missing indexes and inefficient operations
3. **Implement Connection Pooling**: Use connection pools (mysql-connector-python pooling or external tools) to reduce connection overhead
4. **Use utf8mb4 Character Set**: Support full Unicode including emojis; set charset=utf8mb4 in connection
5. **Index Wisely**: Create indexes on columns used in WHERE, JOIN, ORDER BY clauses; avoid over-indexing
6. **Configure Appropriate Buffer Pool**: Set innodb_buffer_pool_size to 70-80% of available RAM for production
7. **Implement Read/Write Splitting**: Use read replicas for read-heavy workloads to reduce primary database load
8. **Use Prepared Statements**: Prevent SQL injection and improve performance for frequently executed queries
9. **Implement Proper Backup Strategy**: Use mysqldump for logical backups or MySQL Enterprise Backup for physical backups
10. **Monitor Performance**: Use Performance Schema, slow query log, and tools like pt-query-digest for optimization
