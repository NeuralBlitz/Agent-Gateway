---
name: organic-chemistry
description: Chemistry of carbon compounds
license: MIT
compatibility: opencode
metadata:
  audience: organic chemists, researchers, students
  category: chemistry
---

## What I do

- Study carbon-based compounds and reactions
- Analyze organic reaction mechanisms
- Design synthetic routes
- Characterize organic molecules
- Investigate stereochemistry
- Develop new synthetic methods

## When to use me

- When studying organic reactions
- When designing syntheses
- When analyzing mechanisms
- When working with functional groups
- When determining stereochemistry
- When characterizing organic compounds

## Key Concepts

### Functional Groups

| Class | Structure | Example |
|-------|-----------|---------|
| Alkane | C-H, C-C | CH₄ |
| Alkene | C=C | C₂H₄ |
| Alkyne | C≡C | C₂H₂ |
| Alcohol | -OH | C₂H₅OH |
| Ether | R-O-R' | diethyl ether |
| Aldehyde | -CHO | CH₃CHO |
| Ketone | R-CO-R' | acetone |
| Carboxylic acid | -COOH | acetic acid |
| Amine | -NH₂ | ethylamine |

### Reaction Mechanisms

```python
# Example: SN1 vs SN2 reaction analysis
def reaction_type(substrate, nucleophile, solvent):
    """
    Determine likely mechanism.
    """
    # SN2: Primary alkyl halide, strong nucleophile, polar aprotic
    if substrate in ['methyl', 'primary'] and nucleophile == 'strong':
        return 'SN2'
    
    # SN1: Tertiary alkyl halide, weak nucleophile, polar protic
    elif substrate == 'tertiary' and nucleophile == 'weak':
        return 'SN1'
    
    # E2: Strong base, anti-periplanar H
    elif nucleophile == 'strong_base':
        return 'E2'
    
    return 'mixture'
```

### Stereochemistry

- Chiral centers
- Enantiomers vs diastereomers
- R/S configuration
- E/Z isomerism (alkenes)
- Meso compounds
- Optical activity

### Synthesis Strategies

- Retrosynthetic analysis
- Functional group transformations
- Protecting groups
- Carbon-carbon bond formation
- Oxidation/reduction
- Stereocontrol
