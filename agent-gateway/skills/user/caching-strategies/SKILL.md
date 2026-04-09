# Caching Strategies

## Overview

Caching Strategies encompass the patterns, techniques, and best practices for storing frequently accessed data in high-speed storage layers to improve application performance, reduce latency, and decrease load on backend systems. Effective caching is a critical optimization technique that can dramatically improve system throughput and user experience by serving requests from memory rather than computing or fetching data from slower storage.

## Description

Caching strategies define how data is stored, retrieved, invalidated, and refreshed in a caching layer. The choice of strategy significantly impacts application performance, data consistency, and system complexity. Key considerations include cache locality (where data is cached), cache expiration policies, write-through vs write-back approaches, and cache invalidation mechanisms. Different data access patterns require different caching approaches, and understanding these tradeoffs is essential for building efficient systems.

Modern applications employ multiple caching layers including in-memory caches, distributed caches, CDN caching, and browser caching. Each layer has different characteristics in terms of latency, capacity, and consistency guarantees. Effective caching strategies coordinate these layers to maximize performance while maintaining data integrity.

## Prerequisites

- Understanding of computer memory hierarchy and access patterns
- Knowledge of key-value data structures
- Familiarity with distributed systems concepts
- Understanding of TTL and expiration concepts
- Knowledge of cache invalidation patterns
- Experience with database or storage systems

## Core Competencies

- Cache-aside pattern implementation
- Write-through and write-back caching
- TTL-based expiration policies
- Cache invalidation strategies
- Distributed cache deployment
- Cache warming and preloading
- Cache size management and eviction policies
- Cache coherence in distributed systems

## Implementation

### Python Implementation with Multiple Strategies

