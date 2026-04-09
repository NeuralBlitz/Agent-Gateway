---
name: snowflake
description: Snowflake cloud data warehouse, elastic scaling, and analytical SQL processing
category: databases
---
# Snowflake

## What I do

I am a cloud-native data warehousing platform that separates storage from compute, enabling independent scaling and cost optimization. I provide instant elasticity, true SaaS architecture, and support for structured and semi-structured data. I offer massive parallel processing (MPP), automatic optimization, and zero-maintenance operations. I am designed for analytical workloads, data lakes, and modern data architectures requiring scalability and performance.

## When to use me

- Enterprise data warehousing and BI reporting
- Data lake ingestion and unification
- Complex analytical queries and aggregations
- Machine learning feature engineering
- Large-scale historical data analysis
- Multi-source data consolidation
- Time-series analytics and trends
- Semi-structured data analysis (JSON, Avro, Parquet)
- Data sharing and collaboration between organizations
- Building modern data stacks

## Core Concepts

1. **Micro-Partitions**: Automatic data partitioning into 50-500MB compressed blocks for efficient querying
2. **Virtual Warehouses**: Independent compute clusters that can be scaled up or out on demand
3. **Storage-Compute Separation**: Storage billed separately from compute; data persists independently
4. **Time Travel**: Query historical data at any point within configured retention period
5. **Zero-Copy Cloning**: Instant database cloning without copying data for development/testing
6. **Semi-Structured Data**: Native support for VARIANT, ARRAY, OBJECT types for JSON/Avro/Parquet
7. **Caching**: Result cache for 24 hours, metadata cache for query optimization
8. **Snowflake Stages**: Internal/external locations for data loading and unloading
9. **Secure Data Sharing**: Share data between Snowflake accounts without copying
10. **Multi-Cluster Warehouses**: Auto-scale compute for concurrent workload handling

## Code Examples

### Basic Connection and Query Execution

```python
import snowflake.connector
from snowflake.connector import errors

ctx = snowflake.connector.connect(
    account="your_account",
    user="your_user",
    password="your_password",
    warehouse="COMPUTE_WH",
    database="ANALYTICS",
    schema="PUBLIC"
)

def execute_query(query, params=None):
    ctx.cursor().execute(query, params) if params else ctx.cursor().execute(query)

def fetch_results(query, params=None):
    cursor = ctx.cursor()
    cursor.execute(query, params) if params else cursor.execute(query)
    return cursor.fetchall()

def get_user_summary():
    return fetch_results("""
        SELECT 
            user_id,
            email,
            created_at::DATE as signup_date,
            COUNT(*) as total_orders,
            SUM(total_amount) as lifetime_value,
            AVG(total_amount) as avg_order_value
        FROM analytics.orders
        GROUP BY user_id, email, created_at::DATE
        ORDER BY lifetime_value DESC
        LIMIT 100
    """)

def get_daily_metrics():
    return fetch_results("""
        SELECT 
            DATE(created_at) as metric_date,
            COUNT(DISTINCT user_id) as daily_active_users,
            COUNT(*) as daily_orders,
            SUM(total_amount) as daily_revenue,
            AVG(total_amount) as avg_order_size
        FROM analytics.orders
        WHERE created_at >= DATEADD('day', -30, CURRENT_DATE())
        GROUP BY DATE(created_at)
        ORDER BY metric_date
    """)

def search_products(search_term):
    return fetch_results("""
        SELECT 
            id,
            name,
            category,
            price,
            JSON_EXTRACT_PATH_TEXT(metadata, 'brand') as brand
        FROM analytics.products
        WHERE name ILIKE %s
        ORDER BY popularity_score DESC
        LIMIT 20
    """, (f"%{search_term}%",))
```

### Working with Semi-Structured Data

```python
import json

def load_json_events(events_data):
    cursor = ctx.cursor()
    
    insert_query = """
        INSERT INTO analytics.events (event_id, event_type, user_id, event_data, created_at)
        SELECT 
            $1:event_id::STRING,
            $1:event_type::STRING,
            $1:user_id::STRING,
            PARSE_JSON($1:event_data),
            TO_TIMESTAMP_NTZ($1:created_at)
        FROM TABLE(FLATTEN(PARSE_JSON(%s)))
    """
    
    cursor.execute(insert_query, (json.dumps(events_data),))
    return cursor.rowcount

def query_user_behavior(user_id):
    return fetch_results("""
        SELECT 
            e.event_type,
            COUNT(*) as event_count,
            MIN(e.created_at) as first_seen,
            MAX(e.created_at) as last_seen
        FROM analytics.events e
        WHERE e.user_id = %s
        GROUP BY e.event_type
        ORDER BY event_count DESC
    """, (user_id,))

def extract_nested_data():
    return fetch_results("""
        SELECT 
            o.order_id,
            o.customer_info:name::STRING as customer_name,
            o.customer_info:email::STRING as customer_email,
            o.items[0]:product_id::STRING as first_product,
            ARRAY_SIZE(o.items) as item_count,
            o.metadata:source::STRING as order_source
        FROM analytics.orders o
        WHERE o.order_date >= DATEADD('day', -7, CURRENT_DATE())
    """)

def analyze_json_logs():
    return fetch_results("""
        SELECT 
            DATE(created_at) as log_date,
            log_level,
            COUNT(*) as count,
            ARRAY_AGG(DISTINCT service_name) as affected_services
        FROM analytics.application_logs
        WHERE created_at >= DATEADD('hour', -24, CURRENT_TIMESTAMP())
        GROUP BY DATE(created_at), log_level
        HAVING COUNT(*) > 10
        ORDER BY log_date, log_level
    """)

def flatten_array_data():
    return fetch_results("""
        SELECT 
            o.order_id,
            item.value:product_id::STRING as product_id,
            item.value:quantity::INTEGER as quantity,
            item.value:price::DECIMAL(10,2) as price
        FROM analytics.orders o,
             LATERAL FLATTEN(input => o.items) item
        WHERE o.order_date >= DATEADD('day', -1, CURRENT_DATE())
    """)
```

