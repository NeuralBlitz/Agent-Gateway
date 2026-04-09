---
name: ethics
description: Software engineering ethics
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: ethics
---

## What I do
- Identify ethical implications of code
- Make principled technical decisions
- Consider stakeholders and impacts
- Balance business and societal needs
- Uphold professional standards

## When to use me
When making decisions that affect users, society, or have ethical dimensions.

## Ethical Decision Framework

### Impact Assessment
```python
class EthicalImpactAssessment:
    """Assess ethical implications of technical decisions"""
    
    def __init__(self):
        self.stakeholders = []
    
    def add_stakeholder(self, name: str, impact: str, 
                       vulnerability: float):
        """Add stakeholder to assessment"""
        self.stakeholders.append({
            "name": name,
            "impact": impact,  # positive, negative, neutral
            "vulnerability": vulnerability,  # 0-1
            "voice": "included"  # how much they can influence
        })
    
    def assess_decision(self, decision: str) -> Dict:
        """Assess ethical implications"""
        return {
            "primary_affected": self._identify_primary_affected(),
            "secondary_affected": self._identify_secondary_affected(),
            "power_imbalance": self._assess_power_balance(),
            "vulnerable_populations": self._identify_vulnerable(),
            "long_term_impacts": self._assess_long_term(),
            "alternatives_considered": []
        }
    
    def apply_ethical_principles(self, decision: str) -> Dict:
        """Apply ethical principles to decision"""
        principles = {
            "transparency": self._check_transparency(decision),
            "fairness": self._check_fairness(decision),
            "accountability": self._check_accountability(decision),
            "privacy": self._check_privacy(decision),
            "safety": self._check_safety(decision)
        }
        
        return {
            "principles_satisfied": sum(principles.values()),
            "principles": principles,
            "overall_assessment": "pass" if all(principles.values()) else "review_needed"
        }
```

### Privacy Ethics
```python
class PrivacyEthics:
    """Ethical data handling"""
    
    def __init__(self):
        self.data_principles = {
            "minimization": True,
            "purpose_limitation": True,
            "storage_limitation": True
        }
    
    def evaluate_data_collection(self, data_fields: List[str],
                               stated_purpose: str) -> Dict:
        """Evaluate if data collection is ethical"""
        unnecessary = self._identify_unnecessary_fields(data_fields)
        
        return {
            "fields_collected": len(data_fields),
            "unnecessary_fields": unnecessary,
            "proportionate": len(unnecessary) / len(data_fields) < 0.2,
            "recommendation": "Remove unnecessary fields" if unnecessary else "Proceed"
        }
    
    def check_consent_ethics(self, consent_type: str,
                           user_demographics: Dict) -> Dict:
        """Evaluate ethical validity of consent"""
        concerns = []
        
        # Check for power imbalance
        if user_demographics.get("vulnerable_population"):
            concerns.append("Vulnerable population - ensure true choice")
        
        # Check for adequate information
        if not user_demographics.get("informed"):
            concerns.append("Informed consent not clearly provided")
        
        return {
            "valid": len(concerns) == 0,
            "concerns": concerns
        }
```

### Algorithmic Ethics
```python
class AlgorithmicEthics:
    """Ethics in algorithmic decisions"""
    
    def audit_decision_logic(self, decision_criteria: Dict) -> Dict:
        """Audit decision criteria for ethics"""
        issues = []
        
        # Check for discriminatory criteria
        prohibited = ["race", "gender", "religion", "disability"]
        for criterion in decision_criteria.get("factors", []):
            if criterion in prohibited:
                issues.append(f"Prohibited factor used: {criterion}")
        
        # Check for proxy discrimination
        if self._uses_proxy_discrimination(decision_criteria):
            issues.append("Potential proxy discrimination detected")
        
        return {
            "ethical": len(issues) == 0,
            "issues": issues
        }
    
    def evaluate_transparency(self, explanation_available: bool,
                            explanation_accurate: bool) -> Dict:
        """Evaluate decision transparency"""
        return {
            "transparent": explanation_available and explanation_accurate,
            "explanation_available": explanation_available,
            "explanation_accurate": explanation_accurate,
            "recommendation": "Provide clear explanations" if not explanation_available else "Good"
        }
```

### Professional Responsibility
```python
class ProfessionalEthics:
    """Maintain professional ethical standards"""
    
    ACM_CODE = [
        "Contribute to society and human well-being",
        "Avoid harm",
        "Be honest and trustworthy",
        "Be fair and take action not to discriminate",
        "Respect the work required to produce new ideas",
        "Give proper credit",
        "Do not steal",
        "Honor confidentiality",
        "Improve public understanding of computing",
        "Protect privacy and security"
    ]
    
    def evaluate_ethics_compliance(self, action: str) -> Dict:
        """Check action against professional code"""
        relevant_principles = []
        
        if "data" in action.lower():
            relevant_principles.extend([
                "Protect privacy and security",
                "Avoid harm"
            ])
        
        if "decision" in action.lower():
            relevant_principles.extend([
                "Be fair and take action not to discriminate",
                "Be honest and trustworthy"
            ])
        
        return {
            "action": action,
            "relevant_principles": relevant_principles,
            "compliant": True  # Self-assessment
        }
    
    def handle_ethical_dilemma(self, options: List[Dict]) -> Dict:
        """Navigate ethical dilemmas"""
        scored_options = []
        
        for option in options:
            score = 0
            
            # Score each option
            score += 5 if option.get("minimizes_harm") else 0
            score += 5 if option.get("respects_individuals") else 0
            score += 3 if option.get("transparent") else 0
            score += 3 if option.get("accountable") else 0
            
            scored_options.append({
                "option": option,
                "ethical_score": score
            })
        
        best = max(scored_options, key=lambda x: x["ethical_score"])
        
        return {
            "recommended": best["option"],
            "all_options": scored_options,
            "reasoning": "Highest ethical score with minimal harm"
        }
```

### Responsible Disclosure
```python
class ResponsibleDisclosure:
    """Handle vulnerabilities ethically"""
    
    def __init__(self):
        self.disclosure_policy = {
            "initial_response": "72 hours",
            "public_disclosure": "90 days",
            "coordinated": True
        }
    
    def report_vulnerability(self, vuln: Dict) -> Dict:
        """Responsible vulnerability disclosure"""
        return {
            "steps": [
                "Notify vendor privately",
                "Allow reasonable time to fix",
                "Coordinate public disclosure",
                "Credit researchers (with permission)"
            ],
            "timeline": self.disclosure_policy,
            "do_not": [
                "Exploit for personal gain",
                "Release details before fix available",
                "Target unrelated systems"
            ]
        }
```
