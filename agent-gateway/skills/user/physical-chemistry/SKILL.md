---
name: physical-chemistry
description: Physics and chemistry of molecular systems
license: MIT
compatibility: opencode
metadata:
  audience: physical chemists, researchers, students
  category: chemistry
---

## What I do

- Apply physics to chemical systems
- Study molecular structure and spectroscopy
- Analyze chemical thermodynamics
- Investigate reaction kinetics
- Research quantum chemistry
- Model chemical systems

## When to use me

- When studying molecular spectroscopy
- When analyzing thermodynamic properties
- When investigating reaction rates
- When applying quantum mechanics to molecules
- When modeling chemical equilibria
- When studying phase transitions

## Key Concepts

### Thermodynamics

**Laws**
1. Energy conservation
2. Entropy increases
3. Absolute zero unattainable

**Key Equations**
```python
# Thermodynamic relationships
def gibbs_free_energy(H, S, T):
    """
    Determine spontaneity.
    G = H - TS
    """
    return H - T * S

def equilibrium_constant(dG):
    """
    Calculate K from ΔG°.
    ΔG° = -RT ln K
    """
    R = 8.314  # J/(mol·K)
    return np.exp(-dG / (R * 298))

def nernst_potential(E, Q, n):
    """
    Concentration effect on potential.
    E = E° - (RT/nF) ln Q
    """
    return E - (0.0592 / n) * np.log10(Q)
```

### Kinetics

- Rate laws and order
- Activation energy (Arrhenius)
- Transition state theory
- Catalysis
- Reaction mechanisms

### Quantum Chemistry

- Wave mechanics
- Schrödinger equation
- Molecular orbitals
- Born-Oppenheimer approximation
- Hartree-Fock theory
- Density functional theory

### Spectroscopy

- UV-Vis: Electronic transitions
- IR: Vibrational transitions
- NMR: Nuclear spin transitions
- EPR: Electron spin transitions
- Raman: Vibrational (inelastic)
