---
name: Profiling
description: Performance analysis and optimization of software including CPU profiling, memory profiling, I/O analysis, and identifying bottlenecks for performance tuning
license: MIT
compatibility: universal
audience: Performance Engineers, Software Optimizers, SREs
category: Computer Science

---

# Profiling

## What I Do

I specialize in profiling—the systematic analysis of software performance to identify bottlenecks and optimization opportunities. My expertise spans CPU profiling (sampling, instrumentation), memory profiling (heap, allocations, leaks), I/O profiling, thread/concurrency analysis, flame graph visualization, cache analysis, and performance tuning methodologies. I use profiling tools and techniques to make software faster, more efficient, and more scalable.

## When to Use Me

- Optimizing slow code paths
- Finding memory leaks
- Analyzing CPU utilization
- Debugging performance regressions
- Sizing resources for production
- Identifying I/O bottlenecks
- Optimizing database queries
- Tuning application performance

## Core Concepts

1. **CPU Profiling**: Sampling vs instrumentation-based profiling
2. **Flame Graphs**: Visual representation of call stack frequency
3. **Memory Profiling**: Heap analysis, allocation tracking, leak detection
4. **Call Graph Analysis**: Understanding call relationships and hot paths
5. **Line-Level Profiling**: Identifying slow lines within functions
6. **Concurrency Profiling**: Thread contention, lock analysis
7. **I/O Profiling**: Disk I/O, network I/O patterns
8. **Cache Profiling**: Cache hit/miss analysis, cachegrind
9. **Microbenchmarks**: Timing small code snippets accurately
10. **Performance Regression**: Detecting and diagnosing slowdowns

## Code Examples

```python
# Python Profiling with cProfile and line_profiler

import cProfile
import pstats
import io
from functools import wraps
import time
from contextlib import contextmanager

# Decorator-based profiling
def profile_function(func):
    """Decorator to profile a single function."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        
        result = func(*args, **kwargs)
        
        profiler.disable()
        
        # Print results
        stream = io.StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats('cumulative')
        stats.print_stats(20)
        
        print(f"\nProfiling results for {func.__name__}:")
        print(stream.getvalue())
        
        return result
    return wrapper

@profile_function
def compute_heavy_function():
    """Example function with various operations."""
    data = []
    
    for i in range(10000):
        data.append(i * 2)
    
    total = sum(data)
    avg = total / len(data)
    
    nested_results = []
    for i in range(100):
        nested = [j ** 2 for j in range(i)]
        nested_results.append(sum(nested))
    
    return avg

# Line-level profiling
def profile_to_file(filename: str):
    """Decorator to profile to file for external analysis."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            profiler = cProfile.Profile()
            profiler.dump_stats(filename)
            result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

# Context manager for section profiling
@contextmanager
def profile_section(name: str):
    """Profile a section of code."""
    profiler = cProfile.Profile()
    profiler.enable()
    
    try:
        yield
    finally:
        profiler.disable()
        
        stream = io.StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.sort_stats('cumulative')
        stats.print_stats(10)
        
        print(f"\n=== Profile: {name} ===")
        print(stream.getvalue())

# Accurate microbenchmarking
class Microbenchmark:
    """Accurate microbenchmarks with warmup and statistics."""
    
    def __init__(self, iterations: int = 10000, warmup: int = 1000):
        self.iterations = iterations
        self.warmup = warmup
    
    def benchmark(self, func, *args, **kwargs):
        """Run benchmark and return statistics."""
        # Warmup
        for _ in range(self.warmup):
            func(*args, **kwargs)
        
        # Actual benchmark
        times = []
        for _ in range(self.iterations):
            start = time.perf_counter_ns()
            func(*args, **kwargs)
            end = time.perf_counter_ns()
            times.append(end - start)
        
        return {
            'min_ns': min(times),
            'max_ns': max(times),
            'mean_ns': sum(times) / len(times),
            'median_ns': sorted(times)[len(times) // 2],
            'std_ns': (sum((t - sum(times)/len(times))**2 for t in times) / len(times))**0.5,
            'iterations': self.iterations
        }
    
    def compare(self, name_a: str, func_a, name_b: str, func_b, *args, **kwargs):
        """Compare two functions."""
        stats_a = self.benchmark(func_a, *args, **kwargs)
        stats_b = self.benchmark(func_b, *args, **kwargs)
        
        print(f"\nComparison: {name_a} vs {name_b}")
        print(f"  {name_a}: {stats_a['mean_ns']:.0f} ns (median)")
        print(f"  {name_b}: {stats_b['mean_ns']:.0f} ns (median)")
        print(f"  Speedup: {stats_a['mean_ns'] / stats_b['mean_ns']:.2f}x")

# Memory Profiling
class MemoryProfiler:
    """Memory profiling utilities."""
    
    @staticmethod
    def trace_allocations():
        """Context manager to trace memory allocations."""
        import tracemalloc
        
        tracemalloc.start()
        
        try:
            yield
        finally:
            current, peak = tracemalloc.get_traced_memory()
            print(f"\nMemory Statistics:")
            print(f"  Current: {current / 1024:.1f} KB")
            print(f"  Peak: {peak / 1024:.1f} KB")
            
            # Show top allocations
            snapshot = tracemalloc.take_snapshot()
            top_stats = snapshot.statistics('lineno')
            
            print("\nTop 10 allocations:")
            for i, stat in enumerate(top_stats[:10]):
                print(f"  {i+1}. {stat.size / 1024:.1f} KB: {stat.traceback}")

# Usage
def example_function():
    """Example function to profile."""
    data = []
    
    for i in range(1000):
        data.append({'id': i, 'value': i ** 2})
    
    # Filter
    filtered = [d for d in data if d['value'] % 2 == 0]
    
    # Aggregate
    result = sum(d['value'] for d in filtered)
    
    return result

with profile_section("Example Function"):
    result = example_function()
```

