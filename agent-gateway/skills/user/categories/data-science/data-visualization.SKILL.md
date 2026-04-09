---
name: data-visualization
description: Creating informative visualizations to explore, understand, and communicate data insights
category: data-science
skills:
  - exploratory plots
  - statistical charts
  - interactive dashboards
  - data storytelling
  - visual encoding
---

# Data Visualization

## What I do

I am data visualization, the art and science of creating graphical representations of data to enable better understanding, exploration, and communication of insights. Effective visualizations transform raw numbers into visual forms that leverage human visual perception capabilities, allowing patterns, trends, and anomalies to be detected quickly. I encompass a wide range of techniques from simple bar charts and scatter plots to complex interactive dashboards and animated visualizations. Good visualizations are not merely decorative; they are analytical tools that reveal structure in data, support comparison, and guide decision-making. Whether you're exploring data during analysis or presenting findings to stakeholders, mastering visualization is essential for any data practitioner.

## When to use me

Use data visualization throughout the entire data analysis workflow. During exploratory analysis, use quick visualizations to understand distributions, relationships, and patterns in your data. Use visualization for model diagnostics to assess residuals, feature importance, and prediction errors. Use visualizations for communication to explain complex findings to non-technical audiences and support data-driven decision making. Use visualization for monitoring to track KPIs and detect anomalies in operational data. Use visualization for comparison to highlight differences between groups, time periods, or model predictions. Do not overuse visualizations when simple summary statistics would suffice, use misleading visualizations that distort data perception, or create overly complex charts when simpler alternatives communicate more effectively.

## Core Concepts

**Visual Encoding**: Mapping data values to visual properties like position, length, area, color, and angle. Different encodings have different perceptual effectiveness: position along a common axis is most accurate, length and angle are good for comparisons, while area and color saturation are less accurate. Understanding perception helps you choose appropriate chart types.

**Chart Selection**: Different relationships require different chart types. Use scatter plots for correlations between two continuous variables, line charts for trends over time, bar charts for categorical comparisons, histograms for distributions, box plots for statistical summaries, and heatmaps for matrix data. The data-ink ratio principle suggests maximizing data while minimizing non-data ink.

**Visual Hierarchy and Layout**: Effective visualizations guide the viewer's attention through size, color, and positioning. Group related elements, use consistent scales across comparable charts, and consider the reading pattern (typically top-left to bottom-right). White space is not wasted space.

**Color Use**: Choose colors intentionally with attention to meaning and accessibility. Use sequential colormaps for continuous data, diverging colormaps for data with a meaningful midpoint, and categorical colormaps for distinct categories. Consider colorblindness and use tools like ColorBrewer or Viridis for perceptually uniform colormaps.

**Interactivity**: Interactive visualizations enable exploration by allowing zooming, filtering, and detailed inspection. Hover information provides context, brushing enables selection, and linked views synchronize selections across multiple charts. Balance interactivity with static alternatives for accessibility and reproducibility.

**Data Storytelling**: Effective data communication requires narrative structure. Lead with key insights, provide supporting evidence through visualizations, and guide the audience through your analysis. Annotate charts with meaningful labels and callouts to highlight important features.

## Code Examples

```python
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Basic matplotlib patterns
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

# Line plot for trends
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)
axes[0].plot(x, y1, label='sin(x)', linewidth=2, color='#1f77b4')
axes[0].plot(x, y2, label='cos(x)', linewidth=2, linestyle='--', color='#ff7f0e')
axes[0].set_xlabel('x', fontsize=12)
axes[0].set_ylabel('y', fontsize=12)
axes[0].set_title('Trigonometric Functions', fontsize=14, fontweight='bold')
axes[0].legend(loc='upper right')
axes[0].grid(True, alpha=0.3)

# Scatter plot for correlations
np.random.seed(42)
x_scatter = np.random.randn(200)
y_scatter = 0.8 * x_scatter + np.random.randn(200) * 0.5
scatter = axes[1].scatter(x_scatter, y_scatter, c=y_scatter, cmap='viridis', 
                          alpha=0.7, s=50, edgecolors='white', linewidth=0.5)
axes[1].set_xlabel('Variable X', fontsize=12)
axes[1].set_ylabel('Variable Y', fontsize=12)
axes[1].set_title('Scatter Plot with Color Encoding', fontsize=14, fontweight='bold')
plt.colorbar(scatter, ax=axes[1], label='Y Value')

# Bar chart for categorical comparison
categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports']
values = [45000, 38000, 32000, 28000, 22000]
colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(categories)))
bars = axes[2].bar(categories, values, color=colors, edgecolor='navy', linewidth=1.5)
axes[2].set_xlabel('Category', fontsize=12)
axes[2].set_ylabel('Revenue ($)', fontsize=12)
axes[2].set_title('Revenue by Category', fontsize=14, fontweight='bold')
axes[2].tick_params(axis='x', rotation=45)
for bar, value in zip(bars, values):
    axes[2].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1000,
                f'${value/1000:.0f}K', ha='center', fontsize=10)

# Histogram for distributions
data = np.random.randn(1000)
axes[3].hist(data, bins=30, color='#2ca02c', edgecolor='white', alpha=0.8, density=True)
axes[3].set_xlabel('Value', fontsize=12)
axes[3].set_ylabel('Density', fontsize=12)
axes[3].set_title('Distribution of Values', fontsize=14, fontweight='bold')
axes[3].axvline(x=0, color='red', linestyle='--', linewidth=2, label='Mean')

plt.tight_layout()
plt.savefig('visualization_examples.png', dpi=150, bbox_inches='tight')
plt.show()
```

