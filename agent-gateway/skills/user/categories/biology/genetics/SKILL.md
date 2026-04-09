---
name: Genetics
description: Classical and molecular genetics including Mendelian inheritance, population genetics, genetic linkage, mutation analysis, and evolutionary genetics for biological research.
license: MIT
compatibility: python>=3.8
audience: geneticists, biologists, researchers, students
category: biology
---

# Genetics

## What I Do

I provide comprehensive genetics tools including Mendelian inheritance patterns, population genetics calculations, genetic linkage analysis, mutation classification, Hardy-Weinberg equilibrium, and evolutionary genetics for biological research applications.

## When to Use Me

- Inheritance pattern prediction
- Population allele frequency analysis
- Genetic linkage mapping
- Mutation effect prediction
- Genetic disorder risk assessment
- Evolutionary biology studies

## Core Concepts

- **Mendelian Inheritance**: Dominant, recessive, codominant
- **Population Genetics**: Allele frequencies, Hardy-Weinberg
- **Linkage Analysis**: Recombination frequency, LOD scores
- **Mutation Types**: Point mutations, indels, CNVs
- **Quantitative Traits**: Polygenic inheritance, heritability
- **Genetic Drift**: Founder effect, bottleneck
- **Selection**: Natural, artificial, directional
- **Molecular Evolution**: dN/dS, phylogenetic trees

## Code Examples

### Mendelian Inheritance

```python
from itertools import combinations

def punnett_square(parent1, parent2):
    alleles1 = [p1 + p2 for p1 in parent1 for p2 in parent2]
    alleles2 = [p1 + p2 for p1 in parent2 for p2 in parent1]
    return list(zip(alleles1, alleles2))

def predict_genotype(parent1, parent2, trait='A'):
    parent1 = parent1.upper()
    parent2 = parent2.upper()
    alleles1 = list(set(parent1))
    alleles2 = list(set(parent2))
    
    offspring = []
    for a1 in alleles1:
        for a2 in alleles2:
            genotype = a1 + a2
            if a1 != a2:
                genotype = max(genotype, genotype[::-1])
            offspring.append(genotype)
    return offspring

Aa = predict_genotype('Aa', 'aa')
print(f"Offspring from Aa × aa: {Aa}")

def genetic_ratio(genotypes):
    from collections import Counter
    return Counter(genotypes)

def test_cross(genotype):
    if len(set(genotype)) == 1:
        return "Homozygous"
    return "Heterozygous"
```

### Hardy-Weinberg Equilibrium

```python
def hardy_weinberg_equilibrium(p, q=1-p):
    p2 = p**2
    2pq = 2 * p * q
    q2 = q**2
    return {'p² (AA)': p2, '2pq (Aa)': 2*pq, 'q² (aa)': q2}

def allele_frequency_from_phenotypes(dom_phen, rec_phen, total):
    q2 = rec_phen / total
    q = q2**0.5
    p = 1 - q
    return {'p': p, 'q': q, 'AA': p**2 * total, 'Aa': 2*p*q*total}

def estimate_carrier_frequency(q):
    p = 1 - q
    carrier_freq = 2 * p * q
    return carrier_freq

def test_hwe(observed_counts, total):
    p_hat = (2*observed_counts['AA'] + observed_counts['Aa']) / (2*total)
    q_hat = 1 - p_hat
    
    expected = {
        'AA': p_hat**2 * total,
        'Aa': 2*p_hat*q_hat*total,
        'aa': q_hat**2 * total
    }
    
    chi_sq = sum((observed_counts[k] - expected[k])**2 / expected[k] for k in observed_counts)
    return {'expected': expected, 'chi_squared': chi_sq}

print(f"H-W equilibrium (p=0.6): {hardy_weinberg_equilibrium(0.6)}")
```

### Linkage Analysis

