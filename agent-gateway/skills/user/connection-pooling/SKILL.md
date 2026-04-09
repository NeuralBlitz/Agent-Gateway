# Connection Pooling

## Overview

Connection Pooling is a resource management technique that maintains a cache of database or service connections for reuse, reducing the overhead of establishing new connections for each request. It improves application performance, scalability, and resource utilization by sharing connection objects across multiple requests.

## Description

Connection pooling creates a pool of pre-established connections that applications can acquire, use, and release back to the pool. This avoids the expensive process of establishing new connections, which involves network round-trips, authentication, and resource allocation. Pools manage connection lifecycle, handle failures, and provide configurable sizing and timeouts.

## Prerequisites

- Database connectivity knowledge
- Concurrency concepts
- Resource management patterns
- Timeout and error handling
- Thread safety understanding

## Core Competencies

- Pool configuration and sizing
- Connection acquisition and release
- Health checks and validation
- Connection lifecycle management
- Thread-safe pool implementation
- Timeout configuration
- Failure handling and retry
- Pool metrics monitoring

## Implementation

```python
import threading
import time
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from queue import Queue, Empty
from enum import Enum
import logging
import uuid

logger = logging.getLogger(__name__)

class PoolStatus(Enum):
    ACTIVE = "active"
    DRAINING = "draining"
    CLOSED = "closed"

@dataclass
class PoolConfig:
    min_size: int = 5
    max_size: int = 20
    connection_timeout: float = 30.0
    acquire_timeout: float = 10.0
    idle_timeout: float = 300.0
    max_lifetime: float = 3600.0
    validation_interval: float = 30.0
    test_on_acquire: bool = True
    test_on_release: bool = False

@dataclass
class ConnectionWrapper:
    id: str
    conn: Any
    created_at: float
    last_used: float
    in_use: bool = False
    health_check_count: int = 0

    def mark_used(self):
        self.last_used = time.time()
        self.in_use = True

    def release(self):
        self.in_use = False
        self.last_used = time.time()

class ConnectionPool:
    def __init__(self, factory: Callable, config: PoolConfig = None):
        self.factory = factory
        self.config = config or PoolConfig()
        self.status = PoolStatus.ACTIVE
        self.idle_connections: Queue = Queue()
        self.active_connections: Dict[str, ConnectionWrapper] = {}
        self.lock = threading.Lock()
        self.metrics = {
            "total_created": 0,
            "total_acquired": 0,
            "total_released": 0,
            "total_closed": 0,
            "acquire_timeouts": 0,
            "current_size": 0,
            "in_use": 0,
        }
        self._validation_thread: Optional[threading.Thread] = None
        self._running = False
        self._start_maintenance()

    def acquire(self, timeout: float = None) -> ConnectionWrapper:
        timeout = timeout or self.config.acquire_timeout
        start_time = time.time()

        with self.lock:
            if self.status == PoolStatus.CLOSED:
                raise RuntimeError("Pool is closed")
            if self.status == PoolStatus.DRAINING and self.idle_connections.qsize() == 0:
                raise RuntimeError("Pool is draining")

        try:
            conn = self.idle_connections.get(timeout=timeout)
        except Empty:
            self.metrics["acquire_timeouts"] += 1
            raise TimeoutError("Failed to acquire connection within timeout")

        if self._should_validate(conn):
            if not self._validate_connection(conn):
                self._close_connection(conn)
                return self.acquire(timeout - (time.time() - start_time))

        conn.mark_used()
        with self.lock:
            self.active_connections[conn.id] = conn
            self.metrics["total_acquired"] += 1
            self.metrics["in_use"] += 1

        logger.debug(f"Acquired connection {conn.id}")
        return conn

    def release(self, conn: ConnectionWrapper):
        if self.status == PoolStatus.CLOSED:
            self._close_connection(conn)
            return

        if self._should_validate(conn) and not self._validate_connection(conn):
            self._close_connection(conn)
            return

        conn.release()
        with self.lock:
            if conn.id in self.active_connections:
                del self.active_connections[conn.id]
            self.metrics["in_use"] -= 1
            self.metrics["total_released"] += 1

        if self.status == PoolStatus.DRAINING:
            self._close_connection(conn)
        else:
            if self._is_connection_expired(conn):
                self._close_connection(conn)
            else:
                self.idle_connections.put(conn)

        logger.debug(f"Released connection {conn.id}")

    def _create_connection(self) -> ConnectionWrapper:
        try:
            conn = self.factory()
            wrapper = ConnectionWrapper(
                id=str(uuid.uuid4()),
                conn=conn,
                created_at=time.time(),
                last_used=time.time()
            )
            with self.lock:
                self.metrics["total_created"] += 1
            return wrapper
        except Exception as e:
            logger.error(f"Failed to create connection: {e}")
            raise

    def _close_connection(self, conn: ConnectionWrapper):
        try:
            if hasattr(conn.conn, 'close'):
                conn.conn.close()
        except Exception as e:
            logger.error(f"Error closing connection: {e}")
        with self.lock:
            self.metrics["total_closed"] += 1

    def _should_validate(self, conn: ConnectionWrapper) -> bool:
        if not self.config.test_on_acquire:
            return False
        if conn.health_check_count >= 5:
            conn.health_check_count = 0
            return True
        return True

    def _validate_connection(self, conn: ConnectionWrapper) -> bool:
        try:
            if hasattr(conn.conn, 'ping'):
                conn.conn.ping()
            elif hasattr(conn.conn, 'is_valid'):
                if not conn.conn.is_valid():
                    return False
            conn.health_check_count += 1
            return True
        except Exception as e:
            logger.warning(f"Connection validation failed: {e}")
            return False

    def _is_connection_expired(self, conn: ConnectionWrapper) -> bool:
        age = time.time() - conn.created_at
        idle_time = time.time() - conn.last_used
        return age > self.config.max_lifetime or idle_time > self.config.idle_timeout

    def _start_maintenance(self):
        self._running = True
        self._validation_thread = threading.Thread(target=self._maintenance_loop, daemon=True)
        self._validation_thread.start()

    def _maintenance_loop(self):
        while self._running:
            time.sleep(self.config.validation_interval)
            self._maintain_pool()

    def _maintain_pool(self):
        with self.lock:
            if self.status == PoolStatus.CLOSED:
                return

        current_size = self.idle_connections.qsize() + len(self.active_connections)
        min_size = self.config.min_size

        if current_size < min_size:
            for _ in range(min_size - current_size):
                try:
                    conn = self._create_connection()
                    self.idle_connections.put(conn)
                except Exception as e:
                    logger.error(f"Failed to create connection during maintenance: {e}")
                    break

        while self.idle_connections.qsize() > min_size:
            try:
                conn = self.idle_connections.get_nowait()
                if self._is_connection_expired(conn):
                    self._close_connection(conn)
                else:
                    self.idle_connections.put(conn)
                    break
            except Empty:
                break

    def get_size(self) -> int:
        return self.idle_connections.qsize() + len(self.active_connections)

    def get_in_use(self) -> int:
        return len(self.active_connections)

    def get_metrics(self) -> Dict:
        with self.lock:
            return {
                "total_created": self.metrics["total_created"],
                "total_acquired": self.metrics["total_acquired"],
                "total_released": self.metrics["total_released"],
                "total_closed": self.metrics["total_closed"],
                "acquire_timeouts": self.metrics["acquire_timeouts"],
                "current_size": self.get_size(),
                "in_use": self.get_in_use(),
                "available": self.idle_connections.qsize(),
                "status": self.status.value,
            }

    def drain(self, timeout: float = 30.0):
        self.status = PoolStatus.DRAINING
        deadline = time.time() + timeout

        while time.time() < deadline:
            with self.lock:
                if len(self.active_connections) == 0:
                    break
            time.sleep(0.1)

        while not self.idle_connections.empty():
            try:
                conn = self.idle_connections.get_nowait()
                self._close_connection(conn)
            except Empty:
                break

    def close(self):
        self._running = False
        self.status = PoolStatus.CLOSED
        self.drain(timeout=5.0)

class PooledConnection:
    def __init__(self, pool: ConnectionPool, conn: ConnectionWrapper):
        self.pool = pool
        self.conn = conn

    def __enter__(self):
        return self.conn.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.pool.release(self.conn)
        return False

    def __getattr__(self, name):
        return getattr(self.conn.conn, name)

def pooled(pool: ConnectionPool):
    def decorator(func):
        def wrapper(*args, **kwargs):
            conn_wrapper = pool.acquire()
            try:
                result = func(conn_wrapper.conn, *args, **kwargs)
                return result
            finally:
                pool.release(conn_wrapper)
        return wrapper
    return decorator
```

## Use Cases

- Database connection management
- HTTP connection pooling
- gRPC channel pooling
- Redis connection management
- Message queue connections
- Microservice client connections

## Artifacts

- `ConnectionPool`: Core pooling implementation
- `PoolConfig`: Configuration dataclass
- `ConnectionWrapper`: Connection wrapper
- `PooledConnection`: Context manager
- `pooled`: Decorator for pooled connections

## Related Skills

- Database Connections
- Resource Pooling
- Thread Safety
- Timeout Management
- Health Checks
- Bulkhead Pattern
