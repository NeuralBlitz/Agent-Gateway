---
name: caching
description: Caching strategies and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: performance
---
## What I do
- Implement caching at multiple levels
- Choose appropriate cache strategies
- Handle cache invalidation
- Prevent cache stampede
- Use distributed caching effectively
- Monitor cache performance
- Implement cache warming

## When to use me
When implementing caching solutions or optimizing cache performance.

## Multi-Level Caching
```
┌─────────────────────────────────────────────────────────────┐
│                     Request                                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Browser Cache (HTTP)                         │
│  - Cache-Control headers                                    │
│  - ETag/Last-Modified                                      │
│  - LocalStorage/SessionStorage                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                CDN / Edge Cache                              │
│  - CloudFront, Cloudflare                                   │
│  - Static assets, API responses                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Application Cache (Memory)                     │
│  - In-memory caches (LRU, LFU)                              │
│  - Per-process or shared memory                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Distributed Cache (Redis/Memcached)            │
│  - Shared across instances                                  │
│  - High availability                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Database Cache                                │
│  - Query cache                                             │
│  - Buffer pool                                             │
└─────────────────────────────────────────────────────────────┘
```

## Cache Strategies
```python
import redis
import json
from typing import Optional, Callable, Any
from functools import wraps
from datetime import timedelta


class CacheService:
    """Multi-level cache service with TTL support."""
    
    def __init__(self, redis_url: str) -> None:
        self.redis = redis.from_url(redis_url)
        self.local_cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get from cache hierarchy."""
        # Check local cache first
        if key in self.local_cache:
            value, expires = self.local_cache[key]
            if expires > datetime.utcnow():
                return value
            del self.local_cache[key]
        
        # Check distributed cache
        cached = self.redis.get(key)
        if cached:
            value = json.loads(cached)
            # Populate local cache
            self.local_cache[key] = (
                value,
                datetime.utcnow() + timedelta(seconds=60)
            )
            return value
        
        return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int = 3600,
        local_ttl_seconds: int = 60
    ) -> None:
        """Set in both cache layers."""
        # Set distributed cache
        self.redis.setex(key, ttl_seconds, json.dumps(value))
        
        # Set local cache with shorter TTL
        self.local_cache[key] = (
            value,
            datetime.utcnow() + timedelta(seconds=local_ttl_seconds)
        )
    
    def delete(self, key: str) -> None:
        """Delete from both cache layers."""
        self.redis.delete(key)
        self.local_cache.pop(key, None)
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Delete keys matching pattern."""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
        # Clear local cache
        for key in list(self.local_cache.keys()):
            if pattern.replace('*', '') in key:
                del self.local_cache[key]


def cached(
    ttl: int = 3600,
    key_prefix: str = ''
):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            cache = get_cache_service()
            key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            
            cached_value = cache.get(key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator
```

## Cache Stampede Prevention
```python
import asyncio
import async_timeout


class CacheStampedePreventer:
    """Prevent cache stampede with distributed locking."""
    
    def __init__(
        self,
        cache: CacheService,
        lock_ttl: int = 30
    ) -> None:
        self.cache = cache
        self.lock_ttl = lock_ttl
    
    async def get_or_compute(
        self,
        key: str,
        compute_fn: Callable,
        ttl: int = 3600
    ) -> Any:
        """Get from cache or compute with stampede prevention."""
        # Try cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        
        # Acquire distributed lock
        lock_key = f"lock:{key}"
        lock_acquired = self.cache.redis.set(
            lock_key,
            "locked",
            nx=True,
            ex=self.lock_ttl
        )
        
        if not lock_acquired:
            # Wait for other process to compute
            return await self._wait_for_computation(key, compute_fn)
        
        try:
            # Compute and cache
            result = await compute_fn()
            self.cache.set(key, result, ttl)
            return result
        finally:
            # Release lock
            self.cache.redis.delete(lock_key)
    
    async def _wait_for_computation(
        self,
        key: str,
        compute_fn: Callable
    ) -> Any:
        """Wait for computation to complete."""
        max_wait = 10  # seconds
        
        for _ in range(max_wait * 10):  # Poll every 100ms
            cached = self.cache.get(key)
            if cached is not None:
                return cached
            await asyncio.sleep(0.1)
        
        # If still not cached, compute ourselves
        return await compute_fn()


class ProbabilisticEarlyRecomputation:
    """Prevent expired cache with early recomputation."""
    
    def __init__(
        self,
        cache: CacheService,
        delta_percent: int = 10
    ) -> None:
        self.cache = cache
        self.delta_percent = delta_percent
    
    def get(self, key: str, compute_fn: Callable) -> Any:
        """Get with early recomputation."""
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        
        ttl = self.cache.redis.ttl(key)
        if ttl == -1:  # Key doesn't exist
            return compute_fn()
        
        # If within delta period, recompute in background
        threshold = ttl * (100 - self.delta_percent) / 100
        if ttl < threshold:
            # Could trigger background task here
            pass
        
        return compute_fn()
```

## HTTP Caching
```python
from fastapi import Request, Response
from typing import Optional


class CacheControlMiddleware:
    """Add appropriate cache control headers."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        
        async def send_wrapper(message):
            if message['type'] == 'http.response.start':
                request = Request(scope)
                response = Response(
                    content=b'',
                    status_code=message['status'],
                    headers=dict(message.get('headers', []))
                )
                
                # Set cache headers based on route
                if '/api/' in request.url.path:
                    # API endpoints - no cache or short cache
                    if '/static/' not in request.url.path:
                        response.headers['Cache-Control'] = 'no-cache'
                else:
                    # Static content - long cache
                    response.headers['Cache-Control'] = 'public, max-age=31536000'
                
                message['headers'] = list(response.headers.items())
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)
```

## Cache Invalidation Patterns
```python
# Event-driven cache invalidation
class CacheInvalidator:
    def __init__(self, cache: CacheService) -> None:
        self.cache = cache
        self.subscriptions = {}
    
    def subscribe(self, event_type: str, callback: Callable) -> None:
        """Subscribe to invalidation events."""
        if event_type not in self.subscriptions:
            self.subscriptions[event_type] = []
        self.subscriptions[event_type].append(callback)
    
    def invalidate(self, event_type: str, data: dict) -> None:
        """Trigger invalidation based on event."""
        if event_type in self.subscriptions:
            for callback in self.subscriptions[event_type]:
                pattern = callback(data)
                if pattern:
                    self.cache.invalidate_pattern(pattern)
    
    def on_user_update(self, user_id: str) -> None:
        """Invalidate user-related caches."""
        patterns = [
            f"user:{user_id}:*",
            f"users:list:*",
            f"stats:user:{user_id}",
        ]
        for pattern in patterns:
            self.cache.invalidate_pattern(pattern)
```

## Cache Monitoring
```python
class CacheMonitor:
    """Monitor cache performance."""
    
    def __init__(self, redis_client: redis.Redis) -> None:
        self.redis = redis_client
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        info = self.redis.info('stats')
        memory = self.redis.info('memory')
        
        return {
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0),
            'hit_rate': self._calculate_hit_rate(info),
            'used_memory': memory.get('used_memory_human'),
            'connected_clients': self.redis.info('clients').get('connected_clients', 0),
            'uptime_seconds': self.redis.info('server').get('uptime_in_seconds', 0),
        }
    
    def _calculate_hit_rate(self, info: dict) -> float:
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        if total == 0:
            return 0.0
        return round(hits / total * 100, 2)
```
