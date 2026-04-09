---
name: Cassandra
description: Highly scalable, distributed NoSQL database designed for handling large amounts of data across multiple data centers
license: MIT
compatibility:
  - Python 3.8+
  - cassandra-driver 3.25+
  - DataStax driver
audience: Backend developers, DevOps engineers, data engineers
category: databases
---

# Cassandra

## What I Do

I provide guidance on Apache Cassandra, the highly available, distributed NoSQL database. I help with data modeling for Cassandra's wide-column store, CQL queries, consistency levels, cluster administration, and time-series data handling.

## When to Use Me

- High write throughput applications
- Time-series data storage (metrics, events)
- IoT sensor data collection
- Messaging and chat applications
- Fraud detection systems
- Global distribution with multi-region replication
- Applications requiring tunable consistency

## Core Concepts

- **Tables**: Column families with schema
- **Partition Key**: Primary identifier for data distribution
- **Clustering Columns**: Data ordering within partitions
- **CQL**: Cassandra Query Language (SQL-like)
- **Consistency Levels**: ONE, QUORUM, ALL, LOCAL_QUORUM
- **Gossip Protocol**: Node communication
- **Compaction**: SSTable merging process
- **Tombstones**: Deleted data markers
- **Lightweight Transactions**: Paxos-based (LWT)
- **Tunable Consistency**: Read/Write consistency tuning

## Code Examples

### Basic Connection and CQL

```python
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement

cluster = Cluster(['127.0.0.1'], port=9042)
session = cluster.connect('my_app')

def create_tables() -> None:
    session.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id UUID PRIMARY KEY,
            email TEXT,
            name TEXT,
            created_at TIMESTAMP
        )
    """)
    session.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            user_id UUID,
            session_id UUID,
            started_at TIMESTAMP,
            data MAP<TEXT, TEXT>,
            PRIMARY KEY (user_id, started_at)
        ) WITH CLUSTERING ORDER BY (started_at DESC)
    """)

def insert_user(user_id: str, email: str, name: str) -> None:
    session.execute(
        """
        INSERT INTO users (user_id, email, name, created_at)
        VALUES (%s, %s, %s, toTimestamp(now()))
        """,
        (user_id, email, name)
    )
```

### Time-Series Data Model

```python
from cassandra.cluster import Cluster
from datetime import datetime, timedelta

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('metrics')

def create_metrics_tables() -> None:
    session.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            sensor_id TEXT,
            timestamp TIMESTAMP,
            temperature FLOAT,
            humidity FLOAT,
            PRIMARY KEY (sensor_id, timestamp)
        ) WITH CLUSTERING ORDER BY (timestamp DESC)
        AND compaction = {'class': 'TimeWindowCompactionStrategy'}
        AND default_time_to_live = 2592000
    """)

def insert_reading(sensor_id: str, temp: float, humidity: float) -> None:
    session.execute(
        """
        INSERT INTO sensor_readings (sensor_id, timestamp, temperature, humidity)
        VALUES (%s, toTimestamp(now()), %s, %s)
        """,
        (sensor_id, temp, humidity)
    )

def get_recent_readings(sensor_id: str, hours: int = 24) -> list:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    rows = session.execute(
        """
        SELECT * FROM sensor_readings
        WHERE sensor_id = %s AND timestamp > %s
        """,
        (sensor_id, cutoff)
    )
    return list(rows)
```

### Tunable Consistency Operations

```python
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('my_app')

def write_with_quorum(data: dict) -> None:
    query = SimpleStatement(
        "INSERT INTO events (id, event_type, data) VALUES (%s, %s, %s)",
        consistency_level= ConsistencyLevel.QUORUM
    )
    session.execute(query, (data['id'], data['type'], str(data)))

def read_with_local_quorum(sensor_id: str) -> list:
    query = SimpleStatement(
        """
        SELECT * FROM sensor_readings
        WHERE sensor_id = %s
        """,
        consistency_level=ConsistencyLevel.LOCAL_QUORUM
    )
    return session.execute(query, (sensor_id,))
```

### Batch Operations

```python
from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from uuid import uuid4

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('my_app')

def batch_insert_user_events(user_id: str, events: list) -> None:
    batch = BatchStatement(consistency_level= ConsistencyLevel.QUORUM)
    
    for event in events:
        batch.add(
            """
            INSERT INTO user_events (user_id, event_id, event_type, timestamp)
            VALUES (%s, %s, %s, toTimestamp(now()))
            """,
            (user_id, uuid4(), event['type'])
        )
    
    session.execute(batch)
```

## Best Practices

1. Model queries first, then tables (CQL is query-first)
2. Use UUID or time-based UUID for unique IDs
3. Keep partitions small (avoid wide rows > 100MB)
4. Use appropriate consistency levels for SLAs
5. Avoid ALLOW FILTERING on large datasets
6. Use prepared statements for repeated queries
7. Configure compaction strategies per table
8. Monitor tombstone counts and repair status
9. Use lightweight transactions sparingly
10. Set appropriate TTLs for time-series data

## Common Patterns

**Wide Row for Time Series:**
```cql
CREATE TABLE metrics (
    metric_name TEXT,
    timestamp TIMESTAMP,
    value DOUBLE,
    PRIMARY KEY ((metric_name), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

**Counter Table:**
```cql
CREATE TABLE page_views (
    page_id TEXT,
    day TIMESTAMP,
    views COUNTER,
    PRIMARY KEY (page_id, day)
);

UPDATE page_views SET views = views + 1 WHERE page_id = 'home' AND day = toDate(now());
```

**Materialized View:**
```cql
CREATE MATERIALIZED VIEW users_by_email AS
SELECT * FROM users
WHERE email IS NOT NULL
PRIMARY KEY (email)
WITH CLUSTERING COLUMN BY (user_id);
```
