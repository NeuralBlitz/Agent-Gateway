---
name: Organic Chemistry
description: Organic chemistry fundamentals including functional groups, reaction mechanisms, stereochemistry, synthesis planning, and molecular structure for chemistry applications.
license: MIT
compatibility: python>=3.8
audience: chemists, biochemists, pharmaceutical-scientists, researchers
category: chemistry
---

# Organic Chemistry

## What I Do

I provide comprehensive organic chemistry tools including functional group analysis, reaction mechanism prediction, stereochemistry, molecular orbital theory, synthesis planning, and spectroscopic interpretation for chemistry applications.

## When to Use Me

- Reaction mechanism analysis
- Synthesis pathway design
- Stereochemical analysis
- Molecular property prediction
- Spectroscopy interpretation
- Drug design and QSAR

## Core Concepts

- **Functional Groups**: Alcohols, carbonyls, amines, aromatics
- **Reaction Mechanisms**: SN1, SN2, E1, E2, addition, elimination
- **Stereochemistry**: Enantiomers, diastereomers, R/S notation
- **Molecular Orbital Theory**: HOMO/LUMO, aromaticity
- **Resonance Structures**: Delocalization, electron pushing
- **Acid-Base Chemistry**: pKa, Lewis/Brønsted theory
- **Synthesis Planning**: Retrosynthetic analysis
- **Spectroscopy**: IR, NMR, MS interpretation

## Code Examples

### Functional Group Detection

```python
import re

FUNCTIONAL_GROUPS = {
    'alcohol': r'C\([A-Z][a-z]?\)?\([A-Z][a-z]?\)?O[H]',
    'carbonyl': r'C(=O)',
    'amine': r'N[H2]|[NHR]|[NR2]',
    'ether': r'C-O-C',
    'alkene': r'C=C',
    'alkyne': r'C≡C',
    'aromatic': r'c1ccccc1|c1ccccc1',
    'carboxylic_acid': r'C(=O)O[H]',
    'ester': r'C(=O)O[C]',
    'amide': r'C(=O)N'
}

def detect_functional_groups(smiles):
    detected = {}
    for group, pattern in FUNCTIONAL_GROUPS.items():
        if re.search(pattern, smiles):
            detected[group] = True
    return detected

smiles = "CC(=O)O"
print(f"Functional groups in {smiles}: {detect_functional_groups(smiles)}")
```

### pKa Prediction

```python
import numpy as np

PKA_DATA = {
    'carboxylic_acid': 4.76,
    'alcohol': 15.9,
    'phenol': 10.0,
    'amine': 9.25,
    'amide': 15.0,
    'water': 14.0
}

def estimate_pKa(functional_group, substituents=None):
    base_pKa = PKA_DATA.get(functional_group, 14.0)
    
    if substituents and 'electron_withdrawing' in substituents:
        base_pKa -= substituents['electron_withdrawing'] * 0.5
    if substituents and 'electron_donating' in substituents:
        base_pKa += substituents['electron_donating'] * 0.5
    
    return base_pKa

print(f"Acetic acid pKa: {estimate_pKa('carboxylic_acid')}")
print(f"Chloroacetic acid pKa: {estimate_pKa('carboxylic_acid', {'electron_withdrawing': 2})}")
```

### Stereochemistry Analysis

```python
from itertools import permutations

def count_stereoisomers(n_chiral_centers, meso_possible=False):
    total = 2**n_chiral_centers
    if meso_possible and n_chiral_centers > 1:
        meso_count = n_chiral_centers // 2
        return total - meso_count
    return total

def r_s_configuration(priorities, hydrogen_position):
    clockwise = [1, 2, 3]
    counter_clockwise = [1, 3, 2]
    if hydrogen_position in ['back', 'dashed']:
        return 'R' if priorities == clockwise else 'S'
    return 'S' if priorities == clockwise else 'R'

n_centers = 3
print(f"Max stereoisomers for {n_centers} chiral centers: {count_stereoisomers(n_centers)}")
```

### Reaction Mechanism Classification

```python
REACTION_TYPES = {
    'SN1': {'mechanism': 'unimolecular_nucleophilic_substitution',
            'rate_limiting': 'carbocation_formation',
            'stereochemistry': 'racemization'},
    'SN2': {'mechanism': 'bimolecular_nucleophilic_substitution',
            'rate_limiting': 'single_step',
            'stereochemistry': 'inversion'},
    'E1': {'mechanism': 'unimolecular_elimination',
           'rate_limiting': 'carbocation_formation',
           'stereochemistry': 'Zaitsev'},
    'E2': {'mechanism': 'bimolecular_elimination',
           'rate_limiting': 'single_step',
           'stereochemistry': 'anti_periplanar'}
}

def classify_reaction(substrate, nucleophile, solvent, temperature):
    if 'tertiary' in substrate and 'weak' in nucleophile:
        return 'E1'
    elif 'primary' in substrate and 'strong' in nucleophile:
        return 'SN2'
    return 'unknown'

print(f"Reaction type: {classify_reaction('tertiary', 'weak', 'polar_protic', 298)}")
```

### SMILES to Molecular Formula

```python
from collections import Counter

ELEMENT_WEIGHTS = {
    'H': 1.008, 'C': 12.011, 'N': 14.007, 'O': 15.999,
    'F': 18.998, 'Cl': 35.45, 'Br': 79.904, 'S': 32.06
}

def parse_smiles_to_formula(smiles):
    elements = re.findall(r'[A-Z][a-z]?', smiles)
    counts = Counter(elements)
    
    formula = ''
    for element in ['C', 'H', 'N', 'O', 'F', 'Cl', 'Br', 'S', 'P']:
        if element in counts:
            count = counts[element]
            formula += element
            if count > 1:
                formula += str(count)
            del counts[element]
    
    for element in sorted(counts.keys()):
        formula += element
        if counts[element] > 1:
            formula += str(counts[element])
    
    return formula

def calculate_molecular_weight(formula):
    weight = 0
    pattern = r'([A-Z][a-z]?)(\d*)'
    matches = re.findall(pattern, formula)
    for element, count in matches:
        count = int(count) if count else 1
        weight += ELEMENT_WEIGHTS.get(element, 0) * count
    return weight

print(f"C6H12O6 formula: {parse_smiles_to_formula('C(C1C(C(C(C(O1)O)O)O)O)O')}")
```

## Best Practices

1. **Resonance**: Consider all resonance structures
2. **Steric Effects**: Account for 3D geometry
3. **Electronic Effects**: Inductive and resonance effects
4. **Solvent Effects**: Polar protic vs aprotic solvents
5. **Thermodynamics vs Kinetics**: Rate vs equilibrium

## Common Patterns

```python
# IUPAC naming helper
def iupac_stem(alkane_length):
    stems = {1:'meth', 2:'eth', 3:'prop', 4:'but', 5:'pent', 
             6:'hex', 7:'hept', 8:'oct', 9:'non', 10:'dec'}
    return stems.get(alkane_length, f'{alkane_length}')

# Degree of unsaturation
def degree_of_unsaturation(c, h, halogens=0, nitrogens=0):
    return (2*c + 2 - h - halogens + nitrogens) / 2
```

## Core Competencies

1. Functional group recognition
2. Reaction mechanism prediction
3. Stereochemical analysis
4. Molecular orbital concepts
5. Retrosynthetic planning
