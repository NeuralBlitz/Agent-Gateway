---
name: chaos-engineering
description: Chaos engineering principles and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: reliability
---
## What I do
- Design chaos experiments
- Implement fault injection
- Test system resilience
- Handle failures gracefully
- Design for resilience
- Monitor chaos experiments
- Analyze failure modes
- Improve system robustness

## When to use me
When improving system resilience or implementing chaos testing.

## Chaos Experiment Principles
```
Chaos Engineering Principles:

1. Build a Hypothesis
   Define steady state behavior
   Assume failure will happen

2. Vary Real-World Events
   Simulate real failures
   Test edge cases

3. Run Experiments in Production
   Real traffic, real failures
   Learn from production

4. Minimize Blast Radius
   Start small
   Contain failures

5. Automate Experiments
   Continuous validation
   Regular schedules
```

## LitmusChaos Experiment
```yaml
# chaos-engineering/pod-kill-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-kill-chaos
  namespace: litmus
spec:
  appinfo:
    appns: default
    applabel: "app=myapp"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            # Percentage of pods to kill
            - name: TOTAL_CHAOS_DURATION
              value: '30'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: PODS_AFFECTED_PERC
              value: '50'
            - name: KILL_COUNT
              value: '3'


# Network delay experiment
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-delay-chaos
spec:
  appinfo:
    appns: default
    applabel: "app=myapp"
    applkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: network-delay
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: NETWORK_LATENCY
              value: '2000'
            - name: JITTER
              value: '100'
            - name: CONTAINER_RUNTIME
              value: 'docker'
            - name: TARGET_CONTAINER
              value: 'myapp'
```

## Python Chaos Framework
```python
import random
import time
from typing import Callable, Any
from functools import wraps


class ChaosMonkey:
    """Simple chaos monkey for fault injection."""
    
    def __init__(self, failure_rate: float = 0.1):
        self.failure_rate = failure_rate
        self.failures = []
        self.injected_failures = []
    
    def inject_failure(self, func: Callable) -> Callable:
        """Decorator to inject random failures."""
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if self._should_inject_failure():
                self._record_injection("function_failure", func.__name__)
                raise ChaosInjectedError(
                    f"Injected failure in {func.__name__}"
                )
            return func(*args, **kwargs)
        return wrapper
    
    def inject_latency(self, func: Callable) -> Callable:
        """Decorator to inject random latency."""
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if self._should_inject_failure():
                latency = random.uniform(100, 2000)  # ms
                time.sleep(latency / 1000)
                self._record_injection("latency", func.__name__, latency)
            return func(*args, **kwargs)
        return wrapper
    
    def inject_network_error(self, func: Callable) -> Callable:
        """Decorator to simulate network errors."""
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if self._should_inject_failure():
                error = random.choice([
                    ConnectionRefusedError,
                    ConnectionResetError,
                    TimeoutError,
                    OSError,
                ])
                self._record_injection("network_error", func.__name__, str(error))
                raise error("Simulated network error")
            return func(*args, **kwargs)
        return wrapper
    
    def _should_inject_failure(self) -> bool:
        """Determine if failure should be injected."""
        return random.random() < self.failure_rate
    
    def _record_injection(
        self,
        failure_type: str,
        target: str,
        detail: Any = None
    ):
        """Record injected failure."""
        self.injected_failures.append({
            "type": failure_type,
            "target": target,
            "detail": detail,
            "timestamp": time.time(),
        })
    
    def get_injection_stats(self) -> dict:
        """Get statistics on injected failures."""
        return {
            "total_injections": len(self.injected_failures),
            "by_type": self._group_by("type"),
            "by_target": self._group_by("target"),
        }
    
    def _group_by(self, key: str) -> dict:
        """Group failures by key."""
        from collections import defaultdict
        groups = defaultdict(int)
        for f in self.injected_failures:
            groups[f[key]] += 1
        return dict(groups)


class ChaosInjectedError(Exception):
    """Exception raised when chaos is injected."""
    pass
```

