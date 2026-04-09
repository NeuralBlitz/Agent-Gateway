---
name: evolution
description: Study of biological evolution, natural selection, speciation, and phylogenetics
category: biology
keywords: [evolution, natural selection, phylogenetics, speciation, adaptation, evolutionary biology]
---

# Evolution

## What I Do

Evolutionary biology studies the origin and descent of species, natural selection, and the processes that generate biological diversity. I cover natural selection, genetic drift, gene flow, mutation, speciation, phylogenetics, and evolutionary genetics. I help analyze phylogenetic relationships, calculate selection pressures, and understand adaptation.

## When to Use Me

- Building and interpreting phylogenetic trees
- Calculating natural selection and dN/dS ratios
- Understanding mechanisms of speciation
- Analyzing population genetic variation
- Studying adaptive evolution and convergence
- Dating evolutionary events (molecular clocks)
- Understanding coevolution and host-pathogen dynamics

## Core Concepts

1. **Natural Selection**: Directional, stabilizing, disruptive selection
2. **Genetic Drift**: Founder effect, bottleneck, random sampling
3. **Gene Flow**: Migration, admixture, population structure
4. **Mutation**: Source of genetic variation, mutation rates
5. **Speciation**: Allopatric, sympatric, parapatric mechanisms
6. **Phylogenetics**: Clades, monophyly, parsimony, likelihood methods
7. **Molecular Evolution**: dN/dS, positive selection, purifying selection
8. **Adaptive Radiation**: Ecological opportunity, character displacement
9. **Coevolution**: Predator-prey, host-parasite, mutualistic arms races
10. **Molecular Clock**: Mutation rate calibration, divergence dating

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from collections import Counter

class NaturalSelection:
    def __init__(self, species: str):
        self.species = species

    def calculate_fitness(self, phenotype_value: float,
                         optimum: float,
                         omega: float) -> float:
        return np.exp(-0.5 * ((phenotype_value - optimum) / omega)**2)

    def directional_selection_gradient(self, mean_phenotype: float,
                                       optimum: float,
                                       heritability: float,
                                       selection_strength: float) -> float:
        return heritability * selection_strength * (optimum - mean_phenotype)

    def calculate_response_to_selection(self, s: float,
                                        h2: float) -> float:
        R = s * h2  # Breeder's equation
        return R

    def equilibrium_allele_frequency(self, s: float,
                                     h: float) -> float:
        return s / (s + h * s)  # Approximate for recessive deleterious allele

    def fixation_probability(self, initial_freq: float,
                            selection_coefficient: float,
                            population_size: int) -> float:
        if selection_coefficient == 0:
            return initial_freq
        s = selection_coefficient
        N = population_size
        return (1 - np.exp(-2 * s * N * initial_freq)) / \
               (1 - np.exp(-4 * s * N))

class Phylogenetics:
    def __init__(self, alignment_file: str):
        self.alignment_file = alignment_file

    def calculate_pairwise_distance(self, seq1: str, seq2: str) -> float:
        mismatches = sum(1 for a, b in zip(seq1, seq2) if a != b)
        return mismatches / len(seq1)

    def calculate_kimura_distance(self, transitions: int,
                                  transversions: int,
                                  sites: int) -> float:
        K = -0.5 * np.log(1 - 2*P - Q) - 0.25 * np.log(1 - 2*Q)
        P = transitions / sites
        Q = transversions / sites
        return K

    def upgma_clustering(self, distances: Dict[Tuple, float]) -> Dict:
        clusters = {i: [i] for i in range(len(distances))}
        current_distances = distances.copy()
        tree = {}
        while len(clusters) > 1:
            min_pair = min(current_distances.keys(), 
                          key=lambda x: current_distances[x])
            cluster1, cluster2 = min_pair
            distance = current_distances[min_pair]
            new_cluster = f"node_{len(clusters)}"
            tree[new_cluster] = {
                'children': [cluster1, cluster2],
                'distance': distance / 2
            }
            clusters[new_cluster] = clusters[cluster1] + clusters[cluster2]
            del clusters[cluster1]
            del clusters[cluster2]
        return tree

    def calculate_divergence_time(self, d: float,
                                  mutation_rate: float) -> float:
        return d / (2 * mutation_rate)  # MYA (millions years ago)

    def likelihood_ratio_test(self, null_likelihood: float,
                             alt_likelihood: float) -> float:
        lr = 2 * (alt_likelihood - null_likelihood)
        df = 1  # Typically df=1 for nested models
        p_value = 1 - stats.chi2.cdf(lr, df)
        return {'test_statistic': lr, 'p_value': p_value}

class MolecularEvolution:
    def __init__(self, gene_name: str):
        self.gene_name = gene_name

    def calculate_dn_ds(self, dn: float, ds: float) -> float:
        return dn / ds if ds > 0 else float('inf')

    def calculate_synonymous_sites(self, sequence: str) -> int:
        codon_table = {
            'TTT': 1, 'TTC': 1, 'TTA': 0, 'TTG': 0,
            'TCT': 1, 'TCC': 1, 'TCA': 1, 'TCG': 1,
            'TAT': 0, 'TAC': 0, 'TAA': 0, 'TAG': 0,
            'TGT': 0, 'TGC': 0, 'TGA': 0, 'TGG': 0,
            'CTT': 1, 'CTC': 1, 'CTA': 1, 'CTG': 1,
            'CCT': 1, 'CCC': 1, 'CCA': 1, 'CCG': 1,
            'CAT': 0, 'CAC': 0, 'CAA': 0, 'CAG': 0,
            'CGT': 1, 'CGC': 1, 'CGA': 1, 'CGG': 1,
            'ATT': 1, 'ATC': 1, 'ATA': 1, 'ATG': 0,
            'ACT': 1, 'ACC': 1, 'ACA': 1, 'ACG': 1,
            'AAT': 0, 'AAC': 0, 'AAA': 0, 'AAG': 0,
            'AGT': 1, 'AGC': 1, 'AGA': 0, 'AGG': 0,
            'GTT': 1, 'GTC': 1, 'GTA': 1, 'GTG': 1,
            'GCT': 1, 'GCC': 1, 'GCA': 1, 'GCG': 1,
            'GAT': 0, 'GAC': 0, 'GAA': 0, 'GAG': 0,
            'GGT': 1, 'GGC': 1, 'GGA': 1, 'GGG': 1
        }
        syn_sites = 0
        for i in range(0, len(sequence), 3):
            codon = sequence[i:i+3]
            if len(codon) == 3:
                syn_sites += codon_table.get(codon, 0)
        return syn_sites

    def site_positive_selection(self, omega: float) -> str:
        if omega > 1:
            return "positive_selection"
        elif omega < 1:
            return "purifying_selection"
        return "neutral"

selection = NaturalSelection("DarwinFinches")
fitness = selection.calculate_fitness(12.5, optimum=12.0, omega=2.0)
print(f"Fitness: {fitness:.3f}")

phylo = Phylogenetics("mitochondrial.fasta")
dist = phylo.calculate_pairwise_distance("ATCGATCG", "ATCGATTA")
print(f"Distance: {dist:.4f}")
```

## Best Practices

1. Use appropriate molecular clock calibration points
2. Account for rate heterogeneity among sites and lineages
3. Validate phylogenetic methods with known relationships
4. Consider substitution model complexity vs. data support
5. Use proper outgroups for root placement
6. Apply bootstrap resampling for clade support
7. Consider population structure in evolutionary analysis
8. Distinguish between orthologs and paralogs in gene trees
9. Use multiple methods to test for selection
10. Consider fossil evidence for divergence dating
