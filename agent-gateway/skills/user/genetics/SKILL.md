---
name: genetics
description: Inheritance and genetic variation
license: MIT
compatibility: opencode
metadata:
  audience: geneticists, researchers, students
  category: biology
---

## What I do

- Study inheritance patterns and gene transmission
- Analyze gene structure and function
- Investigate genetic mutations and variation
- Research gene expression and regulation
- Map genetic loci and analyze linkage
- Apply genetic engineering techniques

## When to use me

- When analyzing inheritance patterns
- When studying gene function
- When investigating genetic disorders
- When performing genetic crosses
- When mapping genetic traits
- When applying molecular genetics techniques

## Key Concepts

### Mendelian Inheritance

**Laws**
1. Law of Dominance: Dominant masks recessive
2. Law of Segregation: Alleles separate
3. Law of Independent Assortment: Genes assort independently

### Genetic Crosses

```python
# Example: Punnett square analysis
def punnett_square(parent1, parent2):
    """
    Generate Punnett square for two alleles.
    parent1, parent2: 'A' or 'a' for each parent
    """
    gametes1 = [parent1[0], parent1[1]]
    gametes2 = [parent2[0], parent2[1]]
    
    offspring = [[g1 + g2 for g2 in gametes2] for g1 in gametes1]
    return offspring

def mendelian_ratios(genotypes):
    """Calculate expected phenotypic ratios."""
    AA = genotypes.count('AA')
    Aa = genotypes.count('Aa')
    aa = genotypes.count('aa')
    return {'dominant': AA + Aa, 'recessive': aa}
```

### Non-Mendelian Inheritance

- Incomplete dominance
- Codominance
- Multiple alleles
- Pleiotropy
- Epistasis
- Genomic imprinting
- Mitochondrial inheritance

### Molecular Genetics

- DNA replication
- Transcription
- Translation
- Gene regulation
- Mutation types
- DNA repair mechanisms