```python
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Seaborn for statistical visualizations
sns.set_style('whitegrid')
sns.set_palette('husl')

# Load or create sample data
np.random.seed(42)
df = pd.DataFrame({
    'group': np.random.choice(['A', 'B', 'C'], 300),
    'x': np.random.randn(300),
    'y': np.random.randn(300) + np.random.randn(300) * 0.5,
    'category': np.random.choice(['Cat1', 'Cat2', 'Cat3'], 300)
})

# Box plot for statistical comparison
fig, axes = plt.subplots(2, 2, figsize=(14, 12))

sns.boxplot(data=df, x='group', y='y', ax=axes[0, 0], palette='Set2')
axes[0, 0].set_title('Box Plot by Group', fontsize=14, fontweight='bold')
axes[0, 0].set_xlabel('Group', fontsize=12)
axes[0, 0].set_ylabel('Value Y', fontsize=12)

# Violin plot for distribution shape
sns.violinplot(data=df, x='group', y='y', ax=axes[0, 1], palette='Set2')
axes[0, 1].set_title('Violin Plot Showing Distribution', fontsize=14, fontweight='bold')

# Pair plot for multivariate relationships (using sample for speed)
sample_df = df.sample(100, random_state=42)
g = sns.pairplot(sample_df[['x', 'y', 'group']], hue='group', diag_kind='kde', 
                 plot_kws={'alpha': 0.6})

# Heatmap for correlation matrices
corr_matrix = df[['x', 'y']].corr()
sns.heatmap(corr_matrix, annot=True, cmap='RdBu_r', center=0, 
            ax=axes[1, 1], fmt='.3f', square=True, linewidths=0.5)
axes[1, 1].set_title('Correlation Heatmap', fontsize=14, fontweight='bold')

# Joint plot for bivariate distribution
sns.jointplot(data=df, x='x', y='y', kind='hex', 
              marginal_kws={'bins': 30, 'color': '#3498db'})
plt.suptitle('Joint Distribution with Hexbin', fontsize=14, fontweight='bold', y=1.02)

plt.tight_layout()
plt.savefig('statistical_visualizations.png', dpi=150, bbox_inches='tight')
```

```python
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np

# Interactive visualizations with Plotly
np.random.seed(42)
df = pd.DataFrame({
    'date': pd.date_range('2023-01-01', periods=365),
    'value': np.cumsum(np.random.randn(365)) + 100,
    'category': np.random.choice(['A', 'B', 'C'], 365),
    'size': np.abs(np.random.randn(365)) * 10 + 20
})

# Interactive time series
fig = px.line(df, x='date', y='value', color='category',
              title='Time Series with Categories',
              labels={'value': 'Price ($)', 'date': 'Date'},
              template='plotly_white')
fig.update_traces(mode='lines+markers')
fig.update_layout(hovermode='x unified')

# Animated scatter plot
fig_anim = px.scatter(df, x='date', y='value', size='size',
                      color='category', animation_frame='date',
                      range_x=[df['date'].min(), df['date'].max()],
                      range_y=[df['value'].min()-10, df['value'].max()+10],
                      title='Animated Time Series')

# Subplots with multiple chart types
from plotly.subplots import make_subplots
fig_sub = make_subplots(rows=2, cols=2,
                        subplot_titles=['Line Chart', 'Bar Chart', 'Box Plot', 'Histogram'],
                        specs=[[{"type": "scatter"}, {"type": "bar"}],
                               [{"type": "box"}, {"type": "histogram"}]])

fig_sub.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6], mode='lines+markers'),
                  row=1, col=1)
fig_sub.add_trace(go.Bar(x=['A', 'B', 'C'], y=[3, 7, 5]),
                  row=1, col=2)
fig_sub.add_trace(go.Box(y=np.random.randn(100), name='Distribution'),
                  row=2, col=1)
fig_sub.add_trace(go.Histogram(x=np.random.randn(100)),
                  row=2, col=2)

fig_sub.update_layout(height=600, title_text='Subplot Dashboard')
fig_sub.show()

# Geographic visualization
df_geo = pd.DataFrame({
    'country': ['USA', 'China', 'India', 'Germany', 'Brazil'],
    'value': [21, 15, 12, 4, 2]
})
fig_geo = px.choropleth(df_geo, locations='country', color='value',
                        color_continuous_scale='Viridis',
                        title='Global Values by Country')
```

## Best Practices

Choose the right chart type based on the relationship you want to show: comparison (bar charts), distribution (histograms, box plots), composition (pie charts, stacked bars), trend (line charts), and relationship (scatter plots). Simplicity is key; remove chart junk like unnecessary gridlines, backgrounds, and 3D effects that don't add information. Use clear, informative titles and axis labels with units where appropriate. Consider your audience and purpose: exploratory visualizations can be quick and rough, while explanatory visualizations for presentations or reports need careful design and annotation. Use consistent color schemes across related visualizations, with sequential colormaps for continuous data and categorical colormaps for discrete groups. Annotate important features with text, arrows, or shaded regions to guide the viewer's attention. Include appropriate context such as sample sizes, time periods, and what axes represent. Test your visualizations with others to ensure they communicate your intended message clearly. When using interactive visualizations, ensure they work without interaction and that interactions are discoverable and intuitive. Remember that the best visualization is often the simplest one that clearly communicates your insight.