### Time Travel and Cloning

```python
def query_historical_data(user_id, days_ago=7):
    return fetch_results("""
        SELECT * FROM analytics.users
        AT(OFFSET => -%s * 24 * 60)
        WHERE user_id = %s
    """, (days_ago, user_id))

def get_deleted_records(table_name, since_hours=24):
    return fetch_results(f"""
        SELECT * FROM {table_name}
        AT(OFFSET => -{since_hours} * 60)
        WHERE _deleted = TRUE
    """)

def compare_data_at_two_points(point1, point2):
    return fetch_results("""
        SELECT 
            current_data.id,
            current_data.name as current_name,
            past_data.name as past_name,
            current_data.updated_at as current_updated,
            past_data.updated_at as past_updated
        FROM analytics.users AT(OFFSET => -%s * 60) as current_data
        JOIN analytics.users AT(OFFSET => -%s * 60) as past_data
            ON current_data.id = past_data.id
        WHERE current_data.name != past_data.name
    """, (point1, point2))

def create_clone_for_testing(source_db, source_schema, clone_name):
    return execute_query(f"""
        CREATE OR REPLACE DATABASE {clone_name} CLONE {source_db}.{source_schema}
    """)

def restore_accidentally_deleted_table(original_table, restored_table):
    return execute_query(f"""
        CREATE OR REPLACE TABLE {restored_table} AS
        SELECT * FROM {original_table}
        AT(OFFSET => -5 * 60)
    """)

def get_table_version_history(table_name):
    return fetch_results(f"""
        SELECT 
            created_on,
            name,
            database_name,
            schema_name,
            comment
        FROM {table_name}.INFORMATION_SCHEMA.TABLES
        WHERE table_name = %s
    """, (table_name,))
```

### Data Loading and Unloading

```python
from snowflake.connector import FileUploader

def load_from_stage(stage_name, table_name):
    cursor = ctx.cursor()
    
    copy_query = f"""
        COPY INTO {table_name}
        FROM @{stage_name}
        FILE_FORMAT = (TYPE = 'CSV' FIELD_DELIMITER = ',' SKIP_HEADER = 1)
        ON_ERROR = 'CONTINUE'
    """
    
    cursor.execute(copy_query)
    return cursor.fetchall()

def load_from_s3(bucket, path, table_name, aws_key, aws_secret):
    cursor = ctx.cursor()
    
    cursor.execute(f"""
        CREATE OR REPLACE STAGE s3_stage
        url = 's3://{bucket}/{path}'
        credentials = (aws_role = '')
        credentials = (aws_access_key_id = '{aws_key}' aws_secret_access_key = '{aws_secret}')
    """)
    
    cursor.execute(f"""
        COPY INTO {table_name}
        FROM @s3_stage
        FILE_FORMAT = (TYPE = 'PARQUET')
    """)
    return cursor.rowcount

def unload_to_s3(table_name, s3_path, aws_key, aws_secret):
    cursor = ctx.cursor()
    
    cursor.execute(f"""
        CREATE OR REPLACE STAGE output_stage
        url = 's3://{s3_path}'
        credentials = (aws_access_key_id = '{aws_key}' aws_secret_access_key = '{aws_secret}')
    """)
    
    unload_query = f"""
        COPY INTO @output_stage
        FROM {table_name}
        FILE_FORMAT = (TYPE = 'CSV' FIELD_DELIMITER = ',' HEADER = TRUE)
    """
    
    cursor.execute(unload_query)
    return cursor.fetchall()

def generate_data_for_export():
    return execute_query("""
        CREATE OR REPLACE TABLE export_data AS
        SELECT 
            o.order_id,
            o.order_date,
            u.email,
            u.name as customer_name,
            SUM(oi.quantity * oi.price) as total_value
        FROM analytics.orders o
        JOIN analytics.users u ON o.user_id = u.user_id
        JOIN analytics.order_items oi ON o.order_id = oi.order_id
        WHERE o.order_date >= DATEADD('month', -1, CURRENT_DATE())
        GROUP BY o.order_id, o.order_date, u.email, u.name
    """)

def export_to_local_file(table_name, local_path):
    cursor = ctx.cursor()
    
    cursor.execute(f"""
        COPY INTO 'file://{local_path}'
        FROM {table_name}
        FILE_FORMAT = (TYPE = 'CSV' FIELD_DELIMITER = ',' HEADER = TRUE)
    """)
    return cursor.fetchall()
```

