---
name: Electromagnetism
description: Electromagnetic theory including Maxwell's equations, electrostatics, magnetostatics, electromagnetic waves, and radiation for physics and engineering applications.
license: MIT
compatibility: python>=3.8
audience: physicists, electrical-engineers, researchers, students
category: physics
---

# Electromagnetism

## What I Do

I provide comprehensive electromagnetism tools including electrostatic fields, magnetic fields, Maxwell's equations, electromagnetic waves, radiation theory, and circuit analysis for physics and engineering applications.

## When to Use Me

- Electric field and potential calculations
- Magnetic field analysis
- Electromagnetic wave propagation
- Radiation and antenna theory
- Circuit analysis
- Plasma physics

## Core Concepts

- **Electrostatics**: Coulomb's law, Gauss's law, Poisson's equation
- **Magnetostatics**: Biot-Savart law, Ampere's law
- **Maxwell's Equations**: Integral and differential forms
- **EM Waves**: Wave equation, polarization, propagation
- **Potentials**: Scalar and vector potentials, gauge invariance
- **Radiation**: Dipole radiation, antenna patterns
- **Boundary Conditions**: Dielectric and conductor interfaces
- **Electromagnetic Materials**: Permittivity, permeability

## Code Examples

### Electrostatic Fields

```python
import numpy as np

k_e = 8.99e9  # Coulomb constant

def electric_field_point_charge(q, r, r_vec):
    return k_e * q * r_vec / np.linalg.norm(r_vec)**3

def electric_potential_point_charge(q, r):
    return k_e * q / r

def superposition_e_field(charges, positions, observation_point):
    E = np.zeros(3)
    for q, r in zip(charges, positions):
        r_vec = observation_point - r
        r_mag = np.linalg.norm(r_vec)
        E += k_e * q * r_vec / r_mag**3
    return E

charges = [1e-6, -1e-6]
positions = [np.array([0, 0, 0]), np.array([0.1, 0, 0])]
E = superposition_e_field(charges, positions, np.array([0.05, 0.05, 0]))
print(f"Electric field: {E}")
```

### Gauss's Law

```python
def electric_flux_through_surface(E, dA):
    return np.sum(E * dA)

def enclosed_charge_from_flux(flux, epsilon=8.85e-12):
    return epsilon * flux

# Dipole moment
def dipole_moment(q, d):
    return q * d

def field_on_axis_dipole(p, r, epsilon=8.85e-12):
    k = 1 / (4 * np.pi * epsilon)
    return 2 * k * p / r**3

p = 1e-9 * np.array([0.01, 0, 0])
r = 0.1
E_axis = field_on_axis_dipole(p, r)
print(f"Field on dipole axis: {E_axis}")
```

### Magnetic Fields

```python
mu_0 = 4e-7 * np.pi  # Permeability of free space

def biot_savart_field(I, dl, r_obs, r_source):
    r_vec = r_obs - r_source
    r_mag = np.linalg.norm(r_vec)
    return mu_0 / (4 * np.pi) * I * np.cross(dl, r_vec) / r_mag**3

def magnetic_dipole_field(m, r):
    r_mag = np.linalg.norm(r)
    return mu_0 / (4 * np.pi) * (3 * np.dot(m, r) * r / r_mag**5 - m / r_mag**3)

m = np.array([0, 0, 1e-3])
r = np.array([0.1, 0.1, 0])
B = magnetic_dipole_field(m, r)
print(f"Magnetic field from dipole: {B}")
```

### Maxwell's Equations

```python
def faraday_law(dB_dt, area):
    return -dB_dt * area

def ampere_maxwell_law(I, dE_dt, epsilon=8.85e-12, mu=4e-7*np.pi):
    return I + epsilon * mu * dE_dt * area

def wave_equation_coefficients(epsilon, mu, sigma=0):
    c = 1 / np.sqrt(epsilon * mu)
    alpha = sigma / (2 * epsilon)
    return c, alpha

epsilon = 8.85e-12
c, alpha = wave_equation_coefficients(epsilon, 4e-7*np.pi)
print(f"Speed of light in medium: {c:.2e} m/s")
print(f"Attenuation constant: {alpha:.2e}")
```

### Electromagnetic Waves

```python
def wave_impedance(epsilon, mu):
    return np.sqrt(mu / epsilon)

def skin_depth(sigma, omega, mu, epsilon):
    return np.sqrt(2 / (omega * mu * sigma))

def reflected_power(n1, n2):
    return ((n2 - n1) / (n2 + n1))**2

epsilon_r = 2.1
mu_r = 1
sigma = 1e-2
f = 1e9

eta = wave_impedance(epsilon_r * 8.85e-12, mu_r * 4e-7*np.pi)
delta = skin_depth(sigma, 2*np.pi*f, mu_r * 4e-7*np.pi, epsilon_r * 8.85e-12)
print(f"Wave impedance: {eta:.2f} Ω")
print(f"Skin depth: {delta:.2e} m")
```

## Best Practices

1. **Boundary Conditions**: Apply appropriate BCs at interfaces
2. **Singularities**: Handle point charges carefully
3. **Units**: Use SI units consistently
4. **Gauge Choice**: Choose appropriate gauge for potentials
5. **Materials**: Account for frequency-dependent properties

## Common Patterns

```python
# Poynting vector
def poynting_vector(E, H):
    return np.cross(E, np.conj(H))

# Radiation resistance
def radiation_resistance(I, l, f, c=3e8):
    return 80 * np.pi**2 * (I * l / c)**2 * (f/c)**2

# Retarded potentials
def retarded_time(t_obs, r, c):
    return t_obs - np.linalg.norm(r) / c
```

## Core Competencies

1. Electrostatic and magnetostatic fields
2. Maxwell's equations and wave propagation
3. Boundary value problems
4. Electromagnetic radiation
5. Circuit and transmission line theory
