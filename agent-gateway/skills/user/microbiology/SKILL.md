---
name: microbiology
description: Study of microorganisms
license: MIT
compatibility: opencode
metadata:
  audience: microbiologists, researchers, clinicians
  category: biology
---

## What I do

- Study microorganisms (bacteria, viruses, fungi, protists)
- Investigate microbial physiology and genetics
- Research microbial pathogenesis
- Analyze microbial ecology
- Develop antimicrobial strategies
- Apply microbiology to biotechnology

## When to use me

- When studying bacterial growth and metabolism
- When investigating microbial diseases
- When analyzing antimicrobial resistance
- When working with microbial cultures
- When studying microbial ecology
- When developing diagnostics or treatments

## Key Concepts

### Microbial Classification

**Bacteria**
- Gram-positive: Thick peptidoglycan layer
- Gram-negative: Outer membrane + thin peptidoglycan
- Shapes: Cocci, bacilli, spirilla

**Viruses**
- DNA viruses vs RNA viruses
- Enveloped vs non-enveloped
- Bacteriophages

**Fungi**
- Yeasts: Single-celled
- Molds: Multicellular filaments

### Microbial Growth

```python
# Example: Bacterial growth curve
def bacterial_growth(N0, mu, t):
    """
    Calculate bacterial population.
    N0: Initial cell count
    mu: Specific growth rate (1/h)
    t: Time (hours)
    """
    return N0 * np.exp(mu * t)

# Growth phases
growth_phases = {
    'lag': 'Adaptation, no division',
    'exponential': 'Active division, max rate',
    'stationary': 'Nutrient limitation, balanced',
    'death': 'Nutrient depletion, cell lysis'
}
```

### Microbial Metabolism

- Aerobic respiration: O₂ as electron acceptor
- Anaerobic respiration: Alternative acceptors
- Fermentation: Substrate-level phosphorylation
- Photosynthesis: Light energy capture
- Chemolithotrophy: Inorganic electron donors

### Pathogenesis

- Adhesion and colonization
- Toxin production
- Immune evasion
- Tissue invasion
- biofilm formation
