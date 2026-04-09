# Circuit Breaker Pattern

## Overview

The Circuit Breaker Pattern is a resilience design pattern that prevents cascading failures in distributed systems by detecting failures and encapsulating the logic of preventing a failure from constantly recurring. Like electrical circuit breakers that prevent fires by interrupting current flow, this pattern prevents applications from repeatedly trying to execute an operation that's likely to fail, allowing the system to recover and preventing resource exhaustion.

## Description

The circuit breaker pattern operates with three states: closed, open, and half-open. In the closed state, requests flow through normally. When failures exceed a threshold, the circuit "opens," immediately rejecting requests without attempting the operation. After a cooldown period, the circuit enters half-open state, allowing a limited number of test requests through. If these succeed, the circuit closes; if they fail, it reopens.

This pattern is essential for building resilient microservices architectures where services depend on each other. Without circuit breakers, a failing service can cause all its callers to hang while waiting for timeouts, leading to thread pool exhaustion and cascading failures throughout the system.

## Prerequisites

- Understanding of distributed systems and failure modes
- Knowledge of fallback strategies and graceful degradation
- Familiarity with state machine concepts
- Experience with timeout and retry patterns
- Understanding of resource management in concurrent systems

## Core Competencies

- State machine implementation for circuit states
- Failure threshold configuration and tuning
- Cooldown period management
- Half-open state handling and probe requests
- Fallback function implementation
- Thread-safe state transitions
- Metrics collection and monitoring
- Integration with resilience frameworks

## Implementation

### Python Implementation

