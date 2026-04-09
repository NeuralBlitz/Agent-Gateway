---
name: civil-engineering
description: Civil engineering fundamentals including structural analysis, geotechnics, hydraulics, transportation, and construction management
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Analyze structural systems and load paths
- Design foundations and earth retention systems
- Calculate hydraulic and drainage requirements
- Design transportation infrastructure
- Specify construction materials and methods
- Perform geotechnical site investigations
- Create construction documents and specifications

## When to use me
When designing building structures, foundations, drainage systems, roadways, or any civil infrastructure project requiring structural analysis.

## Core Concepts
- Structural analysis and load combinations
- Foundation design (shallow and deep)
- Concrete and steel design
- Geotechnical engineering principles
- Hydrology and hydraulic design
- Transportation engineering
- Construction materials and methods
- Building codes and regulations
- Site development and grading
- Environmental considerations

## Code Examples

### Structural Load Calculations
```python
from dataclasses import dataclass
from typing import List
import math

@dataclass
class Load:
    name: str
    magnitude: float  # kips or ksf
    load_type: str  # dead, live, snow, wind, seismic

def asce7_load_combinations(loads: List[Load]) -> List[float]:
    """Generate ASCE 7 load combinations."""
    dead = sum(l.magnitude for l in loads if l.load_type == "dead")
    live = sum(l.magnitude for l in loads if l.load_type == "live")
    snow = sum(l.magnitude for l in loads if l.load_type == "snow")
    wind = sum(l.magnitude for l in loads if l.load_type == "wind")
    seismic = sum(l.magnitude for l in loads if l.load_type == "seismic")
    
    combinations = []
    combinations.append(1.4 * dead)
    combinations.append(1.2 * dead + 1.6 * live)
    combinations.append(1.2 * dead + 0.5 * snow + 1.6 * live)
    combinations.append(1.2 * dead + 1.6 * snow)
    combinations.append(0.9 * dead + 1.0 * wind)
    combinations.append(1.2 * dead + 1.0 * seismic + live)
    return combinations

def tributary_area_load(
    total_load: float,
    tributary_width: float,
    member_spacing: float
) -> float:
    """Calculate tributary area for distributed loads."""
    return total_load * tributary_width * member_spacing / 1000

def calculate_rebar_area(
    fc: float,  # psi
    fy: float,  # psi
    Mu: float,  # in-kips
    b: float,  # in
    d: float,  # in
    phi: float = 0.9
) -> float:
    """Calculate required reinforcement area (simplified)."""
    Rn = Mu * 1000 / (phi * b * d**2)
    if Rn > 0.18 * fc:
        Rn = 0.18 * fc
    rho = 0.85 * fc / fy * (1 - math.sqrt(1 - 2 * Rn / (0.85 * fc)))
    return rho * b * d

# Example: Load combination
loads = [
    Load("D", 100, "dead"),
    Load("L", 40, "live"),
    Load("S", 20, "snow")
]
combinations = asce7_load_combinations(loads)
max_load = max(combinations)
print(f"Maximum factored load: {max_load:.1f} kips")

# Rebar calculation
required_rebar = calculate_rebar_area(4000, 60000, 250, 12, 22)
print(f"Required rebar area: {required_rebar:.2f} in²")
```

### Foundation Design
```python
@dataclass
class SoilProperties:
    gamma: float  # pcf
    phi: float  # degrees
    c: float  # psf
    q_allowable: float  # psf

def allowable_bearing_capacity(
    soil: SoilProperties,
    B: float,  # ft
    Df: float,  # ft
    FS: float = 3.0
) -> float:
    """Calculate allowable bearing capacity (Terzaghi)."""
    Nq = math.exp(math.pi * math.tan(math.radians(soil.phi))) * math.tan(math.radians(45 + soil.phi/2))**2
    Nc = (Nq - 1) / math.tan(math.radians(soil.phi))
    Ngamma = 2 * (Nq + 1) * math.tan(math.radians(soil.phi))
    
    qu = soil.c * Nc + soil.gamma * Df * Nq + 0.5 * soil.gamma * B * Ngamma
    return qu / FS

def settlement_calculation(
    P: float,  # kips
    B: float,  # ft
    L: float,  # ft
    H: float,  # ft
    mv: float  # 1/ksf
) -> float:
    """Calculate immediate settlement."""
    return P * H * mv / (B * L)

def mat_foundation_design(
    P_total: float,  # kips
    q_allow: float,  # ksf
    column_spacing: float  # ft
) -> dict:
    """Size mat foundation."""
    required_area = P_total / q_allow
    dimension = math.sqrt(required_area)
    return {
        "mat_area": required_area,
        "recommended_dimensions": f"{dimension:.1f}' x {dimension:.1f}'",
        "thickness_estimate": dimension / 10
    }

# Example: Shallow foundation
soil = SoilProperties(gamma=120, phi=30, c=0, q_allowable=3000)
bearing = allowable_bearing_capacity(soil, 6, 2)
print(f"Allowable bearing capacity: {bearing:.0f} psf")
```

