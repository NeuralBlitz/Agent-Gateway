---
name: redshift
description: Amazon Redshift data warehouse, columnar storage, and petabyte-scale analytics
category: databases
---
# Amazon Redshift

## What I do

I am Amazon's fully managed, petabyte-scale cloud data warehouse. I use columnar storage, data compression, and massive parallel processing (MPP) to deliver fast query performance on large datasets. I integrate natively with AWS services (S3, DynamoDB, EMR) and supports standard SQL with extensions for analytics. I am designed for high-performance analytical workloads requiring complex aggregations and joins on large volumes of data.

## When to use me

- Enterprise data warehousing and BI reporting
- Complex analytical queries on large datasets
- Data lake querying with Redshift Spectrum
- Financial analysis and fraud detection
- Marketing and customer analytics
- Log analysis and behavioral analysis
- Ad-hoc querying on historical data
- Data consolidation from multiple sources
- Machine learning feature preparation
- Business intelligence dashboards

## Core Concepts

1. **Columnar Storage**: Data stored by column rather than row, enabling efficient analytical queries
2. **MPP Architecture**: Massively parallel processing distributes queries across multiple nodes
3. **Node Types**: RA3 for balanced compute/storage, DC2 for compute-intensive, DS2 for legacy
4. **Distribution Styles**: EVEN, KEY, ALL for optimal data distribution across nodes
5. **Sort Keys**: Determine data ordering within slices for query optimization
6. **Compression**: Automatic columnar compression reduces storage and I/O
7. **Workload Management (WLM)**: Queue management for concurrency and query prioritization
8. **Redshift Spectrum**: Query data directly in S3 without loading into Redshift
9. **Data Sharing**: Share live data across Redshift clusters without copying
10. **Auto Copy**: Automatically load data from S3 when new files arrive

## Code Examples

### Basic Connection and Query Execution

```python
import redshift_connector
import pandas as pd

conn = redshift_connector.connect(
    host="cluster.xxxxx.region.redshift.amazonaws.com",
    database="analytics",
    user="admin_user",
    password="your_password",
    port=5439
)

def execute_query(query, params=None):
    cursor = conn.cursor()
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    return cursor.fetchall()

def fetch_as_dataframe(query, params=None):
    return pd.read_sql(query, conn, params=params)

def get_user_summary():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            user_email,
            MIN(DATE(created_at)) as signup_date,
            COUNT(*) as total_orders,
            SUM(total_amount) as lifetime_value,
            AVG(total_amount) as avg_order_value
        FROM analytics.orders
        GROUP BY user_id, user_email
        ORDER BY lifetime_value DESC
        LIMIT 100
    """)

def get_daily_metrics():
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as metric_date,
            COUNT(DISTINCT user_id) as daily_active_users,
            COUNT(*) as daily_orders,
            SUM(total_amount) as daily_revenue,
            AVG(total_amount) as avg_order_size
        FROM analytics.orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY metric_date
    """)

def search_products(search_term):
    return fetch_as_dataframe("""
        SELECT 
            product_id,
            name,
            category,
            price,
            brand
        FROM analytics.products
        WHERE LOWER(name) LIKE LOWER(%s)
        ORDER BY popularity_score DESC
        LIMIT 20
    """, (f"%{search_term}%",))

def get_top_selling_products():
    return fetch_as_dataframe("""
        SELECT 
            p.product_id,
            p.name,
            p.category,
            SUM(oi.quantity) as total_sold,
            SUM(oi.quantity * oi.price) as total_revenue
        FROM analytics.products p
        JOIN analytics.order_items oi ON p.product_id = oi.product_id
        JOIN analytics.orders o ON oi.order_id = o.order_id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.product_id, p.name, p.category
        ORDER BY total_revenue DESC
        LIMIT 50
    """)
```

### Advanced Analytics with Window Functions

