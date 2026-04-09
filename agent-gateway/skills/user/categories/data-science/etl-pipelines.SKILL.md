---
name: etl-pipelines
description: Extract, Transform, Load processes for moving data between systems
category: data-science
skills:
  - data extraction
  - data transformation
  - data loading
  - data quality
  - pipeline orchestration
---

# ETL Pipelines

## What I do

I am ETL (Extract, Transform, Load) pipelines, the backbone of data infrastructure responsible for moving, cleaning, and preparing data from source systems to analytical destinations. Extract involves connecting to various data sources and reading data in its raw form. Transform applies business logic, cleaning rules, and calculations to convert data into the desired format. Load writes the transformed data to the destination system, whether a data warehouse, lake, or operational database. Effective ETL pipelines ensure data is reliable, timely, and accessible for analysis, reporting, and machine learning. Modern ETL has evolved to include streaming data, distributed processing, and sophisticated orchestration, but the core principles of reliable data movement remain essential.

## When to use me

Use ETL pipelines whenever you need to move data from source systems to analytical destinations, including populating data warehouses from operational databases, consolidating data from multiple sources into a single view, preparing data for business intelligence dashboards and reports, feeding data into machine learning pipelines, and implementing data quality checks and monitoring. Use ETL when you need data transformation logic between source and destination, when data must be cleaned or deduplicated, when you need to maintain historical data for trend analysis, or when multiple downstream consumers need the same prepared data. Consider simpler alternatives like EL (Extract-Load) pipelines without transformation when raw data suffices, and consider reverse ETL for syncing analyzed data back to operational systems.

## Core Concepts

**Source Extraction**: Reading data from various source systems including relational databases (via JDBC/ODBC), APIs (REST, GraphQL), file systems (CSV, JSON, Parquet), message queues (Kafka, Kinesis), and cloud storage (S3, GCS, Blob Storage). Incremental extraction strategies avoid full refreshes.

**Data Transformation**: Converting data between formats and applying business logic. Common transformations include type conversion, deduplication, aggregation, denormalization, filtering, joining with reference data, and deriving new calculated fields. Transformations should be idempotent.

**Data Loading**: Writing transformed data to destination systems. Strategies include full refresh (replace entirely), incremental load (append new/changed records), and upsert (insert or update based on keys). Loading often requires managing constraints and indexes.

**Pipeline Orchestration**: Coordinating multiple pipeline stages, handling dependencies, managing failures, and scheduling. Tools like Airflow, Prefect, Dagster, and Azure Data Factory provide workflow management capabilities with monitoring and alerting.

**Data Quality**: Ensuring data meets defined standards through validation checks (not null, unique, in range, referential integrity), anomaly detection, and automated data profiling. Quality issues should be logged, flagged, and trigger alerts.

**Idempotency**: The property that running a pipeline multiple times produces the same result as running it once. Essential for safe retries and backfills. Achieved through proper handling of upserts, idempotent transformations, and immutable data storage.

**Change Data Capture (CDC)**: Detecting and capturing changes in source systems to enable efficient incremental loads. Methods include timestamps, change flags, log-based CDC, and triggers. Reduces processing time and avoids full data scans.

## Code Examples

```python
# Extract phase with various sources
import pandas as pd
import sqlalchemy
import requests
import boto3
from datetime import datetime, timedelta

# From SQL database
def extract_from_sql(query, connection_string):
    engine = sqlalchemy.create_engine(connection_string)
    return pd.read_sql(query, engine)

# Incremental extraction based on timestamp
def extract_incremental(table_name, last_extracted, connection_string):
    query = f"""
        SELECT * FROM {table_name}
        WHERE updated_at > '{last_extracted}'
        ORDER BY updated_at
    """
    return extract_from_sql(query, connection_string)

# From REST API with pagination
def extract_from_api(base_url, params=None, headers=None):
    all_data = []
    page = 1
    while True:
        response = requests.get(
            base_url,
            params={**(params or {}), 'page': page},
            headers=headers
        )
        data = response.json()
        if not data.get('data'):
            break
        all_data.extend(data['data'])
        page += 1
        if page > data.get('total_pages', 1):
            break
    return pd.DataFrame(all_data)

# From cloud storage (S3)
def extract_from_s3(bucket, prefix, file_format='parquet'):
    s3 = boto3.client('s3')
    objects = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    
    dfs = []
    for obj in objects.get('Contents', []):
        key = obj['Key']
        if key.endswith('.parquet'):
            df = pd.read_parquet(f's3://{bucket}/{key}')
            df['_source_file'] = key
            dfs.append(df)
    return pd.concat(dfs) if dfs else pd.DataFrame()
```

