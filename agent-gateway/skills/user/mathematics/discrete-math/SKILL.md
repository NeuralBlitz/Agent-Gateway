---
name: discrete-math
description: Discrete math fundamentals including combinatorics, graph theory, logic, set theory, algorithms, and number theory for computer science and cryptography.
category: mathematics
tags:
  - mathematics
  - discrete-math
  - combinatorics
  - graph-theory
  - logic
  - set-theory
  - algorithms
  - cryptography
difficulty: intermediate
author: neuralblitz
---

# Discrete Mathematics

## What I do

I provide comprehensive expertise in discrete mathematics, the study of mathematical structures that are fundamentally discrete rather than continuous. I enable you to apply combinatorial reasoning, graph theory, mathematical logic, set theory, and algorithmic thinking to solve problems in computer science, cryptography, and optimization. My knowledge spans from counting principles and recurrence relations to graph algorithms and boolean algebra essential for algorithm design, complexity analysis, and theoretical computer science.

## When to use me

Use discrete mathematics when you need to: analyze algorithm complexity and prove correctness, design efficient data structures, solve counting and enumeration problems, model relationships using graph theory, implement cryptographic algorithms, reason about digital circuits and logic, analyze network topologies, solve recurrence relations for algorithm analysis, or apply formal methods in software engineering.

## Core Concepts

- **Set Theory**: Collections of distinct objects with operations including union, intersection, difference, and Cartesian product.
- **Logic and Boolean Algebra**: Formal systems for reasoning about truth values with connectives (AND, OR, NOT) and quantifiers.
- **Combinatorics**: The mathematics of counting, arranging, and selecting objects including permutations and combinations.
- **Graph Theory**: Structures consisting of vertices connected by edges modeling relationships and networks.
- **Trees and Hierarchical Structures**: Connected acyclic graphs fundamental for organizing data and representing hierarchies.
- **Recurrence Relations**: Equations defining sequences in terms of previous terms, central to algorithm analysis.
- **Proof Techniques**: Methods including induction, contradiction, and direct proof for establishing mathematical truths.
- **Modular Arithmetic**: Arithmetic on remainders after division, foundational for number theory and cryptography.
- **Algorithmic Complexity**: Measuring efficiency of algorithms using Big-O, Big-Ω, and Big-Θ notation.

## Code Examples

### Set Theory Operations

```python
class FiniteSet:
    def __init__(self, elements):
        self.elements = set(elements)
    
    def __repr__(self):
        return f"{{{', '.join(map(str, sorted(self.elements)))}}}"
    
    def __len__(self):
        return len(self.elements)
    
    def __contains__(self, element):
        return element in self.elements
    
    def union(self, other):
        return FiniteSet(self.elements | other.elements)
    
    def intersection(self, other):
        return FiniteSet(self.elements & other.elements)
    
    def difference(self, other):
        return FiniteSet(self.elements - other.elements)
    
    def cartesian_product(self, other):
        return FiniteSet((x, y) for x in self.elements for y in other.elements)
    
    def power_set(self):
        from itertools import combinations
        elements = list(self.elements)
        return FiniteSet(
            frozenset(combinations(elements, r)) 
            for r in range(len(elements) + 1)
        )
    
    def cardinality(self):
        return len(self.elements)

# Example set operations
A = FiniteSet({1, 2, 3, 4, 5})
B = FiniteSet({3, 4, 5, 6, 7})

print(f"A = {A}")
print(f"B = {B}")
print(f"A ∪ B = {A.union(B)}")
print(f"A ∩ B = {A.intersection(B)}")
print(f"A - B = {A.difference(B)}")
print(f"|A| = {A.cardinality()}")

# Power set
P = FiniteSet({1, 2}).power_set()
print(f"P({{1,2}}) = {P}")

# Cartesian product
C = FiniteSet({1, 2}).cartesian_product(FiniteSet({'a', 'b'}))
print(f"{{1,2}} × {{a,b}} = {C}")
```

### Combinatorics and Counting

