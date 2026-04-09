# Bulkhead Pattern

## Overview

The Bulkhead Pattern is a resilience design pattern that isolates components of an application to prevent cascading failures. Named after the partition walls in ship hulls that contain flooding to a single section, this pattern ensures that failure in one part of the system does not bring down the entire application. It achieves this by dividing resources into isolated pools, so that if one pool is exhausted or failing, other pools can continue functioning independently.

## Description

The Bulkhead Pattern implements resource isolation by creating separate resource pools for different operations or services. When a service begins to fail or resources become constrained, the isolation ensures that only the affected pool is impacted while other pools continue operating normally. This pattern is particularly valuable in microservices architectures where multiple services interact, and a slow or failing service could otherwise consume all available threads or connections, leaving none for other operations.

The implementation typically involves segregating thread pools, connection pools, or computational resources across different service calls. Each bulkhead acts as a failure containment zone, limiting the blast radius of any single point of failure. When combined with other resilience patterns like circuit breakers and retry mechanisms, bulkheads provide a comprehensive defense against system degradation and failures.

## Prerequisites

- Understanding of concurrent programming and thread management
- Familiarity with resource allocation and pool management concepts
- Knowledge of failure modes in distributed systems
- Experience with concurrency control mechanisms
- Understanding of resource exhaustion and its symptoms

## Core Competencies

- Resource pool sizing and configuration
- Thread pool isolation strategies
- Connection pool segregation
- Failure domain identification
- Load shedding implementation
- Graceful degradation design
- System resource monitoring
- Threshold configuration and tuning

## Implementation

### Python Implementation with ThreadPoolExecutor

```python
import concurrent.futures
import time
import threading
from typing import Callable, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class BulkheadState(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


@dataclass
class BulkheadConfig:
    max_concurrent_calls: int = 10
    max_queue_size: int = 100
    timeout_seconds: float = 30.0
    fallback_function: Optional[Callable] = None


class Bulkhead:
    def __init__(self, name: str, config: BulkheadConfig):
        self.name = name
        self.config = config
        self.semaphore = threading.Semaphore(config.max_concurrent_calls)
        self.queue: list = []
        self.state = BulkheadState.HEALTHY
        self.current_calls = 0
        self.total_calls = 0
        self.failed_calls = 0
        self.lock = threading.Lock()
        self._monitor_thread: Optional[threading.Thread] = None
        self._running = False

    def start_monitoring(self, interval: float = 1.0):
        self._running = True
        self._monitor_thread = threading.Thread(
            target=self._monitor_loop,
            args=(interval,),
            daemon=True
        )
        self._monitor_thread.start()

    def stop_monitoring(self):
        self._running = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=2.0)

    def _monitor_loop(self, interval: float):
        while self._running:
            with self.lock:
                utilization = self.current_calls / self.config.max_concurrent_calls
                if utilization > 0.8:
                    self.state = BulkheadState.DEGRADED
                elif utilization < 0.5:
                    self.state = BulkheadState.HEALTHY
            time.sleep(interval)

    def execute(
        self,
        func: Callable[..., Any],
        *args,
        timeout: Optional[float] = None,
        **kwargs
    ) -> Any:
        timeout = timeout or self.config.timeout_seconds

        with self.lock:
            self.total_calls += 1
            is_queue_full = len(self.queue) >= self.config.max_queue_size

        if is_queue_full:
            with self.lock:
                self.failed_calls += 1
            if self.config.fallback_function:
                return self.config.fallback_function()
            raise BulkheadFullError(
                f"Bulkhead '{self.name}' queue is full. "
                f"Max size: {self.config.max_queue_size}"
            )

        acquired = self.semaphore.acquire(timeout=timeout)
        if not acquired:
            with self.lock:
                self.failed_calls += 1
            if self.config.fallback_function:
                return self.config.fallback_function()
            raise BulkheadTimeoutError(
                f"Bulkhead '{self.name}' semaphore acquisition timed out after "
                f"{timeout} seconds"
            )

        with self.lock:
            self.current_calls += 1

        try:
            start_time = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time

            logger.debug(
                f"Bulkhead '{self.name}' executed {func.__name__} in "
                f"{elapsed:.3f}s"
            )
            return result

        except Exception as e:
            with self.lock:
                self.failed_calls += 1
            logger.error(f"Bulkhead '{self.name}' execution failed: {e}")
            if self.config.fallback_function:
                return self.config.fallback_function()
            raise

        finally:
            with self.lock:
                self.current_calls -= 1
            self.semaphore.release()

    def get_metrics(self) -> dict:
        with self.lock:
            return {
                "name": self.name,
                "state": self.state.value,
                "total_calls": self.total_calls,
                "failed_calls": self.failed_calls,
                "current_calls": self.current_calls,
                "queue_size": len(self.queue),
                "utilization": (
                    self.current_calls / self.config.max_concurrent_calls
                    if self.config.max_concurrent_calls > 0 else 0
                ),
                "success_rate": (
                    (self.total_calls - self.failed_calls) / self.total_calls
                    if self.total_calls > 0 else 1.0
                ),
            }


class BulkheadFullError(Exception):
    pass


class BulkheadTimeoutError(Exception):
    pass


class BulkheadRegistry:
    def __init__(self):
        self._bulkheads: dict[str, Bulkhead] = {}
        self._lock = threading.Lock()

    def register(self, bulkhead: Bulkhead):
        with self._lock:
            self._bulkheads[bulkhead.name] = bulkhead

    def get(self, name: str) -> Optional[Bulkhead]:
        with self._lock:
            return self._bulkheads.get(name)

    def get_all_healthy(self) -> list[Bulkhead]:
        with self._lock:
            return [
                b for b in self._bulkheads.values()
                if b.state == BulkheadState.HEALTHY
            ]

    def get_metrics_summary(self) -> dict:
        with self._lock:
            bulkhead_metrics = [
                b.get_metrics() for b in self._bulkheads.values()
            ]
            total_calls = sum(m["total_calls"] for m in bulkhead_metrics)
            total_failed = sum(m["failed_calls"] for m in bulkhead_metrics)

            return {
                "total_bulkheads": len(self._bulkheads),
                "total_calls": total_calls,
                "total_failed": total_failed,
                "overall_success_rate": (
                    (total_calls - total_failed) / total_calls
                    if total_calls > 0 else 1.0
                ),
                "bulkheads": bulkhead_metrics,
            }


registry = BulkheadRegistry()


def create_service_bulkhead(
    service_name: str,
    max_concurrent: int = 10,
    max_queue: int = 100
) -> Bulkhead:
    config = BulkheadConfig(
        max_concurrent_calls=max_concurrent,
        max_queue_size=max_queue,
        fallback_function=lambda: default_fallback(service_name)
    )
    bulkhead = Bulkhead(service_name, config)
    registry.register(bulkhead)
    return bulkhead


def default_fallback(service_name: str) -> Any:
    logger.warning(f"Fallback triggered for service: {service_name}")
    return {"error": "service_unavailable", "service": service_name}


def with_bulkhead(
    bulkhead_name: str,
    timeout: float = 30.0
):
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            bulkhead = registry.get(bulkhead_name)
            if not bulkhead:
                raise ValueError(f"Bulkhead '{bulkhead_name}' not found")
            return bulkhead.execute(func, *args, timeout=timeout, **kwargs)
        return wrapper
    return decorator
```

