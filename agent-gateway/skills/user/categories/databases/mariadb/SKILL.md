---
name: mariadb
description: MariaDB database management, MySQL-compatible open-source RDBMS with advanced features
category: databases
---
# MariaDB

## What I do

I am a community-developed, commercially supported fork of MySQL, designed to remain open source under the GPL. I offer enhanced performance, additional storage engines (Aria, ColumnStore, Spider), and advanced features not available in MySQL. I provide full MySQL compatibility while adding innovations in areas like horizontal scaling, temporal data handling, and query optimization. I am trusted by organizations seeking a robust, open-source relational database.

## When to use me

- Drop-in MySQL replacement with additional features
- Web applications requiring reliable transaction processing
- Data warehousing with ColumnStore engine
- Distributed databases with Spider storage engine
- Temporal data and historical analysis
- High-performance OLTP workloads
- Systems requiring MariaDB Galera Cluster for multi-master replication
- Applications needing window functions and CTEs (available in MariaDB 10.2+)
- JSON functions and dynamic columns

## Core Concepts

1. **Storage Engines**: InnoDB (ACID), Aria (crash-safe MyISAM), ColumnStore (analytical), Spider (sharding)
2. **Galera Cluster**: Synchronous multi-master replication for high availability
3. **Temporal Data Tables**: System versioning and temporal queries with FOR SYSTEM_TIME
4. **Window Functions**: ROW_NUMBER, RANK, LEAD, LAG, and aggregate window functions
5. **Common Table Expressions (CTEs)**: WITH clause for complex queries and recursion
6. **Dynamic Columns**: Store different columns for different rows in the same table
7. **JSON Functions**: JSON_QUERY, JSON_VALUE, JSON_EXTRACT for JSON manipulation
8. **Sequence Storage Engine**: Auto-increment alternatives with configurable sequences
9. **Connection Pooling**: Thread pool for handling many concurrent connections
10. **Query Cache (Deprecated)**: Removed in MariaDB 10.1+; use application caching instead

## Code Examples

### Basic Operations with Connectors

```python
import mysql.connector
from mysql.connector import pooling
from datetime import datetime

pool = pooling.MySQLConnectionPool(
    pool_name="maria_pool",
    pool_size=10,
    host="localhost",
    database="app_db",
    user="app_user",
    password="secure_password",
    port=3306
)

def create_user(user_data):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (email, name, password_hash, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_data["email"], user_data["name"], 
              user_data["password_hash"], datetime.utcnow()))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def get_user_with_orders(user_id):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.*, 
                   o.id as order_id, o.total, o.status, o.created_at as order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.id = %s
            ORDER BY o.created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        
        if not rows:
            return None
        
        user = {"id": rows[0]["id"], "email": rows[0]["email"], 
               "name": rows[0]["name"], "created_at": rows[0]["created_at"],
               "orders": []}
        
        for row in rows:
            if row["order_id"]:
                user["orders"].append({
                    "id": row["order_id"], "total": row["total"],
                    "status": row["status"], "date": row["order_date"]
                })
        
        return user
    finally:
        cursor.close()
        conn.close()

def update_user_profile(user_id, **updates):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        params = list(updates.values()) + [user_id]
        
        cursor.execute(f"UPDATE users SET {set_clause} WHERE id = %s", params)
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()

def search_users(query, limit=20):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, email, name, created_at
            FROM users
            WHERE name LIKE %s OR email LIKE %s
            LIMIT %s
        """, (f"%{query}%", f"%{query}%", limit))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
```

### Advanced Queries with CTEs and Window Functions

```python
def get_sales_with_running_totals(start_date, end_date):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            WITH daily_sales AS (
                SELECT DATE(created_at) as sale_date,
                       SUM(total) as daily_revenue,
                       COUNT(*) as order_count
                FROM orders
                WHERE created_at BETWEEN %s AND %s
                GROUP BY DATE(created_at)
            )
            SELECT sale_date, daily_revenue, order_count,
                   SUM(daily_revenue) OVER (ORDER BY sale_date) as running_total,
                   AVG(daily_revenue) OVER (ORDER BY sale_date 
                       ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7d
            FROM daily_sales
            ORDER BY sale_date
        """, (start_date, end_date))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_top_customers_by_spend(limit=10):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                u.id, u.email, u.name,
                COUNT(o.id) as total_orders,
                SUM(o.total) as total_spent,
                AVG(o.total) as avg_order_value,
                RANK() OVER (ORDER BY SUM(o.total) DESC) as spend_rank,
                PERCENT_RANK() OVER (ORDER BY SUM(o.total) DESC) as percentile
            FROM users u
            JOIN orders o ON u.id = o.user_id
            WHERE o.status != 'cancelled'
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT %s
        """, (limit,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_recursive_category_tree():
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            WITH RECURSIVE category_tree AS (
                SELECT id, name, parent_id, 0 as level, CAST(name AS CHAR(200)) as path
                FROM categories WHERE parent_id IS NULL
                UNION ALL
                SELECT c.id, c.name, c.parent_id, ct.level + 1,
                       CONCAT(ct.path, ' > ', c.name)
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT * FROM category_tree ORDER BY path
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_previous_and_next_orders(order_id):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM orders WHERE user_id = (
                SELECT user_id FROM orders WHERE id = %s
            ) ORDER BY created_at
        """, (order_id,))
        all_orders = cursor.fetchall()
        
        current_index = next(i for i, o in enumerate(all_orders) if o["id"] == order_id)
        
        prev_order = all_orders[current_index - 1] if current_index > 0 else None
        next_order = all_orders[current_index + 1] if current_index < len(all_orders) - 1 else None
        
        return {
            "previous": dict(prev_order) if prev_order else None,
            "current": dict(all_orders[current_index]),
            "next": dict(next_order) if next_order else None
        }
    finally:
        cursor.close()
        conn.close()
```

