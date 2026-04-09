---
name: etl-pipelines
description: Extract, Transform, Load (ETL) pipeline design and implementation for moving data from source systems, transforming it to meet requirements, and loading it into target systems for analysis.
category: data-science
keywords:
  - etl-pipelines
  - data pipelines
  - data engineering
  - data transformation
  - data integration
  - workflow orchestration
  - apache airflow
  - dag
difficulty: intermediate
related_skills:
  - pandas
  - big-data
  - data-visualization
---

# ETL Pipelines

## What I do

I provide frameworks and patterns for building robust data pipelines that extract data from various sources, transform it to meet business requirements, and load it into target systems. I ensure data quality, enable scheduled execution, and provide monitoring and error handling capabilities for production data workflows.

## When to use me

- Moving data from operational databases to data warehouses
- Consolidating data from multiple sources
- Creating data lakes from raw data
- Building feature stores for machine learning
- Scheduling regular data refreshes
- Implementing data quality checks
- Building real-time streaming pipelines
- Creating data aggregation workflows

## Core Concepts

### Pipeline Components
- **Extract**: Pull data from source systems (databases, APIs, files)
- **Transform**: Clean, validate, enrich, aggregate data
- **Load**: Write data to destination systems
- **Orchestrate**: Manage dependencies and scheduling

### Data Quality
- **Schema validation**: Verify structure matches expectations
- **Data type checks**: Ensure correct types
- **Range checks**: Validate value ranges
- **Uniqueness checks**: Detect duplicate records
- **Referential integrity**: Verify relationships

### Orchestration
- **DAGs**: Directed Acyclic Graphs for dependency management
- **Task dependencies**: Define execution order
- **Failure handling**: Retries, alerts, dead letter queues
- **Backfilling**: Re-processing historical data

### Tools
- **Apache Airflow**: Workflow orchestration
- **Prefect/Dagster**: Modern orchestration frameworks
- **Luigi**: Spotify's pipeline framework
- **dbt**: Data transformation tool

## Code Examples (Python)

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Basic ETL implementation
class BasicETL:
    def __init__(self, source_conn, target_conn):
        self.source = source_conn
        self.target = target_conn
        self.logger = logging.getLogger(__name__)
    
    def extract(self, query, params=None):
        """Extract data from source."""
        self.logger.info(f"Extracting data with query: {query[:100]}...")
        df = pd.read_sql(query, self.source, params=params)
        self.logger.info(f"Extracted {len(df)} rows")
        return df
    
    def transform(self, df):
        """Transform data."""
        self.logger.info(f"Transforming {len(df)} rows...")
        
        # Clean column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        
        # Handle missing values
        df = df.fillna({
            'numeric_col': 0,
            'string_col': 'unknown',
            'date_col': pd.NaT
        })
        
        # Type conversion
        df['date_col'] = pd.to_datetime(df['date_col'], errors='coerce')
        df['numeric_col'] = pd.to_numeric(df['numeric_col'], errors='coerce')
        
        # Remove duplicates
        df = df.drop_duplicates(subset=['id'])
        
        # Derived columns
        df['processed_at'] = datetime.now()
        
        # Filter invalid records
        df = df[df['value'] >= 0]
        
        return df
    
    def load(self, df, table_name, if_exists='append'):
        """Load data to target."""
        self.logger.info(f"Loading {len(df)} rows to {table_name}...")
        df.to_sql(table_name, self.target, if_exists=if_exists, index=False)
        self.logger.info(f"Successfully loaded {len(df)} rows")
    
    def run(self, extract_query, target_table, transform_func=None):
        """Execute full ETL pipeline."""
        try:
            df = self.extract(extract_query)
            df = self.transform(df)
            if transform_func:
                df = transform_func(df)
            self.load(df, target_table)
            return True
        except Exception as e:
            self.logger.error(f"ETL failed: {e}")
            raise

# Data validation
class DataValidator:
    @staticmethod
    def validate_schema(df, expected_schema):
        """Validate DataFrame schema."""
        for col, dtype in expected_schema.items():
            if col not in df.columns:
                raise ValueError(f"Missing column: {col}")
            if df[col].dtype != dtype:
                raise TypeError(f"Column {col} has wrong type: {df[col].dtype} vs {dtype}")
    
    @staticmethod
    def validate_range(df, col, min_val=None, max_val=None):
        """Validate values in range."""
        if min_val is not None and (df[col] < min_val).any():
            invalid = (df[col] < min_val).sum()
            raise ValueError(f"{col} has {invalid} values below {min_val}")
        if max_val is not None and (df[col] > max_val).any():
            invalid = (df[col] > max_val).sum()
            raise ValueError(f"{col} has {invalid} values above {max_val}")
    
    @staticmethod
    def validate_uniqueness(df, col):
        """Check for duplicates."""
        duplicates = df[col].duplicated().sum()
        if duplicates > 0:
            raise ValueError(f"Column {col} has {duplicates} duplicates")
    
    @staticmethod
    def validate_completeness(df, required_cols, threshold=0.99):
        """Check completeness of required columns."""
        for col in required_cols:
            completeness = df[col].notna().mean()
            if completeness < threshold:
                raise ValueError(f"Column {col} has only {completeness:.2%} completeness")

