---
name: Discrete Mathematics
description: Discrete math fundamentals including combinatorics, graph theory, logic, set theory, algorithms, and number theory for computer science and cryptography.
license: MIT
compatibility: python>=3.8
audience: computer-scientists, mathematicians, programmers, engineers
category: mathematics
---

# Discrete Mathematics

## What I Do

I provide comprehensive discrete mathematics tools including combinatorics, graph algorithms, logical reasoning, set operations, recurrence relations, and number theory operations essential for computer science and cryptography.

## When to Use Me

- Algorithm analysis and design
- Cryptography and security
- Network and graph problems
- Counting and combinatorics
- Logic and proof techniques
- Optimization problems

## Core Concepts

- **Combinatorics**: Permutations, combinations, binomial coefficients
- **Graph Theory**: Paths, cycles, connectivity, coloring
- **Logic**: Propositional logic, predicates, inference
- **Set Theory**: Operations, relations, functions
- **Number Theory**: Divisibility, primes, modular arithmetic
- **Recurrence Relations**: Linear recurrences, generating functions
- **Proof Techniques**: Induction, contradiction, direct proof
- **Asymptotic Analysis**: Big O, Omega, Theta notation

## Code Examples

### Combinatorics

```python
from math import comb, perm, factorial
import numpy as np

n, k = 10, 3

combinations = comb(n, k)
permutations = perm(n, k)
factorial_n = factorial(n)

print(f"C(10,3) = {combinations}")
print(f"P(10,3) = {permutations}")
print(f"10! = {factorial_n}")

def multinomial(n_list):
    total = sum(n_list)
    result = factorial(total)
    for n in n_list:
        result //= factorial(n)
    return result
```

### Graph Algorithms

```python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
print(f"BFS order: {bfs(graph, 'A')}")
```

### Modular Arithmetic

```python
def extended_gcd(a, b):
    if b == 0:
        return (a, 1, 0)
    else:
        g, x1, y1 = extended_gcd(b, a % b)
        x = y1
        y = x1 - (a // b) * y1
        return (g, x, y)

def mod_inverse(a, m):
    g, x, y = extended_gcd(a, m)
    if g != 1:
        return None
    return x % m

print(f"Mod inverse of 17 mod 43: {mod_inverse(17, 43)}")
```

### Recurrence Relations

```python
from functools import lru_cache

@lru_cache(None)
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10): {fibonacci(10)}")

def solve_linear_recurrence(coeffs, initial, n):
    k = len(coeffs)
    dp = initial[:k]
    for i in range(k, n+1):
        next_val = sum(coeffs[j] * dp[i-j-1] for j in range(k))
        dp.append(next_val)
    return dp[n]
```

### Set Operations

```python
A = {1, 2, 3, 4, 5}
B = {3, 4, 5, 6, 7}
C = {1, 2}

union = A | B
intersection = A & B
difference = A - B
symmetric_diff = A ^ B

print(f"Union: {union}")
print(f"Intersection: {intersection}")
print(f"A - B: {difference}")
print(f"Symmetric diff: {symmetric_diff}")

def cartesian_product(set1, set2):
    return {(a, b) for a in set1 for b in set2}
```

## Best Practices

1. **Memoization**: Cache computed results for recursion
2. **Graph Representation**: Choose appropriate structure (adjacency list/matrix)
3. **Modular Arithmetic**: Use pow(a, -1, m) in Python 3.8+
4. **Combinatorial Growth**: Beware of factorial growth
5. **Algorithm Complexity**: Analyze time and space complexity

## Common Patterns

```python
# DFS with recursion
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited

# Topological sort (Kahn's algorithm)
def topological_sort(graph):
    in_degree = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1
    
    queue = deque([node for node in in_degree if in_degree[node] == 0])
    topo_order = []
    
    while queue:
        node = queue.popleft()
        topo_order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return topo_order
```

## Core Competencies

1. Combinatorics and counting
2. Graph algorithms and traversals
3. Modular arithmetic and number theory
4. Set operations and relations
5. Recurrence relations and dynamic programming
