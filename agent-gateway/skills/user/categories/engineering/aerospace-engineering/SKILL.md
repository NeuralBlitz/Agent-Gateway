---
name: Aerospace Engineering
description: Aerospace engineering fundamentals including aerodynamics, propulsion, flight dynamics, spacecraft dynamics, and structural analysis for aerospace applications.
license: MIT
compatibility: python>=3.8
audience: aerospace-engineers, researchers, students
category: engineering
---

# Aerospace Engineering

## What I Do

I provide comprehensive aerospace engineering tools including aerodynamic analysis, propulsion systems, flight dynamics, orbital mechanics, and aerospace structures for aerospace applications.

## When to Use Me

- Aerodynamic performance analysis
- Propulsion system design
- Aircraft performance calculations
- Orbital trajectory analysis
- Structural analysis
- Stability and control

## Core Concepts

- **Aerodynamics**: Lift, drag, boundary layers
- **Propulsion**: Jet engines, rockets, efficiency
- **Flight Dynamics**: Equations of motion, stability
- **Orbital Mechanics**: Kepler's laws, Hohmann transfers
- **Propulsion**: Thrust, specific impulse, mass flow
- **Aircraft Performance**: Range, endurance, climb
- **Structural Analysis**: Loads, fatigue, aeroelasticity
- **Avionics**: Navigation, control systems

## Code Examples

### Aerodynamics

```python
import numpy as np

def dynamic_pressure(q, rho, V):
    return 0.5 * rho * V**2

def lift_coefficient(CL_alpha, alpha, alpha0):
    return CL_alpha * (alpha - alpha0)

def induced_drag_coefficient(CL, e, AR):
    return CL**2 / (np.pi * e * AR)

def drag_polar(CD0, K, CL):
    return CD0 + K * CL**2

def reynolds_number(rho, V, L, mu):
    return rho * V * L / mu

def mach_number(V, a):
    return V / a

def skin_friction_coefficient(Re, Cf_formula='schlichting'):
    if Cf_formula == 'schlichting':
        return 0.455 / np.log10(Re)**2.58
    return 0.074 / Re**0.2

rho = 1.225  # kg/m³
V = 250     # m/s
L = 5       # m
mu = 1.81e-5  # Pa·s
Re = reynolds_number(rho, V, L, mu)
print(f"Reynolds number: {Re:.2e}")
M = mach_number(V, 343)
print(f"Mach number: {M:.3f}")
```

### Propulsion

```python
def thrust_force(mdot, Ve, pe, pa, A_e):
    return mdot * Ve + (pe - pa) * A_e

def specific_impulse(F, mdot, g0=9.81):
    return F / (mdot * g0)

def thermal_efficiency(eta_carnet, T_t4, T_t2):
    return eta_carnet * (1 - (T_t2 / T_t4)**((gamma-1)/gamma))

def propulsive_efficiency(V, Ve):
    return 2 / (1 + V/Ve)

def overall_efficiency(eta_thermal, eta_propulsive):
    return eta_thermal * eta_propulsive

def rocket_equation(dv, Ve):
    return np.exp(dv / Ve)

def mass_ratio(m0, mf):
    return m0 / mf

def Tsiolkovsky_mdv(m0, mf, Ve):
    return Ve * np.log(m0 / mf)

mdot = 100  # kg/s
Ve = 3000  # m/s
pa = 101325  # Pa
pe = 50000  # Pa
A_e = 1.0   # m²
F = thrust_force(mdot, Ve, pe, pa, A_e)
Isp = specific_impulse(F, mdot)
print(f"Thrust: {F:.0f} N")
print(f"Specific impulse: {Isp:.0f} s")
```

### Flight Dynamics

```python
def lift_force(q, S, CL):
    return q * S * CL

def drag_force(q, S, CD):
    return q * S * CD

def thrust_available(eta_propulsive, P_avail, V):
    return eta_propulsive * P_avail / V

def rate_of_climb(L, D, W):
    return (L - D) * V / W

def minimum_drag_speed(CL_max, rho, S, W):
    return np.sqrt(2 * W / (rho * S * CL_max))

def stall_speed(V_s, sqrt(CL_max_clean / CL_max_landing)):
    return V_s * np.sqrt(CL_max_clean / CL_max_landing)

def turn_rate(V, load_factor, g=9.81):
    return g * np.sqrt(n**2 - 1) / V

def bank_angle(turn_radius, V):
    return np.arctan(V**2 / (turn_radius * g))

W = 50000  # N
V = 150    # m/s
CL, CD = 1.2, 0.05
q = 0.5 * 1.225 * V**2
S = 30     # m²
L = lift_force(q, S, CL)
D = drag_force(q, S, CD)
ROC = rate_of_climb(L, D, W)
print(f"Rate of climb: {ROC:.1f} m/s")
```

### Orbital Mechanics

```python
def orbital_velocity(mu, r):
    return np.sqrt(mu / r)

def orbital_period(T, mu, a):
    return 2 * np.pi * np.sqrt(a**3 / mu)

def vis_viva_equation(v, mu, r1, r2):
    return np.sqrt(mu * (2/r1 - 1/r2))

def hohmann_transfer(r1, r2, mu):
    a_transfer = (r1 + r2) / 2
    dv1 = np.sqrt(mu/r1) * (np.sqrt(2*r2/(r1+r2)) - 1)
    dv2 = np.sqrt(mu/r2) * (1 - np.sqrt(2*r1/(r1+r2)))
    return dv1 + dv2

def escape_velocity(v_esc, mu, r):
    return np.sqrt(2 * mu / r)

def orbital_eccentricity(a, e_vec, h_vec):
    return e_vec / h_vec

def inclination(i, h_z, h):
    return np.arccos(h_z / h)

mu_earth = 3.986e14  # m³/s²
r_earth = 6371e3     # m
V_orb = orbital_velocity(mu_earth, r_earth)
print(f"LEO orbital velocity: {V_orb:.0f} m/s")
V_esc = escape_velocity(V_orb, mu_earth, r_earth)
print(f"Escape velocity: {V_esc:.0f} m/s")
```

### Structural Analysis

```python
def wing_loading(W, S):
    return W / S

def aspect_ratio(b, S):
    return b**2 / S

def taper_ratio(cta, ctr):
    return cta / ctr

def wing_torsion_constant(J, c_max, t_max):
    return (1/3) * c_max**3 * t_max * (1 - 0.63*t_max/c_max)

def flutter_speed(V_f, b, omega_alpha, m_alpha):
    return V_f * b * omega_alpha / (2 * m_alpha)

def gust_load_factor(V_gust, cL_alpha, rho, W_S):
    return 1 + rho * V_gust * cL_alpha / (2 * W_S)

def fatigue_life(N_f, sigma_a, sigma_m):
    return N_f * (sigma_a / sigma_a_ref)**(-1/b)

b = 30      # m
S = 120     # m²
AR = aspect_ratio(b, S)
print(f"Aspect ratio: {AR:.1f}")
```

## Best Practices

1. **Safety Factors**: Apply appropriate factors
2. **Certification**: Follow FAR/CS requirements
3. **Aerodynamic Validation**: Wind tunnel testing
4. **Structural Fatigue**: Consider cyclic loads
5. **Mission Profile**: Define all flight conditions

## Common Patterns

```python
# Aircraft sizing
def preliminary_sizing():
    pass

# CFD integration
def cfd_simulation():
    pass
```

## Core Competencies

1. Aerodynamic analysis
2. Propulsion systems
3. Flight dynamics
4. Orbital mechanics
5. Aerospace structures
