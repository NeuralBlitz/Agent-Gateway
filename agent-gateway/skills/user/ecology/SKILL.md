---
name: ecology
description: Interactions between organisms and environment
license: MIT
compatibility: opencode
metadata:
  audience: ecologists, environmental scientists, researchers
  category: biology
---

## What I do

- Study interactions between organisms and their environment
- Analyze population dynamics and species interactions
- Investigate ecosystem structure and function
- Research biodiversity and conservation
- Model ecological systems
- Assess environmental impacts

## When to use me

- When studying species interactions
- When analyzing population dynamics
- When investigating ecosystem processes
- When assessing environmental impact
- When modeling ecological systems
- When developing conservation strategies

## Key Concepts

### Population Ecology

**Population Growth Models**
- Exponential growth: dN/dt = rN
- Logistic growth: dN/dt = rN(1-N/K)
- Logistic with harvest

```python
# Example: Logistic growth model
def logistic_growth(N, r, K):
    """
    Calculate population growth rate.
    N: Population size
    r: Intrinsic growth rate
    K: Carrying capacity
    """
    return r * N * (1 - N / K)
```

### Species Interactions

- **Predation**: One benefits, one loses
- **Competition**: Both lose (resource limitation)
- **Mutualism**: Both benefit
- **Commensalism**: One benefits, neutral
- **Parasitism**: One benefits, one loses

### Ecosystem Components

**Abiotic Factors**
- Temperature, light, water
- Soil, nutrients, pH
- Climate, elevation

**Biotic Factors**
- Producers (autotrophs)
- Consumers (heterotrophs)
- Decomposers (saprotrophs)

### Ecological Levels

- Organism → Population → Community → Ecosystem → Biome → Biosphere
