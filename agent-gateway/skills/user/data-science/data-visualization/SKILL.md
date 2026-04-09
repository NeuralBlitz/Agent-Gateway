---
name: data-visualization
description: Data visualization principles and tools for creating charts, graphs, and interactive dashboards to communicate insights from data effectively.
category: data-science
keywords:
  - data-visualization
  - matplotlib
  - seaborn
  - plotting
  - charts
  - graphs
  - dashboards
  - visualization
  - exploratory visualization
difficulty: intermediate
related_skills:
  - pandas
  - numpy
  - exploratory-data-analysis
---

# Data Visualization

## What I do

I provide tools and techniques for creating effective visual representations of data. I enable you to explore data patterns through exploratory plots, communicate insights through explanatory visualizations, and build interactive dashboards. Good visualization helps stakeholders understand complex data quickly and supports data-driven decision making.

## When to use me

- Exploring data distributions and relationships
- Identifying patterns, trends, and anomalies
- Comparing groups or categories
- Showing changes over time
- Presenting findings to stakeholders
- Building interactive dashboards
- Reporting analysis results
- Communicating uncertainty

## Core Concepts

### Chart Types
- **Distribution**: Histogram, KDE, box plot, violin plot
- **Relationship**: Scatter plot, line plot, heatmap
- **Comparison**: Bar chart, grouped bar chart, bubble chart
- **Composition**: Pie chart, stacked bar, treemap
- **Time Series**: Line chart, area chart, candlestick

### Design Principles
- **Clarity**: Clear titles, labels, and legends
- **Simplicity**: Avoid chart junk and unnecessary elements
- **Color**: Use appropriate color schemes (sequential, diverging, qualitative)
- **Scale**: Use appropriate axis scales (linear, log)
- **Context**: Include reference lines, annotations, and context

### Tools
- **Matplotlib**: Low-level, flexible, publication-quality plots
- **Seaborn**: High-level statistical visualizations
- **Plotly**: Interactive plots and dashboards
- **Altair**: Declarative visualization

## Code Examples (Python)

```python
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Basic plots with matplotlib
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Line plot
axes[0, 0].plot(x, y, 'b-', linewidth=2, marker='o', markersize=4)
axes[0, 0].set_xlabel('X Axis')
axes[0, 0].set_ylabel('Y Axis')
axes[0, 0].set_title('Line Plot')

# Scatter plot
axes[0, 1].scatter(x, y, c=z, cmap='viridis', alpha=0.7, s=50)
axes[0, 1].set_xlabel('X Axis')
axes[0, 1].set_ylabel('Y Axis')
axes[0, 1].set_title('Scatter Plot')

# Bar chart
axes[1, 0].bar(categories, values, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
axes[1, 0].set_xlabel('Category')
axes[1, 0].set_ylabel('Value')
axes[1, 0].set_title('Bar Chart')

# Histogram
axes[1, 1].hist(data, bins=30, color='steelblue', edgecolor='white', alpha=0.7)
axes[1, 1].set_xlabel('Value')
axes[1, 1].set_ylabel('Frequency')
axes[1, 1].set_title('Histogram')

plt.tight_layout()
plt.savefig('basic_plots.png', dpi=150, bbox_inches='tight')
plt.show()

# Seaborn plots
# Distribution plots
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Histogram with KDE
sns.histplot(data, kde=True, ax=axes[0, 0], color='skyblue')

# Box plot
sns.boxplot(x='category', y='value', data=df, ax=axes[0, 1])

# Violin plot
sns.violinplot(x='category', y='value', data=df, ax=axes[1, 0])

# Pair plot for multiple variables
# sns.pairplot(df, hue='category', diag_kind='kde')

# Relationship plots
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Scatter with regression line
sns.regplot(x='x', y='y', data=df, ax=axes[0])

# Scatter with hue
sns.scatterplot(x='x', y='y', hue='category', data=df, ax=axes[1])

# Heatmap
correlation_matrix = df.corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, ax=axes[2])

plt.tight_layout()
plt.show()

# Time series visualization
fig, axes = plt.subplots(2, 1, figsize=(12, 8))

# Line chart with confidence interval
sns.lineplot(x='date', y='value', data=df, ax=axes[0])
axes[0].set_title('Time Series')

# Area chart
sns.lineplot(x='date', y='value', data=df, ax=axes[1], fill=True)
axes[1].set_title('Area Chart')

plt.tight_layout()
plt.show()

# Categorical data visualization
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Count plot
sns.countplot(x='category', data=df, ax=axes[0])

# Bar plot with error bars
sns.barplot(x='category', y='value', data=df, ax=axes[1], errorbar='sd')

# Grouped bar chart
sns.barplot(x='category', y='value', hue='group', data=df, ax=axes[2])

plt.tight_layout()
plt.show()

# Multi-panel figure
fig = plt.figure(figsize=(14, 10))

# GridSpec for custom layout
from matplotlib.gridspec import GridSpec
gs = GridSpec(3, 3, figure=fig, hspace=0.3, wspace=0.3)

# Create subplots
ax1 = fig.add_subplot(gs[0, :2])
ax2 = fig.add_subplot(gs[0, 2])
ax3 = fig.add_subplot(gs[1, :])
ax4 = fig.add_subplot(gs[2, 0])
ax5 = fig.add_subplot(gs[2, 1])
ax6 = fig.add_subplot(gs[2, 2])

# Add content
ax1.plot(x, y)
ax2.bar(categories, values)
ax3.scatter(x, y, c=z, cmap='viridis')
ax4.hist(data1, bins=20, alpha=0.7)
ax5.hist(data2, bins=20, alpha=0.7)
ax6.boxplot([data1, data2, data3])

plt.savefig('complex_layout.png', dpi=150, bbox_inches='tight')
plt.show()

# Annotations and styling
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(x, y, 'b-', linewidth=2)

# Add annotations
ax.annotate('Peak', xy=(x_max, y_max), xytext=(x_max+5, y_max+10),
            arrowprops=dict(arrowstyle='->', color='red'),
            fontsize=12, color='red')

# Add reference lines
ax.axhline(y=mean_value, color='gray', linestyle='--', label=f'Mean: {mean_value:.2f}')
ax.axvline(x=threshold, color='orange', linestyle=':', alpha=0.7)

# Add legend
ax.legend(loc='upper left')

# Styling
ax.set_xlabel('X Label', fontsize=12)
ax.set_ylabel('Y Label', fontsize=12)
ax.set_title('Styled Plot', fontsize=14, fontweight='bold')

plt.show()
```

