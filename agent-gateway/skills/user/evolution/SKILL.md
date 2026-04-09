---
name: evolution
description: Biological evolution and adaptation
license: MIT
compatibility: opencode
metadata:
  audience: evolutionary biologists, researchers, students
  category: biology
---

## What I do

- Study mechanisms of evolutionary change
- Analyze natural selection and adaptation
- Research speciation and biodiversity
- Construct phylogenetic trees
- Investigate molecular evolution
- Study population genetics

## When to use me

- When studying evolutionary relationships
- When analyzing adaptation mechanisms
- When constructing phylogenies
- When studying speciation
- When researching molecular evolution
- When analyzing population genetics

## Key Concepts

### Mechanisms of Evolution

- **Natural selection**: Differential reproductive success
- **Genetic drift**: Random allele frequency change
- **Gene flow**: Migration between populations
- **Mutation**: Source of genetic variation
- **Non-random mating**: Assortative/disassortative

### Natural Selection

```python
# Example: Selection coefficient calculation
def selection_coefficient(w1, w2):
    """
    Calculate selection coefficient.
    w1, w2: Fitness values of genotypes
    """
    return 1 - (w2 / w1)

def allele_frequency(p, q, s, t):
    """
    Calculate allele frequency change under selection.
    p: Frequency of dominant allele
    q: Frequency of recessive allele
    s: Selection coefficient against dominant
    t: Selection coefficient against recessive
    """
    delta_p = (p * q * (p*s - q*t)) / (1 - s*p**2 - t*q**2)
    return delta_p
```

### Phylogenetics

**Tree Construction Methods**
- Maximum parsimony
- Maximum likelihood
- Neighbor-joining
- UPGMA

**Molecular Evolution**
- dN/dS ratio: Nonsynonymous vs synonymous substitutions
- Molecular clock: Constant mutation rate
- Positive selection: Adaptive evolution

### Evidence for Evolution

- Fossil record
- Comparative anatomy
- Molecular biology
- Biogeography
- Direct observation
