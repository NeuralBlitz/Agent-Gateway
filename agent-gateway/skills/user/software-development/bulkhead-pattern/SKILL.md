---
name: Bulkhead Pattern
description: Resilience pattern isolating system components to prevent cascade failures and enable partial degradation
category: software-development
---
# Bulkhead Pattern

## What I do

I provide a pattern that isolates system components to prevent failures in one part from affecting the entire system. Named after ship bulkheads that contain flooding, the bulkhead pattern allocates separate resources (threads, connections, capacity) to different components. If one component fails or becomes slow, it doesn't exhaust resources for other components, enabling graceful degradation and improved system resilience.

## When to use me

Use bulkheads when you have multiple services or components that share common resources, when you need to prioritize certain operations over others, or when preventing cascade failures is critical. They're essential in high-traffic systems, microservices architectures, and applications with varying priority operations. Bulkheads are valuable when different operations have different resource requirements or failure tolerance.

## Core Concepts

- **Isolation Levels**: Complete, pooled, or hybrid isolation
- **Thread Pool**: Separate pools for different operations
- **Connection Pooling**: Dedicated database connections per service
- **Rate Limiting**: Controlling request rates per component
- **Priority Queuing**: Processing high-priority first
- **Resource Partitioning**: Dividing resources between components
- **Semaphore**: Controlling concurrent access
- **Failure Containment**: Containing failures within partitions
- **Graceful Degradation**: Partial functionality during failures
- **Resource Exhaustion**: Preventing total system failure

## Code Examples

### Thread Pool Bulkhead

```python
import queue
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Generic, TypeVar
from uuid import uuid4
from enum import Enum

T = TypeVar("T")

class TaskPriority(Enum):
    HIGH = 0
    MEDIUM = 1
    LOW = 2

@dataclass
class Task(Generic[T]):
    id: str
    func: Callable[..., T]
    args: tuple
    kwargs: dict
    priority: TaskPriority
    created_at: float = time.time()

class PriorityThreadPoolExecutor:
    def __init__(
        self,
        max_workers: int,
        max_high_priority: int = 10,
        max_medium_priority: int = 20,
        max_low_priority: int = 50
    ):
        self._max_workers = max_workers
        self._queues: dict[TaskPriority, queue.PriorityQueue] = {
            TaskPriority.HIGH: queue.PriorityQueue(maxsize=max_high_priority),
            TaskPriority.MEDIUM: queue.PriorityQueue(maxsize=max_medium_priority),
            TaskPriority.LOW: queue.PriorityQueue(maxsize=max_low_priority)
        }
        self._workers: list[threading.Thread] = []
        self._running = True
        self._metrics = {
            "submitted": 0,
            "completed": 0,
            "rejected": 0
        }
    
    def submit(
        self,
        func: Callable[..., T],
        *args,
        priority: TaskPriority = TaskPriority.MEDIUM,
        **kwargs
    ) -> str:
        task_id = str(uuid4())
        task = Task(
            id=task_id,
            func=func,
            args=args,
            kwargs=kwargs,
            priority=priority
        )
        
        q = self._queues[priority]
        if q.full():
            self._metrics["rejected"] += 1
            raise QueueFullError(f"Queue for {priority} is full")
        
        q.put((priority.value, task))
        self._metrics["submitted"] += 1
        
        return task_id
    
    def start(self) -> None:
        for _ in range(self._max_workers):
            worker = threading.Thread(target=self._worker_loop)
            worker.daemon = True
            worker.start()
            self._workers.append(worker)
    
    def _worker_loop(self) -> None:
        while self._running:
            for priority in TaskPriority:
                q = self._queues[priority]
                try:
                    _, task = q.get(timeout=0.1)
                    result = task.func(*task.args, **task.k kwargs)
                    self._metrics["completed"] += 1
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"Task failed: {e}")
    
    def shutdown(self) -> None:
        self._running = False
        for q in self._queues.values():
            q.join()
    
    @property
    def metrics(self) -> dict:
        return self._metrics.copy()

class QueueFullError(Exception):
    pass

def process_order(order_id: str) -> dict:
    time.sleep(0.5)
    return {"order_id": order_id, "status": "processed"}

def main():
    executor = PriorityThreadPoolExecutor(
        max_workers=5,
        max_high_priority=5,
        max_medium_priority=10,
        max_low_priority=100
    )
    executor.start()
    
    try:
        high_id = executor.submit(
            process_order,
            "order-1",
            priority=TaskPriority.HIGH
        )
        low_id = executor.submit(
            process_order,
            "order-2",
            priority=TaskPriority.LOW
        )
        print(f"Submitted tasks: {high_id}, {low_id}")
    finally:
        time.sleep(2)
        executor.shutdown()
        print(f"Metrics: {executor.metrics}")
```

