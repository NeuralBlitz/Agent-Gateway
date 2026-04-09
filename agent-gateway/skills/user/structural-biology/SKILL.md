---
name: structural-biology
description: 3D structure of biological molecules
license: MIT
compatibility: opencode
metadata:
  audience: structural biologists, biochemists, researchers
  category: biology
---

## What I do

- Determine 3D structures of biomolecules
- Analyze protein folding and conformation
- Study molecular interactions
- Interpret structural data
- Model protein-ligand complexes
- Predict protein structure

## When to use me

- When analyzing protein structures
- When studying molecular interactions
- When interpreting PDB data
- When predicting protein structure
- When studying enzyme mechanisms
- When designing drugs

## Key Concepts

### Structure Determination

**Experimental Methods**
- X-ray crystallography: Atomic resolution
- Nuclear Magnetic Resonance (NMR): Solution structure
- Cryo-electron microscopy: Large complexes
- Electron diffraction: Small molecules

### Protein Structure Levels

```python
# Protein structure hierarchy
structure_levels = {
    'primary': 'Linear amino acid sequence',
    'secondary': 'Local structural motifs',
    'tertiary': '3D folding of single chain',
    'quaternary': 'Multi-subunit assembly'
}

# Secondary structure
secondary_elements = {
    'alpha_helix': '3.6 residues/turn, i to i+4 H-bond',
    'beta_sheet': 'Interstrand H-bonds, parallel or antiparallel',
    'turns': 'Reverse direction, often Gly, Pro'
}
```

### Structure Analysis

- Ramachandran plot: Allowed φ, ψ angles
- Contact maps: Residue interactions
- RMSD: Structure alignment
- DALI: Fold similarity
- PISA: Interface analysis

### Protein-Ligand Interactions

- Hydrogen bonds
- Hydrophobic interactions
- Electrostatic interactions
- Van der Waals forces
- π-stacking
- Cation-π interactions

### Structure Prediction

- Homology modeling
- Threading
- Ab initio folding
- AlphaFold, RoseTTAFold
- Rosetta