```python
import math
from itertools import permutations, combinations, product

def permutations_count(n, k):
    """P(n, k) = n! / (n-k)! - arrangements of k from n"""
    return math.perm(n, k) if hasattr(math, 'perm') else math.factorial(n) // math.factorial(n - k)

def combinations_count(n, k):
    """C(n, k) = n! / (k!(n-k)!) - selections of k from n"""
    return math.comb(n, k)

def multinomial_coefficient(n, k_list):
    """n! / (k1! k2! ... km!) for partitioning n into groups"""
    return math.factorial(sum(k_list)) // math.prod(math.factorial(k) for k in k_list)

def inclusion_exclusion(*sets):
    """|A ∪ B ∪ C| = |A| + |B| + |C| - |A∩B| - |A∩C| - |B∩C| + |A∩B∩C|"""
    total = 0
    n = len(sets)
    for r in range(1, n + 1):
        for combo in combinations(range(n), r):
            intersection = set.intersection(*[sets[i] for i in combo])
            if r % 2 == 1:
                total += len(intersection)
            else:
                total -= len(intersection)
    return abs(total)

# Examples
print(f"P(5, 3) = {permutations_count(5, 3)} (5×4×3 = 60)")
print(f"C(5, 3) = {combinations_count(5, 3)}")
print(f"Multinomial(10; 3, 3, 4) = {multinomial_coefficient(10, [3, 3, 4])}")

# Derangements (permutations with no fixed points)
def derangement(n):
    """Number of derangements D(n) = n! * sum((-1)^k / k!)"""
    return round(math.factorial(n) * sum((-1)**k / math.factorial(k) for k in range(n + 1)))

print(f"D(4) = {derangement(4)} (derangements of 4 elements)")

# Stars and bars (solutions to x1 + x2 + x3 = 10, xi >= 1)
n, k = 10, 3
stars_and_bars = combinations_count(n - 1, k - 1)
print(f"Solutions to x1+x2+x3=10 (xi>=1): {stars_and_bars}")

# Inclusion-exclusion example
A = {1, 2, 3, 4, 5}
B = {3, 4, 5, 6, 7}
C = {5, 6, 7, 8, 9}
print(f"|A ∪ B ∪ C| = {inclusion_exclusion(A, B, C)}")
```

### Graph Theory and Algorithms

```python
from collections import deque
import heapq

class Graph:
    def __init__(self, directed=False):
        self.adjacency = {}
        self.directed = directed
    
    def add_vertex(self, v):
        if v not in self.adjacency:
            self.adjacency[v] = []
    
    def add_edge(self, u, v, weight=1):
        self.add_vertex(u)
        self.add_vertex(v)
        self.adjacency[u].append((v, weight))
        if not self.directed:
            self.adjacency[v].append((u, weight))
    
    def bfs(self, start):
        """Breadth-first search."""
        visited = {start}
        queue = deque([start])
        order = []
        
        while queue:
            vertex = queue.popleft()
            order.append(vertex)
            for neighbor, _ in self.adjacency[vertex]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        return order
    
    def dfs(self, start):
        """Depth-first search (recursive)."""
        visited = set()
        order = []
        
        def dfs_recursive(v):
            visited.add(v)
            order.append(v)
            for neighbor, _ in self.adjacency[v]:
                if neighbor not in visited:
                    dfs_recursive(neighbor)
        
        dfs_recursive(start)
        return order
    
    def dijkstra(self, start):
        """Dijkstra's shortest path algorithm."""
        distances = {v: float('inf') for v in self.adjacency}
        distances[start] = 0
        pq = [(0, start)]
        visited = set()
        
        while pq:
            dist, vertex = heapq.heappop(pq)
            if vertex in visited:
                continue
            visited.add(vertex)
            
            for neighbor, weight in self.adjacency[vertex]:
                if neighbor not in visited:
                    new_dist = dist + weight
                    if new_dist < distances[neighbor]:
                        distances[neighbor] = new_dist
                        heapq.heappush(pq, (new_dist, neighbor))
        
        return distances
    
    def has_cycle(self):
        """Detect cycle using DFS."""
        visited = set()
        rec_stack = set()
        
        def dfs(v):
            visited.add(v)
            rec_stack.add(v)
            
            for neighbor, _ in self.adjacency[v]:
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(v)
            return False
        
        for vertex in self.adjacency:
            if vertex not in visited:
                if dfs(vertex):
                    return True
        return False

# Example graph
g = Graph()
edges = [(0, 1, 4), (0, 2, 2), (1, 2, 1), (1, 3, 5), (2, 3, 8), (2, 4, 10), (3, 4, 2)]
for u, v, w in edges:
    g.add_edge(u, v, w)

print(f"BFS from 0: {g.bfs(0)}")
print(f"DFS from 0: {g.dfs(0)}")
print(f"Shortest paths from 0: {g.dijkstra(0)}")
print(f"Has cycle: {g.has_cycle()}")
```

### Boolean Logic and Truth Tables

