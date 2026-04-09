---
name: chemical-engineering
description: Chemical engineering fundamentals including reaction engineering, separation processes, thermodynamics, process control, and plant design
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Design chemical reactors and reaction systems
- Calculate mass and energy balances
- Design separation processes and equipment
- Model thermodynamic properties and phase equilibria
- Specify process equipment and piping
- Design process control systems
- Optimize chemical processes for efficiency

## When to use me
When designing chemical processes, reactors, separation systems, or any process involving chemical transformations and separations.

## Core Concepts
- Mass and energy balances
- Chemical reaction kinetics and reactor design
- Thermodynamics and phase equilibria
- Heat and mass transfer
- Separation processes (distillation, absorption, extraction)
- Process control and instrumentation
- Process safety and hazard analysis
- Equipment sizing and selection
- Process economics and optimization
- Transport phenomena

## Code Examples

### Mass and Energy Balances
```python
from dataclasses import dataclass
from typing import List, Tuple
import numpy as np

@dataclass
class Stream:
    name: str
    mass_flow: float  # kg/hr
    component: str
    mass_fraction: float

def mass_balance(
    inlet_streams: List[Stream],
    outlet_streams: List[Stream]
) -> Tuple[float, float]:
    """Calculate total inlet/outlet and component balances."""
    m_in = sum(s.mass_flow for s in inlet_streams)
    m_out = sum(s.mass_flow for s in outlet_streams)
    return m_in, m_out

def component_balance(
    streams: List[Stream],
    component: str
) -> Tuple[float, float]:
    """Calculate component mass flow."""
    inlet = sum(s.mass_flow * s.mass_fraction 
                for s in streams if "inlet" in s.name.lower())
    outlet = sum(s.mass_flow * s.mass_fraction 
                 for s in streams if "outlet" in s.name.lower())
    return inlet, outlet

def combustion_air_requirement(
    fuel_carbon: float,  # kg C/kg fuel
    fuel_hydrogen: float,  # kg H/kg fuel
    fuel_sulfur: float,  # kg S/kg fuel
    excess_air: float = 0.15  # 15% excess
) -> dict:
    """Calculate combustion air requirements."""
    O2_stoich = 2.67 * fuel_carbon + 8 * fuel_hydrogen + fuel_sulfur
    O2_actual = O2_stoich * (1 + excess_air)
    air_required = O2_actual / 0.233
    return {
        "stoich_air_kg": O2_stoich / 0.233,
        "actual_air_kg": air_required,
        "flue_gas_kg": air_required + 1 - fuel_carbon - fuel_hydrogen - fuel_sulfur
    }

# Example: Combustion calculation
fuel = {"C": 0.85, "H": 0.10, "S": 0.02, "O": 0.03}
air = combustion_air_requirement(fuel["C"], fuel["H"], fuel["S"], 0.10)
print(f"Stoichiometric air: {air['stoich_air_kg']:.2f} kg air/kg fuel")
print(f"Actual air required: {air['actual_air_kg']:.2f} kg air/kg fuel")
```

### Reactor Design
```python
@dataclass
class Reaction:
    A: float  # pre-exponential factor
    Ea: float  # activation energy J/mol
    dH: float  # heat of reaction J/mol
    order: float

def arrhenius_rate(
    T: float,  # K
    A: float,
    Ea: float,
    R: float = 8.314
) -> float:
    """Calculate rate constant using Arrhenius equation."""
    return A * np.exp(-Ea / (R * T))

def cstr_design(
    Fa_in: float,  # mol/hr
    X: float,  # conversion
    rA: float  # mol/hr/m³
) -> float:
    """Calculate CSTR volume."""
    Fa_out = Fa_in * (1 - X)
    Fa_avg = (Fa_in + Fa_out) / 2
    return Fa_in * X / rA

def pfr_design(
    Fa_in: float,
    X1: float,
    X2: float,
    k: float,
    order: int
) -> float:
    """Calculate PFR volume using numerical integration."""
    from scipy.integrate import quad
    
    if order == 1:
        def integrand(X):
            return 1 / (k * (1 - X))
    else:
        def integrand(X):
            return 1 / (k * (1 - X)**order)
    
    V, _ = quad(integrand, X1, X2)
    return Fa_in * V

def adiabatic_reactor_temperature(
    T_in: float,
    X: float,
    dH: float,
    Cp_avg: float,
    MW_avg: float
) -> float:
    """Calculate outlet temperature for adiabatic reactor."""
    return T_in - X * dH * MW_avg / Cp_avg

# Example: CSTR design
Fa_in = 1000  # mol/hr
X = 0.85
T = 400  # K
reaction = Reaction(A=1e6, Ea=50000, dH=-100000, order=1)
k = arrhenius_rate(T, reaction.A, reaction.Ea)
V = cstr_design(Fa_in, X, k * (1 - X) * 1000)
print(f"Rate constant at 400K: {k:.6f} s⁻¹")
print(f"Required CSTR volume: {V:.2f} m³")
```

