---
name: Relativity
description: Special and general relativity including Lorentz transformations, spacetime diagrams, relativistic mechanics, black holes, and gravitational waves for physics applications.
license: MIT
compatibility: python>=3.8
audience: physicists, researchers, astronomers, students
category: physics
---

# Relativity

## What I Do

I provide comprehensive relativity tools including Lorentz transformations, spacetime geometry, relativistic kinematics and dynamics, black hole metrics, gravitational waves, and relativistic field theory for physics and astronomy applications.

## When to Use Me

- High-speed particle dynamics
- GPS satellite corrections
- Gravitational time dilation
- Black hole calculations
- Cosmological models
- Gravitational wave analysis

## Core Concepts

- **Lorentz Transformations**: Time dilation, length contraction
- **Spacetime Intervals**: Invariant quantities
- **Four-Vectors**: Energy-momentum, position
- **Relativistic Dynamics**: E=mc², relativistic momentum
- **General Relativity**: Curvature, geodesics
- **Black Holes**: Schwarzschild, Kerr metrics
- **Gravitational Waves**: Strain, propagation
- **Cosmology**: FLRW metric, expansion history

## Code Examples

### Lorentz Transformations

```python
import numpy as np

c = 299792458  # Speed of light (m/s)

def lorentz_factor(v):
    beta = v / c
    return 1 / np.sqrt(1 - beta**2)

def time_dilation(t, v):
    return lorentz_factor(v) * t

def length_contraction(L, v):
    return L / lorentz_factor(v)

def velocity_addition(v, u):
    return (v + u) / (1 + v * u / c**2)

v = 0.8 * c
gamma = lorentz_factor(v)
print(f"γ at 0.8c: {gamma:.4f}")

t_proper = 1.0  # seconds
t_lab = time_dilation(t_proper, v)
print(f"Time in lab frame: {t_lab:.4f} s")
```

### Four-Vectors

```python
class FourVector:
    def __init__(self, ct, x, y, z):
        self.ct = ct
        self.x = x
        self.y = y
        self.z = z
    
    def lorentz_boost(self, v, axis='x'):
        gamma = lorentz_factor(v)
        if axis == 'x':
            new_ct = gamma * (self.ct - v * self.x / c)
            new_x = gamma * (self.x - v * self.ct / c)
            return FourVector(new_ct, new_x, self.y, self.z)
        return self
    
    def magnitude_squared(self):
        return self.ct**2 - (self.x**2 + self.y**2 + self.z**2) / c**2

p = FourVector(c * 10, 5, 3, 1)
print(f"Invariant: {p.magnitude_squared():.4f}")

p_boosted = p.lorentz_boost(0.5 * c)
print(f"Boosted ct: {p_boosted.ct:.4f}")
```

### Energy-Momentum Relations

```python
def relativistic_energy(m, v):
    gamma = lorentz_factor(v)
    return gamma * m * c**2

def relativistic_momentum(m, v):
    return lorentz_factor(v) * m * v

def kinetic_energy(m, v):
    return relativistic_energy(m, v) - m * c**2

m = 1e-30  # kg (electron mass scale)
v = 0.9 * c

E = relativistic_energy(m, v)
p = relativistic_momentum(m, v)
K = kinetic_energy(m, v)

print(f"Total energy: {E:.4e} J")
print(f"Momentum: {p:.4e} kg·m/s")
print(f"Kinetic energy: {K:.4e} J")

def de_broglie_wavelength(m, v):
    h = 6.626e-34
    return h / relativistic_momentum(m, v)

wavelength = de_broglie_wavelength(m, v)
print(f"de Broglie wavelength: {wavelength:.4e} m")
```

### Schwarzschild Black Hole

```python
G = 6.674e-11  # Gravitational constant
M_sun = 1.989e30

def schwarzschild_radius(M):
    return 2 * G * M / c**2

def time_dilation_factor(r, M):
    rs = schwarzschild_radius(M)
    return np.sqrt(1 - rs / r)

def orbital_velocity(r, M):
    return np.sqrt(G * M / r)

M = M_sun
rs = schwarzschild_radius(M)
print(f"Schwarzschild radius of Sun: {rs:.4f} m")

r = 10 * rs
time_factor = time_dilation_factor(r, M)
print(f"Time dilation at 10rs: {time_factor:.4f}")
```

### Gravitational Waves

```python
def gw_strain(m1, m2, d, f):
    G = 6.674e-11
    c2 = c**2
    return (4 * G**2 * m1 * m2 / (c2**4 * d)) * (np.pi * G * (m1 + m2) * f / c2**3)**(2/3)

m1, m2 = 30 * 1.989e30, 30 * 1.989e30  # Solar masses
d = 1e6 * 3.086e16  # 1 Mpc in meters
f = 100  # Hz

h = gw_strain(m1, m2, d, f)
print(f"GW strain: {h:.4e}")

def gw_frequency_evolution(m1, m2, f0, t):
    tau = 5 / (256 * np.pi * c**5 / (G**3 * m1 * m2)) * (np.pi * G * (m1 + m2) * f0 / c**3)**(-8/3)
    return f0 / (1 - t / tau)**(3/8)
```

## Best Practices

1. **Units**: Use geometric units (c=1) when possible
2. **Approximations**: Weak field, slow motion limits
3. **Sign Conventions**: Be consistent with metric signature
4. **Singularities**: Physical interpretation of singularities
5. **Observables**: Consider what can actually be measured

## Common Patterns

```python
# FLRW scale factor
def hubble_parameter(H0, Omega_m, Omega_Lambda, z):
    return H0 * np.sqrt(Omega_m * (1+z)**3 + Omega_Lambda)

def redshift_to_distance(z, H0=70, Omega_m=0.3):
    dL = (c * z / H0) * (1 + z/2 - z**2/10)
    return dL

# Proper time along geodesic
def proper_time_integral(a_max, omega):
    return 2 * a_max / omega * (1 - np.exp(-omega * a_max / c))
```

## Core Competencies

1. Lorentz transformations and four-vectors
2. Relativistic kinematics and dynamics
3. General relativity fundamentals
4. Black hole physics
5. Gravitational wave basics
