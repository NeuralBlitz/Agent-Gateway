---
name: civil-engineering
description: Civil engineering design and construction
license: MIT
compatibility: opencode
metadata:
  audience: engineers, architects, construction professionals
  category: engineering
---

## What I do

- Design structural systems for buildings and infrastructure
- Perform geotechnical analysis and foundation design
- Plan and design transportation systems
- Design water resources and hydraulic systems
- Manage construction projects and specifications

## When to use me

- When designing buildings, bridges, or infrastructure
- When analyzing soil and foundation conditions
- When planning roads, railways, or airports
- When designing water supply or drainage systems
- When preparing construction documents and specifications

## Key Concepts

### Structural Analysis

```python
# Basic structural analysis
class StructuralAnalysis:
    def beam_stress(self, M, y, I):
        """Bending stress"""
        return M * y / I
    
    def beam_deflection(self, P, L, E, I):
        """Simply supported beam, point load at center"""
        return P * L**3 / (48 * E * I)
    
    def column_buckling(self, L, E, I):
        """Euler buckling load"""
        # P_cr = π²EI/L²
        return (np.pi**2 * E * I) / L**2
    
    def shear_stress(self, V, Q, I, t):
        """Shear stress in beams"""
        return V * Q / (I * t)
```

### Load Types

| Load Type | Symbol | Description |
|-----------|--------|-------------|
| Dead Load | DL | Self-weight of structure |
| Live Load | LL | Occupancy/usage loads |
| Wind Load | WL | Wind pressure on structure |
| Seismic | EL | Earthquake forces |
| Snow | SL | Snow accumulation |
| Rain | RL | Ponding on flat roofs |

### Foundation Design

```python
# Shallow foundation
class FoundationDesign:
    @staticmethod
    def bearing_capacity(c, phi, gamma, D_f, B):
        """Terzaghi's bearing capacity"""
        # q_ult = cN_c + γD_fN_q + 0.5γBN_γ
        N_q = np.exp(2 * np.pi * np.tan(np.radians(phi))) * np.tan(np.pi/4 + phi/2)**2
        N_c = (N_q - 1) / (2 * np.tan(np.radians(phi)))
        N_gamma = (N_q - 1) * np.tan(1.4 * phi)
        
        return c * N_c + gamma * D_f * N_q + 0.5 * gamma * B * N_gamma
    
    @staticmethod
    def settlement(Es, mu, q, B):
        """Immediate settlement (elastic)"""
        # s_i = (qB(1-μ²) / Es) × I
        return (q * B * (1 - mu**2) / Es) * 1.5
```

### Concrete Design

```python
# Reinforced concrete
class ConcreteDesign:
    @staticmethod
    def steel_area(f_strength, d, As_required):
        """Calculate reinforcement"""
        return As_required
    
    @staticmethod
    def crack_width(f_s, z, A):
        """Calculate crack width"""
        # w = f_s × A / (0.6 × Es × z)
        return f_s * A / (0.6 * 200000 * z)
    
    @staticmethod
    def deflection(I, M, E):
        """Calculate deflection"""
        return 5 * M * 12**2 / (384 * E * I)
```

### Geotechnical Parameters

| Soil Type | γ (kN/m³) | c (kPa) | φ (°) | E (MPa) |
|-----------|-----------|---------|-------|---------|
| Sand (dense) | 18-20 | 0 | 35-40 | 50-80 |
| Sand (loose) | 15-17 | 0 | 30-35 | 20-40 |
| Clay (stiff) | 18-20 | 50-100 | 20-25 | 20-50 |
| Clay (soft) | 15-17 | 10-25 | 10-15 | 2-10 |
| Gravel | 19-22 | 0 | 35-45 | 100-200 |

### Transportation Design

```python
# Pavement design (AASHTO)
class PavementDesign:
    @staticmethod
    def structural_number(W_18, R, S, Z):
        """Calculate required SN"""
        # Logarithmic relationship
        return (W_18 - 7.35*np.log10(R+1) + 0.2 - 
                9.36*np.log10(S+1) + 8.27*Z) / (0.4 + 1094/(S+1)**2.2)
```

### Common Codes and Standards

- **ACI**: American Concrete Institute
- **AISC**: American Institute of Steel Construction
- **ASCE**: American Society of Civil Engineers
- **IBC**: International Building Code
- **AASHTO**: American Association of State Highway Officials
