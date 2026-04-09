---
name: classical-mechanics
description: Newtonian mechanics including Lagrangian and Hamiltonian dynamics, central forces, rigid body motion, small oscillations, and chaos theory for physics applications.
category: physics
tags:
  - physics
  - classical-mechanics
  - newtonian
  - lagrangian
  - hamiltonian
  - rigid-body
  - oscillations
  - chaos
difficulty: intermediate
author: neuralblitz
---

# Classical Mechanics

## What I do

I provide comprehensive expertise in classical mechanics, the branch of physics describing the motion of macroscopic objects. I enable you to apply Newtonian mechanics, Lagrangian and Hamiltonian formalisms, analyze central force motion, study rigid body dynamics, solve small oscillation problems, and explore chaotic systems. My knowledge spans from Newton's laws to advanced analytical mechanics essential for engineering, astrophysics, robotics, and physics education.

## When to use me

Use classical mechanics when you need to: analyze projectile and orbital motion, design and control mechanical systems, study pendulum and vibrational dynamics, model rigid body rotation and gyroscopic effects, compute celestial mechanics and orbital transfers, analyze stability of mechanical equilibria, simulate multi-body dynamics, or apply Hamiltonian mechanics for quantum-classical correspondence.

## Core Concepts

- **Newton's Laws**: Foundation of classical mechanics relating forces to acceleration (F=ma) with action-reaction pairs.
- **Lagrangian Mechanics**: Reformulation using generalized coordinates and the principle of least action (L = T - V).
- **Hamiltonian Mechanics**: Phase space formulation with Hamilton's equations describing time evolution.
- **Conservation Laws**: Symmetries leading to conserved quantities (energy, momentum, angular momentum via Noether's theorem).
- **Central Forces**: Forces directed toward a fixed point enabling reduction to effective one-body problems.
- **Rigid Body Motion**: Rotation with angular velocity, inertia tensors, and Euler's equations.
- **Small Oscillations**: Linearization near equilibria to find normal modes and frequencies.
- **Canonical Transformations**: Changes of variables preserving Hamiltonian structure and Poisson brackets.
- **Action-Angle Variables**: Specialized coordinates for integrable systems with periodic motion.
- **Chaos and Sensitivity**: Deterministic unpredictability in nonlinear systems with sensitive dependence on initial conditions.

## Code Examples

### Newtonian Mechanics

```python
import numpy as np

def newton_motion(F, m, r0, v0, t_span, dt=0.01):
    """
    Integrate equations of motion using Velocity Verlet.
    F(t, r, v) = ma
    """
    n = int((t_span[1] - t_span[0]) / dt)
    t = np.linspace(t_span[0], t_span[1], n + 1)
    
    r = np.zeros((n + 1, len(r0)))
    v = np.zeros((n + 1, len(v0)))
    
    r[0] = r0
    v[0] = v0
    
    for i in range(n):
        a = F(t[i], r[i], v[i]) / m
        r[i + 1] = r[i] + v[i] * dt + 0.5 * a * dt**2
        a_new = F(t[i + 1], r[i + 1], v[i]) / m
        v[i + 1] = v[i] + 0.5 * (a + a_new) * dt
    
    return t, r, v

# Projectile motion
def gravity(t, r, v):
    """Gravitational acceleration (downward)."""
    return np.array([0, 0, -9.81])

r0 = np.array([0, 0, 0])
v0 = np.array([10, 0, 20])  # m/s
t, r, v = newton_motion(gravity, 1, r0, v0, (0, 5), dt=0.01)

# Find range and maximum height
mask = r[:, 2] >= 0
range_idx = np.where(np.diff(np.sign(r[mask, 2])))[0]
max_height = np.max(r[:, 2])

print("Projectile motion (v0 = (10, 0, 20) m/s):")
print(f"  Range (x when y=0): {r[range_idx[0], 0]:.2f} m")
print(f"  Maximum height: {max_height:.2f} m")
print(f"  Flight time: {t[range_idx[0]]:.2f} s")

# Theoretical values
v0x, v0z = 10, 20
g = 9.81
t_flight = 2 * v0z / g
range_theory = v0x * t_flight
h_max = v0z**2 / (2 * g)

print(f"\nTheoretical:")
print(f"  Range: {range_theory:.2f} m")
print(f"  Max height: {h_max:.2f} m")
print(f"  Flight time: {t_flight:.2f} s")
```

### Lagrangian Mechanics

```python
import numpy as np
from scipy.optimize import minimize

def lagrange_equations(L, generalized_coords, generalized_vels, t):
    """
    Compute Euler-Lagrange equations.
    d/dt(∂L/∂q̇) - ∂L/∂q = 0
    """
    from sympy import symbols, diff, Function
    
    # Symbolic computation (conceptual)
    # In practice, use sympy for automatic derivation
    pass

# Example: Double pendulum Lagrangian
def double_pendulum_derivatives(state, m1=1, m2=1, L1=1, L2=1, g=9.81):
    """
    Equations of motion for double pendulum.
    state = [theta1, theta2, omega1, omega2]
    """
    t1, t2, w1, w2 = state
    
    dt = t2 - t1
    
    # Common factors
    denom = 2 * m1 + m2 - m2 * np.cos(2 * t1 - 2 * t2)
    
    # Angular accelerations
    alpha1 = (-g * (2 * m1 + m2) * np.sin(t1) 
              - m2 * g * np.sin(t1 - 2 * t2)
              - 2 * np.sin(dt) * m2 * (w2**2 * L2 + w1**2 * L1 * np.cos(dt))) / (L1 * denom)
    
    alpha2 = (2 * np.sin(dt) 
              * (w1**2 * L1 * (m1 + m2) + g * (m1 + m2) * np.cos(t1)
              + w2**2 * L2 * m2 * np.cos(dt))) / (L2 * denom)
    
    return np.array([w1, w2, alpha1, alpha2])

# Energy computation
def double_pendulum_energy(state, m1=1, m2=1, L1=1, L2=1, g=9.81):
    """Compute total energy of double pendulum."""
    t1, t2, w1, w2 = state
    
    # Kinetic energy
    T1 = 0.5 * m1 * (L1**2 * w1**2)
    T2 = 0.5 * m2 * ((L1**2 * w1**2 + L2**2 * w2**2 
                      + 2 * L1 * L2 * w1 * w2 * np.cos(t1 - t2)))
    
    # Potential energy
    y1 = -L1 * np.cos(t1)
    y2 = y1 - L2 * np.cos(t2)
    V = m1 * g * y1 + m2 * g * y2
    
    return T1 + T2 + V

# Simulate double pendulum
state0 = [np.pi/2, np.pi/2, 0, 0]  # Initial state
dt = 0.01
n_steps = 1000

states = [state0]
energies = [double_pendulum_energy(state0)]

for _ in range(n_steps):
    state = states[-1]
    k1 = double_pendulum_derivatives(state)
    k2 = double_pendulum_derivatives(state + 0.5 * dt * k1)
    k3 = double_pendulum_derivatives(state + 0.5 * dt * k2)
    k4 = double_pendulum_derivatives(state + dt * k3)
    state_new = state + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4)
    
    states.append(state_new)
    energies.append(double_pendulum_energy(state_new))

states = np.array(states)
energies = np.array(energies)

print("Double pendulum simulation:")
print(f"  Initial energy: {energies[0]:.4f} J")
print(f"  Final energy: {energies[-1]:.4f} J")
print(f"  Energy conservation error: {abs(energies[-1] - energies[0])/energies[0]*100:.4f}%")
print(f"  Maximum deviation: {abs(energies - energies[0]).max()/energies[0]*100:.4f}%")
```

### Hamiltonian Mechanics

```python
import numpy as np

def hamilton_equations(H, state, t=0):
    """
    Compute Hamilton's equations.
    q̇ = ∂H/∂p
    ṗ = -∂H/∂q
    """
    q = state[:len(state)//2]
    p = state[len(state)//2:]
    
    # Numerical derivatives for Hamilton's equations
    dqdt = np.gradient(H(state + np.eye(len(state))[-1], q, p), q)
    dpdt = -np.gradient(H(state, q + np.eye(len(state))[0], p), p)
    
    return np.concatenate([dqdt, dpdt])

# Harmonic oscillator Hamiltonian
def harmonic_hamiltonian(state, k=1, m=1):
    """H = p²/2m + kx²/2"""
    x, p = state
    return p**2 / (2 * m) + k * x**2 / 2

# Verify Hamilton's equations
x, p = 1.0, 0.5
state = np.array([x, p])

print("Harmonic oscillator (H = p²/2m + kx²/2):")
print(f"  H(x=1, p=0.5) = {harmonic_hamiltonian(state):.4f}")
print(f"  Expected: p/m = {p/1:.4f}, -kx = {-k*x:.4f}")

# Canonical transformation (polar to Cartesian)
def polar_to_cartesian(r_p_theta):
    """Transform (r, p_r, θ, p_θ) to (x, p_x, y, p_y)."""
    r, pr, theta, ptheta = r_p_theta
    return np.array([
        r * np.cos(theta),
        pr * np.cos(theta) - ptheta * np.sin(theta) / r,
        r * np.sin(theta),
        pr * np.sin(theta) + ptheta * np.cos(theta) / r
    ])

# Poisson bracket
def poisson_bracket(A, B, q, p):
    """
    Compute Poisson bracket {A, B} = ∂A/∂q·∂B/∂p - ∂A/∂p·∂B/∂q
    """
    from numpy import gradient
    
    dA_dq = gradient(A(q, p), q)
    dA_dp = gradient(A(q, p), p)
    dB_dq = gradient(B(q, p), q)
    dB_dp = gradient(B(q, p), p)
    
    return dA_dq * dB_dp - dA_dp * dB_dq

# Angular momentum Poisson bracket
def angular_momentum(q, p):
    """L_z = x*p_y - y*p_x in 2D."""
    x, px, y, py = q[0], p[0], q[1], p[1]
    return x * py - y * px

def position_squared(q, p):
    """r² = x² + y²."""
    return q[0]**2 + q[1]**2

q = np.array([1.0, 0.0])
p = np.array([0.0, 1.0])

print(f"\nPoisson bracket:")
print(f"  {{r², L_z}} = {poisson_bracket(position_squared, angular_momentum, q, p):.4f}")
print(f"  Expected (should be 0 for rotational symmetry): 0")
```

### Rigid Body Motion

```python
import numpy as np
from scipy.linalg import expm, eigh

def inertia_tensor(masses, positions):
    """
    Compute inertia tensor I.
    I_ij = Σ_m (r²δ_ij - r_i r_j)
    """
    I = np.zeros((3, 3))
    
    for m, r in zip(masses, positions):
        r = np.array(r)
        I += m * (np.dot(r, r) * np.eye(3) - np.outer(r, r))
    
    return I

def principal_axes(I):
    """Diagonalize inertia tensor to find principal moments and axes."""
    eigenvalues, eigenvectors = eigh(I)
    return eigenvalues, eigenvectors

def euler_equations(tau, omega, I):
    """
    Euler's equations for rigid body rotation.
    I·α + ω × (I·ω) = τ
    """
    I_omega = I @ omega
    torque = np.cross(omega, I_omega)
    return tau - torque

def rotation_from_euler(phi, theta, psi):
    """
    Compute rotation matrix from Euler angles (ZYZ convention).
    """
    c1, s1 = np.cos(phi), np.sin(phi)
    c2, s2 = np.cos(theta), np.sin(theta)
    c3, s3 = np.cos(psi), np.sin(psi)
    
    R = np.array([
        [c1*c2*c3 - s1*s3, -c1*c2*s3 - s1*c3, c1*s2],
        [s1*c2*c3 + c1*s3, -s1*c2*s3 + c1*c3, s1*s2],
        [-s2*c3, s2*s3, c2]
    ])
    
    return R

# Example: Rectangular plate
masses = [1, 1, 1, 1]
positions = [[-1, -0.5, 0], [1, -0.5, 0], [1, 0.5, 0], [-1, 0.5, 0]]

I = inertia_tensor(masses, positions)
moments, axes = principal_axes(I)

print("Rectangular plate inertia tensor:")
print(f"  I = \n{I}")
print(f"\nPrincipal moments:")
print(f"  I₁ = {moments[0]:.4f}")
print(f"  I₂ = {moments[1]:.4f}")
print(f"  I₃ = {moments[2]:.4f}")

print(f"\nPrincipal axes (eigenvectors):")
for i, (m, ax) in enumerate(zip(moments, axes.T)):
    print(f"  Axis {i+1}: {ax} (moment {m:.4f})")

# Free rotation of asymmetric top
def free_rotation_sim(I, omega0, t_span, dt=0.01):
    """Simulate torque-free rigid body rotation."""
    from scipy.integrate import solve_ivp
    
    def euler_free(t, omega):
        return euler_equations(np.zeros(3), omega, I)
    
    sol = solve_ivp(euler_free, t_span, omega0, method='RK45', 
                   t_eval=np.arange(t_span[0], t_span[1], dt))
    
    return sol.t, sol.y

# Prolate top (I₁ < I₂ ≈ I₃)
I_prolate = np.diag([1, 2, 2])
omega0 = [1, 0.1, 0]

t, omega = free_rotation_sim(I_prolate, omega0, (0, 10))

print(f"\nFree rotation of prolate top:")
print(f"  Initial: ω = {omega0}")
print(f"  Final: ω ≈ [{omega[0, -1]:.3f}, {omega[1, -1]:.3f}, {omega[2, -1]:.3f}]")
```

### Small Oscillations and Normal Modes

```python
import numpy as np
from scipy.linalg import eigh

def normal_modes(T_matrix, V_matrix):
    """
    Find normal modes for small oscillations.
    Solve: (V - ω²T)v = 0
    """
    # Generalized eigenvalue problem
    eigenvalues, eigenvectors = eigh(V_matrix, T_matrix)
    
    # Sort by frequency
    sorted_idx = np.argsort(eigenvalues)
    return np.sqrt(eigenvalues[sorted_idx]), eigenvectors[:, sorted_idx]

# Triple mass-spring system
def triple_mass_spring(m=1, k=1):
    """
    Three masses connected by springs.
    | k -2k  k  |
    T = diag(m, m, m)
    V = | k  -2k  k |
        | k   k  -2k|
    """
    T = np.diag([m, m, m])
    
    K = np.array([
        [2*k, -k, 0],
        [-k, 2*k, -k],
        [0, -k, 2*k]
    ])
    
    return T, K

T, K = triple_mass_spring()
frequencies, modes = normal_modes(T, K)

print("Triple mass-spring system normal modes:")
for i, (freq, mode) in enumerate(zip(frequencies, modes.T)):
    print(f"  Mode {i+1}: ω = {freq:.4f}")
    print(f"    Shape: [{mode[0]:+.3f}, {mode[1]:+.3f}, {mode[2]:+.3f}]")

# Theoretical values for symmetric case
print("\nTheoretical frequencies:")
print(f"  ω₁ = √(k/m) = {np.sqrt(1):.4f}")
print(f"  ω₂ = √(3k/m) = {np.sqrt(3):.4f}")
print(f"  ω₃ = √(3k/m) = {np.sqrt(3):.4f}")

# Coupled pendula
def coupled_pendula(m=1, L=1, k=0.1, g=9.81):
    """
    Two pendula coupled by a spring.
    Lagrangian: L = T - V
    """
    # Small angle approximation
    omega0_sq = g / L
    coupling = k / m
    
    T = np.diag([m*L**2, m*L**2])
    K = m * np.array([
        [omega0_sq + coupling, -coupling],
        [-coupling, omega0_sq + coupling]
    ]) * L**2
    
    return T, K

T_coupled, K_coupled = coupled_pendula()
freqs_coupled, modes_coupled = normal_modes(T_coupled, K_coupled)

print("\nCoupled pendula:")
for i, (freq, mode) in enumerate(zip(freqs_coupled, modes_coupled.T)):
    phase = "in-phase" if mode[0] * mode[1] > 0 else "out-of-phase"
    print(f"  Mode {i+1}: ω = {freq:.4f} ({phase})")

# Molecular vibration (CO2-like)
def linear_triatomic(masses, k_stretch, k_bend):
    """
    Linear triatomic molecule (like CO2).
    Modes: symmetric stretch, bending, asymmetric stretch
    """
    m1, m2, m3 = masses
    
    # Simplified 1D model
    T = np.diag([m1, m2, m3])
    
    K = k_stretch * np.array([
        [1, -1, 0],
        [-1, 2, -1],
        [0, -1, 1]
    ])
    
    return T, K

masses = [12, 16, 12]  # C, O, O
T_mol, K_mol = linear_triatomic(masses, 1, 0.1)
freqs_mol, modes_mol = normal_modes(T_mol, K_mol)

print("\nCO2-like molecule vibrational modes:")
for i, (freq, mode) in enumerate(zip(freqs_mol, modes_mol.T)):
    print(f"  Mode {i+1}: ω = {freq:.4f}")
    print(f"    Displacement: [{mode[0]:+.3f}, {mode[1]:+.3f}, {mode[2]:+.3f}]")
```

## Best Practices

- Choose appropriate generalized coordinates that reflect system symmetries to simplify equations.
- Verify conservation laws (energy, momentum, angular momentum) numerically as sanity checks.
- For Hamiltonian systems, use symplectic integrators (like Velocity Verlet) to preserve phase space volume.
- When linearizing for small oscillations, ensure the equilibrium is stable before finding normal modes.
- For rigid body dynamics, always use principal axes to simplify Euler's equations.
- Be aware of gimbal lock in Euler angles; use quaternions for full SO(3) rotations.
- For chaotic systems, use high-precision arithmetic and validate sensitivity to initial conditions.
- In Lagrangian mechanics, ensure the Lagrangian is a scalar under coordinate transformations.
- When applying Noether's theorem, identify continuous symmetries to find corresponding conserved quantities.
- For numerical integration, choose step sizes small enough to resolve the fastest time scale in the system.