### Connection Pool Bulkhead

```python
import threading
import queue
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol, Generic, TypeVar
from contextlib import contextmanager
from uuid import uuid4

T = TypeVar("T", bound='PooledConnection')

@dataclass
class ConnectionConfig:
    max_connections: int
    min_idle: int = 0
    connection_timeout: float = 30.0
    idle_timeout: float = 600.0

class PooledConnection(Protocol):
    @property
    def id(self) -> str:
        pass
    
    def is_healthy(self) -> bool:
        pass
    
    def execute(self, query: str) -> dict:
        pass
    
    def close(self) -> None:
        pass

class ConnectionPool(Generic[T]):
    def __init__(self, factory: Callable[[], T], config: ConnectionConfig):
        self._factory = factory
        self._config = config
        self._pool: queue.Queue[T] = queue.Queue()
        self._in_use: dict[str, T] = {}
        self._lock = threading.Lock()
        self._metrics = {
            "total_created": 0,
            "currently_in_use": 0,
            "total_errors": 0
        }
    
    @contextmanager
    def acquire(self):
        conn = self._get_connection()
        self._in_use[conn.id] = conn
        self._metrics["currently_in_use"] += 1
        try:
            yield conn
        finally:
            self._return_connection(conn)
            del self._in_use[conn.id]
            self._metrics["currently_in_use"] -= 1
    
    def _get_connection(self) -> T:
        try:
            conn = self._pool.get_nowait()
            if conn.is_healthy():
                return conn
            conn.close()
        except queue.Empty:
            pass
        
        with self._lock:
            if self._metrics["total_created"] < self._config.max_connections:
                conn = self._factory()
                self._metrics["total_created"] += 1
                return conn
        
        conn = self._pool.get(timeout=self._config.connection_timeout)
        return conn
    
    def _return_connection(self, conn: T) -> None:
        if conn.is_healthy():
            try:
                self._pool.put_nowait(conn)
            except queue.Full:
                conn.close()
        else:
            conn.close()
    
    def prewarm(self, count: int) -> None:
        for _ in range(min(count, self._config.max_connections)):
            conn = self._factory()
            self._pool.put(conn)
            self._metrics["total_created"] += 1
    
    def close_all(self) -> None:
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except queue.Empty:
                break
        
        for conn in self._in_use.values():
            conn.close()
    
    @property
    def metrics(self) -> dict:
        return {
            **self._metrics,
            "available_in_pool": self._pool.qsize(),
            "in_use": len(self._in_use)
        }

class DatabaseConnection:
    def __init__(self, db_name: str):
        self.id = str(uuid4())
        self.db_name = db_name
        self._healthy = True
    
    def is_healthy(self) -> bool:
        return self._healthy
    
    def execute(self, query: str) -> dict:
        return {"query": query, "result": "success"}
    
    def close(self) -> None:
        self._healthy = False

pool = ConnectionPool(
    factory=lambda: DatabaseConnection("main"),
    config=ConnectionConfig(max_connections=10, min_idle=2)
)

pool.prewarm(2)

with pool.acquire() as conn:
    result = conn.execute("SELECT * FROM users")
    print(f"Result: {result}")

print(f"Pool metrics: {pool.metrics}")
```

### Semaphore-Based Bulkhead

