---
name: etl-pipelines
description: ETL pipeline design and implementation
license: MIT
compatibility: opencode
metadata:
  audience: data-engineers
  category: data-science
---

## What I do

- Build scalable ETL pipelines
- Design data pipeline architectures
- Implement real-time and batch pipelines
- Manage pipeline orchestration
- Handle error handling and retries
- Monitor pipeline health
- Optimize pipeline performance

## When to use me

Use me when:
- Building production data pipelines
- Implementing real-time data processing
- Creating data orchestration workflows
- Managing complex data dependencies
- Monitoring data pipeline health

## Key Concepts

### Pipeline Orchestration
```yaml
# Apache Airflow DAG
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    "owner": "data_team",
    "depends_on_past": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=5)
}

with DAG(
    "etl_pipeline",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@daily",
    default_args=default_args
) as dag:
    
    extract = PythonOperator(
        task_id="extract",
        python_callable=extract_data
    )
    
    transform = PythonOperator(
        task_id="transform",
        python_callable=transform_data,
        dependencies=[extract]
    )
    
    load = PythonOperator(
        task_id="load",
        python_callable=load_data,
        dependencies=[transform]
    )
```

### Pipeline Patterns
- **Incremental Load**: Process only new data
- **Change Data Capture (CDC)**: Track changes
- **Backfill**: Reprocess historical data
- **Idempotency**: Safe to re-run

### Streaming Pipeline
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import window, col

spark = SparkSession.builder \
    .appName("StreamingETL") \
    .config("spark.sql.streaming.checkpointLocation", "/checkpoints") \
    .getOrCreate()

# Read streaming data
stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "events") \
    .load()

# Transform streaming
enriched = stream \
    .select(
        col("value").cast("string").alias("json")
    ) \
    .withColumn("data", F.from_json("json", schema)) \
    .select("data.*")

# Write streaming
query = enriched \
    .writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints") \
    .trigger(processingTime="1 minute") \
    .start("/data/lakehouse/tables/events")
```

### Tools
- **Batch**: Airflow, Dagster, Prefect
- **Stream**: Spark Streaming, Flink, Kafka Streams
- **Cloud**: Dataflow, Glue, Synapse, Fabric