```python
import time
import threading
from typing import Any, Callable, Optional, Dict
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import logging
from statistics import mean
from collections import deque

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitConfig:
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout_seconds: float = 60.0
    half_open_max_calls: int = 3
    sliding_window_size: int = 100
    minimum_calls: int = 10
    error_rate_threshold: float = 0.5
    latency_threshold_ms: float = 1000.0
    latency_percentile: float = 0.95


@dataclass
class CircuitMetrics:
    state: CircuitState = CircuitState.CLOSED
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    rejected_calls: int = 0
    current_consecutive_failures: int = 0
    current_consecutive_successes: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    state_transitions: int = 0
    failure_rate: float = 0.0
    latency_samples: deque = field(default_factory=lambda: deque(maxlen=100))

    def record_call(self, success: bool, latency: float = 0.0):
        self.total_calls += 1
        self.latency_samples.append((success, latency))

        if success:
            self.successful_calls += 1
            self.current_consecutive_failures = 0
            self.current_consecutive_successes += 1
            self.last_success_time = time.time()
        else:
            self.failed_calls += 1
            self.current_consecutive_failures += 1
            self.current_consecutive_successes = 0
            self.last_failure_time = time.time()

        if len(self.latency_samples) >= self.minimum_calls:
            failures = sum(1 for s, _ in self.latency_samples if not s)
            self.failure_rate = failures / len(self.latency_samples)


class CircuitBreaker:
    def __init__(self, name: str, config: Optional[CircuitConfig] = None):
        self.name = name
        self.config = config or CircuitConfig()
        self.state = CircuitState.CLOSED
        self.metrics = CircuitMetrics()
        self.lock = threading.RLock()
        self._opened_at: Optional[float] = None
        self._half_open_successes: int = 0
        self._last_state_change: float = time.time()

    def call(
        self,
        func: Callable[..., Any],
        *args,
        fallback: Optional[Callable[..., Any]] = None,
        **kwargs
    ) -> Any:
        if not self._can_execute():
            self.metrics.rejected_calls += 1
            if fallback:
                return fallback()
            raise CircuitOpenError(
                f"Circuit '{self.name}' is open. Circuit opened at "
                f"{self._opened_at}"
            )

        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            latency = (time.time() - start_time) * 1000
            self._on_success(latency)
            return result

        except Exception as e:
            latency = (time.time() - start_time) * 1000
            self._on_failure(latency, e)
            if fallback:
                return fallback()
            raise

    def _can_execute(self) -> bool:
        with self.lock:
            if self.state == CircuitState.CLOSED:
                return True
            elif self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to(CircuitState.HALF_OPEN)
                    return True
                return False
            elif self.state == CircuitState.HALF_OPEN:
                return self._half_open_successes < self.config.half_open_max_calls
            return False

    def _should_attempt_reset(self) -> bool:
        if self._opened_at is None:
            return True
        return time.time() - self._opened_at >= self.config.timeout_seconds

    def _on_success(self, latency: float):
        with self.lock:
            self.metrics.record_call(True, latency)

            if self.state == CircuitState.HALF_OPEN:
                self._half_open_successes += 1
                if self._half_open_successes >= self.config.success_threshold:
                    self._transition_to(CircuitState.CLOSED)

    def _on_failure(self, latency: float, error: Exception):
        with self.lock:
            self.metrics.record_call(False, latency)
            logger.warning(f"Circuit '{self.name}' recorded failure: {error}")

            if self.state == CircuitState.HALF_OPEN:
                self._transition_to(CircuitState.OPEN)
            elif self.state == CircuitState.CLOSED:
                if self._should_open():
                    self._transition_to(CircuitState.OPEN)

    def _should_open(self) -> bool:
        if self.metrics.current_consecutive_failures >= self.config.failure_threshold:
            return True

        if (
            self.metrics.total_calls >= self.config.minimum_calls and
            self.metrics.failure_rate >= self.config.error_rate_threshold
        ):
            return True

        latency_samples = [lat for _, lat in self.metrics.latency_samples]
        if len(latency_samples) >= self.config.minimum_calls:
            sorted_latencies = sorted(latency_samples)
            percentile_idx = int(len(sorted_latencies) * self.config.latency_percentile)
            p99_latency = sorted_latencies[min(percentile_idx, len(sorted_latencies) - 1)]

            if p99_latency > self.config.latency_threshold_ms:
                return True

        return False

    def _transition_to(self, new_state: CircuitState):
        old_state = self.state
        self.state = new_state
        self.metrics.state_transitions += 1
        self._last_state_change = time.time()

        if new_state == CircuitState.OPEN:
            self._opened_at = time.time()
            self._half_open_successes = 0
        elif new_state == CircuitState.CLOSED:
            self._opened_at = None
            self._half_open_successes = 0
            self.metrics.current_consecutive_failures = 0

        logger.info(
            f"Circuit '{self.name}' transitioned from {old_state.value} "
            f"to {new_state.value}"
        )

    def reset(self):
        with self.lock:
            self.state = CircuitState.CLOSED
            self._opened_at = None
            self._half_open_successes = 0
            self.metrics = CircuitMetrics()
            self.metrics.state = CircuitState.CLOSED

    def get_state(self) -> Dict:
        with self.lock:
            return {
                "name": self.name,
                "state": self.state.value,
                "opened_at": self._opened_at,
                "seconds_since_open": (
                    time.time() - self._opened_at
                    if self._opened_at else None
                ),
                "metrics": {
                    "total_calls": self.metrics.total_calls,
                    "successful_calls": self.metrics.successful_calls,
                    "failed_calls": self.metrics.failed_calls,
                    "rejected_calls": self.metrics.rejected_calls,
                    "failure_rate": self.metrics.failure_rate,
                    "state_transitions": self.metrics.state_transitions,
                    "consecutive_failures": self.metrics.current_consecutive_failures,
                    "consecutive_successes": self.metrics.current_consecutive_successes,
                },
            }


class CircuitOpenError(Exception):
    pass


class CircuitRegistry:
    def __init__(self):
        self._circuits: Dict[str, CircuitBreaker] = {}
        self._lock = threading.Lock()

    def register(self, circuit: CircuitBreaker):
        with self._lock:
            self._circuits[circuit.name] = circuit

    def get(self, name: str) -> Optional[CircuitBreaker]:
        with self._lock:
            return self._circuits.get(name)

    def get_all(self) -> Dict[str, CircuitBreaker]:
        with self._lock:
            return dict(self._circuits)

    def get_states(self) -> Dict[str, Dict]:
        with self._lock:
            return {name: cb.get_state() for name, cb in self._circuits.items()}


class BulkheadCircuitBreaker:
    def __init__(
        self,
        name: str,
        circuit_config: Optional[CircuitConfig] = None,
        max_concurrent: int = 10,
        timeout_seconds: float = 30.0
    ):
        self.name = name
        self.circuit = CircuitBreaker(name, circuit_config)
        self.semaphore = threading.Semaphore(max_concurrent)
        self.timeout_seconds = timeout_seconds
        self.lock = threading.Lock()

    def call(
        self,
        func: Callable[..., Any],
        *args,
        fallback: Optional[Callable[..., Any]] = None,
        **kwargs
    ) -> Any:
        acquired = self.semaphore.acquire(timeout=self.timeout_seconds)
        if not acquired:
            self.circuit.metrics.rejected_calls += 1
            if fallback:
                return fallback()
            raise TimeoutError(
                f"Concurrency limit reached for '{self.name}'"
            )

        try:
            return self.circuit.call(func, *args, fallback=fallback, **kwargs)
        finally:
            self.semaphore.release()


registry = CircuitRegistry()


def get_circuit(name: str) -> CircuitBreaker:
    circuit = registry.get(name)
    if not circuit:
        circuit = CircuitBreaker(name)
        registry.register(circuit)
    return circuit


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    timeout_seconds: float = 60.0
):
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            cb = get_circuit(name)
            return cb.call(func, *args, **kwargs)
        return wrapper
    return decorator
```

