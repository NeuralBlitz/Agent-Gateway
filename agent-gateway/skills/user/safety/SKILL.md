---
name: safety
description: Software safety principles
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: safety
---

## What I do
- Design safe systems
- Implement safety-critical code
- Handle errors gracefully
- Prevent unsafe states
- Test for failure conditions

## When to use me
When building systems where failures could cause harm.

## Safety Engineering

### Failure Mode Analysis
```python
from enum import Enum

class FailureSeverity(Enum):
    CATASTROPHIC = 1  # Loss of life
    CRITICAL = 2      # Severe injury
    MARGINAL = 3      # Minor injury
    NEGLIGIBLE = 4    # No injury

class FailureModeAnalysis:
    """Analyze potential failure modes"""
    
    def __init__(self):
        self.failure_modes = []
    
    def add_failure_mode(self, component: str, failure_mode: str,
                        cause: str, effect: str, severity: FailureSeverity):
        """Add failure mode to analysis"""
        self.failure_modes.append({
            "component": component,
            "failure_mode": failure_mode,
            "cause": cause,
            "effect": effect,
            "severity": severity.value,
            "detection": "unknown",
            "mitigation": "none"
        })
    
    def prioritize_mitigation(self) -> list:
        """Order failure modes by priority"""
        return sorted(
            self.failure_modes,
            key=lambda f: f["severity"]
        )
```

### Defensive Programming
```python
class DefensiveInputValidation:
    """Validate all inputs"""
    
    def validate_and_convert(self, value: Any, expected_type: type,
                           default: Any = None) -> Any:
        """Validate and safely convert input"""
        try:
            if value is None:
                if default is not None:
                    return default
                raise ValueError("Required value is None")
            
            if not isinstance(value, expected_type):
                value = expected_type(value)
            
            return self._validate_range(value)
        
        except (ValueError, TypeError):
            if default is not None:
                return default
            raise
    
    def _validate_range(self, value) -> Any:
        """Validate value is within acceptable range"""
        return value  # Override with range checks

class SafeStateMachine:
    """Implement fail-safe state machine"""
    
    STATES = ["initializing", "ready", "processing", "paused", "error", "stopped"]
    SAFE_STATE = "error"
    
    def __init__(self):
        self.state = "initializing"
        self.previous_state = None
    
    def transition(self, new_state: str) -> bool:
        """Validate and perform state transition"""
        if new_state not in self.STATES:
            return False
        
        if not self._is_valid_transition(self.state, new_state):
            return False
        
        self.previous_state = self.state
        self.state = new_state
        return True
    
    def _is_valid_transition(self, from_state: str, 
                           to_state: str) -> bool:
        """Define valid state transitions"""
        valid_transitions = {
            "initializing": ["ready", "error"],
            "ready": ["processing", "stopped", "error"],
            "processing": ["ready", "paused", "stopped", "error"],
            "paused": ["ready", "stopped", "error"],
            "error": ["stopped"],
            "stopped": []
        }
        
        return to_state in valid_transitions.get(from_state, [])
    
    def handle_failure(self):
        """Move to safe state on failure"""
        self.previous_state = self.state
        self.state = self.SAFE_STATE
```

### Error Handling
```python
import logging

class SafeErrorHandler:
    """Handle errors safely"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def handle_exception(self, exception: Exception, 
                       context: Dict) -> None:
        """Handle exception with appropriate action"""
        error_type = type(exception).__name__
        
        # Log the error
        self.logger.error(
            f"Error in {context.get('operation')}: {error_type}",
            extra=context,
            exc_info=True
        )
        
        # Take corrective action based on severity
        if self._is_critical_error(exception):
            self._trigger_safe_mode()
        else:
            self._attempt_recovery(exception, context)
    
    def _is_critical_error(self, exception: Exception) -> bool:
        """Determine if error is critical"""
        critical_errors = [
            MemoryError,
            SystemError,
            KeyboardInterrupt  # Don't catch Ctrl+C
        ]
        return any(isinstance(exception, e) for e in critical_errors)
    
    def _trigger_safe_mode(self):
        """Enter safe mode for critical errors"""
        # Save state
        # Stop operations gracefully
        # Alert operators
        pass
```

### Resource Safety
```python
class ResourceSafety:
    """Ensure safe resource management"""
    
    @contextmanager
    def managed_resource(self, resource, cleanup: Callable = None):
        """Safely manage resource lifecycle"""
        try:
            yield resource
        finally:
            if cleanup:
                cleanup()
            elif hasattr(resource, "close"):
                resource.close()
    
    def safe_allocation(self, size: int, max_size: int) -> bytes:
        """Safely allocate memory"""
        if size > max_size:
            raise MemoryError(f"Requested {size} exceeds max {max_size}")
        
        return np.empty(size, dtype=np.uint8)

class ConcurrencySafety:
    """Thread-safe operations"""
    
    def __init__(self):
        self.lock = threading.RLock()
    
    @contextmanager
    def critical_section(self):
        """Protect critical section"""
        with self.lock:
            yield
    
    def atomic_update(self, update_fn: Callable) -> Any:
        """Atomically update shared state"""
        with self.lock:
            return update_fn()
```