```python
import asyncio
import threading
from typing import Callable
from dataclasses import dataclass
from datetime import datetime

@dataclass
class BulkheadConfig:
    max_concurrent_calls: int
    max_waiting: int = 0
    timeout_seconds: float = 30.0

class ThreadBulkhead:
    def __init__(self, config: BulkheadConfig):
        self._semaphore = threading.BoundedSemaphore(config.max_concurrent_calls)
        self._waiting = 0
        self._lock = threading.Lock()
        self._metrics = {
            "total_calls": 0,
            "rejected_calls": 0,
            "active_calls": 0
        }
    
    def execute(self, func: Callable, *args, **kwargs):
        with self._lock:
            self._metrics["total_calls"]
        
        acquired = self._semaphore.acquire(timeout=30)
        if not acquired:
            with self._lock:
                self._metrics["rejected_calls"] += 1
            raise BulkheadRejectedError("Concurrent call limit reached")
        
        try:
            with self._lock:
                self._metrics["active_calls"] += 1
            return func(*args, **kwargs)
        finally:
            with self._lock:
                self._metrics["active_calls"] -= 1
            self._semaphore.release()
    
    @property
    def metrics(self) -> dict:
        return self._metrics.copy()

class AsyncBulkhead:
    def __init__(self, config: BulkheadConfig):
        self._semaphore = asyncio.Semaphore(config.max_concurrent_calls)
        self._waiting = 0
        self._metrics = {
            "total_calls": 0,
            "rejected_calls": 0,
            "active_calls": 0
        }
    
    async def execute(self, func: Callable, *args, **kwargs):
        self._metrics["total_calls"] += 1
        
        try:
            async with asyncio.timeout(30):
                await self._semaphore.acquire()
                self._metrics["active_calls"] += 1
                try:
                    return await func(*args, **kwargs)
                finally:
                    self._metrics["active_calls"] -= 1
                    self._semaphore.release()
        
        except asyncio.TimeoutError:
            self._metrics["rejected_calls"] += 1
            raise BulkheadRejectedError("Call timed out")

class BulkheadRejectedError(Exception):
    pass

def external_api_call(service_name: str) -> dict:
    import time
    time.sleep(0.1)
    return {"service": service_name, "status": "ok"}

bulkhead = ThreadBulkhead(BulkheadConfig(max_concurrent_calls=3))

results = []
for i in range(10):
    try:
        result = bulkhead.execute(external_api_call, f"service-{i}")
        results.append(result)
    except BulkheadRejectedError:
        results.append(f"Rejected service-{i}")

print(f"Results: {len(results)} calls, {bulkhead.metrics['rejected_calls']} rejected")
```

### Service Partitioning

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol

@dataclass
class ServicePartition:
    name: str
    max_concurrent: int
    max_queue: int
    priority: int

class ServiceRouter(ABC):
    @abstractmethod
    def get_partition(self, request: 'Request') -> 'ServicePartition':
        pass

class TieredServiceBulkhead:
    def __init__(self, partitions: list[ServicePartition]):
        self._partitions = {
            p.name: {
                "config": p,
                "semaphore": asyncio.Semaphore(p.max_concurrent) if hasattr(asyncio, 'Semaphore') else None,
                "queue": queue.Queue(p.max_queue),
                "metrics": {
                    "calls": 0,
                    "rejected": 0,
                    "executed": 0
                }
            }
            for p in partitions
        }
    
    def get_partition_info(self, partition_name: str) -> dict:
        return self._partitions.get(partition_name, {})
    
    def route_request(
        self,
        request: 'Request',
        router: ServiceRouter
    ) -> 'PartitionResult':
        partition = router.get_partition(request)
        partition_info = self._partitions.get(partition.name)
        
        if not partition_info:
            return PartitionResult(status="unknown_partition")
        
        try:
            partition_info["queue"].put_nowait(request)
            return PartitionResult(status="queued")
        except queue.Full:
            partition_info["metrics"]["rejected"] += 1
            return PartitionResult(status="rejected", reason="queue_full")
    
    def get_all_metrics(self) -> dict:
        return {
            name: info["metrics"]
            for name, info in self._partitions.items()
        }

class Request:
    def __init__(self, type: str, priority: int, data: dict):
        self.type = type
        self.priority = priority
        self.data = data

class PartitionResult:
    def __init__(self, status: str, reason: str = None):
        self.status = status
        self.reason = reason

partitions = [
    ServicePartition("critical", max_concurrent=10, max_queue=100, priority=1),
    ServicePartition("standard", max_concurrent=50, max_queue=500, priority=2),
    ServicePartition("background", max_concurrent=5, max_queue=50, priority=3)
]

bulkhead = TieredServiceBulkhead(partitions)
```

### Adaptive Bulkhead

```python
import asyncio
import time
from dataclasses import dataclass
from typing import Protocol

@dataclass
class AdaptiveConfig:
    initial_capacity: int
    min_capacity: int
    max_capacity: int
    scale_up_threshold: float
    scale_down_threshold: float
    scale_interval_seconds: float

class MetricsCollector(Protocol):
    def get_latency_percentile(self, percentile: float) -> float:
        pass
    
    def get_error_rate(self) -> float:
        pass

