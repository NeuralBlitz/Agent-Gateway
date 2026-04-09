---
name: combinatorics
description: Counting principles, permutations, combinations, generating functions, partition theory, and combinatorial algorithms for enumeration and optimization.
category: mathematics
tags:
  - mathematics
  - combinatorics
  - permutations
  - combinations
  - generating-functions
  - partitions
  - enumeration
difficulty: intermediate
author: neuralblitz
---

# Combinatorics

## What I do

I provide comprehensive expertise in combinatorics, the mathematics of counting, arrangement, and selection. I enable you to solve counting problems using permutations, combinations, and generating functions, analyze partition structures, and apply combinatorial algorithms for enumeration. My knowledge spans from fundamental counting principles to advanced topics like Polya enumeration and combinatorial optimization essential for algorithm analysis, probability, cryptography, and operations research.

## When to use me

Use combinatorics when you need to: count arrangements and selections in probability problems, optimize resource allocation with constraints, analyze algorithm complexity through counting, design experiments and surveys, solve problems involving dice, cards, and games, enumerate structures in graph theory, implement combinatorial generation algorithms, or apply inclusion-exclusion principle for complex counting.

## Core Concepts

- **Fundamental Counting Principle**: If one task has m ways and another has n ways, together they have m×n ways.
- **Permutations**: Arrangements of objects where order matters, with P(n,k) = n!/(n-k)! variations.
- **Combinations**: Selections of objects where order doesn't matter, with C(n,k) = n!/(k!(n-k)!) possibilities.
- **Multinomial Coefficients**: Counting ways to divide objects into groups of specified sizes.
- **Stars and Bars**: Method for counting solutions to equations with non-negative integer variables.
- **Generating Functions**: Formal power series encoding combinatorial sequences and solving recurrence relations.
- **Partition Theory**: Ways of writing integers as sums of positive integers without regard to order.
- **Inclusion-Exclusion Principle**: Counting technique for unions of sets with overlapping elements.
- **Pigeonhole Principle**: If n items are placed in m containers with n > m, at least one container has multiple items.
- **Recurrence Relations**: Equations expressing sequence terms in terms of previous terms.

## Code Examples

### Basic Counting

```python
import math
from itertools import combinations, permutations, product

def permutations_count(n, k):
    """Number of permutations of n items taken k at a time."""
    return math.perm(n, k) if hasattr(math, 'perm') else math.factorial(n) // math.factorial(n - k)

def combinations_count(n, k):
    """Number of combinations of n items taken k at a time."""
    return math.comb(n, k)

def multinomial_coefficient(n, *ks):
    """Number of ways to divide n items into groups of sizes k1, k2, ..."""
    total = math.factorial(n)
    for k in ks:
        total //= math.factorial(k)
    return total

# Basic examples
print(f"P(5, 3) = {permutations_count(5, 3)} (arrangements of 3 from 5)")
print(f"C(5, 3) = {combinations_count(5, 3)} (selections of 3 from 5)")

# Multinomial: arrange "MISSISSIPPI"
letters = {'M': 1, 'I': 4, 'S': 4, 'P': 2}
total_letters = sum(letters.values())
multinomial = multinomial_coefficient(total_letters, *letters.values())
print(f"'MISSISSIPPI' arrangements: {multinomial}")

# Circular permutations
def circular_permutations(n):
    """Number of ways to arrange n objects in a circle."""
    if n <= 1:
        return 1
    return math.factorial(n - 1)

print(f"Circular arrangements of 5 people: {circular_permutations(5)}")

# Necklace problems (rotations and reflections)
def necklace_count(n, colors, fixed=False):
    """
    Number of distinct necklaces with n beads and given colors.
    fixed=True: rotations considered distinct
    fixed=False: rotations considered the same (Burnside's lemma)
    """
    if fixed:
        return colors ** n
    # Simplified: assume free necklaces (rotations and reflections)
    from math import gcd
    total = sum(colors ** gcd(n, k) for k in range(1, n + 1))
    return total // (2 * n)

print(f"Necklaces with 4 beads, 3 colors (free): {necklace_count(4, 3)}")

# Permutations with repetition
def permutations_with_repetition(n, *counts):
    """Number of permutations when some items are identical."""
    return math.factorial(n) // math.prod(math.factorial(c) for c in counts)

print(f"Permutations of 'BANANA': {permutations_with_repetition(6, 1, 3, 2)}")
```

