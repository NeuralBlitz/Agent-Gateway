---
name: psychometrics
description: Psychometric measurement methods
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: interdisciplinary
---

## What I do

- Design and analyze psychological measurements
- Build and validate questionnaires
- Measure latent traits
- Assess reliability and validity
- Create scoring systems
- Handle survey data analysis

## When to use me

Use me when:
- Building assessment tools
- Measuring user attitudes/personality
- Validating questionnaires
- Creating scoring models

## Key Concepts

### Psychometric Models
```python
import numpy as np
from scipy import stats

# Classical Test Theory
def cronbach_alpha(items):
    """Calculate Cronbach's alpha for reliability"""
    item_scores = np.array(items)
    n_items = item_scores.shape[1]
    
    # Item variances
    item_vars = item_scores.var(axis=0, ddof=1)
    total_var = item_scores.sum(axis=1).var(ddof=1)
    
    alpha = (n_items / (n_items - 1)) * (1 - item_vars.sum() / total_var)
    return alpha

# Item Response Theory (Simplified)
# 1PL Model: P(correct) = 1 / (1 + exp(-(theta - b)))
def logistic_1pl(theta, difficulty):
    return 1 / (1 + np.exp(-(theta - difficulty)))
```

### Reliability Measures
- **Cronbach's Alpha**: Internal consistency
- **Test-retest**: Stability over time
- **Inter-rater**: Agreement between raters
- **Split-half**: Correlation between halves

### Validity Types
- **Content**: Measures intended construct
- **Criterion**: Correlates with outcome
- **Construct**: Theoretical underpinning
- **Face**: Appears valid to examinees

### Factor Analysis
```python
from sklearn.decomposition import FactorAnalysis

# Exploratory factor analysis
fa = FactorAnalysis(n_components=3)
factor_scores = fa.fit_transform(X)

# Interpretation
loadings = fa.components_.T
# High loadings indicate strong factor relationships
```

### Item Analysis
- Difficulty index (p-value)
- Discrimination index
- Item-total correlation
- Response distribution