## Best Practices

1. **Know your audience**: Tailor complexity and detail to the audience's expertise.

2. **Choose the right chart type**: Match the chart to the data and message (comparison vs. distribution vs. relationship).

3. **Keep it simple**: Remove unnecessary elements (chart junk, excessive gridlines, decorative 3D effects).

4. **Use color strategically**: Use color to highlight, not decorate. Use consistent color schemes.

5. **Label clearly**: Axis labels, titles, and legends should be informative and readable.

6. **Provide context**: Include reference points, benchmarks, and relevant annotations.

7. **Consider accessibility**: Use colorblind-friendly palettes and ensure text is readable.

8. **Iterate**: Create multiple versions and get feedback before finalizing.

## Common Patterns

### Pattern 1: Exploratory Data Analysis Dashboard
```python
def eda_dashboard(df, numeric_cols, categorical_cols):
    fig, axes = plt.subplots(len(numeric_cols), 3, figsize=(15, 4*len(numeric_cols)))
    
    for i, col in enumerate(numeric_cols):
        # Distribution
        sns.histplot(df[col].dropna(), kde=True, ax=axes[i, 0])
        axes[i, 0].set_title(f'{col} Distribution')
        
        # Box plot by category
        if categorical_cols:
            sns.boxplot(x=categorical_cols[0], y=col, data=df, ax=axes[i, 1])
        
        # Outlier summary
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        outliers = df[(df[col] < q1-1.5*iqr) | (df[col] > q3+1.5*iqr)][col].count()
        axes[i, 2].text(0.5, 0.5, f'Outliers: {outliers}', 
                       ha='center', va='center', fontsize=14)
        axes[i, 2].set_title(f'{col} Summary')
    
    plt.tight_layout()
    return fig
```

### Pattern 2: Model Performance Comparison
```python
def compare_model_performance(results_df):
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    # Accuracy comparison
    sns.barplot(x='model', y='accuracy', data=results_df, ax=axes[0])
    axes[0].set_title('Model Accuracy Comparison')
    axes[0].tick_params(axis='x', rotation=45)
    
    # Confusion matrix heatmap
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1])
    axes[1].set_title('Best Model Confusion Matrix')
    
    # ROC curves
    for model_name, fpr, tpr in roc_data:
        axes[2].plot(fpr, tpr, label=f'{model_name} (AUC={auc:.2f})')
    axes[2].plot([0, 1], [0, 1], 'k--')
    axes[2].set_xlabel('False Positive Rate')
    axes[2].set_ylabel('True Positive Rate')
    axes[2].set_title('ROC Curves')
    axes[2].legend()
    
    plt.tight_layout()
    return fig
```

### Pattern 3: Time Series Analysis Visualization
```python
def timeseries_dashboard(df, date_col, value_col):
    fig, axes = plt.subplots(3, 2, figsize=(14, 12))
    
    # Raw time series
    axes[0, 0].plot(df[date_col], df[value_col], linewidth=0.5)
    axes[0, 0].set_title('Time Series')
    
    # Rolling mean
    rolling_mean = df[value_col].rolling(window=30).mean()
    axes[0, 1].plot(df[date_col], rolling_mean, color='red', label='30-day MA')
    axes[0, 1].plot(df[date_col], df[value_col], alpha=0.3)
    axes[0, 1].set_title('30-Day Moving Average')
    axes[0, 1].legend()
    
    # Seasonal decomposition
    from statsmodels.tsa.seasonal import seasonal_decompose
    decomposition = seasonal_decompose(df[value_col], model='additive', period=365)
    axes[1, 0].plot(decomposition.trend)
    axes[1, 0].set_title('Trend')
    axes[1, 1].plot(decomposition.seasonal)
    axes[1, 1].set_title('Seasonal')
    
    # Distribution by period
    df['month'] = df[date_col].dt.month
    sns.boxplot(x='month', y=value_col, data=df, ax=axes[2, 0])
    axes[2, 0].set_title('Monthly Distribution')
    
    # Autocorrelation
    from pandas.plotting import autocorrelation_plot
    autocorrelation_plot(df[value_col], ax=axes[2, 1])
    
    plt.tight_layout()
    return fig
```
