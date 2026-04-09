---
name: high-performance-computing
description: HPC programming techniques
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Optimize computational performance
- Implement parallel algorithms
- Use vectorization
- Design GPU kernels

## When to use me
When optimizing performance-critical code or implementing parallel algorithms.

## Parallelization

### Threading
```python
import threading
from concurrent.futures import ThreadPoolExecutor

class ParallelProcessor:
    """Thread-based parallel processing"""
    
    def __init__(self, num_workers: int = None):
        self.num_workers = num_workers or threading.active_count()
    
    def parallel_map(self, func: Callable, 
                    items: List) -> List:
        """Map function over items in parallel"""
        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            results = list(executor.map(func, items))
        return results
    
    def parallel_reduce(self, func: Callable, items: List,
                       num_workers: int = None) -> Any:
        """Parallel reduction"""
        chunk_size = len(items) // (num_workers or self.num_workers)
        chunks = [items[i:i+chunk_size] 
                 for i in range(0, len(items), chunk_size)]
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            chunk_results = list(executor.map(
                lambda chunk: reduce(func, chunk), chunks
            ))
        
        return reduce(func, chunk_results)
```

### Multiprocessing
```python
import multiprocessing as mp

class ProcessPool:
    """Process-based parallel processing"""
    
    @staticmethod
    def parallelize(data: List, func: Callable, 
                  num_processes: int = None) -> List:
        """Distribute work across processes"""
        num_processes = num_processes or mp.cpu_count()
        
        with mp.Pool(num_processes) as pool:
            results = pool.map(func, data)
        
        return results
    
    @staticmethod
    def shared_memory_arrays(data: np.ndarray):
        """Share memory between processes"""
        shared = mp.Array('d', data.flatten())
        return np.frombuffer(shared.get_obj()).reshape(data.shape)
```

### GPU Computing (CUDA-style)
```python
class GPUKernel:
    """GPU kernel patterns"""
    
    @staticmethod
    def vector_add(a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Vector addition on GPU"""
        # Pseudocode - use numba/cupy
        result = np.empty_like(a)
        
        # Each thread handles one element
        for i in range(len(a)):
            result[i] = a[i] + b[i]
        
        return result
    
    @staticmethod
    def matrix_multiply(a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Matrix multiplication with tiling"""
        # Blocked matrix multiplication
        BLOCK_SIZE = 16
        result = np.zeros((a.shape[0], b.shape[1]))
        
        # Each block handled by thread block
        for i in range(0, a.shape[0], BLOCK_SIZE):
            for j in range(0, b.shape[1], BLOCK_SIZE):
                for k in range(0, a.shape[1], BLOCK_SIZE):
                    # Process block
                    i_end = min(i + BLOCK_SIZE, a.shape[0])
                    j_end = min(j + BLOCK_SIZE, b.shape[1])
                    k_end = min(k + BLOCK_SIZE, a.shape[1])
                    
                    for ii in range(i, i_end):
                        for jj in range(j, j_end):
                            sum_val = 0
                            for kk in range(k, k_end):
                                sum_val += a[ii, kk] * b[kk, jj]
                            result[ii, jj] += sum_val
        
        return result
```

### Vectorization
```python
class VectorizedOps:
    """Vectorized operations"""
    
    @staticmethod
    def naive_loop(arr: np.ndarray) -> float:
        """Slow: element-by-element"""
        result = 0.0
        for x in arr:
            result += x * x
        return result
    
    @staticmethod
    def vectorized(arr: np.ndarray) -> float:
        """Fast: vectorized"""
        return np.sum(arr ** 2)
    
    @staticmethod
    def matrix_vector_product(matrix: np.ndarray, 
                           vector: np.ndarray) -> np.ndarray:
        """Optimized matrix-vector product"""
        return matrix @ vector  # Uses BLAS
    
    @staticmethod
    def conditional_accumulate(arr: np.ndarray) -> float:
        """Vectorized conditional"""
        # Instead of: for x in arr: if x > 0: sum += x
        return np.sum(arr[arr > 0])
```

### Memory Optimization
```python
class MemoryOptimizer:
    """Optimize memory access patterns"""
    
    @staticmethod
    def cache_friendly_traversal(matrix: np.ndarray) -> np.ndarray:
        """Row-major traversal (cache-friendly in C)"""
        rows, cols = matrix.shape
        result = np.zeros((rows, cols))
        
        for i in range(rows):
            for j in range(cols):
                result[i, j] = matrix[i, j]
        
        return result
    
    @staticmethod
    def cache_unfriendly_traversal(matrix: np.ndarray) -> np.ndarray:
        """Column-major (cache-unfriendly)"""
        rows, cols = matrix.shape
        result = np.zeros((rows, cols))
        
        for j in range(cols):
            for i in range(rows):
                result[i, j] = matrix[i, j]
        
        return result
    
    @staticmethod
    def cache_blocking(matrix: np.ndarray, 
                      block_size: int = 64) -> np.ndarray:
        """Cache blocking for better performance"""
        rows, cols = matrix.shape
        result = np.zeros_like(matrix)
        
        for i in range(0, rows, block_size):
            for j in range(0, cols, block_size):
                i_end = min(i + block_size, rows)
                j_end = min(j + block_size, cols)
                
                result[i:i_end, j:j_end] = \
                    matrix[i:i_end, j:j_end]
        
        return result
    
    @staticmethod
    def preallocate(size: int) -> np.ndarray:
        """Preallocate array to avoid resizing"""
        return np.zeros(size)
```

### Performance Profiling
```python
class PerformanceProfiler:
    """Profile code performance"""
    
    @staticmethod
    @profile  # Line-by-line profiling
    def profiled_function(data: np.ndarray) -> float:
        """Function to profile"""
        return np.sum(data ** 2)
    
    @staticmethod
    def profile_section(func: Callable) -> Callable:
        """Decorator to profile code sections"""
        def wrapper(*args, **kwargs):
            import cProfile
            import pstats
            
            profiler = cProfile.Profile()
            profiler.enable()
            
            result = func(*args, **kwargs)
            
            profiler.disable()
            stats = pstats.Stats(profiler)
            stats.sort_stats('cumulative')
            stats.print_stats(10)
            
            return result
        
        return wrapper
```
