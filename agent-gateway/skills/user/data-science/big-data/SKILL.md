---
name: big-data
description: Techniques and frameworks for processing large-scale datasets that exceed the capacity of traditional database systems, including distributed computing, parallel processing, and scalable data pipelines.
category: data-science
keywords:
  - big-data
  - distributed computing
  - apache spark
  - hadoop
  - dask
  - data pipelines
  - scalability
  - parallel processing
  - petabyte-scale
difficulty: advanced
related_skills:
  - pandas
  - etl-pipelines
  - data-visualization
---

# Big Data

## What I do

I provide capabilities for processing and analyzing datasets that are too large for traditional tools. I enable distributed computing across clusters, parallel processing of massive datasets, and scalable data pipelines. I help you work with data ranging from gigabytes to petabytes using frameworks that can scale from a single machine to thousands of nodes.

## When to use me

- Processing datasets larger than available RAM (typically >10GB)
- Building ETL pipelines that run on scheduled intervals
- Working with distributed file systems (HDFS, S3, GCS)
- Running machine learning at scale
- Processing streaming data in real-time
- Aggregating and analyzing log files
- Building data lakes and warehouses
- Parallelizing computations across multiple cores or machines

## Core Concepts

### Distributed Computing
- **Data Partitioning**: Splitting data across multiple nodes
- **Parallel Execution**: Processing partitions simultaneously
- **Fault Tolerance**: Recovering from node failures
- **Data Locality**: Processing where data resides to minimize transfer

### Big Data Frameworks
- **Apache Spark**: In-memory distributed computing engine
- **Dask**: Parallel computing library for Python
- **Apache Hadoop**: HDFS + MapReduce framework
- **Apache Flink**: Stream processing framework

### Storage Systems
- **HDFS**: Hadoop Distributed File System
- **Object Storage**: S3, GCS, Azure Blob
- **Columnar Formats**: Parquet, ORC (optimized for analytics)

### Processing Paradigms
- **Batch Processing**: Process complete datasets periodically
- **Stream Processing**: Process data in real-time as it arrives
- **Lambda Architecture**: Combine batch and stream processing
- **Kappa Architecture**: Stream-only approach

## Code Examples (Python)

```python
# Using Apache Spark
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg, max, min, count
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.regression import LinearRegression

# Initialize Spark
spark = SparkSession.builder \
    .appName("BigDataProcessing") \
    .config("spark.driver.memory", "16g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# Create DataFrame from various sources
# From CSV
df = spark.read.csv("s3://bucket/path/*.csv", 
                    header=True, 
                    inferSchema=True)

# From Parquet
df = spark.read.parquet("s3://bucket/data/")

# From HDFS
df = spark.read.format("orc").load("hdfs://namenode:9000/data/")

# From RDBMS with partitioning
df = spark.read \
    .format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/db") \
    .option("dbtable", "large_table") \
    .option("partitionColumn", "id") \
    .option("lowerBound", "1") \
    .option("upperBound", "10000000") \
    .option("numPartitions", "100") \
    .load()

# DataFrame operations (lazy evaluation)
result = df.filter(col("age") > 25) \
    .groupBy("department") \
    .agg(
        avg("salary").alias("avg_salary"),
        count("*").alias("count"),
        max("salary").alias("max_salary")
    ) \
    .orderBy(col("avg_salary").desc())

# Cache intermediate results for reuse
df_filtered = df.filter(col("status") == "active").cache()

# Write results
result.write.mode("overwrite").parquet("s3://bucket/output/")
result.write.mode("append").partitionBy("year", "month").parquet("s3://bucket/output/")

# Machine Learning with Spark ML
feature_cols = ["feature1", "feature2", "feature3", "feature4"]
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")
lr = LinearRegression(featuresCol="scaled_features", labelCol="target")

pipeline = Pipeline(stages=[assembler, scaler, lr])
model = pipeline.fit(train_df)
predictions = model.transform(test_df)

# Using Dask for parallel processing
import dask.dataframe as dd
from dask.distributed import Client

# Start distributed client
client = Client(n_workers=8, threads_per_worker=2, memory_limit="16GB")

# Create Dask DataFrame from pandas
ddf = dd.from_pandas(pandas_df, npartitions=100)

# Read directly from Parquet
ddf = dd.read_parquet("s3://bucket/data/*.parquet", 
                       columns=["col1", "col2", "col3"])

# Operations are lazy
result = ddf.groupby("category").agg({"value": ["mean", "sum", "count"]})

# Compute to get result
pandas_result = result.compute()

# Read CSV with Dask
ddf = dd.read_csv("s3://bucket/data/*.csv", 
                  dtype={"col1": "float64", "col2": "object"},
                  parse_dates=["date_col"])

# Parallel apply
ddf["new_col"] = ddf["col1"].apply(lambda x: complex_function(x), meta=(col1, "float64"))

# Rolling operations
rolling_mean = ddf["value"].rolling(window=24).mean().compute()

# Read from database with partitioning
from dask.db import read_sql_query
ddf = read_sql_query("SELECT * FROM large_table", 
                      index_col="id",
                      divisions=[0, 1000000, 2000000, 3000000],
                      npartitions=4)

# Map partitions for custom functions
def process_partition(df):
    # Complex processing on partition
    return df.describe()

results = ddf.map_partitions(process_partition)

# Using Vaex for out-of-core DataFrames
import vaex

# Memory-mapped DataFrame (doesn't load into RAM)
df = vaex.open("s3://bucket/data/*.parquet")

# Operations work on disk without loading
df_summary = df.groupby("category", agg=["mean", "count"])

# Expression columns (computed on-demand)
df["log_value"] = np.log(df["value"])

# Sample large datasets
df_sample = df.sample(n=100000)

# Filter and export
df_filtered = df[(df["date"] > "2023-01-01") & (df["value"] > 0)]
df_filtered.export_parquet("output.parquet")

# Efficient string operations with Polars
import polars as pl

# Polars for faster pandas-like operations
df = pl.read_parquet("large_file.parquet")

# Parallelized operations
result = df.group_by("category").agg([
    pl.col("value").mean().alias("mean"),
    pl.col("value").sum().alias("sum")
])

# Lazy evaluation
lazy_df = pl.scan_parquet("*.parquet")
result = lazy_df.filter(pl.col("value") > 0) \
    .group_by("category") \
    .agg(pl.col("value").mean()) \
    .collect()
```