```python
class BooleanFormula:
    def __init__(self, expression):
        self.expression = expression
    
    def evaluate(self, values):
        """Evaluate formula with given variable values."""
        expr = self.expression
        for var, val in values.items():
            expr = expr.replace(var, str(1 if val else 0))
        return eval(expr)
    
    def truth_table(self, variables):
        """Generate complete truth table."""
        n = len(variables)
        results = []
        
        for i in range(2**n):
            values = {}
            for j, var in enumerate(variables):
                values[var] = bool((i >> j) & 1)
            
            result = self.evaluate(values)
            results.append({**values, 'result': result})
        
        return results
    
    def is_tautology(self, variables):
        """Check if formula is always true."""
        for i in range(2**len(variables)):
            values = {var: bool((i >> j) & 1) for j, var in enumerate(variables)}
            if not self.evaluate(values):
                return False
        return True
    
    def is_contradiction(self, variables):
        """Check if formula is always false."""
        for i in range(2**len(variables)):
            values = {var: bool((i >> j) & 1) for j, var in enumerate(variables)}
            if self.evaluate(values):
                return False
        return True
    
    def is_equivalent(self, other, variables):
        """Check if two formulas are equivalent."""
        for i in range(2**len(variables)):
            values = {var: bool((i >> j) & 1) for j, var in enumerate(variables)}
            if self.evaluate(values) != other.evaluate(values):
                return False
        return True

# Examples
formula = BooleanFormula("(A and B) or (not A and C)")
print(f"Formula: {formula.expression}")

# Generate truth table
print("\nTruth Table:")
print("A | B | C | Result")
print("-" * 20)
for row in formula.truth_table(['A', 'B', 'C']):
    print(f"{int(row['A'])} | {int(row['B'])} | {int(row['C'])} | {int(row['result'])}")

# Check properties
print(f"\nIs tautology: {formula.is_tautology(['A', 'B', 'C'])}")
print(f"Is contradiction: {formula.is_contradiction(['A', 'B', 'C'])}")

# Logical equivalences
p_formula = BooleanFormula("(A or B) and (not A)")
q_formula = BooleanFormula("B and not A")
print(f"(A∨B)∧¬A ≡ B∧¬A: {p_formula.is_equivalent(q_formula, ['A', 'B'])}")
```

### Recurrence Relations

```python
import functools

def recurrence_memoized(f, base_cases):
    """Create memoized recursive function from recurrence."""
    cache = {}
    
    @functools.wraps(f)
    def wrapper(n):
        if n in base_cases:
            return base_cases[n]
        if n not in cache:
            cache[n] = f(n, wrapper)
        return cache[n]
    
    return wrapper

# Fibonacci recurrence: F(n) = F(n-1) + F(n-2)
fib_base = {0: 0, 1: 1}

def fib recurrence(n, rec):
    return rec(n-1) + rec(n-2)

fib_memoized = recurrence_memoized(fib, fib_base)
print(f"F(10) = {fib_memoized(10)}")
print(f"F(20) = {fib_memoized(20)}")

# Tower of Hanoi: T(n) = 2T(n-1) + 1
def tower_base(n):
    if n == 0:
        return 0
    return 2**n - 1

# Solve recurrence: a_n = 2a_{n-1} + 3, a_0 = 1
def solve_linear_recurrence(a0, coeff, constant, n):
    """Solve a_n = coeff * a_{n-1} + constant."""
    if n == 0:
        return a0
    a = a0
    for i in range(1, n + 1):
        a = coeff * a + constant
    return a

print(f"Sequence: {solve_linear_recurrence(1, 2, 3, 5)}")  # a_5 = ?

# Master theorem analysis helper
def master_theorem(a, b, f_n):
    """
    T(n) = aT(n/b) + f(n)
    Compare n^{log_b(a)} with f(n)
    """
    n_log_b_a = (n ** (1/b)) ** a  # n^{log_b(a)}
    
    if f_n < n_log_b_a:  # Case 1
        return f"T(n) = Θ(n^{log_b(a)}) = Θ(n^{n ** (1/b)})"
    elif abs(f_n - n_log_b_a) < 1e-10:  # Case 2
        return f"T(n) = Θ(n^{log_b(a)} log n)"
    else:  # Case 3
        return f"T(n) = Θ(f(n))"

# Example: T(n) = 2T(n/2) + n (merge sort)
print(f"Merge sort complexity: {master_theorem(2, 2, 'n')}")
```

## Best Practices

- Use memoization and dynamic programming to avoid exponential time complexity in recursive solutions.
- Distinguish between graph types (directed vs undirected, weighted vs unweighted) to select appropriate algorithms.
- Validate counting results using small cases where manual enumeration is feasible.
- When proving properties, choose appropriate proof techniques (induction for recursive structures, contradiction for non-constructive results).
- Consider edge cases in combinatorial formulas: empty sets, single elements, and boundary conditions.
- Use appropriate data structures (queues for BFS, stacks for DFS, priority queues for Dijkstra) for algorithmic efficiency.
- In modular arithmetic, always reduce intermediate results to prevent integer overflow.
- When analyzing algorithm complexity, use tight bounds (Θ) when possible rather than loose bounds (O).
- For graph algorithms, check for special properties (bipartiteness, planarity) that may enable more efficient solutions.
- Validate boolean logic expressions by generating complete truth tables for small numbers of variables.