```python
def get_cohort_analysis():
    return fetch_as_dataframe("""
        WITH user_cohorts AS (
            SELECT 
                user_id,
                DATE_TRUNC('week', MIN(created_at)) as cohort_week
            FROM analytics.orders
            GROUP BY user_id
        ),
        weekly_activity AS (
            SELECT 
                u.cohort_week,
                DATE_TRUNC('week', o.created_at) as activity_week,
                COUNT(DISTINCT o.user_id) as active_users
            FROM user_cohorts u
            JOIN analytics.orders o ON u.user_id = o.user_id
            GROUP BY u.cohort_week, DATE_TRUNC('week', o.created_at)
        )
        SELECT 
            cohort_week,
            activity_week,
            EXTRACT(week FROM activity_week - cohort_week) as weeks_since_signup,
            active_users,
            FIRST_VALUE(active_users) OVER (
                PARTITION BY cohort_week ORDER BY activity_week
            ) as cohort_size,
            ROUND(active_users * 100.0 / 
                FIRST_VALUE(active_users) OVER (PARTITION BY cohort_week ORDER BY activity_week), 2
            ) as retention_rate
        FROM weekly_activity
        ORDER BY cohort_week, activity_week
    """)

def get_rfm_analysis():
    return fetch_as_dataframe("""
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
            DATEDIFF(day, last_order_date, CURRENT_DATE) as recency,
            frequency,
            monetary,
            NTILE(5) OVER (ORDER BY DATEDIFF(day, last_order_date, CURRENT_DATE)) as r_score,
            NTILE(5) OVER (ORDER BY frequency) as f_score,
            NTILE(5) OVER (ORDER BY monetary) as m_score,
            (NTILE(5) OVER (ORDER BY DATEDIFF(day, last_order_date, CURRENT_DATE)) 
             + NTILE(5) OVER (ORDER BY frequency)
             + NTILE(5) OVER (ORDER BY monetary)) / 3.0 as rfm_score
        FROM rfm_scores
        ORDER BY rfm_score DESC
    """)

def get_running_totals():
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as sale_date,
            SUM(total_amount) as daily_revenue,
            SUM(SUM(total_amount)) OVER (ORDER BY DATE(created_at)) as running_total,
            AVG(SUM(total_amount)) OVER (
                ORDER BY DATE(created_at)
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as moving_avg_7d
        FROM analytics.orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(created_at)
        ORDER BY sale_date
    """)

def get_lag_analysis():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            order_id,
            created_at,
            LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_order_date,
            LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as next_order_date,
            DATEDIFF(day, LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at), created_at) as days_since_last_order
        FROM analytics.orders
        WHERE user_id IN (SELECT user_id FROM analytics.users LIMIT 1000)
        ORDER BY user_id, created_at
    """)

def get_distinct_counts():
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total_rows,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT product_id) as unique_products,
            APPROX_COUNT_DISTINCT(user_id) as approx_users
        FROM analytics.orders
        GROUP BY DATE(created_at)
        ORDER BY date
    """)
```

### Data Loading and Unloading

```python
def load_from_s3(s3_path, iam_role, table_name):
    cursor = conn.cursor()
    cursor.execute(f"""
        COPY {table_name}
        FROM '{s3_path}'
        IAM_ROLE '{iam_role}'
        GZIP
        DELIMITER ','
        IGNOREHEADER 1
        REGION 'us-east-1'
    """)
    return cursor.rowcount

def load_json_from_s3(s3_path, iam_role, table_name):
    cursor = conn.cursor()
    cursor.execute(f"""
        COPY {table_name}
        FROM '{s3_path}'
        IAM_ROLE '{iam_role}'
        JSON 'auto'
        GZIP
    """)
    return cursor.rowcount

def unload_to_s3(query, s3_path, iam_role):
    cursor = conn.cursor()
    cursor.execute(f"""
        UNLOAD ('{query}')
        TO '{s3_path}'
        IAM_ROLE '{iam_role}'
        PARQUET
        PARTITION BY (DATE(created_at))
        SORT BY (created_at)
    """)
    return True

def unload_with_manifest(s3_path, iam_role, table_name):
    cursor = conn.cursor()
    cursor.execute(f"""
        UNLOAD ('SELECT * FROM {table_name}')
        TO '{s3_path}'
        IAM_ROLE '{iam_role}'
        CSV
        HEADER
        MANIFEST
    """)
    return True

def load_from_dynamodb(table_name, iam_role):
    cursor = conn.cursor()
    cursor.execute(f"""
        COPY {table_name}
        FROM 'dynamodb://{table_name}'
        IAM_ROLE '{iam_role}'
        READRATIO 50
    """)
    return cursor.rowcount

def load_from_emr(emr_path, iam_role, table_name):
    cursor = conn.cursor()
    cursor.execute(f"""
        COPY {table_name}
        FROM '{emr_path}'
        IAM_ROLE '{iam_role}'
        ORC
    """)
    return cursor.rowcount
```

### Redshift Spectrum for External Queries

