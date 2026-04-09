---
name: exploratory-data-analysis
description: Initial data investigation techniques to discover patterns, spot anomalies, test hypotheses, and check assumptions using summary statistics and visualization.
category: data-science
keywords:
  - exploratory-data-analysis
  - eda
  - data exploration
  - data profiling
  - hypothesis testing
  - pattern discovery
  - data understanding
  - initial analysis
difficulty: beginner
related_skills:
  - pandas
  - numpy
  - statistics
  - data-visualization
---

# Exploratory Data Analysis

## What I do

I provide techniques for initial data investigation to understand its structure, identify patterns, detect anomalies, formulate hypotheses, and guide feature engineering. EDA is the foundational step in any data science project that informs subsequent analysis and modeling decisions through systematic exploration and visualization.

## When to use me

- At the start of any data science project
- Understanding data structure and quality
- Identifying relationships between variables
- Detecting outliers and anomalies
- Formulating hypotheses for testing
- Guiding feature engineering decisions
- Communicating data characteristics to stakeholders
- Validating data collection assumptions

## Core Concepts

### Data Profiling
- **Structure discovery**: Dimensions, data types, memory usage
- **Value distributions**: Histograms, density plots, frequency counts
- **Missing value analysis**: Patterns of missingness
- **Duplicate detection**: Exact and fuzzy duplicates

### Univariate Analysis
- **Central tendency**: Mean, median, mode
- **Dispersion**: Range, variance, std, IQR
- **Shape**: Skewness, kurtosis, percentiles
- **Outlier detection**: Z-scores, IQR method

### Bivariate/Multivariate Analysis
- **Correlation**: Pearson, Spearman, Kendall
- **Relationships**: Scatter plots, pair plots
- **Group comparisons**: Box plots, violin plots
- **Dimensionality reduction**: PCA for visualization

### Statistical Testing
- **Normality tests**: Shapiro-Wilk, D'Agostino
- **Outlier tests**: Grubbs, Dixon's Q
- **Homogeneity tests**: Levene, Bartlett
- **Independence tests**: Chi-square, Fisher's exact

## Code Examples (Python)

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Basic data overview
df = pd.read_csv('data.csv')

# Structure information
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nMemory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# First and last rows
print(df.head(10))
print(df.tail(5))

# Summary statistics - numerical
numerical_cols = df.select_dtypes(include=[np.number]).columns
numerical_summary = df[numerical_cols].describe(percentiles=[.01, .05, .25, .5, .75, .95, .99])
print(numerical_summary)

# Summary statistics - categorical
categorical_cols = df.select_dtypes(include=['object', 'category']).columns
for col in categorical_cols:
    print(f"\n{col}:")
    print(f"  Unique values: {df[col].nunique()}")
    print(f"  Value counts:\n{df[col].value_counts().head(10)}")
    print(f"  Missing: {df[col].isnull().sum()} ({df[col].isnull().mean()*100:.1f}%)")

# Missing value analysis
missing = df.isnull().sum()
missing_pct = (df.isnull().sum() / len(df) * 100).round(2)
missing_df = pd.DataFrame({'Missing': missing, 'Percent': missing_pct})
missing_df = missing_df[missing_df['Missing'] > 0].sort_values('Percent', ascending=False)
print(f"\nMissing Values:\n{missing_df}")

# Missing value patterns
missing_pattern = df.isnull().sum(axis=1).value_counts().sort_index()
print(f"\nMissing values per row:\n{missing_pattern}")

# Duplicate analysis
print(f"\nExact duplicates: {df.duplicated().sum()}")
print(f"Duplicate rows:\n{df[df.duplicated(keep=False)].sort_values(list(df.columns))}")

# Outlier detection
def detect_outliers_iqr(series):
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return (series < lower_bound) | (series > upper_bound), lower_bound, upper_bound

for col in numerical_cols:
    outliers, lb, ub = detect_outliers_iqr(df[col].dropna())
    n_outliers = outliers.sum()
    pct_outliers = n_outliers / len(df) * 100
    print(f"{col}: {n_outliers} outliers ({pct_outliers:.1f}%), bounds: [{lb:.2f}, {ub:.2f}]")

# Normality tests
for col in numerical_cols:
    if df[col].notna().sum() > 20:
        stat, p_value = stats.shapiro(df[col].dropna().sample(min(5000, len(df[col]))))
        is_normal = 'Normal' if p_value > 0.05 else 'Non-normal'
        print(f"{col}: Shapiro-Wilk p={p_value:.4f} → {is_normal}")

# Correlation analysis
correlation_matrix = df[numerical_cols].corr()
print(f"\nCorrelation matrix:\n{correlation_matrix}")

