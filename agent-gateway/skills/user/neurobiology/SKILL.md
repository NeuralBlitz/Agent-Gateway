---
name: neurobiology
description: Nervous system biology
license: MIT
compatibility: opencode
metadata:
  audience: neurobiologists, researchers, students
  category: biology
---

## What I do

- Study nervous system structure and function
- Investigate neuronal communication
- Analyze neural development
- Research synaptic transmission
- Study brain circuits and behavior
- Investigate neural disorders

## When to use me

- When studying neuron structure and function
- When analyzing synaptic transmission
- When investigating neural development
- When researching neurological disorders
- When studying brain-behavior relationships
- When working with neural tissues

## Key Concepts

### Neuron Structure

- **Soma**: Cell body, contains nucleus
- **Dendrites**: Receive signals
- **Axon**: Conducts signals away
- **Axon terminals**: Release neurotransmitters
- **Myelin**: Insulation, saltatory conduction

### Action Potential

```python
# Simplified action potential model
def action_potential(V, thresholds):
    """
    Model neuron firing.
    V: Membrane potential (mV)
    thresholds: Resting ~-70mV, firing ~-55mV
    """
    if V < -55:
        return 'resting'
    elif -55 <= V < 30:
        return 'depolarization'
    elif 30 >= V >= -70:
        return 'repolarization'
    else:
        return 'refractory'

# Ion channels involved
channels = {
    'depolarization': 'Na+ channels open',
    'repolarization': 'K+ channels open',
    'refractory': 'Na+ channels inactivated'
}
```

### Synaptic Transmission

1. Action potential arrives at terminal
2. Ca²⁺ influx triggers vesicle fusion
3. Neurotransmitter release into synapse
4. Binding to postsynaptic receptors
5. Ion channel opening/closing
6. Signal termination (reuptake, degradation)

### Neurotransmitters

- **Excitatory**: Glutamate, acetylcholine
- **Inhibitory**: GABA, glycine
- **Modulatory**: Dopamine, serotonin, norepinephrine
- **Neuropeptides**: Substance P, endorphins