### Hydrology Calculations
```python
def rational_method(
    C: float,  # runoff coefficient
    i: float,  # in/hr
    A: float  # acres
) -> float:
    """Calculate peak runoff using Rational Method."""
    return C * i * A

def scs_curve_number(
    CN: float,
    Ia: float = 0.2  # initial abstraction
) -> dict:
    """Calculate SCS Curve Number parameters."""
    S = 1000 / CN - 10
    Ia_pct = Ia / S
    return {
        "storage": S,
        "abstraction_ratio": Ia_pct
    }

def time_of_concentration(
    L: float,  # ft
        S: float,  # ft/ft
        n: float,  # Manning's n
    ) -> float:
    """Calculate Tc using Kirpich equation."""
    return 0.0195 * L**0.77 * S**-0.385

def storm_drain_design(
    Q: float,  # cfs
    A: float,  # ft²
    n: float,  # Manning's n
    S: float,  # ft/ft
) -> dict:
    """Design storm drain using Manning's equation."""
    V = Q / A
    D = ((Q * n) / (0.463 * S**0.5))**0.375 * 12
    return {
        "velocity": V,
        "diameter_inches": D,
        "flow_status": "supercritical" if V > 12 else "subcritical"
    }

# Example: Storm drain
Q = 25  # cfs
A = 10  # ft²
n = 0.013
S = 0.01
result = storm_drain_design(Q, A, n, S)
print(f"Pipe diameter: {result['diameter_inches']:.1f} inches")
print(f"Flow velocity: {result['velocity']:.1f} ft/s")
```

### Concrete Mix Design
```python
def aci_concrete_mix(
    fck: float,  # psi
    slump: float,  # in
    max_aggregate: float,  # in
    CA_ratio: float  # coarse to fine aggregate ratio
) -> dict:
    """ACI 211.1 concrete mix design."""
    water = 300 + slump * 10  # lb/yd³
    if fck > 4000:
        water -= (fck - 4000) / 200 * 5
    air = 1.5 if max_aggregate < 1.5 else 1.0
    wcmax = 0.45 if fck > 5000 else 0.50
    
    cement = water / wcmax
    coarse_aggregate = 0.65 * 165 * 62.4 / (1 + CA_ratio * 2.65)
    fine_aggregate = 165 - water/62.4 - cement/94 - coarse_aggregate/62.4
    
    return {
        "cement_lb": cement,
        "water_lb": water,
        "coarse_aggregate_lb": coarse_aggregate,
        "fine_aggregate_lb": fine_aggregate,
        "air_content_pct": air,
        "w_c_ratio": water / cement
    }

def reinforced_concrete_column(
    P: float,  # kips
    fc: float,  # psi
    fy: float,  # psi
    Ag: float  # in²
) -> dict:
    """ACI interaction diagram approximation."""
    Pn_max = 0.8 * (0.85 * fc * (Ag - Ast) + fy * Ast)
    return {
        "max_axial_capacity_kips": Pn_max * 0.65,
        "interaction_ratio": P / (Pn_max * 0.65)
    }

# Example: 4000 psi concrete mix
mix = aci_concrete_mix(4000, 4, 1.0, 1.2)
print(f"Cement: {mix['cement_lb']:.0f} lb/yd³")
print(f"Water: {mix['water_lb']:.0f} lb/yd³")
print(f"W/C ratio: {mix['w_c_ratio']:.2f}")
```

## Best Practices
- Always apply appropriate factors of safety based on consequence of failure
- Follow applicable building codes (IBC, ASCE 7, ACI, AISC)
- Perform site investigations before final foundation design
- Consider constructability in all design decisions
- Use load combinations from latest code editions
- Account for settlement in foundation design
- Design for durability including freeze-thaw exposure
- Consider environmental impact and sustainability
- Document all assumptions and design criteria
- Perform peer review for critical structural elements