### Distillation Design
```python
def mccabe_thiele_stages(
    xD: float,  # distillate purity
    xB: float,  # bottoms purity
    xF: float,  # feed composition
    q: float,  # feed thermal condition
    alpha: float,  # relative volatility
    reflux_ratio: float
) -> dict:
    """McCabe-Thiele stage calculation."""
    R = reflux_ratio
    R_min = (xD - yF) / (yF - xF) if alpha > 1 else float('inf')
    yF = alpha * xF / (1 + (alpha - 1) * xF)
    N_min = np.log((xD / (1 - xD)) * ((1 - xB) / xB)) / np.log(alpha)
    stages = N_min * (R / (R - R_min + 0.01)) if R > R_min else 1
    return {
        "minimum_reflux_ratio": R_min,
        "minimum_stages": N_min,
        "actual_stages": int(stages)
    }

def heat_reboiler_duty(
    L: float,  # kmol/hr
    lambda_v: float,  # kJ/kmol
) -> float:
    """Calculate reboiler heat duty."""
    return L * lambda_v

def diameter_column(
    V: float,  # m³/hr
    rho_v: float,  # kg/m³
    rho_l: float,  # kg/m³
    F_factor: float = 1.0
) -> float:
    """Estimate column diameter using flooding velocity."""
    V_surf = V / 3600 / (np.pi / 4)
    D = np.sqrt(4 * V_surf / (F_factor * np.sqrt(rho_v / (rho_l - rho_v))))
    return D

# Example: Distillation column
column = mccable_thiele_stages(
    xD=0.95, xB=0.05, xF=0.50, q=1.0, alpha=2.5, reflux_ratio=1.5
)
print(f"Minimum reflux: {column['minimum_reflux_ratio']:.3f}")
print(f"Required stages: {column['actual_stages']}")
```

### Heat Exchanger Design
```python
def lmtd(
    Th_in: float,  # °C
    Th_out: float,  # °C
    Tc_in: float,  # °C
    Tc_out: float  # °C
) -> float:
    """Calculate log mean temperature difference."""
    dT1 = Th_in - Tc_out
    dT2 = Th_out - Tc_in
    if abs(dT1 - dT2) < 0.01:
        return (dT1 + dT2) / 2
    return (dT1 - dT2) / np.log(dT1 / dT2)

def heat_exchanger_area(
    Q: float,  # W
    U: float,  # W/m²K
    lmtd: float
) -> float:
    """Calculate heat exchanger area."""
    return Q / (U * lmtd)

def overall_heat_transfer(
    hi: float,
    ho: float,
    k: float,
    t: float,
    fouling: float = 0.0001
) -> float:
    """Calculate overall U value."""
    return 1 / (1/hi + fouling + t/k + fouling + 1/ho)

def shell_and_tube_pressure_drop(
    N: int,  # number of tube passes
    L: float,  # m
    V: float,  # m/s
    rho: float,  # kg/m³
    f: float = 0.02
) -> float:
    """Estimate pressure drop in shell and tube exchanger."""
    return 4 * f * (L / 0.0254) * (N * V**2 / (2 * rho))

# Example: Heat exchanger
Q = 500e3  # W
U = 500  # W/m²K
LMTD = lmtd(120, 80, 30, 60)
A = heat_exchanger_area(Q, U, LMTD)
print(f"LMTD: {LMTD:.1f} °C")
print(f"Required area: {A:.1f} m²")
```

### Process Safety Calculations
```python
def relief_valve_sizing(
    P_set: float,  # psig
    P_atm: float,  # psig
    A_required: float,  # in²
    Kb: float = 1.0,
    Kd: float = 0.975,
    Kv: float = 1.0
) -> float:
    """Calculate relief valve orifice area (API 520)."""
    A = (m * Kb) / (C * Kd * Kv * P_set) if P_set > P_atm else A_required
    return A

def toxicity_limit(
    LC50: float,  # ppm
    exposure_time: float,  # hours
    LCLo: float = LC50
) -> float:
    """Calculate acceptable exposure limit (AEL)."""
    return LC50 * (8 / exposure_time)**0.5

def flammable_limit(
    LFL: float,  # % volume
    UFL: float,  # % volume
    concentration: float
) -> str:
    """Check if mixture is flammable."""
    if LFL <= concentration <= UFL:
        return "FLAMMABLE"
    elif concentration < LFL:
        return "TOO LEAN"
    return "TOO RICH"

def tnt_equivalence(
    mass: float,  # kg
    efficiency: float = 0.05
) -> float:
    """Calculate TNT equivalent for explosion."""
    return mass * efficiency * 4.184e6 / 4.184e6

# Example: Flammability check
mixture = flammable_limit(LFL=1.0, UFL=10.0, concentration=5.0)
print(f"Flammability status: {mixture}")
```

## Best Practices
- Always include safety factors in equipment sizing
- Perform HAZOP analysis for new process designs
- Consider environmental regulations in plant design
- Use simulation software (Aspen, HYSYS) for complex calculations
- Account for worst-case scenarios in relief system design
- Consider operability and maintainability in equipment layout
- Document all design basis and assumptions
- Use standard equipment sizes to reduce costs
- Consider energy integration and pinch analysis
- Validate calculations with hand calculations and simulations