# Incremental ETL
class IncrementalETL:
    def __init__(self, source, target):
        self.source = source
        self.target = target
    
    def get_last_processed(self, table_name):
        """Get timestamp of last successful load."""
        try:
            query = f"SELECT MAX(processed_at) as last_run FROM etl_log WHERE table_name = '{table_name}'"
            result = pd.read_sql(query, self.target)
            return result['last_run'].iloc[0] if len(result) > 0 else None
        except:
            return None
    
    def log_etl(self, table_name, rows_processed, status):
        """Log ETL execution."""
        log_df = pd.DataFrame([{
            'table_name': table_name,
            'rows_processed': rows_processed,
            'status': status,
            'run_time': datetime.now()
        }])
        log_df.to_sql('etl_log', self.target, if_exists='append', index=False)
    
    def run_incremental(self, table_name, watermark_col, extract_query_template):
        """Run incremental ETL based on watermark."""
        last_run = self.get_last_processed(table_name)
        
        if last_run:
            query = extract_query_template.format(watermark=f"WHERE {watermark_col} > '{last_run}'")
        else:
            query = extract_query_template.format(watermark="")
        
        df = pd.read_sql(query, self.source)
        
        if len(df) == 0:
            self.logger.info("No new data to process")
            return
        
        # Transform
        df = self.transform(df)
        
        # Load
        self.load(df, table_name, if_exists='append')
        
        # Log success
        self.log_etl(table_name, len(df), 'success')
        
        return df

# Airflow DAG example
"""
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.postgres_operator import PostgresOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data_team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'daily_etl_pipeline',
    default_args=default_args,
    description='Daily ETL pipeline for data warehouse',
    schedule_interval='0 2 * * *',  # Run at 2 AM daily
    catchup=False,
)

def extract_sales(**context):
    from sqlalchemy import create_engine
    engine = create_engine(context['connection']['sales_db'])
    df = pd.read_sql("SELECT * FROM sales", engine)
    df.to_csv('/tmp/sales_raw.csv', index=False)
    return '/tmp/sales_raw.csv'

def transform_sales(**context):
    df = pd.read_csv(context['task_instance'].xcom_pull(task_ids='extract_sales'))
    df['date'] = pd.to_datetime(df['date'])
    df['revenue'] = df['quantity'] * df['price']
    df.to_parquet('/tmp/sales_transformed.parquet', index=False)
    return '/tmp/sales_transformed.parquet'

def load_warehouse(**context):
    df = pd.read_parquet(context['task_instance'].xcom_pull(task_ids='transform_sales'))
    engine = create_engine(context['connection']['warehouse'])
    df.to_sql('daily_sales', engine, if_exists='append', index=False)

extract_task = PythonOperator(
    task_id='extract_sales',
    python_callable=extract_sales,
    provide_context=True,
    dag=dag,
)

transform_task = PythonOperator(
    task_id='transform_sales',
    python_callable=transform_sales,
    provide_context=True,
    dag=dag,
)

load_task = PythonOperator(
    task_id='load_warehouse',
    python_callable=load_warehouse,
    provide_context=True,
    dag=dag,
)

extract_task >> transform_task >> load_task
"""

