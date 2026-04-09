---
name: system-design
description: System design principles and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Design scalable and reliable systems
- Apply CAP theorem and trade-offs
- Choose appropriate data storage solutions
- Design for high availability and fault tolerance
- Implement caching strategies
- Handle rate limiting and throttling
- Design APIs for scalability
- Consider security from the start

## When to use me
When designing system architecture or reviewing high-level designs.

## CAP Theorem
```
         Consistency + Partition Tolerance
                     /\
                    /  \
                   /    \
                  /      \
                 /   AP   \
                /          \
               /            \
              /              \
             /                \
            /    Consistency   \
           /      Availability \
          /                    \
         /----------------------\
        /       CA              \
       /                        \
      /    Availability          \
     /       Consistency         \
    /______________________________\

Choose 2 of 3:
- CP (Consistency + Partition Tolerance): Databases like MongoDB, Redis Cluster
- AP (Availability + Partition Tolerance): DynamoDB, Cassandra, CouchDB
- CA (Consistency + Availability): Not possible with network partitions
```

## High-Level Design Components

### Load Balancer
```
                    ┌──────────────────────────────────────┐
                    │         Load Balancer                 │
                    │   (Nginx, AWS ALB, Cloudflare)        │
                    └──────────────┬───────────────────────┘
                                   │
         ┌─────────────┬─────────────┼─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ App     │  │ App     │  │ App     │  │ App     │  │ App     │
    │ Server  │  │ Server  │  │ Server  │  │ Server  │  │ Server  │
    │ (x3)    │  │ (x3)    │  │ (x3)    │  │ (x3)    │  │ (x3)    │
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │             │             │             │             │
         └─────────────┴─────────────┼─────────────┴─────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │        Cache Layer             │
                    │   (Redis Cluster, Memcached)   │
                    └───────────────┬───────────────┘
                                    │
         ┌─────────────┬─────────────┼─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Primary  │  │Replica  │  │Replica  │  │Replica  │  │Replica  │
    │DB       │  │DB       │  │DB       │  │DB       │  │DB       │
    └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

## Caching Strategies

### Cache-Aside Pattern
```python
def get_user(user_id: str) -> Optional[User]:
    """Cache-aside: Check cache first, then database."""
    # 1. Check cache
    cached = cache.get(f"user:{user_id}")
    if cached:
        return User.from_dict(cached)
    
    # 2. Fetch from database
    user = database.get_user(user_id)
    if user:
        # 3. Store in cache with TTL
        cache.set(f"user:{user_id}", user.to_dict(), ttl=3600)
    
    return user


def update_user(user_id: str, **kwargs) -> None:
    """On update: Invalidate cache, then update database."""
    # 1. Update database
    database.update_user(user_id, **kwargs)
    
    # 2. Invalidate cache
    cache.delete(f"user:{user_id}")
```

### Read-Through / Write-Through
```python
class CachedRepository:
    def __init__(self, cache: Cache, db: Database) -> None:
        self.cache = cache
        self.db = db
    
    async def get(self, key: str) -> Optional[dict]:
        """Read-through cache."""
        # Check cache first
        cached = await self.cache.get(key)
        if cached:
            return cached
        
        # Fetch from DB and cache
        result = await self.db.query(key)
        if result:
            await self.cache.set(key, result, ttl=3600)
        
        return result
    
    async def set(self, key: str, value: dict) -> None:
        """Write-through: Write to cache and database."""
        await self.db.save(key, value)
        await self.cache.set(key, value, ttl=3600)
```

### Write-Behind / Write-Back
```python
class WriteBehindCache:
    """Buffer writes and batch to database."""
    
    def __init__(self, cache: Redis, db: Database) -> None:
        self.cache = cache
        self.db = db
        self.write_buffer = []
    
    async def set(self, key: str, value: dict) -> None:
        """Write to cache immediately, queue for DB."""
        await self.cache.set(key, value)
        await self.cache.lpush('write_buffer', json.dumps({
            'key': key,
            'value': value,
            'timestamp': time.time(),
        }))
    
    async def flush_buffer(self) -> None:
        """Batch process write buffer to database."""
        while True:
            item = await self.cache.rpop('write_buffer')
            if not item:
                break
            
            data = json.loads(item)
            await self.db.save(data['key'], data['value'])
```

## Rate Limiting
```python
from datetime import datetime, timedelta
from collections import defaultdict


class RateLimiter:
    """Token bucket rate limiter with sliding window."""
    
    def __init__(
        self,
        max_requests: int,
        window_seconds: int
    ) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[datetime]] = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed under rate limit."""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        # Remove old requests outside window
        self.requests[key] = [
            t for t in self.requests[key]
            if t > window_start
        ]
        
        # Check limit
        if len(self.requests[key]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests in window."""
        window_start = datetime.utcnow() - timedelta(seconds=self.window_seconds)
        current = len([
            t for t in self.requests[key]
            if t > window_start
        ])
        return max(0, self.max_requests - current)
    
    def get_reset_time(self, key: str) -> datetime:
        """Get time when rate limit resets."""
        window_start = datetime.utcnow() - timedelta(seconds=self.window_seconds)
        oldest = min(self.requests[key]) if self.requests[key] else datetime.utcnow()
        return oldest + timedelta(seconds=self.window_seconds)
```

## Circuit Breaker
```python
import asyncio
from enum import Enum


class CircuitState(Enum):
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half_open'


class CircuitBreaker:
    """Circuit breaker pattern for external service calls."""
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        timeout_seconds: int = 60
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout_seconds = timeout_seconds
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
    
    async def call(self, coro):
        """Execute coroutine with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitOpenError(
                    f"Circuit {self.name} is open"
                )
        
        try:
            result = await coro
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to retry."""
        if self.last_failure_time is None:
            return True
        return (
            datetime.utcnow() - self.last_failure_time
        ).total_seconds() >= self.timeout_seconds
    
    def _on_success(self) -> None:
        """Handle successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
        else:
            self.failure_count = 0
    
    def _on_failure(self) -> None:
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            self.success_count = 0
```

## Database Scaling Patterns

### Read Replicas
```
                    ┌─────────────────┐
                    │   Application    │
                    └────────┬────────┘
                             │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │ Primary │──────────│ Replica │──────────│ Replica │
    │   DB    │ sync     │   DB    │ async    │   DB    │
    └─────────┘          └─────────┘          └─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    Writes go to Primary
                    Reads go to Replicas
```

### Sharding
```python
def get_shard(user_id: str, num_shards: int) -> int:
    """Consistent hashing for sharding."""
    return hash(user_id) % num_shards


class ShardedDatabase:
    def __init__(self, shards: int) -> None:
        self.shards = shards
        self.connections: list[DatabaseConnection] = []
    
    async def get_user(self, user_id: str) -> Optional[User]:
        """Route to correct shard."""
        shard_id = get_shard(user_id, self.shards)
        connection = self.connections[shard_id]
        return await connection.query(
            "SELECT * FROM users WHERE id = ?",
            (user_id,)
        )
    
    async def save_user(self, user: User) -> None:
        """Save to appropriate shard."""
        shard_id = get_shard(user.id, self.shards)
        connection = self.connections[shard_id]
        await connection.execute(
            "INSERT INTO users ...",
            (user.id, user.name, ...)
        )
```
