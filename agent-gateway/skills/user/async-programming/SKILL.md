---
name: async-programming
description: Asynchronous programming patterns and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write async/await code in Python and JavaScript
- Implement concurrent operations
- Handle async errors properly
- Use thread pools and process pools
- Implement producer-consumer patterns
- Manage async resources with context managers
- Handle backpressure and rate limiting
- Debug async code

## When to use me
When implementing asynchronous operations or concurrency patterns.

## Python Asyncio
```python
import asyncio
import aiohttp
from typing import List, Optional
from dataclasses import dataclass
from contextlib import asynccontextmanager


@dataclass
class FetchResult:
    url: str
    status: int
    content: str
    duration_ms: float


class AsyncFetcher:
    """Concurrent HTTP fetcher with rate limiting."""
    
    def __init__(
        self,
        max_concurrent: int = 10,
        max_per_second: float = 5.0
    ) -> None:
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.rate_limiter = AsyncRateLimiter(max_per_second)
        self.results: List[FetchResult] = []
    
    async def fetch(
        self,
        session: aiohttp.ClientSession,
        url: str,
        timeout: int = 10
    ) -> FetchResult:
        """Fetch a single URL with rate limiting."""
        async with self.semaphore:
            async with self.rate_limiter:
                start = asyncio.get_event_loop().time()
                
                try:
                    async with session.get(
                        url,
                        timeout=aiohttp.ClientTimeout(total=timeout)
                    ) as response:
                        content = await response.text()
                        duration = (asyncio.get_event_loop().time() - start) * 1000
                        
                        return FetchResult(
                            url=url,
                            status=response.status,
                            content=content,
                            duration_ms=duration,
                        )
                except Exception as e:
                    return FetchResult(
                        url=url,
                        status=0,
                        content=str(e),
                        duration_ms=0,
                    )
    
    async def fetch_all(
        self,
        urls: List[str],
        progress_callback: Optional[callable] = None
    ) -> List[FetchResult]:
        """Fetch multiple URLs concurrently."""
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch(session, url) for url in urls]
            
            results = []
            for i, coro in enumerate(asyncio.as_completed(tasks)):
                result = await coro
                results.append(result)
                
                if progress_callback:
                    progress_callback(i + 1, len(urls))
            
            return results


class AsyncRateLimiter:
    """Token bucket rate limiter for async operations."""
    
    def __init__(
        self,
        rate: float,  # tokens per second
        capacity: Optional[int] = None
    ) -> None:
        self.rate = rate
        self.capacity = capacity or int(rate)
        self.tokens = self.capacity
        self.last_update = asyncio.get_event_loop().time()
        self.lock = asyncio.Lock()
    
    async def acquire(self, tokens: int = 1) -> float:
        """Acquire tokens, wait if necessary. Returns wait time."""
        async with self.lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - self.last_update
            
            # Add tokens based on elapsed time
            new_tokens = elapsed * self.rate
            self.tokens = min(self.capacity, self.tokens + new_tokens)
            self.last_update = now
            
            # Wait for tokens if needed
            if self.tokens >= tokens:
                self.tokens -= tokens
                return 0.0
            
            # Calculate wait time
            needed = tokens - self.tokens
            wait_time = needed / self.rate
            self.tokens = 0
            self.last_update = now + wait_time
            
            return wait_time
    
    async def __aenter__(self) -> 'AsyncRateLimiter':
        await self.acquire()
        return self
    
    async def __aexit__(self, *args) -> None:
        pass


@asynccontextmanager
async def async_timer(name: str):
    """Context manager for timing async operations."""
    start = asyncio.get_event_loop().time()
    try:
        yield
    finally:
        duration = (asyncio.get_event_loop().time() - start) * 1000
        print(f"{name}: {duration:.2f}ms")
```

## Concurrent Processing
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, TypeVar, Callable, Awaitable


T = TypeVar('T')
R = TypeVar('R')


