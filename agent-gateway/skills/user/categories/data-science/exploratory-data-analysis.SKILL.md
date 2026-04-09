---
name: exploratory-data-analysis
description: Initial investigation of datasets to discover patterns and identify anomalies
category: data-science
skills:
  - data profiling
  - distribution analysis
  - correlation analysis
  - pattern discovery
  - hypothesis generation
---

# Exploratory Data Analysis

## What I do

I am exploratory data analysis (EDA), the initial investigative process of examining datasets to discover patterns, identify anomalies, test hypotheses, and check assumptions before formal modeling. Developed by John Tukey in the 1970s, I emphasize visual and quantitative techniques to understand data structure and characteristics. EDA helps you develop intuition about your data, guides feature engineering and model selection decisions, and often reveals unexpected insights that drive business value. I combine summary statistics, visualizations, and interactive exploration to build understanding incrementally. Effective EDA prevents costly mistakes by catching data quality issues early and ensures that subsequent analysis is built on a solid foundation.

## When to use me

Use EDA at the beginning of every data science project before building models or drawing conclusions. Use EDA when you receive a new dataset and need to understand its structure, quality, and content. Use EDA when validating assumptions for statistical tests or model requirements. Use EDA when investigating data quality issues like missing values, outliers, or inconsistencies. Use EDA when exploring relationships between variables to guide feature engineering. Use EDA when communicating with stakeholders about data characteristics and potential issues. Use EDA when validating data pipelines to ensure data is being processed correctly. Do not skip EDA even under time pressure, as understanding your data is essential for valid analysis. Do not jump to conclusions from EDA alone; use it to generate hypotheses for formal testing.

## Core Concepts

**Data Profiling**: Computing comprehensive summary statistics for each variable including measures of central tendency, dispersion, distribution shape, and missing data rates. Profiling reveals data types, value ranges, and basic quality assessment at a glance.

**Univariate Analysis**: Examining each variable individually to understand its distribution, identify outliers, and assess suitability for various analyses. Techniques include histograms, box plots, density plots, and statistical tests for normality.

**Bivariate/Multivariate Analysis**: Exploring relationships between pairs or groups of variables. Scatter plots reveal correlations, cross-tabulations show relationships between categoricals, and heatmaps visualize correlation matrices. Multiple techniques help distinguish correlation from causation.

**Missing Data Analysis**: Investigating patterns in missing values to understand whether missingness is random, related to other variables, or systematic. Missing patterns can reveal data collection issues or meaningful relationships.

**Outlier Detection**: Identifying extreme values that may represent data entry errors, measurement issues, or genuine but rare events. Decision depends on whether outliers should be removed, transformed, or retained with appropriate models.

**Hypothesis Generation**: Developing testable assumptions based on observed patterns. EDA should generate questions and hypotheses for subsequent formal analysis rather than confirming preconceived notions.

**Visualization-Driven Discovery**: Using visual patterns to identify structures, clusters, trends, and anomalies that statistical summaries might miss. Effective visualization is essential for insight generation.

