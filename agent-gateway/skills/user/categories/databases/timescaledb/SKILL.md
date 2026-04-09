---
name: timescaledb
description: TimescaleDB time-series database, hypertables, and continuous aggregates
category: databases
---
# TimescaleDB

## What I do

I am a time-series database built as a PostgreSQL extension. I provide automatic partitioning (hypertables), optimized time-series queries, continuous aggregates, and data compression. I combine the power of PostgreSQL with time-series optimizations, enabling complex SQL queries and joins with time-series data. I am ideal for IoT, monitoring, finance, and any application dealing with time-stamped data at scale.

## When to use me

- IoT sensor data storage and analysis
- Application and infrastructure monitoring
- Financial market data and tick data
- Event logging and tracing
- User behavior and clickstream analysis
- DevOps metrics and observability
- Industrial equipment monitoring
- Vehicle telematics and fleet management
- Energy and utility data
- Real-time analytics dashboards

## Core Concepts

1. **Hypertables**: Virtual tables that automatically partition time-series data across chunks
2. **Chunks**: Time-based partitions managed automatically by TimescaleDB
3. **Continuous Aggregates**: Materialized aggregates that automatically refresh for fast queries
4. **Compression**: Columnar compression for older data chunks to save storage
5. **Time Bucketing**: Aggregate data into time intervals with standard SQL functions
6. **Policy-Based Automation**: Automated compression, retention, and refresh policies
7. **Distributed Hypertables**: Multi-node time-series storage for horizontal scaling
8. **Real-Time Aggregates**: Combine live data with pre-computed aggregates
9. **User-Defined Actions**: Custom background jobs for data processing
10. **PostgreSQL Compatibility**: Full PostgreSQL functionality plus time-series extensions

## Code Examples

### Basic Setup and Hypertables

```python
import psycopg2
from psycopg2 import sql
from contextlib import contextmanager
import timescaledb

@contextmanager
def get_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="timeseries_db",
        user="postgres",
        password="password",
        port=5432
    )
    try:
        yield conn
    finally:
        conn.close()

def create_extension():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")

def create_sensor_hypertable():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE sensor_data (
                    time TIMESTAMPTZ NOT NULL,
                    sensor_id TEXT NOT NULL,
                    temperature DOUBLE PRECISION,
                    humidity DOUBLE PRECISION,
                    pressure DOUBLE PRECISION,
                    battery_level DOUBLE PRECISION
                )
            """)
            
            cur.execute("""
                SELECT create_hypertable('sensor_data', 'time')
            """)
            
            cur.execute("""
                CREATE INDEX ON sensor_data (sensor_id, time DESC)
            """)

def create_events_table():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE events (
                    time TIMESTAMPTZ NOT NULL,
                    event_type TEXT NOT NULL,
                    source_id TEXT,
                    severity INTEGER,
                    message TEXT,
                    metadata JSONB
                )
            """)
            
            cur.execute("""
                SELECT create_hypertable('events', 'time')
            """)

def insert_sensor_reading(time, sensor_id, temperature, humidity=None, pressure=None, battery=None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sensor_data (time, sensor_id, temperature, humidity, pressure, battery_level)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (time, sensor_id, temperature, humidity, pressure, battery))

def insert_sensor_batch(readings):
    with get_connection() as conn:
        with conn.cursor() as cur:
            for reading in readings:
                cur.execute("""
                    INSERT INTO sensor_data (time, sensor_id, temperature, humidity, pressure, battery_level)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, reading)

def get_latest_sensor_readings(sensor_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM sensor_data
                WHERE sensor_id = %s
                ORDER BY time DESC
                LIMIT 1
            """, (sensor_id,))
            row = cur.fetchone()
            return {
                "time": row[0], "sensor_id": row[1], "temperature": row[2],
                "humidity": row[3], "pressure": row[4], "battery_level": row[5]
            } if row else None
```

### Time-Series Queries and Functions

