---
name: ai-safety
description: AI safety and risk mitigation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: safety
---

## What I do
- Implement AI safety guardrails
- Prevent harmful AI outputs
- Ensure AI system robustness
- Monitor for emergent risks
- Implement human oversight
- Build reliable AI systems

## When to use me
When building AI systems that need safety guarantees and risk mitigation.

## Safety Guardrails

### Input Validation
```python
class AISafetyValidator:
    """Validate inputs for safety"""
    
    def __init__(self):
        self.blocked_patterns = [
            "harmful_content",
            "personally_identifiable",
            "illegal_activity"
        ]
        self.max_length = 10000
    
    def validate_input(self, user_input: str) -> Dict:
        """Validate and sanitize user input"""
        errors = []
        
        # Length check
        if len(user_input) > self.max_length:
            errors.append(f"Input exceeds {self.max_length} characters")
        
        # Pattern detection
        for pattern in self.blocked_patterns:
            if self._matches_blocked(user_input, pattern):
                errors.append(f"Input matches blocked pattern: {pattern}")
        
        # Injection attempts
        if self._is_prompt_injection(user_input):
            errors.append("Potential prompt injection detected")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "sanitized_input": self._sanitize(user_input)
        }
    
    def _is_prompt_injection(self, text: str) -> bool:
        """Detect prompt injection attempts"""
        injection_patterns = [
            "ignore previous",
            "disregard instructions",
            "system prompt",
            "you are now"
        ]
        return any(p.lower() in text.lower() for p in injection_patterns)
```

### Output Filtering
```python
class OutputFilter:
    """Filter AI outputs for safety"""
    
    def __init__(self):
        self.content_filters = {
            "harmful": {"threshold": 0.5, "action": "block"},
            "biased": {"threshold": 0.6, "action": "warn"},
            "toxic": {"threshold": 0.3, "action": "block"}
        }
    
    def filter_output(self, output: str, 
                     content_classifications: Dict) -> Dict:
        """Filter and potentially modify output"""
        violations = []
        
        for category, classification in content_classifications.items():
            if category in self.content_filters:
                threshold = self.content_filters[category]["threshold"]
                
                if classification["score"] > threshold:
                    violations.append({
                        "category": category,
                        "score": classification["score"],
                        "action": self.content_filters[category]["action"]
                    })
        
        if any(v["action"] == "block" for v in violations):
            return {
                "allowed": False,
                "reason": "Content violates safety policy",
                "violations": violations
            }
        
        return {
            "allowed": True,
            "warnings": [v for v in violations if v["action"] == "warn"]
        }
    
    def apply_safety_transformations(self, output: str) -> str:
        """Apply safety transformations to output"""
        # Remove PII
        output = self._redact_pii(output)
        
        # Normalize language
        output = self._neutralize_language(output)
        
        return output
```

### Robustness Testing
```python
class RobustnessTester:
    """Test AI system robustness"""
    
    def __init__(self, model):
        self.model = model
    
    def test_adversarial_inputs(self, test_inputs: List[str]) -> Dict:
        """Test against adversarial perturbations"""
        results = []
        
        for original in test_inputs:
            # Generate perturbations
            perturbed = self._generate_perturbations(original)
            
            original_pred = self.model.predict([original])[0]
            
            for perturbed_input in perturbed:
                perturbed_pred = self.model.predict([perturbed_input])[0]
                
                if perturbed_pred != original_pred:
                    results.append({
                        "original": original,
                        "adversarial": perturbed_input,
                        "original_pred": original_pred,
                        "adversarial_pred": perturbed_pred,
                        "type": "adversarial"
                    })
        
        return {
            "total_tested": len(test_inputs),
            "adversarial_examples": len(results),
            "robustness_score": 1 - len(results) / len(test_inputs) if test_inputs else 1
        }
    
    def test_edge_cases(self, test_cases: List[Dict]) -> Dict:
        """Test edge cases and boundary conditions"""
        findings = []
        
        for test_case in test_cases:
            try:
                result = self.model.predict([test_case["input"]])
                
                if not self._is_valid_output(result):
                    findings.append({
                        "input": test_case["input"],
                        "expected_behavior": test_case["expected"],
                        "actual_behavior": result,
                        "issue": "Invalid output"
                    })
            except Exception as e:
                findings.append({
                    "input": test_case["input"],
                    "issue": f"Exception: {str(e)}"
                })
        
        return {
            "total_cases": len(test_cases),
            "failures": len(findings),
            "findings": findings
        }
```

### Human-in-the-Loop
```python
class HumanInTheLoop:
    """Implement human oversight"""
    
    def __init__(self):
        self.escalation_rules = []
        self.approval_queue = []
    
    def should_escalate(self, prediction: Dict) -> bool:
        """Determine if human review is needed"""
        # High-stakes decisions
        if prediction.get("impact_level") == "high":
            return True
        
        # Low confidence
        if prediction.get("confidence", 1.0) < 0.8:
            return True
        
        # Anomalous predictions
        if self._is_anomalous(prediction):
            return True
        
        # Flagged content categories
        if prediction.get("content_flags"):
            return True
        
        return False
    
    def request_human_review(self, task_id: str, prediction: Dict,
                            context: Dict) -> Dict:
        """Queue task for human review"""
        review_request = {
            "task_id": task_id,
            "prediction": prediction,
            "context": context,
            "status": "pending",
            "priority": "high" if prediction.get("impact_level") == "high" else "normal",
            "created_at": datetime.now()
        }
        
        self.approval_queue.append(review_request)
        
        return {
            "review_id": f"REV-{task_id}",
            "status": "queued",
            "estimated_wait": "5 minutes"
        }
    
    def record_human_decision(self, review_id: str, 
                             decision: str, rationale: str):
        """Record human decision and update model"""
        review = next((r for r in self.approval_queue 
                      if r["task_id"] == review_id), None)
        
        if review:
            review["status"] = "completed"
            review["human_decision"] = decision
            review["rationale"] = rationale
            
            # Update model with human feedback
            self._update_model(review)
```

### Monitoring and Alerting
```python
class AISafetyMonitor:
    """Monitor AI system for safety issues"""
    
    def __init__(self):
        self.metrics = {
            "predictions": [],
            "errors": [],
            "safety_violations": []
        }
    
    def record_prediction(self, prediction: Dict):
        """Record prediction for monitoring"""
        self.metrics["predictions"].append({
            "timestamp": datetime.now(),
            **prediction
        })
        
        # Check for anomalies
        if self._is_anomaly(prediction):
            self._trigger_alert("anomaly", prediction)
    
    def detect_drift(self, reference_distribution: Dict,
                    current_distribution: Dict) -> Dict:
        """Detect distribution drift"""
        drift_score = self._calculate_drift(
            reference_distribution,
            current_distribution
        )
        
        return {
            "drift_detected": drift_score > 0.1,
            "drift_score": drift_score,
            "recommendation": "Retrain model" if drift_score > 0.1 else "Continue monitoring"
        }
    
    def generate_safety_report(self) -> Dict:
        """Generate safety monitoring report"""
        predictions = self.metrics["predictions"]
        
        return {
            "total_predictions": len(predictions),
            "avg_confidence": np.mean([p.get("confidence", 0) for p in predictions]),
            "safety_violations": len(self.metrics["safety_violations"]),
            "error_rate": len(self.metrics["errors"]) / len(predictions) if predictions else 0
        }
```
