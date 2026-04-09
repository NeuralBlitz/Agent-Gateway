---
name: inorganic-chemistry
description: Chemistry of inorganic compounds
license: MIT
compatibility: opencode
metadata:
  audience: inorganic chemists, researchers, students
  category: chemistry
---

## What I do

- Study elements and inorganic compounds
- Analyze coordination chemistry and metal complexes
- Investigate organometallic compounds
- Research solid-state chemistry
- Characterize inorganic reactions and mechanisms
- Develop inorganic materials

## When to use me

- When studying transition metal chemistry
- When analyzing coordination compounds
- When investigating organometallic reactions
- When working with solid-state materials
- When characterizing inorganic complexes
- When developing catalysts

## Key Concepts

### Periodic Trends

- Atomic radius: Decreases across period, increases down group
- Ionization energy: Increases across period
- Electronegativity: Increases across period
- Electron affinity: Varies across period
- Oxidation states: Variable for transition metals

### Coordination Chemistry

**Ligand Types**
- Monodentate: Single donor atom (NH₃, H₂O, Cl⁻)
- Bidentate: Two donor atoms (en, oxalate)
- Polydentate: Multiple donor atoms (EDTA)
- Ambidentate: Multiple binding modes (SCN⁻, NO₂⁻)

```python
# Example: Crystal field stabilization energy
def cfse(electron_config, geometry):
    """
    Calculate crystal field stabilization energy.
    electron_config: d-electron count
    geometry: 'octahedral' or 'tetrahedral'
    """
    if geometry == 'octahedral':
        # For 6-coordinate: t2g ↑↓↑↓↑↓ > eg ↑↑
        return {'d0': 0, 'd1': -4, 'd2': -8, 'd3': -12,
                'd4': -6, 'd5': 0, 'd6': -4, 'd7': -8,
                'd8': -12, 'd9': -6, 'd10': 0}
    elif geometry == 'tetrahedral':
        # For 4-coordinate: e ↑↓ > t2 ↑↑
        return {'d0': 0, 'd1': -6, 'd2': -12, 'd3': -8,
                'd4': -4, 'd5': 0, 'd6': -6, 'd7': -12,
                'd8': -8, 'd9': -4, 'd10': 0}
```

### Molecular Orbital Theory

- Bonding and antibonding orbitals
- d-orbital splitting in complexes
- Spectrochemical series
- Magnetic properties

### Important Compound Classes

- Oxides, halides, sulfides
- Coordination complexes
- Organometallics
- Cluster compounds
- Solid-state materials
