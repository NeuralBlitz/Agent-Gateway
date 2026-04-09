---
name: Circuit Breaker
description: Resilience pattern preventing cascade failures by failing fast when a service is unavailable
category: software-development
---
# Circuit Breaker

## What I do

I provide a resilience pattern that prevents cascade failures in distributed systems. The circuit breaker monitors calls to external services and tracks failures. When failures exceed a threshold, the circuit "opens," immediately failing requests without calling the failing service. This allows the failing service time to recover while preventing resource exhaustion. After a cooldown period, the circuit allows test requests to determine if the service has recovered.

## When to use me

Use circuit breakers when your application depends on external services that might fail or become slow. They're essential in microservice architectures, when calling third-party APIs, or when database connections might time out. Circuit breakers protect against cascade failures and help systems degrade gracefully. Don't use them for internal operations that are always fast or when you always want to attempt the call.

## Core Concepts

- **Closed State**: Normal operation, requests pass through
- **Open State**: Failure threshold exceeded, requests fail fast
- **Half-Open State**: Testing if service has recovered
- **Failure Threshold**: Number or percentage of failures to trigger
- **Timeout**: Time before attempting recovery
- **Failure Count**: Tracking consecutive failures
- **Success Count**: Tracking successful calls in half-open state
- **Fallback**: Alternative behavior when circuit is open
- **State Transitions**: Rules for moving between states
- **Metrics**: Monitoring circuit state changes

## Code Examples

### Basic Circuit Breaker Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable, TypeVar, Generic
from uuid import uuid4
import time

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

T = TypeVar("T")

@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout_seconds: float = 60.0
    half_open_max_calls: int = 3

@dataclass
class CircuitBreakerMetrics:
    state: CircuitState
    failure_count: int = 0
    success_count: int = 0
    total_calls: int = 0
    last_failure_time: datetime | None = None
    last_state_change: datetime = datetime.utcnow()

class CircuitBreaker:
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self._name = name
        self._config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: datetime | None = None
        self._last_state_change = datetime.utcnow()
        self._half_open_calls = 0
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def state(self) -> CircuitState:
        self._check_state_transition()
        return self._state
    
    @property
    def metrics(self) -> CircuitBreakerMetrics:
        return CircuitBreakerMetrics(
            state=self.state,
            failure_count=self._failure_count,
            success_count=self._success_count,
            total_calls=self._failure_count + self._success_count,
            last_failure_time=self._last_failure_time,
            last_state_change=self._last_state_change
        )
    
    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        if self.state == CircuitState.OPEN:
            raise CircuitOpenError(
                f"Circuit {self._name} is open. Service unavailable."
            )
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self) -> None:
        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            self._half_open_calls += 1
            
            if self._success_count >= self._config.success_threshold:
                self._transition_to(CircuitState.CLOSED)
        
        elif self._state == CircuitState.CLOSED:
            self._failure_count = 0
    
    def _on_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = datetime.utcnow()
        
        if self._state == CircuitState.HALF_OPEN:
            self._transition_to(CircuitState.OPEN)
        
        elif (
            self._state == CircuitState.CLOSED and
            self._failure_count >= self._config.failure_threshold
        ):
            self._transition_to(CircuitState.OPEN)
    
    def _check_state_transition(self) -> None:
        if self._state == CircuitState.OPEN:
            elapsed = datetime.utcnow() - self._last_state_change
            if elapsed.total_seconds() >= self._config.timeout_seconds:
                self._transition_to(CircuitState.HALF_OPEN)
    
    def _transition_to(self, new_state: CircuitState) -> None:
        old_state = self._state
        self._state = new_state
        self._last_state_change = datetime.utcnow()
        
        if new_state == CircuitState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
        
        elif new_state == CircuitState.HALF_OPEN:
            self._success_count = 0
            self._half_open_calls = 0
        
        print(f"Circuit {self._name}: {old_state} -> {new_state}")

class CircuitOpenError(Exception):
    pass

class CircuitBreakerOpenError(Exception):
    def __init__(self, circuit_name: str):
        self.circuit_name = circuit_name
        super().__init__(f"Circuit breaker '{circuit_name}' is open")
```

### Decorator-Based Circuit Breaker

```python
from functools import wraps
from typing import Callable, TypeVar, Generic

F = TypeVar("F", bound=Callable)

class CircuitBreakerDecorator:
    def __init__(self, circuit: CircuitBreaker):
        self._circuit = circuit
    
    def __call__(self, func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self._circuit.call(func, *args, **kwargs)
        return wrapper

def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    timeout_seconds: float = 60
):
    circuit = CircuitBreaker(
        name=name,
        config=CircuitBreakerConfig(
            failure_threshold=failure_threshold,
            timeout_seconds=timeout_seconds
        )
    )
    decorator = CircuitBreakerDecorator(circuit)
    
    def actual_decorator(func: F) -> F:
        return decorator(func)
    
    return actual_decorator