```c
// C/C++ Profiling with gperftools

/*
Compile with: -g -O2 -std=c++11
Link with: -lprofiler -ltcmalloc

gperftools: Google Performance Tools
*/

#include <gperftools/profiler.h>
#include <sys/time.h>
#include <iostream>
#include <vector>
#include <algorithm>

class Profiler {
public:
    static void Start(const char* name) {
        ProfilerStart(name);
    }
    
    static void Stop() {
        ProfilerStop();
    }
    
    static void RegisterThread() {
        ProfilerRegisterThread();
    }
};

// CPU-intensive function
long compute_fibonacci(int n) {
    if (n <= 1) return n;
    
    long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long c = a + b;
        a = b;
        b = c;
    }
    return b;
}

void process_large_dataset() {
    std::vector<int> data(1000000);
    
    // Fill with random data
    std::generate(data.begin(), data.end(), std::rand);
    
    // Sort (expensive operation)
    std::sort(data.begin(), data.end());
    
    // Compute statistics
    long sum = 0;
    for (const auto& val : data) {
        sum += val;
    }
    
    double avg = static_cast<double>(sum) / data.size();
    std::cout << "Average: " << avg << std::endl;
}

void nested_function_level1() {
    for (int i = 0; i < 100000; i++) {
        compute_fibonacci(20);
    }
}

void nested_function_level2() {
    for (int i = 0; i < 50000; i++) {
        compute_fibonacci(30);
    }
}

void deep_recursion(int depth) {
    if (depth <= 0) return;
    compute_fibonacci(25);
    deep_recursion(depth - 1);
}

int main() {
    Profiler::RegisterThread();
    Profiler::Start("profile_output.prof");
    
    std::cout << "Starting profiling..." << std::endl;
    
    // Profile different workloads
    nested_function_level1();
    nested_function_level2();
    process_large_dataset();
    deep_recursion(100);
    
    Profiler::Stop();
    
    std::cout << "Profile written to profile_output.prof" << std::endl;
    std::cout << "Use pprof to analyze:" << std::endl;
    std::cout << "  pprof --web profile_output.prof" << std::endl;
    std::cout << "  pprof --text profile_output.prof" << std::endl;
    
    return 0;
}
```

