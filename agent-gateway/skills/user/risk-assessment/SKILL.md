---
name: risk-assessment
description: Security risk identification and analysis
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Identify and categorize security risks
- Assess likelihood and impact of threats
- Prioritize risks for remediation
- Recommend mitigation strategies
- Track risk over time
- Quantify risk in business terms

## When to use me
When evaluating security posture, planning security improvements, or conducting risk assessments for compliance.

## Risk Assessment Framework

### Risk Model
```python
from enum import Enum
from datetime import datetime

class Likelihood(Enum):
    RARE = 1
    UNLIKELY = 2
    POSSIBLE = 3
    LIKELY = 4
    CERTAIN = 5

class Impact(Enum):
    NEGLIGIBLE = 1
    MINOR = 2
    MODERATE = 3
    MAJOR = 4
    CATASTROPHIC = 5

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Risk:
    def __init__(self, id: str, name: str, description: str):
        self.id = id
        self.name = name
        self.description = description
        self.likelihood = None
        self.impact = None
        self.current_controls = []
        self.residual_risk = None
        self.treated_risk = None
    
    def calculate_risk_level(self) -> RiskLevel:
        score = self.likelihood.value * self.impact.value
        
        if score >= 16:
            return RiskLevel.CRITICAL
        elif score >= 10:
            return RiskLevel.HIGH
        elif score >= 5:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def calculate_residual_risk(self) -> int:
        """Risk after current controls"""
        base_score = self.likelihood.value * self.impact.value
        control_effectiveness = sum(c.effectiveness for c in self.current_controls)
        reduction = min(control_effectiveness * 2, 80)  # Max 80% reduction
        return int(base_score * (100 - reduction) / 100)
```

### Risk Assessment Process
```python
class RiskAssessment:
    def __init__(self, name: str):
        self.name = name
        self.created_at = datetime.now()
        self.risks = []
        self.assets = []
    
    def add_asset(self, asset_id: str, name: str, value: str, 
                  classification: str):
        """Register an asset to protect"""
        self.assets.append({
            "id": asset_id,
            "name": name,
            "value": value,
            "classification": classification,
            "dependencies": []
        })
    
    def identify_risks(self) -> list:
        """Systematic risk identification"""
        risk_categories = [
            "Physical Security",
            "Network Security",
            "Application Security",
            "Data Security",
            "Operational Security",
            "Business Continuity"
        ]
        
        for category in risk_categories:
            risks = self._identify_category_risks(category)
            self.risks.extend(risks)
        
        return self.risks
    
    def _identify_category_risks(self, category: str) -> list:
        """Category-specific risk identification"""
        templates = {
            "Application Security": [
                ("R01", "SQL Injection", "Unsanitized database queries"),
                ("R02", "XSS Attack", "Unescaped user output"),
                ("R03", "CSRF", "Missing token validation"),
                ("R04", "Authentication Bypass", "Weak auth mechanisms"),
            ],
            "Data Security": [
                ("R05", "Data Breach", "Unauthorized data access"),
                ("R06", "Data Loss", "Accidental or malicious deletion"),
                ("R07", "Data Exfiltration", "Unauthorized data transfer"),
            ]
        }
        
        risks = []
        for risk_id, name, desc in templates.get(category, []):
            risk = Risk(risk_id, name, desc)
            risks.append(risk)
        
        return risks
    
    def assess_risk(self, risk_id: str, likelihood: Likelihood, 
                    impact: Impact):
        """Assess individual risk"""
        for risk in self.risks:
            if risk.id == risk_id:
                risk.likelihood = likelihood
                risk.impact = impact
                risk.residual_risk = risk.calculate_residual_risk()
                return risk
        
        raise ValueError(f"Risk {risk_id} not found")
    
    def prioritize_risks(self) -> list:
        """Sort risks by severity"""
        return sorted(self.risks, 
                     key=lambda r: r.calculate_risk_level().value,
                     reverse=True)
```

### Risk Treatment
```python
class RiskTreatment:
    def __init__(self):
        self.treatments = []
    
    def recommend_treatment(self, risk: Risk) -> dict:
        """Recommend mitigation strategy"""
        risk_level = risk.calculate_risk_level()
        
        if risk_level == RiskLevel.CRITICAL:
            treatment = "mitigate"
            timeline = "immediate"
            options = [
                "Implement preventive controls",
                "Deploy detection mechanisms",
                "Transfer risk through insurance"
            ]
        elif risk_level == RiskLevel.HIGH:
            treatment = "mitigate"
            timeline = "within 30 days"
            options = [
                "Enhance existing controls",
                "Add monitoring",
                "Implement compensating controls"
            ]
        elif risk_level == RiskLevel.MEDIUM:
            treatment = "accept"  # with monitoring
            timeline = "within 90 days"
            options = [
                "Accept with monitoring",
                "Implement partial mitigation"
            ]
        else:
            treatment = "accept"
            timeline = "as scheduled"
            options = ["Accept risk"]
        
        return {
            "risk_id": risk.id,
            "recommended_treatment": treatment,
            "timeline": timeline,
            "options": options,
            "cost_benefit": self._calculate_cost_benefit(risk, options)
        }
    
    def _calculate_cost_benefit(self, risk: Risk, 
                                options: list) -> dict:
        """Analyze cost vs benefit of treatment"""
        annual_loss_expectancy = self._calculate_ALE(risk)
        
        return {
            "annual_loss_expectancy": annual_loss_expectancy,
            "mitigation_cost": 0,  # Calculate actual cost
            "roi": 0  # Return on investment
        }
    
    def _calculate_ALE(self, risk: Risk) -> int:
        """Annual Loss Expectancy = Likelihood * Impact"""
        return risk.likelihood.value * risk.impact.value * 10000
```

### Continuous Risk Monitoring
```python
class RiskMonitor:
    def __init__(self):
        self.risk_register = {}
    
    def track_risk(self, risk: Risk):
        """Track risk over time"""
        if risk.id not in self.risk_register:
            self.risk_register[risk.id] = []
        
        self.risk_register[risk.id].append({
            "timestamp": datetime.now(),
            "likelihood": risk.likelihood,
            "impact": risk.impact,
            "residual_risk": risk.residual_risk,
            "controls": risk.current_controls
        })
    
    def detect_risk_change(self, risk_id: str) -> dict:
        """Detect significant risk changes"""
        history = self.risk_register.get(risk_id, [])
        if len(history) < 2:
            return {"changed": False}
        
        current = history[-1]
        previous = history[-2]
        
        if current["residual_risk"] > previous["residual_risk"] * 1.2:
            return {
                "changed": True,
                "direction": "increasing",
                "delta": current["residual_risk"] - previous["residual_risk"]
            }
        
        return {"changed": False}
    
    def generate_risk_report(self) -> dict:
        """Generate risk status report"""
        return {
            "total_risks": len(self.risk_register),
            "critical_risks": 0,
            "high_risks": 0,
            "risk_trends": "stable",
            "recommendations": []
        }
```
