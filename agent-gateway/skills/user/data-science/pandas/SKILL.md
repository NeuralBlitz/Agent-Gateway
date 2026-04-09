---
name: pandas
description: Data manipulation and analysis library providing data structures and tools for cleaning, transforming, aggregating, and analyzing tabular data.
category: data-science
keywords:
  - pandas
  - dataframes
  - data manipulation
  - data cleaning
  - data analysis
  - time series
  - csv
  - excel
difficulty: beginner
related_skills:
  - numpy
  - statistics
  - data-visualization
---

# Pandas

## What I do

I provide powerful data manipulation and analysis capabilities through DataFrame and Series data structures. I enable you to load data from various sources, clean and preprocess data, perform complex transformations, aggregate and group data, handle missing values, merge datasets, and conduct exploratory data analysis. I am the foundational tool for data science workflows in Python.

## When to use me

- Loading and exporting data (CSV, Excel, JSON, SQL databases)
- Cleaning and preprocessing messy datasets
- Filtering and selecting specific data subsets
- Handling missing or corrupted data
- Transforming and creating new features
- Grouping and aggregating data
- Merging and joining multiple datasets
- Time series analysis and resampling
- Statistical analysis on tabular data

## Core Concepts

### Data Structures
- **Series**: One-dimensional labeled array with homogeneous data
- **DataFrame**: Two-dimensional labeled data structure with columns of potentially different types
- **Index**: Labels for rows and columns, supports hierarchical (multi-index) structures

### Data Operations
- **Selection**: `.loc[]` for label-based, `.iloc[]` for integer-based selection
- **Filtering**: Boolean indexing with conditions
- **Sorting**: `.sort_values()` and `.sort_index()`
- **Mapping**: `.apply()`, `.map()`, `.applymap()` for element-wise operations

### Data Cleaning
- **Missing Data**: `isna()`, `dropna()`, `fillna()`, `interpolate()`
- **Duplicates**: `duplicated()`, `drop_duplicates()`
- **Data Types**: `astype()`, `infer_objects()`
- **String Operations**: `.str` accessor with regex support

### Aggregation
- **GroupBy**: `.groupby()` for split-apply-combine operations
- **Aggregation**: `.agg()`, `.aggregate()` with multiple functions
- **Transformation**: `.transform()` maintaining original shape
- **Window Functions**: `.rolling()`, `.expanding()`, `.ewm()`

### Merging and Joining
- **Concatenation**: `pd.concat()` for combining along axes
- **Merging**: `pd.merge()` for SQL-style joins (inner, outer, left, right)
- **Join**: DataFrame method for index-based joining

## Code Examples (Python)

```python
import pandas as pd
import numpy as np

# Creating DataFrames
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 40],
    'salary': [50000, 60000, 75000, 90000],
    'department': ['Engineering', 'Sales', 'Engineering', 'Marketing']
})

# Loading data
df = pd.read_csv('data.csv', parse_dates=['date'], index_col='id')
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')
df = pd.read_json('data.json')
df = pd.read_sql('SELECT * FROM table', connection)

# Data selection
df['name']  # Single column as Series
df[['name', 'salary']]  # Multiple columns
df.loc['row1':'row5', 'name':'salary']  # Label-based
df.iloc[0:5, 0:3]  # Integer-based

# Filtering
df[df['age'] > 30]
df[(df['age'] > 30) & (df['department'] == 'Engineering')]
df[df['name'].str.contains('Alice|Bob')]

# Data cleaning
df.isnull().sum()  # Missing values
df.dropna(thresh=len(df.columns)-2)  # Drop rows with too many NaN
df.fillna({'age': df['age'].median()})  # Fill specific columns
df.duplicated().sum()  # Count duplicates
df.drop_duplicates(subset=['name'], keep='first')

# String operations
df['name'].str.lower()
df['email'].str.extract(r'@(.+)$')
df['department'].str.replace('Engineering', 'Eng')

# Type conversion
df['age'] = df['age'].astype(int)
df['salary'] = pd.to_numeric(df['salary'], errors='coerce')

# Sorting
df.sort_values('salary', ascending=False)
df.sort_values(['department', 'salary'], ascending=[True, False])
df.sort_index()

# Grouping and aggregation
df.groupby('department').agg({
    'salary': ['mean', 'max', 'min'],
    'age': 'mean'
})
df.groupby('department')['salary'].transform('mean')

# Pivot tables
pd.pivot_table(df, values='salary', index='department', 
               columns='year', aggfunc='mean')

# Merging
df1 = pd.DataFrame({'id': [1, 2, 3], 'name': ['A', 'B', 'C']})
df2 = pd.DataFrame({'id': [1, 2, 4], 'salary': [50000, 60000, 70000]})
merged = pd.merge(df1, df2, on='id', how='outer')

# Concatenation
pd.concat([df1, df2], ignore_index=True)
pd.concat([df1, df2], axis=1)

# Time series
df.set_index('date', inplace=True)
df.resample('M').mean()  # Monthly aggregation
df.rolling(window=7).mean()  # 7-day rolling average
df.expanding().sum()  # Cumulative sum
df.diff()  # Difference between consecutive values

# Statistical operations
df.describe()
df.corr()
df.cov()
df['salary'].value_counts()
df['department'].nunique()

# Apply functions
def categorize_age(age):
    if age < 30:
        return 'Young'
    elif age < 50:
        return 'Middle'
    else:
        return 'Senior'

df['age_category'] = df['age'].apply(categorize_age)
df['salary_log'] = df['salary'].apply(np.log)

# Exporting data
df.to_csv('output.csv', index=False)
df.to_excel('output.xlsx', sheet_name='Data')
df.to_json('output.json', orient='records')
```

