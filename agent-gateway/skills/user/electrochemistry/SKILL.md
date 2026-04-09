---
name: electrochemistry
description: Chemical processes involving electrons
license: MIT
compatibility: opencode
metadata:
  audience: electrochemists, materials scientists, researchers
  category: chemistry
---

## What I do

- Study electrochemical reactions and processes
- Design and analyze electrochemical cells
- Investigate electrode materials and interfaces
- Develop batteries, fuel cells, and supercapacitors
- Perform electrochemical analysis techniques
- Research corrosion and protection methods

## When to use me

- When analyzing redox reactions
- When designing electrochemical cells
- When studying battery chemistry
- When investigating corrosion mechanisms
- When performing electrochemical measurements
- When developing energy storage systems

## Key Concepts

### Fundamental Equations

**Nernst Equation**
```
E = E° - (RT/nF) ln(Q)
E = E° - (0.0592/n) log(Q) at 298K
```

**Butler-Volmer Equation**
```
i = i₀ [exp(-αfη) - exp((1-α)fη)]
```

### Electrochemical Techniques

```python
# Example: Cyclic voltammetry analysis
def cyclic_voltammetry(potential_range, scan_rate):
    """
    Simulate cyclic voltammogram.
    potential_range: E_start to E_reverse
    scan_rate: dE/dt (V/s)
    """
    # Peak current (Randles-Sevcik)
    ip = 2.69e5 * n**1.5 * A * D**0.5 * C * v**0.5
    return {'peak_current': ip, 'formal_potential': E_f}
```

### Battery Types

- **Lead-acid**: Reversible Pb/PbO₂ reactions
- **Lithium-ion**: Intercalation chemistry
- **Nickel-metal hydride**: H absorption
- **Solid-state**: Solid electrolytes

### Corrosion

- Uniform corrosion
- Pitting corrosion
- Crevice corrosion
- Galvanic corrosion
- Stress corrosion cracking
