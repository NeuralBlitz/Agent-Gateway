---
name: number-theory
description: Number theory fundamentals including divisibility, prime numbers, modular arithmetic, Diophantine equations, and cryptographic applications.
category: mathematics
tags:
  - mathematics
  - number-theory
  - primes
  - modular-arithmetic
  - cryptography
  - diophantine
  - algorithms
difficulty: intermediate
author: neuralblitz
---

# Number Theory

## What I do

I provide comprehensive expertise in number theory, the branch of mathematics concerned with the properties and relationships of integers. I enable you to work with divisibility, prime numbers, modular arithmetic, Diophantine equations, and number-theoretic algorithms. My knowledge spans from fundamental theorems (fundamental theorem of arithmetic, Fermat's little theorem) to cryptographic applications (RSA, elliptic curves) essential for cryptography, computer security, algorithm design, and pure mathematics research.

## When to use me

Use number theory when you need to: implement cryptographic algorithms (RSA, ECC, Diffie-Hellman), generate and test prime numbers for key generation, solve modular equations and congruences, implement hash functions and checksums, optimize algorithms using number-theoretic transforms, analyze integer partitions and Diophantine equations, validate digital signatures, or apply Chinese Remainder Theorem for system of congruences.

## Core Concepts

- **Divisibility and GCD**: Relationships between integers where a|b means a divides b, with greatest common divisor computation.
- **Prime Numbers and Primality Testing**: Numbers greater than 1 with no positive divisors, essential for cryptography.
- **Modular Arithmetic**: Arithmetic on remainders with operations modulo m, fundamental to modern cryptography.
- **Euler's Theorem and Totient Function**: Generalization of Fermat's little theorem with φ(n) counting coprime residues.
- **Chinese Remainder Theorem**: System of congruences with pairwise coprime moduli has a unique solution modulo product.
- **Quadratic Residues**: Numbers that are squares modulo p, used in cryptographic protocols.
- **Primitive Roots and Discrete Logarithms**: Generators of multiplicative groups and their computational hardness.
- **Diophantine Equations**: Polynomial equations seeking integer solutions, including linear and exponential forms.
- **Modular Inverses**: Numbers satisfying ax ≡ 1 (mod m), existing iff gcd(a,m)=1.
- **Continued Fractions**: Expressions representing numbers through sequences of integers, useful in approximation.

## Code Examples

### Divisibility and GCD Algorithms

```python
import math

def extended_gcd(a, b):
    """
    Extended Euclidean Algorithm.
    Returns (g, x, y) such that ax + by = g = gcd(a, b)
    """
    if b == 0:
        return (abs(a), 1 if a > 0 else -1, 0)
    
    g, x1, y1 = extended_gcd(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    
    return (g, x, y)

def gcd(a, b):
    """Compute greatest common divisor using Euclidean algorithm."""
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    """Compute least common multiple."""
    if a == 0 or b == 0:
        return 0
    return abs(a * b) // gcd(a, b)

def bezout_coefficients(a, b):
    """Find x, y such that ax + by = gcd(a, b)."""
    g, x, y = extended_gcd(a, b)
    return x, y

# Examples
print(f"gcd(48, 18) = {gcd(48, 18)}")
print(f"lcm(12, 15) = {lcm(12, 15)}")

x, y = bezout_coefficients(48, 18)
print(f"Bézout coefficients for 48, 18: x={x}, y={y}")
print(f"Verification: 48*({x}) + 18*({y}) = {48*x + 18*y}")

# Check if ax + by = c has integer solutions
def has_diophantine_solution(a, b, c):
    """Check if ax + by = c has integer solutions."""
    return c % gcd(a, b) == 0

print(f"\n24x + 18y = 6 has solution: {has_diophantine_solution(24, 18, 6)}")
print(f"24x + 18y = 7 has solution: {has_diophantine_solution(24, 18, 7)}")

# Find particular solution
def solve_linear_diophantine(a, b, c):
    """Find particular solution to ax + by = c."""
    g, x0, y0 = extended_gcd(a, b)
    
    if c % g != 0:
        return None  # No solution
    
    scale = c // g
    return (x0 * scale, y0 * scale)

solution = solve_linear_diophantine(24, 18, 6)
print(f"Particular solution to 24x + 18y = 6: {solution}")
```

### Modular Arithmetic

```python
def mod_pow(base, exponent, modulus):
    """Modular exponentiation using binary exponentiation."""
    result = 1
    base = base % modulus
    
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * base) % modulus
        exponent //= 2
        base = (base * base) % modulus
    
    return result

def mod_inverse(a, modulus):
    """Find modular inverse using extended Euclidean algorithm."""
    g, x, y = extended_gcd(a, modulus)
    
    if g != 1:
        return None  # Inverse doesn't exist
    
    return x % modulus

def chinese_remainder_theorem(congruences):
    """
    Solve system of congruences:
    x ≡ a1 (mod n1)
    x ≡ a2 (mod n2)
    ...
    where moduli are pairwise coprime.
    """
    # Find M = product of all moduli
    moduli = [n for _, n in congruences]
    M = 1
    for n in moduli:
        M *= n
    
    result = 0
    for a, n in congruences:
        Mi = M // n
        # Find inverse of Mi modulo n
        _, y, _ = extended_gcd(Mi, n)
        result += a * Mi * y
    
    return result % M

# Examples
print(f"3^17 mod 1000 = {mod_pow(3, 17, 1000)}")
print(f"Inverse of 17 mod 100: {mod_inverse(17, 100)}")

# Chinese Remainder Theorem example
congruences = [(2, 3), (3, 5), (2, 7)]
solution = chinese_remainder_theorem(congruences)
print(f"\nCRT solution for x≡2(3), x≡3(5), x≡2(7): x = {solution}")
print(f"Verification: {solution} mod 3 = {solution % 3}, mod 5 = {solution % 5}, mod 7 = {solution % 7}")

# Solve using Garner's algorithm (efficient for CRT)
def garner_algorithm(congruences, mod=None):
    """Garner's algorithm for CRT (handles non-coprime with consistency check)."""
    x = 0
    M = 1
    
    for a, n in congruences:
        # Find t such that x + M*t ≡ a (mod n)
        t = mod_inverse(M % n, n) * ((a - x) % n)
        t %= n
        x += M * t
        M *= n
    
    return x

x_garner = garner_algorithm(congruences)
print(f"Garner: x = {x_garner}")
```

### Primality Testing

```python
import random
import math

def is_probable_prime(n, k=10):
    """Miller-Rabin primality test (probabilistic)."""
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    
    # Write n-1 as 2^r * d
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2
    
    # Test k rounds
    for _ in range(k):
        a = random.randrange(2, n - 1)
        x = pow(a, d, n)
        
        if x == 1 or x == n - 1:
            continue
        
        for _ in range(r - 1):
            x = (x * x) % n
            if x == n - 1:
                break
        else:
            return False
    
    return True

def deterministic_primality_test(n):
    """Deterministic primality test for n < 2^64."""
    if n < 2:
        return False
    if n in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        return True
    if n % 2 == 0:
        return False
    
    # Miller-Rabin with deterministic bases for 64-bit integers
    bases = [2, 325, 9375, 28178, 450775, 9780504, 1795265022]
    
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2
    
    for a in bases:
        if a % n == 0:
            continue
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = (x * x) % n
            if x == n - 1:
                break
        else:
            return False
    
    return True

def sieve_of_eratosthenes(limit):
    """Generate all primes up to limit."""
    if limit < 2:
        return []
    
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False
    
    for p in range(2, int(limit ** 0.5) + 1):
        if sieve[p]:
            for multiple in range(p * p, limit + 1, p):
                sieve[multiple] = False
    
    return [i for i, is_prime in enumerate(sieve) if is_prime]

# Examples
primes = sieve_of_eratosthenes(100)
print(f"Primes up to 100: {primes}")
print(f"Number of primes: {len(primes)}")

# Test primality
test_numbers = [101, 1000003, 2**127 - 1]  # 2^127 - 1 is a Mersenne prime
for n in test_numbers:
    print(f"{n} is prime: {deterministic_primality_test(n)}")

# RSA-style primality test
large_prime_candidate = 2305843009213693951  # 2^61 - 1
print(f"\n{2**61 - 1} is prime: {deterministic_primality_test(large_prime_candidate)}")
```

### Cryptographic Applications

```python
import random

def generate_rsa_keys(bit_length=2048):
    """Generate RSA key pair."""
    # Find two large primes
    def find_prime(bits):
        while True:
            n = random.getrandbits(bits)
            if deterministic_primality_test(n):
                if deterministic_primality_test((n - 1) // 2):
                    return n
    
    p = find_prime(bit_length // 2)
    q = find_prime(bit_length // 2)
    while q == p:
        q = find_prime(bit_length // 2)
    
    n = p * q
    phi = (p - 1) * (q - 1)
    
    # Choose e (commonly 65537)
    e = 65537
    while math.gcd(e, phi) != 1:
        e = random.randrange(3, phi, 2)
    
    # Compute d as modular inverse of e
    d = mod_inverse(e, phi)
    
    return (e, n), (d, n)  # Public key, private key

def rsa_encrypt(message, public_key):
    """Encrypt message using RSA."""
    e, n = public_key
    return pow(message, e, n)

def rsa_decrypt(ciphertext, private_key):
    """Decrypt message using RSA."""
    d, n = private_key
    return pow(ciphertext, d, n)

# RSA example (small numbers for demonstration)
def rsa_demo():
    # Generate keys with smaller primes for demo
    p, q = 61, 53
    n = p * q
    phi = (p - 1) * (q - 1)
    
    e = 17  # Public exponent
    d = mod_inverse(e, phi)  # Private exponent
    
    public_key = (e, n)
    private_key = (d, n)
    
    message = 42
    ciphertext = rsa_encrypt(message, public_key)
    decrypted = rsa_decrypt(ciphertext, private_key)
    
    print(f"\nRSA Demo:")
    print(f"  p = {p}, q = {q}, n = {n}")
    print(f"  e = {e}, d = {d}")
    print(f"  Message: {message}")
    print(f"  Ciphertext: {ciphertext}")
    print(f"  Decrypted: {decrypted}")
    print(f"  Success: {message == decrypted}")

rsa_demo()

# Diffie-Hellman key exchange
def diffie_hellman(p, g, private_a, private_b):
    """Demonstrate Diffie-Hellman key exchange."""
    # Public parameters: prime p and generator g
    
    # Alice computes A = g^a mod p
    A = pow(g, private_a, p)
    
    # Bob computes B = g^b mod p
    B = pow(g, private_b, p)
    
    # Alice computes shared secret: B^a mod p
    shared_alice = pow(B, private_a, p)
    
    # Bob computes shared secret: A^b mod p
    shared_bob = pow(A, private_b, p)
    
    return shared_alice, shared_bob

# DH example
p = 23  # Small prime for demo
g = 5   # Generator
alice_private = 4
bob_private = 3

shared_a, shared_b = diffie_hellman(p, g, alice_private, bob_private)
print(f"\nDiffie-Hellman:")
print(f"  Prime p = {p}, Generator g = {g}")
print(f"  Alice's private: {alice_private}, Bob's private: {bob_private}")
print(f"  Shared secret: {shared_a} (both parties agree)")
```

### Number-Theoretic Functions

```python
import math

def euler_totient(n):
    """Compute Euler's totient function φ(n)."""
    result = n
    p = 2
    
    while p * p <= n:
        if n % p == 0:
            while n % p == 0:
                n //= p
            result -= result // p
        p += 1
    
    if n > 1:
        result -= result // n
    
    return result

def mobius_function(n):
    """Compute Möbius function μ(n)."""
    if n == 1:
        return 1
    
    prime_factors = set()
    p = 2
    
    while p * p <= n:
        if n % p == 0:
            if p in prime_factors:  # Squared prime factor
                return 0
            prime_factors.add(p)
            while n % p == 0:
                n //= p
        p += 1
    
    if n > 1:
        prime_factors.add(n)
    
    return -1 if len(prime_factors) % 2 == 1 else 1

def divisor_function(n, k=1):
    """Compute σ_k(n) = sum of k-th powers of divisors."""
    total = 0
    p = 2
    
    while p * p <= n:
        if n % p == 0:
            exp = 0
            while n % p == 0:
                n //= p
                exp += 1
            total += (p**(k * (exp + 1)) - 1) // (p**k - 1) if p**k != 1 else (exp + 1)
        p += 1
    
    if n > 1:
        total += n**k
    
    return total

def prime_factorization(n):
    """Return prime factorization of n as dictionary."""
    factors = {}
    p = 2
    
    while p * p <= n:
        while n % p == 0:
            factors[p] = factors.get(p, 0) + 1
            n //= p
        p += 1
    
    if n > 1:
        factors[n] = factors.get(n, 0) + 1
    
    return factors

# Examples
print(f"φ(100) = {euler_totient(100)}")
print(f"μ(100) = {mobius_function(100)}")
print(f"σ_0(100) (number of divisors) = {divisor_function(100, 0)}")
print(f"σ_1(100) (sum of divisors) = {divisor_function(100, 1)}")
print(f"Prime factorization of 100: {prime_factorization(100)}")

# Verify multiplicative property
for n in [15, 21, 35]:
    phi_n = euler_totient(n)
    phi_factors = [euler_totient(p) for p in prime_factorization(n)]
    phi_product = math.prod(phi_factors)
    print(f"φ({n}) = {phi_n} = {' × '.join(map(str, phi_factors))} = {phi_product}")

# Carmichael function (exponent of multiplicative group)
def carmichael_function(n):
    """Compute Carmichael function λ(n)."""
    factors = prime_factorization(n)
    
    if n == 1:
        return 1
    
    if n == 2 or n == 4:
        return n // 2
    
    if n % 4 == 0 and n > 4:
        factors[2] -= 2
    
    lcm_val = 1
    for p, exp in factors.items():
        if p == 2 and exp > 2:
            lcm_val = max(lcm_val, 2**(exp - 2))
        else:
            lcm_val = max(lcm_val, (p - 1) * p**(exp - 1))
    
    return lcm_val

print(f"\nλ(100) = {carmichael_function(100)}")  # Carmichael function
```

## Best Practices

- Use deterministic primality tests (Miller-Rabin with specific bases) for cryptographic applications rather than probabilistic versions.
- Always reduce intermediate results modulo n in modular arithmetic to prevent integer overflow.
- When computing modular inverses, verify that the modulus and base are coprime first.
- For RSA key generation, ensure primes p and q are sufficiently far apart to prevent Fermat factorization attacks.
- Use Chinese Remainder Theorem in RSA decryption for approximately 4x speedup.
- Implement secure random number generation for cryptographic key generation; Mersenne Twister is NOT cryptographically secure.
- Consider timing attacks on modular exponentiation; use constant-time algorithms in production systems.
- When implementing number-theoretic algorithms, handle edge cases (n=0, n=1, negative numbers) explicitly.
- Use Montgomery reduction for efficient modular multiplication in cryptographic implementations.
- Validate inputs to cryptographic functions to prevent side-channel attacks and edge case vulnerabilities.

