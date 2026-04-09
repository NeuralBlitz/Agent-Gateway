---
name: synthetic-biology
description: Engineering biological systems
license: MIT
compatibility: opencode
metadata:
  audience: synthetic biologists, engineers, researchers
  category: biology
---

## What I do

- Design and construct new biological parts
- Engineer metabolic pathways
- Create synthetic gene circuits
- Develop biosensors and therapeutics
- Program cells with new functions
- Apply design-build-test-learn cycles

## When to use me

- When engineering new biological functions
- When designing gene circuits
- When creating metabolic pathways
- When developing biosensors
- When programming cells
- When building synthetic organisms

## Key Concepts

### Design Principles

**Standardization**
- BioBricks: Standardized parts
- RFC standards: Assembly rules
- SBOL: Data exchange format

### Genetic Circuits

```python
# Example: Toggle switch design
class ToggleSwitch:
    """
    Bistable genetic switch.
    """
    def __init__(self):
        self.components = {
            'promoter1': 'Repressor 1',
            'promoter2': 'Repressor 2',
            'repressor1': 'Inhibits promoter2',
            'repressor2': 'Inhibits promoter1'
        }
    
    def states(self):
        return {
            'state_A': 'Repressor1 ON, Repressor2 OFF',
            'state_B': 'Repressor1 OFF, Repressor2 ON'
        }

# Circuit types
circuit_types = {
    'inverter': 'NOT gate',
    'amplifier': 'Signal enhancement',
    'oscillator': 'Repressible gene expression',
    'memory': 'State persistence',
    'logic_gates': 'AND, OR, NAND, NOR'
}
```

### Metabolic Engineering

- Pathway design
- Cofactor balancing
- Flux optimization
- Enzyme engineering
- Compartmentalization

### Applications

- Biofuels production
- Pharmaceutical synthesis
- Bioremediation
- Biosensors
- Therapeutic cells
- Living materials
