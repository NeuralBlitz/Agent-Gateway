---
name: Data Visualization
description: Creating graphical representations of data to communicate insights, patterns, and trends effectively
license: MIT
compatibility: universal
audience: developers, analysts, designers
category: interdisciplinary
---

# Data Visualization

## What I Do

I transform complex datasets into clear, insightful visual representations that help decision-makers understand patterns, trends, and anomalies. I combine statistical knowledge with design principles to create visualizations that tell compelling data stories.

## When to Use Me

- Exploring datasets to find patterns and insights
- Communicating findings to stakeholders
- Creating dashboards for monitoring metrics
- Building reports with data-driven narratives
- Designing interactive data exploration tools
- Choosing appropriate chart types for data stories

## Core Concepts

1. **Chart Selection**: Matching visualization types to data characteristics
2. **Data-Ink Ratio**: Maximizing information, minimizing decoration
3. **Color Theory**: Sequential, diverging, and categorical palettes
4. **Visual Encoding**: Position, length, area, color, angle as data channels
5. **Scales and Axes**: Linear, logarithmic, time, ordinal scales
6. **Interactivity**: Filtering, drilling, linking multiple views
7. **Accessibility in Viz**: Colorblind-safe palettes, alternative text
8. **Dashboard Design**: Layout, hierarchy, and information density
9. **Animation**: Transitions for understanding changes over time
10. **Storytelling**: Narrative structures for data communication

## Code Examples

### D3 Visualization Builder
```javascript
class VisualizationBuilder {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.width = 800;
    this.height = 400;
    this.margin = { top: 20, right: 30, bottom: 40, left: 50 };
    this.svg = null;
  }
  
  initialize() {
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }
  
  createLineChart(xKey, yKey) {
    const x = d3.scaleTime()
      .domain(d3.extent(this.data, d => new Date(d[xKey])))
      .range([0, this.width - this.margin.left - this.margin.right]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d[yKey])])
      .range([this.height - this.margin.top - this.margin.bottom, 0]);
    
    this.svg.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(new Date(d[xKey])))
        .y(d => y(d[yKey]))
      );
    
    this.addAxes(x, y);
    return this;
  }
  
  createBarChart(xKey, yKey) {
    const x = d3.scaleBand()
      .domain(this.data.map(d => d[xKey]))
      .range([0, this.width - this.margin.left - this.margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d[yKey])])
      .range([this.height - this.margin.top - this.margin.bottom, 0]);
    
    this.svg.selectAll('rect')
      .data(this.data)
      .join('rect')
      .attr('x', d => x(d[xKey]))
      .attr('y', d => y(d[yKey]))
      .attr('width', x.bandwidth())
      .attr('height', d => this.height - this.margin.top - this.margin.bottom - y(d[yKey]))
      .attr('fill', '#3b82f6');
    
    this.addAxes(x, y, true);
    return this;
  }
  
  addAxes(x, y, isCategorical = false) {
    this.svg.append('g')
      .attr('transform', `translate(0,${this.height - this.margin.top - this.margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));
    
    this.svg.append('g')
      .call(d3.axisLeft(y));
  }
  
  addTooltip() {
    const tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none');
    
    this.svg.selectAll('rect, circle')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`Value: ${d.value || d[yKey]}`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }
}
```

### Chart Configuration Generator
```javascript
class ChartConfigurator {
  constructor() {
    this.chartTypes = {
      line: { bestFor: ['time series', 'trends'], limits: ['continuous data'] },
      bar: { bestFor: ['categorical comparisons', 'rankings'], limits: ['time series'] },
      scatter: { bestFor: ['correlations', 'outliers'], limits: ['few data points'] },
      pie: { bestFor: ['part-to-whole', 'few categories'], limits: ['many categories'] },
      heatmap: { bestFor: ['patterns', 'density'], limits: ['precise values'] },
      boxplot: { bestFor: ['distributions', 'comparisons'], limits: ['single distributions'] }
    };
  }
  
  recommendChartType(data, goal) {
    const dataCharacteristics = this.analyzeData(data);
    
    let candidates = Object.entries(this.chartTypes)
      .filter(([type, config]) => 
        config.bestFor.some(g => goal.toLowerCase().includes(g))
      );
    
    candidates = candidates.filter(([type, config]) =>
      !config.limits.some(limit => 
        dataCharacteristics.violates.includes(limit)
      )
    );
    
    return candidates[0]?.[0] || 'bar';
  }
  
  analyzeData(data) {
    if (!data.length) return { type: 'empty' };
    
    const sample = data[0];
    const keys = Object.keys(sample);
    
    const types = {
      numeric: keys.filter(k => typeof sample[k] === 'number'),
      temporal: keys.filter(k => 
        sample[k] instanceof Date || 
        !isNaN(Date.parse(sample[k]))
      ),
      categorical: keys.filter(k => typeof sample[k] === 'string')
    };
    
    return {
      hasNumeric: types.numeric.length > 0,
      hasTemporal: types.temporal.length > 0,
      hasCategorical: types.categorical.length > 0,
      violates: []
    };
  }
  
  generateConfig(type, data, options = {}) {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 4
        }
      },
      scales: this.generateScales(type, data)
    };
    
    return { type, data, options: { ...baseConfig, ...options } };
  }
  
  generateScales(type, data) {
    if (['pie', 'doughnut', 'radar'].includes(type)) return {};
    
    return {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.1)' }
      }
    };
  }
}
```

### Real-time Data Stream Visualizer
```javascript
class StreamVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.buffer = [];
    this.maxPoints = options.maxPoints || 100;
    this.updateInterval = options.interval || 1000;
    this.isRunning = false;
  }
  
  start(dataStream) {
    this.dataStream = dataStream;
    this.isRunning = true;
    this.render();
    
    setInterval(() => {
      if (this.isRunning) {
        this.addDataPoint(this.dataStream());
        this.update();
      }
    }, this.updateInterval);
  }
  
  addDataPoint(point) {
    this.buffer.push({
      timestamp: new Date(),
      value: point
    });
    
    if (this.buffer.length > this.maxPoints) {
      this.buffer.shift();
    }
  }
  
  render() {
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }
  
  update() {
    if (!this.ctx) return;
    
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    const maxValue = Math.max(...this.buffer.map(d => d.value));
    const minValue = Math.min(...this.buffer.map(d => d.value));
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#2563eb';
    this.ctx.lineWidth = 2;
    
    this.buffer.forEach((point, index) => {
      const x = padding + (index / (this.maxPoints - 1)) * graphWidth;
      const y = padding + graphHeight - 
        ((point.value - minValue) / (maxValue - minValue)) * graphHeight;
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();
    
    // Draw axes
    this.ctx.strokeStyle = '#ccc';
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, height - padding);
    this.ctx.lineTo(width - padding, height - padding);
    this.ctx.stroke();
    
    // Draw current value
    const lastPoint = this.buffer[this.buffer.length - 1];
    this.ctx.fillStyle = '#2563eb';
    this.ctx.fillText(
      `Current: ${lastPoint.value.toFixed(2)}`,
      width - 100,
      padding + 20
    );
  }
  
  stop() {
    this.isRunning = false;
  }
}
```

## Best Practices

1. Choose the right chart type for your data and message
2. Start axes at zero for accurate comparison (except time series)
3. Use clear titles, labels, and legends
4. Apply color meaningfully and consistently
5. Remove chart junk and maximize data-ink ratio
6. Provide context through reference lines and benchmarks
7. Make visualizations accessible with colorblind-safe palettes
8. Consider mobile and responsive visualization needs
9. Animate changes thoughtfully to aid understanding
10. Iterate based on user testing and feedback
