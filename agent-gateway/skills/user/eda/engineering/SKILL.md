---
name: eda/engineering
description: EDA engineering practices
license: MIT
compatibility: opencode
metadata:
  audience: data-engineers
  category: data-science
---

## What I do

- Build scalable EDA pipelines
- Automate data profiling
- Create reproducible data analysis workflows
- Implement data quality monitoring
- Design data exploration tools
- Build self-service analytics infrastructure

## When to use me

Use me when:
- Building data infrastructure
- Automating EDA for large datasets
- Creating data quality dashboards
- Implementing data governance
- Building analytics platforms

## Key Concepts

### Data Profiling Pipeline
```python
from great_expectations import GreatExpectations
import pandas as pd

# Define expectations
expectations = [
    {"expectation_type": "expect_column_values_to_not_be_null",
     "kwargs": {"column": "id"}},
    {"expectation_type": "expect_column_values_to_be_unique",
     "kwargs": {"column": "id"}},
    {"expectation_type": "expect_column_values_to_be_between",
     "kwargs": {"column": "age", "min_value": 0, "max_value": 120}},
    {"expectation_type": "expect_column_distinct_values_to_be_in_set",
     "kwargs": {"column": "status", "value_set": ["active", "inactive"]}}
]

# Validate data
ge = GreatExpectations()
batch = ge.get_batch("data.csv", "default")
results = ge.validate(batch, expectations=expectations)
```

### Automated Profiling
```python
from pandas_profiling import ProfileReport

# Generate comprehensive EDA report
profile = ProfileReport(
    df, 
    title="Data Profiling Report",
    explorative=True,
    missing_diagrams=True,
    correlations={"high_cardinality": "include"}
)

profile.to_file("eda_report.html")
```

### Data Quality Metrics
- **Completeness**: % non-null values
- **Uniqueness**: % unique values
- **Validity**: % values in valid range
- **Consistency**: Cross-field validation
- **Timeliness**: Data freshness

### Monitoring Setup
- Great Expectations for validation
- Datafold for diff analysis
- Great Expectations Cloud
- Amundsen for data catalog
