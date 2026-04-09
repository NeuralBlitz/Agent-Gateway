---
name: polymer-chemistry
description: Chemistry of polymers
license: MIT
compatibility: opencode
metadata:
  audience: polymer chemists, materials scientists, researchers
  category: chemistry
---

## What I do

- Study polymer synthesis and characterization
- Analyze polymer structure-property relationships
- Research polymer physics and mechanics
- Develop new polymer materials
- Investigate polymer processing
- Study polymer degradation and stability

## When to use me

- When synthesizing polymers
- When analyzing molecular weight
- When studying polymer properties
- When designing polymeric materials
- When investigating polymer processing
- When researching biodegradable polymers

## Key Concepts

### Polymerization Methods

**Step-Growth**
- Condensation polymerization
- Requires difunctional monomers
- Molecular weight increases slowly
- M_n ~ 1/(1-p)

**Chain-Growth**
- Free radical, ionic, coordination
- Rapid molecular weight build-up
- Active center propagation

```python
# Example: Degree of polymerization
def degree_of_polymerization(conversion, functionality):
    """
    Calculate X_n for step-growth.
    conversion: p (0-1)
    functionality: f (functionality)
    """
    return 1 / (1 - conversion)

# Molecular weight distributions
def number_average_mn(degree_polymerization, monomer_mw):
    """M_n = X_n × M_0"""
    return degree_polymerization * monomer_mw

def weight_average_mw(degree_polymerization, monomer_mw, mw_dist):
    """M_w = Σ(N_i × M_i²) / Σ(N_i × M_i)"""
    # Polydispersity index: PDI = M_w/M_n
    return degree_polymerization * monomer_mw * mw_dist
```

### Polymer Properties

- Glass transition temperature (Tg)
- Melting temperature (Tm)
- Crystallinity
- Molecular weight (Mn, Mw)
- Polydispersity index
- Mechanical properties

### Important Polymers

- Polyethylene (PE): Packaging
- Polypropylene (PP): Automotive
- Polystyrene (PS): Insulation, foam
- Polyvinyl chloride (PVC): Construction
- Polyethylene terephthalate (PET): Fibers, bottles
- Polytetrafluoroethylene (PTFE): Non-stick
