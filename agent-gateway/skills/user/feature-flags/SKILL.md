---
name: feature-flags
description: Feature flag implementation and management
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: development
---
## What I do
- Implement feature flags
- Manage feature rollouts
- Implement A/B testing
- Handle percentage rollouts
- Target specific users
- Implement flag dependencies
- Monitor flag performance
- Clean up deprecated flags

## When to use me
When implementing feature flags or managing feature rollouts.

## Feature Flag Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Feature Flag System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Toggle    │    │   Router   │    │  Evaluator │    │
│  │   Engine    │    │   Engine   │    │   Engine   │    │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│         │                   │                   │             │
│         └───────────────────┼───────────────────┘             │
│                             │                                 │
│  ┌───────────────────────────▼───────────────────────────┐    │
│  │              Feature Flag Storage                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐     │    │
│  │  │  Redis  │  │Database │  │  Config Files  │     │    │
│  │  └─────────┘  └─────────┘  └─────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Feature Flag Implementation
```python
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional
from datetime import datetime
import json


@dataclass
class FeatureFlag:
    """Feature flag configuration."""
    key: str
    name: str
    description: str = ""
    enabled: bool = False
    percentage: int = 0  # 0-100
    target_users: list = None
    exclude_users: list = None
    strategies: list = None
    dependencies: list = None
    created_at: datetime = None
    updated_at: datetime = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        self.target_users = self.target_users or []
        self.exclude_users = self.exclude_users or []
        self.strategies = self.strategies or []
        self.dependencies = self.dependencies or []
        self.metadata = self.metadata or {}


class FeatureFlagEngine:
    """Feature flag evaluation engine."""
    
    def __init__(self, storage):
        self.storage = storage
        self.cache = {}
        self.cache_ttl = 60  # seconds
    
    def is_enabled(
        self,
        flag_key: str,
        user_id: str = None,
        context: Dict[str, Any] = None
    ) -> bool:
        """Check if a feature flag is enabled."""
        flag = self._get_flag(flag_key)
        
        if not flag:
            return False
        
        if not flag.enabled:
            return False
        
        # Check dependencies first
        for dep_key in flag.dependencies:
            if not self.is_enabled(dep_key, user_id, context):
                return False
        
        # Check if user is in target list
        if flag.target_users and user_id in flag.target_users:
            return True
        
        # Check if user is excluded
        if flag.exclude_users and user_id in flag.exclude_users:
            return False
        
        # Check percentage rollout
        if flag.percentage > 0:
            return self._in_percentage(flag_key, user_id, flag.percentage)
        
        # Check custom strategies
        for strategy in flag.strategies:
            if self._evaluate_strategy(strategy, user_id, context):
                return True
        
        return flag.enabled
    
    def _get_flag(self, flag_key: str) -> Optional[FeatureFlag]:
        """Get flag from cache or storage."""
        if flag_key in self.cache:
            cached_flag, timestamp = self.cache[flag_key]
            if (datetime.utcnow() - timestamp).seconds < self.cache_ttl:
                return cached_flag
        
        flag = self.storage.get_flag(flag_key)
        if flag:
            self.cache[flag_key] = (flag, datetime.utcnow())
        
        return flag
    
    def _in_percentage(
        self,
        flag_key: str,
        user_id: str,
        percentage: int
    ) -> bool:
        """Determine if user is in percentage rollout."""
        if not user_id:
            user_id = "anonymous"
        
        # Consistent hashing based on user_id
        hash_value = hash(f"{flag_key}:{user_id}")
        bucket = hash_value % 100
        
        return bucket < percentage
    
    def _evaluate_strategy(
        self,
        strategy: Dict[str, Any],
        user_id: str,
        context: Dict[str, Any]
    ) -> bool:
        """Evaluate custom strategy."""
        strategy_type = strategy.get("type")
        
        if strategy_type == "user_id":
            return user_id in strategy.get("values", [])
        
        if strategy_type == "attribute":
            attr = strategy.get("attribute")
            op = strategy.get("operator")
            value = strategy.get("value")
            
            user_attr = context.get(attr) if context else None
            
            return self._compare(user_attr, op, value)
        
        return False
    
    def _compare(self, actual, operator: str, expected) -> bool:
        """Compare values based on operator."""
        operators = {
            "equals": lambda a, e: a == e,
            "not_equals": lambda a, e: a != e,
            "contains": lambda a, e: e in a if a else False,
            "starts_with": lambda a, e: a.startswith(e) if a else False,
            "ends_with": lambda a, e: a.endswith(e) if a else False,
            "greater_than": lambda a, e: a > e if a and e else False,
            "less_than": lambda a, e: a < e if a and e else False,
        }
        
        op_func = operators.get(operator)
        if op_func:
            return op_func(actual, expected)
        
        return False


# Decorator for feature flags
def feature_flag(flag_key: str, default: bool = False):
    """Decorator to conditionally enable functionality."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            engine = get_feature_flag_engine()
            
            # Get user from request context
            user_id = get_current_user_id()
            
            if engine.is_enabled(flag_key, user_id):
                return func(*args, **kwargs)
            else:
                return default
            
        return wrapper
    return decorator


# Usage
@feature_flag("new-checkout-flow", default=None)
async def process_checkout():
    """New checkout flow."""
    return await process_new_checkout()


@feature_flag("beta-analytics")
def get_analytics_dashboard():
    """Get beta analytics dashboard."""
    return render_beta_dashboard()


# Context manager for features
class FeatureContext:
    """Context for feature flag evaluation."""
    
    def __init__(self, user_id: str = None, **attributes):
        self.user_id = user_id
        self.attributes = attributes
    
    def is_enabled(self, flag_key: str) -> bool:
        engine = get_feature_flag_engine()
        return engine.is_enabled(flag_key, self.user_id, self.attributes)


# Usage
context = FeatureContext(
    user_id="user_123",
    plan="enterprise",
    region="us-east",
    age_days=30
)

if context.is_enabled("new-feature"):
    show_new_feature()
else:
    show_legacy_feature()
```