class ConcurrentProcessor:
    """Process items with configurable concurrency."""
    
    def __init__(
        self,
        max_workers: int = 10,
        use_processes: bool = False
    ) -> None:
        self.max_workers = max_workers
        self.executor = None
        self.use_processes = use_processes
    
    def __enter__(self) -> 'ConcurrentProcessor':
        if self.use_processes:
            self.executor = ProcessPoolExecutor(max_workers=self.max_workers)
        else:
            self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        return self
    
    def __exit__(self, *args) -> None:
        self.executor.shutdown(wait=True)
    
    async def map(
        self,
        func: Callable[[T], R],
        items: List[T],
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> List[R]:
        """Map function over items concurrently."""
        loop = asyncio.get_event_loop()
        tasks = []
        
        for item in items:
            task = loop.run_in_executor(
                self.executor,
                func,
                item
            )
            tasks.append(task)
        
        results = []
        for i, future in enumerate(asyncio.as_completed(tasks)):
            result = await future
            results.append(result)
            if progress_callback:
                progress_callback(i + 1)
        
        return results
    
    async def map_ordered(
        self,
        func: Callable[[T], Awaitable[R]],
        items: List[T]
    ) -> List[R]:
        """Map async function preserving order."""
        tasks = [func(item) for item in items]
        return await asyncio.gather(*tasks)


class ProducerConsumer:
    """Producer-consumer pattern with bounded queue."""
    
    def __init__(
        self,
        max_queue_size: int = 100,
        max_workers: int = 5
    ) -> None:
        self.queue = asyncio.Queue(max_queue_size)
        self.workers = max_workers
        self.running = True
    
    async def producer(self, items: List[T]) -> None:
        """Produce items for consumption."""
        for item in items:
            await self.queue.put(item)
        
        # Signal completion
        for _ in range(self.workers):
            await self.queue.put(None)
    
    async def consumer(self, func: Callable[[T], Awaitable[R]]) -> List[R]:
        """Consume items and process them."""
        results = []
        
        while self.running:
            item = await self.queue.get()
            
            if item is None:
                self.queue.task_done()
                break
            
            try:
                result = await func(item)
                results.append(result)
            except Exception as e:
                print(f"Error processing item: {e}")
            finally:
                self.queue.task_done()
        
        return results
    
    async def run(
        self,
        items: List[T],
        func: Callable[[T], Awaitable[R]],
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> List[R]:
        """Run the producer-consumer pipeline."""
        results = []
        
        async def worker():
            while True:
                item = await self.queue.get()
                if item is None:
                    break
                try:
                    result = await func(item)
                    results.append(result)
                finally:
                    self.queue.task_done()
        
        # Start workers
        workers = [worker() for _ in range(self.workers)]
        
        # Start producer
        producer_task = asyncio.create_task(self.producer(items))
        
        # Wait for all
        await asyncio.gather(producer_task, *workers)
        
        return results
```

## Error Handling
```python
import asyncio
from typing import Optional, TypeVar, Callable
from dataclasses import dataclass


@dataclass
class AsyncResult:
    success: bool
    value: Optional[R] = None
    error: Optional[Exception] = None
    duration_ms: float = 0


class AsyncErrorHandler:
    """Handle errors in async code with retries."""
    
    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        exceptions: tuple = (Exception,)
    ) -> None:
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.exceptions = exceptions
    
    async def execute(
        self,
        func: Callable[..., Awaitable[R]],
        *args,
        **kwargs
    ) -> AsyncResult[R]:
        """Execute with retry logic."""
        start = asyncio.get_event_loop().time()
        
        for attempt in range(self.max_retries + 1):
            try:
                result = await func(*args, **kwargs)
                duration = (asyncio.get_event_loop().time() - start) * 1000
                
                return AsyncResult(
                    success=True,
                    value=result,
                    duration_ms=duration,
                )
            
            except self.exceptions as e:
                if attempt == self.max_retries:
                    duration = (asyncio.get_event_loop().time() - start) * 1000
                    return AsyncResult(
                        success=False,
                        error=e,
                        duration_ms=duration,
                    )
                
                delay = self.backoff_factor * (2 ** attempt)
                await asyncio.sleep(delay)
        
        duration = (asyncio.get_event_loop().time() - start) * 1000
        return AsyncResult(success=False, duration_ms=duration)


class TimeoutHandler:
    """Handle async operations with timeouts."""
    
    async def with_timeout(
        self,
        coro: Awaitable[R],
        timeout: float,
        fallback: Optional[Callable[[], R]] = None
    ) -> R:
        """Execute with timeout."""
        try:
            return await asyncio.wait_for(coro, timeout=timeout)
        except asyncio.TimeoutError:
            if fallback:
                return fallback()
            raise TimeoutError(f"Operation timed out after {timeout}s")
    
    async def with_individual_timeout(
        self,
        tasks: List[asyncio.Task],
        timeout: float
    ) -> List[Optional[R]]:
        """Wait for tasks with individual timeouts."""
        results = [None] * len(tasks)
        
        for i, task in enumerate(tasks):
            try:
                results[i] = await asyncio.wait_for(task, timeout=timeout)
            except asyncio.TimeoutError:
                results[i] = None
            except Exception:
                results[i] = None
        
        return results
```

## JavaScript Async
```typescript
// Promise utilities
class AsyncUtils {
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback?: T
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => {
          if (fallback !== undefined) {
            resolve(fallback);
          } else {
            reject(new Error(`Timeout after ${timeoutMs}ms`));
          }
        }, timeoutMs)
      ),
    ]);
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastError = e as Error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        }
      }
    }

    throw lastError;
  }

  static async allSettled<T>(
    promises: Promise<T>[]
  ): Promise<{ status: 'fulfilled' | 'rejected'; value?: T; reason?: Error }[]> {
    return Promise.all(
      promises.map(promise =>
        promise
          .then(value => ({ status: 'fulfilled' as const, value }))
          .catch(reason => ({ status: 'rejected' as const, reason }))
      )
    );
  }

  static async mapWithLimit<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = Promise.resolve().then(() => fn(item));
      results.push(promise);
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const completed = executing.findIndex(p => p === promise);
        if (completed > -1) {
          executing.splice(completed, 1);
        }
      }
    }

    return Promise.all(results);
  }
}
```
