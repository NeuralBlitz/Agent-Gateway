---
name: exploratory-data-analysis
description: Exploratory data analysis techniques
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: data-science
---

## What I do

- Investigate datasets systematically
- Identify patterns, trends, and anomalies
- Generate hypotheses from data
- Create summary visualizations
- Understand variable relationships
- Assess data quality and requirements

## When to use me

Use me when:
- Starting any data science project
- Understanding new datasets
- Preparing for modeling
- Answering ad-hoc analytical questions
- Discovering insights in data

## Key Concepts

### EDA Workflow
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Data Overview
df = pd.read_csv("data.csv")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(df.info())

# 2. Summary Statistics
print(df.describe(include="all"))

# 3. Missing Values
missing = df.isnull().sum()
missing_pct = (missing / len(df)) * 100
print(pd.DataFrame({"Missing": missing, "%": missing_pct}))

# 4. Univariate Analysis
for col in df.select_dtypes(include=[np.number]).columns:
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    df[col].hist(ax=ax[0], bins=30)
    df.boxplot(column=col, ax=ax[1])

# 5. Bivariate Analysis
numeric_cols = df.select_dtypes(include=[np.number]).columns
corr = df[numeric_cols].corr()

# 6. Categorical Analysis
for col in df.select_dtypes(include="object").columns:
    print(df[col].value_counts().head(10))
```

### Visual EDA Techniques
- **Histograms**: Distribution shape
- **Box plots**: Outliers and quartiles
- **Scatter plots**: Relationships
- **Heatmaps**: Correlation
- **Pair plots**: Multiple relationships
- **Count plots**: Categorical counts