```python
def get_hourly_averages(sensor_id, hours=24):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    time_bucket('1 hour', time) as bucket,
                    AVG(temperature) as avg_temp,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    AVG(humidity) as avg_humidity,
                    AVG(pressure) as avg_pressure
                FROM sensor_data
                WHERE sensor_id = %s AND time >= NOW() - INTERVAL '%s hours'
                GROUP BY bucket
                ORDER BY bucket
            """, (sensor_id, hours))
            return [{"bucket": row[0], "avg_temp": row[1], "min_temp": row[2], 
                    "max_temp": row[3], "avg_humidity": row[4], "avg_pressure": row[5]} 
                   for row in cur.fetchall()]

def get_daily_aggregates(start_date, end_date):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    DATE(time) as date,
                    sensor_id,
                    COUNT(*) as readings,
                    AVG(temperature) as avg_temp,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    STDDEV(temperature) as std_temp
                FROM sensor_data
                WHERE time BETWEEN %s AND %s
                GROUP BY date, sensor_id
                ORDER BY date, sensor_id
            """, (start_date, end_date))
            return [dict(row) for row in cur.fetchall()]

def get_gap Filling():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    sensor_id,
                    time_bucket('5 minutes', time) as bucket,
                    AVG(temperature) as avg_temp
                FROM sensor_data
                WHERE time >= NOW() - INTERVAL '1 hour'
                GROUP BY sensor_id, bucket
                ORDER BY sensor_id, bucket
            """)

def get_last_value_per_sensor():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT sensor_id, last(temperature, time) as temp, 
                       last(humidity, time) as humidity,
                       time as last_updated
                FROM sensor_data
                GROUP BY sensor_id
            """)
            return [{"sensor_id": row[0], "temp": row[1], "humidity": row[2], 
                    "last_updated": row[3]} for row in cur.fetchall()]

def detect_anomalies(sensor_id, std_deviations=2):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                WITH stats AS (
                    SELECT 
                        AVG(temperature) as mean,
                        STDDEV(temperature) as std
                    FROM sensor_data
                    WHERE sensor_id = %s AND time >= NOW() - INTERVAL '24 hours'
                )
                SELECT time, sensor_id, temperature
                FROM sensor_data, stats
                WHERE sensor_id = %s 
                    AND time >= NOW() - INTERVAL '24 hours'
                    AND ABS(temperature - mean) > %s * std
                ORDER BY time
            """, (sensor_id, sensor_id, std_deviations))
            return [{"time": row[0], "sensor_id": row[1], "temperature": row[2]} 
                   for row in cur.fetchall()]

def get_rate_of_change():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    sensor_id,
                    time,
                    temperature,
                    temperature - LAG(temperature) OVER (PARTITION BY sensor_id ORDER BY time) as delta_temp,
                    (temperature - LAG(temperature) OVER (PARTITION BY sensor_id ORDER BY time)) / 
                        EXTRACT(EPOCH FROM (time - LAG(time) OVER (PARTITION BY sensor_id ORDER BY time))) 
                        as rate_of_change
                FROM sensor_data
                WHERE time >= NOW() - INTERVAL '1 hour'
                ORDER BY sensor_id, time
            """)
            return [dict(row) for row in cur.fetchall()]
```

### Continuous Aggregates

