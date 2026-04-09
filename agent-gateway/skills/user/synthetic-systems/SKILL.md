---
name: synthetic-systems
description: Engineering synthetic biological systems
license: MIT
compatibility: opencode
metadata:
  audience: synthetic biologists, systems biologists, researchers
  category: biology
---

## What I do

- Design complex synthetic biological systems
- Model and simulate engineered networks
- Integrate multiple subsystems
- Optimize system performance
- Apply systems engineering principles
- Build toward synthetic life

## When to use me

- When designing complex gene networks
- When modeling synthetic systems
- When integrating multiple components
- When optimizing engineered pathways
- When building diagnostic devices
- When creating engineered organisms

## Key Concepts

### Systems Engineering

**Design-Build-Test-Learn (DBTL)**
- Design: Computational modeling
- Build: DNA synthesis, assembly
- Test: Experimental characterization
- Learn: Data analysis, iteration

### Modeling Approaches

```python
# Example: ODE model for synthetic gene circuit
def gene_circuit_model(y, t, params):
    """
    d[protein]/dt = k_transcription * promoter - k_translation * protein
    """
    mRNA, protein = y
    
    # Parameters
    alpha_m, alpha_p, delta_m, delta_p = params
    
    # Equations
    dm_dt = alpha_m - delta_m * mRNA
    dp_dt = alpha_p * mRNA - delta_p * protein
    
    return [dm_dt, dp_dt]

# Simulation
from scipy.integrate import odeint
t = np.linspace(0, 100, 1000)
solution = odeint(gene_circuit_model, [0, 0], t, args=(params,))
```

### Abstraction Levels

- Parts: Promoters, RBS, terminators
- Devices: Combinational circuits
- Systems: Integrated functions
- Chassis: Host organisms

### Standardization

- BBParts: Registry of standard parts
- Golden Gate: Type IIS assembly
- Gibson: Overlap-based assembly
- PCR: Amplification
- DNA synthesis: Gene synthesis

### Applications

- Programmable therapeutics
- Biosensors
- Bioprocess optimization
- Engineered metabolism
- Artificial cells
- Synthetic ecosystems
