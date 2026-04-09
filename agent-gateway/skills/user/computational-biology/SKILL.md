---
name: computational-biology
description: Computational modeling of biological systems
license: MIT
compatibility: opencode
metadata:
  audience: computational biologists, researchers, modelers
  category: biology
---

## What I do

- Build computational models of biological systems
- Simulate cellular processes and pathways
- Analyze high-throughput biological data
- Predict gene regulatory networks
- Model population dynamics and evolution
- Develop algorithms for biological sequence analysis

## When to use me

- When building mathematical models of biological systems
- When simulating cellular signaling pathways
- When analyzing omics data (genomics, proteomics)
- When modeling disease progression
- When predicting gene regulatory networks
- When studying evolutionary dynamics

## Key Concepts

### Modeling Approaches

**Deterministic Models**
- Ordinary differential equations (ODEs)
- Partial differential equations (PDEs)
- Boolean networks
- Petri nets

**Stochastic Models**
- Gillespie algorithm
- Markov chains
- Monte Carlo simulations
- Agent-based models

### Gene Regulatory Networks

```python
# Example: Simple gene expression model
def gene_expression(mRNA, protein, params):
    """
    Model basic gene expression.
    k_tx: transcription rate
    k_tl: translation rate
    d_m: mRNA degradation rate
    d_p: protein degradation rate
    """
    dm_dt = params['k_tx'] - params['d_m'] * mRNA
    dp_dt = params['k_tl'] * mRNA - params['d_p'] * protein
    return dm_dt, dp_dt
```

### Popular Tools

- COPASI: Biochemical simulation
- PySB: Rule-based modeling
- BioNetGen: Rule-based network generation
- MCell: Monte Carlo cell simulation
- Smoldyn: Spatial stochastic simulation
- R/Bioconductor: Statistical analysis