# Top correlations
corr_pairs = []
for i in range(len(correlation_matrix.columns)):
    for j in range(i+1, len(correlation_matrix.columns)):
        corr_pairs.append({
            'Variable 1': correlation_matrix.columns[i],
            'Variable 2': correlation_matrix.columns[j],
            'Correlation': correlation_matrix.iloc[i, j]
        })
corr_df = pd.DataFrame(corr_pairs).sort_values('Correlation', key=abs, ascending=False)
print(f"\nTop 10 Correlations:\n{corr_df.head(10)}")

# Distribution analysis
fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for i, col in enumerate(numerical_cols[:8]):
    ax = axes[i]
    df[col].hist(bins=50, ax=ax, alpha=0.7)
    ax.set_title(f'{col}\nSkew: {df[col].skew():.2f}')
    ax.axvline(df[col].mean(), color='red', linestyle='--', label='Mean')
    ax.axvline(df[col].median(), color='green', linestyle='-', label='Median')
    ax.legend(fontsize=8)

plt.tight_layout()
plt.savefig('distributions.png', dpi=150)
plt.show()

# Box plots by category
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for i, col in enumerate(numerical_cols[:6]):
    if len(categorical_cols) > 0:
        sns.boxplot(x=categorical_cols[0], y=col, data=df, ax=axes[i])
    axes[i].set_title(f'{col} by {categorical_cols[0] if len(categorical_cols) > 0 else "all"}')
    axes[i].tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.savefig('boxplots.png', dpi=150)
plt.show()

# Scatter plots for highly correlated variables
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for i, row in corr_df.head(6).iterrows():
    ax = axes[i]
    x, y = row['Variable 1'], row['Variable 2']
    df_sample = df[[x, y]].dropna().sample(min(1000, len(df)))
    ax.scatter(df_sample[x], df_sample[y], alpha=0.3)
    ax.set_xlabel(x)
    ax.set_ylabel(y)
    ax.set_title(f'{x} vs {y}\nCorr: {row["Correlation"]:.3f}')

plt.tight_layout()
plt.savefig('scatterplots.png', dpi=150)
plt.show()

# Heatmap
plt.figure(figsize=(12, 10))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
            fmt='.2f', square=True, linewidths=0.5)
plt.title('Correlation Heatmap')
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=150)
plt.show()

# Pair plot for selected variables
selected_cols = numerical_cols[:4].tolist()
if len(categorical_cols) > 0:
    selected_cols.append(categorical_cols[0])
sns.pairplot(df[selected_cols].dropna(), hue=categorical_cols[0] if len(categorical_cols) > 0 else None,
             diag_kind='kde', plot_kws={'alpha': 0.5})
plt.savefig('pairplot.png', dpi=150)
plt.show()

# Categorical analysis
fig, axes = plt.subplots(1, len(categorical_cols[:4]), figsize=(15, 4))

for i, col in enumerate(categorical_cols[:4]):
    value_counts = df[col].value_counts().head(10)
    axes[i].barh(value_counts.index, value_counts.values)
    axes[i].set_xlabel('Count')
    axes[i].set_title(f'{col}')
    axes[i].invert_yaxis()

plt.tight_layout()
plt.savefig('categorical_counts.png', dpi=150)
plt.show()

# Cross-tabulation
if len(categorical_cols) >= 2:
    ct = pd.crosstab(df[categorical_cols[0]], df[categorical_cols[1]], 
                     margins=True, normalize='index')
    print(f"\nCross-tabulation:\n{ct}")

# Time-based analysis if date column exists
date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
if date_cols:
    df[date_cols[0]] = pd.to_datetime(df[date_cols[0]], errors='coerce')
    df['year'] = df[date_cols[0]].dt.year
    df['month'] = df[date_cols[0]].dt.month
    df['day_of_week'] = df[date_cols[0]].dt.dayofweek
    
    temporal_summary = df.groupby(['year', 'month'])[numerical_cols[0]].agg(['count', 'mean', 'std'])
    print(f"\nTemporal summary:\n{temporal_summary}")

# Cardinality analysis
cardinality = df[categorical_cols].nunique()
print(f"\nCardinality:\n{cardinality}")

# Unique value analysis
for col in categorical_cols:
    print(f"\n{col} unique values: {df[col].nunique()}")
    if df[col].nunique() < 20:
        print(df[col].value_counts())

# Chi-square test for categorical independence
if len(categorical_cols) >= 2:
    contingency = pd.crosstab(df[categorical_cols[0]], df[categorical_cols[1]])
    chi2, p, dof, expected = stats.chi2_contingency(contingency)
    print(f"\nChi-square test ({categorical_cols[0]} vs {categorical_cols[1]}):")
    print(f"  Chi2: {chi2:.4f}, p-value: {p:.4f}, dof: {dof}")
