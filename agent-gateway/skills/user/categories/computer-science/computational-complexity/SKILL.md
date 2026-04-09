---
name: Computational Complexity
description: Analysis of algorithm efficiency and problem difficulty including time/space complexity, NP-completeness, approximation algorithms, and complexity classes (P, NP, PSPACE, EXPTIME)
license: MIT
compatibility: universal
audience: Algorithm Engineers, Researchers, Software Architects
category: Computer Science

---

# Computational Complexity

## What I Do

I specialize in computational complexity—the study of the resources required to solve computational problems. My expertise spans time and space complexity analysis, NP-completeness theory, approximation algorithms, randomized complexity, circuit complexity, and parameterized algorithms. I analyze algorithms to determine their efficiency, classify problems by their inherent difficulty, and develop strategies for handling computationally hard problems in practice.

## When to Use Me

- Analyzing algorithm time and space requirements
- Proving problems are NP-hard or NP-complete
- Finding efficient approximations for NP-hard problems
- Choosing appropriate data structures for performance
- Designing parameterized algorithms for practical instances
- Understanding when heuristics are necessary
- Evaluating complexity of new algorithms
- Proving lower bounds on problem difficulty

## Core Concepts

1. **Asymptotic Notation**: Big-O, Big-Omega, Big-Theta for growth rates
2. **Complexity Classes**: P, NP, NP-complete, NP-hard, PSPACE, EXPTIME
3. **Polynomial Time**: Efficient computation, reducibility
4. **NP-Completeness**: Cook-Levin theorem, common NP-complete problems
5. **Approximation Algorithms**: Approximation ratios, PTAS, FPTAS
6. **Parameterized Complexity**: Fixed-parameter tractable (FPT) algorithms
7. **Randomized Complexity**: RP, BPP, ZPP complexity classes
8. **Space Complexity**: LOGSPACE, PSPACE, and relationships
9. **Hardness of Approximation**: Limits on approximation ratios
10. **Lower Bounds**: Adversary arguments, information-theoretic bounds

## Code Examples

