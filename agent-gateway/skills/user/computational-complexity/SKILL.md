---
name: computational-complexity
description: Algorithm analysis and complexity
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Analyze algorithm time/space complexity
- Compare algorithmic approaches
- Identify NP-complete problems
- Optimize algorithm performance

## When to use me
When analyzing algorithm performance or choosing between approaches.

## Complexity Analysis

### Big-O Notation
```python
# Common time complexities
COMPLEXITIES = {
    "O(1)": "Constant - hash table lookup",
    "O(log n)": "Logarithmic - binary search",
    "O(n)": "Linear - simple loop",
    "O(n log n)": "Linearithmic - merge sort",
    "O(n^2)": "Quadratic - nested loops",
    "O(2^n)": "Exponential - recursive subsets",
    "O(n!)": "Factorial - permutations"
}

class ComplexityAnalyzer:
    """Analyze algorithm complexity"""
    
    def analyze(self, code: str) -> Dict:
        """Estimate complexity from code structure"""
        return {
            "loops": self._count_loops(code),
            "recursion": self._detect_recursion(code),
            "estimated_complexity": "O(n^2)"  # Simplified
        }
    
    def empirical_analysis(self, func: Callable, 
                          input_sizes: List[int]) -> Dict:
        """Measure actual runtime"""
        times = []
        
        for n in input_sizes:
            start = time.time()
            func(self._generate_input(n))
            elapsed = time.time() - start
            times.append(elapsed)
        
        return {
            "input_sizes": input_sizes,
            "times": times,
            "estimated_complexity": self._fit_complexity(input_sizes, times)
        }
    
    def _fit_complexity(self, sizes: List[int], 
                       times: List[float]) -> str:
        """Fit complexity to measurements"""
        # Simplified: check ratios
        if all(times[i+1] / times[i] < 2 for i in range(len(times)-1)):
            return "O(n)"
        
        return "O(n^2)"
```

### Algorithm Analysis
```python
class SortingAnalyzer:
    """Analyze sorting algorithms"""
    
    @staticmethod
    def bubble_sort(arr: List) -> tuple:
        """O(n^2) time, O(1) space"""
        n = len(arr)
        comparisons = 0
        swaps = 0
        
        for i in range(n):
            for j in range(0, n-i-1):
                comparisons += 1
                if arr[j] > arr[j+1]:
                    arr[j], arr[j+1] = arr[j+1], arr[j]
                    swaps += 1
        
        return arr, comparisons, swaps
    
    @staticmethod
    def merge_sort(arr: List) -> tuple:
        """O(n log n) time, O(n) space"""
        if len(arr) <= 1:
            return arr, 0
        
        mid = len(arr) // 2
        left, lc = SortingAnalyzer.merge_sort(arr[:mid])
        right, rc = SortingAnalyzer.merge_sort(arr[mid:])
        result, rc2 = SortingAnalyzer._merge(left, right)
        
        return result, lc + rc + rc2
    
    @staticmethod
    def _merge(left, right) -> tuple:
        """Merge two sorted arrays"""
        result = []
        i = j = 0
        comparisons = 0
        
        while i < len(left) and j < len(right):
            comparisons += 1
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        
        result.extend(left[i:])
        result.extend(right[j:])
        
        return result, comparisons

class SpaceComplexity:
    """Analyze space complexity"""
    
    @staticmethod
    def analyze_recursive_call(depth: int) -> str:
        """Analyze recursive space"""
        if depth <= 1:
            return "O(n) call stack"
        return "O(log n) if tail recursion"
    
    @staticmethod
    def analyze_data_structures(n: int) -> Dict:
        """Space usage of common structures"""
        return {
            "array": f"O({n})",
            "2d_array": f"O({n**2})",
            "hash_table": f"O({n}) average",
            "balanced_tree": f"O({n})"
        }
```

### NP-Completeness
```python
class NPComplete:
    """Common NP-complete problems"""
    
    @staticmethod
    def traveling_salesman(costs: Dict[str, Dict[str, float]]) -> float:
        """TSP - find shortest path visiting all nodes"""
        # Exponential - try all permutations
        nodes = list(costs.keys())
        min_cost = float('inf')
        
        for perm in itertools.permutations(nodes):
            cost = sum(costs[perm[i]][perm[i+1]] 
                      for i in range(len(perm)-1))
            min_cost = min(min_cost, cost)
        
        return min_cost
    
    @staticmethod
    def subset_sum(nums: List[int], target: int) -> bool:
        """Subset sum - find subset that sums to target"""
        # NP-complete - exponential
        n = len(nums)
        
        for i in range(1 << n):
            total = 0
            for j in range(n):
                if i & (1 << j):
                    total += nums[j]
            if total == target:
                return True
        
        return False
    
    @staticmethod
    def knapsack(values: List[int], weights: List[int], 
                capacity: int) -> int:
        """0/1 Knapsack - pseudo-polynomial O(nW)"""
        n = len(values)
        dp = [[0] * (capacity + 1) for _ in range(n + 1)]
        
        for i in range(1, n + 1):
            for w in range(capacity + 1):
                if weights[i-1] <= w:
                    dp[i][w] = max(
                        dp[i-1][w],
                        dp[i-1][w - weights[i-1]] + values[i-1]
                    )
                else:
                    dp[i][w] = dp[i-1][w]
        
        return dp[n][capacity]
    
    @staticmethod
    def is_np_complete(problem: str) -> bool:
        """Check if problem is known NP-complete"""
        np_complete = [
            "SAT", "3SAT", "Clique", "Vertex Cover",
            "Hamiltonian Path", "Traveling Salesman",
            "Subset Sum", "Knapsack", "Graph Coloring"
        ]
        return problem in np_complete
```

### Optimization Techniques
```python
class AlgorithmOptimizer:
    """Optimize algorithm performance"""
    
    @staticmethod
    def memoize(func: Callable) -> Callable:
        """Add memoization to function"""
        cache = {}
        
        def wrapper(*args):
            if args not in cache:
                cache[args] = func(*args)
            return cache[args]
        
        return wrapper
    
    @staticmethod
    def divide_and_conquer(arr: List, func: Callable) -> Any:
        """Divide and conquer pattern"""
        if len(arr) <= 1:
            return func(arr)
        
        mid = len(arr) // 2
        left = AlgorithmOptimizer.divide_and_conquer(arr[:mid], func)
        right = AlgorithmOptimizer.divide_and_conquer(arr[mid:], func)
        
        return func(left, right)
    
    @staticmethod
    def dynamic_programming(table: Dict, 
                          recurrence: Callable) -> Any:
        """Dynamic programming pattern"""
        # Bottom-up DP
        for state in sorted(table.keys()):
            table[state] = recurrence(state, table)
        
        return table
```
