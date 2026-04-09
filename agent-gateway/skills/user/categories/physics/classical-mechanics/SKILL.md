---
name: Classical Mechanics
description: Newtonian mechanics including Lagrangian and Hamiltonian dynamics, central forces, rigid body motion, small oscillations, and chaos theory for physics applications.
license: MIT
compatibility: python>=3.8
audience: physicists, engineers, researchers, students
category: physics
---

# Classical Mechanics

## What I Do

I provide comprehensive classical mechanics tools including Newtonian dynamics, Lagrangian and Hamiltonian formulations, central force problems, rigid body dynamics, small oscillations, and celestial mechanics for physics applications.

## When to Use Me

- Particle and rigid body dynamics
- Orbital mechanics calculations
- Vibrational analysis
- Conservative system analysis
- Collision and impact problems
- Celestial mechanics

## Core Concepts

- **Newton's Laws**: Force, mass, acceleration relationships
- **Lagrangian Mechanics**: Generalized coordinates, Euler-Lagrange
- **Hamiltonian Mechanics**: Phase space, canonical equations
- **Central Forces**: Gravitational, inverse-square laws
- **Rigid Body Dynamics**: Moments of inertia, Euler equations
- **Small Oscillations**: Normal modes, normal coordinates
- **Canonical Transformations**: Point, contact transformations
- **Action Principles**: Hamilton's principle, variational methods

## Code Examples

### Newtonian Dynamics

```python
import numpy as np

def newton_force(m, a):
    return m * a

def gravitational_force(m1, m2, r):
    G = 6.674e-11
    return G * m1 * m2 / r**2

def orbital_velocity(m, r, M):
    return np.sqrt(G * M / r)

G = 6.674e-11
m = 5.972e24  # Earth mass
r = 6.371e6   # Earth radius
v = orbital_velocity(m, r, m)
print(f"Orbital velocity: {v:.2f} m/s")

def projectile_motion(v0, theta, h0=0, g=9.81):
    vx = v0 * np.cos(theta)
    vy = v0 * np.sin(theta)
    t_flight = (vy + np.sqrt(vy**2 + 2*g*h0)) / g
    R = vx * t_flight
    H = h0 + vy**2 / (2*g)
    return R, H, t_flight
```

### Lagrangian Mechanics

```python
from sympy import symbols, Function, diff

t = symbols('t')
q = Function('q')(t)
q_dot = diff(q, t)
q_ddot = diff(q_dot, t)

def lagrangian_example(m, k, q, q_dot):
    T = 0.5 * m * q_dot**2
    V = 0.5 * k * q**2
    return T - V

def euler_lagrange(L, q, t):
    q_dot = diff(q, t)
    dL_dq = diff(L, q)
    dL_dqdot = diff(L, q_dot)
    ddt_dL_dqdot = diff(dL_dqdot, t)
    return ddt_dL_dqdot - dL_dq

m, k = symbols('m k')
L = lagrangian_example(m, k, q, q_dot)
print(f"Lagrangian: {L}")
```

### Central Force Motion

```python
def effective_potential(r, L, m, U):
    return U + L**2 / (2 * m * r**2)

def orbital_equation(r, theta, E, L, m, mu, k):
    u = 1 / r
    du_dtheta = -1 / r**2 * dr_dtheta
    return du_dtheta + u - mu * k / L**2

def eccentricity(E, L, m, k):
    return np.sqrt(1 + 2 * E * L**2 / (m * k**2))

m_earth = 5.972e24
L = 2.66e40
e = eccentricity(-5e7, L, m_earth, 3.98e14)
print(f"Orbital eccentricity: {e:.4f}")
```

### Rigid Body Dynamics

```python
def moment_of_inertia(parallel_axis, m, d):
    return parallel_axis + m * d**2

def angular_momentum(I, omega):
    return I * omega

def rotational_kinetic_energy(I, omega):
    return 0.5 * I * omega**2

I_cm = 0.5 * m * r**2  # Solid sphere
I_axis = moment_of_inertia(I_cm, m, r)
print(f"Parallel axis I: {I_axis:.4e} kg·m²")

def euler_equations(I1, I2, I3, omega1, omega2, omega3):
    I1_dot = (I2 - I3) * omega2 * omega3 / I1
    I2_dot = (I3 - I1) * omega3 * omega1 / I2
    I3_dot = (I1 - I2) * omega1 * omega2 / I3
    return I1_dot, I2_dot, I3_dot
```

### Small Oscillations

```python
def normal_modes(k_matrix, m_matrix):
    eigvals, eigvecs = np.linalg.eig(np.linalg.inv(m_matrix) @ k_matrix)
    return np.sqrt(eigvals), eigvecs

def natural_frequencies(k, m):
    omega_1 = np.sqrt(k / m)
    omega_2 = np.sqrt(3 * k / m)
    return omega_1, omega_2

k_matrix = np.array([[2, -1], [-1, 1]])
m_matrix = np.eye(2)
frequencies, modes = normal_modes(k_matrix, m_matrix)
print(f"Normal frequencies: {frequencies}")
print(f"Mode shapes:\n{modes}")
```

## Best Practices

1. **Conserved Quantities**: Identify symmetries and conserved quantities
2. **Degrees of Freedom**: Choose appropriate generalized coordinates
3. **Small Oscillations**: Check linear approximation validity
4. **Integrals of Motion**: Use energy, momentum conservation
5. **Phase Space**: Consider Hamiltonian for complex systems

## Common Patterns

```python
# Symplectic integrator
def symplectic_integrator(H, q0, p0, dt, n_steps):
    q = np.zeros((n_steps + 1, len(q0)))
    p = np.zeros((n_steps + 1, len(p0)))
    q[0], p[0] = q0, p0
    for i in range(n_steps):
        p[i+1] = p[i] - dt * H.diff('q').subs(zip(q[i], p[i]))
        q[i+1] = q[i] + dt * H.diff('p').subs(zip(q[i], p[i+1]))
    return q, p

# Verlet algorithm for molecular dynamics
def verlet_position(r, v, a, dt):
    return 2*r - r_prev + a*dt**2
```

## Core Competencies

1. Lagrangian and Hamiltonian mechanics
2. Central force and orbital problems
3. Rigid body dynamics
4. Small oscillations and normal modes
5. Variational principles