```python
def create_external_schema():
    cursor = conn.cursor()
    cursor.execute("""
        CREATE EXTERNAL SCHEMA IF NOT EXISTS spectrum_db
        FROM DATA CATALOG
        DATABASE 'spectrum_db'
        IAM_ROLE 'arn:aws:iam::account:role/RedshiftSpectrumRole'
    """)
    return True

def query_spectrum_table():
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as event_date,
            event_type,
            COUNT(*) as event_count
        FROM spectrum_db.events_external
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at), event_type
        ORDER BY event_date, event_count DESC
    """)

def join_spectrum_with_redshift():
    return fetch_as_dataframe("""
        SELECT 
            r.user_id,
            r.total_orders,
            s.total_events
        FROM (
            SELECT user_id, COUNT(*) as total_orders
            FROM analytics.orders
            GROUP BY user_id
        ) r
        JOIN (
            SELECT user_id, COUNT(*) as total_events
            FROM spectrum_db.events_external
            GROUP BY user_id
        ) s ON r.user_id = s.user_id
        ORDER BY r.total_orders DESC
    """)

def create_external_table_parquet(s3_path, iam_role):
    cursor = conn.cursor()
    cursor.execute(f"""
        CREATE EXTERNAL TABLE spectrum_db.parquet_events (
            event_id BIGINT,
            event_type VARCHAR(50),
            user_id VARCHAR(50),
            created_at TIMESTAMP,
            event_data VARCHAR(MAX)
        )
        PARTITIONED BY (year VARCHAR(4), month VARCHAR(2))
        ROW FORMAT SERDE 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
        STORED AS INPUTFORMAT 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
        OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
        LOCATION '{s3_path}'
    """)
    return True

def repair_external_table(table_name):
    cursor = conn.cursor()
    cursor.execute(f"MSCK REPAIR TABLE {table_name}")
    return True
```

### Workload Management and Performance

```python
def configure_wlm_queue():
    cursor = conn.cursor()
    cursor.execute("""
        ALTER WLM MAP SERVICE REQUEST SET 
        wlm_query_slot_count = 10
    """)
    return True

def set_query_group(query_group):
    cursor = conn.cursor()
    cursor.execute(f"SET query_group TO '{query_group}'")
    return True

def analyze_table(table_name):
    cursor = conn.cursor()
    cursor.execute(f"ANALYZE {table_name}")
    return True

def vacuum_table(table_name):
    cursor = conn.cursor()
    cursor.execute(f"VACUUM SORT ONLY {table_name}")
    return True

def get_table_info():
    return fetch_as_dataframe("""
        SELECT 
            schema,
            table_name,
            table_size,
            sort_key1,
            dist_style,
            encoded
        FROM svv_table_info
        ORDER BY table_size DESC
    """)

def get_query_performance():
    return fetch_as_dataframe("""
        SELECT 
            query_id,
            query_text,
            start_time,
            elapsed_time,
            rows,
            aborted
        FROM stl_query
        WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY elapsed_time DESC
        LIMIT 50
    """)

def get_table_skew():
    return fetch_as_dataframe("""
        SELECT 
            table_id,
            table_name,
            slice,
            rows,
            row_count
        FROM svv_table_info ti
        JOIN sv_table_info sti ON ti.table_id = sti.table_id
        ORDER BY table_name, slice
    """)

def get_disk_usage():
    return fetch_as_dataframe("""
        SELECT 
            name as table_name,
            size as disk_usage_mb,
            CASE 
                WHEN diststyle = 'EVEN' THEN 'EVEN'
                WHEN diststyle = 'KEY' THEN 'KEY: ' || distkey
                ELSE 'ALL'
            END as distribution,
            sort_key1
        FROM svv_table_info
        WHERE schema = 'analytics'
        ORDER BY size DESC
    """)
```

## Best Practices

1. **Choose Appropriate Distribution Style**: Use KEY for joined tables, ALL for small dimension tables, EVEN for large fact tables
2. **Define Sort Keys**: Use sort keys on frequently filtered and joined columns for better performance
3. **Use Appropriate Data Types**: Use VARCHAR for variable-length strings, smallest numeric types that fit your data
4. **Compress Data**: Use automatic compression or define column encodings to reduce storage and I/O
5. **Vacuum and Analyze Regularly**: Run VACUUM to reclaim space and ANALYZE to update statistics
6. **Implement WLM Queues**: Configure workload management for concurrent workloads and query prioritization
7. **Use Redshift Spectrum for Infrequently Accessed Data**: Query S3 directly without loading into Redshift
8. **Optimize Joins**: Distribute join keys on the same column; use small tables with ALL distribution
9. **Avoid SELECT ***: Only select needed columns to reduce data transfer and improve performance
10. **Monitor Query Performance**: Use STL tables and CloudWatch metrics to identify bottlenecks
