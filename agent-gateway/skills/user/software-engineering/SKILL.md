---
name: software-engineering
description: Software engineering principles
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: software-development
---

## What I do
- Apply software engineering best practices
- Design maintainable systems
- Implement development workflows
- Ensure code quality

## When to use me
When building software systems using professional practices.

## Software Development Lifecycle

### Requirements Engineering
```python
class Requirement:
    """Software requirement"""
    
    def __init__(self, id: str, title: str, description: str,
                 priority: str, category: str):
        self.id = id
        self.title = title
        self.description = description
        self.priority = priority  # must, should, could, wont
        self.category = category  # functional, non-functional
        self.status = "draft"
        self.testable_criteria = []
    
    def is_testable(self) -> bool:
        """Check if requirement is testable"""
        return len(self.testable_criteria) > 0


class RequirementsManager:
    """Manage requirements"""
    
    def __init__(self):
        self.requirements = []
        self.stakeholders = []
    
    def add_requirement(self, requirement: Requirement):
        self.requirements.append(requirement)
    
    def get_by_priority(self, priority: str) -> List[Requirement]:
        return [r for r in self.requirements if r.priority == priority]
    
    def trace_to_code(self, requirement_id: str, 
                     code_elements: List[str]):
        """Trace requirement to code elements"""
        for req in self.requirements:
            if req.id == requirement_id:
                req.code_trace = code_elements
```

## Design Patterns

### Creational
```python
class Singleton:
    """Singleton pattern"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance


class Factory:
    """Factory pattern"""
    
    @staticmethod
    def create_product(product_type: str):
        products = {
            "a": ProductA,
            "b": ProductB
        }
        return products[product_type]()


class Builder:
    """Builder pattern"""
    
    def __init__(self):
        self.product = Product()
    
    def set_part_a(self, value):
        self.product.a = value
        return self
    
    def set_part_b(self, value):
        self.product.b = value
        return self
    
    def build(self):
        return self.product
```

### Structural
```python
class Adapter:
    """Adapter pattern"""
    
    def __init__(self, adaptee):
        self.adaptee = adaptee
    
    def request(self):
        return self.adaptee.specific_request()


class Decorator:
    """Decorator pattern"""
    
    def __init__(self, component):
        self.component = component
    
    def operation(self):
        return self.component.operation()
```

### Behavioral
```python
class Observer:
    """Observer pattern"""
    
    def __init__(self):
        self.observers = []
    
    def attach(self, observer):
        self.observers.append(observer)
    
    def notify(self, *args):
        for observer in self.observers:
            observer.update(*args)


class Strategy:
    """Strategy pattern"""
    
    def __init__(self, algorithm):
        self.algorithm = algorithm
    
    def execute(self, data):
        return self.algorithm.process(data)
```

## Testing Strategy
```python
class TestPyramid:
    """Testing pyramid implementation"""
    
    @staticmethod
    def unit_tests():
        """Many fast, isolated unit tests"""
        pass
    
    @staticmethod
    def integration_tests():
        """Fewer integration tests"""
        pass
    
    @staticmethod
    def e2e_tests():
        """Few end-to-end tests"""
        pass
```

## Code Quality

### Metrics
```python
class CodeMetrics:
    """Code quality metrics"""
    
    @staticmethod
    def cyclomatic_complexity(control_flow: dict) -> int:
        """Cyclomatic complexity"""
        return control_flow.get("decisions", 0) + 1
    
    @staticmethod
    def cognitive_complexity(code: str) -> int:
        """Cognitive complexity"""
        # Count nesting, jumps, etc.
        return 0
    
    @staticmethod
    def maintainability_index(halstead: dict, 
                            cyclomatic: int, 
                            lines: int) -> float:
        """Maintainability index 0-100"""
        import math
        
        volume = halstead.get("volume", 1)
        mi = 171 - 5.2 * math.log(volume) - \
             0.23 * cyclomatic - 16.2 * math.log(lines)
        
        return max(0, min(100, mi * 100 / 171))
```