## Best Practices

1. **Use vectorized operations**: Avoid loops; pandas operations are optimized for vectorized execution.

2. **Chain operations for readability**: Use method chaining with `assign()`, `pipe()`, and successive operations.

3. **Specify dtypes explicitly**: When loading data, specify column types to avoid inference overhead.

4. **Use appropriate index**: Set meaningful indices (dates, IDs) for efficient operations.

5. **Avoid chained indexing**: Use `.loc[]` and `.iloc[]` with tuple indices instead of `df[col][row]`.

6. **Memory optimization**: Use `category` dtype for low-cardinality strings, `downcast` for numeric types.

7. **Use appropriate file formats**: Parquet for speed and compression, CSV for interoperability.

8. **Handle SettingWithCopy warnings**: Understand pandas copy/view semantics and use `.copy()` when needed.

## Common Patterns

### Pattern 1: Exploratory Data Analysis Pipeline
```python
def eda_pipeline(df):
    # Basic info
    info = {
        'shape': df.shape,
        'dtypes': df.dtypes,
        'missing': df.isnull().sum(),
        'describe': df.describe()
    }
    
    # Categorical analysis
    cat_cols = df.select_dtypes(include=['object']).columns
    cat_summary = {col: {'unique': df[col].nunique(), 
                        'top': df[col].value_counts().head()} 
                   for col in cat_cols}
    
    # Numerical analysis
    num_cols = df.select_dtypes(include=[np.number]).columns
    num_summary = df[num_cols].corr()
    
    return info, cat_summary, num_summary
```

### Pattern 2: Data Cleaning Pipeline
```python
def clean_data(df):
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Handle missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode().iloc[0])
    
    # Remove outliers (IQR method)
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        df = df[(df[col] >= Q1 - 1.5*IQR) & (df[col] <= Q3 + 1.5*IQR)]
    
    # Standardize text
    for col in categorical_cols:
        df[col] = df[col].str.strip().str.lower()
    
    return df
```

### Pattern 3: Feature Engineering from Raw Data
```python
def engineer_features(df):
    # Create features
    df = df.assign(
        age_group=lambda x: pd.cut(x['age'], bins=[0, 25, 35, 50, 100],
                                   labels=['young', 'adult', 'middle', 'senior']),
        salary_per_year_exp=lambda x: x['salary'] / (x['years_exp'] + 1),
        is_senior=lambda x: (x['age'] > 40).astype(int)
    )
    
    # One-hot encoding
    df = pd.get_dummies(df, columns=['department', 'gender'], drop_first=True)
    
    # Interaction features
    df['exp_salary_product'] = df['years_exp'] * df['salary']
    
    return df
```
