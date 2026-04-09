---
name: electrical-engineering
description: Electrical engineering fundamentals including circuit analysis, power systems, electronics, signal processing, and electromagnetic theory
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Design and analyze electrical circuits
- Calculate power distribution and loads
- Specify electronic components and subsystems
- Analyze electromagnetic fields and interference
- Design digital and analog electronic systems
- Calculate thermal management for power electronics
- Create wiring diagrams and circuit schematics

## When to use me
When designing electronic circuits, calculating power requirements, analyzing signal integrity, or specifying electrical components for systems.

## Core Concepts
- Ohm's law and Kirchhoff's laws
- AC/DC circuit analysis
- Semiconductor devices and circuit design
- Power calculation and distribution
- Electromagnetic field theory
- Signal integrity and EMC/EMI
- Digital logic and embedded systems
- Analog filter design
- Power electronics and motor drives
- Printed circuit board design

## Code Examples

### Circuit Analysis Tools
```python
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple
import cmath

@dataclass
class Component:
    value: float
    unit: str

@dataclass
class Resistor(Component):
    def impedance(self, frequency: float = 0) -> complex:
        return self.value

@dataclass
class Capacitor(Component):
    def impedance(self, frequency: float) -> complex:
        if frequency == 0:
            return complex(float('inf'))
        return -1j / (2 * np.pi * frequency * self.value)

@dataclass
class Inductor(Component):
    def impedance(self, frequency: float) -> complex:
        if frequency == 0:
            return 0
        return 1j * 2 * np.pi * frequency * self.value

def nodal_analysis(
    conductances: np.ndarray,
    current_sources: np.ndarray
) -> np.ndarray:
    """Solve nodal analysis using modified nodal analysis."""
    return np.linalg.solve(conductances, current_sources)

def thevenin_equivalent(
    V_th: float,
    R_th: float,
    R_load: float
) -> Tuple[float, float, float]:
    """Calculate Thevenin equivalent circuit parameters."""
    V_load = V_th * R_load / (R_th + R_load)
    P_load = V_load**2 / R_load
    return V_load, P_load, V_load / R_load

def power_factor_correction(
    apparent_power: float,
    current_power_factor: float,
    target_power_factor: float
) -> Tuple[float, float]:
    """Calculate required capacitor for power factor correction."""
    theta1 = np.arccos(current_power_factor)
    theta2 = np.arccos(target_power_factor)
    Q1 = apparent_power * np.sin(theta1)
    Q2 = apparent_power * np.sin(theta2)
    Qc = Q1 - Q2
    return Qc, Qc / (2 * np.pi * 60)

# Example: Power factor correction
S = 100e3  # VA
pf_current = 0.8
pf_target = 0.95
Qc, C = power_factor_correction(S, pf_current, pf_target)
print(f"Required reactive power compensation: {Qc/1000:.1f} kVAR")
print(f"Required capacitance: {C*1e6:.1f} µF")
```

### Semiconductor Calculations
```python
from dataclasses import dataclass

@dataclass
class MOSFETParameters:
    Vds_max: float  # V
    Id_max: float  # A
    Rds_on: float  # ohms
    Vgs_th: float  # V
    Qg: float  # nC
    trr: float  # ns

@dataclass
class DiodeParameters:
    Vr_max: float  # V
    If_max: float  # A
    Vf: float  # V
    trr: float  # ns
    Ir: float  # µA

def mosfet_conduction_loss(
    Id: float,
    Rds_on: float,
    D: float
) -> float:
    """Calculate MOSFET conduction loss."""
    return Id**2 * Rds_on * D

def mosfet_switching_loss(
    Vds: float,
    Ids: float,
    tr: float,
    tf: float,
    fs: float
) -> float:
    """Calculate MOSFET switching loss."""
    return 0.5 * Vds * Ids * (tr + tf) * fs

def diode_reverse_recovery_loss(
    Irr: float,
    trr: float,
    Vr: float,
    fs: float
) -> float:
    """Calculate diode reverse recovery loss."""
    return 0.5 * Vr * Irr * trr * fs

def calculate_ripple_current(
    Vin: float,
    Vout: float,
    L: float,
    fs: float,
    D: float
) -> float:
    """Calculate inductor ripple current for buck converter."""
    return (Vin - Vout) * D / (L * fs)

def buck_converter_design(
    Vin: float,
    Vout: float,
    Io: float,
    fs: float,
    ripple_percent: float = 0.3
) -> dict:
    """Design basic buck converter parameters."""
    D = Vout / Vin
    Iripple_max = Io * ripple_percent
    L = (Vin - Vout) * D / (Iripple_max * fs)
    Ic = Iripple_max / 2
    return {
        "duty_cycle": D,
        "inductance_mH": L * 1000,
        "ripple_current": Iripple_max,
        "capacitor_ripple": Ic
    }

# Example: Buck converter
design = buck_converter_design(12, 5, 2, 100e3)
print(f"Duty cycle: {design['duty_cycle']:.3f}")
print(f"Required inductance: {design['inductance_mH']:.2f} mH")
print(f"Ripple current: {design['ripple_current']:.3f} A")
```

