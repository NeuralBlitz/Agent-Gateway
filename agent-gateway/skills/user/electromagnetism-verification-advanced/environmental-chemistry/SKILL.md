---
name: environmental-chemistry
description: Chemistry of the environment
license: MIT
compatibility: opencode
metadata:
  audience: environmental chemists, researchers, scientists
  category: chemistry
---

## What I do

- Study chemical processes in natural environments
- Analyze pollutants and their transformations
- Investigate atmospheric chemistry
- Research water and soil chemistry
- Assess environmental contamination
- Develop remediation strategies

## When to use me

- When studying environmental pollution
- When analyzing water quality
- When investigating atmospheric chemistry
- When assessing contaminated sites
- When developing remediation strategies
- When studying biogeochemical cycles

## Key Concepts

### Environmental Chemistry

**Atmospheric Chemistry**
- Ozone formation/destruction
- Greenhouse gases (CO₂, CH₄, N₂O)
- Acid rain (SO₄²⁻, NOₓ)
- Particulate matter

**Water Chemistry**
- Dissolved oxygen
- pH and alkalinity
- Nutrients (N, P)
- Heavy metals
- Organic pollutants

### Pollutant Transformations

```python
# Example: First-order degradation
def pollutant_concentration(C0, k, t):
    """
    Calculate pollutant concentration over time.
    C0: Initial concentration
    k: First-order rate constant (1/s)
    t: Time (s)
    """
    return C0 * np.exp(-k * t)

def half_life(k):
    """Calculate half-life from rate constant."""
    return 0.693 / k
```

### Biogeochemical Cycles

- Carbon cycle
- Nitrogen cycle
- Phosphorus cycle
- Sulfur cycle
- Water cycle

### Remediation Technologies

- Bioremediation
- Phytoremediation
- Soil washing
- Air stripping
- Adsorption (activated carbon)
- Advanced oxidation processes
