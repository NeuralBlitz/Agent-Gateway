---
name: ai-ethics
description: AI ethics principles and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: ethics
---

## What I do
- Identify ethical issues in AI systems
- Ensure fairness and bias mitigation
- Implement transparency and explainability
- Design for accountability
- Protect privacy in ML systems

## When to use me
When building AI/ML systems that make decisions affecting people.

## Ethical AI Framework

### Fairness
```python
from typing import List, Dict
import numpy as np

class FairnessAuditor:
    """Audit AI systems for fairness"""
    
    def __init__(self):
        self.protected_attributes = ["race", "gender", "age", 
                                      "disability", "religion"]
    
    def calculate_disparate_impact(self, predictions: np.ndarray,
                                   sensitive_attr: np.ndarray,
                                   threshold: float = 0.8) -> Dict:
        """Calculate disparate impact ratio"""
        groups = np.unique(sensitive_attr)
        
        if len(groups) < 2:
            return {"error": "Need multiple groups"}
        
        positive_rates = {}
        for group in groups:
            mask = sensitive_attr == group
            positive_rates[group] = predictions[mask].mean()
        
        # Calculate impact ratio
        reference_rate = positive_rates[groups[0]]
        ratios = {}
        
        for group, rate in positive_rates.items():
            if reference_rate > 0:
                ratios[group] = rate / reference_rate
        
        return {
            "positive_rates": positive_rates,
            "ratios": ratios,
            "fails_disparate_impact": any(r < threshold for r in ratios.values())
        }
    
    def calculate_equalized_odds(self, predictions: np.ndarray,
                               labels: np.ndarray,
                               sensitive_attr: np.ndarray) -> Dict:
        """Check equalized odds (true positive rate equality)"""
        groups = np.unique(sensitive_attr)
        
        tpr_by_group = {}
        fpr_by_group = {}
        
        for group in groups:
            mask = sensitive_attr == group
            tp = ((predictions == 1) & (labels == 1) & mask).sum()
            fp = ((predictions == 1) & (labels == 0) & mask).sum()
            tn = ((predictions == 0) & (labels == 0) & mask).sum()
            fn = ((predictions == 0) & (labels == 1) & mask).sum()
            
            tpr_by_group[group] = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr_by_group[group] = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        return {
            "true_positive_rates": tpr_by_group,
            "false_positive_rates": fpr_by_group,
            "equalized": self._check_equalized(tpr_by_group, fpr_by_group)
        }
    
    def mitigate_bias(self, model, X: np.ndarray, 
                     sensitive_attr: np.ndarray,
                     method: str = "reweighting") -> np.ndarray:
        """Apply bias mitigation technique"""
        if method == "reweighting":
            return self._reweighting_mitigation(X, sensitive_attr)
        elif method == "threshold":
            return self._threshold_adjustment(X, sensitive_attr)
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def _reweighting_mitigation(self, X, sensitive_attr) -> np.ndarray:
        """Reweighting-based fairness intervention"""
        # Compute weights to equalize outcomes
        return X  # Simplified
```

### Transparency and Explainability
```python
class ModelExplainer:
    """Explain model predictions"""
    
    def __init__(self, model):
        self.model = model
    
    def explain_prediction(self, instance: np.ndarray,
                          method: str = "shap") -> Dict:
        """Explain individual prediction"""
        if method == "shap":
            return self._shap_explanation(instance)
        elif method == "lime":
            return self._lime_explanation(instance)
        elif method == "feature_importance":
            return self._feature_importance_explanation(instance)
    
    def _feature_importance_explanation(self, instance: np.ndarray) -> Dict:
        """Global feature importance explanation"""
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            return {
                "method": "feature_importance",
                "importances": importances.tolist(),
                "top_features": np.argsort(importances)[-5:][::-1].tolist()
            }
        return {"error": "Model does not support feature importance"}
    
    def generate_model_cards(self, model, training_data: Dict,
                            performance: Dict) -> Dict:
        """Generate model documentation (model card)"""
        return {
            "model_name": model.__class__.__name__,
            "overview": "Description of model purpose",
            "owner": "Team responsible",
            "training_data": {
                "dataset": training_data.get("name"),
                "size": training_data.get("size"),
                "sources": training_data.get("sources")
            },
            "performance": {
                "metrics": performance.get("metrics"),
                "evaluation_data": performance.get("test_size")
            },
            "fairness": {
                "evaluated_groups": [],
                "known_biases": []
            },
            "limitations": "Known model limitations",
            "use_cases": "Intended use cases",
            "caveats": "Additional caveats"
        }
```

### Accountability
```python
class AIAccountability:
    """Ensure AI system accountability"""
    
    def __init__(self):
        self.audit_trail = []
    
    def log_decision(self, decision_id: str, input_data: Dict,
                    prediction: Any, model_version: str,
                    user_id: str = None):
        """Log AI decision for accountability"""
        entry = {
            "decision_id": decision_id,
            "timestamp": datetime.now().isoformat(),
            "input_data_hash": hash(str(input_data)),
            "prediction": prediction,
            "model_version": model_version,
            "user_id": user_id,
            "ip_address": get_client_ip()
        }
        
        self.audit_trail.append(entry)
        self._write_to_immutable_store(entry)
    
    def generate_audit_report(self, start_date: datetime,
                             end_date: datetime) -> Dict:
        """Generate audit report for date range"""
        relevant_entries = [
            e for e in self.audit_trail
            if start_date <= e["timestamp"] <= end_date
        ]
        
        return {
            "total_decisions": len(relevant_entries),
            "unique_users": len(set(e["user_id"] for e in relevant_entries)),
            "model_versions": set(e["model_version"] for e in relevant_entries),
            "predictions_by_outcome": self._count_outcomes(relevant_entries)
        }
    
    def implement_human_oversight(self, prediction: Any,
                                 threshold: float = 0.8) -> Dict:
        """Determine if human review is needed"""
        confidence = prediction.get("confidence", 1.0)
        
        return {
            "requires_human_review": confidence < threshold,
            "confidence": confidence,
            "threshold": threshold,
            "review_reason": "Low confidence" if confidence < threshold else None
        }
```

### Privacy Protection
```python
class PrivacyProtection:
    """Privacy-preserving ML techniques"""
    
    def apply_differential_privacy(self, gradients: np.ndarray,
                                   epsilon: float = 1.0) -> np.ndarray:
        """Add noise for differential privacy"""
        sensitivity = np.max(np.linalg.norm(gradients, axis=1))
        noise = np.random.laplace(0, sensitivity / epsilon, gradients.shape)
        return gradients + noise
    
    def anonymize_data(self, data: pd.DataFrame,
                      quasi_identifiers: List[str],
                      sensitive_attributes: List[str]) -> pd.DataFrame:
        """Apply k-anonymity"""
        # Generalize quasi-identifiers
        for col in quasi_identifiers:
            data[col] = self._generalize(data[col], col)
        
        return data
    
    def _generalize(self, series, col_name):
        """Generalize values for k-anonymity"""
        if col_name == "age":
            return pd.cut(series, bins=[0, 18, 30, 45, 60, 100], 
                        labels=["0-17", "18-29", "30-44", "45-59", "60+"])
        return series
```
