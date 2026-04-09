---
name: data-wrangling
description: Data wrangling and transformation
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: data-science
---

## What I do

- Clean and transform messy datasets
- Handle missing and duplicate data
- Merge and join multiple data sources
- Reshape data between formats
- Parse unstructured data
- Feature engineering for ML
- Validate data quality

## When to use me

Use me when:
- Raw data needs cleaning and preparation
- Combining data from multiple sources
- Transforming data structures
- Preparing data for analysis or ML
- Handling data quality issues

## Key Concepts

### Data Wrangling Operations
```python
import pandas as pd

# Loading various formats
df = pd.read_csv("data.csv")
df = pd.read_json("data.json")
df = pd.read_sql(query, connection)

# Basic cleaning
df.drop_duplicates(inplace=True)
df.dropna(thresh=len(df) * 0.5, inplace=True)
df.fillna({"column": "default"}, inplace=True)

# Transformations
df["date"] = pd.to_datetime(df["date"])
df["category"] = df["category"].str.lower().str.strip()
df["price"] = df["price"].str.replace("$", "").astype(float)

# Reshaping
pivot = df.pivot_table(
    values="sales", 
    index="region", 
    columns="quarter", 
    aggfunc="sum"
)

# Melting for tidy format
tidy = pd.melt(df, 
    id_vars=["id"], 
    value_vars=["q1", "q2", "q3", "q4"],
    var_name="quarter", 
    value_name="sales"
)

# Merging
merged = pd.merge(
    customers, orders, 
    on="customer_id", 
    how="left"
)
```

### Handling Missing Data
- **Drop**: Remove rows/columns with missing values
- **Impute**: Fill with mean, median, mode
- **Forward/Backward Fill**: Time series interpolation
- **Predict**: Use ML model to predict missing

### Data Quality Checks
- Schema validation
- Range checks for numeric values
- Uniqueness constraints
- Referential integrity
- Cross-field validation
