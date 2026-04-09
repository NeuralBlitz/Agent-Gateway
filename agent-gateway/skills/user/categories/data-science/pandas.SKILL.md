---
name: pandas
description: Data manipulation and analysis library for Python with DataFrame structures
category: data-science
skills:
  - data manipulation
  - data cleaning
  - time series analysis
  - data wrangling
  - exploratory data analysis
---

# Pandas

## What I do

I am pandas, Python's premier data manipulation and analysis library. I provide flexible, intuitive data structures designed to make working with structured data seamless and efficient. At my core are two primary data structures: Series (one-dimensional labeled arrays) and DataFrame (two-dimensional labeled data tables with columns of potentially different types). I enable you to load, filter, transform, aggregate, and analyze data with minimal code while maintaining performance through integration with NumPy and other scientific Python libraries. I support reading from and writing to numerous formats including CSV, Excel, JSON, SQL databases, and more, making me the Swiss Army knife of data science workflows.

## When to use me

Use pandas when you need to clean, transform, analyze, or visualize structured data. Common scenarios include exploratory data analysis where you need to understand your data's structure and distributions, data preprocessing for machine learning pipelines where you must handle missing values, encode categorical variables, and scale features, business intelligence tasks involving generating reports and dashboards from relational data, time series analysis including financial data, sensor readings, or any temporal data requiring resampling and rolling calculations, and data wrangling tasks where data arrives in messy formats and needs reshaping or merging from multiple sources. You should not use pandas for numerical computing when performance is critical (use NumPy instead), deep learning model training (use PyTorch or TensorFlow), or streaming data processing at scale (consider Spark or Dask).

## Core Concepts

**DataFrame**: Two-dimensional labeled data structure with columns of potentially different types, similar to a spreadsheet or SQL table. DataFrames are the primary data structure you will work with in pandas, providing intuitive methods for selection, filtering, grouping, and aggregation operations.

**Series**: One-dimensional labeled array capable of holding any data type with an associated array of data labels called an index. Series can be thought of as a single column from a DataFrame and share many of the same operations.

**Index**: Immutable array providing axis labels for pandas objects. The index enables fast label-based lookups and joins between DataFrames. pandas supports multiple index types including MultiIndex for hierarchical labeling.

**Missing Data Handling**: pandas uses NaN (Not a Number) to represent missing values consistently across all data types. I provide methods like `dropna()`, `fillna()`, and `isna()` for detecting, removing, and imputing missing values.

**GroupBy Operations**: Split-apply-combine pattern implementation enabling you to split data into groups based on one or more columns, apply functions to each group, and combine results. Supports aggregation, transformation, and filtration operations.

**Data Types (dtypes)**: pandas supports nullable integer types, nullable boolean, categorical data types for memory optimization with repeated values, and explicit handling of datetime types with nanosecond precision.

**Boolean Indexing**: Powerful filtering capability using boolean arrays or conditions to select subsets of data. Enables complex filtering through logical operators (&, |, ~) and the `query()` method for readable expressions.

**Time Series Functionality**: Comprehensive support for datetime operations including resampling, rolling windows, time zone handling, period arithmetic, and anchored date offsets for business day calculations.

## Code Examples

```python
import pandas as pd
import numpy as np

# Creating DataFrames from various sources
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 40],
    'department': ['Engineering', 'Sales', 'Engineering', 'HR'],
    'salary': [75000, 60000, 85000, 55000],
    'start_date': pd.to_datetime(['2020-01-15', '2019-06-01', '2021-03-20', '2018-11-10'])
})

# Filtering with boolean indexing
engineers = df[df['department'] == 'Engineering']
seniors = df[(df['age'] >= 30) & (df['salary'] > 70000)]

# Using groupby for aggregation
dept_stats = df.groupby('department').agg({
    'salary': ['mean', 'max', 'min'],
    'age': 'mean'
}).round(2)

# Time series operations
df.set_index('start_date', inplace=True)
monthly_avg = df['salary'].resample('ME').mean()
rolling_avg = df['salary'].rolling(window='30D').mean()

# Handling missing data
df_with_nans = df.copy()
df_with_nans.loc[0, 'salary'] = np.nan
filled = df_with_nans['salary'].fillna(df_with_nans['salary'].mean())
dropped = df_with_nans.dropna(subset=['salary'])

# Merging DataFrames
products = pd.DataFrame({
    'product_id': [1, 2, 3],
    'product_name': ['Widget', 'Gadget', 'Tool'],
    'price': [19.99, 29.99, 9.99]
})
sales = pd.DataFrame({
    'product_id': [1, 2, 1, 3],
    'quantity': [10, 5, 8, 15],
    'date': pd.to_datetime(['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18'])
})
merged = sales.merge(products, on='product_id')
merged['total'] = merged['quantity'] * merged['price']
```