```python
# Flame Graph Generation

import subprocess
import os

class FlameGraphGenerator:
    """Generate flame graphs from profiles."""
    
    @staticmethod
    def generate_flamegraph(profile_file: str, output_file: str):
        """
        Generate flame graph from perf output.
        
        Requires: flamegraph package
        pip install flamegraph
        """
        # Generate flame graph
        cmd = [
            'flamegraph',
            '--title=CPU Flame Graph',
            profile_file
        ]
        
        with open(output_file, 'w') as f:
            subprocess.run(cmd, stdout=f)
        
        print(f"Flame graph written to {output_file}")
    
    @staticmethod
    def generate_from_perf(binary: str, duration: int = 10):
        """Record perf data and generate flame graph."""
        perf_file = 'perf.data'
        
        # Record perf
        record_cmd = [
            'perf', 'record', '-F', '99', '-g',
            '-o', perf_file,
            '--', binary
        ]
        
        subprocess.run(record_cmd, timeout=duration + 5)
        
        # Convert to flame graph
        subprocess.run([
            'perf', 'script', '-i', perf_file,
            '|', 'flamegraph', '--title=CPU Flame Graph'
        ], stdout=open('flamegraph.svg', 'w'))

# Interactive Profiling with py-spy

"""
# Install py-spy
pip install py-spy

# Record a running process
py-spy record -o profile.svg --pid <PID>
py-sorb record -o profile.svg -- python script.py

# Top commands during recording
py-spy top --pid <PID>

# Generate flame graph
py-spy record -o flame.svg --pid <PID>
"""

# Async/Concurrent Profiling

class AsyncProfiler:
    """Profile async/concurrent code."""
    
    def __init__(self, event_loop=None):
        self.event_loop = event_loop
    
    async def profile_async_operation(self, coro):
        """Profile an async operation."""
        import asyncio
        
        # Get event loop statistics
        tasks = asyncio.all_tasks(self.event_loop)
        
        print(f"Active tasks: {len(tasks)}")
        
        # Profile the coroutine
        import time
        start = time.perf_counter()
        
        result = await coro
        
        elapsed = time.perf_counter() - start
        
        print(f"Operation took: {elapsed:.3f}s")
        
        return result

# Memory Leak Detection

class MemoryLeakDetector:
    """Detect memory leaks in Python."""
    
    @staticmethod
    def track_objects(class_name: str, max_objects: int = 1000):
        """Track creation and destruction of objects."""
        import gc
        import weakref
        
        created = 0
        alive_refs = []
        
        original_init = None
        
        def tracked_init(self, *args, **kwargs):
            nonlocal created
            created += 1
            original_init(self, *args, **kwargs)
        
        def install_tracker(cls):
            nonlocal original_init
            original_init = cls.__init__
            cls.__init__ = tracked_init
        
        def check_leak():
            gc.collect()
            alive = [ref() for ref in alive_refs if ref() is not None]
            return len(alive)
        
        return install_tracker, check_leak
    
    @staticmethod
    def dump_traces():
        """Dump object allocation traces (requires debug build)."""
        import gc
        gc.set_debug(gc.DEBUG_SAVEALL)
        
        # Let some objects be garbage collected
        gc.collect()
        
        # Print allocation traces
        for obj in gc.garbage:
            import refex
            try:
                refs = refex.find_referents(obj)
                print(f"Referrers for {type(obj)}: {refs}")
            except:
                pass
        
        gc.set_debug(0)
```

## Best Practices

1. **Profile Before Optimizing**: Measure, don't guess bottlenecks
2. **Use Right Tool**: CPU profiler vs memory profiler vs I/O profiler
3. **Profile in Production**: Staging differs from production workloads
4. **Look at Hot Paths**: Focus on frequently executed code
5. **Check Line-Level**: Often one line dominates
6. **Compare Profiles**: Before/after optimization comparison
7. **Watch Allocation Rates**: Memory pressure causes GC overhead
8. **Profile Under Load**: Single request vs 1000 concurrent
9. **Use Flame Graphs**: Quick visual identification of bottlenecks
10. **Validate Improvements**: Re-profile after changes
