---
name: mechanical-engineering
description: Mechanical engineering design and analysis
license: MIT
compatibility: opencode
metadata:
  audience: engineers, designers, manufacturers
  category: engineering
---

## What I do

- Design mechanical components and assemblies
- Analyze stress, strain, and deformation
- Select materials for mechanical applications
- Design mechanical systems (hydraulic, pneumatic, thermal)
- Create detailed drawings and specifications

## When to use me

- When designing mechanical components or machines
- When analyzing structural integrity
- When selecting materials for applications
- When designing hydraulic or pneumatic systems
- When creating manufacturing drawings

## Key Concepts

### Statics and Strength of Materials

```python
import numpy as np

# Basic stress calculations
def normal_stress(P, A):
    """σ = P/A"""
    return P / A

def shear_stress(V, A):
    """τ = V/A"""
    return V / A

def bending_stress(M, y, I):
    """σ = My/I"""
    return M * y / I

def torsion_stress(T, r, J):
    """τ = Tr/J"""
    return T * r / J

# Strain calculations
def axial_strain(delta_L, L):
    """ε = ΔL/L"""
    return delta_L / L

def poisson_ratio(epsilon_lat, epsilon_ax):
    """ν = -ε_lat/ε_ax"""
    return -epsilon_lat / epsilon_ax

# Hooke's Law
def youngs_modulus(sigma, epsilon):
    """E = σ/ε"""
    return sigma / epsilon
```

### Material Selection

```python
# Material properties database
MATERIALS = {
    "steel_1040": {
        "E": 200,  # GPa
        "nu": 0.29,
        "yield": 290,  # MPa
        "ultimate": 520,
        "density": 7850  # kg/m³
    },
    "aluminum_6061": {
        "E": 69,
        "nu": 0.33,
        "yield": 275,
        "ultimate": 310,
        "density": 2700
    },
    "titanium": {
        "E": 110,
        "nu": 0.34,
        "yield": 880,
        "ultimate": 950,
        "density": 4500
    }
}

def select_material(stress, safety_factor, requirements):
    """Material selection based on requirements"""
    working_stress = stress * safety_factor
    candidates = []
    
    for name, props in MATERIALS.items():
        if props["yield"] >= working_stress:
            if props["density"] <= requirements.get("max_density", 10000):
                candidates.append(name)
    
    return candidates
```

### Machine Design

```python
# Shaft design
class ShaftDesign:
    @staticmethod
    def torsion_stress(T, d):
        """τ = 16T/(πd³)"""
        return 16 * T / (np.pi * d**3)
    
    @staticmethod
    def combined_stress(M, T, d, E, nu):
        """Using distortion energy theory"""
        bending = 32 * M / (np.pi * d**3)
        torsion = 16 * T / (np.pi * d**3)
        von_mises = np.sqrt(bending**2 + 3 * torsion**2)
        return von_mises
    
    @staticmethod
    def deflection(M, L, E, I):
        """Simply supported beam with point load at center"""
        return M * L**2 / (48 * E * I)
```

### Power Transmission

```python
# Gear design
class GearDesign:
    @staticmethod
    def pitch_diameter(n, p):
        """D = nP or D = N/p"""
        return n / p
    
    @staticmethod
    def gear_ratio(N_large, N_small):
        """GR = N_large/N_small"""
        return N_large / N_small
    
    @staticmethod
    def tangential_velocity(d, n):
        """V = πdn/12 (ft/min)"""
        return np.pi * d * n / 12
    
    @staticmethod
    def gear_tooth_strength(J, V, F, K):
        """Lewis equation modified"""
        return F * Y / (P * K * J)
```

### Fluid Power

```python
# Hydraulic system
class HydraulicSystem:
    @staticmethod
    def cylinder_force(pressure, bore_area):
        """F = pA"""
        return pressure * bore_area
    
    @staticmethod
    def cylinder_speed(flow, area):
        """v = Q/A"""
        return flow / area
    
    @staticmethod
    def pump_power(pressure, flow, efficiency):
        """HP = pQ/1714 × efficiency"""
        return pressure * flow / 1714 / efficiency
```

### Thermal Systems

```python
# Heat transfer
class HeatTransfer:
    @staticmethod
    def conduction(Q, k, A, dT, L):
        """Conduction: Q = kA(dT/L)"""
        return k * A * dT / L
    
    @staticmethod
    def convection(Q, h, A, dT):
        """Convection: Q = hA(dT)"""
        return h * A * dT
    
    @staticmethod
    def radiation(Q, emissivity, A, T_hot, T_cold):
        """Radiation: Q = εσA(T_hot⁴ - T_cold⁴)"""
        sigma = 5.67e-8
        return emissivity * sigma * A * (T_hot**4 - T_cold**4)
    
    @staticmethod
    def overall_heat_transfer(U, A, LMTD):
        """Q = U × A × LMTD"""
        return U * A * LMTD
```

### Common Standards

- **ASME**: Boiler and Pressure Vessel Code
- **ANSI**: American National Standards
- **ISO**: International Standards
- **GD&T**: Geometric Dimensioning and Tolerancing
- **SAE**: Automotive and aerospace standards
