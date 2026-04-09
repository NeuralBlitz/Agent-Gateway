---
name: cassandra
description: Apache Cassandra NoSQL database, wide-column storage, and distributed architecture
category: databases
---
# Apache Cassandra

## What I do

I am a highly scalable, distributed NoSQL database designed for handling large amounts of data across many commodity servers without a single point of failure. I use a wide-column store model inspired by Google's Bigtable and operate on a peer-to-peer architecture. I provide high availability, linear scalability, and tunable consistency. I excel at write-heavy workloads, time-series data, and applications requiring global distribution.

## When to use me

- Building applications requiring high write throughput (IoT, logging, telemetry)
- Systems needing horizontal scalability across multiple data centers
- Time-series data storage and analysis
- Message queues and event sourcing
- Product catalogs with frequent updates
- Fraud detection and real-time analytics
- Global applications requiring low-latency access from multiple regions
- Applications with predictable growth and high availability requirements

## Core Concepts

1. **Wide-Column Store**: Data stored in tables with dynamic columns; rows can have different column sets
2. **Partition Key**: Primary identifier determining data distribution across cluster nodes
3. **Cluster Key**: Combination of partition key and clustering columns determining data ordering
4. **Consistency Levels**: Tunable consistency (ONE, QUORUM, ALL, LOCAL_QUORUM) for read/write operations
5. **Gossip Protocol**: Peer-to-peer communication for cluster membership and state detection
6. **Merkle Trees**: Used for anti-entropy repair to synchronize data between replicas
7. **Compaction**: Process of merging SSTables to optimize read performance and reclaim space
8. **Tunable Consistency**: Balance between consistency and availability based on use case requirements
9. **Lightweight Transactions**: Paxos-based linearizable consistency for conditional operations
10. **Data Center Awareness**: Topology-aware replication and query routing for multi-DC deployments

## Code Examples

### Basic Connection and CRUD Operations

```python
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement, ConsistencyLevel
from cassandra import InvalidRequest

cluster = Cluster(["127.0.0.1"], port=9042)
session = cluster.connect("app_keyspace")

def create_user(user_data):
    query = """
        INSERT INTO users (user_id, email, name, created_at, profile)
        VALUES (%s, %s, %s, %s, %s)
        USING TTL 2592000
    """
    session.execute(query, (
        user_data["user_id"],
        user_data["email"],
        user_data["name"],
        user_data["created_at"],
        user_data.get("profile", {})
    ))

def get_user_by_id(user_id):
    query = "SELECT * FROM users WHERE user_id = %s"
    result = session.execute(query, (user_id,))
    return result.one()

def get_user_by_email(email):
    query = "SELECT * FROM users_by_email WHERE email = %s"
    result = session.execute(query, (email,))
    return result.one()

def update_user_profile(user_id, **updates):
    set_clauses = []
    params = []
    
    for key, value in updates.items():
        set_clauses.append(f"{key} = %s")
        params.append(value)
    
    params.append(user_id)
    query = f"UPDATE users SET {', '.join(set_clauses)} WHERE user_id = %s"
    session.execute(query, params)

def delete_user(user_id):
    query = "DELETE FROM users WHERE user_id = %s"
    session.execute(query, (user_id,))

def add_user_friend(user_id, friend_id, since):
    query = """
        INSERT INTO user_friends (user_id, friend_id, since)
        VALUES (%s, %s, %s)
    """
    session.execute(query, (user_id, friend_id, since))

def get_user_friends(user_id):
    query = "SELECT friend_id, since FROM user_friends WHERE user_id = %s"
    result = session.execute(query, (user_id,))
    return [row.friend_id for row in result]
```

### Time-Series Data and Aggregations