### Go Implementation

```go
package bulkhead

import (
	"context"
	"errors"
	"sync"
	"time"
)

var (
	ErrBulkheadFull       = errors.New("bulkhead: semaphore is full")
	ErrBulkheadTimeout    = errors.New("bulkhead: execution timeout")
	ErrBulkheadNotFound   = errors.New("bulkhead: not found")
)

type State string

const (
	StateHealthy   State = "healthy"
	StateDegraded  State = "degraded"
	StateFailed    State = "failed"
)

type Config struct {
	MaxConcurrentCalls int
	MaxQueueSize       int
	Timeout            time.Duration
}

type Metrics struct {
	Name             string
	State            State
	TotalCalls       int64
	FailedCalls      int64
	CurrentCalls     int
	QueueSize        int
	Utilization      float64
	SuccessRate      float64
}

type Bulkhead struct {
	name             string
	config           Config
	sem              chan struct{}
	queue            chan struct{}
	state            State
	currentCalls     int64
	totalCalls       int64
	failedCalls      int64
	mu               sync.RWMutex
	fallback         func(context.Context) (interface{}, error)
	stopCh           chan struct{}
	wg               sync.WaitGroup
}

func New(name string, config Config) *Bulkhead {
	b := &Bulkhead{
		name:    name,
		config:  config,
		sem:     make(chan struct{}, config.MaxConcurrentCalls),
		queue:   make(chan struct{}, config.MaxQueueSize),
		state:   StateHealthy,
		stopCh:  make(chan struct{}),
	}

	if config.MaxQueueSize > 0 {
		go b.monitor()
	}

	return b
}

func (b *Bulkhead) SetFallback(fallback func(context.Context) (interface{}, error)) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.fallback = fallback
}

func (b *Bulkhead) monitor() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	defer b.wg.Done()

	for {
		select {
		case <-ticker.C:
			b.mu.Lock()
			utilization := float64(len(b.sem)) / float64(b.config.MaxConcurrentCalls)
			if utilization > 0.8 {
				b.state = StateDegraded
			} else if utilization < 0.5 {
				b.state = StateHealthy
			}
			b.mu.Unlock()
		case <-b.stopCh:
			return
		}
	}
}

func (b *Bulkhead) Execute(
	ctx context.Context,
	fn func(context.Context) (interface{}, error),
) (interface{}, error) {
	b.mu.Lock()
	b.totalCalls++
	queueSize := len(b.queue)
	b.mu.Unlock()

	if queueSize >= b.config.MaxQueueSize {
		b.mu.Lock()
		b.failedCalls++
		b.mu.Unlock()
		return b.fallbackResult(ctx, ErrBulkheadFull)
	}

	select {
	case b.sem <- struct{}{}:
	case <-time.After(b.config.Timeout):
		b.mu.Lock()
		b.failedCalls++
		b.mu.Unlock()
		return b.fallbackResult(ctx, ErrBulkheadTimeout)
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	b.mu.Lock()
	b.currentCalls++
	b.mu.Unlock()

	result, err := fn(ctx)

	b.mu.Lock()
	b.currentCalls--
	if err != nil {
		b.failedCalls++
	}
	b.mu.Unlock()

	<-b.sem

	return result, err
}

func (b *Bulkhead) fallbackResult(ctx context.Context, err error) (interface{}, error) {
	if b.fallback != nil {
		return b.fallback(ctx)
	}
	return nil, err
}

func (b *Bulkhead) Metrics() Metrics {
	b.mu.RLock()
	defer b.mu.RUnlock()

	totalCalls := b.totalCalls
	failedCalls := b.failedCalls

	return Metrics{
		Name:         b.name,
		State:        b.state,
		TotalCalls:   totalCalls,
		FailedCalls:  failedCalls,
		CurrentCalls: int(b.currentCalls),
		QueueSize:    len(b.queue),
		Utilization:  float64(len(b.sem)) / float64(b.config.MaxConcurrentCalls),
		SuccessRate:  float64(totalCalls-failedCalls) / float64(totalCalls),
	}
}

func (b *Bulkhead) Shutdown(ctx context.Context) error {
	b.stopCh <- struct{}{}
	b.wg.Wait()

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-b.stopCh:
			return nil
		}
	}
}

type Registry struct {
	mu        sync.RWMutex
	bulkheads map[string]*Bulkhead
}

func NewRegistry() *Registry {
	return &Registry{
		bulkheads: make(map[string]*Bulkhead),
	}
}

func (r *Registry) Register(b *Bulkhead) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.bulkheads[b.name] = b
}

func (r *Registry) Get(name string) (*Bulkhead, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if b, ok := r.bulkheads[name]; ok {
		return b, nil
	}
	return nil, ErrBulkheadNotFound
}
```

