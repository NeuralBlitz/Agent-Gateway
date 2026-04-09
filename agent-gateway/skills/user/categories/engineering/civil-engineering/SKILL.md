---
name: Civil Engineering
description: Civil engineering fundamentals including structural analysis, geotechnics, hydraulics, transportation, and construction management for infrastructure applications.
license: MIT
compatibility: python>=3.8
audience: civil-engineers, construction-engineers, researchers, students
category: engineering
---

# Civil Engineering

## What I Do

I provide comprehensive civil engineering tools including structural analysis, geotechnical calculations, hydraulics, transportation engineering, and construction management for infrastructure applications.

## When to Use Me

- Structural analysis and design
- Foundation design
- Hydrological calculations
- Transportation planning
- Construction scheduling
- Building codes compliance

## Core Concepts

- **Structural Analysis**: Trusses, beams, frames
- **Geotechnics**: Soil mechanics, foundations
- **Hydraulics**: Open channel, pipe flow
- **Transportation**: Traffic flow, pavement design
- **Construction**: Critical path, cost estimation
- **Materials**: Concrete, steel, composites
- **Wind Engineering**: Loads, aerodynamics
- **Seismic Design**: Response spectra, base isolation

## Code Examples

### Structural Analysis

```python
import numpy as np

def shear_force(V, a, L, w):
    return V - w * a

def bending_moment(M, V, a, L, w):
    return M + V * a - w * a**2 / 2

def deflection_beam(w, L, E, I):
    x = np.linspace(0, L, 100)
    y = (w * x**2 / (24 * E * I)) * (L**2 - 2 * L * x + x**2)
    return x, y

def influence_line_moment(span_length, position):
    a = position
    b = span_length - position
    return a * b / span_length

def moment_distribution(method, stiffness, distribution_factors):
    pass

E_steel = 200e9  # Pa
I_beam = 1e-4    # m^4
L = 5           # m
w = 10e3        # N/m
x, y = deflection_beam(w, L, E_steel, I_beam)
print(f"Max deflection: {max(y):.6f} m")
```

### Geotechnical Engineering

```python
def effective_stress(total_stress, pore_pressure):
    return total_stress - pore_pressure

def bearing_capacity_qu(c, gamma, Df, B, phi):
    Nc = (np.exp(np.pi * np.tan(np.radians(phi))) * np.tan(np.radians(45 + phi/2))**2 - 1) / (np.tan(np.radians(phi)))
    Nq = np.exp(np.pi * np.tan(np.radians(phi))) * np.tan(np.radians(45 + phi/2))**2
    Ngamma = 2 * (Nc + 1) * np.tan(np.radians(phi))
    
    qu = c * Nc + gamma * Df * Nq + 0.5 * gamma * B * Ngamma
    return qu

def settlement_compressible(S, mv, delta_p, B):
    return S = mv * delta_p * B

def consolidation_time_factor(Tv, H_drain):
    return Tv * H_drain**2 / cv

def slope_stability_fs(c, phi, gamma, H, beta):
    Ns = (2 * c) / (gamma * H * np.sin(beta) * np.cos(np.radians(phi)))
    return Ns / np.tan(np.radians(45 + phi/2))

c = 20e3  # Pa
phi = 30  # degrees
gamma = 18e3  # N/m³
B = 2     # m
qu = bearing_capacity_qu(c, gamma, 0, B, phi)
print(f"Bearing capacity: {qu/1000:.2f} kPa")
```

### Hydraulics

```python
def mannings_velocity(n, R, S):
    return (1/n) * R**(2/3) * S**0.5

def hydraulic_radius(A, P):
    return A / P

def critical_depth(q, g=9.81):
    return (q**2 / g)**(1/3)

def specific_energy(y, alpha, q, g=9.81):
    return y + alpha * q**2 / (2 * g * y**2)

def darcy_weisbach(f, L, D, V, g=9.81):
    return f * (L/D) * (V**2 / (2*g))

n = 0.013  # Manning's n for concrete
R = 0.5    # m
S = 0.001  # slope
V = mannings_velocity(n, R, S)
print(f"Flow velocity: {V:.2f} m/s")

Q = 5      # m³/s per m width
yc = critical_depth(Q)
print(f"Critical depth: {yc:.3f} m")
```

### Transportation Engineering

```python
def stopping_sight_distance(V, f, G, t_reaction=2.5, g=9.81):
    d_perception = V * t_reaction
    d_braking = V**2 / (2 * g * (f + G/100))
    return d_perception + d_braking

def level_of_service(v_c, v_free, k, c):
    return v_c / v_free

def pavement_layer_thickness(ESAL, SN, layer_coefficients):
    D1 = ESAL * layer_coefficients['a1'] / SN
    D2 = ESAL * layer_coefficients['a2'] / SN
    return D1, D2

def traffic_signal_timing(cycle_length, green_ratio):
    green_time = cycle_length * green_ratio
    yellow_time = 3
    all_red = 2
    return {'green': green_time, 'yellow': yellow_time, 'all_red': all_red}

V = 100  # km/h
f = 0.35  # friction factor
G = 2    # percent grade
SSD = stopping_sight_distance(V/3.6, f, G)
print(f"Stopping sight distance: {SSD:.2f} m")
```

### Construction Management

```python
def critical_path_method(activities, precedence):
    pass

def cost_time_tradeoff(normal_cost, crash_cost, normal_time, crash_time):
    slope = (crash_cost - normal_cost) / (normal_time - crash_time)
    return slope

def earned_value_management(BAC, PV, EV, AC):
    CV = EV - AC
    SV = EV - PV
    CPI = EV / AC
    SPI = EV / PV
    EAC = BAC / CPI
    ETC = EAC - AC
    
    return {
        'CV': CV, 'SV': SV,
        'CPI': CPI, 'SPI': SPI,
        'EAC': EAC, 'ETC': ETC
    }

def concrete_cylinder_strength(fc_prime, age, k1=0.79, age_ref=28):
    return fc_prime * (age / (k1 + (1-k1) * age/age_ref))**0.5

BAC, PV, EV, AC = 1000000, 250000, 200000, 275000
evm = earned_value_management(BAC, PV, EV, AC)
print(f"CPI: {evm['CPI']:.2f}")
print(f"SPI: {evm['SPI']:.2f}")
```

## Best Practices

1. **Safety Factors**: Apply appropriate factors of safety
2. **Building Codes**: Follow local codes and standards
3. **Material Properties**: Use appropriate material properties
4. **Load Combinations**: Consider all load cases
5. **Site Conditions**: Account for actual site conditions

## Common Patterns

```python
# Concrete mix design
def concrete_mix_design(fc, max_aggregate, slump):
    pass
```

## Core Competencies

1. Structural analysis and design
2. Geotechnical engineering
3. Hydraulics and hydrology
4. Transportation engineering
5. Construction management