### Advanced Analytics and Window Functions

```python
def get_cohort_analysis():
    return fetch_results("""
        WITH user_cohorts AS (
            SELECT 
                user_id,
                MIN(DATE_TRUNC('week', created_at)) as cohort_week
            FROM analytics.users
            GROUP BY user_id
        ),
        weekly_activity AS (
            SELECT 
                uc.cohort_week,
                DATE_TRUNC('week', o.created_at) as activity_week,
                COUNT(DISTINCT o.user_id) as active_users
            FROM user_cohorts uc
            JOIN analytics.orders o ON uc.user_id = o.user_id
            GROUP BY uc.cohort_week, DATE_TRUNC('week', o.created_at)
        )
        SELECT 
            cohort_week,
            activity_week,
            DATEDIFF('week', cohort_week, activity_week) as weeks_since_signup,
            active_users,
            FIRST_VALUE(active_users) OVER (
                PARTITION BY cohort_week ORDER BY activity_week
            ) as cohort_size,
            ROUND(active_users * 100.0 / FIRST_VALUE(active_users) OVER (
                PARTITION BY cohort_week ORDER BY activity_week
            ), 2) as retention_rate
        FROM weekly_activity
        ORDER BY cohort_week, activity_week
    """)

def get_rfm_analysis():
    return fetch_results("""
        WITH rfm_scores AS (
            SELECT 
                user_id,
                MAX(created_at) as last_order_date,
                COUNT(*) as frequency,
                SUM(total_amount) as monetary
            FROM analytics.orders
            GROUP BY user_id
        )
        SELECT 
            user_id,
            DATEDIFF('day', last_order_date, CURRENT_DATE()) as recency,
            frequency,
            monetary,
            NTILE(5) OVER (ORDER BY DATEDIFF('day', last_order_date, CURRENT_DATE())) as r_score,
            NTILE(5) OVER (ORDER BY frequency) as f_score,
            NTILE(5) OVER (ORDER BY monetary) as m_score,
            (NTILE(5) OVER (ORDER BY DATEDIFF('day', last_order_date, CURRENT_DATE())) 
             + NTILE(5) OVER (ORDER BY frequency)
             + NTILE(5) OVER (ORDER BY monetary)) / 3 as rfm_score
        FROM rfm_scores
        ORDER BY rfm_score DESC
    """)

def get_session_analysis():
    return fetch_results("""
        SELECT 
            user_id,
            session_id,
            MIN(created_at) as session_start,
            MAX(created_at) as session_end,
            DATEDIFF('second', MIN(created_at), MAX(created_at)) as session_duration,
            COUNT(*) as events
        FROM analytics.events
        GROUP BY user_id, session_id
        HAVING COUNT(*) > 1
        ORDER BY session_duration DESC
        LIMIT 100
    """)

def get_running_totals_and_moving_averages():
    return fetch_results("""
        SELECT 
            DATE(created_at) as sale_date,
            SUM(total_amount) as daily_revenue,
            SUM(SUM(total_amount)) OVER (ORDER BY DATE(created_at)) as running_total,
            AVG(SUM(total_amount)) OVER (
                ORDER BY DATE(created_at)
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as moving_avg_7d
        FROM analytics.orders
        WHERE created_at >= DATEADD('month', -3, CURRENT_DATE())
        GROUP BY DATE(created_at)
        ORDER BY sale_date
    """)
```

## Best Practices

1. **Right-Size Warehouses**: Use appropriate warehouse size; scale up for complex queries, scale out for concurrency
2. **Use Clustering Keys**: Define clustering keys for large tables to improve query performance
3. **Leverage Time Travel**: Use AT/AS OF clauses for historical analysis and data recovery
4. **Optimize for Semi-Structured Data**: Use VARIANT columns and flatten with LATERAL FLATTEN
5. **Implement Proper Caching**: Leverage result cache for repeated queries; cache external data locally
6. **Use Zero-Copy Cloning**: Create clones for dev/test without additional storage costs
7. **Configure Auto-Suspend**: Set auto-suspend to reduce compute costs when warehouse is idle
8. **Use Materialized Views**: For frequently accessed aggregated data to improve query performance
9. **Monitor Query Performance**: Use QUERY_HISTORY to identify slow queries and optimization opportunities
10. **Implement Data Sharing**: Use secure sharing for inter-organizational data collaboration