## A/B Testing with Flags
```python
@dataclass
class ABTest:
    """A/B test configuration."""
    name: str
    variants: list[str]
    weights: list[int]
    metric_name: str
    description: str = ""


class ABTestEngine:
    """A/B test evaluation engine."""
    
    def __init__(self, flag_engine: FeatureFlagEngine):
        self.flag_engine = flag_engine
        self.tests: Dict[str, ABTest] = {}
        self.user_assignments: Dict[str, str] = {}
    
    def register_test(self, test: ABTest) -> None:
        """Register a new A/B test."""
        self.tests[test.name] = test
    
    def get_variant(
        self,
        test_name: str,
        user_id: str = None
    ) -> Optional[str]:
        """Get which variant a user is in."""
        if test_name not in self.tests:
            return None
        
        assignment_key = f"{test_name}:{user_id}"
        
        # Check existing assignment
        if assignment_key in self.user_assignments:
            return self.user_assignments[assignment_key]
        
        test = self.tests[test_name]
        
        # Assign variant
        variant = self._assign_variant(test_name, test, user_id)
        
        self.user_assignments[assignment_key] = variant
        
        return variant
    
    def _assign_variant(
        self,
        test_name: str,
        test: ABTest,
        user_id: str
    ) -> str:
        """Assign user to variant based on weights."""
        if not user_id:
            user_id = "anonymous"
        
        # Hash for consistent assignment
        hash_value = hash(f"{test_name}:{user_id}")
        bucket = hash_value % 100
        
        # Assign based on cumulative weights
        cumulative = 0
        for variant, weight in zip(test.variants, test.weights):
            cumulative += weight
            if bucket < cumulative:
                return variant
        
        return test.variants[-1]  # Default to last variant
    
    def track_event(
        self,
        test_name: str,
        user_id: str,
        event_name: str,
        properties: Dict[str, Any] = None
    ) -> None:
        """Track A/B test event."""
        variant = self.get_variant(test_name, user_id)
        
        if variant:
            # Send to analytics
            analytics.track(
                event=f"ab_test:{event_name}",
                user_id=user_id,
                properties={
                    "test_name": test_name,
                    "variant": variant,
                    **(properties or {})
                }
            )
    
    def get_test_results(self, test_name: str) -> Dict[str, Any]:
        """Get A/B test results."""
        # Aggregate events by variant
        # Calculate conversion rates
        # Return statistical analysis
        pass
```

## Best Practices
```
Feature Flag Best Practices:

1. Keep flags simple
   One flag per feature
   Avoid complex conditions

2. Use meaningful names
   Descriptive flag names
   Include feature context

3. Document flags
   Purpose of each flag
   Expected removal date

4. Remove old flags
   Technical debt
   Clean up after rollout

5. Use proper targeting
   Percentage rollouts
   User segmentation

6. Monitor performance
   Track flag metrics
   Performance impact

7. Test in production
   Canary releases
   Gradual rollouts

8. Separate concerns
   Feature flags from config
   Don't use for environment

9. Version control
   Store flags in repo
   Review flag changes

10. Have a process
    Approval for production
    Rollback procedures
```