## Best Practices

1. **Choose the right tool**: Use Dask for scaling Python workflows, Spark for enterprise scale, Polars for single-machine speed.

2. **Partition data strategically**: Partition by columns used for filtering to enable partition pruning.

3. **Minimize shuffles**: Group and reduce operations before wide transformations.

4. **Use appropriate file formats**: Parquet for analytics (columnar, compressed), ORC for Hive.

5. **Cache frequently accessed data**: Use `.cache()` or `.persist()` for reused DataFrames.

6. **Tune parallelism**: Adjust partition counts based on cluster resources and data size.

7. **Monitor and profile**: Use Spark UI, Dask dashboard to identify bottlenecks.

8. **Handle skewed data**: Repartition or use salting for highly skewed keys.

## Common Patterns

### Pattern 1: ETL Pipeline with Spark
```python
def etl_pipeline(spark, input_path, output_path):
    # Read raw data
    raw_df = spark.read.json(input_path)
    
    # Apply schema
    schema = StructType([
        StructField("id", StringType(), True),
        StructField("timestamp", TimestampType(), True),
        StructField("value", DoubleType(), True),
        StructField("status", StringType(), True)
    ])
    df = spark.createDataFrame(raw_df.rdd, schema)
    
    # Clean and transform
    df_clean = df \
        .filter(col("value").isNotNull()) \
        .withColumn("date", col("timestamp").cast("date")) \
        .withColumn("hour", hour(col("timestamp"))) \
        .withColumn("value_normalized", 
                   (col("value") - col("value").mean()) / col("value").std())
    
    # Aggregate by time windows
    df_agg = df_clean.groupBy(
        window(col("timestamp"), "1 hour"),
        col("status")
    ).agg(
        count("*").alias("count"),
        avg("value").alias("avg_value"),
        min("value").alias("min_value"),
        max("value").alias("max_value")
    )
    
    # Write with partitioning
    df_agg.write \
        .mode("append") \
        .partitionBy("date") \
        .parquet(output_path)
    
    return df_agg
```

### Pattern 2: Incremental Processing with Dask
```python
def incremental_process(base_path, new_data_path, checkpoint_path):
    import os
    import dask.dataframe as dd
    from dask.delayed import delayed
    
    # Check for checkpoint
    if os.path.exists(checkpoint_path):
        base_df = dd.read_parquet(checkpoint_path)
    else:
        base_df = dd.from_pandas(pd.DataFrame(), npartitions=1)
    
    # Read new data
    new_df = dd.read_parquet(new_data_path)
    
    # Append new data
    combined_df = dd.concat([base_df, new_df], ignore_index=True)
    
    # Process
    processed_df = combined_df.groupby("category").agg({
        "value": "sum",
        "timestamp": "max"
    })
    
    # Write checkpoint
    processed_df.to_parquet(checkpoint_path, overwrite=True)
    
    return processed_df
```

### Pattern 3: Distributed ML with Spark
```python
def distributed_ml_pipeline(spark, train_path, test_path):
    from pyspark.ml.feature import StringIndexer, VectorAssembler
    from pyspark.ml.classification import RandomForestClassifier
    from pyspark.ml import Pipeline
    
    # Read data
    train_df = spark.read.parquet(train_path)
    test_df = spark.read.parquet(test_path)
    
    # Feature engineering pipeline
    categorical_cols = ["cat1", "cat2", "cat3"]
    numerical_cols = ["num1", "num2", "num3", "num4"]
    
    # Index categorical features
    indexers = [StringIndexer(inputCol=c, outputCol=c+"_index", handleInvalid="keep")
                for c in categorical_cols]
    
    # Assemble features
    assembler = VectorAssembler(
        inputCols=[c+"_index" for c in categorical_cols] + numerical_cols,
        outputCol="features"
    )
    
    # Model
    rf = RandomForestClassifier(
        featuresCol="features",
        labelCol="label",
        numTrees=100,
        maxDepth=10,
        numPartitions=100
    )
    
    # Build pipeline
    pipeline = Pipeline(stages=indexers + [assembler, rf])
    
    # Cross-validation
    from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
    param_grid = ParamGridBuilder() \
        .addGrid(rf.numTrees, [50, 100, 200]) \
        .addGrid(rf.maxDepth, [5, 10, 15]) \
        .build()
    
    cv = CrossValidator(
        estimator=pipeline,
        estimatorParamMaps=param_grid,
        evaluator=BinaryClassificationEvaluator(),
        numFolds=3
    )
    
    # Train
    cv_model = cv.fit(train_df)
    
    # Predict
    predictions = cv_model.transform(test_df)
    
    # Evaluate
    evaluator = BinaryClassificationEvaluator(labelCol="label", metricName="areaUnderROC")
    auc = evaluator.evaluate(predictions)
    
    return cv_model, predictions, auc
```
