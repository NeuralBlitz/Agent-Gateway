---
name: Statistical Mechanics
description: Statistical mechanics fundamentals including ensembles, partition functions, phase transitions, Monte Carlo methods, and non-equilibrium dynamics for physics applications.
license: MIT
compatibility: python>=3.8
audience: physicists, chemists, materials-scientists, researchers
category: physics
---

# Statistical Mechanics

## What I Do

I provide comprehensive statistical mechanics tools including ensemble theory, partition functions, phase transitions, Monte Carlo simulations, and non-equilibrium dynamics for physics and materials science applications.

## When to Use Me

- Thermodynamic property prediction
- Phase transition analysis
- Monte Carlo simulations
- Critical phenomena
- Non-equilibrium dynamics
- Materials modeling

## Core Concepts

- **Ensembles**: Microcanonical, canonical, grand canonical
- **Partition Functions**: Translational, rotational, vibrational
- **Phase Transitions**: First/second order, critical phenomena
- **Monte Carlo**: Metropolis, importance sampling
- **Mean Field Theory**: Bragg-Williams, Landau theory
- **Fluctuations**: Variance, correlation functions
- **Non-Equilibrium**: Langevin, Fokker-Planck
- **Renormalization**: Wilson RG, scaling

## Code Examples

### Ensemble Calculations

```python
import numpy as np

def canonical_partition_function(T, N, V, E_levels):
    beta = 1 / (8.617e-5 * T)  # eV/K
    Z = sum(np.exp(-beta * E) for E in E_levels)
    return Z

def free_energy_canonical(T, Z):
    kB = 8.617e-5  # eV/K
    return -kB * T * np.log(Z)

def entropy_canonical(T, Z, E_avg):
    kB = 8.617e-5
    return (E_avg - free_energy_canonical(T, Z)) / T

def heat_capacity(E2, E1, T2, T1):
    return (E2 - E1) / (T2 - T1)

T = 300
E_levels = np.array([0, 0.01, 0.02, 0.05, 0.1])
Z = canonical_partition_function(T, 1, 1, E_levels)
F = free_energy_canonical(T, Z)
print(f"Partition function: {Z:.4f}")
print(f"Free energy: {F:.4f} eV")
```

### Ising Model Simulation

```python
def ising_energy(config, J, h):
    E = 0
    n = len(config)
    for i in range(n):
        for j in range(n):
            E -= J * config[i,j] * config[(i+1)%n, j]
            E -= J * config[i,j] * config[i, (j+1)%n]
            E -= h * config[i,j]
    return E

def metropolis_ising(config, T, J=1, h=0, n_steps=10000):
    N = len(config)
    E = ising_energy(config, J, h)
    
    for _ in range(n_steps):
        i, j = np.random.randint(0, N, 2)
        delta_E = 2 * config[i,j] * (J * (config[(i-1)%N,j] + config[(i+1)%N,j] +
                                     config[i,(j-1)%N] + config[i,(j+1)%N]) + h)
        
        if delta_E <= 0 or np.random.random() < np.exp(-delta_E / T):
            config[i,j] *= -1
            E += delta_E
    
    return config, E

config = np.random.choice([-1, 1], (10, 10))
config_final, E_final = metropolis_ising(config, 2.5)
print(f"Final energy: {E_final:.2f}")
print(f"Magnetization: {np.sum(config_final)}")
```

### Critical Phenomena

```python
def susceptibility(chi, beta, gamma, h):
    return chi * np.abs(h)**(-gamma / beta) if h != 0 else np.inf

def correlation_length(xi, nu, T, Tc):
    if T > Tc:
        return xi * (T - Tc)**(-nu)
    return np.inf

def order_parameter(T, Tc, beta):
    if T < Tc:
        return (1 - T/Tc)**beta
    return 0

def scaling_relation(delta, eta, gamma, nu):
    return delta = (d + 2 - eta) / (d - 2 + eta)

Tc_ising = 2.269  # 2D Ising critical temperature
beta = 1/8
print(f"Order parameter at T=2.0: {order_parameter(2.0, Tc_ising, beta):.4f}")
```

### Langevin Dynamics

```python
def langevin_step(x, v, m, gamma, T, dt, force_func):
    kB = 1.38e-23
    sigma = np.sqrt(2 * gamma * kB * T / dt)
    
    noise = np.random.normal(0, sigma)
    deterministic = force_func(x) - gamma * v
    
    v_new = v + (deterministic / m) * dt + noise / m
    x_new = x + v_new * dt
    
    return x_new, v_new

def langevin_equation(m, gamma, k, T):
    kBT = 1.38e-23 * T
    relaxation_time = m / gamma
    
    x0 = 1.0
    x_final = x0 * np.exp(-gamma / m * t)
    
    return x_final

def friction_dissipation(gamma, v):
    return -gamma * v

def noise_correlation(gamma, kB, T):
    return 2 * gamma * kB * T
```

### Fokker-Planck Equation

```python
def fokker_planck_coefficients(drift, diffusion, x, t):
    A = drift(x, t)
    B = diffusion(x, t)
    dB_dx = np.gradient(B, x)
    return A, dB_dx

def probability_current(J, x):
    return J

def solve_fokker_planck(x0, x_max, t_max, drift, diffusion, n_points=100):
    dx = (x_max - x0) / n_points
    dt = 0.01
    
    x = np.linspace(x0, x_max, n_points)
    P = np.zeros_like(x)
    P[np.argmin(np.abs(x - x0))] = 1 / dx
    
    for t in np.arange(0, t_max, dt):
        A, dB_dx = fokker_planck_coefficients(drift, diffusion, x, t)
        P_new = P - dt * np.gradient(A * P, dx) + dt * np.gradient(dB_dx * np.gradient(P, dx), dx)
        P = np.maximum(P_new, 0)
    
    return x, P
```

## Best Practices

1. **Equilibration**: Allow sufficient equilibration time
2. **Autocorrelation**: Account for correlated samples
3. **Finite Size**: Account for finite-size effects near Tc
4. **Error Estimation**: Use block averaging
5. **Boundary Conditions**: Periodic vs open boundaries

## Common Patterns

```python
# Wang-Landau algorithm
def wang_landau_simulation():
    pass

# Transfer matrix method
def transfer_matrix_isizing(J, h, N):
    pass
```

## Core Competencies

1. Ensemble theory
2. Monte Carlo simulation
3. Phase transition analysis
4. Non-equilibrium dynamics
5. Critical phenomena