```python
from datetime import datetime, timedelta

def write_sensor_reading(sensor_id, reading_type, value, timestamp=None):
    if timestamp is None:
        timestamp = datetime.utcnow()
    
    query = """
        INSERT INTO sensor_readings (
            sensor_id, reading_type, timestamp, value, date
        ) VALUES (%s, %s, %s, %s, %s)
    """
    session.execute(query, (sensor_id, reading_type, timestamp, value, timestamp.date()))

def get_sensor_readings(sensor_id, reading_type, start_time, end_time):
    query = """
        SELECT timestamp, value FROM sensor_readings
        WHERE sensor_id = %s AND reading_type = %s
        AND timestamp >= %s AND timestamp <= %s
        ORDER BY timestamp DESC
    """
    result = session.execute(query, (sensor_id, reading_type, start_time, end_time))
    return [{"timestamp": row.timestamp, "value": row.value} for row in result]

def get_latest_sensor_readings(sensor_id):
    query = """
        SELECT reading_type, timestamp, value
        FROM latest_sensor_readings
        WHERE sensor_id = %s
    """
    result = session.execute(query, (sensor_id,))
    return {row.reading_type: {"timestamp": row.timestamp, "value": row.value} for row in result}

def update_latest_reading(sensor_id, reading_type, value, timestamp):
    query = """
        INSERT INTO latest_sensor_readings (sensor_id, reading_type, timestamp, value)
        VALUES (%s, %s, %s, %s)
    """
    session.execute(query, (sensor_id, reading_type, timestamp, value))

def get_hourly_averages(sensor_id, reading_type, date):
    query = """
        SELECT hour, avg_value FROM hourly_sensor_stats
        WHERE sensor_id = %s AND reading_type = %s AND date = %s
    """
    result = session.execute(query, (sensor_id, reading_type, date))
    return [{"hour": row.hour, "avg_value": row.avg_value} for row in result]

def get_daily_stats(date):
    query = """
        SELECT sensor_id, reading_type, min_value, max_value, avg_value, count
        FROM daily_sensor_stats
        WHERE date = %s
    """
    result = session.execute(query, (date,))
    return [dict(row._asdict()) for row in result]
```

### Batching and Performance Optimization

```python
from cassandra.query import BatchStatement, BatchType

def batch_insert_orders(orders):
    batch = BatchStatement(batch_type=BatchType.UNLOGGED)
    
    for order in orders:
        batch.add(SimpleStatement("""
            INSERT INTO orders (order_id, user_id, total, status, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """), (order["order_id"], order["user_id"], order["total"], 
              order.get("status", "pending"), order["created_at"]))
        
        for item in order["items"]:
            batch.add(SimpleStatement("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """), (order["order_id"], item["product_id"], 
                  item["quantity"], item["price"]))
    
    session.execute(batch)

def batch_update_inventory(updates):
    batch = BatchStatement(batch_type=BatchType.LOGGED)
    
    for update in updates:
        batch.add(SimpleStatement("""
            UPDATE inventory SET quantity = quantity - %s
            WHERE product_id = %s
        """), (update["quantity"], update["product_id"]))
    
    session.execute(batch)

def concurrent_inserts(records, concurrency=50):
    from concurrent.futures import ThreadPoolExecutor
    
    def insert_record(record):
        session.execute("""
            INSERT INTO events (event_id, event_type, data, created_at)
            VALUES (%s, %s, %s, %s)
        """, (record["event_id"], record["event_type"], 
              record["data"], record["created_at"]))
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        list(executor.map(insert_record, records))

def paginate_results(query, params=None, page_size=1000):
    statement = SimpleStatement(query, fetch_size=page_size)
    result = session.execute(statement, params) if params else session.execute(statement)
    
    while result.has_more_pages:
        for row in result.current_rows:
            yield row
        result = session.execute(result.next_page())
```

### Materialized Views and Secondary Indexes