```python
import time
import hashlib
import threading
from typing import Any, Optional, Callable, Dict, List, Tuple
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from collections import OrderedDict
import logging
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class CacheConfig:
    max_size: int = 1000
    default_ttl: int = 3600
    eviction_policy: str = "lru"
    enable_metrics: bool = True


@dataclass
class CacheEntry:
    key: str
    value: Any
    created_at: float
    expires_at: float
    access_count: int = 0
    last_accessed: float = 0.0
    metadata: Dict = field(default_factory=dict)


class EvictionPolicy(ABC):
    @abstractmethod
    def access(self, key: str):
        pass

    @abstractmethod
    def evict(self, count: int) -> List[str]:
        pass

    @abstractmethod
    def add(self, key: str):
        pass

    @abstractmethod
    def remove(self, key: str):
        pass


class LRUEvictionPolicy(EvictionPolicy):
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.order: OrderedDict[str, None] = OrderedDict()
        self.data: Dict[str, Any] = {}

    def access(self, key: str):
        if key in self.order:
            self.order.move_to_end(key)

    def evict(self, count: int) -> List[str]:
        evicted = []
        for _ in range(min(count, len(self.order) - self.max_size)):
            if self.order:
                key, _ = self.order.popitem(last=False)
                self.data.pop(key, None)
                evicted.append(key)
        return evicted

    def add(self, key: str):
        self.order[key] = None
        self.data[key] = None

    def remove(self, key: str):
        self.order.pop(key, None)
        self.data.pop(key, None)

    def get_data(self) -> Dict[str, Any]:
        return self.data


class LFUEvictionPolicy(EvictionPolicy):
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.frequencies: Dict[int, OrderedDict[str, None]] = {
            0: OrderedDict()
        }
        self.key_frequency: Dict[str, int] = {}
        self.min_freq: int = 0

    def access(self, key: str):
        freq = self.key_frequency.get(key, 0)
        self.key_frequency[key] = freq + 1

        if freq in self.frequencies:
            self.frequencies[freq].pop(key, None)
            if freq == self.min_freq and not self.frequencies[freq]:
                self.min_freq += 1

        if freq + 1 not in self.frequencies:
            self.frequencies[freq + 1] = OrderedDict()
        self.frequencies[freq + 1][key] = None

    def evict(self, count: int) -> List[str]:
        evicted = []
        for _ in range(count):
            if self.min_freq not in self.frequencies:
                break
            freq_dict = self.frequencies[self.min_freq]
            if not freq_dict:
                self.min_freq += 1
                continue

            key, _ = freq_dict.popitem(last=False)
            self.key_frequency.pop(key, None)
            evicted.append(key)

        return evicted

    def add(self, key: str):
        self.key_frequency[key] = 0
        if 0 not in self.frequencies:
            self.frequencies[0] = OrderedDict()
        self.frequencies[0][key] = None
        self.min_freq = 0

    def remove(self, key: str):
        freq = self.key_frequency.get(key, 0)
        if freq in self.frequencies:
            self.frequencies[freq].pop(key, None)
        self.key_frequency.pop(key, None)


class CacheStats:
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.set_operations = 0
        self.get_operations = 0
        self.bytes_stored = 0
        self.start_time = time.time()
        self.lock = threading.Lock()

    def record_hit(self):
        with self.lock:
            self.hits += 1

    def record_miss(self):
        with self.lock:
            self.misses += 1

    def record_eviction(self):
        with self.lock:
            self.evictions += 1

    def record_set(self, size: int):
        with self.lock:
            self.set_operations += 1
            self.bytes_stored += size

    def record_get(self):
        with self.lock:
            self.get_operations += 1

    def get_stats(self) -> Dict:
        with self.lock:
            total = self.hits + self.misses
            return {
                "hits": self.hits,
                "misses": self.misses,
                "total": total,
                "hit_rate": self.hits / total if total > 0 else 0.0,
                "miss_rate": self.misses / total if total > 0 else 0.0,
                "evictions": self.evictions,
                "set_operations": self.set_operations,
                "get_operations": self.get_operations,
                "bytes_stored": self.bytes_stored,
                "uptime_seconds": time.time() - self.start_time,
            }


class CacheBackend(ABC):
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        pass

    @abstractmethod
    def delete(self, key: str):
        pass

    @abstractmethod
    def clear(self):
        pass


class InMemoryCache(CacheBackend):
    def __init__(self, config: CacheConfig):
        self.config = config
        self.data: Dict[str, CacheEntry] = {}
        self.eviction_policy: EvictionPolicy = self._create_eviction_policy()
        self.stats = CacheStats() if config.enable_metrics else None
        self.lock = threading.RLock()

    def _create_eviction_policy(self) -> EvictionPolicy:
        if self.config.eviction_policy == "lru":
            return LRUEvictionPolicy(self.config.max_size)
        elif self.config.eviction_policy == "lfu":
            return LFUEvictionPolicy(self.config.max_size)
        else:
            return LRUEvictionPolicy(self.config.max_size)

    def get(self, key: str) -> Optional[Any]:
        if key not in self.data:
            if self.stats:
                self.stats.record_miss()
            return None

        entry = self.data[key]
        if entry.expires_at < time.time():
            self._remove(key)
            if self.stats:
                self.stats.record_miss()
            return None

        entry.access_count += 1
        entry.last_accessed = time.time()
        self.eviction_policy.access(key)

        if self.stats:
            self.stats.record_hit()

        return entry.value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.config.default_ttl
        now = time.time()
        expires_at = now + ttl

        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now,
            expires_at=expires_at,
        )

        with self.lock:
            if key not in self.data:
                self.eviction_policy.add(key)
            else:
                self.eviction_policy.access(key)

            self.data[key] = entry
            self._enforce_capacity()

        if self.stats:
            size = len(str(value))
            self.stats.record_set(size)

    def _enforce_capacity(self):
        while len(self.data) > self.config.max_size:
            evicted = self.eviction_policy.evict(1)
            for key in evicted:
                self._remove(key)
                if self.stats:
                    self.stats.record_eviction()

    def _remove(self, key: str):
        if key in self.data:
            del self.data[key]
            self.eviction_policy.remove(key)

    def delete(self, key: str):
        with self.lock:
            self._remove(key)

    def clear(self):
        with self.lock:
            self.data.clear()
            self.eviction_policy = self._create_eviction_policy()

    def get_stats(self) -> Optional[Dict]:
        if self.stats:
            return self.stats.get_stats()
        return None


class CacheStrategy(ABC):
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        pass

    @abstractmethod
    def invalidate(self, key: str):
        pass


class CacheAsideStrategy(CacheStrategy):
    def __init__(
        self,
        cache: CacheBackend,
        data_source: Callable[[str], Any],
        default_ttl: int = 3600
    ):
        self.cache = cache
        self.data_source = data_source
        self.default_ttl = default_ttl

    def get(self, key: str) -> Any:
        value = self.cache.get(key)
        if value is not None:
            logger.debug(f"Cache hit for key: {key}")
            return value

        logger.debug(f"Cache miss for key: {key}, fetching from source")
        value = self.data_source(key)
        if value is not None:
            self.cache.set(key, value, self.default_ttl)

        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        self.cache.set(key, value, ttl or self.default_ttl)

    def invalidate(self, key: str):
        self.cache.delete(key)

    def refresh(self, key: str) -> Any:
        value = self.data_source(key)
        if value is not None:
            self.cache.set(key, value, self.default_ttl)
        return value


class WriteThroughStrategy(CacheStrategy):
    def __init__(self, cache: CacheBackend, data_sink: Callable[[str, Any], None]):
        self.cache = cache
        self.data_sink = data_sink

    def get(self, key: str) -> Optional[Any]:
        return self.cache.get(key)

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        self.data_sink(key, value)
        self.cache.set(key, value, ttl)

    def invalidate(self, key: str):
        self.cache.delete(key)


class WriteBehindStrategy(CacheStrategy):
    def __init__(
        self,
        cache: CacheBackend,
        data_sink: Callable[[str, Any], None],
        batch_size: int = 100,
        flush_interval: int = 5
    ):
        self.cache = cache
        self.data_sink = data_sink
        self.pending_writes: Dict[str, Any] = {}
        self.write_buffer: Dict[str, Any] = {}
        self.lock = threading.Lock()
        self._running = False
        self._flush_thread: Optional[threading.Thread] = None

    def start(self):
        self._running = True
        self._flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._flush_thread.start()

    def stop(self, timeout: float = 10.0):
        self._running = False
        if self._flush_thread:
            self._flush_thread.join(timeout=timeout)
        self.flush()

    def _flush_loop(self):
        while self._running:
            time.sleep(5)
            self.flush()

    def flush(self):
        with self.lock:
            if self.write_buffer:
                for key, value in self.write_buffer.items():
                    self.data_sink(key, value)
                self.write_buffer.clear()

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        self.cache.set(key, value, ttl)
        with self.lock:
            self.write_buffer[key] = value

    def get(self, key: str) -> Optional[Any]:
        return self.cache.get(key)

    def invalidate(self, key: str):
        self.cache.delete(key)
        with self.lock:
            self.write_buffer.pop(key, None)


class ReadThroughStrategy(CacheStrategy):
    def __init__(
        self,
        cache: CacheBackend,
        data_loader: Callable[[str], Any],
        default_ttl: int = 3600
    ):
        self.cache = cache
        self.data_loader = data_loader
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        value = self.cache.get(key)
        if value is not None:
            return value

        value = self.data_loader(key)
        if value is not None:
            self.cache.set(key, value, self.default_ttl)

        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        self.cache.set(key, value, ttl or self.default_ttl)

    def invalidate(self, key: str):
        self.cache.delete(key)


class MultiLevelCache:
    def __init__(self, caches: List[CacheBackend], default_ttl: int = 3600):
        self.caches = caches
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        for i, cache in enumerate(self.caches):
            value = cache.get(key)
            if value is not None:
                logger.debug(f"Multi-level cache hit at level {i}")
                for j in range(i):
                    self.caches[j].set(key, value, self.default_ttl)
                return value
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.default_ttl
        for cache in self.caches:
            cache.set(key, value, ttl)

    def invalidate(self, key: str):
        for cache in self.caches:
            cache.delete(key)

    def get_stats(self) -> List[Dict]:
        return [c.get_stats() for c in self.caches if c.get_stats()]
```

