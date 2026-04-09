---
name: aerospace-engineering
description: Aerospace engineering fundamentals including aerodynamics, propulsion, flight dynamics, spacecraft dynamics, and structural analysis
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Analyze aerodynamic forces and moments
- Design aircraft and spacecraft propulsion systems
- Model flight dynamics and stability
- Calculate orbital mechanics and trajectories
- Perform structural analysis for aerospace structures
- Specify materials for aerospace applications
- Analyze loads and fatigue for flight vehicles

## When to use me
When designing aircraft, spacecraft, propulsion systems, or analyzing aerodynamic and structural performance of aerospace vehicles.

## Core Concepts
- Aerodynamics and fluid dynamics
- Propulsion systems (jet, rocket, hybrid)
- Flight dynamics and control
- Orbital mechanics and astrodynamics
- Aerospace structures and materials
- Load factors and fatigue analysis
- Aircraft performance (range, endurance, climb)
- Compressible flow and shock waves
- Stability and control derivatives
- Spacecraft attitude dynamics

## Code Examples

### Aerodynamic Calculations
```python
import math
from dataclasses import dataclass

@dataclass
class Atmosphere:
    altitude: float  # ft
    temperature: float  # Rankine
    pressure: float  # psf
    density: float  # slugs/ft³
    speed_of_sound: float  # ft/s

def standard_atmosphere(altitude: float) -> Atmosphere:
    """Calculate standard atmosphere properties."""
    if altitude < 36000:
        T = 519.67 - 0.00356 * altitude
        P = 2116.2 * (T / 518.67)**5.256
    else:
        T = 389.97
        P = 2116.2 * math.exp(-(altitude - 36000) / 14700)
    rho = P / (1716 * T)
    a = math.sqrt(1.4 * 1716 * T)
    return Atmosphere(altitude, T, P, rho, a)

def lift_coefficient(
    CL: float,
    rho: float,
    V: float,
    S: float
) -> float:
    """Calculate lift force."""
    return 0.5 * rho * V**2 * S * CL

def drag_polar(
    CD0: float,
    e: float,
    AR: float,
    CL: float
) -> float:
    """Calculate drag coefficient using drag polar."""
    return CD0 + CL**2 / (math.pi * e * AR)

def mach_number(
    V: float,
    a: float
) -> float:
    """Calculate Mach number."""
    return V / a

def dynamic_pressure(
    rho: float,
    V: float
) -> float:
    """Calculate dynamic pressure."""
    return 0.5 * rho * V**2

# Example: Aircraft performance at 20000 ft
alt = 20000
atm = standard_atmosphere(alt)
V = 400  # ktas
CL = 0.8
S = 500  # ft²
q = dynamic_pressure(atm.density, V * 1.688)
M = mach_number(V * 1.688, atm.speed_of_sound)
print(f"Density: {atm.density:.6f} slugs/ft³")
print(f"Dynamic pressure: {q:.1f} psf")
print(f"Mach number: {M:.3f}")
```

### Flight Performance
```python
def thrust_available(
    TSL: float,  # sea level thrust
    altitude: float,
    velocity: float
) -> float:
    """Calculate thrust at altitude using Napier's approximation."""
    sigma = standard_atmosphere(altitude).density / 0.002377
    return TSL * sigma * (1 - velocity**2 / 5e10)

def power_available(
    HP: float,  # shaft horsepower
    prop_efficiency: float,
    rho: float
) -> float:
    """Calculate available power."""
    return HP * 550 * prop_efficiency / (rho / 0.002377)

def range_breguet(
    R: float,  # range nm
    V: float,  # true airspeed
    L_D: float,  # lift-to-drag ratio
    TSFC: float,  # thrust specific fuel consumption /hr
    W_start: float,
    W_end: float
) -> float:
    """Calculate fuel required using Breguet range equation."""
    return V * L_D / TSFC * math.log(W_start / W_end)

def stall_speed(
    W: float,  # weight lb
    S: float,  # wing area ft²
    CLmax: float,
    rho: float
) -> float:
    """Calculate stall speed."""
    Vs = math.sqrt(2 * W / (rho * S * CLmax))
    return Vs * 0.5925  # convert to knots

def climb_gradient(
    T_W: float,  # thrust-to-weight ratio
    W_S: float,  # wing loading lb/ft²
    rho: float,
    CLmax: float
) -> float:
    """Calculate maximum climb gradient."""
    return (T_W - W_S * 0.5 * rho * CLmax / (2 * W_S)) / (W_S * 0.5 / (rho * CLmax))

# Example: Aircraft range calculation
W0 = 80000  # lb
Wf = 20000  # lb
range_nm = 3500
L_D = 18
V = 450  # kts
TSFC = 0.5
fuel_required = range_nm * TSFC / (V * L_D) * (W0 - Wf)
print(f"Fuel fraction required: {fuel_required:.4f}")
```

