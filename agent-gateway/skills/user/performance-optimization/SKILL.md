---
name: performance-optimization
description: Performance optimization techniques and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: performance
---
## What I do
- Profile and identify bottlenecks
- Optimize database queries
- Implement caching strategies
- Optimize algorithmic complexity
- Handle memory efficiently
- Reduce network overhead
- Parallelize operations
- Monitor performance metrics

## When to use me
When optimizing application performance or debugging slow code.

## Performance Profiling
```python
import cProfile
import pstats
import memory_profiler
import time
from functools import wraps
import line_profiler


def profile_function(profile_file: str = "profile.prof"):
    """Decorator to profile function execution."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            profiler = cProfile.Profile()
            profiler.enable()
            
            result = func(*args, **kwargs)
            
            profiler.disable()
            profiler.dump_stats(profile_file)
            
            # Print stats
            stats = pstats.Stats(profiler)
            stats.sort_stats('cumulative')
            stats.print_stats(20)
            
            return result
        return wrapper
    return decorator


@profile_function()
def slow_function():
    """Example slow function."""
    data = []
    for i in range(10000):
        data.append(i * 2)
    return sum(data)


# Memory profiling
@memory_profiler.profile
def memory_intensive():
    """Profile memory usage."""
    large_list = [i for i in range(1000000)]
    return sum(large_list)


# Line-by-line profiling
def profile_lines():
    profiler = line_profiler.LineProfiler()
    profiler.add_function(slow_function)
    profiler.enable()
    
    slow_function()
    
    profiler.disable()
    profiler.print_stats()
```

## Database Query Optimization
```python
# N+1 Query Problem

# BAD - N+1 queries
def get_all_users_with_posts():
    users = db.query(User).all()  # 1 query
    
    result = []
    for user in users:  # N queries!
        posts = db.query(Post).filter_by(user_id=user.id).all()
        result.append({'user': user, 'posts': posts})
    
    return result


# GOOD - eager loading
def get_all_users_with_posts():
    # Single query with JOIN
    users = (
        db.query(User)
        .options(joinedload(User.posts))
        .all()
    )
    
    return [{'user': user, 'posts': user.posts} for user in users]


# GOOD - select in load
def get_all_users_with_posts():
    users = db.query(User).all()
    
    # Batch load posts
    user_ids = [u.id for u in users]
    posts = db.query(Post).filter(Post.user_id.in_(user_ids)).all()
    
    posts_by_user = {}
    for post in posts:
        posts_by_user.setdefault(post.user_id, []).append(post)
    
    return [
        {'user': user, 'posts': posts_by_user.get(user.id, [])}
        for user in users
    ]


# Index optimization
class OptimizedQuery:
    @staticmethod
    def create_optimized_indexes():
        # Composite index for common queries
        indexes = [
            # For filtering and sorting
            "CREATE INDEX idx_posts_status_published ON posts(status) WHERE status = 'published'",
            "CREATE INDEX idx_users_email ON users(email)",
            
            # Composite index
            "CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC)",
            
            # Covering index (includes all queried columns)
            "CREATE INDEX idx_products_cover ON products(category_id, price) INCLUDE (name, description)",
        ]
        
        for idx in indexes:
            db.execute(idx)
```

## Caching Strategies
```python
from functools import lru_cache
from cachetools import TTLCache, LRUCache


# Function-level caching
@lru_cache(maxsize=128)
def expensive_computation(n: int) -> int:
    """Cache expensive function results."""
    result = sum(range(n))
    return result


# Time-based caching
class TTLCache:
    def __init__(self, ttl_seconds: int = 300, maxsize: int = 1000):
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl_seconds)
    
    def get(self, key: str):
        return self.cache.get(key)
    
    def set(self, key: str, value):
        self.cache[key] = value


# Query result caching
class QueryCache:
    def __init__(self, cache: TTLCache):
        self.cache = cache
    
    def get_or_set(
        self,
        query_key: str,
        query_func: callable,
        ttl: int = 300
    ):
        """Cache query results with TTL."""
        if query_key in self.cache:
            return self.cache[query_key]
        
        result = query_func()
        self.cache[query_key] = result
        return result


# Invalidation strategies
class CacheInvalidator:
    def __init__(self, cache):
        self.cache = cache
        self.subscriptions = {}
    
    def subscribe(self, key_pattern: str, callback: callable):
        """Subscribe to cache invalidation events."""
        self.subscriptions[key_pattern] = callback
    
    def invalidate(self, key: str):
        """Invalidate matching cache entries."""
        self.cache.pop(key, None)
        
        for pattern, callback in self.subscriptions.items():
            if self._matches(key, pattern):
                callback(key)
    
    def _matches(self, key: str, pattern: str) -> bool:
        """Check if key matches pattern."""
        import fnmatch
        return fnmatch.fnmatch(key, pattern)
```