### Go Implementation

```go
package cache

import (
	"context"
	"encoding/json"
	"hash/fnv"
	"sync"
	"time"
)

type CacheBackend interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	Clear(ctx context.Context) error
}

type Stats struct {
	Hits       int64
	Misses     int64
	Evictions  int64
	Sets       int64
	Gets       int64
	BytesUsed  int64
	StartTime  time.Time
	mu         sync.RWMutex
}

func (s *Stats) RecordHit() {
	s.mu.Lock()
	s.Hits++
	s.mu.Unlock()
}

func (s *Stats) RecordMiss() {
	s.mu.Lock()
	s.Misses++
	s.mu.Unlock()
}

func (s *Stats) RecordEviction() {
	s.mu.Lock()
	s.Evictions++
	s.mu.Unlock()
}

func (s *Stats) RecordSet(size int64) {
	s.mu.Lock()
	s.Sets++
	s.BytesUsed += size
	s.mu.Unlock()
}

func (s *Stats) RecordGet() {
	s.mu.Lock()
	s.Gets++
	s.mu.Unlock()
}

func (s *Stats) Summary() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	total := s.Hits + s.Misses
	return map[string]interface{}{
		"hits":        s.Hits,
		"misses":      s.Misses,
		"total":       total,
		"hit_rate":    float64(s.Hits) / float64(total),
		"evictions":   s.Evictions,
		"sets":        s.Sets,
		"gets":        s.Gets,
		"bytes_used":  s.BytesUsed,
		"uptime_secs": time.Since(s.StartTime).Seconds(),
	}
}

type InMemoryCache struct {
	data     map[string][]byte
	expiry   map[string]time.Time
	mu       sync.RWMutex
	maxSize  int
	stats    *Stats
}

func NewInMemoryCache(maxSize int) *InMemoryCache {
	return &InMemoryCache{
		data:    make(map[string][]byte),
		expiry:  make(map[string]time.Time),
		maxSize: maxSize,
		stats:   &Stats{StartTime: time.Now()},
	}
}

func (c *InMemoryCache) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if exp, ok := c.expiry[key]; ok && time.Now().After(exp) {
		delete(c.data, key)
		delete(c.expiry, key)
		c.stats.RecordMiss()
		return nil, nil
	}

	if val, ok := c.data[key]; ok {
		c.stats.RecordHit()
		return val, nil
	}

	c.stats.RecordMiss()
	return nil, nil
}

func (c *InMemoryCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.data) >= c.maxSize {
		c.evict(1)
	}

	c.data[key] = value
	c.stats.RecordSet(int64(len(value)))

	if ttl > 0 {
		c.expiry[key] = time.Now().Add(ttl)
	}

	return nil
}

func (c *InMemoryCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, key)
	delete(c.expiry, key)
	return nil
}

func (c *InMemoryCache) Clear(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data = make(map[string][]byte)
	c.expiry = make(map[string]time.Time)
	return nil
}

func (c *InMemoryCache) evict(count int) {
	deleted := 0
	for key := range c.data {
		delete(c.data, key)
		delete(c.expiry, key)
		deleted++
		if deleted >= count {
			break
		}
	}
	c.stats.RecordEviction()
}

func (c *InMemoryCache) Stats() *Stats {
	return c.stats
}

type CacheStrategy interface {
	Get(ctx context.Context, key string, loader func(string) ([]byte, error)) ([]byte, error)
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	Invalidate(ctx context.Context, key string) error
}

type CacheAside struct {
	cache  CacheBackend
	mu     sync.RWMutex
	stats  map[string]int64
}

func NewCacheAside(cache CacheBackend) *CacheAside {
	return &CacheAside{
		cache:  cache,
		stats:  make(map[string]int64),
	}
}

func (c *CacheAside) Get(
	ctx context.Context,
	key string,
	loader func(string) ([]byte, error),
) ([]byte, error) {
	val, err := c.cache.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	if val != nil {
		c.mu.Lock()
		c.stats["hits"]++
		c.mu.Unlock()
		return val, nil
	}

	c.mu.Lock()
	c.stats["misses"]++
	c.mu.Unlock()

	if loader == nil {
		return nil, nil
	}

	val, err = loader(key)
	if err != nil {
		return nil, err
	}

	if val != nil {
		_ = c.cache.Set(ctx, key, val, time.Hour)
	}

	return val, nil
}

func (c *CacheAside) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return c.cache.Set(ctx, key, value, ttl)
}

func (c *CacheAside) Invalidate(ctx context.Context, key string) error {
	return c.cache.Delete(ctx, key)
}

func (c *CacheAside) StatsSummary() map[string]int64 {
	c.mu.RLock()
	defer c.mu.RUnlock()

	stats := make(map[string]int64)
	for k, v := range c.stats {
		stats[k] = v
	}
	return stats
}

type WriteThrough struct {
	cache    CacheBackend
	storage  func(key string, value []byte) error
}

func NewWriteThrough(cache CacheBackend, storage func(key string, value []byte) error) *WriteThrough {
	return &WriteThrough{
		cache:   cache,
		storage: storage,
	}
}

func (w *WriteThrough) Get(ctx context.Context, key string) ([]byte, error) {
	return w.cache.Get(ctx, key)
}

func (w *WriteThrough) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	if err := w.storage(key, value); err != nil {
		return err
	}
	return w.cache.Set(ctx, key, value, ttl)
}

func (w *WriteThrough) Invalidate(ctx context.Context, key string) error {
	return w.cache.Delete(ctx, key)
}

type WriteBehind struct {
	cache      CacheBackend
	storage    func(key string, value []byte) error
	pending    map[string][]byte
	mu         sync.Mutex
	flushSize  int
	interval   time.Duration
	stopCh     chan struct{}
}

func NewWriteBehind(
	cache CacheBackend,
	storage func(key string, value []byte) error,
	flushSize int,
	interval time.Duration,
) *WriteBehind {
	wb := &WriteBehind{
		cache:     cache,
		storage:   storage,
		pending:   make(map[string][]byte),
		flushSize: flushSize,
		interval:  interval,
		stopCh:    make(chan struct{}),
	}
	go wb.flushLoop()
	return wb
}

func (w *WriteBehind) flushLoop() {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.flush()
		case <-w.stopCh:
			w.flush()
			return
		}
	}
}

func (w *WriteBehind) flush() {
	w.mu.Lock()
	if len(w.pending) == 0 {
		w.mu.Unlock()
		return
	}

	toFlush := w.pending
	w.pending = make(map[string][]byte)
	w.mu.Unlock()

	for key, value := range toFlush {
		if err := w.storage(key, value); err != nil {
			w.mu.Lock()
			if w.pending == nil {
				w.pending = make(map[string][]byte)
			}
			w.pending[key] = value
			w.mu.Unlock()
		}
	}
}

func (w *WriteBehind) Get(ctx context.Context, key string) ([]byte, error) {
	return w.cache.Get(ctx, key)
}

func (w *WriteBehind) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	w.cache.Set(ctx, key, value, ttl)

	w.mu.Lock()
	w.pending[key] = value
	w.mu.Unlock()

	if len(w.pending) >= w.flushSize {
		go w.flush()
	}

	return nil
}

func (w *WriteBehind) Invalidate(ctx context.Context, key string) error {
	w.cache.Delete(ctx, key)
	w.mu.Lock()
	delete(w.pending, key)
	w.mu.Unlock()
	return nil
}

func (w *WriteBehind) Stop() {
	close(w.stopCh)
}

func ComputeKey(parts ...string) string {
	h := fnv.New64a()
	for _, part := range parts {
		h.Write([]byte(part))
	}
	return string(h.Sum(nil))
}

func Serialize(value interface{}) ([]byte, error) {
	return json.Marshal(value)
}

func Deserialize(data []byte, target interface{}) error {
	return json.Unmarshal(data, target)
}
```

## Use Cases

- **Database Query Caching**: Store frequently executed database queries to reduce database load and improve response times for read-heavy applications.

- **API Response Caching**: Cache expensive API computations or external service calls to improve performance and reduce costs from third-party services.

- **Session Storage**: Store user session data in fast in-memory caches to enable quick session lookups without database roundtrips.

- **Configuration Caching**: Cache frequently accessed configuration data to avoid repeated file reads or database queries.

- **Computation Memoization**: Cache results of expensive computations to avoid redundant calculations.

## Artifacts

- `CacheBackend` interface: Abstract interface for cache implementations
- `InMemoryCache`: High-performance in-memory cache implementation
- `CacheStrategy` implementations: Cache-aside, write-through, write-behind, read-through
- `CacheStats`: Comprehensive cache metrics and statistics
- `EvictionPolicy` implementations: LRU, LFU policies
- `MultiLevelCache`: Hierarchical caching across multiple cache layers

## Related Skills

- Redis Integration: Distributed caching capabilities
- Memcached Usage: Alternative distributed cache
- CDN Caching: Edge caching strategies
- Browser Caching: HTTP caching headers and strategies
- Database Indexing: Query optimization techniques
- Connection Pooling: Resource pooling for databases