## Resilience Patterns
```python
import asyncio
from typing import Callable, TypeVar, Optional
from dataclasses import dataclass


T = TypeVar('T')


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    failure_threshold: int = 5
    success_threshold: int = 2
    timeout_seconds: int = 60


class CircuitBreaker:
    """Circuit breaker for external service calls."""
    
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = self.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.callable_ref = None
    
    def __call__(self, func: Callable) -> Callable:
        self.callable_ref = func
        return self._execute
    
    def _execute(self, *args, **kwargs) -> Any:
        if self.state == self.OPEN:
            if self._should_attempt_reset():
                self.state = self.HALF_OPEN
            else:
                raise CircuitOpenError("Circuit breaker is open")
        
        try:
            result = self.callable_ref(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_reset(self) -> bool:
        if self.last_failure_time is None:
            return True
        return (
            time.time() - self.last_failure_time
        ) >= self.config.timeout_seconds
    
    def _on_success(self) -> None:
        if self.state == self.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self.state = self.CLOSED
                self.failure_count = 0
        else:
            self.failure_count = 0
    
    def _on_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == self.HALF_OPEN:
            self.state = self.OPEN
            self.success_count = 0
        elif self.failure_count >= self.config.failure_threshold:
            self.state = self.OPEN


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open."""
    pass


# Bulkhead pattern
class Bulkhead:
    """Thread pool isolation (bulkhead pattern)."""
    
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_tasks = 0
    
    async def execute(self, coro) -> Any:
        """Execute with bulkhead isolation."""
        async with self.semaphore:
            self.active_tasks += 1
            try:
                return await coro
            finally:
                self.active_tasks -= 1
    
    @property
    def available(self) -> int:
        """Available concurrent slots."""
        return self.semaphore._value


# Retry with jitter
async def retry_with_jitter(
    func: Callable,
    *args,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    **kwargs
) -> Any:
    """Retry with exponential backoff and jitter."""
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            
            if attempt >= max_retries - 1:
                raise
            
            delay = min(
                base_delay * (2 ** attempt),
                max_delay
            )
            jitter = random.uniform(0, delay * 0.1)
            
            await asyncio.sleep(delay + jitter)
    
    raise last_exception
```

## Designing for Failure
```python
# Graceful degradation patterns

class ServiceHealth:
    """Track service health for degradation decisions."""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.success_count = 0
        self.failure_count = 0
        self.last_success_time = None
        self.last_failure_time = None
    
    @property
    def is_healthy(self) -> bool:
        """Check if service is considered healthy."""
        if self.failure_count > 10:
            return False
        return True
    
    @property
    def health_score(self) -> float:
        """Calculate health score (0-1)."""
        total = self.success_count + self.failure_count
        if total == 0:
            return 1.0
        return self.success_count / total
    
    def record_success(self):
        self.success_count += 1
        self.last_success_time = time.time()
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()


class DegradationManager:
    """Manage graceful degradation."""
    
    def __init__(self):
        self.services: Dict[str, ServiceHealth] = {}
    
    def get_service_health(self, name: str) -> ServiceHealth:
        if name not in self.services:
            self.services[name] = ServiceHealth(name)
        return self.services[name]
    
    def should_use_fallback(self, service_name: str) -> bool:
        """Determine if fallback should be used."""
        health = self.get_service_health(service_name)
        
        # Use fallback if service is unhealthy
        if not health.is_healthy:
            return True
        
        # Use fallback if health score is low
        if health.health_score < 0.8:
            return True
        
        return False
    
    def get_fallback_data(
        self,
        service_name: str,
        fallback_type: str = "cache"
    ) -> Any:
        """Get fallback data."""
        if fallback_type == "cache":
            return self._get_cached_fallback(service_name)
        elif fallback_type == "stale":
            return self._get_stale_fallback(service_name)
        elif fallback_type == "static":
            return self._get_static_fallback(service_name)
    
    def _get_cached_fallback(self, service_name: str) -> Any:
        """Get data from cache."""
        # Implementation for cache fallback
        pass
    
    def _get_stale_fallback(self, service_name: str) -> Any:
        """Get stale data."""
        pass
    
    def _get_static_fallback(self, service_name: str) -> Any:
        """Get static fallback data."""
        return {"error": "Service temporarily unavailable"}
```

## Best Practices
```
Chaos Engineering Best Practices:

1. Start with observation
   Define steady state first
   Monitor baseline behavior

2. Begin small
   Single service
   Small percentage

3. Have a stop button
   Kill switch for experiments
   Automatic timeouts

4. Measure impact
   Track metrics
   Compare to baseline

5. Automate experiments
   Regular schedules
   CI/CD integration

6. Learn from failures
   Document findings
   Improve resilience

7. Test critical paths
   Most used features first
   Customer-facing systems

8. Prepare for recovery
   Know how to stop experiments
   Have rollback plan

9. Communicate
   Notify stakeholders
   Runbooks available

10. Make it routine
    Regular game days
    Continuous improvement
```
