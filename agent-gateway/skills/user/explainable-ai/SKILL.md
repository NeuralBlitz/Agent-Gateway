---
name: explainable-ai
description: Explainable AI (XAI) techniques
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Apply XAI techniques to models
- Generate model-agnostic explanations
- Create interpretable features
- Build trust in AI systems
- Handle fairness and bias

## When to use me

Use me when:
- Regulatory compliance (GDPR, EU AI Act)
- High-stakes decisions
- Debugging model behavior
- Building trust with users

## Key Concepts

### XAI Methods
- **SHAP**: Shapley additive explanations
- **LIME**: Local interpretable model-agnostic
- **Counterfactuals**: What-if analysis
- **Feature importance**: Permutation, tree-based

### SHAP Framework
```python
import shap

# Kernel SHAP for any model
explainer = shap.KernelExplainer(model.predict, X_background)
shap_values = explainer.shap_values(X_test)

# Tree SHAP for tree-based
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Visualization
shap.force_plot(
    explainer.expected_value, 
    shap_values[0,:], 
    X_test.iloc[0,:]
)
```

### Counterfactual Explanations
```python
from dice_ml import Explainer

# Create explainer
explainer = Explainer(model, X_train, outcome_class="target")

# Generate counterfactuals
explanation = explanation.generate_counterfactuals(
    X_test[0:1], 
    total_CFs=3, 
    desired_class="opposite"
)
```

### Fairness
- Demographic parity
- Equalized odds
- Individual fairness
- Bias detection metrics
