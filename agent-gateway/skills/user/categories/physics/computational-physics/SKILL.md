---
name: Computational Physics
description: Numerical methods for physics including finite difference, Monte Carlo, molecular dynamics, finite element analysis, and chaos theory for simulation applications.
license: MIT
compatibility: python>=3.8
audience: physicists, engineers, researchers, students
category: physics
---

# Computational Physics

## What I Do

I provide comprehensive computational physics tools including numerical integration, differential equation solvers, Monte Carlo methods, molecular dynamics, finite difference methods, and chaos theory for physics simulation and modeling.

## When to Use Me

- Solving differential equations numerically
- Monte Carlo simulations
- Molecular dynamics simulations
- Finite element analysis
- Chaotic system analysis
- Quantum Monte Carlo

## Core Concepts

- **Numerical Integration**: Simpson's rule, Gaussian quadrature
- **ODE Solvers**: Euler, Runge-Kutta, Verlet
- **PDE Solvers**: Finite difference, spectral methods
- **Monte Carlo**: Importance sampling, Metropolis-Hastings
- **Molecular Dynamics**: Force fields, integration
- **Chaos Theory**: Lyapunov exponents, bifurcation
- **Root Finding**: Newton-Raphson, bisection
- **Eigenvalue Problems**: Power method, QR algorithm

## Code Examples

### ODE Solvers

```python
import numpy as np

def euler_method(f, t0, y0, h, n_steps):
    t = t0
    y = y0
    results = [(t, y)]
    for _ in range(n_steps):
        y = y + h * f(t, y)
        t = t + h
        results.append((t, y))
    return np.array(results)

def runge_kutta_4(f, t0, y0, h, n_steps):
    t = t0
    y = y0
    results = [(t, y)]
    for _ in range(n_steps):
        k1 = f(t, y)
        k2 = f(t + h/2, y + h*k1/2)
        k3 = f(t + h/2, y + h*k2/2)
        k4 = f(t + h, y + h*k3)
        y = y + (h/6) * (k1 + 2*k2 + 2*k3 + k4)
        t = t + h
        results.append((t, y))
    return np.array(results)

def harmonic_oscillator(t, y):
    return np.array([y[1], -y[0]])

t, y = runge_kutta_4(harmonic_oscillator, 0, np.array([1.0, 0.0]), 0.1, 100).T
print(f"Final position: {y[0, -1]:.4f}")
```

### Verlet Integration

```python
def verlet_integration(x0, v0, a_func, dt, n_steps):
    x = np.zeros(n_steps)
    v = np.zeros(n_steps)
    x[0] = x0
    v[0] = v0
    
    for i in range(n_steps - 1):
        x[i+1] = 2*x[i] - x[i-1] + a_func(x[i]) * dt**2
        v[i+1] = (x[i+1] - x[i-1]) / (2 * dt)
    
    return x, v

def harmonic_acceleration(x):
    return -x

x0, v0 = 1.0, 0.0
dt, n_steps = 0.01, 1000
x, v = verlet_integration(x0, v0, harmonic_acceleration, dt, n_steps)
print(f"Amplitude preserved: {max(x):.6f}")
```

### Monte Carlo Integration

```python
import numpy as np

def monte_carlo_integration(f, n_samples, a, b):
    x = np.random.uniform(a, b, n_samples)
    y = np.random.uniform(0, max(f(np.linspace(a, b, 1000))), n_samples)
    under_curve = np.sum(y <= np.abs(f(x)))
    volume = (b - a) * max(f(np.linspace(a, b, 1000)))
    return volume * under_curve / n_samples

def sphere_volume_3d(n=1000000):
    points = np.random.uniform(-1, 1, (n, 3))
    inside = np.sum(points**2, axis=1) <= 1
    return 8 * np.sum(inside) / n

V = sphere_volume_3d()
print(f"Sphere volume estimate: {V:.6f}")
print(f"True value: {4/3 * np.pi:.6f}")
```

### Metropolis-Hastings Algorithm

```python
def metropolis_hastings(target_pdf, proposal_std, n_samples, x0=0):
    samples = np.zeros(n_samples)
    x = x0
    accept_count = 0
    
    for i in range(n_samples):
        x_proposed = x + np.random.normal(0, proposal_std)
        acceptance_ratio = target_pdf(x_proposed) / target_pdf(x)
        
        if np.random.uniform() < acceptance_ratio:
            x = x_proposed
            accept_count += 1
        
        samples[i] = x
    
    acceptance_rate = accept_count / n_samples
    return samples, acceptance_rate

target = lambda x: np.exp(-x**2 / 2) / np.sqrt(2 * np.pi)
samples, rate = metropolis_hastings(target, 1.0, 10000)
print(f"Acceptance rate: {rate:.3f}")
print(f"Sample mean: {np.mean(samples):.4f}")
```

### Finite Difference Method

```python
def solve_heat_equation(L, T, nx, nt, alpha, u0, u_left, u_right):
    dx = L / (nx - 1)
    dt = T / nt
    r = alpha * dt / dx**2
    
    u = np.zeros((nt + 1, nx))
    u[0] = u0(np.linspace(0, L, nx))
    
    for n in range(nt):
        for i in range(1, nx - 1):
            u[n+1, i] = u[n, i] + r * (u[n, i+1] - 2*u[n, i] + u[n, i-1])
        u[n+1, 0] = u_left
        u[n+1, -1] = u_right
    
    return u

L, T = 1.0, 0.1
u = solve_heat_equation(L, T, 50, 100, 0.01, lambda x: np.sin(np.pi*x), 0, 0)
print(f"Temperature at final time: {u[-1, 25]:.4f}")
```

## Best Practices

1. **Stability**: Check numerical stability of methods
2. **Convergence**: Verify convergence with step size
3. **Conservation**: Monitor conserved quantities
4. **Boundary Conditions**: Implement boundary conditions correctly
5. **Parallelization**: Use MPI for large simulations

## Common Patterns

```python
# Fast Fourier Transform for PDEs
def fft_solve(omega, n_points, T):
    x = np.linspace(0, 2*np.pi, n_points, endpoint=False)
    k = np.fft.fftfreq(n_points, d=x[1]-x[0])
    u0 = np.exp(-(x - np.pi)**2 / 0.1)
    
    u_hat = np.fft.fft(u0)
    u_hat *= np.exp(-1j * k**2 * T)
    
    return np.real(np.fft.ifft(u_hat))
```

## Core Competencies

1. ODE/PDE numerical methods
2. Monte Carlo simulation techniques
3. Molecular dynamics fundamentals
4. Finite difference methods
5. Chaos and nonlinear dynamics
