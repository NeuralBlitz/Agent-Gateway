---
name: genetics
description: Study of heredity, genes, genetic variation, and inheritance patterns
category: biology
keywords: [genetics, inheritance, Mendelian genetics, gene mapping, mutation, genetic disorders, genomics]
---

# Genetics

## What I Do

Genetics studies heredity, genetic variation, and the function and behavior of genes. I cover Mendelian inheritance, genetic linkage, gene mapping, mutation analysis, population genetics, quantitative genetics, and genetic disorders. I help analyze inheritance patterns, calculate genetic risks, and understand gene function.

## When to Use Me

- Analyzing Mendelian inheritance patterns
- Calculating genetic disease risk and carrier probability
- Performing linkage analysis and gene mapping
- Understanding population genetics and allele frequencies
- Studying mutation types and effects
- Interpreting genetic test results
- Designing breeding strategies and genetic crosses

## Core Concepts

1. **Mendelian Inheritance**: Dominant, recessive, codominant patterns
2. **Genetic Linkage**: Recombination frequency, linkage disequilibrium
3. **Gene Mapping**: LOD scores, genetic distance, map units (cM)
4. **Mutation Types**: Point mutations, insertions, deletions, chromosomal aberrations
5. **Population Genetics**: Hardy-Weinberg equilibrium, allele frequencies
6. **Quantitative Genetics**: Heritability, breeding values, genetic variance
7. **Genetic Disorders**: Inheritance patterns of monogenic diseases
8. **Gene Expression**: Genotype-phenotype relationships
9. **Epistasis**: Gene-gene interactions and phenotypic effects
10. **Genetic Testing**: PCR, sequencing, array CGH interpretation

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from itertools import combinations

class MendelianGenetics:
    def __init__(self, gene_name: str):
        self.gene_name = gene_name

    def predict_offspring(self, parent1_genotype: str,
                         parent2_genotype: str) -> Dict:
        alleles1 = list(parent1_genotype)
        alleles2 = list(parent2_genotype)
        offspring = {}
        for a1 in alleles1:
            for a2 in alleles2:
                genotype = ''.join(sorted([a1, a2]))
                offspring[genotype] = offspring.get(genotype, 0) + 1
        total = sum(offspring.values())
        return {k: v/total for k, v in offspring.items()}

    def calculate_carrier_probability(self, affected_frequency: float,
                                     carrier_frequency: float) -> float:
        return 2 * np.sqrt(affected_frequency)  # Approximate for recessive

    def calculate_recurrence_risk(self, parent_genotypes: List[str],
                                affected_status: List[bool]) -> float:
        if all(affected_status):
            return 0.25  # Both parents carriers, affected child
        elif any(affected_status):
            return 0.0
        return 0.0  # Need more info

    def paternity_index(self, child_alleles: List[str],
                       alleged_father_alleles: List[str],
                       random_man_alleles: List[str]) -> float:
        prob_exclusion = 0.0
        prob_inclusion = 0.0
        for child in child_alleles:
            if child in alleged_father_alleles:
                prob_inclusion += 0.5
            if child in random_man_alleles:
                prob_exclusion += 0.5
        return prob_inclusion / prob_exclusion if prob_exclusion > 0 else float('inf')

class PopulationGenetics:
    def __init__(self, population: str):
        self.population = population

    def hardy_weinberg(self, allele_frequency_a: float) -> Dict:
        p = allele_frequency_a
        q = 1 - p
        return {
            'AA_frequency': p**2,
            'Aa_frequency': 2*p*q,
            'aa_frequency': q**2
        }

    def calculate_f_st(self, heterozygosity_loci: List[float],
                       heterozygosity_total: float) -> float:
        Hs = np.mean(heterozygosity_loci)
        return (heterozygosity_total - Hs) / heterozygosity_total

    def effective_population_size(self, ne_census: int,
                                 variance: float) -> float:
        return (4 * ne_census - 2) / (2 + variance)

    def allele_frequency_change(self, p0: float,
                               selection_coefficient: float,
                               generations: int) -> List[float]:
        p = p0
        frequencies = [p]
        for _ in range(generations):
            p = p / (1 - selection_coefficient * (1 - p))
            frequencies.append(p)
        return frequencies

    def inbreeding_coefficient(self, consanguinity: str) -> float:
        coefficients = {
            'first_cousins': 1/16,
            'second_cousins': 1/64,
            'uncle_niece': 1/4,
            'self': 1/4
        }
        return coefficients.get(consanguinity, 0.0)

class LinkageAnalysis:
    def __init__(self, chromosome: int):
        self.chromosome = chromosome

    def calculate_recombination_fraction(self, markers: List[str],
                                         genotypes_parent1: List[str],
                                         genotypes_parent2: List[str]) -> float:
        recombinations = 0
        total = len(markers) - 1
        for i in range(total):
            if genotypes_parent1[i] != genotypes_parent1[i+1]:
                recombinations += 1
            if genotypes_parent2[i] != genotypes_parent2[i+1]:
                recombinations += 1
        return recombinations / (2 * total)

    def lod_score(self, recombination_fraction: float,
                  theta: float = 0.5) -> float:
        likelihood_observed = (1 - theta) ** (1 - recombination_fraction) * \
                              theta ** recombination_fraction
        likelihood_null = 0.25
        return np.log10(likelihood_observed / likelihood_null)

    def predict_morgans(self, recombination_fraction: float) -> float:
        return -np.log10(1 - 2 * recombination_fraction) / 100

class GeneticTesting:
    def __init__(self, test_type: str):
        self.test_type = test_type

    def sensitivity_specificity(self, true_positives: int,
                                false_positives: int,
                                false_negatives: int,
                                true_negatives: int) -> Dict:
        sensitivity = true_positives / (true_positives + false_negatives)
        specificity = true_negatives / (true_negatives + false_positives)
        ppv = true_positives / (true_positives + false_positives)
        npv = true_negatives / (true_negatives + false_negatives)
        return {
            'sensitivity': sensitivity,
            'specificity': specificity,
            'positive_predictive_value': ppv,
            'negative_predictive_value': npv
        }

    def bayes_posterior(self, prior: float, likelihood_given_disease: float,
                       likelihood_given_no_disease: float) -> float:
        evidence = likelihood_given_disease * prior + \
                  likelihood_given_no_disease * (1 - prior)
        return (likelihood_given_disease * prior) / evidence

cross = MendelianGenetics("GeneA")
offspring = cross.predict_offspring("Aa", "Aa")
print(f"Offspring ratios: {offspring}")

hw = PopulationGenetics("European")
frequencies = hw.hardy_weinberg(0.01)
print(f"AA: {frequencies['AA_frequency']:.4f}, Aa: {frequencies['Aa_frequency']:.4f}")
```

## Best Practices

1. Confirm pedigree information and inheritance patterns before analysis
2. Use appropriate statistical methods for linkage analysis
3. Consider genetic heterogeneity in disease gene studies
4. Account for reduced penetrance in risk calculations
5. Validate genetic test results with orthogonal methods
6. Consider population allele frequencies in risk assessment
7. Use appropriate reference databases for variant interpretation
8. Account for consanguinity in rare disease diagnosis
9. Apply proper multiple testing corrections in GWAS
10. Maintain confidentiality in genetic information handling
