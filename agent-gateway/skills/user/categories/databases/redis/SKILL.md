---
name: Redis
description: In-memory data structure store serving as cache, message broker, and database with support for various data types
license: MIT
compatibility:
  - Python 3.8+
  - redis-py 4.0+
  - aioredis 2.0+ (async)
audience: Backend developers, DevOps engineers, system architects
category: databases
---

# Redis

## What I Do

I provide guidance on Redis, the ultra-fast in-memory data store. I help with caching strategies, session management, pub/sub messaging, rate limiting, leaderboards, and working with Redis Cluster for horizontal scaling.

## When to Use Me

- Session storage and user session caching
- Application caching layer for frequently accessed data
- Real-time analytics and counters
- Pub/sub messaging between services
- Rate limiting and throttling
- Leaderboards and sorted sets
- Task queues (Celery with Redis broker)
- geospatial queries (Redis 3.2+)

## Core Concepts

- **Strings**: Basic key-value storage
- **Lists**: Linked lists with push/pop operations
- **Sets**: Unordered collections of unique values
- **Sorted Sets**: Scores for ranking and ordering
- **Hashes**: Field-value pairs within a key
- **Bitmaps**: Space-efficient bit operations
- **HyperLogLog**: Probabilistic cardinality estimation
- **Streams**: Log-structured message storage
- **Lua Scripting**: Atomic server-side scripts
- **Persistence**: RDB snapshots, AOF logging

## Code Examples

### Basic Operations

```python
import redis
from typing import Optional

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

def cache_user_session(session_id: str, user_data: dict, ttl: int = 3600) -> None:
    r.setex(f"session:{session_id}", ttl, json.dumps(user_data))

def get_user_session(session_id: str) -> Optional[dict]:
    data = r.get(f"session:{session_id}")
    return json.loads(data) if data else None
```

### Sorted Sets for Leaderboards

```python
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

def add_score(user_id: str, score: float) -> None:
    r.zadd("leaderboard", {user_id: score})

def get_top_players(limit: int = 10) -> list:
    return r.zrevrange("leaderboard", 0, limit - 1, withscores=True)

def get_user_rank(user_id: str) -> int:
    return r.zrevrank("leaderboard", user_id)

def increment_score(user_id: str, increment: float) -> float:
    return r.zincrby("leaderboard", increment, user_id)
```

### Rate Limiting

```python
import redis
import time

r = redis.Redis(host="localhost", port=6379, db=0)

def rate_limit(key: str, max_requests: int, window: int) -> tuple:
    now = time.time()
    window_key = f"ratelimit:{key}:{int(now // window)}"
    
    pipe = r.pipeline()
    pipe.incr(window_key)
    pipe.ttl(window_key)
    results = pipe.execute()
    
    current_count = results[0]
    remaining_ttl = results[1]
    
    if current_count > max_requests:
        return False, remaining_ttl
    return True, remaining_ttl - (now % window)
```

### Pub/Sub Messaging

```python
import redis.asyncio as redis

async def publish_event(channel: str, event_data: dict) -> None:
    r = await redis.Redis()
    await r.publish(channel, json.dumps(event_data))

async def subscribe_events(channel: str):
    r = await redis.Redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(channel)
    
    async for message in pubsub.listen():
        if message["type"] == "message":
            yield json.loads(message["data"])
```

## Best Practices

1. Use connection pooling for high concurrency
2. Set appropriate TTLs for cached data
3. Use Redis Sentinel for high availability
4. Prefer pipelining for batch operations
5. Use appropriate data structures for your use case
6. Monitor memory usage and configure eviction policies
7. Use Redis Cluster for horizontal scaling
8. Implement circuit breaker patterns for cache failures
9. Use Lua scripts for atomic multi-key operations
10. Separate hot and cold data appropriately

## Common Patterns

**Distributed Lock:**
```python
def acquire_lock(lock_name: str, timeout: int = 10) -> Optional[str]:
    import uuid
    lock_id = str(uuid.uuid4())
    if r.set(lock_name, lock_id, nx=True, ex=timeout):
        return lock_id
    return None

def release_lock(lock_name: str, lock_id: str) -> bool:
    script = """
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
    """
    return r.eval(script, 1, lock_name, lock_id)
```

**Cache-Aside Pattern:**
```python
def get_user_cached(user_id: int) -> dict:
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    user = db.get_user(user_id)
    r.setex(cache_key, 3600, json.dumps(user))
    return user
```

**Rate Limiter (Sliding Window):**
```python
def sliding_window_rate_limit(key: str, limit: int, window: int) -> bool:
    now = time.time()
    window_start = now - window
    
    pipe = r.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window)
    results = pipe.execute()
    
    return results[2] <= limit
```
