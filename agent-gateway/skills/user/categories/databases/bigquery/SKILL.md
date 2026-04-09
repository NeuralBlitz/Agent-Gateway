---
name: bigquery
description: Google BigQuery serverless data warehouse, ANSI SQL analytics, and petabyte scaling
category: databases
---
# Google BigQuery

## What I do

I am Google's serverless, highly scalable, multi-cloud data warehouse. I separate storage from compute, enabling instant elasticity and cost efficiency for analytical workloads. I support standard SQL with extensions for arrays, structs, and nested data. I provide automatic high availability, built-in ML capabilities, and seamless integration with the Google Cloud ecosystem. I am designed for petabyte-scale analytics with zero infrastructure management.

## When to use me

- Large-scale data warehousing and business intelligence
- Log analytics and clickstream analysis
- Financial data analysis and fraud detection
- Ad tech and marketing analytics
- IoT data ingestion and analysis
- Machine learning feature stores
- Real-time streaming analytics
- Multi-source data unification
- Geospatial analysis with BigQuery GIS
- Cost-effective analytical queries on massive datasets

## Core Concepts

1. **Storage-Compute Separation**: Storage billed separately from query processing; independent scaling
2. **Slot-based Execution**: Virtual CPUs (slots) process queries in parallel across distributed infrastructure
3. **Columnar Storage**: Data stored in Capacitor columnar format for efficient analytical scans
4. **Partitioned Tables**: Divide large tables by date, integer range, or ingestion time for cost optimization
5. **Clustered Tables**: Organize data within partitions by specific columns for better query performance
6. **Streaming Inserts**: Real-time data ingestion with immediate queryability
7. **BigQuery ML (BQML)**: Build and deploy ML models using SQL directly in BigQuery
8. **Streaming Analytics**: Process real-time data streams with windowed aggregations
9. **Data Transfer Services**: Automated data ingestion from SaaS applications and cloud storage
10. **Access Controls**: IAM-based fine-grained permissions at project, dataset, and table levels

## Code Examples

### Basic Connection and Query Execution

```python
from google.cloud import bigquery
import pandas as pd

client = bigquery.Client()

def execute_query(query, params=None):
    job_config = bigquery.QueryJobConfig()
    if params:
        job_config.query_parameters = params
    
    query_job = client.query(query, job_config=job_config)
    return query_job.result()

def fetch_as_dataframe(query, params=None):
    return execute_query(query, params).to_dataframe()

def get_user_summary():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            user_email,
            DATE(first_seen) as signup_date,
            COUNT(*) as total_orders,
            SUM(amount) as lifetime_value,
            AVG(amount) as avg_order_value
        FROM `analytics.orders`
        GROUP BY user_id, user_email, signup_date
        ORDER BY lifetime_value DESC
        LIMIT 100
    """)

def get_daily_metrics():
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as metric_date,
            COUNT(DISTINCT user_id) as daily_active_users,
            COUNT(*) as daily_orders,
            SUM(amount) as daily_revenue,
            AVG(amount) as avg_order_size
        FROM `analytics.orders`
        WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
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
        FROM `analytics.products`
        WHERE LOWER(name) LIKE LOWER(@search_term)
        ORDER BY popularity_score DESC
        LIMIT 20
    """, [bigquery.ScalarQueryParameter("search_term", "STRING", f"%{search_term}%")])

def get_recent_orders(limit=100):
    return fetch_as_dataframe("""
        SELECT 
            order_id,
            user_id,
            amount,
            status,
            created_at
        FROM `analytics.orders`
        ORDER BY created_at DESC
        LIMIT @limit
    """, [bigquery.ScalarQueryParameter("limit", "INT64", limit)])
```

### Working with Nested and Repeated Data