```python
import pandas as pd

# Advanced reshaping with pivot and melt
long_data = pd.DataFrame({
    'date': ['2024-01-01', '2024-01-01', '2024-01-02', '2024-01-02'],
    'metric': ['revenue', 'cost', 'revenue', 'cost'],
    'value': [1000, 600, 1100, 650]
})
wide = long_data.pivot(index='date', columns='metric', values='value')
back_to_long = wide.reset_index().melt(
    id_vars='date',
    var_name='metric',
    value_name='value'
)

# Categorical data optimization
df = pd.DataFrame({'category': ['A'] * 1000 + ['B'] * 1000 + ['C'] * 1000})
df['category'] = df['category'].astype('category')
print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")

# Using apply for custom transformations
def categorize_salary(salary):
    if salary < 50000:
        return 'Low'
    elif salary < 80000:
        return 'Medium'
    return 'High'

df['salary_bracket'] = df['salary'].apply(categorize_salary)

# Window functions with transform
df = pd.DataFrame({
    'department': ['A', 'A', 'A', 'B', 'B'],
    'salary': [50000, 60000, 70000, 55000, 65000]
})
df['dept_avg'] = df.groupby('department')['salary'].transform('mean')
df['salary_vs_dept_avg'] = df['salary'] - df['dept_avg']

# Efficient string operations with vectorized methods
df = pd.DataFrame({'names': ['John Doe', 'Jane Smith', 'Bob Johnson']})
df['first_name'] = df['names'].str.split().str[0]
df['last_name'] = df['names'].str.split().str[-1]
df['initials'] = df['names'].str.replace(' ', '').str.upper().str[0:2]
```

```python
import pandas as pd
import numpy as np

# MultiIndex operations for hierarchical data
index = pd.MultiIndex.from_product(
    [['2024'], ['Q1', 'Q2', 'Q3', 'Q4'], list(range(1, 13))],
    names=['year', 'quarter', 'month']
)
data = pd.DataFrame({
    'revenue': np.random.randint(100000, 500000, len(index)),
    'expenses': np.random.randint(50000, 200000, len(index))
}, index=index)

# Slicing multi-index
q1_data = data.loc['2024', 'Q1']
jan_data = data.loc[('2024', 'Q1', 1)]

# Cross-sectional analysis with xs()
quarterly = data.xs('Q1', level='quarter')
monthly_q1 = data.xs(1, level='month')

# Stacking and unstacking for reshaping
stacked = data.stack()
unstacked = stacked.unstack(level='quarter')

# Performance optimization with chunked processing
def process_large_file(filepath):
    chunk_size = 100000
    results = []
    for chunk in pd.read_csv(filepath, chunksize=chunk_size):
        processed = chunk.groupby('category')['value'].sum()
        results.append(processed)
    return pd.concat(results)

# Using category dtypes efficiently
df = pd.DataFrame({'code': ['A' + str(i) for i in range(10000)]})
df['code'] = df['code'].astype('category')

# Memory optimization with downcast
df = pd.DataFrame({'ints': np.random.randint(0, 100, 10000)})
optimized = df.copy()
for col in optimized.columns:
    optimized[col] = pd.to_numeric(optimized[col], downcast='integer')
```

## Best Practices

Always specify dtypes explicitly when reading data to avoid automatic inference that can cause memory issues or unexpected behavior, especially with large datasets where performance matters significantly. Use method chaining with `pipe()` for readable transformations rather than nested function calls that become difficult to debug and maintain over time. Leverage vectorized operations throughout your code rather than iterating with Python loops, as pandas and NumPy operations are orders of magnitude faster for bulk data transformations. Set appropriate data types including categorical types for columns with few unique values relative to total rows, and use nullable integer and boolean types to avoid unnecessary float conversions for missing data. Use inplace modifications sparingly as they can make code harder to debug and break chaining patterns; instead return new objects and chain operations. Name your index meaningfully and consider whether a simple or MultiIndex structure best fits your analytical needs. Take advantage of the category dtype for columns with repeated string values to reduce memory usage by 10x or more in many cases. When working with large files, use chunked reading with `read_csv( chunksize=)` or the `iterator=True` parameter to avoid loading everything into memory at once. Profile your code with `%timeit` in Jupyter or use pandas profiling tools to identify bottlenecks before optimizing. Remember that pandas copies data by default in many operations; use `copy()` explicitly when you need to ensure data independence, and use `inplace=True` judiciously.
