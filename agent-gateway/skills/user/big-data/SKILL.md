---
name: big-data
description: Big data processing and systems
license: MIT
compatibility: opencode
metadata:
  audience: data-engineers
  category: data-science
---

## What I do

- Design and implement big data architectures
- Process large-scale datasets with distributed systems
- Optimize data pipelines for throughput
- Work with Hadoop, Spark, and cloud data platforms
- Implement real-time streaming data processing
- Manage data lakes and warehouses at scale

## When to use me

Use me when:
- Working with datasets beyond single-machine capacity
- Building data pipelines at scale
- Processing streaming data in real-time
- Designing data lake architectures
- Optimizing big data workflows
- Managing petabyte-scale storage

## Key Concepts

### Big Data Ecosystem
- **Storage**: HDFS, S3, Azure Blob, GCS
- **Processing**: Spark, Flink, Hadoop MapReduce
- **Query**: Hive, Presto, BigQuery, Snowflake
- **Stream**: Kafka, Pulsar, Kinesis, Dataflow
- **Orchestration**: Airflow, Dagster, Prefect

### Spark DataFrame Example
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg

spark = SparkSession.builder \
    .appName("Analytics") \
    .config("spark.sql.shuffle.partitions", 200) \
    .getOrCreate()

# Read from multiple sources
df = spark.read \
    .parquet("s3://data-lake/raw/events/") \
    .filter(col("date") >= "2024-01-01")

# Transform and aggregate
result = df.groupBy("user_id", "product_category") \
    .agg(
        sum("purchase_amount").alias("total_spent"),
        avg("purchase_amount").alias("avg_purchase"),
        count("*").alias("num_purchases")
    ) \
    .orderBy(col("total_spent").desc())

# Write aggregated results
result.write \
    .mode("overwrite") \
    .partitionBy("product_category") \
    .parquet("s3://data-warehouse/analytics/")
```

### Data Processing Patterns
- **Batch**: Scheduled, periodic processing
- **Streaming**: Continuous, real-time
- **Lambda**: Batch + speed layers
- **Kappa**: Streaming-only architecture

### Cloud Big Data Services
- **AWS**: EMR, Redshift, Athena, Kinesis
- **Azure**: Databricks, Synapse, Data Lake
- **GCP**: Dataproc, BigQuery, Dataflow