### Combinations with Constraints

```python
import math

def combinations_with_restrictions(n, k, restrictions):
    """
    Count combinations with restrictions.
    restrictions: list of (element, condition) where condition is function.
    """
    valid = [i for i in range(1, n + 1) if all(r(i) for r in restrictions)]
    return math.comb(len(valid), k) if len(valid) >= k else 0

def combinations_with_bounds(n, k, lower, upper):
    """Count combinations where each element has bounds."""
    def helper(start, remaining, current_sum):
        if remaining == 0:
            return 1 if lower <= current_sum <= upper else 0
        if current_sum + remaining > upper:
            return 0
        
        total = 0
        for i in range(start, n + 1):
            total += helper(i + 1, remaining - 1, current_sum + i)
        return total
    
    return helper(0, k, 0)

# Example: Select 3 numbers from 1-10 with sum between 15 and 20
def combinations_sum_range(n, k, min_sum, max_sum):
    """Count k-combinations from 1..n with sum in [min_sum, max_sum]."""
    from functools import lru_cache
    
    @lru_cache(None)
    def dp(i, k, current_sum):
        if k == 0:
            return 1 if min_sum <= current_sum <= max_sum else 0
        if i > n or current_sum + k * i > max_sum:
            return 0
        
        return dp(i + 1, k, current_sum) + dp(i + 1, k - 1, current_sum + i)
    
    return dp(1, k, 0)

print(f"3-combinations from 1-10 with sum 15-20: {combinations_sum_range(10, 3, 15, 20)}")

# Combinations with forbidden subsets
def combinations_no_forbidden(n, k, forbidden):
    """Count k-combinations avoiding any forbidden k-subset."""
    valid_count = math.comb(n, k)
    for bad_set in forbidden:
        if len(bad_set) == k:
            valid_count -= 1
    return valid_count

# Derby problem (horse racing)
def derby_problem(n_horses, n_places, bet_amounts):
    """Calculate derby probabilities with different betting strategies."""
    from itertools import permutations
    
    total_outcomes = math.perm(n_horses, n_places)
    win_outcomes = math.perm(n_horses - 1, n_places - 1)
    
    return {
        'exacta': win_outcomes / total_outcomes,
        'quinella': math.comb(n_horses - 1, n_places - 1) / math.comb(n_horses, n_places)
    }

# Birthday problem
def birthday_problem(n_people):
    """Calculate probability of at least one birthday match."""
    prob_no_match = 1.0
    for i in range(n_people):
        prob_no_match *= (365 - i) / 365
    return 1 - prob_no_match

for n in [10, 20, 23, 30, 50]:
    prob = birthday_problem(n)
    print(f"P(match in {n} people) = {prob:.4f} ({prob*100:.2f}%)")
```

### Stars and Bars

