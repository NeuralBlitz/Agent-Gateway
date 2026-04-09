---
name: Mechanical Engineering
description: Mechanical engineering fundamentals including statics, dynamics, machine design, heat transfer, fluid mechanics, and manufacturing processes for engineering applications.
license: MIT
compatibility: python>=3.8
audience: mechanical-engineers, manufacturing-engineers, researchers, students
category: engineering
---

# Mechanical Engineering

## What I Do

I provide comprehensive mechanical engineering tools including statics and dynamics analysis, machine design calculations, heat transfer analysis, fluid mechanics, stress analysis, and manufacturing optimization for engineering applications.

## When to Use Me

- Structural analysis and design
- Machine component sizing
- Heat transfer calculations
- Fluid flow analysis
- Stress and strain analysis
- Manufacturing process planning

## Core Concepts

- **Statics**: Force equilibrium, free body diagrams
- **Dynamics**: Kinematics, kinetics, vibrations
- **Mechanics of Materials**: Stress, strain, deformation
- **Machine Design**: Bearings, gears, shafts
- **Heat Transfer**: Conduction, convection, radiation
- **Fluid Mechanics**: Bernoulli, Navier-Stokes
- **Thermodynamics**: Energy, entropy, efficiency
- **Manufacturing**: Machining, forming, additive

## Code Examples

### Statics Analysis

```python
import numpy as np

def equilibrium_2d(forces_x, forces_y, moments, distances):
    sum_fx = sum(f[0] for f in forces_x) + sum(f[0] for f in forces_y)
    sum_fy = sum(f[1] for f in forces_y)
    sum_m = sum(m + r * f[1] for m, r, f in zip(moments, distances, forces_y))
    return {'Fx': sum_fx, 'Fy': sum_fy, 'M': sum_m}

def beam_reactions(w, L, support_type='simply_supported'):
    if support_type == 'simply_supported':
        RA = w * L / 2
        RB = w * L / 2
        max_moment = w * L**2 / 8
        return {'RA': RA, 'RB': RB, 'Mmax': max_moment}
    elif support_type == 'cantilever':
        RA = w * L
        M_base = w * L**2 / 2
        return {'RA': RA, 'Mmax': M_base}

w = 10  # kN/m
L = 5   # m
reactions = beam_reactions(w, L, 'simply_supported')
print(f"Beam reactions: {reactions}")
```

### Stress Analysis

```python
def normal_stress(P, A):
    return P / A

def shear_stress(V, Q, I, b):
    return V * Q / (I * b)

def moment_of_inertia_rectangle(b, h):
    return b * h**3 / 12

def section_modulus_rectangle(b, h):
    return b * h**2 / 6

def von_mises_stress(sigma_x, sigma_y, tau_xy):
    return np.sqrt(sigma_x**2 - sigma_x*sigma_y + sigma_y**2 + 3*tau_xy**2)

def stress_transformation(sigma_x, tau_xy, theta):
    sigma_x_prime = (sigma_x + sigma_y)/2 + (sigma_x - sigma_y)/2 * np.cos(2*theta) + tau_xy * np.sin(2*theta)
    return sigma_x_prime

sigma_x, sigma_y, tau_xy = 100, 50, 25
vm_stress = von_mises_stress(sigma_x, sigma_y, tau_xy)
print(f"von Mises stress: {vm_stress:.2f} MPa")
```

### Heat Transfer

```python
k_copper = 401  # W/m·K
k_steel = 43    # W/m·K
h_air = 10     # W/m²·K

def conduction_resistance(L, k, A):
    return L / (k * A)

def convection_resistance(h, A):
    return 1 / (h * A)

def overall_heat_transfer(U, A):
    return 1 / (1/(h_air*A) + L/(k*A))

def heat_flux(q, A):
    return q / A

def fourier_law(k, dT, dx):
    return -k * dT / dx

def newton_cooling(h, Ts, Tinf):
    return h * (Ts - Tinf)

L, A = 0.01, 0.1  # m, m²
R_cond = conduction_resistance(L, k_steel, A)
R_conv = convection_resistance(h_air, A)
print(f"Total thermal resistance: {R_cond + R_conv:.4f} K/W")
```

### Fluid Mechanics

```python
rho_water = 1000  # kg/m³
mu_water = 0.001  # Pa·s

def reynolds_number(rho, v, D, mu):
    return rho * v * D / mu

def pressure_drop_darcy(ρ, L, v, D, f):
    return f * (L/D) * (ρ * v**2 / 2)

def bernoulli_equation(p1, v1, z1, p2, v2, z2, rho=1000):
    return p1 + 0.5*rho*v1**2 + rho*9.81*z1 - (p2 + 0.5*rho*v2**2 + rho*9.81*z2)

def drag_force(CD, A, rho, v):
    return 0.5 * CD * A * rho * v**2

def pump_power(Q, H, rho=1000, efficiency=0.8):
    return rho * 9.81 * Q * H / efficiency

v, D = 2, 0.05
Re = reynolds_number(rho_water, v, D, mu_water)
print(f"Reynolds number: {Re:.0f}")
print(f"Flow regime: {'laminar' if Re < 2300 else 'turbulent'}")
```

### Vibration Analysis

```python
def natural_frequency(k, m):
    return np.sqrt(k / m) / (2 * np.pi)

def damped_frequency(wn, zeta):
    return wn * np.sqrt(1 - zeta**2)

def magnification_factor(wn, wd, zeta):
    r = wd / wn
    return 1 / np.sqrt((1 - r**2)**2 + (2*zeta*r)**2)

def modal_mass(m, mode_shape):
    return np.sum(m * mode_shape**2)

def response_to_impulse(F0, m, c, k, t):
    wd = damped_frequency(np.sqrt(k/m), c/(2*m*np.sqrt(k*m)))
    zeta = c/(2*np.sqrt(k*m))
    if zeta < 1:
        return (F0/m/wd) * np.exp(-zeta*np.sqrt(k/m)*t) * np.sin(wd*t)

k, m = 10000, 100
fn = natural_frequency(k, m)
print(f"Natural frequency: {fn:.2f} Hz")
```

## Best Practices

1. **Units**: Use consistent units throughout
2. **Safety Factors**: Apply appropriate factors of safety
3. **Material Selection**: Consider strength, cost, manufacturability
4. **Fatigue**: Account for cyclic loading
5. **Failure Modes**: Consider all potential failure modes

## Common Patterns

```python
# Factor of safety
def factor_of_syntax(stress, allowable_stress):
    return allowable_stress / stress

# Kinematic analysis
def velocity_analysis(r1, omega1, r2):
    return r1 * omega1 / r2

# Power transmission
def belt_power_transmission(T1, T2, v):
    return (T1 - T2) * v
```

## Core Competencies

1. Statics and dynamics analysis
2. Stress and strain calculations
3. Heat transfer analysis
4. Fluid mechanics applications
5. Machine design principles