```python
import json

def load_nested_json_events(events_data):
    rows = []
    for event in events_data:
        rows.append({
            "event_id": event["event_id"],
            "event_type": event["event_type"],
            "user_id": event["user_id"],
            "event_timestamp": event["created_at"],
            "event_data": json.dumps(event.get("data", {})),
            "user_agent": event.get("user_agent", ""),
            "ip_address": event.get("ip", "")
        })
    
    errors = client.insert_rows_json("analytics.events", rows)
    return len(errors) == 0

def query_user_behavior(user_id):
    return fetch_as_dataframe("""
        SELECT 
            event_type,
            COUNT(*) as event_count,
            MIN(event_timestamp) as first_seen,
            MAX(event_timestamp) as last_seen
        FROM `analytics.events`,
        UNNEST(event_data) as ed
        WHERE user_id = @user_id
        GROUP BY event_type
        ORDER BY event_count DESC
    """, [bigquery.ScalarQueryParameter("user_id", "STRING", user_id)])

def analyze_user_sessions():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            session_id,
            MIN(event_timestamp) as session_start,
            MAX(event_timestamp) as session_end,
            TIMESTAMP_DIFF(MAX(event_timestamp), MIN(event_timestamp), SECOND) as duration_sec,
            COUNT(*) as event_count
        FROM (
            SELECT 
                user_id,
                event_id,
                event_timestamp,
                FIRST_VALUE(event_id) OVER (
                    PARTITION BY user_id 
                    ORDER BY event_timestamp
                    ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING
                ) as prev_event,
                SUM(CASE 
                    WHEN TIMESTAMP_DIFF(event_timestamp, 
                        LAG(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp), 
                        MINUTE) > 30 THEN 1 
                    ELSE 0 
                END) + 1 as session_id
            FROM `analytics.events`
        )
        GROUP BY user_id, session_id
        HAVING event_count > 1
        ORDER BY duration_sec DESC
        LIMIT 100
    """)

def extract_nested_order_data():
    return fetch_as_dataframe("""
        SELECT 
            order_id,
            customer.name as customer_name,
            customer.email as customer_email,
            (SELECT COUNT(*) FROM UNNEST(items)) as item_count,
            (SELECT SUM(CAST(item.quantity AS INT64)) FROM UNNEST(items) item) as total_quantity,
            (SELECT SUM(CAST(item.price AS FLOAT64) * CAST(item.quantity AS INT64)) 
             FROM UNNEST(items) item) as total_amount
        FROM `analytics.orders`
        WHERE order_date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    """)

def analyze_struct_data():
    return fetch_as_dataframe("""
        SELECT 
            location.city,
            location.country,
            COUNT(*) as visit_count,
            AVG(session.duration_seconds) as avg_session_duration
        FROM `analytics.user_sessions`
        WHERE session.duration_seconds > 0
        GROUP BY location.city, location.country
        ORDER BY visit_count DESC
    """)
```

### Streaming and Real-Time Analytics

```python
def stream_order_event(order_data):
    row = {
        "order_id": order_data["order_id"],
        "user_id": order_data["user_id"],
        "amount": order_data["total"],
        "items": json.dumps(order_data.get("items", [])),
        "status": order_data.get("status", "pending"),
        "created_at": order_data["created_at"]
    }
    
    errors = client.insert_rows_json("analytics.orders_stream", [row])
    return len(errors) == 0

def get_realtime_dashboard():
    return fetch_as_dataframe("""
        SELECT 
            FORMAT_TIMESTAMP("%H:%M:%S", created_at, "UTC") as time_bucket,
            COUNT(*) as orders_last_minute,
            SUM(amount) as revenue_last_minute,
            COUNT(DISTINCT user_id) as unique_users
        FROM `analytics.orders_stream`
        WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
        GROUP BY time_bucket
        ORDER BY time_bucket
    """)

def detect_anomalies():
    return fetch_as_dataframe("""
        WITH hourly_stats AS (
            SELECT 
                DATE(created_at) as date,
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as order_count,
                AVG(amount) as avg_amount,
                STDDEV(amount) as std_amount
            FROM `analytics.orders`
            GROUP BY date, hour
        ),
        recent_data AS (
            SELECT 
                DATE(created_at) as date,
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as order_count,
                AVG(amount) as avg_amount
            FROM `analytics.orders_stream`
            WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
            GROUP BY date, hour
        )
        SELECT 
            r.date,
            r.hour,
            r.order_count,
            r.avg_amount,
            h.order_count as expected_orders,
            h.avg_amount as expected_avg,
            CASE 
                WHEN r.order_count > h.order_count * 2 THEN 'HIGH_VOLUME_ANOMALY'
                WHEN r.avg_amount > h.avg_amount + 3 * h.std_amount THEN 'PRICE_ANOMALY'
                ELSE 'NORMAL'
            END as anomaly_type
        FROM recent_data r
        JOIN hourly_stats h ON r.date = h.date AND r.hour = h.hour
    """)

def continuous_query():
    return client.query("""
        SELECT 
            event_type,
            event_count,
            event_timestamp
        FROM `analytics.events`
        WHERE event_timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 10 MINUTE)
        ORDER BY event_timestamp DESC
    """)
```

### Partitioning and Clustering