### Go Implementation

```go
package circuit

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"
)

var ErrCircuitOpen = errors.New("circuit breaker is open")

type State int

const (
	StateClosed State = iota
	StateOpen
	StateHalfOpen
)

func (s State) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateOpen:
		return "open"
	case StateHalfOpen:
		return "half_open"
	default:
		return "unknown"
	}
}

type Config struct {
	FailureThreshold    int
	SuccessThreshold    int
	Timeout             time.Duration
	HalfOpenMaxCalls    int
	SlidingWindowSize   int
	MinimumCalls        int
	ErrorRateThreshold  float64
	LatencyThresholdMs  float64
	LatencyPercentile   float64
}

type Metrics struct {
	TotalCalls              int64
	SuccessfulCalls         int64
	FailedCalls             int64
	RejectedCalls           int64
	CurrentConsecutiveFails  int
	CurrentConsecutiveSuccesses int
	LastFailureTime         time.Time
	LastSuccessTime         time.Time
	StateTransitions        int64
	FailureRate             float64
	LatencySamples          []float64
}

type CircuitBreaker struct {
	name          string
	config        Config
	state         State
	metrics       Metrics
	openedAt      time.Time
	lastStateChange time.Time
	halfOpenSuccesses int
	mu            sync.RWMutex
}

func New(name string, config Config) *CircuitBreaker {
	return &CircuitBreaker{
		name:    name,
		config:  config,
		state:   StateClosed,
		metrics: Metrics{},
		lastStateChange: time.Now(),
	}
}

func (c *CircuitBreaker) Execute(
	ctx context.Context,
	fn func(context.Context) error,
	fallback func(context.Context) error,
) error {
	if !c.canExecute() {
		c.mu.Lock()
		c.metrics.RejectedCalls++
		c.mu.Unlock()

		if fallback != nil {
			return fallback(ctx)
		}
		return ErrCircuitOpen
	}

	start := time.Now()
	err := fn(ctx)
	latency := time.Since(start).Milliseconds()

	c.recordResult(err == nil, float64(latency))

	if err != nil {
		if fallback != nil {
			return fallback(ctx)
		}
		return err
	}

	return nil
}

func (c *CircuitBreaker) ExecuteWithResult(
	ctx context.Context,
	fn func(context.Context) (interface{}, error),
	fallback func(context.Context) (interface{}, error),
) (interface{}, error) {
	if !c.canExecute() {
		c.mu.Lock()
		c.metrics.RejectedCalls++
		c.mu.Unlock()

		if fallback != nil {
			return fallback(ctx)
		}
		return nil, ErrCircuitOpen
	}

	start := time.Now()
	result, err := fn(ctx)
	latency := time.Since(start).Milliseconds()

	c.recordResult(err == nil, float64(latency))

	if err != nil {
		if fallback != nil {
			return fallback(ctx)
		}
		return nil, err
	}

	return result, nil
}

func (c *CircuitBreaker) canExecute() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	switch c.state {
	case StateClosed:
		return true
	case StateOpen:
		if time.Since(c.openedAt) >= c.config.Timeout {
			c.mu.RUnlock()
			c.mu.Lock()
			c.transitionTo(StateHalfOpen)
			c.mu.Unlock()
			c.mu.RLock()
			return true
		}
		return false
	case StateHalfOpen:
		return c.halfOpenSuccesses < c.config.HalfOpenMaxCalls
	default:
		return false
	}
}

func (c *CircuitBreaker) recordResult(success bool, latency float64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.metrics.TotalCalls++
	c.metrics.LatencySamples = append(c.metrics.LatencySamples, latency)

	if len(c.metrics.LatencySamples) > c.config.SlidingWindowSize {
		c.metrics.LatencySamples = c.metrics.LatencySamples[len(c.metrics.LatencySamples)-c.config.SlidingWindowSize:]
	}

	if success {
		c.metrics.SuccessfulCalls++
		c.metrics.CurrentConsecutiveFails = 0
		c.metrics.CurrentConsecutiveSuccesses++

		if c.state == StateHalfOpen {
			c.halfOpenSuccesses++
			if c.halfOpenSuccesses >= c.config.SuccessThreshold {
				c.transitionTo(StateClosed)
			}
		}
	} else {
		c.metrics.FailedCalls++
		c.metrics.CurrentConsecutiveFails++
		c.metrics.CurrentConsecutiveSuccesses = 0
		c.metrics.LastFailureTime = time.Now()

		if c.state == StateHalfOpen {
			c.transitionTo(StateOpen)
		} else if c.state == StateClosed {
			if c.shouldOpen() {
				c.transitionTo(StateOpen)
			}
		}
	}

	c.updateFailureRate()
}

func (c *CircuitBreaker) shouldOpen() bool {
	if c.metrics.CurrentConsecutiveFails >= c.config.FailureThreshold {
		return true
	}

	if c.metrics.TotalCalls >= int64(c.config.MinimumCalls) {
		if c.metrics.FailureRate >= c.config.ErrorRateThreshold {
			return true
		}
	}

	return c.checkLatencyThreshold()
}

func (c *CircuitBreaker) checkLatencyThreshold() bool {
	if len(c.metrics.LatencySamples) < c.config.MinimumCalls {
		return false
	}

	sorted := make([]float64, len(c.metrics.LatencySamples))
	copy(sorted, c.metrics.LatencySamples)
	sort.Float64s(sorted)

	idx := int(float64(len(sorted)) * c.config.LatencyPercentile)
	if idx >= len(sorted) {
		idx = len(sorted) - 1
	}

	percentileLatency := sorted[idx]
	return percentileLatency > c.config.LatencyThresholdMs
}

func (c *CircuitBreaker) updateFailureRate() {
	if c.metrics.TotalCalls == 0 {
		c.metrics.FailureRate = 0
		return
	}
	c.metrics.FailureRate = float64(c.metrics.FailedCalls) / float64(c.metrics.TotalCalls)
}

func (c *CircuitBreaker) transitionTo(newState State) {
	oldState := c.state
	c.state = newState
	c.metrics.StateTransitions++
	c.lastStateChange = time.Now()

	switch newState {
	case StateOpen:
		c.openedAt = time.Now()
		c.halfOpenSuccesses = 0
	case StateClosed:
		c.openedAt = time.Time{}
		c.halfOpenSuccesses = 0
		c.metrics.CurrentConsecutiveFails = 0
	}
}

func (c *CircuitBreaker) Reset() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.state = StateClosed
	c.openedAt = time.Time{}
	c.halfOpenSuccesses = 0
	c.metrics = Metrics{}
}

func (c *CircuitBreaker) State() State {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state
}

type CircuitStatus struct {
	Name               string    `json:"name"`
	State              string    `json:"state"`
	OpenedAt           *time.Time `json:"opened_at,omitempty"`
	SecondsSinceOpen   float64   `json:"seconds_since_open,omitempty"`
	TotalCalls         int64     `json:"total_calls"`
	SuccessfulCalls    int64     `json:"successful_calls"`
	FailedCalls        int64     `json:"failed_calls"`
	RejectedCalls      int64     `json:"rejected_calls"`
	FailureRate        float64   `json:"failure_rate"`
	StateTransitions   int64     `json:"state_transitions"`
	ConsecutiveFailures int      `json:"consecutive_failures"`
}

func (c *CircuitBreaker) Status() CircuitStatus {
	c.mu.RLock()
	defer c.mu.RUnlock()

	status := CircuitStatus{
		Name:             c.name,
		State:            c.state.String(),
		TotalCalls:       c.metrics.TotalCalls,
		SuccessfulCalls:  c.metrics.SuccessfulCalls,
		FailedCalls:      c.metrics.FailedCalls,
		RejectedCalls:    c.metrics.RejectedCalls,
		FailureRate:      c.metrics.FailureRate,
		StateTransitions: c.metrics.StateTransitions,
	}

	if c.openedAt.IsZero() {
		status.OpenedAt = nil
	} else {
		opened := c.openedAt
		status.OpenedAt = &opened
		status.SecondsSinceOpen = time.Since(c.openedAt).Seconds()
	}

	return status
}

type Registry struct {
	mu        sync.RWMutex
	circuits  map[string]*CircuitBreaker
}

func NewRegistry() *Registry {
	return &Registry{
		circuits: make(map[string]*CircuitBreaker),
	}
}

func (r *Registry) Register(cb *CircuitBreaker) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.circuits[cb.name] = cb
}

func (r *Registry) Get(name string) (*CircuitBreaker, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	cb, ok := r.circuits[name]
	return cb, ok
}

func (r *Registry) MustGet(name string) *CircuitBreaker {
	cb, ok := r.Get(name)
	if !ok {
		panic(fmt.Sprintf("circuit breaker '%s' not found", name))
	}
	return cb
}

func (r *Registry) AllStatus() []CircuitStatus {
	r.mu.RLock()
	defer r.mu.RUnlock()

	statuses := make([]CircuitStatus, 0, len(r.circuits))
	for _, cb := range r.circuits {
		statuses = append(statuses, cb.Status())
	}
	return statuses
}

func DefaultConfig() Config {
	return Config{
		FailureThreshold:   5,
		SuccessThreshold:  3,
		Timeout:           60 * time.Second,
		HalfOpenMaxCalls:  3,
		SlidingWindowSize: 100,
		MinimumCalls:      10,
		ErrorRateThreshold: 0.5,
		LatencyThresholdMs: 1000,
		LatencyPercentile:  0.95,
	}
}
```

## Use Cases

- **External API Calls**: Protect calls to third-party APIs that may be unreliable or have rate limits.

- **Database Connections**: Prevent application hang when database becomes unavailable by failing fast.

- **Microservice Dependencies**: Isolate failures in downstream services to prevent cascading failures.

- **Resource-Intensive Operations**: Limit concurrent execution of expensive operations.

- **Legacy System Integration**: Add resilience when integrating with older, less reliable systems.

## Artifacts

- `CircuitBreaker` class: Core implementation with three-state machine
- `CircuitConfig` dataclass: Configurable thresholds and timeouts
- `CircuitMetrics` datacslatency tracking
- `CircuitRegistry`: Central management of multiple circuit breakers
- `BulkheadCircuitBreaker`: Combines circuit breaker with concurrency limits
- Decorator utilities for easy integration

## Related Skills

- Bulkhead Pattern: Complements circuit breaker for resource isolation
- Retry Pattern: Works with circuit breaker for transient failures
- Timeout Pattern: Essential companion for circuit breaker
- Fallback Pattern: Provides alternative responses when circuit is open
- Health Checks: Monitoring circuit breaker state
- Metrics Collection: Integration with observability platforms