```python
def create_materialized_views():
    session.execute("""
        CREATE MATERIALIZED VIEW users_by_email AS
        SELECT * FROM users
        WHERE email IS NOT NULL
        PRIMARY KEY (email)
    """)
    
    session.execute("""
        CREATE MATERIALIZED VIEW orders_by_user AS
        SELECT * FROM orders
        WHERE user_id IS NOT NULL AND order_id IS NOT NULL
        PRIMARY KEY (user_id, order_id)
        WITH CLUSTERING ORDER BY (order_id DESC)
    """)

def get_orders_by_user(user_id, limit=50):
    query = "SELECT * FROM orders_by_user WHERE user_id = %s LIMIT %s"
    result = session.execute(query, (user_id, limit))
    return [dict(row._asdict()) for row in result]

def create_secondary_index(column_name, table_name):
    session.execute(f"""
        CREATE INDEX idx_{table_name}_{column_name} 
        ON {table_name} ({column_name})
    """)

def search_products_by_category(category):
    query = "SELECT * FROM products WHERE category = %s"
    result = session.execute(query, (category,))
    return [dict(row._asdict()) for row in result]

def get_products_by_multiple_tags(tags):
    query = "SELECT * FROM products_by_tag WHERE tag = %s"
    results = []
    for tag in tags:
        result = session.execute(query, (tag,))
        results.extend([dict(row._asdict()) for row in result])
    return results
```

### Lightweight Transactions and Consistency

```python
from cassandra.query import LightweightTransactionProtocol

def create_user_if_not_exists(user_data):
    query = """
        INSERT INTO users (user_id, email, name, created_at)
        VALUES (%s, %s, %s, %s)
        IF NOT EXISTS
    """
    result = session.execute(query, (
        user_data["user_id"],
        user_data["email"],
        user_data["name"],
        user_data["created_at"]
    ))
    return result.was_applied

def update_with_condition(product_id, new_price, expected_stock):
    query = """
        UPDATE products SET price = %s 
        WHERE product_id = %s 
        IF stock = %s
    """
    result = session.execute(query, (new_price, product_id, expected_stock))
    return result.was_applied, result[0]

def atomic_counter_increment(counter_id, amount=1):
    query = """
        UPDATE counters SET count = count + %s WHERE counter_id = %s
    """
    statement = SimpleStatement(query, serial_consistency_level=ConsistencyLevel.LOCAL_SERIAL)
    result = session.execute(statement, (amount, counter_id))
    return result

def read_with_quorum(query, params=None):
    statement = SimpleStatement(
        query, 
        consistency_level=ConsistencyLevel.QUORUM
    )
    result = session.execute(statement, params) if params else session.execute(statement)
    return result

def write_with_quorum(data_query, data_params, audit_query, audit_params):
    batch = BatchStatement(batch_type=BatchType.LOGGED)
    batch.add(SimpleStatement(data_query, 
                   consistency_level=ConsistencyLevel.QUORUM), data_params)
    batch.add(SimpleStatement(audit_query,
                   consistency_level=ConsistencyLevel.QUORUM), audit_params)
    session.execute(batch)
```

## Best Practices

1. **Design Partition Keys Carefully**: Partition key determines data distribution; avoid hot partitions with skewed data
2. **Use Appropriate Consistency Levels**: Choose QUORUM for balanced consistency; ONE for maximum availability
3. **Batch Operations Wisely**: Use UNLOGGED batches for idempotent operations; LOGGED for transactional needs
4. **Avoid Secondary Indexes on High-Cardinality Columns**: Secondary indexes perform best on low-cardinality columns
5. **Use Lightweight Transactions Sparingly**: Paxos consensus has performance overhead; use IF NOT EXISTS judiciously
6. **Implement Proper TTL**: Use TTL for automatic data expiration instead of manual deletes where appropriate
7. **Monitor Compaction**: Choose appropriate compaction strategy (STCS, LCS, TWCS) based on workload patterns
8. **Configure Proper Replication Factor**: Use RF=3 for production; consider DC-aware replication strategies
9. **Use Prepared Statements**: Reuse prepared statements to reduce query parsing overhead
10. **Handle Retries and Timeouts**: Implement retry policies and timeout handling for transient failures
