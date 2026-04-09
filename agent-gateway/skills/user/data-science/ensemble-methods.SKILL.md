---
name: Ensemble Methods
category: data-science
description: Combining multiple models to achieve better predictive performance than individual models
---

# Ensemble Methods

## What I do

I enable superior predictive performance by combining predictions from multiple models. By leveraging diversity among models, I can reduce variance, decrease bias, and improve generalization. My techniques are among the most effective methods for winning machine learning competitions and building production systems.

## When to use me

- Maximizing predictive accuracy for critical predictions
- Reducing overfitting in high-variance models
- Combining models with different strengths
- Handling uncertainty through prediction distributions
- Building robust systems for production deployment
- Improving model performance without architectural changes
- Creating confidence estimates for predictions
- Combining heterogeneous model types

## Core Concepts

1. **Bagging**: Training models on bootstrap samples to reduce variance.

2. **Boosting**: Sequentially training models to correct previous errors.

3. **Stacking**: Using predictions as features for meta-learner.

4. **Diversity**: Ensuring models make different errors for ensemble benefit.

5. **Voting**: Combining predictions through majority or weighted voting.

6. **Blending**: Using holdout predictions for stacking.

7. **Ensemble Diversity**: Measuring disagreement between ensemble members.

8. **Weight Optimization**: Learning optimal combination weights.

## Code Examples

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.utils import resample

class BaggingClassifier:
    def __init__(self, base_model_fn, n_estimators=10):
        self.base_model_fn = base_model_fn
        self.n_estimators = n_estimators
        self.estimators = []
    
    def fit(self, X, y, epochs=10):
        for i in range(self.n_estimators):
            X_boot, y_boot = resample(X, y, random_state=i)
            
            model = self.base_model_fn()
            self._train_model(model, X_boot, y_boot, epochs)
            
            self.estimators.append(model)
        
        return self
    
    def predict_proba(self, X):
        predictions = []
        for model in self.estimators:
            with torch.no_grad():
                logits = model(X)
                probs = F.softmax(logits, dim=1)
                predictions.append(probs.numpy())
        
        return np.mean(predictions, axis=0)
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return proba.argmax(axis=1)
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class AdaBoost:
    def __init__(self, base_model_fn, n_estimators=50):
        self.base_model_fn = base_model_fn
        self.n_estimators = n_estimators
        self.estimators = []
        self.estimator_weights = []
    
    def fit(self, X, y, epochs=10):
        n_samples = len(X)
        sample_weights = np.ones(n_samples) / n_samples
        
        for t in range(self.n_estimators):
            X_t, y_t = self._bootstrap_sample(X, y, sample_weights)
            
            model = self.base_model_fn()
            self._train_model(model, X_t, y_t, epochs)
            
            predictions = model.predict(X)
            
            error = np.sum(sample_weights * (predictions != y)) / np.sum(sample_weights)
            
            if error >= 0.5 or error == 0:
                break
            
            alpha = 0.5 * np.log((1 - error) / max(error, 1e-10))
            
            sample_weights = sample_weights * np.exp(alpha * (predictions != y))
            sample_weights = sample_weights / (sample_weights.sum() + 1e-10)
            
            self.estimators.append(model)
            self.estimator_weights.append(alpha)
        
        return self
    
    def predict_proba(self, X):
        predictions = np.zeros((len(X), 2))
        
        for model, weight in zip(self.estimators, self.estimator_weights):
            preds = model.predict_proba(X)
            predictions[:, 1] += weight * preds[:, 1]
            predictions[:, 0] += weight * preds[:, 0]
        
        predictions[:, 1] = predictions[:, 1] / (np.sum(self.estimator_weights) + 1e-10)
        predictions[:, 0] = 1 - predictions[:, 1]
        
        return predictions
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return (proba[:, 1] > 0.5).astype(int)
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class GradientBoosting:
    def __init__(self, base_model_fn, n_estimators=100, learning_rate=0.1):
        self.base_model_fn = base_model_fn
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.models = []
        self.initial_prediction = None
    
    def fit(self, X, y, epochs=10):
        if isinstance(X, torch.Tensor):
            X = X.numpy()
        if isinstance(y, torch.Tensor):
            y = y.numpy()
        
        self.initial_prediction = np.log(np.mean(y) + 1e-10)
        
        F_m = np.full(len(y), self.initial_prediction)
        
        for m in range(self.n_estimators):
            residual = y - F_m
            
            model = self.base_model_fn()
            self._train_regression_model(model, X, residual, epochs)
            
            predictions = model.predict(X)
            
            gamma = self._line_search(F_m, predictions, y)
            
            F_m = F_m + self.learning_rate * gamma * predictions
            
            self.models.append(model)
        
        return self
    
    def predict_proba(self, X):
        if isinstance(X, torch.Tensor):
            X = X.numpy()
        
        F_m = np.full(len(X), self.initial_prediction)
        
        for model in self.models:
            predictions = model.predict(X)
            F_m = F_m + self.learning_rate * predictions
        
        return 1 / (1 + np.exp(-F_m))
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return (proba > 0.5).astype(int)
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class StackingClassifier:
    def __init__(self, base_estimators, meta_learner, n_folds=5):
        self.base_estimators = base_estimators
        self.meta_learner = meta_learner
        self.n_folds = n_folds
        self.fitted_base_estimators = []
    
    def fit(self, X, y, epochs_base=5, epochs_meta=10):
        n_samples = len(X)
        n_estimators = len(self.base_estimators)
        
        oof_predictions = np.zeros((n_samples, n_estimators))
        
        fold_indices = np.array_split(np.arange(n_samples), self.n_folds)
        
        for fold_idx, val_indices in enumerate(fold_indices):
            train_indices = np.concatenate([idx for i, idx in enumerate(fold_indices) if i != fold_idx])
            
            for est_idx, EstClass in enumerate(self.base_estimators):
                model = EstClass()
                
                X_train_fold = torch.tensor(X[train_indices], dtype=torch.float32)
                y_train_fold = torch.tensor(y[train_indices], dtype=torch.long)
                
                self._train_model(model, X_train_fold, y_train_fold, epochs_base)
                
                X_val_fold = torch.tensor(X[val_indices], dtype=torch.float32)
                with torch.no_grad():
                    logits = model(X_val_fold)
                    probs = F.softmax(logits, dim=1)
                
                oof_predictions[val_indices, est_idx] = probs[:, 1].numpy()
        
        for EstClass in self.base_estimators:
            model = EstClass()
            X_full = torch.tensor(X, dtype=torch.float32)
            y_full = torch.tensor(y, dtype=torch.long)
            self._train_model(model, X_full, y_full, epochs_base)
            self.fitted_base_estimators.append(model)
        
        meta_X = oof_predictions
        meta_y = torch.tensor(y, dtype=torch.long)
        
        self._train_model(self.meta_learner, meta_X, meta_y, epochs_meta)
        
        return self
    
    def predict_proba(self, X):
        n_estimators = len(self.fitted_base_estimators)
        predictions = np.zeros((len(X), n_estimators))
        
        X_tensor = torch.tensor(X, dtype=torch.float32)
        
        for est_idx, model in enumerate(self.fitted_base_estimators):
            with torch.no_grad():
                logits = model(X_tensor)
                probs = F.softmax(logits, dim=1)
                predictions[:, est_idx] = probs[:, 1].numpy()
        
        meta_X = torch.tensor(predictions, dtype=torch.float32)
        with torch.no_grad():
            meta_probs = F.softmax(self.meta_learner(meta_X), dim=1)
        
        return meta_probs.numpy()
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class VotingClassifier:
    def __init__(self, estimators, voting="soft", weights=None):
        self.estimators = estimators
        self.voting = voting
        self.weights = weights or [1.0] * len(estimators)
    
    def fit(self, X, y, epochs=10):
        for name, EstClass in self.estimators:
            model = EstClass()
            self._train_model(model, X, y, epochs)
            self.fitted_estimators.append(model)
        
        return self
    
    def predict_proba(self, X):
        predictions = []
        for model, weight in zip(self.fitted_estimators, self.weights):
            with torch.no_grad():
                logits = model(X)
                probs = F.softmax(logits, dim=1)
                predictions.append(probs * weight)
        
        if self.voting == "soft":
            return torch.stack(predictions).sum(dim=0) / sum(self.weights)
        else:
            votes = torch.stack([p.argmax(dim=1) for p in predictions])
            return votes.mode(dim=0)[0]
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return proba.argmax(dim=1)