@circuit_breaker(name="payment-service", failure_threshold=3)
def process_payment(order_id: str, amount: float) -> dict:
    print(f"Processing payment for order {order_id}")
    if amount < 0:
        raise ValueError("Invalid amount")
    return {"order_id": order_id, "status": "paid", "amount": amount}

@circuit_breaker(name="user-service", failure_threshold=5)
def get_user(user_id: str) -> dict:
    print(f"Fetching user {user_id}")
    return {"user_id": user_id, "name": "John Doe"}

for i in range(10):
    try:
        result = process_payment(f"order-{i}", 100.0)
        print(f"Success: {result}")
    except CircuitOpenError as e:
        print(f"Circuit open: {e}")
    except Exception as e:
        print(f"Error: {e}")
```

### Circuit Breaker with Fallback

```python
from abc import ABC, abstractmethod
from typing import Callable, Optional, Generic

class FallbackHandler(ABC):
    @abstractmethod
    def get_fallback(self, circuit_name: str, error: Exception) -> object:
        pass

class CircuitBreakerWithFallback(CircuitBreaker):
    def __init__(
        self,
        name: str,
        config: CircuitBreakerConfig = None,
        fallback_handler: FallbackHandler | None = None
    ):
        super().__init__(name, config)
        self._fallback_handler = fallback_handler
    
    def call(
        self,
        func: Callable[..., T],
        *args,
        fallback: Optional[Callable[..., T]] = None,
        **kwargs
    ) -> T:
        try:
            return super().call(func, *args, **kwargs)
        except CircuitOpenError:
            if fallback:
                return fallback()
            if self._fallback_handler:
                return self._fallback_handler.get_fallback(self._name, CircuitOpenError(""))
            raise

class DefaultFallbackHandler(FallbackHandler):
    def __init__(self):
        self._fallback_results = {}
    
    def set_fallback_result(self, circuit_name: str, result: object) -> None:
        self._fallback_results[circuit_name] = result
    
    def get_fallback(self, circuit_name: str, error: Exception) -> object:
        return self._fallback_results.get(circuit_name, {"status": "degraded"})

class PaymentServiceWithCircuitBreaker:
    def __init__(self, fallback_handler: FallbackHandler):
        self._circuit = CircuitBreakerWithFallback(
            name="payment-service",
            fallback_handler=fallback_handler
        )
    
    def process_payment(self, order_id: str, amount: float) -> dict:
        def primary_payment():
            return self._actual_payment(order_id, amount)
        
        def fallback_payment():
            return {"order_id": order_id, "status": "pending", "source": "fallback"}
        
        return self._circuit.call(
            primary_payment,
            fallback=fallback_payment
        )
    
    def _actual_payment(self, order_id: str, amount: float) -> dict:
        if amount > 10000:
            raise ValueError("Amount exceeds limit")
        return {"order_id": order_id, "status": "paid", "amount": amount}
```

### Multi-Circuit Breaker Manager

```python
from dataclasses import dataclass
from datetime import datetime
from typing import dict

@dataclass
class CircuitSummary:
    name: str
    state: CircuitState
    failure_count: int
    success_count: int
    last_state_change: datetime

class CircuitManager:
    def __init__(self):
        self._circuits: dict[str, CircuitBreaker] = {}
    
    def get_circuit(self, name: str, config: CircuitBreakerConfig = None) -> CircuitBreaker:
        if name not in self._circuits:
            self._circuits[name] = CircuitBreaker(name, config)
        return self._circuits[name]
    
    def remove_circuit(self, name: str) -> None:
        if name in self._circuits:
            del self._circuits[name]
    
    def get_all_states(self) -> list[CircuitSummary]:
        return [
            CircuitSummary(
                name=name,
                state=circuit.state,
                failure_count=circuit.metrics.failure_count,
                success_count=circuit.metrics.success_count,
                last_state_change=circuit.metrics.last_state_change
            )
            for name, circuit in self._circuits.items()
        ]
    
    def reset_all(self) -> None:
        for circuit in self._circuits.values():
            circuit._transition_to(CircuitState.CLOSED)

class CircuitBreakerContext:
    def __init__(self, manager: CircuitManager):
        self._manager = manager
    
    def __getitem__(self, name: str) -> CircuitBreaker:
        return self._manager.get_circuit(name)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

circuit_manager = CircuitManager()
circuits = CircuitBreakerContext(circuit_manager)

circuits["payment"].call(process_payment, "order-1", 100)
circuits["user"].call(get_user, "user-1")
```

### Async Circuit Breaker

```python
import asyncio
from typing import Callable, Awaitable

