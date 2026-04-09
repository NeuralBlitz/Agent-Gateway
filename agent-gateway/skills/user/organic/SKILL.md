---
name: organic
description: Organic chemistry fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: chemists, students, researchers
  category: chemistry
---

## What I do

- Explain organic chemistry principles
- Describe functional group properties
- Discuss reaction types and mechanisms
- Analyze molecular structure
- Explain isomerism
- Connect structure to reactivity

## When to use me

- When learning organic chemistry basics
- When explaining functional group behavior
- When studying organic reactions
- When preparing educational content

## Key Concepts

### Hydrocarbons

**Alkanes**: Single bonds (saturated)
- General formula: CₙH₂ₙ₊₂
- Reactions: Combustion, halogenation

**Alkenes**: Double bonds (unsaturated)
- General formula: CₙH₂ₙ
- Reactions: Addition, polymerization

**Alkynes**: Triple bonds
- General formula: CₙH₂ₙ₋₂
- Reactions: Addition, oxidation

### Functional Group Chemistry

```python
# Functional group priority (for naming)
priority = {
    1: 'Carboxylic acids',
    2: 'Esters',
    3: 'Amides',
    4: 'Aldehydes',
    5: 'Ketones',
    6: 'Alcohols',
    7: 'Amines',
    8: 'Alkenes',
    9: 'Alkynes',
    10: 'Alkanes'
}

# Common reactions
reactions = {
    'alkanes': ['combustion', 'halogenation'],
    'alkenes': ['addition (H2, HX, H2O)', 'polymerization'],
    'alcohols': ['oxidation', 'esterification', 'dehydration'],
    'aldehydes': ['oxidation', 'nucleophilic addition'],
    'carboxylic_acids': ['esterification', 'amidation']
}
```

### Nomenclature

- IUPAC naming rules
- Substituent naming
- Functional group priority
- Stereochemical descriptors
- Common names vs systematic

### Isomerism

- Structural (constitutional)
- Geometric (cis/trans, E/Z)
- Optical (enantiomers)
- Conformational