## Async Optimization
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List


class AsyncBatchProcessor:
    """Process items in batches for efficiency."""
    
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
    
    async def process_items(self, items: List[dict]) -> List[dict]:
        """Process items in batches."""
        results = []
        
        for i in range(0, len(items), self.batch_size):
            batch = items[i:i + self.batch_size]
            batch_results = await self._process_batch(batch)
            results.extend(batch_results)
        
        return results
    
    async def _process_batch(self, batch: List[dict]) -> List[dict]:
        """Process single batch."""
        return await asyncio.gather(
            *[self._process_item(item) for item in batch]
        )
    
    async def _process_item(self, item: dict) -> dict:
        """Process single item."""
        # Simulated processing
        return item


# Parallel execution with thread pool
class ParallelProcessor:
    """Execute CPU-bound tasks in parallel."""
    
    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def process_cpu_intensive(self, items: List[int]) -> List[int]:
        """Process items in parallel."""
        loop = asyncio.new_event_loop()
        
        tasks = [
            loop.run_in_executor(self.executor, self._cpu_task, item)
            for item in items
        ]
        
        return loop.run_until_complete(asyncio.gather(*tasks))
    
    def _cpu_task(self, n: int) -> int:
        """CPU intensive task."""
        return sum(range(n))
```

## Memory Optimization
```python
import gc
from typing import Generator
import sys


class MemoryOptimizer:
    """Optimize memory usage."""
    
    @staticmethod
    def get_memory_usage():
        """Get current memory usage in MB."""
        import psutil
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    @staticmethod
    def force_garbage_collection():
        """Force garbage collection."""
        gc.collect()
    
    @staticmethod
    def disable_garbage_collection():
        """Disable GC for performance-critical sections."""
        gc.disable()
    
    @staticmethod
    def enable_garbage_collection():
        """Re-enable garbage collection."""
        gc.enable()


# Generator for lazy evaluation
def process_large_file(file_path: str) -> Generator[dict, None, None]:
    """Process file line by line without loading entire file."""
    with open(file_path, 'r') as f:
        for line in f:
            yield parse_line(line)


# Chunked processing
def process_in_chunks(data: list, chunk_size: int = 1000):
    """Yield chunks from data for memory efficiency."""
    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]


# Use slots for classes
class OptimizedClass:
    """Use __slots__ to reduce memory overhead."""
    
    __slots__ = ['name', 'value', 'timestamp']
    
    def __init__(self, name: str, value: int):
        self.name = name
        self.value = value
        self.timestamp = None


# Data compression for transmission
import zlib


def compress_data(data: bytes) -> bytes:
    """Compress data for transmission."""
    return zlib.compress(data, level=6)


def decompress_data(data: bytes) -> bytes:
    """Decompress data."""
    return zlib.decompress(data)
```

## Best Practices
```
1. Measure before optimizing
   - Profile to find actual bottlenecks
   - Don't guess performance issues

2. Use appropriate data structures
   - Choose O(1) vs O(n) operations
   - Use sets for membership testing

3. Batch operations
   - Reduce round trips
   - Use bulk operations

4. Lazy loading
   - Defer expensive operations
   - Use generators

5. Caching
   - Cache expensive computations
   - Use appropriate TTL

6. Connection pooling
   - Reuse database connections
   - Reuse HTTP connections

7. Async I/O
   - Non-blocking for I/O-bound
   - Parallel for CPU-bound

8. Monitor in production
   - Track performance metrics
   - Alert on degradation
```
