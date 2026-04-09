---
name: mechanical-engineering
description: Mechanical engineering fundamentals including statics, dynamics, machine design, heat transfer, fluid mechanics, and manufacturing processes
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Analyze forces and moments in static and dynamic systems
- Design mechanical components and machine elements
- Calculate thermal loads and heat transfer rates
- Model fluid flow and pressure distributions
- Specify manufacturing processes and materials
- Perform finite element analysis for stress analysis
- Create detailed engineering drawings and specifications

## When to use me
When designing mechanical systems, analyzing structural behavior, calculating thermal performance, or specifying manufacturing requirements for mechanical components.

## Core Concepts
- Statics and equilibrium equations
- Dynamics and vibrational analysis
- Stress-strain relationships and failure criteria
- Heat conduction, convection, and radiation
- Fluid statics and dynamics (Bernoulli, Navier-Stokes)
- Machine elements (gears, bearings, shafts, fasteners)
- Manufacturing processes (CNC, casting, forging, additive manufacturing)
- Finite element analysis basics
- Materials selection and properties
- Thermodynamic cycles and energy conversion

## Code Examples

### Stress Analysis Calculator
```python
import math
from dataclasses import dataclass
from typing import Tuple

@dataclass
class Material:
    name: str
    yield_strength: float  # MPa
    ultimate_strength: float  # MPa
    elastic_modulus: float  # GPa
    poisson_ratio: float

ALUMINUM_6061 = Material(
    name="Aluminum 6061-T6",
    yield_strength=276,
    ultimate_strength=310,
    elastic_modulus=68.9,
    poisson_ratio=0.33
)

def calculate_bending_stress(
    moment: float,
    section_modulus: float
) -> float:
    """Calculate bending stress from bending moment."""
    return moment / section_modulus

def calculate_torsional_shear_stress(
    torque: float,
    polar_moment: float
) -> float:
    """Calculate torsional shear stress."""
    return torque / polar_moment

def combined_stress_analysis(
    normal_stress: float,
    shear_stress: float,
    yield_strength: float,
    factor_of_safety: float = 2.0
) -> Tuple[float, bool]:
    """Analyze combined stress using von Mises criterion."""
    von_mises = math.sqrt(
        normal_stress**2 + 3 * shear_stress**2
    )
    allowable = yield_strength / factor_of_safety
    return von_mises, von_mises <= allowable

# Example: Shaft under combined loading
moment = 500e3  # N-mm
torque = 300e3  # N-mm
section_modulus = 5000  # mm³
polar_moment = 10000  # mm⁴

sigma = calculate_bending_stress(moment, section_modulus)
tau = calculate_torsional_shear_stress(torque, polar_moment)
vm_stress, is_safe = combined_stress_analysis(
    sigma, tau, ALUMINUM_6061.yield_strength
)
print(f"Bending stress: {sigma:.2f} MPa")
print(f"Shear stress: {tau:.2f} MPa")
print(f"Von Mises stress: {vm_stress:.2f} MPa")
print(f"Design safe: {is_safe}")
```

### Heat Transfer Analysis
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ThermalProperties:
    thermal_conductivity: float  # W/(m·K)
    specific_heat: float  # J/(kg·K)
    density: float  # kg/m³

COPPER = ThermalProperties(
    thermal_conductivity=401,
    specific_heat=385,
    density=8960
)

def conduction_heat_transfer(
    k: float,
    A: float,
    dT: float,
    thickness: float
) -> float:
    """Calculate heat transfer through conduction."""
    return k * A * dT / thickness

def convective_heat_transfer(
    h: float,
    A: float,
    T_surface: float,
    T_fluid: float
) -> float:
    """Calculate heat transfer from convection."""
    return h * A * (T_surface - T_fluid)

def thermal_resistance_network(
    R_conv: float,
    R_cond: float
) -> float:
    """Calculate total thermal resistance."""
    return R_conv + R_cond

def heat_sink_design(
    power_dissipation: float,
    T_ambient: float,
    T_junction_max: float,
    R_jc: float,
    R_cs: float
) -> dict:
    """Design heat sink for power dissipation."""
    R_sa_max = (T_junction_max - T_ambient) / power_dissipation - R_jc - R_cs
    return {
        "max_sink_thermal_resistance": R_sa_max,
        "junction_temp_estimate": T_ambient + power_dissipation * (R_jc + R_cs + R_sa_max)
    }

# Example: Electronic heat sink
power = 50  # W
T_amb = 25  # °C
T_junction_max = 125  # °C
R_junction_to_case = 0.5  # °C/W
R_case_to_sink = 0.1  # °C/W

result = heat_sink_design(power, T_amb, T_junction_max, R_junction_to_case, R_case_to_sink)
print(f"Maximum sink resistance: {result['max_sink_thermal_resistance']:.2f} °C/W")
print(f"Estimated junction temperature: {result['junction_temp_estimate']:.1f} °C")
```

### Gear Design Calculations
```python
from dataclasses import dataclass
from typing import Tuple
import math

@dataclass
class GearParameters:
    module: float  # mm
    num_teeth: int
    face_width: float  # mm
    pressure_angle: float  # degrees
    material_strength: float  # MPa

def calculate_pitch_diameter(module: float, num_teeth: int) -> float:
    """Calculate gear pitch diameter."""
    return module * num_teeth