### JSON and Dynamic Columns

```python
import json

def create_user_with_profile(user_data):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (email, name, password_hash, profile)
            VALUES (%s, %s, %s, %s)
        """, (user_data["email"], user_data["name"], 
              user_data["password_hash"], json.dumps(user_data.get("profile", {}))))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def update_user_settings(user_id, settings):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users SET settings = JSON_REPLACE(settings, %s, %s)
            WHERE id = %s
        """, (f'$.{list(settings.keys())[0]}', json.dumps(list(settings.values())[0]), user_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def search_products_by_attributes(filters):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conditions = []
        params = []
        
        if "category" in filters:
            conditions.append("JSON_EXTRACT(attributes, '$.category') = %s")
            params.append(filters["category"])
        
        if "min_price" in filters:
            conditions.append("CAST(JSON_EXTRACT(attributes, '$.price') AS DECIMAL) >= %s")
            params.append(filters["min_price"])
        
        if "features" in filters:
            for feature in filters["features"]:
                conditions.append("JSON_CONTAINS(attributes, %s, '$.features')")
                params.append(json.dumps(feature))
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor.execute(f"""
            SELECT id, name, SKU, 
                   JSON_EXTRACT(attributes, '$.price') as price,
                   JSON_EXTRACT(attributes, '$.category') as category
            FROM products
            WHERE {where_clause}
            ORDER BY CAST(JSON_EXTRACT(attributes, '$.popularity') AS UNSIGNED) DESC
            LIMIT 50
        """, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_user_analytics(user_id):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                id, email, name,
                JSON_VALUE(profile, '$.location') as location,
                JSON_QUERY(profile, '$.preferences') as preferences
            FROM users WHERE id = %s
        """, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
```

### Temporal Tables

```python
def get_historical_user_data(user_id, as_of_date):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM users FOR SYSTEM_TIME AS OF %s
            WHERE id = %s
        """, (as_of_date, user_id))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def get_user_changes_between(user_id, start_date, end_date):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM users
            FOR SYSTEM_TIME BETWEEN %s AND %s
            WHERE id = %s
            ORDER BY updated_at
        """, (start_date, end_date, user_id))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_all_current_data():
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users FOR SYSTEM_TIME AS OF NOW()")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
```

### Stored Procedures and Events

```python
def call_user_statistics(user_id):
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.callproc("get_user_statistics", [user_id])
        for result in cursor.stored_results():
            return result.fetchall()
    finally:
        cursor.close()
        conn.close()

def call_order_processing(order_id):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc("process_order", [order_id])
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def schedule_cleanup_task(schedule="EVERY 1 DAY"):
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            CREATE EVENT IF NOT EXISTS daily_cleanup
            ON SCHEDULE {schedule}
            DO
            BEGIN
                DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
                DELETE FROM sessions WHERE expires_at < NOW();
            END
        """)
        conn.commit()
    finally:
        cursor.close()
        conn.close()
```

## Best Practices

1. **Choose Appropriate Storage Engine**: Use InnoDB for ACID compliance, ColumnStore for analytics, Spider for sharding
2. **Use MariaDB Galera Cluster**: For high availability and multi-master replication
3. **Optimize Query Performance**: Use EXPLAIN to analyze queries and create appropriate indexes
4. **Configure Thread Pool**: For high-concurrency applications, tune thread pool settings
5. **Use Temporal Tables**: Leverage FOR SYSTEM_TIME for historical queries and point-in-time analysis
6. **Implement Connection Pooling**: Use MariaDB connector's connection pooling or external poolers
7. **Enable Query Logging**: Use slow query log to identify performance bottlenecks
8. **Regular Maintenance**: Run OPTIMIZE TABLE periodically to reclaim space and improve performance
9. **Secure Your Installation**: Use unix_socket authentication, enforce SSL connections, limit privileges
10. **Monitor and Tune**: Track key performance indicators and adjust configuration parameters accordingly
