---
name: wrangling
description: Data wrangling fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: data-science
---

## What I do

- Transform and clean raw data
- Reshape data structures
- Handle data quality issues
- Parse and extract from unstructured formats
- Merge and join datasets
- Create derived features

## When to use me

Use me when:
- Raw data needs preparation
- Data from multiple sources needs combining
- Complex transformations required
- Preparing data for analysis or ML

## Key Concepts

### Common Transformations
```python
import pandas as pd

# Pivot/Unpivot
pivot_df = df.pivot(index="date", columns="product", values="sales")
melted = pd.melt(df, id_vars=["id"], value_vars=["q1","q2","q3","q4"])

# String operations
df["email_domain"] = df["email"].str.split("@").str[1]
df["name_clean"] = df["name"].str.strip().str.title()

# Conditional logic
df["segment"] = np.where(df["income"] > 100000, "Premium",
                np.where(df["income"] > 50000, "Standard", "Basic"))

# Apply custom functions
def categorize(age):
    if age < 18: return "minor"
    elif age < 65: return "adult"
    return "senior"
    
df["age_category"] = df["age"].apply(categorize)

# Rolling calculations
df["rolling_avg"] = df["sales"].rolling(window=7).mean()
df["pct_change"] = df["sales"].pct_change()
```