```python
import math

def stars_and_bars(n, k):
    """Number of solutions to x1 + ... + xk = n with xi >= 0."""
    return math.comb(n + k - 1, k - 1)

def stars_and_bars_lower_bound(n, k, lower):
    """Number of solutions with xi >= lower."""
    yi = [x - lower for x in [0] * k]  # Transform: yi >= 0
    return stars_and_bars(n - k * lower, k)

def stars_and_bars_bounds(n, k, lower, upper):
    """Number of solutions with lower <= xi <= upper."""
    from functools import lru_cache
    
    @lru_cache(None)
    def dp(i, remaining, current_sum):
        if i == k:
            return 1 if lower * k <= current_sum <= upper * k else 0
        
        total = 0
        for val in range(lower, upper + 1):
            total += dp(i + 1, remaining - 1, current_sum + val)
        return total
    
    return dp(0, k, 0)

# Examples
print(f"Solutions to x+y+z=10 (xi>=0): {stars_and_bars(10, 3)}")
print(f"Solutions to x+y+z=10 (xi>=2): {stars_and_bars_lower_bound(10, 3, 2)}")
print(f"Solutions to x+y+z=10 (1<=xi<=4): {stars_and_bars_bounds(10, 3, 1, 4)}")

# Positive integers only
def stars_and_bars_positive(n, k):
    """Solutions to x1+...+xk=n with xi >= 1."""
    return stars_and_bars(n - k, k)

print(f"Solutions to x+y+z=10 (xi>=1): {stars_and_bars_positive(10, 3)}")

# Integer partitions using generating functions
def partition_generator(n):
    """Generate all integer partitions of n."""
    def helper(remaining, max_part, current):
        if remaining == 0:
            yield list(current)
            return
        for part in range(min(max_part, remaining), 0, -1):
            current.append(part)
            yield from helper(remaining - part, part, current)
            current.pop()
    
    yield from helper(n, n, [])

# Inclusion-exclusion for bounded problems
def inclusion_exclusion_bounded(n, k, bounds):
    """Count solutions with upper bounds using inclusion-exclusion."""
    from itertools import combinations
    
    total = stars_and_bars(n, k)
    
    for i in range(1, k + 1):
        for combo in combinations(range(k), i):
            reduced_n = n - sum(bounds[j] + 1 for j in combo)
            if reduced_n >= 0:
                sign = -1 if i % 2 == 1 else 1
                total += sign * stars_and_bars(reduced_n, k)
    
    return max(0, total)
```

### Generating Functions

```python
from collections import defaultdict

class GeneratingFunction:
    def __init__(self, coefficients=None):
        self.coeffs = defaultdict(int)
        if coefficients:
            for i, c in enumerate(coefficients):
                self.coeffs[i] = c
    
    def __add__(self, other):
        result = GeneratingFunction()
        for i in set(list(self.coeffs.keys()) + list(other.coeffs.keys())):
            result.coeffs[i] = self.coeffs[i] + other.coeffs[i]
        return result
    
    def __mul__(self, other):
        result = GeneratingFunction()
        for i, a in self.coeffs.items():
            for j, b in other.coeffs.items():
                result.coeffs[i + j] += a * b
        return result
    
    def __pow__(self, power):
        result = GeneratingFunction([1])
        for _ in range(power):
            result = result * self
        return result
    
    def coefficient(self, n):
        return self.coeffs.get(n, 0)
    
    def series(self, terms):
        return [self.coefficient(i) for i in range(terms)]

# Fibonacci using generating functions
def fibonacci_gf(n):
    """Generate Fibonacci numbers using generating functions."""
    # F(x) = x / (1 - x - x^2)
    a = GeneratingFunction([0, 1])  # x
    b = GeneratingFunction([1, -1, -1])  # 1 - x - x^2
    
    # a * (1/b) via series expansion
    result = GeneratingFunction([0])
    current = GeneratingFunction([1])
    
    for _ in range(n):
        result = result + a * current
        current = current * b
    
    return result.coefficient(n)

# Using closed form
def fibonacci_closed(n):
    phi = (1 + 5**0.5) / 2
    return round((phi**n - (-phi)**(-n)) / (5**0.5))

# Partition generating function
def partition_gf(n):
    """Number of partitions of n using generating functions."""
    # P(x) = product(1/(1-x^k)) for k=1..n
    result = GeneratingFunction([1])
    
    for k in range(1, n + 1):
        term = GeneratingFunction([0] * k + [1])  # 1/(1-x^k)
        result = result * term
    
    return result.coefficient(n)

# Coin change problem using generating functions
def coin_change(coins, target):
    """Count ways to make target using given coin denominations."""
    from itertools import product
    
    # For unlimited coins: product(1 + x^c + x^2c + ...) for each coin c
    gf = GeneratingFunction([1])
    
    for coin in coins:
        coin_gf = GeneratingFunction([1])
        for k in range(coin, target + 1, coin):
            coin_gf.coeffs[k // coin] = 1
        gf = gf * coin_gf
    
    return gf.coefficient(target)

coins = [1, 5, 10, 25]
print(f"\nWays to make 25 cents: {coin_change(coins, 25)}")
print(f"Partitions of 10: {partition_gf(10)}")
print(f"F(10) = {fibonacci_closed(10)}")

# Exponential generating functions for labeled objects
def label_permutations_gf(n, k):
    """EGF for permutations of n items taken k at a time."""
    from math import factorial
    return 1 / factorial(k) * (x**k)**n  # Conceptual
```