```python
# Transform phase with data cleaning and validation
import pandas as pd
import numpy as np
from datetime import datetime
import re

def clean_and_transform(df):
    # Type conversions
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df['category'] = df['category'].astype('category')
    
    # Handling missing values
    df['amount'] = df['amount'].fillna(0)
    df['category'] = df['category'].fillna('Unknown')
    
    # Deduplication
    df = df.drop_duplicates(subset=['id'], keep='last')
    
    # Standardization
    df['category'] = df['category'].str.lower().str.strip()
    df['name'] = df['name'].str.title()
    
    # Derived columns
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    
    # Complex business logic
    df['segment'] = df.apply(
        lambda row: 'Premium' if row['amount'] > 1000 
        else ('Standard' if row['amount'] > 100 else 'Basic'),
        axis=1
    )
    
    # String parsing
    df['email_domain'] = df['email'].str.extract(r'@(.+)$')
    
    return df

# Data quality checks
def validate_data(df):
    issues = []
    
    # Check for required columns
    required = ['id', 'date', 'amount', 'category']
    missing_cols = [col for col in required if col not in df.columns]
    if missing_cols:
        issues.append(f"Missing columns: {missing_cols}")
    
    # Check for nulls in key columns
    null_counts = df[required].isnull().sum()
    if null_counts.any():
        issues.append(f"Null values found: {null_counts[null_counts > 0].to_dict()}")
    
    # Check for negative amounts where not expected
    neg_count = (df['amount'] < 0).sum()
    if neg_count > 0:
        issues.append(f"Negative amounts: {neg_count} records")
    
    # Check for future dates
    future_dates = (df['date'] > datetime.now()).sum()
    if future_dates > 0:
        issues.append(f"Future dates: {future_dates} records")
    
    return issues
```

```python
# Load phase with various destinations
import pandas as pd
import sqlalchemy
from sqlalchemy import create_engine
import boto3
import pyarrow as pa
import pyarrow.parquet as pq

def load_to_database(df, table_name, connection_string, if_exists='append'):
    engine = create_engine(connection_string)
    
    # Bulk insert with proper types
    df.to_sql(
        name=table_name,
        con=engine,
        if_exists=if_exists,
        index=False,
        method='multi',
        chunksize=10000
    )
    
    return f"Loaded {len(df)} records to {table_name}"

# Upsert pattern for updating existing records
def upsert_to_database(df, table_name, connection_string, key_columns):
    engine = create_engine(connection_string)
    
    # Create temp table
    temp_table = f"temp_{table_name}"
    df.to_sql(temp_table, engine, if_exists='replace', index=False)
    
    # Perform upsert
    upsert_sql = f"""
        INSERT INTO {table_name} 
        SELECT * FROM {temp_table}
        ON CONFLICT ({','.join(key_columns)}) 
        DO UPDATE SET
        {','.join([f"{col} = EXCLUDED.{col}" for col in df.columns if col not in key_columns])}
    """
    
    with engine.connect() as conn:
        conn.execute(upsert_sql)
        conn.execute(f"DROP TABLE IF EXISTS {temp_table}")

# Load to cloud storage (Parquet with partitioning)
def load_to_s3(df, bucket, prefix, partition_cols=['year', 'month']):
    # Convert to Arrow for efficient writing
    table = pa.Table.from_pandas(df)
    
    # Write partitioned Parquet
    pq.write_to_dataset(
        table,
        root_path=f's3://{bucket}/{prefix}',
        partition_cols=partition_cols,
        existing_data_behavior='overwrite'
    )
    
    return f"Loaded {len(df)} records to s3://{bucket}/{prefix}"

# Incremental load with watermark
def incremental_load(source_query, target_table, connection_string, watermark_col, key_cols):
    engine = create_engine(connection_string)
    
    # Get last watermark
    with engine.connect() as conn:
        result = conn.execute(f"SELECT MAX({watermark_col}) FROM {target_table}")
        last_watermark = result.scalar()
    
    if last_watermark:
        # Extract incremental data
        df = pd.read_sql(f"{source_query} WHERE {watermark_col} > '{last_watermark}'", engine)
        # Load with upsert
        upsert_to_database(df, target_table, connection_string, key_cols)
    else:
        # Full load
        df = pd.read_sql(source_query, engine)
        df.to_sql(target_table, engine, if_exists='replace', index=False)
```

## Best Practices

Design pipelines with idempotency in mind so that reruns are safe and produce consistent results regardless of when they execute or how many times they run. Handle failures gracefully with proper error handling, logging, and alerting so issues are detected quickly. Use incremental processing whenever possible rather than full refreshes to reduce processing time and resource consumption. Separate concerns by extracting raw data first, then applying transformations in subsequent stages, which enables debugging and backfilling. Implement data quality checks at multiple stages: after extraction (to catch source issues), after transformation (to catch logic errors), and after loading (to catch destination issues). Use appropriate data types throughout to avoid type coercion issues and memory bloat. Partition data in storage to enable efficient filtering and parallel processing. Implement monitoring for data freshness, volume changes, and quality metrics. Use version control for pipeline code and configuration. Consider the balance between real-time and batch processing based on downstream requirements. Document data lineage and transformations for compliance and debugging. Test pipelines thoroughly with production-like data volumes before deployment, and implement rollback procedures for failed deployments.
