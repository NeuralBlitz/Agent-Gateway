---
name: biochemistry
description: Chemical processes in living organisms
license: MIT
compatibility: opencode
metadata:
  audience: biochemists, molecular biologists, researchers
  category: biology
---

## What I do

- Analyze chemical reactions and processes in living systems
- Study enzyme kinetics and catalytic mechanisms
- Investigate metabolic pathways and regulation
- Characterize biomolecules (proteins, nucleic acids, lipids, carbohydrates)
- Research protein structure-function relationships
- Apply biochemical techniques to solve biological problems

## When to use me

- When studying enzyme mechanisms and inhibition
- When analyzing metabolic pathways and disorders
- When characterizing biomolecules and their interactions
- When investigating cellular biochemistry and signaling
- When developing biochemical assays and diagnostics

## Key Concepts

### Major Metabolic Pathways

**Glycolysis**: Glucose → Pyruvate + ATP
**Citric Acid Cycle**: Acetyl-CoA oxidation + electron carriers
**Oxidative Phosphorylation**: ATP synthesis via electron transport
**Gluconeogenesis**: Glucose synthesis from non-carbohydrates
**Beta-Oxidation**: Fatty acid catabolism
**Photosynthesis**: Light reactions + Calvin cycle

### Enzyme Kinetics

```python
# Example: Michaelis-Menten kinetics
import numpy as np

def michaelis_menten(S, Vmax, Km):
    """
    Calculate reaction velocity.
    S: Substrate concentration
    Vmax: Maximum velocity
    Km: Michaelis constant
    """
    return (Vmax * S) / (Km + S)

def lineweaver_burk(S, v, Vmax, Km):
    """Linearize Michaelis-Menten for parameter estimation."""
    return 1/v, 1/S, 1/Vmax, -1/Km
```

### Key Techniques

- Spectroscopy: UV-Vis, fluorescence, circular dichroism
- Chromatography: HPLC, FPLC, affinity chromatography
- Electrophoresis: SDS-PAGE, native PAGE, 2D gel
- Mass spectrometry: MALDI-TOF, LC-MS
- Calorimetry: ITC, DSC
- Microscopy: Confocal, cryo-EM