def calculate_center_distance(
    d1: float,
    d2: float
) -> float:
    """Calculate gear center distance."""
    return (d1 + d2) / 2

def lewis_bending_stress(
    Ft: float,
    b: float,
    m: float,
    Y: float
) -> float:
    """Calculate bending stress using Lewis formula."""
    return Ft / (b * m * Y)

def calculate_dynamic_load(
    Ft: float,
    V: float,
    Kv: float = 1.0
) -> float:
    """Calculate dynamic load on gear teeth."""
    return Ft * Kv * (1 + V / 20)

def gear_ratio(driven: int, driver: int) -> float:
    """Calculate gear ratio."""
    return driven / driver

# Example: Spur gear design
driver_teeth = 20
driven_teeth = 40
module = 2.5  # mm
face_width = 20  # mm
transmitted_load = 500  # N
lewis_form_factor = 0.32

pitch_diameter = calculate_pitch_diameter(module, driver_teeth)
ratio = gear_ratio(driven_teeth, driver_teeth)
stress = lewis_bending_stress(transmitted_load, face_width, module, lewis_form_factor)
print(f"Pitch diameter: {pitch_diameter:.2f} mm")
print(f"Gear ratio: {ratio:.2f}")
print(f"Bending stress: {stress:.2f} MPa")
```

### Fluid Flow Calculation
```python
def reynolds_number(
    rho: float,
    V: float,
    L: float,
    mu: float
) -> float:
    """Calculate Reynolds number for flow regime."""
    return rho * V * L / mu

def darcy_weisbach_loss(
    f: float,
    L: float,
    D: float,
    V: float,
    g: float = 9.81
) -> float:
    """Calculate head loss using Darcy-Weisbach equation."""
    return f * (L / D) * (V**2 / (2 * g))

def bernoulli_equation(
    p1: float,
    V1: float,
    z1: float,
    p2: float,
    V2: float,
    z2: float,
    g: float = 9.81,
    rho: float = 1000
) -> float:
    """Apply Bernoulli's equation between two points."""
    return (p1/rho + V1**2/(2*g) + z1) - (p2/rho + V2**2/(2*g) + z2)

def pipe_diameter_flow(
    Q: float,
    V: float
) -> float:
    """Calculate pipe diameter from flow rate and velocity."""
    return (4 * Q / (math.pi * V))**0.5

# Example: Water flow in pipe
flow_rate = 0.01  # m³/s
velocity = 2.0  # m/s
pipe_length = 100  # m
friction_factor = 0.02

diameter = pipe_diameter_flow(flow_rate, velocity)
head_loss = darcy_weisbach_loss(friction_factor, pipe_length, diameter, velocity)
print(f"Required pipe diameter: {diameter*1000:.2f} mm")
print(f"Head loss: {head_loss:.3f} m")
```

### Manufacturing Process Selection
```python
from enum import Enum
from dataclasses import dataclass

class ManufacturingProcess(Enum):
    CNC_MACHINING = "CNC Machining"
    CASTING = "Casting"
    FORGING = "Forging"
    ADDITIVE_MANUFACTURING = "Additive Manufacturing"
    SHEET_METAL = "Sheet Metal Forming"
    INJECTION_MOLDING = "Injection Molding"

@dataclass
class PartRequirements:
    material: str
    quantity: int
    tolerance: float  # mm
    surface_finish: float  # Ra
    complexity: float  # 1-10
    batch_size: str  # prototype, low, medium, high

def select_manufacturing_process(
    requirements: PartRequirements
) -> ManufacturingProcess:
    """Select optimal manufacturing process based on requirements."""
    if requirements.batch_size == "prototype":
        if requirements.complexity > 7:
            return ManufacturingProcess.ADDITIVE_MANUFACTURING
        return ManufacturingProcess.CNC_MACHINING
    elif requirements.batch_size == "low":
        if requirements.tolerance < 0.05:
            return ManufacturingProcess.CNC_MACHINING
        return ManufacturingProcess.CASTING
    elif requirements.batch_size == "medium":
        if requirements.complexity > 5:
            return ManufacturingProcess.INJECTION_MOLDING
        return ManufacturingProcess.CASTING
    else:  # high volume
        if requirements.material in ["aluminum", "plastic"]:
            return ManufacturingProcess.INJECTION_MOLDING
        return ManufacturingProcess.FORGING

# Example: Process selection
part = PartRequirements(
    material="aluminum",
    quantity=10000,
    tolerance=0.1,
    surface_finish=1.6,
    complexity=4,
    batch_size="high"
)
process = select_manufacturing_process(part)
print(f"Recommended process: {process.value}")
```

## Best Practices
- Always apply appropriate factors of safety based on load uncertainty and consequence of failure
- Use standard component sizes and catalog parts where possible to reduce costs
- Perform hand calculations first to validate FEA results before detailed analysis
- Consider manufacturing constraints early in the design process
- Use GD&T on drawings to communicate tolerance requirements clearly
- Document all assumptions and calculations for design review and future maintenance
- Consider thermal expansion effects in precision mechanical assemblies
- Use proper material selection criteria considering strength, weight, cost, and environment
- Perform vibration analysis to avoid resonance conditions in rotating machinery
- Apply corrosion protection methods appropriate for the operating environment
