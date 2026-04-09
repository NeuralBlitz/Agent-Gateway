---
name: visualization
description: Data and information visualization
license: MIT
metadata:
  audience: developers
  category: data-science
---

## What I do
- Create effective data visualizations
- Select appropriate chart types
- Design interactive dashboards
- Handle large datasets efficiently
- Apply color and typography
- Tell stories with data

## When to use me
When presenting data, building dashboards, or creating visual reports.

## Key Concepts

### Chart Selection
```
Comparison: Bar, Column, Radar
Distribution: Histogram, Box plot
Relationship: Scatter, Bubble
Composition: Pie, Stacked area
Trend: Line, Area
Part-to-whole: Treemap, Sunburst
```

### Data Visualization Libraries
```python
# Python
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
from bokeh.plotting import figure

# JavaScript
import * as d3 from 'd3';
import Chart from 'chart.js/auto';
import { Vega } from 'vega';
```

### Design Principles
1. Show data, not decoration
2. Maximize data-ink ratio
3. Avoid 3D effects
4. Use color purposefully
5. Include clear labels
6. Provide context

### Interactive Dashboards
```javascript
// Plotly Dash example
import dash
from dash import dcc, html

app = dash.Dash(__name__)
app.layout = html.Div([
    dcc.Graph(id='chart'),
    dcc.Interval(interval=5000)
])
```

### Accessibility in Visualization
- Colorblind-safe palettes
- Patterns + colors
- Screen reader support
- High contrast mode
- Tooltips for detail

### Best Practices
- Start with clean data
- Choose the simplest chart
- Label axes clearly
- Add legends
- Provide context
- Test with real users