```python
def create_partitioned_table():
    return client.query("""
        CREATE TABLE IF NOT EXISTS `analytics.orders_partitioned`
        PARTITION BY DATE(created_at)
        CLUSTER BY user_id, status
        AS
        SELECT * FROM `analytics.orders`
    """)

def query_partitioned_table(start_date, end_date):
    return fetch_as_dataframe("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as order_count,
            SUM(amount) as revenue
        FROM `analytics.orders_partitioned`
        WHERE created_at BETWEEN @start_date AND @end_date
        GROUP BY DATE(created_at)
        ORDER BY date
    """, [
        bigquery.ScalarQueryParameter("start_date", "TIMESTAMP", start_date),
        bigquery.ScalarQueryParameter("end_date", "TIMESTAMP", end_date)
    ])

def get_table_info(dataset_id, table_id):
    table_ref = client.dataset(dataset_id).table(table_id)
    table = client.get_table(table_ref)
    return {
        "name": table.table_id,
        "num_rows": table.num_rows,
        "size_bytes": table.size_bytes,
        "partitioned": table.partitioned,
        "clustered_fields": [f.name for f in table.clustering_fields] if table.clustering_fields else [],
        "schema": [(f.name, f.field_type) for f in table.schema]
    }

def optimize_query_with_partitioning():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            COUNT(*) as order_count
        FROM `analytics.orders_partitioned`
        WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
        GROUP BY user_id
        HAVING COUNT(*) > 10
        ORDER BY order_count DESC
    """)

def estimate_query_cost(query, terabytes_scanned=1.0):
    job_config = bigquery.QueryJobConfig(dry_run=True)
    query_job = client.query(query, job_config=job_config)
    return {
        "estimated_bytes": query_job.total_bytes_processed,
        "estimated_cost_usd": query_job.total_bytes_processed / (1024**4) * 5.0
    }
```

### Machine Learning with BigQuery ML

```python
def create_ml_model():
    return client.query("""
        CREATE OR REPLACE MODEL `analytics.user_churn_model`
        OPTIONS(
            model_type='logistic_reg',
            input_label_cols=['churned'],
            max_iterations=100
        ) AS
        SELECT 
            user_id,
            CASE WHEN DATEDIFF(MAX(order_date), CURRENT_DATE()) > 90 THEN 1 ELSE 0 END as churned,
            COUNT(*) as total_orders,
            SUM(amount) as total_spent,
            AVG(amount) as avg_order_value,
            COUNT(DISTINCT DATE(order_date)) as active_days
        FROM `analytics.orders`
        GROUP BY user_id
    """)

def predict_churn():
    return fetch_as_dataframe("""
        SELECT 
            user_id,
            predicted_churned as is_likely_to_churn,
            prediction_probability
        FROM ML.PREDICT(
            MODEL `analytics.user_churn_model`,
            (
                SELECT 
                    user_id,
                    COUNT(*) as total_orders,
                    SUM(amount) as total_spent,
                    AVG(amount) as avg_order_value,
                    COUNT(DISTINCT DATE(order_date)) as active_days
                FROM `analytics.orders`
                WHERE order_date >= TIMESTAMP_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
                GROUP BY user_id
            )
        )
        ORDER BY prediction_probability DESC
        LIMIT 100
    """)

def train_recommendation_model():
    return client.query("""
        CREATE OR REPLACE MODEL `analytics.product_recommender`
        OPTIONS(model_type='matrix_factorization') AS
        SELECT 
            user_id,
            product_id,
            quantity as rating
        FROM `analytics.order_items`
        WHERE quantity > 0
    """)

def get_recommendations(user_id, limit=10):
    return fetch_as_dataframe("""
        SELECT 
            product_id,
            predicted_rating
        FROM ML.RECOMMEND(
            MODEL `analytics.product_recommender`,
            (
                SELECT @user_id as user_id, 
                       ARRAY_AGG(DISTINCT product_id) as products
                FROM `analytics.order_items`
                WHERE user_id = @user_id
            )
        )
        ORDER BY predicted_rating DESC
        LIMIT @limit
    """, [
        bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
        bigquery.ScalarQueryParameter("limit", "INT64", limit)
    ])

def evaluate_model():
    return fetch_as_dataframe("""
        SELECT 
            * FROM ML.EVALUATE(
                MODEL `analytics.user_churn_model`,
                (
                    SELECT 
                        user_id,
                        CASE WHEN DATEDIFF(MAX(order_date), CURRENT_DATE()) > 90 THEN 1 ELSE 0 END as churned,
                        COUNT(*) as total_orders,
                        SUM(amount) as total_spent
                    FROM `analytics.orders`
                    GROUP BY user_id
                )
            )
    """)
```

## Best Practices

1. **Use Partitioning**: Partition large tables by date to reduce query costs and improve performance
2. **Cluster Your Data**: Cluster partitioned tables on frequently filtered columns
3. **Avoid SELECT ***: Only select needed columns to reduce data scanned and costs
4. **Use Streaming Inserts Judiciously**: Streaming has higher cost than batch loading
5. **Leverage Cached Results**: Query results are cached for 24 hours; reuse when possible
6. **Estimate Costs**: Use dry_run to estimate query costs before execution
7. **Use Standard SQL**: Legacy SQL is deprecated; use standard SQL with proper parameterization
8. **Optimize Joins**: Filter before joining; use smaller table as driving table
9. **Monitor Slot Usage**: Track slot utilization and adjust capacity as needed
10. **Use BQML for Feature Engineering**: Build ML models directly in BigQuery for efficiency