# Streaming ETL with Kafka
"""
from kafka import KafkaConsumer, KafkaProducer
import json

class StreamingETL:
    def __init__(self, kafka_brokers, input_topic, output_topic):
        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=kafka_brokers,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        self.producer = KafkaProducer(
            bootstrap_servers=kafka_brokers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
    
    def transform_record(self, record):
        """Transform single record."""
        return {
            'id': record['id'],
            'timestamp': datetime.now().isoformat(),
            'value_normalized': (record['value'] - record['mean']) / record['std'],
            'category': record['category'].upper()
        }
    
    def run(self):
        """Process streaming records."""
        for message in self.consumer:
            record = message.value
            transformed = self.transform_record(record)
            self.producer.send(output_topic, value=transformed)
"""
```

## Best Practices

1. **Design for failure**: Assume any component can fail; implement retries, logging, and alerts.

2. **Incremental over full reload**: Process only new/changed data when possible for efficiency.

3. **Idempotent operations**: Running the pipeline multiple times should produce the same result.

4. **Separate concerns**: Keep extraction, transformation, and loading logic independent.

5. **Metadata management**: Track data lineage, schema versions, and processing timestamps.

6. **Monitor data quality**: Implement validation at each stage with alerting.

7. **Handle schema evolution**: Plan for schema changes without breaking pipelines.

8. **Document data contracts**: Define clear interfaces between pipeline stages.

## Common Patterns

### Pattern 1: Resilient Batch ETL
```python
class ResilientETL:
    def __init__(self, config):
        self.config = config
        self.max_retries = 3
        self.backoff_factor = 2
    
    def run_with_retry(self, task_name, task_func, **kwargs):
        """Run task with exponential backoff retry."""
        for attempt in range(self.max_retries):
            try:
                return task_func(**kwargs)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    self.send_alert(task_name, e)
                    raise
                sleep_time = self.backoff_factor ** attempt
                self.logger.warning(f"Task {task_name} failed, retrying in {sleep_time}s")
                sleep(sleep_time)
    
    def checkpoint(self, stage, state):
        """Save pipeline state for recovery."""
        checkpoint_df = pd.DataFrame([{
            'stage': stage,
            'state': json.dumps(state),
            'timestamp': datetime.now()
        }])
        checkpoint_df.to_sql('pipeline_checkpoints', 
                           self.checkpoint_db, 
                           if_exists='append')
    
    def resume_from_checkpoint(self, stage):
        """Resume pipeline from last checkpoint."""
        query = f"SELECT * FROM pipeline_checkpoints WHERE stage = '{stage}' ORDER BY timestamp DESC LIMIT 1"
        return pd.read_sql(query, self.checkpoint_db).iloc[0]['state']
```

### Pattern 2: Data Quality Framework
```python
class DataQualityFramework:
    def __init__(self):
        self.checks = []
    
    def add_check(self, name, check_func, severity='error'):
        """Add quality check."""
        self.checks.append({'name': name, 'func': check_func, 'severity': severity})
    
    def run_checks(self, df, context):
        """Execute all quality checks."""
        results = []
        for check in self.checks:
            try:
                passed = check['func'](df, context)
                results.append({
                    'check': check['name'],
                    'passed': passed,
                    'severity': check['severity']
                })
            except Exception as e:
                results.append({
                    'check': check['name'],
                    'passed': False,
                    'error': str(e),
                    'severity': check['severity']
                })
        
        # Raise on error severity failures
        errors = [r for r in results if not r['passed'] and r['severity'] == 'error']
        if errors:
            raise DataQualityError(errors)
        
        return results
    
    @staticmethod
    def standard_checks():
        """Create standard quality checks."""
        framework = DataQualityFramework()
        
        framework.add_check('null_check', 
            lambda df, ctx: df.isnull().sum().sum() == 0)
        
        framework.add_check('schema_check',
            lambda df, ctx: set(df.columns) == set(ctx['expected_columns']))
        
        framework.add_check('range_check',
            lambda df, ctx: (df[ctx['numeric_cols']] >= 0).all().all())
        
        framework.add_check('duplicate_check',
            lambda df, ctx: df.duplicated().sum() == 0)
        
        return framework
```

### Pattern 3: Feature Engineering Pipeline
```python
class FeatureEngineeringPipeline:
    def __init__(self, feature_store):
        self.feature_store = feature_store
        self.transformations = []
    
    def add_feature(self, name, source_col, transform_func):
        """Add feature transformation."""
        self.transformations.append({
            'name': name,
            'source': source_col,
            'func': transform_func
        })
    
    def build_features(self, df, timestamp_col='timestamp'):
        """Build all features for a dataset."""
        features_df = df.copy()
        
        for feat in self.transformations:
            features_df[feat['name']] = feat['func'](features_df[feat['source']])
        
        # Add temporal features
        features_df['hour'] = features_df[timestamp_col].dt.hour
        features_df['day_of_week'] = features_df[timestamp_col].dt.dayofweek
        features_df['is_weekend'] = features_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Add rolling features
        features_df = self.add_rolling_features(features_df, 'value', '1h', '24h')
        
        return features_df
    
    def add_rolling_features(self, df, col, *windows):
        """Add rolling window features."""
        for window in windows:
            df[f'{col}_rolling_{window}_mean'] = df.groupby('id')[col].transform(
                lambda x: x.rolling(window, min_periods=1).mean()
            )
        return df
    
    def save_to_store(self, entity_id, features_df, timestamp):
        """Save features to feature store."""
        self.feature_store.save(
            entity_id=entity_id,
            features=features_df.to_dict(orient='records'),
            timestamp=timestamp
        )
```
