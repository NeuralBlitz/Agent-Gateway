---
name: statistical-learning
description: Statistical learning methods
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Apply statistical methods to learning problems
- Build regression and classification models
- Perform hypothesis testing and inference
- Estimate model parameters
- Evaluate model uncertainty
- Design experiments and A/B tests

## When to use me

Use me when:
- Building predictive models with uncertainty
- Interpreting model decisions
- Designing experiments
- Making data-driven decisions
- Understanding model confidence

## Key Concepts

### Regression Methods
```python
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import PolynomialFeatures
from sklearn.model_selection import cross_val_score

# Simple Linear Regression
model = LinearRegression()
model.fit(X, y)
y_pred = model.predict(X)

# Regularized Regression
ridge = Ridge(alpha=1.0)  # L2 penalty
lasso = Lasso(alpha=1.0)  # L1 penalty

# Polynomial Features
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)

# Cross-validation
scores = cross_val_score(model, X, y, cv=5, scoring='r2')
```

### Classification
```python
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

# Logistic Regression
log_reg = LogisticRegression()
log_reg.fit(X, y)

# Probabilistic outputs
probs = log_reg.predict_proba(X)
pred = log_reg.predict(X)

# Naive Bayes (generative)
nb = GaussianNB()
nb.fit(X, y)

# LDA (discriminative)
lda = LinearDiscriminantAnalysis()
lda.fit(X, y)
```

### Model Evaluation
```python
from sklearn.metrics import (accuracy_score, precision_score, 
    recall_score, f1_score, roc_auc_score, confusion_matrix)

# Classification metrics
accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='weighted')
recall = recall_score(y_true, y_pred, average='weighted')
f1 = f1_score(y_true, y_pred, average='weighted')
auc = roc_auc_score(y_true, probas)

# Regression metrics
from sklearn.metrics import mean_squared_error, r2_score
mse = mean_squared_error(y_true, y_pred)
r2 = r2_score(y_true, y_pred)
```

### Statistical Inference
- Confidence intervals
- Hypothesis testing (t-test, ANOVA)
- P-values and significance
- Bootstrap methods
- Bayesian inference
