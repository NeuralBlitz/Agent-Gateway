---
name: explainability
description: AI model explainability
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Explain model predictions
- Implement interpretable models
- Create feature importance analysis
- Build visualization tools
- Design trust-building explanations
- Handle regulatory requirements

## When to use me

Use me when:
- Model debugging
- Stakeholder communication
- Regulatory compliance
- Bias detection
- Trust in AI decisions

## Key Concepts

### Explanation Methods
```python
import shap
import lime
from sklearn.inspection import permutation_importance

# SHAP values
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Visualize
shap.summary_plot(shap_values, X_test, feature_names=feature_names)

# LIME explanations
from lime.lime_tabular import LimeTabularExplainer

explainer = LimeTabularExplainer(X_train, feature_names=feature_names)
explanation = explainer.explain_instance(X_test[0], model.predict_proba)

# Permutation importance
result = permutation_importance(model, X_test, y_test, n_repeats=10)
```

### Interpretable Models
- Linear models: Coefficients
- Decision trees: Path visualization
- Rule-based: Explicit rules
- Attention: Attention weights

### Types of Explanations
- **Global**: Overall model behavior
- **Local**: Single prediction
- **Feature**: Feature importance
- **Counterfactual**: What if scenarios
