---
name: data-visualization
description: Data visualization techniques
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: data-science
---

## What I do

- Create effective data visualizations
- Design dashboards and reports
- Choose appropriate chart types
- Implement interactive visualizations
- Apply color theory and design principles
- Tell stories with data
- Build self-service analytics

## When to use me

Use me when:
- Presenting data to stakeholders
- Building analytics dashboards
- Exploring data patterns
- Creating reports and infographics
- Communicating insights visually

## Key Concepts

### Chart Selection Guide
| Relationship | Chart Type |
|--------------|------------|
| Comparison | Bar, Column, Grouped |
| Distribution | Histogram, Box Plot |
| Composition | Pie, Stacked Bar, Treemap |
| Trend | Line, Area |
| Correlation | Scatter Plot |
| Geographic | Choropleth, Map |

### Python Visualization Stack
```python
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

# Seaborn for statistical visualization
sns.set_theme(style="whitegrid")
tips = sns.load_dataset("tips")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Distribution plot
sns.histplot(data=tips, x="total_bill", hue="day", 
             ax=axes[0], kde=True)

# Relationship plot
sns.scatterplot(data=tips, x="total_bill", y="tip", 
                hue="smoker", size="size", ax=axes[1])

plt.tight_layout()
plt.show()

# Interactive with Plotly
fig = px.scatter(tips, x="total_bill", y="tip", 
                  color="smoker", size="size",
                  title="Tips Analysis")
fig.show()
```

### Dashboard Design Principles
- **Clarity**: Clear purpose, minimal clutter
- **Hierarchy**: Most important metrics prominent
- **Consistency**: Unified color, fonts, layout
- **Interactivity**: Allow exploration
- **Responsiveness**: Work on all devices

### BI Tools
- **Tableau**: Enterprise, powerful
- **Power BI**: Microsoft ecosystem
- **Looker**: Data modeling (LookML)
- **Metabase**: Open-source, simple
- **Grafana**: Metrics and monitoring