## Code Examples

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Comprehensive data profiling
def profile_data(df):
    print("=" * 60)
    print("DATA PROFILE")
    print("=" * 60)
    
    print(f"\nShape: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"\nData Types:\n{df.dtypes.value_counts()}")
    
    print("\n" + "-" * 40)
    print("Missing Values Summary:")
    print("-" * 40)
    missing = df.isnull().sum()
    missing_pct = (df.isnull().sum() / len(df) * 100).round(2)
    missing_df = pd.DataFrame({'count': missing, 'percent': missing_pct})
    print(missing_df[missing_df['count'] > 0].sort_values('percent', ascending=False))
    
    print("\n" + "-" * 40)
    print("Basic Statistics (Numeric Columns):")
    print("-" * 40)
    print(df.describe().T.round(2))

# Generating sample data
np.random.seed(42)
df = pd.DataFrame({
    'age': np.random.randint(18, 70, 1000),
    'income': np.random.lognormal(10, 0.5, 1000),
    'score': np.random.beta(2, 5, 1000) * 100,
    'category': np.random.choice(['A', 'B', 'C'], 1000, p=[0.3, 0.5, 0.2]),
    'region': np.random.choice(['North', 'South', 'East', 'West'], 1000),
    'rating': np.random.choice([1, 2, 3, 4, 5], 1000, p=[0.1, 0.15, 0.4, 0.25, 0.1])
})

profile_data(df)
```

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Distribution analysis with visualizations
def analyze_distributions(df, numeric_cols):
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()
    
    for i, col in enumerate(numeric_cols):
        data = df[col].dropna()
        
        # Histogram with KDE
        axes[i].hist(data, bins=30, density=True, alpha=0.7, color='steelblue', edgecolor='white')
        
        # Overlay KDE
        if len(data) > 10:
            kde_x = np.linspace(data.min(), data.max(), 100)
            kde = stats.gaussian_kde(data)
            axes[i].plot(kde_x, kde(kde_x), 'r-', linewidth=2, label='KDE')
        
        # Add statistics
        mean, std = data.mean(), data.std()
        axes[i].axvline(mean, color='green', linestyle='--', label=f'Mean: {mean:.2f}')
        axes[i].axvline(data.median(), color='orange', linestyle='--', label=f'Median: {data.median():.2f}')
        
        # Normality test
        stat, p_value = stats.shapiro(data.sample(min(5000, len(data)), random_state=42))
        axes[i].set_title(f'{col}\nShapiro p-value: {p_value:.4f}')
        axes[i].legend(fontsize=8)
        axes[i].set_xlabel(col)
        axes[i].set_ylabel('Density')
    
    plt.tight_layout()
    plt.savefig('distribution_analysis.png', dpi=150)
    plt.show()

# Correlation analysis
def analyze_correlations(df, numeric_cols):
    corr_matrix = df[numeric_cols].corr()
    
    # Correlation heatmap
    plt.figure(figsize=(10, 8))
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f', 
                cmap='RdBu_r', center=0, square=True, linewidths=0.5)
    plt.title('Correlation Matrix')
    plt.tight_layout()
    plt.savefig('correlation_matrix.png', dpi=150)
    plt.show()
    
    # Identify highly correlated pairs
    print("\nHighly Correlated Pairs (|r| > 0.7):")
    print("-" * 40)
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            if abs(corr_matrix.iloc[i, j]) > 0.7:
                print(f"{corr_matrix.columns[i]} <-> {corr_matrix.columns[j]}: {corr_matrix.iloc[i, j]:.3f}")
```

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Categorical variable analysis
def analyze_categoricals(df, cat_col, target_col=None):
    print(f"\n{'='*40}")
    print(f"Analysis of: {cat_col}")
    print(f"{'='*40}")
    
    # Value counts
    value_counts = df[cat_col].value_counts()
    print(f"\nValue Counts:\n{value_counts}")
    print(f"\nPercentages:\n{(value_counts / len(df) * 100).round(2)}")
    
    # Visualization
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    sns.countplot(data=df, x=cat_col, order=value_counts.index, palette='viridis')
    plt.title(f'Distribution of {cat_col}')
    plt.xticks(rotation=45)
    
    if target_col and target_col in df.columns:
        plt.subplot(1, 2, 2)
        df.groupby(cat_col)[target_col].mean().plot(kind='bar', color='steelblue')
        plt.title(f'Mean {target_col} by {cat_col}')
        plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(f'categorical_{cat_col}.png', dpi=150)
    plt.show()
    
    # Chi-square test for independence
    if target_col and target_col in df.columns:
        contingency = pd.crosstab(df[cat_col], df[target_col])
        chi2, p, dof, expected = stats.chi2_contingency(contingency)
        print(f"\nChi-square test (vs {target_col}):")
        print(f"Chi2: {chi2:.4f}, p-value: {p:.4f}, dof: {dof}")

# Missing data pattern analysis
def analyze_missing(df):
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(2)
    missing_df = pd.DataFrame({'count': missing, 'percent': missing_pct})
    missing_df = missing_df[missing_df['count'] > 0].sort_values('percent', ascending=False)
    
    print("\nMissing Data Analysis:")
    print("-" * 40)
    print(missing_df)
    
    # Visualize missing pattern
    if len(missing_df) > 0:
        plt.figure(figsize=(12, 4))
        sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap='viridis')
        plt.title('Missing Data Pattern')
        plt.tight_layout()
        plt.savefig('missing_pattern.png', dpi=150)
        plt.show()

# Full EDA summary
def comprehensive_eda(df, target_col=None):
    print("COMPREHENSIVE EDA REPORT")
    print("=" * 60)
    
    # Basic info
    print(f"\nDataset: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"Memory: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    
    # Profile data
    profile_data(df)
    
    # Numeric columns analysis
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if numeric_cols:
        analyze_distributions(df, numeric_cols[:6])
        analyze_correlations(df, numeric_cols)
```

## Best Practices

Start with basic profiling to understand data shape, types, and quality before diving into complex analyses. Use visualizations as a first-pass exploration tool rather than relying solely on statistical summaries, as visuals often reveal patterns statistics miss. Treat EDA as iterative and hypothesis-driven, where each discovery leads to new questions and deeper investigation. Check for data quality issues early including missing values, duplicates, outliers, and inconsistent formats, as these affect all downstream analysis. Understand the context of how data was collected, as sampling methods and collection processes influence what analyses are valid. Use appropriate statistical tests for different data types and questions rather than applying the same tests universally. Look at actual data values, not just summaries, to catch anomalies and understand data semantics. Document findings thoroughly to guide subsequent analysis and inform stakeholders. Consider relationships between variables rather than analyzing each in isolation. Use sampling strategies for very large datasets to make EDA computationally feasible while still representing the full data distribution. Generate hypotheses from EDA but validate them with proper statistical tests rather than drawing conclusions from exploratory patterns alone.