```

## Best Practices

1. **Start simple**: Begin with basic structure and summary statistics before complex analysis.

2. **Visualize distributions**: Always plot your data; summary statistics can be misleading.

3. **Check for anomalies**: Look for impossible values, duplicates, and unexpected patterns.

4. **Understand missingness**: Is missingness random, or does it carry information?

5. **Iterative exploration**: Let findings guide further investigation; don't pre-plan everything.

6. **Document everything**: Keep track of what you find and what questions remain.

7. **Sample wisely**: For large datasets, sample intelligently for visualization.

8. **Consider context**: Domain knowledge should guide and validate your exploration.

## Common Patterns

### Pattern 1: Automated EDA Report Generator
```python
def generate_eda_report(df, output_dir='.'):
    """Generate comprehensive EDA report."""
    report = {}
    
    # Basic info
    report['shape'] = df.shape
    report['dtypes'] = df.dtypes.to_dict()
    report['missing'] = df.isnull().sum().to_dict()
    report['duplicates'] = df.duplicated().sum()
    
    # Numerical summary
    numerical = df.select_dtypes(include=[np.number])
    report['numerical_summary'] = numerical.describe(percentiles=[.01, .05, .25, .5, .75, .95, .99]).to_dict()
    report['skewness'] = numerical.skew().to_dict()
    report['kurtosis'] = numerical.kurtosis().to_dict()
    
    # Categorical summary
    categorical = df.select_dtypes(include=['object', 'category'])
    report['categorical_summary'] = {
        col: {
            'unique': df[col].nunique(),
            'top_values': df[col].value_counts().head(10).to_dict()
        } for col in categorical.columns
    }
    
    # Correlations
    report['correlations'] = numerical.corr().to_dict()
    
    # Save report
    import json
    with open(f'{output_dir}/eda_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    return report
```

### Pattern 2: Target Variable Analysis
```python
def analyze_target(df, target_col):
    """Analyze relationship between features and target."""
    results = {}
    
    # Separate by target type
    if df[target_col].dtype in [np.number] and df[target_col].nunique() > 10:
        # Continuous target
        for col in df.select_dtypes(include=[np.number]).columns:
            if col != target_col:
                corr = df[[col, target_col]].corr().iloc[0, 1]
                results[col] = {'correlation': corr}
    
    elif df[target_col].nunique() <= 10:
        # Categorical target
        # ANOVA for numerical features
        for col in df.select_dtypes(include=[np.number]).columns:
            if col != target_col:
                groups = [group[col].values for name, group in df.groupby(target_col)]
                f_stat, p_value = stats.f_oneway(*groups)
                results[col] = {'f_statistic': f_stat, 'p_value': p_value}
        
        # Chi-square for categorical features
        for col in df.select_dtypes(include=['object', 'category']).columns:
            if col != target_col:
                contingency = pd.crosstab(df[col], df[target_col])
                chi2, p_value, _, _ = stats.chi2_contingency(contingency)
                results[col] = {'chi2': chi2, 'p_value': p_value}
    
    return pd.DataFrame(results).T.sort_values('p_value')
```

### Pattern 3: Data Quality Assessment Framework
```python
def assess_data_quality(df):
    """Comprehensive data quality assessment."""
    quality_report = {}
    
    # Completeness
    quality_report['completeness'] = {
        'total_cells': df.size,
        'missing_cells': df.isnull().sum().sum(),
        'missing_pct': df.isnull().mean().mean() * 100,
        'columns_with_missing': (df.isnull().sum() > 0).sum(),
        'rows_with_missing': (df.isnull().sum(axis=1) > 0).sum()
    }
    
    # Validity
    quality_report['validity'] = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        # Check for impossible values
        invalid = ((df[col] < 0) & (col not in ['temperature', 'price_change'])).sum()
        if invalid > 0:
            quality_report['validity'][col] = f'{invalid} negative values'
    
    # Consistency
    quality_report['consistency'] = {}
    for col1 in df.select_dtypes(include=[np.number]).columns:
        for col2 in df.select_dtypes(include=[np.number]).columns:
            if col1 < col2:
                corr = df[[col1, col2]].corr().iloc[0, 1]
                if abs(corr) > 0.99:
                    quality_report['consistency'][f'{col1}_{col2}'] = \
                        f'High correlation: {corr:.3f}'
    
    # Uniqueness
    quality_report['uniqueness'] = {
        'duplicate_rows': df.duplicated().sum(),
        'duplicate_pct': df.duplicated().mean() * 100
    }
    
    # Timeliness (if date column exists)
    date_cols = df.select_dtypes(include=['datetime']).columns
    if len(date_cols) > 0:
        freshness = (pd.Timestamp.now() - df[date_cols[0]].max()).days
        quality_report['timeliness'] = {'days_since_update': freshness}
    
    return quality_report
```
