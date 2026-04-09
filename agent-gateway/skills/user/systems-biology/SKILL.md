---
name: systems-biology
description: Modeling biological systems
license: MIT
compatibility: opencode
metadata:
  audience: systems biologists, computational biologists, researchers
  category: biology
---

## What I do

- Model and simulate biological systems
- Analyze omics data integration
- Study gene regulatory networks
- Investigate signaling pathways
- Apply network analysis
- Develop computational models

## When to use me

- When modeling cellular processes
- When analyzing high-throughput data
- When studying network dynamics
- When integrating multi-omics data
- When simulating biological systems
- When predicting system behavior

## Key Concepts

### Modeling Frameworks

**Mathematical Models**
- Ordinary differential equations (ODEs)
- Boolean networks
- Petri nets
- Agent-based models
- Constraint-based models

### Metabolic Modeling

```python
# Example: Flux Balance Analysis (FBA)
def fba(stoichiometry, objective, constraints):
    """
    Predict metabolic fluxes.
    S: Stoichiometric matrix
    v: Flux vector
    maximize: c^T v
    subject to: S·v = 0, lb ≤ v ≤ ub
    """
    # Linear programming problem
    # Maximize objective function
    # Subject to mass balance and capacity constraints
    return optimize.linprog(objective, bounds=constraints)

# Key components
fba_components = {
    'stoichiometric_matrix': 'S[m×n] - m metabolites, n reactions',
    'objective_function': 'c^T v - typically biomass production',
    'constraints': 'lb ≤ v ≤ ub - reaction bounds'
}
```

### Network Analysis

- Topology: Degree distribution, betweenness
- Motifs: Feed-forward loops, feedback loops
- Robustness: Redundancy, modularity
- Dynamics: Stability, oscillations

### Data Integration

- Genomics: Gene content
- Transcriptomics: Gene expression
- Proteomics: Protein abundance
- Metabolomics: Metabolic state
- Fluxomics: Reaction rates

### Tools

- COBRA: Constraint-based reconstruction
- COPASI: Biochemical simulation
- PySB: Rule-based modeling
- CellDesigner: Pathway diagrams
- Cytoscape: Network visualization
