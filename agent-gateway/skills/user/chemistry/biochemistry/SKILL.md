---
name: biochemistry
description: Study of chemical processes within living organisms, including proteins, enzymes, nucleic acids, and metabolism
category: chemistry
keywords: [biochemistry, enzymes, proteins, metabolism, nucleic acids, lipids, carbohydrates, biochemical pathways]
---

# Biochemistry

## What I Do

Biochemistry explores the chemical processes and molecules that occur within living organisms. I cover biomolecules (proteins, nucleic acids, carbohydrates, lipids), enzyme kinetics, metabolic pathways, genetic information flow, cell signaling, and biochemical techniques. I help analyze molecular mechanisms of life at the chemical level.

## When to Use Me

- Studying enzyme mechanisms and inhibition
- Analyzing metabolic pathways and regulation
- Understanding protein structure-function relationships
- Investigating nucleic acid biochemistry and gene expression
- Designing biochemical assays and experiments
- Understanding cellular energetics and ATP production
- Researching drug targets and biochemical basis of disease

## Core Concepts

1. **Amino Acids and Proteins**: Structure, folding, post-translational modifications
2. **Enzymes**: Active sites, Michaelis-Menten kinetics, inhibition types, regulation
3. **Nucleic Acids**: DNA/RNA structure, replication, transcription, translation
4. **Carbohydrates**: Monosaccharides, polysaccharides, glycobiology
5. **Lipids**: Membrane structure, signaling lipids, metabolism
6. **Metabolism**: Glycolysis, TCA cycle, oxidative phosphorylation, biosynthesis
7. **Coenzymes and Vitamins**: NAD+, FAD, CoA, and enzyme cofactors
8. **Cell Signaling**: Receptors, second messengers, signal transduction
9. **Bioenergetics**: ATP synthesis, electron transport chain, free energy
10. **Techniques**: SDS-PAGE, Western blot, PCR, ELISA, chromatography

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class EnzymeKinetics:
    def __init__(self, enzyme_name: str, km: float = 0.0, vmax: float = 0.0):
        self.enzyme_name = enzyme_name
        self.km = km
        self.vmax = vmax

    def michaelis_menten(self, substrate_conc: float) -> float:
        return (self.vmax * substrate_conc) / (self.km + substrate_conc)

    def lineweaver_burk(self, substrate_conc: List[float]) -> Tuple[List[float], List[float]]:
        reciprocals_1s = [1/s for s in substrate_conc]
        reciprocals_v = [1/self.michaelis_menten(s) for s in substrate_conc]
        return reciprocals_1s, reciprocals_v

    def calculate_inhibition(self, inhibitor_conc: float, 
                            ki: float, inhibitor_type: str) -> Dict:
        if inhibitor_type == 'competitive':
            apparent_km = self.km * (1 + inhibitor_conc / ki)
            return {'apparent_km': apparent_km, 'vmax_unchanged': True}
        elif inhibitor_type == 'noncompetitive':
            apparent_vmax = self.vmax / (1 + inhibitor_conc / ki)
            return {'apparent_vmax': apparent_vmax, 'km_unchanged': True}
        return {}

class ProteinAnalysis:
    def __init__(self, sequence: str):
        self.sequence = sequence.upper()
        self.aa_masses = {
            'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.15,
            'E': 147.13, 'Q': 146.15, 'G': 75.07, 'H': 155.16, 'I': 131.17,
            'L': 131.17, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
            'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
        }

    def calculate_molecular_weight(self, water_correction: bool = True) -> float:
        mw = sum(self.aa_masses.get(aa, 0) for aa in self.sequence)
        if water_correction:
            mw += 18.015 * (len(self.sequence) - 1)
        return mw

    def calculate_isoelectric_point(self) -> float:
        pKa = {'D': 3.9, 'E': 4.3, 'C': 8.3, 'Y': 10.1, 'H': 6.0, 
               'K': 10.5, 'R': 12.5, 'N_term': 9.7, 'C_term': 2.3}
        charged = {'D': -1, 'E': -1, 'C': -1, 'Y': -1, 'H': 1, 
                   'K': 1, 'R': 1, 'N_term': 1, 'C_term': -1}
        return 7.0  # Simplified estimate

    def get_amino_acid_composition(self) -> Dict[str, float]:
        total = len(self.sequence)
        return {aa: self.sequence.count(aa) / total * 100 
                for aa in set(self.sequence)}

hexokinase = EnzymeKinetics("Hexokinase", km=0.1, vmax=100)
v = hexokinase.michaelis_menten(0.5)
print(f"Reaction velocity at 0.5mM: {v:.2f}")
protein = ProteinAnalysis("MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH")
print(f"MW: {protein.calculate_molecular_weight():.2f} Da")
```

## Best Practices

1. Maintain proper pH and temperature for enzyme assays
2. Use appropriate controls in biochemical experiments
3. Account for substrate depletion in kinetic measurements
4. Consider allosteric regulation and cooperativity
5. Use proper buffers to maintain ionic strength
6. Validate protein purity before structural studies
7. Use appropriate controls for inhibition studies
8. Consider tissue-specific expression in metabolic studies
9. Handle enzymes carefully to maintain activity (temperature, freeze-thaw)
10. Report experimental conditions completely for reproducibility