```python
# Complexity Analysis and Algorithm Comparison
import time
import random
from typing import Callable, List, Tuple
from functools import lru_cache
import matplotlib.pyplot as plt
import numpy as np

class ComplexityAnalyzer:
    def __init__(self):
        self.results = {}
    
    def time_algorithm(self, 
                       algorithm: Callable,
                       input_generator: Callable,
                       sizes: List[int],
                       num_trials: int = 5) -> Tuple[List[int], List[float]]:
        """Time an algorithm across different input sizes."""
        times = []
        
        for n in sizes:
            avg_time = 0
            
            for _ in range(num_trials):
                inp = input_generator(n)
                
                start = time.perf_counter()
                result = algorithm(inp)
                end = time.perf_counter()
                
                avg_time += (end - start)
            
            avg_time /= num_trials
            times.append(avg_time)
        
        return sizes, times
    
    def fit_complexity(self, sizes: List[int], 
                       times: List[float]) -> str:
        """Fit empirical complexity to standard functions."""
        from scipy.optimize import curve_fit
        
        def linear(n, a, b):
            return a * n + b
        
        def quadratic(n, a, b):
            return a * n**2 + b
        
        def cubic(n, a, b):
            return a * n**3 + b
        
        def log_linear(n, a, b):
            return a * n * np.log(n) + b
        
        def exponential(n, a, b):
            return a * 1.5**n + b
        
        functions = {
            'O(n)': (linear, sizes[-1] * 100),
            'O(n²)': (quadratic, sizes[-1]**2 * 100 / 1000000),
            'O(n³)': (cubic, sizes[-1]**3 * 100 / 1000000),
            'O(n log n)': (log_linear, sizes[-1] * np.log(sizes[-1]) * 100 / 1000000),
            'O(2^n)': (exponential, 2**sizes[-1] * 100 / 1e9),
        }
        
        best_fit = None
        best_error = float('inf')
        
        for name, (func, scale) in functions.items():
            try:
                popt, _ = curve_fit(func, sizes, times, p0=[scale, 0], maxfev=5000)
                predicted = func(np.array(sizes), *popt)
                error = np.sum((times - predicted)**2)
                
                if error < best_error:
                    best_error = error
                    best_fit = name
            except:
                pass
        
        return best_fit

# Example: Fibonacci Complexity Comparison
def fib_recursive(n: int) -> int:
    """Naive recursive - O(2^n)."""
    if n <= 1:
        return n
    return fib_recursive(n - 1) + fib_recursive(n - 2)

@lru_cache(maxsize=None)
def fib_recursive_memoized(n: int) -> int:
    """Memoized recursive - O(n)."""
    if n <= 1:
        return n
    return fib_recursive_memoized(n - 1) + fib_recursive_memoized(n - 2)

def fib_iterative(n: int) -> int:
    """Iterative - O(n)."""
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def fib_matrix(n: int) -> int:
    """Matrix exponentiation - O(log n)."""
    if n <= 1:
        return n
    
    def mat_mult(A, B):
        return [[A[0][0]*B[0][0] + A[0][1]*B[1][0],
                 A[0][0]*B[0][1] + A[0][1]*B[1][1]],
                [A[1][0]*B[0][0] + A[1][1]*B[1][0],
                 A[1][0]*B[0][1] + A[1][1]*B[1][1]]]
    
    def mat_pow(M, power):
        result = [[1, 0], [0, 1]]
        base = M
        
        while power:
            if power % 2:
                result = mat_mult(result, base)
            base = mat_mult(base, base)
            power //= 2
        
        return result
    
    M = [[1, 1], [1, 0]]
    M_n = mat_pow(M, n - 1)
    
    return M_n[0][0]

# Benchmark Fibonacci implementations
analyzer = ComplexityAnalyzer()
sizes = [5, 10, 15, 20, 25, 30]

def input_gen(n):
    return n

print("Fibonacci Complexity Analysis:")
for name, func in [("Iterative O(n)", fib_iterative),
                   ("Matrix O(log n)", fib_matrix)]:
    if "log" in name:
        test_sizes = [10, 100, 1000, 10000, 100000]
    else:
        test_sizes = sizes
    
    _, times = analyzer.time_algorithm(func, input_gen, test_sizes, num_trials=3)
    complexity = analyzer.fit_complexity(test_sizes, times)
    print(f"  {name}: {complexity}")

# Example NP-Complete Problem: Traveling Salesman
def tsp_bruteforce(distances: List[List[float]]) -> Tuple[float, List[int]]:
    """Brute force TSP - O(n!)."""
    n = len(distances)
    best_cost = float('inf')
    best_path = None
    
    from itertools import permutations
    
    for perm in permutations(range(1, n)):
        cost = distances[0][perm[0]]
        for i in range(len(perm) - 1):
            cost += distances[perm[i]][perm[i + 1]]
        cost += distances[perm[-1]][0]
        
        if cost < best_cost:
            best_cost = cost
            best_path = [0] + list(perm)
    
    return best_cost, best_path

def tsp_nearest_neighbor(distances: List[List[float]]) -> Tuple[float, List[int]]:
    """Greedy TSP approximation - O(n²)."""
    n = len(distances)
    visited = [False] * n
    path = [0]
    visited[0] = True
    
    for _ in range(n - 1):
        current = path[-1]
        nearest = None
        nearest_dist = float('inf')
        
        for j in range(n):
            if not visited[j] and distances[current][j] < nearest_dist:
                nearest = j
                nearest_dist = distances[current][j]
        
        path.append(nearest)
        visited[nearest] = True
    
    # Return to start
    path.append(0)
    
    total = sum(distances[path[i]][path[i + 1]] for i in range(len(path) - 1))
    return total, path

# Example NP-Hard Problem: Vertex Cover Approximation
def vertex_cover_approximation(graph: List[set]) -> set:
    """2-approximation for Vertex Cover - O(V + E)."""
    cover = set()
    edges = [(u, v) for u in range(len(graph)) for v in graph[u] if u < v]
    
    while edges:
        # Pick an arbitrary edge
        u, v = edges[0]
        cover.add(u)
        cover.add(v)
        
        # Remove all edges incident to u or v
        edges = [(x, y) for x, y in edges if x not in (u, v) and y not in (u, v)]
    
    return cover

def vertex_cover_bruteforce(graph: List[set]) -> set:
    """Exact Vertex Cover - O(2^V)."""
    from itertools import combinations
    
    n = len(graph)
    
    for k in range(n + 1):
        for subset in combinations(range(n), k):
            subset = set(subset)
            
            # Check if subset is a vertex cover
            is_cover = True
            for u in range(n):
                for v in graph[u]:
                    if u < v and u not in subset and v not in subset:
                        is_cover = False
                        break
                if not is_cover:
                    break
            
            if is_cover:
                return subset
    
    return set()

# Test Vertex Cover
graph = [
    {1, 2, 3},  # 0
    {0, 4},     # 1
    {0, 5},     # 2
    {0, 6},     # 3
    {1},        # 4
    {2},        # 5
    {3},        # 6
]

exact = vertex_cover_bruteforce(graph)
approx = vertex_cover_approximation(graph)

print(f"\nVertex Cover:")
print(f"  Exact (2^V): {exact}")
print(f"  Approximation (2-approx): {approx}")
print(f"  Approximation ratio: {len(approx)/len(exact) if exact else 'N/A'}")
```

## Best Practices

1. **Choose Right Complexity**: Match algorithm to expected input size
2. **Prefer O(n log n) Sorting**: Timsort, mergesort over O(n²) methods
3. **Use Hash Tables for O(1) Lookups**: Over binary search trees when order not needed
4. **Apply Amortized Analysis**: Understand aggregate costs of dynamic operations
5. **Know Your Constants**: Sometimes O(n²) beats O(n log n) for small n
6. **Use Approximation When Exact is Hard**: 2-approximation is often sufficient
7. **Consider Space Too**: Sometimes trading space saves time
8. **Profile Before Optimizing**: Measure to find actual bottlenecks
9. **Understand Problem Classification**: NP-hard problems need special strategies
10. **Consider Parameterized Algorithms**: Efficient for small parameter values
