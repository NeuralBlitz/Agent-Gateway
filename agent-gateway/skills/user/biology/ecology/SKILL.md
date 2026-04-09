---
name: ecology
description: Study of interactions between organisms and their environment, ecosystems, and populations
category: biology
keywords: [ecology, ecosystems, populations, communities, biodiversity, food webs, conservation]
---

# Ecology

## What I Do

Ecology studies interactions between organisms and their environment at various scales. I cover population dynamics, community structure, ecosystem function, biogeography, behavioral ecology, and conservation biology. I help analyze species distributions, model population growth, and understand ecological relationships.

## When to Use Me

- Modeling population growth and dynamics
- Analyzing community structure and diversity
- Studying predator-prey and competitive interactions
- Assessing ecosystem productivity and energy flow
- Evaluating biodiversity and conservation status
- Studying habitat selection and species distribution
- Understanding nutrient cycling and ecosystem services

## Core Concepts

1. **Population Growth**: Exponential, logistic, density-dependence
2. **Community Ecology**: Species diversity, richness, evenness
3. **Ecosystem Ecology**: Energy flow, nutrient cycling, productivity
4. **Behavioral Ecology**: Foraging, mating strategies, social behavior
5. **Food Webs**: Trophic levels, energy transfer efficiency
6. **Biodiversity**: Alpha, beta, gamma diversity indices
7. **Species Interactions**: Competition, predation, mutualism, parasitism
8. **Ecosystem Services**: Provisioning, regulating, supporting services
9. **Conservation Biology**: Endangered species, habitat fragmentation
10. **Biogeography**: Island biogeography, range distributions

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class PopulationEcology:
    def __init__(self, species: str, carrying_capacity: float):
        self.species = species
        self.K = carrying_capacity

    def exponential_growth(self, initial_pop: float,
                          rate: float,
                          time: float) -> float:
        return initial_pop * np.exp(rate * time)

    def logistic_growth(self, initial_pop: float,
                       rate: float,
                       time: float) -> float:
        N0 = initial_pop
        K = self.K
        r = rate
        return K / (1 + ((K - N0) / N0) * np.exp(-r * time))

    def calculate_growth_rate(self, N1: float, N2: float,
                              dt: float) -> float:
        return (np.log(N2) - np.log(N1)) / dt

    def density_dependence(self, N: float,
                          r: float,
                          alpha: float) -> float:
        return r * (1 - N / self.K) - alpha * (N / self.K)**2

    def carrying_capacity_estimation(self, populations: List[float],
                                     growth_rates: List[float]) -> float:
        return np.mean([p * r for p, r in zip(populations, growth_rates)])

    def population_viability_analysis(self, N0: float,
                                      lambda_rate: float,
                                      generations: int,
                                      catastrophe_prob: float) -> Dict:
        N = N0
        extinction_prob = 0.0
        for gen in range(generations):
            if np.random.random() < catastrophe_prob:
                N *= 0.1  # Severe reduction
            else:
                N *= lambda_rate
            if N < 1:
                extinction_prob += (1 - extinction_prob) * (1 / (gen + 1))
        return {'extinction_probability': extinction_prob}

class CommunityEcology:
    def __init__(self, community_name: str):
        self.community = community_name

    def calculate_diversity_indices(self, abundances: List[int]) -> Dict:
        total = sum(abundances)
        proportions = [a / total for a in abundances]
        H = -sum(p * np.log(p) for p in proportions if p > 0)
        D = sum(p**2 for p in proportions)
        S = len(abundances)
        J = H / np.log(S) if S > 0 else 0
        return {
            'shannon_H': H,
            'simpson_D': D,
            'species_richness_S': S,
            'pielou_evenness_J': J
        }

    def simpson_diversity(self, species_counts: List[int]) -> float:
        N = sum(species_counts)
        return 1 - sum(n * (n - 1) for n in species_counts) / (N * (N - 1))

    def beta_diversity(self, community1: List[int],
                      community2: List[int]) -> float:
        species_shared = len([1 for s in community1 if s > 0 and s < len(community2) and community2[s-1] > 0])
        species_total = len([1 for s in community1 if s > 0]) + \
                       len([1 for s in community2 if s > 0])
        return species_shared / species_total

    def rank_abundance_curve(self, abundances: List[float]) -> List[float]:
        return sorted(abundances, reverse=True)

class EcosystemEcology:
    def __init__(self, ecosystem: str):
        self.ecosystem = ecosystem

    def calculate_npp(self, gpp: float, ra: float) -> float:
        return gpp - ra  # Net Primary Production

    def energy_transfer_efficiency(self, production_next: float,
                                  production_current: float) -> float:
        return production_next / production_current * 100

    def calculate_biomass_accumulation(self, npp: float,
                                       turnover_rate: float) -> float:
        return npp / turnover_rate

    def nutrient_limitation(self, nitrogen: float,
                          phosphorus: float,
                          kn: float,
                          kp: float) -> Dict:
        limitation = np.sqrt(nitrogen / kn) * np.sqrt(phosphorus / kp)
        if nitrogen / kn < phosphorus / kp:
            limiting_nutrient = "nitrogen"
        else:
            limiting_nutrient = "phosphorus"
        return {'limitation_index': limitation, 'limiting_nutrient': limiting_nutrient}

    def calculate_lei(self, actual_et: float, potential_et: float) -> float:
        return actual_et / potential_et  # Landscape Evapotranspiration Index

class SpeciesDistribution:
    def __init__(self, species: str):
        self.species = species

    def habitat_suitability(self, temperature: float,
                           precipitation: float,
                           elevation: float) -> float:
        opt_temp = 20 + np.random.uniform(-5, 5)
        opt_precip = 1000 + np.random.uniform(-200, 200)
        temp_suit = np.exp(-((temperature - opt_temp) / 10)**2)
        precip_suit = np.exp(-((precipitation - opt_precip) / 200)**2)
        return temp_suit * precip_suit

    def calculate_range_area(self, occurrences: np.ndarray) -> float:
        convex_hull = occurrences
        return len(occurrences) * 0.1  # Simplified

pop = PopulationEcology("SnowshoeHare", 10000)
N = pop.logistic_growth(100, 0.5, 10)
print(f"Population after 10 generations: {N:.0f}")

comm = CommunityEcology("TemperateForest")
diversity = comm.calculate_diversity_indices([50, 30, 15, 5])
print(f"Shannon H: {diversity['shannon_H']:.2f}")
```

## Best Practices

1. Use appropriate spatial and temporal scales in ecological studies
2. Account for detection probability in species surveys
3. Consider environmental stochasticity in population models
4. Validate models with independent data when possible
5. Use proper sampling design for community analysis
6. Consider source-sink dynamics in metapopulations
7. Account for temporal autocorrelation in time series
8. Use multiple diversity measures for comprehensive assessment
9. Consider edge effects in fragmented habitats
10. Document data collection methods for reproducibility