## Use Cases

- **Microservices Isolation**: Protect each microservice with its own bulkhead to prevent cascade failures across service boundaries. When one service experiences high latency or failure, other services remain unaffected.

- **Database Connection Protection**: Isolate database connection pools for different operations, ensuring that expensive queries don't exhaust connections needed for critical transactional operations.

- **API Rate Limiting**: Implement per-client or per-endpoint bulkheads to prevent any single client or endpoint from monopolizing system resources.

- **Background Job Protection**: Separate bulkheads for background job processing ensure that batch operations don't interfere with real-time user-facing requests.

- **Third-Party Service Integration**: Isolate calls to external APIs, preventing slow or failing external services from consuming all application threads.

## Artifacts

- `Bulkhead` class: Core implementation for resource isolation
- `BulkheadRegistry` class: Central registry for managing multiple bulkheads
- `BulkheadConfig` dataclass: Configuration for bulkhead behavior
- `Metrics` structures: Health and performance monitoring data
- Decorator utilities: Easy integration with existing functions
- Thread safety primitives: Semaphore-based concurrency control

## Related Skills

- Circuit Breaker Pattern: Complements bulkhead for comprehensive failure handling
- Retry Pattern: Works with bulkhead to handle transient failures
- Timeout Pattern: Essential companion for bulkhead implementations
- Rate Limiting: Related resource control mechanism
- Connection Pooling: Often used alongside bulkhead for database resources
- Health Checks: Monitoring bulkhead state and metrics
