---
name: Number Theory
description: Number theory fundamentals including divisibility, prime numbers, modular arithmetic, Diophantine equations, and cryptographic applications.
license: MIT
compatibility: python>=3.8
audience: cryptographers, mathematicians, programmers, security-engineers
category: mathematics
---

# Number Theory

## What I Do

I provide comprehensive number theory capabilities including prime number algorithms, modular arithmetic, Diophantine equations, factorization, and cryptographic number theory for security applications.

## When to Use Me

- Cryptography and security systems
- Prime number generation
- Modular exponentiation
- Diophantine equation solving
- RSA and public-key crypto
- Algorithm optimization with number theory

## Core Concepts

- **Divisibility**: gcd, lcm, Euclidean algorithm
- **Prime Numbers**: Primality testing, prime distribution
- **Modular Arithmetic**: Congruences, modular inverses
- **Diophantine Equations**: Integer solutions to equations
- **Continued Fractions**: Rational approximations
- **Quadratic Residues**: Legendre and Jacobi symbols
- **Multiplicative Functions**: Euler's phi, Möbius function
- **Algebraic Number Theory**: Rings, fields, ideals

## Code Examples

### Euclidean Algorithm

```python
def extended_gcd(a, b):
    if b == 0:
        return a, 1, 0
    else:
        g, x1, y1 = extended_gcd(b, a % b)
        x = y1
        y = x1 - (a // b) * y1
        return g, x, y

def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a

print(f"gcd(48, 18): {gcd(48, 18)}")
g, x, y = extended_gcd(48, 18)
print(f"Extended: gcd=48*{x} + 18*{y} = {g}")
```

### Primality Testing

```python
import random

def is_probable_prime(n, k=10):
    if n < 2:
        return False
    for p in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]:
        if n % p == 0:
            return n == p
    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1
    for _ in range(k):
        a = random.randint(2, n-2)
        x = pow(a, d, n)
        if x == 1 or x == n-1:
            continue
        for _ in range(s-1):
            x = pow(x, 2, n)
            if x == n-1:
                break
        else:
            return False
    return True

print(f"Is 561 prime? {is_probable_prime(561)}")
print(f"Is 997 prime? {is_probable_prime(997)}")
```

### Modular Exponentiation

```python
def mod_pow(base, exponent, modulus):
    result = 1
    base = base % modulus
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * base) % modulus
        exponent //= 2
        base = (base * base) % modulus
    return result

print(f"7^1000 mod 1000: {mod_pow(7, 1000, 1000)}")
print(f"pow(7, 1000, 1000): {pow(7, 1000, 1000)}")
```

### Chinese Remainder Theorem

```python
def extended_gcd(a, b):
    if b == 0:
        return (a, 1, 0)
    g, x1, y1 = extended_gcd(b, a % b)
    return (g, y1, x1 - (a // b) * y1)

def crt(remainders, moduli):
    x = 0
    M = 1
    for m in moduli:
        M *= m
    for mi, ri in zip(moduli, remainders):
        g, ai, bi = extended_gcd(M // mi, mi)
        x = (x + ri * ai * (M // mi)) % M
    return x % M

remainders = [2, 3, 5]
moduli = [3, 5, 7]
result = crt(remainders, moduli)
print(f"x ≡ {result} (mod {3*5*7})")
```

### Euler's Totient Function

```python
def euler_totient(n):
    result = n
    p = 2
    temp = n
    while p * p <= temp:
        if temp % p == 0:
            while temp % p == 0:
                temp //= p
            result -= result // p
        p += 1
    if temp > 1:
        result -= result // temp
    return result

for n in [10, 17, 100]:
    print(f"φ({n}) = {euler_totient(n)}")
```

## Best Practices

1. **Big Integer Arithmetic**: Python handles arbitrary precision
2. **Probabilistic Tests**: Use Miller-Rabin for large numbers
3. **Modular Inverse**: Only exists when gcd(a, m) = 1
4. **CRT**: Requires pairwise coprime moduli
5. **Performance**: Use pow(a, b, m) for modular exponentiation

## Common Patterns

```python
# Sieve of Eratosthenes
def sieve(n):
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i*i, n + 1, i):
                is_prime[j] = False
    return [i for i, prime in enumerate(is_prime) if prime]

# Order finding (quantum algorithm component)
def order_finding(a, n):
    for k in range(1, n):
        if pow(a, k, n) == 1:
            return k
    return None
```

## Core Competencies

1. Euclidean algorithm and gcd computation
2. Primality testing algorithms
3. Modular arithmetic and inverses
4. Chinese Remainder Theorem
5. Euler's totient and multiplicative functions