### Partition Theory

```python
import math

def partition_number(n):
    """Compute partition number p(n) using recurrence."""
    from functools import lru_cache
    
    @lru_cache(None)
    def p(n, max_part=None):
        if n == 0:
            return 1
        if max_part is None:
            max_part = n
        
        total = 0
        for k in range(min(max_part, n), 0, -1):
            total += p(n - k, k)
        return total
    
    return p(n)

def partition_with_parts(n, parts):
    """Count partitions using only specified parts."""
    from functools import lru_cache
    
    @lru_cache(None)
    def p(remaining, max_part_idx):
        if remaining == 0:
            return 1
        if max_part_idx < 0 or remaining < 0:
            return 0
        
        total = 0
        for i in range(min(max_part_idx, remaining // parts[max_part_idx]), -1, -1):
            total += p(remaining - i * parts[max_part_idx], max_part_idx - 1)
        return total
    
    return p(len(parts) - 1, len(parts) - 1)

# Pentagonal number theorem
def partition_pentagonal(n):
    """Compute p(n) using pentagonal number recurrence."""
    from functools import lru_cache
    
    @lru_cache(None)
    def p(n):
        if n == 0:
            return 1
        if n < 0:
            return 0
        
        total = 0
        k = 1
        while True:
            g1 = k * (3 * k - 1) // 2
            g2 = k * (3 * k + 1) // 2
            
            if g1 > n and g2 > n:
                break
            
            sign = -1 if k % 2 == 0 else 1
            total += sign * p(n - g1)
            if g2 <= n:
                total += sign * p(n - g2)
            
            k += 1
        
        return total
    
    return p(n)

# Examples
for n in [5, 10, 20]:
    print(f"p({n}) = {partition_number(n)}")
    print(f"p({n}) via pentagonal = {partition_pentagonal(n)}")

# Conjugate partitions
def conjugate_partition(part):
    """Compute conjugate (Ferrers diagram transpose)."""
    if not part:
        return []
    
    max_part = max(part)
    return [sum(1 for p in part if p >= i) for i in range(1, max_part + 1)]

part = [5, 3, 3, 1]
conj = conjugate_partition(part)
print(f"\nPartition {part} has conjugate {conj}")

# Restricted partitions
def partitions_distinct(n):
    """Count partitions into distinct parts."""
    from functools import lru_cache
    
    @lru_cache(None)
    def p(remaining, max_part):
        if remaining == 0:
            return 1
        if remaining < 0 or max_part == 0:
            return 0
        return p(remaining, max_part - 1) + p(remaining - max_part, max_part - 1)
    
    return p(n, n)

def partitions_odd_parts(n):
    """Count partitions into odd parts."""
    from functools import lru_cache
    
    @lru_cache(None)
    def p(remaining, max_odd):
        if remaining == 0:
            return 1
        if remaining < 0 or max_odd < 1:
            return 0
        
        total = 0
        for odd in range(min(max_odd, remaining), 0, -2):
            total += p(remaining - odd, odd)
        return total
    
    return p(n, n)

# Euler's theorem: partitions into distinct parts = partitions into odd parts
for n in [10, 15, 20]:
    print(f"p_distinct({n}) = {partitions_distinct(n)}, p_odd({n}) = {partitions_odd_parts(n)}")
```

## Best Practices

- Verify combinatorial counting by computing small cases manually to ensure formulas are correct.
- Distinguish between permutations (order matters) and combinations (order doesn't matter) in problem formulation.
- Use generating functions as systematic tools for complex counting problems with multiple constraints.
- Apply stars and bars only when variables are indistinguishable and order doesn't matter.
- Remember that stars and bars requires non-negative integer solutions; transform for lower bounds.
- When counting becomes complex, break into cases and use inclusion-exclusion for overlaps.
- For partition problems, recognize when to use generating functions versus recurrence relations.
- Consider symmetry to reduce computation: conjugate partitions, rotational symmetry in necklaces.
- Use dynamic programming for counting problems with overlapping subproblems to avoid exponential time.
- When probability is involved, combine combinatorial counting with probability axioms rather than counting directly.

