---
name: Combinatorics
description: Counting principles, permutations, combinations, generating functions, partition theory, and combinatorial algorithms for enumeration and optimization.
license: MIT
compatibility: python>=3.8
audience: mathematicians, computer-scientists, researchers, programmers
category: mathematics
---

# Combinatorics

## What I Do

I provide comprehensive combinatorics tools including counting principles, permutations, combinations, generating functions, partition theory, and combinatorial algorithms for enumeration and optimization problems.

## When to Use Me

- Counting and enumeration problems
- Algorithm complexity analysis
- Cryptographic key space analysis
- Lottery and probability calculations
- Tournament bracket design
- Resource allocation counting

## Core Concepts

- **Permutations**: Ordered arrangements, n!
- **Combinations**: Unordered selections, binomial coefficients
- **Generating Functions**: Power series for counting
- **Partitions**: Integer partitions, Ferrers diagrams
- **Inclusion-Exclusion**: Counting with overlaps
- **Recurrence Relations**: Fibonacci, Catalan numbers
- **Pigeonhole Principle**:抽屉原理, counting arguments
- **Catalan Numbers**: Dyck paths, tree enumeration

## Code Examples

### Basic Counting

```python
from math import comb, perm, factorial

def permutations(n, k):
    return factorial(n) // factorial(n - k)

def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))

print(f"P(10, 3) = {permutations(10, 3)}")
print(f"C(10, 3) = {comb(10, 3)}")

def multinomial(n, *ks):
    total = factorial(n)
    for k in ks:
        total //= factorial(k)
    return total

print(f"Multinomial(6, 2, 2, 2): {multinomial(6, 2, 2, 2)}")
```

### Inclusion-Exclusion Principle

```python
def inclusion_exclusion(sets):
    n = len(sets)
    total = 0
    for mask in range(1, 1 << n):
        intersection = None
        bits = 0
        for i in range(n):
            if mask & (1 << i):
                bits += 1
                intersection = sets[i] if intersection is None else intersection & sets[i]
        if bits % 2 == 1:
            total += len(intersection) if intersection else 0
        else:
            total -= len(intersection) if intersection else 0
    return total

A = {1, 2, 3, 4, 5}
B = {3, 4, 5, 6, 7}
C = {5, 7, 9, 11}
result = inclusion_exclusion([A, B, C])
print(f"|A ∪ B ∪ C| = {result}")
```

### Catalan Numbers

```python
from functools import lru_cache

@lru_cache(None)
def catalan(n):
    if n <= 1:
        return 1
    total = 0
    for i in range(n):
        total += catalan(i) * catalan(n - 1 - i)
    return total

@lru_cache(None)
def catalan_dp(n):
    C = [0] * (n + 1)
    C[0] = 1
    for i in range(1, n + 1):
        C[i] = sum(C[j] * C[i - 1 - j] for j in range(i))
    return C[n]

for n in range(10):
    print(f"C({n}) = {catalan(n)}")
```

### Generating Functions

```python
from collections import defaultdict

class GeneratingFunction:
    def __init__(self):
        self.coeffs = defaultdict(int)
        self.coeffs[0] = 1
    
    def __add__(self, other):
        result = GeneratingFunction()
        for k in set(list(self.coeffs.keys()) + list(other.coeffs.keys())):
            result.coeffs[k] = self.coeffs[k] + other.coeffs[k]
        return result
    
    def __mul__(self, other):
        result = GeneratingFunction()
        for i, a in self.coeffs.items():
            for j, b in other.coeffs.items():
                result.coeffs[i + j] += a * b
        return result
    
    def coefficient(self, n):
        return self.coeffs[n]

gf = GeneratingFunction()
for i in range(10):
    gf = gf + GeneratingFunction()
print(f"Coefficient of x^5: {gf.coefficient(5)}")
```

### Integer Partitions

```python
from functools import lru_cache

@lru_cache(None)
def partitions(n, max_val=None):
    if max_val is None:
        max_val = n
    if n == 0:
        return 1
    if n < 0 or max_val == 0:
        return 0
    return partitions(n, max_val - 1) + partitions(n - max_val, max_val)

def partitions_list(n):
    result = [[]]
    for i in range(1, n + 1):
        new_partitions = []
        for p in result:
            new_partitions.append(p + [i])
        result.extend(new_partitions)
    return [p for p in result if sum(p) == n]

print(f"p(5) = {partitions(5)}")
parts = partitions_list(5)
print(f"All partitions of 5: {parts}")
```

## Best Practices

1. **Symmetry**: Use combinatorial identities to simplify
2. **Memoization**: Cache recursive counting results
3. **Generating Functions**: Use for complex counting
4. **Dynamic Programming**: Bottom-up for large n
5. **Symmetry**: Exploit for counting optimization

## Common Patterns

```python
# Stars and bars theorem
def stars_and_bars(n, k):
    return comb(n + k - 1, k - 1)

# Permutation with repetition
def permutation_with_repetition(n, *counts):
    return factorial(n) // product(factorial(c) for c in counts)

# Derangements (subfactorial)
from functools import lru_cache

@lru_cache(None)
def derangement(n):
    if n == 0:
        return 1
    if n == 1:
        return 0
    return (n - 1) * (derangement(n - 1) + derangement(n - 2))
```

## Core Competencies

1. Permutation and combination counting
2. Generating functions
3. Inclusion-exclusion principle
4. Catalan and special numbers
5. Partition theory
