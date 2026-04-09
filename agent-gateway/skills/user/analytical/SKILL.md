---
name: analytical
description: Analytical methods and techniques
license: MIT
compatibility: opencode
metadata:
  audience: scientists, analysts, researchers
  category: chemistry
---

## What I do

- Apply quantitative and qualitative analysis techniques
- Interpret experimental data and measurements
- Validate analytical procedures and results
- Select appropriate analytical methods for specific problems
- Ensure measurement traceability and uncertainty quantification
- Apply statistical methods for data analysis

## When to use me

- When designing analytical experiments or measurements
- When selecting appropriate analytical techniques for a problem
- When interpreting experimental results and error analysis
- When developing or validating analytical protocols
- When applying quality assurance principles to measurements

## Key Concepts

### Analytical Workflow

1. Problem definition and method selection
2. Sampling and sample preparation
3. Measurement and data acquisition
4. Data processing and analysis
5. Results interpretation and reporting
6. Quality assurance and validation

### Measurement Uncertainty

```python
# Example: Combined uncertainty calculation
import numpy as np

def combined_uncertainty(uncertainty_a, uncertainty_b):
    """Calculate combined standard uncertainty."""
    return np.sqrt(uncertainty_a**2 + uncertainty_b**2)

def relative_uncertainty(value, uncertainty):
    """Calculate relative uncertainty."""
    return (uncertainty / abs(value)) * 100
```

### Statistical Analysis

- Mean, median, mode: Central tendency
- Standard deviation, variance: Dispersion
- Confidence intervals: Precision estimation
- t-tests, ANOVA: Hypothesis testing
- Regression analysis: Correlation and prediction
- Detection limits: LOD, LOQ determination
