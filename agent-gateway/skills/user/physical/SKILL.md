---
name: physical
description: Physical chemistry fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: chemists, physicists, students
  category: chemistry
---

## What I do

- Explain physical chemistry principles
- Describe thermodynamic concepts
- Discuss quantum mechanics basics
- Analyze molecular behavior
- Explain chemical kinetics
- Connect theory to observation

## When to use me

- When learning physical chemistry basics
- When explaining thermodynamic principles
- When studying quantum chemistry
- When preparing educational content

## Key Concepts

### Thermodynamics

**State Functions**
- Internal energy (U)
- Enthalpy (H)
- Entropy (S)
- Gibbs free energy (G)

**First Law**: ΔU = q + w
**Second Law**: ΔS_universe ≥ 0
**Third Law**: S → 0 as T → 0

### Quantum Mechanics

```python
# Schrödinger equation (time-independent)
# HΨ = EΨ

# Particle in a box (1D)
def particle_in_box_energy(n, m, L):
    """
    Calculate energy levels.
    n: quantum number (1, 2, 3, ...)
    m: particle mass
    L: box length
    """
    h = 6.626e-34  # Planck constant
    return (n**2 * h**2) / (8 * m * L**2)

# Heisenberg uncertainty
# Δx · Δp ≥ ℏ/2
```

### Kinetics

- Rate = k[A]ⁿ[B]ᵐ
- Arrhenius: k = A·e^(-Ea/RT)
- Half-life equations
- Reaction coordinate diagrams
- Catalysts lower activation energy

### States of Matter

- **Solids**: Fixed shape/volume, ordered
- **Liquids**: Fixed volume, variable shape
- **Gases**: Variable volume/shape, disordered
- **Plasma**: Ionized gas (high energy)
- **Bose-Einstein condensate**: Supercooled atoms