```python
def recombination_frequency(observed_recombinants, total):
    return observed_recombinants / total

def lod_score(recombinants, non_recombinants, theta=0.5):
    from scipy.stats import binom
    likelihood_data = binom.pmf(non_recombinants, recombinants + non_recombinants, theta)
    likelihood_null = binom.pmf(non_recombinants, recombinants + non_recombinants, 0.5)
    return np.log10(likelihood_data / likelihood_null)

def map_distance(theta):
    if theta <= 0:
        return 0
    return -0.5 * np.log(1 - 2*theta) * 100

recomb = 15
total = 100
theta = recombination_frequency(recomb, total)
lod = lod_score(recomb, total - recomb, theta)
print(f"Recombination fraction: {theta:.3f}")
print(f"Map distance: {map_distance(theta):.1f} cM")
print(f"LOD score: {lod:.2f}")
```

### Mutation Analysis

```python
MUTATION_TYPES = {
    'missense': 'Amino acid change',
    'nonsense': 'Premature stop codon',
    'silent': 'No amino acid change',
    'frameshift': 'Reading frame shift',
    'splice_site': 'Splicing disruption'
}

def classify_mutation(ref, alt, position):
    if len(ref) == len(alt) == 1:
        if ref == alt:
            return 'silent'
        if alt == 'A' or alt == 'T':
            return 'missense'
        return 'nonsense'
    elif len(alt) > len(ref):
        return 'insertion'
    elif len(alt) < len(ref):
        return 'deletion'
    return 'complex'

def predict_mutation_impact(chromosome, position, ref, alt, transcript):
    mutation = classify_mutation(ref, alt, position)
    cds_position = transcript['cds_start'] + position - transcript['chrom_start']
    
    aa_position = cds_position // 3 + 1
    ref_aa = translate_codon(transcript['sequence'][cds_position:cds_position+3])
    alt_sequence = transcript['sequence'][:cds_position] + alt + transcript['sequence'][cds_position+len(ref):]
    alt_aa = translate_codon(alt_sequence[cds_position:cds_position+3])
    
    return {
        'type': mutation,
        'aa_change': f"{ref_aa}{aa_position}{alt_aa}" if mutation in ['missense', 'nonsense'] else None
    }

def calculate_heterozygosity(n_heterozygotes, total):
    return 2 * (n_heterozygotes / total) * (1 - n_heterozygotes / total)
```

### Genetic Risk Calculation

```python
def calculate_carrier_probability(parent_status, sibling_status, pedigree_prob=0.02):
    if parent_status == 'affected':
        return 2/3 if sibling_status == 'unaffected' else 1
    elif parent_status == 'carrier':
        return 1/2
    else:
        return pedigree_prob

def bayes_carrier_risk(prior_prob, likelihood_affected, likelihood_unaffected):
    posterior = prior_prob * likelihood_affected / (prior_prob * likelihood_affected + (1-prior_prob) * likelihood_unaffected)
    return posterior

def polygenic_risk_score(loci_effects):
    return sum(loci_effects.values())

def heritability_estimate(vg, vp):
    return vg / vp

def inbreeding_coefficient(f):
    return f

def effective_population_size(ne, generations):
    return ne / (1 - (1 - 1/(2*ne))**generations)
```

## Best Practices

1. **Population Stratification**: Account for population structure
2. **Multiple Testing**: Adjust p-values for GWAS
3. **Linkage Disequilibrium**: Consider LD in association studies
4. **Penetrance**: Distinguish between genotype and phenotype
5. **Mendelian Errors**: Check for impossible genotypes

## Common Patterns

```python
# Coefficent of relationship
def relationship_coefficient(relationship):
    coefficients = {
        'parent-offspring': 0.5,
        'siblings': 0.5,
        'grandparent-grandchild': 0.25,
        'uncle-aunt-niece-nephew': 0.25,
        'first_cousins': 0.125
    }
    return coefficients.get(relationship, 0)

# Coefficient of inbreeding
def kinship_coefficient(pedigree, individual):
    # Calculate kinship coefficient
    pass
```

## Core Competencies

1. Mendelian inheritance patterns
2. Population genetics calculations
3. Linkage and association analysis
4. Mutation classification
5. Evolutionary genetics