class AdaptiveBulkhead:
    def __init__(self, config: AdaptiveConfig, metrics: MetricsCollector):
        self._config = config
        self._metrics = metrics
        self._current_capacity = config.initial_capacity
        self._semaphore = asyncio.Semaphore(self._current_capacity)
        self._scale_lock = asyncio.Lock()
    
    @property
    def capacity(self) -> int:
        return self._current_capacity
    
    async def execute(self, func: Callable, *args, **kwargs):
        async with self._scale_lock:
            await self._maybe_scale()
        
        await self._semaphore.acquire()
        try:
            return await func(*args, **kwargs)
        finally:
            self._semaphore.release()
    
    async def _maybe_scale(self) -> None:
        latency = self._metrics.get_latency_percentile(95)
        error_rate = self._metrics.get_error_rate()
        
        if error_rate > self._config.scale_up_threshold or latency > 1.0:
            if self._current_capacity < self._config.max_capacity:
                self._current_capacity += 1
                new_semaphore = asyncio.Semaphore(self._current_capacity)
                for _ in range(self._current_capacity - 1):
                    new_semaphore.acquire()
                self._semaphore = new_semaphore
                print(f"Scaled up to {self._current_capacity}")
        
        elif latency < 0.5 and error_rate < 0.01:
            if self._current_capacity > self._config.min_capacity:
                self._current_capacity -= 1
                self._semaphore = asyncio.Semaphore(self._current_capacity)
                print(f"Scaled down to {self._current_capacity}")
    
    async def start_scaling_loop(self) -> None:
        while True:
            await asyncio.sleep(self._config.scale_interval_seconds)
            async with self._scale_lock:
                await self._maybe_scale()
```

### Circuit Breaker Integration

```python
from enum import Enum
from dataclasses import dataclass

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"

@dataclass
class HealthCheckResult:
    status: HealthStatus
    latency_ms: float
    error_rate: float

class IsolatedComponent:
    def __init__(
        self,
        name: str,
        max_concurrent: int,
        circuit_breaker: CircuitBreaker
    ):
        self.name = name
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._circuit_breaker = circuit_breaker
        self._health_status = HealthStatus.HEALTHY
        self._metrics = {"calls": 0, "failures": 0, "latencies": []}
    
    async def execute(self, func: Callable, *args, **kwargs):
        self._metrics["calls"] += 1
        
        if self._circuit_breaker.state == CircuitState.OPEN:
            raise ComponentIsolatedError(self.name)
        
        start = time.time()
        try:
            async with self._semaphore:
                result = await func(*args, **kwargs)
                return result
        
        except Exception as e:
            self._metrics["failures"] += 1
            raise
        finally:
            latency = (time.time() - start) * 1000
            self._metrics["latencies"].append(latency)
    
    def get_health(self) -> HealthCheckResult:
        if not self._metrics["latencies"]:
            return HealthCheckResult(HealthStatus.HEALTHY, 0, 0)
        
        avg_latency = sum(self._metrics["latencies"]) / len(self._metrics["latencies"])
        error_rate = self._metrics["failures"] / self._metrics["calls"]
        
        if error_rate > 0.5 or avg_latency > 1000:
            status = HealthStatus.CRITICAL
        elif error_rate > 0.1 or avg_latency > 500:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.HEALTHY
        
        return HealthCheckResult(status, avg_latency, error_rate)

class BulkheadManager:
    def __init__(self):
        self._components: dict[str, IsolatedComponent] = {}
    
    def register(self, component: IsolatedComponent) -> None:
        self._components[component.name] = component
    
    def get_component(self, name: str) -> IsolatedComponent:
        return self._components[name]
    
    def get_all_health(self) -> dict[str, HealthCheckResult]:
        return {
            name: component.get_health()
            for name, component in self._components.items()
        }
    
    def isolate_component(self, name: str) -> None:
        if name in self._components:
            self._components[name]._health_status = HealthStatus.CRITICAL

class ComponentIsolatedError(Exception):
    def __init__(self, component_name: str):
        self.component_name = component_name
        super().__init__(f"Component {component_name} is isolated")
```

## Best Practices

1. **Size Pools Appropriately**: Don't over-allocate resources
2. **Monitor Actively**: Track utilization and saturation
3. **Prioritize Work**: Use priorities for critical operations
4. **Combine with Circuit Breakers**: Layer multiple resilience patterns
5. **Graceful Backpressure**: Reject requests when at capacity
6. **Separate Failure Domains**: Isolate different services/components
7. **Testing**: Test behavior under overload
8. **Alerting**: Notify when pools are saturated
9. **Graceful Degradation**: Reduce functionality when constrained
10. **Fair Distribution**: Prevent single operation from hogging resources
11. **Dynamic Adjustment**: Adapt to changing load patterns
12. **Documentation**: Document partition strategies and limits
