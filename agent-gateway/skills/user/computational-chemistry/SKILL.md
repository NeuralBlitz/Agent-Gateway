---
name: computational-chemistry
description: Computer simulation of chemical systems
license: MIT
compatibility: opencode
metadata:
  audience: computational chemists, researchers, modelers
  category: chemistry
---

## What I do

- Perform quantum chemical calculations
- Run molecular dynamics simulations
- Calculate molecular properties
- Optimize chemical structures
- Predict reaction mechanisms
- Analyze protein-ligand interactions

## When to use me

- When calculating molecular orbitals and properties
- When simulating molecular dynamics
- When optimizing molecular structures
- When predicting reaction barriers
- When studying protein-ligand binding
- When calculating thermodynamic properties

## Key Concepts

### Quantum Chemistry Methods

**Ab Initio Methods**
- Hartree-Fock (HF)
- Configuration Interaction (CI)
- Coupled Cluster (CCSD, CCSD(T))
- Density Functional Theory (DFT)

**Basis Sets**
- STO-3G, 6-31G, 6-311G: Split-valence
- cc-pVDZ, cc-pVTZ: Correlation-consistent
- aug-cc-pVTZ: Augmented for anions

### Molecular Dynamics

```python
# Example: Velocity Verlet integration
def velocity_verlet(r, v, a, dt, potential_fn):
    """Integrate Newton's equations of motion."""
    # Half-step velocity update
    v_half = v + 0.5 * a * dt
    
    # Full position update
    r_new = r + v_half * dt
    
    # Calculate new forces
    a_new = -grad(potential_fn, r_new) / mass
    
    # Full velocity update
    v_new = v_half + 0.5 * a_new * dt
    
    return r_new, v_new, a_new
```

### Force Fields

- AMBER: Proteins, nucleic acids
- CHARMM: General biomolecules
- OPLS: Liquids, proteins
- UFF: Periodic materials
- ReaxFF: Reactive dynamics
