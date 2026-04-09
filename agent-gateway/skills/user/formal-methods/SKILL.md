---
name: formal-methods
description: Formal verification methods
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Specify system behavior formally
- Verify correctness of algorithms
- Prove properties about programs
- Model check systems

## When to use me
When building high-assurance systems where correctness is critical.

## Formal Specification

### Pre/Post Conditions
```python
class FormalSpec:
    """Design by contract"""
    
    def requires(self, *conditions):
        """Precondition decorator"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                for i, cond in enumerate(conditions):
                    if not cond(args[i] if i < len(args) else None):
                        raise PreconditionViolation(
                            f"Precondition {cond.__name__} failed"
                        )
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def ensures(self, *conditions):
        """Postcondition decorator"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                result = func(*args, **kwargs)
                for cond in conditions:
                    if not cond(result):
                        raise PostconditionViolation(
                            f"Postcondition {cond.__name__} failed"
                        )
                return result
            return wrapper
        return decorator


# Example: Sorted list specification
def is_sorted(lst: list) -> bool:
    """Postcondition: list is sorted"""
    for i in range(len(lst) - 1):
        if lst[i] > lst[i + 1]:
            return False
    return True


def non_negative(x: int) -> bool:
    """Precondition: x is non-negative"""
    return x >= 0


def sorted_insert(lst: list, x: int) -> list:
    """Insert x into sorted list lst"""
    result = lst + [x]
    result.sort()
    return result
```

### Invariants
```python
class Invariant:
    """Class and loop invariants"""
    
    @staticmethod
    def class_invariant(cls):
        """Decorator for class invariant"""
        original_init = cls.__init__
        
        def new_init(self, *args, **kwargs):
            original_init(self, *args, **kwargs)
            if not cls.invariant(self):
                raise InvariantViolation("Class invariant violated")
        
        cls.__init__ = new_init
        
        # Check invariant after each public method
        original_methods = [m for m in dir(cls) 
                          if not m.startswith('_') 
                          and callable(getattr(cls, m))]
        
        for method_name in original_methods:
            original_method = getattr(cls, method_name)
            
            def make_wrapper(method):
                def wrapper(self, *args, **kwargs):
                    result = method(self, *args, **kwargs)
                    if not cls.invariant(self):
                        raise InvariantViolation(
                            f"Invariant violated after {method_name}"
                        )
                    return result
                return wrapper
            
            setattr(cls, method_name, make_wrapper(original_method))
        
        return cls


# Example: Stack invariant
@Invariant
class Stack:
    def __init__(self, capacity: int):
        self.items = []
        self.capacity = capacity
    
    def invariant(self):
        """Stack invariant"""
        return (
            len(self.items) >= 0 and
            len(self.items) <= self.capacity
        )
    
    def push(self, item):
        if len(self.items) >= self.capacity:
            raise OverflowError("Stack overflow")
        self.items.append(item)
    
    def pop(self):
        if not self.items:
            raise IndexError("Stack underflow")
        return self.items.pop()
```

### Formal Verification

### Hoare Logic
```python
class HoareTriple:
    """Hoare logic for program verification"""
    
    @staticmethod
    def verify(Pre: Callable, program: Callable, 
              Post: Callable) -> bool:
        """Verify Hoare triple: {P} program {Q}"""
        # In practice, use theorem prover
        pass
    
    @staticmethod
    def assignment(x: str, expr: str, post: str) -> str:
        """Hoare rule for assignment: {Q[x/E]} x := E {Q}"""
        return f"{{{post.replace(x, expr)}}}"
    
    @staticmethod
    def sequence(stmts: List[str], pre: str, post: str) -> str:
        """Hoare rule for sequence"""
        # {P} S1; S2 {R} from {P} S1 {Q}; {Q} S2 {R}
        return pre
    
    @staticmethod
    def conditional(pre: str, cond: str, 
                   post_then: str, post_else: str) -> str:
        """Hoare rule for if"""
        # {P} if B then {Q} else {R} from {P && B} S1 {Q} and {P && !B} S2 {R}
        return f"{{{pre}}}"
```

### Model Checking
```python
class ModelChecker:
    """Simple model checker"""
    
    def __init__(self):
        self.states = set()
        self.transitions = {}
        self.properties = []
    
    def add_state(self, state: str):
        self.states.add(state)
    
    def add_transition(self, from_state: str, to_state: str, 
                      action: str):
        if from_state not in self.transitions:
            self.transitions[from_state] = []
        self.transitions[from_state].append((action, to_state))
    
    def check_reachability(self, start: str, goal: str) -> bool:
        """Check if goal is reachable from start"""
        visited = set()
        stack = [start]
        
        while stack:
            state = stack.pop()
            if state == goal:
                return True
            if state in visited:
                continue
            
            visited.add(state)
            
            for _, next_state in self.transitions.get(state, []):
                stack.append(next_state)
        
        return False
    
    def check_liveness(self, start: str, good_states: Set[str]) -> bool:
        """Check liveness: eventually reach good state"""
        visited = set()
        stack = [start]
        
        while stack:
            state = stack.pop()
            if state in visited:
                continue
            
            visited.add(state)
            
            if state in good_states:
                return True
            
            for _, next_state in self.transitions.get(state, []):
                stack.append(next_state)
        
        return False
    
    def check_safety(self, start: str, 
                    bad_states: Set[str]) -> bool:
        """Check safety: never reach bad state"""
        return not self.check_reachability(start, 
            bad_states.pop() if bad_states else None)
```