class DiversityMeasure:
    def __init__(self):
        pass
    
    def disagreement(self, predictions):
        n_samples, n_models = predictions.shape
        disagreements = 0
        
        for i in range(n_samples):
            for j in range(i + 1, n_models):
                if predictions[i] != predictions[j]:
                    disagreements += 1
        
        return 2 * disagreements / (n_models * (n_models - 1))
    
    def q_statistic(self, predictions, true_labels):
        n_models = predictions.shape[1]
        
        agreement_matrix = np.zeros((n_models, n_models))
        
        for i in range(n_models):
            for j in range(n_models):
                both_correct = np.sum((predictions[:, i] == true_labels) & (predictions[:, j] == true_labels))
                both_wrong = np.sum((predictions[:, i] != true_labels) & (predictions[:, j] != true_labels))
                agreement_matrix[i, j] = (both_correct + both_wrong) / len(true_labels)
        
        return agreement_matrix
```

## Best Practices

1. Prioritize model diversity over individual model performance in ensembles.

2. Use diverse algorithms (neural networks, trees, linear models) for better ensembles.

3. Apply bagging for high-variance models, boosting for high-bias models.

4. Use out-of-bag predictions for stacking to avoid overfitting.

5. Optimize ensemble weights on validation data.

6. Consider computational cost vs. accuracy trade-offs for production.

7. Use proper cross-validation for ensemble evaluation.

8. Apply early stopping to prevent overfitting in boosting.

9. Consider model compression for deploying ensembles.

10. Monitor ensemble calibration for confidence estimates.
