---
name: inorganic-chemistry
description: Study of inorganic compounds, coordination chemistry, organometallics, and transition metal chemistry
category: chemistry
keywords: [inorganic chemistry, coordination compounds, transition metals, crystal field theory, organometallics]
---

# Inorganic Chemistry

## What I Do

Inorganic chemistry covers the study of elements and compounds that are not primarily carbon-based. I help with coordination chemistry, transition metal complexes, crystal field theory, ligand field theory, organometallic chemistry, solid-state chemistry, and the chemistry of main group elements. I also cover redox chemistry, acid-base concepts in non-aqueous systems, and spectroscopic characterization of inorganic compounds.

## When to Use Me

- Working with coordination compounds and metal complexes
- Understanding transition metal catalysis and organometallic reactions
- Analyzing crystal structures and solid-state materials
- Studying inorganic reaction mechanisms and redox processes
- Exploring bioinorganic chemistry and metalloproteins
- Designing inorganic materials and catalysts

## Core Concepts

1. **Coordination Chemistry**: Metal centers, ligands, coordination numbers, and geometries
2. **Crystal Field Theory**: d-orbital splitting, CFSE, and spectrochemical series
3. **Ligand Field Theory**: Covalent bonding in coordination compounds
4. **Isomerism**: Structural and stereoisomerism in complexes
5. **Organometallic Chemistry**: Metal-carbon bonds, catalytic cycles, and reaction mechanisms
6. **Redox Chemistry**: Oxidation states, electron transfer, and redox potentials
7. **Solid-State Chemistry**: Crystal structures, band theory, and defects
8. **Main Group Chemistry**: Chemistry of s and p block elements
9. **Bioinorganic Chemistry**: Metal ions in biological systems and metalloproteins
10. **Characterization Techniques**: X-ray crystallography, NMR, UV-Vis, EPR spectroscopy

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from enum import Enum

class Geometry(Enum):
    OCTAHEDRAL = "octahedral"
    TETRAHEDRAL = "tetrahedral"
    SQUARE_PLANAR = "square_planar"
    LINEAR = "linear"

class CoordinationCompound:
    def __init__(self, metal: str, oxidation_state: int, 
                 ligands: List[str], geometry: Geometry):
        self.metal = metal
        self.oxidation_state = oxidation_state
        self.ligands = ligands
        self.geometry = geometry
        self.coordination_number = len(ligands)

    def calculate_cfse(self, d_electrons: int) -> float:
        cfse_values = {
            Geometry.OCTAHEDRAL: {'t2g': -0.4, 'eg': 0.6},
            Geometry.TETRAHEDRAL: {'e': -0.6, 't2': 0.4},
            Geometry.SQUARE_PLANAR: {'dx2_y2': 1.23, 'dxy': -0.46}
        }
        return cfse_values.get(self.geometry, {})

    def get_spectrochemical_position(self) -> List[str]:
        spectrochemical_series = [
            'I-', 'Br-', 'Cl-', 'F-', 'OH-', 'H2O', 
            'NH3', 'en', 'NO2-', 'CN-', 'CO'
        ]
        return sorted(self.ligands, 
                      key=lambda x: spectrochemical_series.index(x) 
                      if x in spectrochemical_series else 99)

    def determine_high_spin_low_spin(self, pairing_energy: float) -> str:
        cfse_octahedral = {'t2g': -0.4, 'eg': 0.6}
        return "high_spin" if pairing_energy > cfse_octahedral['t2g'] * 10 else "low_spin"

complex = CoordinationCompound("Fe", 3, ['NH3', 'NH3', 'NH3', 'NH3', 'NH3', 'NH3'], 
                                 Geometry.OCTAHEDRAL)
print(f"Coordination Number: {complex.coordination_number}")
print(f"Ligand Strength: {complex.get_spectrochemical_position()}")
```

## Best Practices

1. Always determine oxidation states correctly before analyzing electronic structure
2. Apply crystal field theory consistently for octahedral vs tetrahedral complexes
3. Consider both sigma-donor and pi-acceptor/donor properties of ligands
4. Use proper naming conventions for coordination compounds (IUPAC)
5. Account for Jahn-Teller distortions in d9 and high-spin d4 complexes
6. Validate structures with spectroscopic data and crystallography when possible
7. Consider kinetic vs thermodynamic stability in reaction products
8. Understand the role of counter ions and solvation effects
9. Apply 18-electron rule as a guideline for organometallic stability
10. Consider relativistic effects for heavier transition metals