### PCB Design Calculations
```python
def trace_current_capacity(
    width: float,  # mils
    thickness: float,  # oz/ft²
    temp_rise: float  # °C
) -> float:
    """Calculate PCB trace current carrying capacity using IPC-2221."""
    if temp_rise <= 10:
        return 0.048 * width**0.44 * thickness**0.725
    else:
        return 0.024 * width**0.44 * thickness**0.725 * (temp_rise / 10)**0.44

def microstrip_impedance(
    w: float,  # mm
    h: float,  # mm
    Er: float  # dielectric constant
) -> float:
    """Calculate microstrip trace impedance."""
    if w / h <= 1:
        return (87 / (Er + 1.41)**0.5) * np.log(5.98 * h / (0.8 * w + t))
    else:
        return (87 / (Er + 1.41)**0.5) * np.log(5.98 * h / (0.8 * w + t))

def via_inductance(
    length: float,  # mm
    diameter: float  # mm
) -> float:
    """Estimate via inductance."""
    return 0.2 * length * np.log(4 * length / diameter)

def decoupling_capacitor_selection(
    Cload: float,
    Vsupply: float,
    allowed_ripple: float,
    target_impedance: float,
    frequency: float
) -> float:
    """Calculate required decoupling capacitance."""
    C = Cload * allowed_ripple / Vsupply
    Z = 1 / (2 * np.pi * frequency * C)
    return max(C, Vsupply / (target_impedance * 2 * np.pi * frequency * Vsupply))

# Example: PCB trace sizing
trace_width = 50  # mils
copper_thickness = 1  # oz
temp_rise = 20  # °C
current = trace_current_capacity(trace_width, copper_thickness, temp_rise)
print(f"Current capacity: {current:.2f} A")
```

### Power System Calculations
```python
def three_phase_power(
    Vll: float,  # line-to-line voltage
    I: float,
    pf: float
) -> float:
    """Calculate three-phase power."""
    return np.sqrt(3) * Vll * I * pf

def short_circuit_current(
    S_sc: float,  # MVA
    V: float,  # kV
    Z_percent: float
) -> float:
    """Calculate short-circuit current."""
    return (S_sc * 1000) / (np.sqrt(3) * V * Z_percent / 100)

def voltage_drop_calculation(
    I: float,
    R: float,
    X: float,
    pf: float
) -> float:
    """Calculate voltage drop in percent."""
    return I * (R * pf + X * np.sin(np.arccos(pf))) / 10

def cable_sizing_current(
    I_load: float,
    derating_factor: float = 0.8,
    correction_factor: float = 1.0
) -> float:
    """Calculate required cable ampacity."""
    return I_load / (derating_factor * correction_factor)

def transformer_sizing(
    S_kVA: float,
    efficiency: float = 0.97,
    load_factor: float = 0.8
) -> float:
    """Calculate transformer kVA rating."""
    return S_kVA / (efficiency * load_factor)

# Example: Power distribution
load_current = 150  # A
voltage = 480  # V
pf = 0.85
power = three_phase_power(voltage, load_current, pf)
print(f"Three-phase power: {power/1000:.1f} kW")
```

## Best Practices
- Use proper grounding techniques to minimize noise and ensure safety
- Include appropriate margins in component ratings for reliability
- Perform thermal analysis for power electronic components
- Consider EMI/EMC requirements early in the design process
- Use decoupling capacitors near IC power pins for noise suppression
- Follow IPC standards for PCB design and manufacturing
- Calculate worst-case conditions including temperature extremes
- Include proper fusing and overcurrent protection in designs
- Use appropriate wire gauges based on current carrying requirements
- Document schematics with clear component values and tolerances