### Rocket Propulsion
```python
def rocket_thrust(
    md: float,  # mass flow rate kg/s
    Ve: float,  # exhaust velocity m/s
    Ae: float,  # exit area m²
    pe: float,  # exit pressure Pa
    pa: float,  # ambient pressure Pa
) -> float:
    """Calculate rocket thrust."""
    return md * Ve + (pe - pa) * Ae

def specific_impulse(
    thrust: float,
    md: float,
    g0: float = 9.81
) -> float:
    """Calculate specific impulse."""
    return thrust / (md * g0)

def mass_ratio(
    m_initial: float,
    m_final: float
) -> float:
    """Calculate mass ratio."""
    return m_initial / m_final

def delta_v_rocket(
    Isp: float,  # seconds
    m_ratio: float,
    g0: float = 9.81
) -> float:
    """Calculate delta-V using rocket equation."""
    return Isp * g0 * math.log(m_ratio)

def nozzle_expansion_ratio(
    pe: float,  # exit pressure Pa
    pc: float,  # chamber pressure Pa
    gamma: float = 1.2
) -> float:
    """Calculate nozzle area expansion ratio."""
    return ((gamma + 1) / 2)**((gamma + 1) / (2 * (gamma - 1))) * math.sqrt(pe / pc)

# Example: Rocket calculation
m_dot = 250  # kg/s
Ve = 3500  # m/s
chamber_pressure = 7e6  # Pa
Isp = 350
m_ratio = 15
dV = delta_v_rocket(Isp, m_ratio)
print(f"Delta-V capability: {dV:.0f} m/s")
```

### Orbital Mechanics
```python
def orbital_velocity(
    mu: float,  # gravitational parameter m³/s²
    r: float  # orbital radius m
) -> float:
    """Calculate circular orbital velocity."""
    return math.sqrt(mu / r)

def orbital_period(
    mu: float,
    a: float  # semi-major axis m
) -> float:
    """Calculate orbital period."""
    return 2 * math.pi * math.sqrt(a**3 / mu)

def hohmann_transfer(
    r1: float,  # initial radius m
    r2: float,  # final radius m
    mu: float
) -> dict:
    """Calculate Hohmann transfer parameters."""
    a_transfer = (r1 + r2) / 2
    dv1 = math.sqrt(mu / r1) * (math.sqrt(2 * r2 / (r1 + r2)) - 1)
    dv2 = math.sqrt(mu / r2) * (1 - math.sqrt(2 * r1 / (r1 + r2)))
    transfer_time = math.pi * math.sqrt(a_transfer**3 / mu)
    return {
        "dv1": dv1,
        "dv2": dv2,
        "total_dv": dv1 + dv2,
        "transfer_time": transfer_time
    }

def escape_velocity(
    mu: float,
    r: float
) -> float:
    """Calculate escape velocity."""
    return math.sqrt(2 * mu / r)

# Example: GEO transfer
r_leo = 6678e3  # m
r_geo = 42164e3  # m
mu_earth = 3.986e14  # m³/s²
transfer = hohmann_transfer(r_leo, r_geo, mu_earth)
print(f"Transfer burn: {transfer['dv1']:.0f} m/s")
print(f"Insertion burn: {transfer['dv2']:.0f} m/s")
print(f"Total delta-V: {transfer['total_dv']:.0f} m/s")
```

## Best Practices
- Use consistent unit systems throughout calculations
- Apply appropriate factors of safety for flight hardware
- Consider environmental factors (temperature, pressure) in performance
- Validate analytical results with CFD and wind tunnel data
- Follow aerospace standards (MIL, NASA, FAA, EASA)
- Account for structural loads in aerodynamic design
- Consider maintainability and inspection requirements
- Use margin on critical performance parameters
- Consider failure modes and safety margins
- Document all assumptions and methods used