class AsyncCircuitBreaker:
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self._name = name
        self._config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: datetime | None = None
        self._last_state_change = datetime.utcnow()
        self._lock = asyncio.Lock()
    
    @property
    def state(self) -> CircuitState:
        return self._state
    
    async def call(
        self,
        func: Callable[..., Awaitable[T]],
        *args,
        **kwargs
    ) -> T:
        async with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._state = CircuitState.HALF_OPEN
                else:
                    raise CircuitOpenError(f"Circuit {self._name} is open")
        
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        
        except Exception as e:
            await self._on_failure()
            raise
    
    async def _should_attempt_reset(self) -> bool:
        elapsed = datetime.utcnow() - self._last_state_change
        return elapsed.total_seconds() >= self._config.timeout_seconds
    
    async def _on_success(self) -> None:
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self._config.success_threshold:
                    self._transition_to(CircuitState.CLOSED)
            
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0
    
    async def _on_failure(self) -> None:
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = datetime.utcnow()
            
            if self._state == CircuitState.HALF_OPEN:
                self._transition_to(CircuitState.OPEN)
            
            elif self._failure_count >= self._config.failure_threshold:
                self._transition_to(CircuitState.OPEN)
    
    def _transition_to(self, new_state: CircuitState) -> None:
        old_state = self._state
        self._state = new_state
        self._last_state_change = datetime.utcnow()
        
        if new_state == CircuitState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
        
        print(f"Circuit {self._name}: {old_state} -> {new_state}")

async def async_payment_service(order_id: str) -> dict:
    await asyncio.sleep(0.1)
    return {"order_id": order_id, "status": "paid"}

async def main():
    breaker = AsyncCircuitBreaker("async-payment")
    
    for i in range(10):
        try:
            result = await breaker.call(async_payment_service, f"order-{i}")
            print(f"Success: {result}")
        except CircuitOpenError:
            print(f"Circuit open, skipping request")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
```

### Metrics and Monitoring

```python
from dataclasses import dataclass
from datetime import datetime
from collections import defaultdict
import threading

@dataclass
class CircuitEvent:
    circuit_name: str
    from_state: CircuitState
    to_state: CircuitState
    timestamp: datetime
    details: str | None = None

class CircuitMetricsCollector:
    def __init__(self):
        self._events: list[CircuitEvent] = []
        self._state_counts: dict[str, dict[CircuitState, int]] = defaultdict(lambda: defaultdict(int))
        self._lock = threading.Lock()
    
    def record_transition(
        self,
        circuit_name: str,
        from_state: CircuitState,
        to_state: CircuitState,
        details: str | None = None
    ) -> None:
        with self._lock:
            event = CircuitEvent(
                circuit_name=circuit_name,
                from_state=from_state,
                to_state=to_state,
                timestamp=datetime.utcnow(),
                details=details
            )
            self._events.append(event)
            self._state_counts[circuit_name][from_state] -= 1
            self._state_counts[circuit_name][to_state] += 1
    
    def get_circuit_health(self, circuit_name: str) -> dict:
        with self._lock:
            return {
                "circuit": circuit_name,
                "current_state": self._circuits[circuit_name].state,
                "failure_count": self._circuits[circuit_name].metrics.failure_count,
                "success_count": self._circuits[circuit_name].metrics.success_count,
                "recent_events": [
                    e for e in self._events[-10:]
                    if e.circuit_name == circuit_name
                ]
            }
    
    def get_all_health(self) -> dict:
        return {
            name: self.get_circuit_health(name)
            for name in self._circuits
        }

class MonitoredCircuitBreaker(CircuitBreaker):
    def __init__(self, name: str, config: CircuitBreakerConfig = None, metrics: CircuitMetricsCollector = None):
        super().__init__(name, config)
        self._metrics = metrics
    
    def _transition_to(self, new_state: CircuitState) -> None:
        old_state = self._state
        super()._transition_to(new_state)
        
        if self._metrics:
            self._metrics.record_transition(
                self._name,
                old_state,
                new_state
            )
```

## Best Practices

1. **Configure Thresholds**: Set appropriate failure and timeout values
2. **Multiple Circuits**: Use separate circuits per dependency
3. **Monitor Actively**: Track circuit state changes and metrics
4. **Graceful Degradation**: Implement fallbacks for open circuits
5. **Testing**: Test all state transitions
6. **Alerts**: Notify when circuits open or close
7. **Dashboard**: Visualize circuit states
8. **Default Fallbacks**: Provide degraded functionality
9. **Async Support**: Handle async operations correctly
10. **Reset Manually**: Allow manual reset in emergencies
11. **Gradual Recovery**: Use half-open for safe recovery
12. **Documentation**: Document circuit configurations
