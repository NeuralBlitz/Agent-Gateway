---
name: organic-chemistry
description: Study of carbon-based compounds, their structures, properties, reactions, and synthesis
category: chemistry
keywords: [organic chemistry, carbon compounds, synthesis, reactions, functional groups]
---

# Organic Chemistry

## What I Do

Organic chemistry is the branch of chemistry that focuses on the study of carbon-based compounds. I help you understand molecular structures, reaction mechanisms, synthesis pathways, and the chemical behavior of organic molecules. I cover hydrocarbons, functional groups, stereochemistry, and reaction types including addition, substitution, elimination, and pericyclic reactions.

## When to Use Me

- Designing synthesis routes for complex molecules
- Understanding reaction mechanisms and intermediates
- Predicting products of organic reactions
- Analyzing molecular structure and stereochemistry
- Working with polymers, natural products, or pharmaceuticals
- Studying biochemical pathways and metabolic processes

## Core Concepts

1. **Functional Groups**: Hydroxyl, carbonyl, carboxyl, amino, nitro, and other groups that determine chemical reactivity
2. **Resonance Structures**: Delocalized electrons and their impact on molecular stability and reactivity
3. **Stereochemistry**: Configuration and conformation of molecules, chirality, enantiomers, diastereomers
4. **Reaction Mechanisms**: Arrow-pushing, intermediates, transition states, and energy profiles
5. **Synthesis Planning**: Retrosynthetic analysis, protecting groups, and synthetic strategy
6. **Spectroscopy**: NMR, IR, MS for structural elucidation of organic compounds
7. **Pericyclic Reactions**: Diels-Alder, electrocyclic, cycloaddition reactions
8. **Organic Acid-Base Chemistry**: pKa, conjugate bases, and acid strength trends

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class OrganicMolecule:
    def __init__(self, formula: str, functional_groups: List[str]):
        self.formula = formula
        self.functional_groups = functional_groups
        self.molecular_weight = self._calculate_mw()

    def _calculate_mw(self) -> float:
        atomic_weights = {'C': 12.01, 'H': 1.008, 'O': 16.00, 'N': 14.01}
        import re
        pattern = r'([CHNO])(\d*)'
        mw = 0.0
        for element, count in re.findall(pattern, self.formula):
            count = int(count) if count else 1
            mw += atomic_weights.get(element, 0) * count
        return mw

    def predict_reactivity(self) -> Dict[str, List[str]]:
        reactivity_map = {
            'hydroxyl': ['oxidation', 'substitution', 'esterification'],
            'carbonyl': ['nucleophilic_addition', 'condensation'],
            'carboxyl': ['decarboxylation', 'esterification', 'amidation'],
            'amino': ['acylation', 'alkylation', 'protonation'],
            'alkene': ['addition', 'oxidation', 'polymerization']
        }
        return {fg: reactivity_map.get(fg, ['unknown']) 
                for fg in self.functional_groups}

    def retrosynthetic_analysis(self, target_reaction: str) -> List[str]:
        precursors = {
            'esterification': ['carboxylic_acid', 'alcohol'],
            'friedel_crafts_acylation': ['aromatic', 'acyl_chloride'],
            'diels_alder': ['diene', 'dienophile']
        }
        return precursors.get(target_reaction, ['unknown_precursor'])

ethanol = OrganicMolecule("C2H6O", ["hydroxyl", "hydrocarbon"])
print(f"Molecular Weight: {ethanol.molecular_weight:.2f} g/mol")
print(f"Reactivity: {ethanol.predict_reactivity()}")
```

## Best Practices

1. Always consider resonance and inductive effects when predicting reactivity
2. Use proper IUPAC nomenclature for clarity and standardization
3. Protect reactive functional groups during multi-step synthesis
4. Consider stereochemistry in reaction outcomes and stereoselectivity
5. Use spectroscopy data to confirm molecular structure
6. Plan retrosynthetic routes before attempting synthesis
7. Account for stereoisomers in chiral molecule analysis
8. Consider solvent effects and reaction conditions
9. Validate reaction mechanisms with experimental evidence
10. Maintain accurate molecular formulas and structural drawings
