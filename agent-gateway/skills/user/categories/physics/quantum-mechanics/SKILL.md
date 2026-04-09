---
name: Quantum Mechanics
description: Quantum mechanics fundamentals including wave functions, operators, Schrödinger equation, superposition, entanglement, and quantum measurement for physics applications.
license: MIT
compatibility: python>=3.8
audience: physicists, quantum-engineers, researchers, students
category: physics
---

# Quantum Mechanics

## What I Do

I provide comprehensive quantum mechanics tools including wave function manipulation, operator algebra, Schrödinger equation solving, quantum measurement, superposition, entanglement, and perturbation theory for physics and quantum computing applications.

## When to Use Me

- Quantum state evolution
- Atomic and molecular systems
- Quantum computing operations
- Spectroscopy calculations
- Quantum measurement theory
- Perturbation analysis

## Core Concepts

- **Wave Functions**: Probability amplitudes, normalization
- **Operators**: Position, momentum, Hamiltonian
- **Schrödinger Equation**: Time-dependent and time-independent
- **Superposition**: Linear combinations of states
- **Entanglement**: Non-local quantum correlations
- **Uncertainty Principle**: Position-momentum uncertainty
- **Angular Momentum**: Spin, orbital angular momentum
- **Perturbation Theory**: Non-degenerate and degenerate

## Code Examples

### Quantum States and Basis

```python
import numpy as np
from scipy.linalg import expm

ket_0 = np.array([1, 0])
ket_1 = np.array([0, 1])

plus = (ket_0 + ket_1) / np.sqrt(2)
minus = (ket_0 - ket_1) / np.sqrt(2)

print(f"|+⟩ = {plus}")
print(f"|-⟩ = {minus}")

def normalize(state):
    return state / np.linalg.norm(state)

def inner_product(psi, phi):
    return np.vdot(psi, phi)

print(f"⟨0|1⟩ = {inner_product(ket_0, ket_1)}")
```

### Quantum Operators

```python
sigma_x = np.array([[0, 1], [1, 0]])
sigma_y = np.array([[0, -1j], [1j, 0]])
sigma_z = np.array([[1, 0], [0, -1]])

identity = np.eye(2)

def commutator(A, B):
    return A @ B - B @ A

print(f"[σx, σy] = {commutator(sigma_x, sigma_y)}")

def expectation(operator, state):
    return np.real(np.vdot(state, operator @ state))

psi = plus
print(f"⟨σz⟩ in |+⟩: {expectation(sigma_z, psi)}")
```

### Time Evolution

```python
def time_evolution(psi0, H, t):
    U = expm(-1j * H * t)
    return U @ psi0

H = np.array([[1, 0], [0, -1]])

t = np.pi / 2
psi_t = time_evolution(ket_0, H, t)
print(f"State at t=π/2: {psi_t}")

def adiabatic_evolution(psi0, H_initial, H_final, T, steps=1000):
    psi = psi0.copy()
    dt = T / steps
    for i in range(steps):
        s = i / steps
        H = (1 - s) * H_initial + s * H_final
        U = expm(-1j * H * dt)
        psi = U @ psi
    return psi
```

### Hydrogen Atom Wave Functions

```python
from scipy.special import spherical_jn, eval_hermite
from numpy.polynomial.hermite import hermval

def hydrogen_wavefunction(n, l, m, r, theta, phi, a0=1):
    R = 0
    if n == 1 and l == 0:
        R = 2 * np.exp(-r / a0) / a0**1.5
    elif n == 2 and l == 0:
        R = (1 / np.sqrt(8)) * (2 - r / a0) * np.exp(-r / (2 * a0)) / a0**1.5
    elif n == 2 and l == 1:
        R = (1 / np.sqrt(24)) * (r / a0) * np.exp(-r / (2 * a0)) / a0**1.5
    
    Y = spherical_jn(l, m)
    
    return R * Y

r = np.linspace(0, 5, 100)
psi_1s = hydrogen_wavefunction(1, 0, 0, r, np.pi/4, 0)
print(f"1s wavefunction at r=1: {psi_1s[50]:.4f}")
```

### Spin Systems

```python
def spin_eigenvalues(S):
    return np.arange(S, -S - 1, -1)

def spin_raising(S, m):
    return np.sqrt(S * (S + 1) - m * (m + 1))

S = 1/2
m_values = spin_eigenvalues(S)
print(f"Spin-1/2 eigenvalues: {m_values}")

def pauli_vector(theta, phi):
    return np.array([
        np.sin(theta) * np.cos(phi),
        np.sin(theta) * np.sin(phi),
        np.cos(theta)
    ])

spin_direction = pauli_vector(np.pi/3, np.pi/4)
print(f"Spin direction: {spin_direction}")
```

## Best Practices

1. **Normalization**: Always normalize states
2. **Complex Numbers**: Handle complex arithmetic carefully
3. **Hermitian Operators**: Ensure observables use Hermitian matrices
4. **Units**: Use consistent units (atomic units often simplest)
5. **Basis Choice**: Choose appropriate basis for problem

## Common Patterns

```python
# Density matrix
def density_matrix(state):
    return np.outer(state, np.conj(state))

def partial_trace(rho, subsystem, dims):
    traced = np.trace(rho, axis1=subsystem, axis2=subsystem + len(dims))
    return traced

# Quantum entropy
def von_neumann_entropy(rho):
    eigenvalues = np.linalg.eigvalsh(rho)
    return -sum(e * np.log(e + 1e-15) for e in eigenvalues if e > 0)
```

## Core Competencies

1. Wave function manipulation
2. Operator algebra and expectations
3. Schrödinger equation solving
4. Quantum measurement theory
5. Perturbation analysis
