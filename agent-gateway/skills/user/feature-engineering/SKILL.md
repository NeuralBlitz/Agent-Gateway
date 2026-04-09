---
name: feature-engineering
description: Machine learning feature engineering
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: data-science
---

## What I do

- Create features from raw data for ML models
- Transform variables for better model performance
- Handle categorical and numerical features
- Create interaction and polynomial features
- Extract features from text, dates, and images
- Handle missing data strategically
- Select most predictive features

## When to use me

Use me when:
- Preparing data for ML models
- Improving model performance
- Working with raw/unstructured data
- Handling complex data types
- Reducing feature dimensionality

## Key Concepts

### Feature Engineering Techniques
```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Numerical transformations
df["log_income"] = np.log1p(df["income"])
df["income_squared"] = df["income"] ** 2
df["income_bucket"] = pd.cut(df["income"], bins=[0, 30, 60, 100], 
                              labels=["low", "mid", "high"])

# Date features
df["order_date"] = pd.to_datetime(df["order_date"])
df["order_year"] = df["order_date"].dt.year
df["order_month"] = df["order_date"].dt.month
df["order_dayofweek"] = df["order_date"].dt.dayofweek
df["is_weekend"] = df["order_dayofweek"].isin([5, 6]).astype(int)

# Aggregation features
user_stats = df.groupby("user_id").agg({
    "order_id": "count",
    "total_amount": ["sum", "mean", "std"],
    "order_date": ["min", "max"]
}).reset_index()

# Merge back
df = df.merge(user_stats, on="user_id", how="left")

# Text features
df["title_length"] = df["title"].str.len()
df["word_count"] = df["title"].str.split().str.len()
df["has_exclamation"] = df["title"].str.contains("!").astype(int)

# Categorical encoding
# One-hot encoding
pd.get_dummies(df, columns=["category"], prefix="cat")

# Target encoding
mean_encoding = df.groupby("category")["target"].mean()
df["category_encoded"] = df["category"].map(mean_encoding)
```

### Feature Selection
- **Filter methods**: Correlation, chi-square
- **Wrapper methods**: RFE, forward selection
- **Embedded methods**: LASSO, feature importance

### Handling Imbalanced Data
- SMOTE oversampling
- Undersampling majority class
- Class weights in model
- Focal loss