```python
def create_continuous_aggregate():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE MATERIALIZED VIEW sensor_hourly
                WITH (timescaledb.continuous) AS
                SELECT 
                    sensor_id,
                    time_bucket('1 hour', time) as bucket,
                    AVG(temperature) as avg_temp,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    COUNT(*) as sample_count
                FROM sensor_data
                GROUP BY sensor_id, bucket
            """)

def create_daily_summary():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE MATERIALIZED VIEW sensor_daily
                WITH (timescaledb.continuous) AS
                SELECT 
                    sensor_id,
                    DATE(time) as date,
                    AVG(temperature) as avg_temp,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    SUM(CASE WHEN temperature > 35 THEN 1 ELSE 0 END) as overheat_count,
                    SUM(CASE WHEN temperature < 0 THEN 1 ELSE 0 END) as freeze_count
                FROM sensor_data
                GROUP BY sensor_id, DATE(time)
            """)

def add_refresh_policy():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT add_continuous_aggregate_policy('sensor_hourly',
                    start_offset => INTERVAL '1 day',
                    end_offset => INTERVAL '1 hour',
                    schedule_interval => INTERVAL '1 hour')
            """)

def query_continuous_aggregate(sensor_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT bucket, avg_temp, min_temp, max_temp, sample_count
                FROM sensor_hourly
                WHERE sensor_id = %s AND bucket >= NOW() - INTERVAL '7 days'
                ORDER BY bucket DESC
            """, (sensor_id,))
            return [dict(row) for row in cur.fetchall()]

def get_real_time_aggregate():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SET timescaledb.enable_continuous_aggregate = on;
                
                SELECT 
                    sensor_id,
                    time_bucket('5 minutes', time) as bucket,
                    AVG(temperature) as avg_temp
                FROM sensor_data
                WHERE time >= NOW() - INTERVAL '1 day'
                GROUP BY sensor_id, bucket
                ORDER BY sensor_id, bucket
            """)
```

### Compression and Retention Policies

```python
def enable_compression():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                ALTER TABLE sensor_data SET (
                    timescaledb.compress,
                    timescaledb.compress_segmentby = 'sensor_id'
                )
            """)

def add_compression_policy():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT add_compression_policy('sensor_data', INTERVAL '7 days')
            """)

def add_retention_policy():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT add_retention_policy('sensor_data', INTERVAL '2 years')
            """)

def remove_retention_policy():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT remove_retention_policy('sensor_data')
            """)

def get_compression_stats():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    hypertable_name,
                    compression_status,
                    total_chunks,
                    compressed_chunks,
                    before_compression_bytes,
                    after_compression_bytes
                FROM timescaledb.compression_stats
            """)
            return [dict(row) for row in cur.fetchall()]

def force_compression():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT compress_chunk(i) 
                FROM show_chunks('sensor_data') i
                WHERE end_offset < NOW() - INTERVAL '7 days'
            """)
```

### Distributed Hypertables and Multi-Node

```python
def create_distributed_hypertable():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT create_distributed_hypertable(
                    'sensor_data',
                    'time',
                    'sensor_id',
                    chunk_time_interval => INTERVAL '1 day'
                )
            """)

def add_data_node(node_name, host, port):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT add_data_node('{node_name}', host => '{host}', port => {port})
            """)

def reorder_chunk(chunk_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT reorder_chunk('_timescaledb_internal._hyper_1_1_chunk')
            """)

def get_chunk_info():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    chunk_name,
                    range_start,
                    range_end,
                    is_compressed,
                    chunk_size_bytes
                FROM timescaledb.chunks
                WHERE hypertable_name = 'sensor_data'
                ORDER BY range_start DESC
            """)
            return [dict(row) for row in cur.fetchall()]

def get_hypertable_info():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM timescaledb.hypertables
                WHERE hypertable_name = 'sensor_data'
            """)
            return dict(cur.fetchone()) if cur.fetchone() else None
```

## Best Practices

1. **Choose Appropriate Chunk Interval**: Set chunk size to 1-7 days based on data volume and query patterns
2. **Define Sort Keys**: Use sort keys on frequently filtered non-time columns for better performance
3. **Enable Compression Early**: Enable compression before data accumulates for best efficiency
4. **Implement Retention Policies**: Automatically delete old data to manage storage costs
5. **Use Continuous Aggregates**: Pre-compute common aggregations for dashboards and reports
6. **Index Wisely**: Create indexes on non-time filter columns; leverage automatic index selection
7. **Monitor Chunk Size**: Ensure chunks are neither too small (overhead) nor too large (slow queries)
8. **Use Distributed Hypertables for Scale**: Deploy multi-node setup for data volumes exceeding single node
9. **Leverage Time Bucketing**: Use time_bucket() instead of DATE_TRUNC for consistent group by
10. **Plan for Data Retention**: Define retention policies early; use tiered storage strategies
