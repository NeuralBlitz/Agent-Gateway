---
name: neurobiology
description: Study of the nervous system including neurons, synapses, brain function, and behavior
category: biology
keywords: [neurobiology, neurons, synapses, brain, neuroscience, action potentials, neurotransmitters]
---

# Neurobiology

## What I Do

Neurobiology studies the nervous system from molecular to systems level. I cover neuronal structure and function, synaptic transmission, neural circuits, brain regions, sensory systems, motor control, learning and memory, and neuropharmacology. I help understand brain function and neurological processes.

## When to Use Me

- Understanding neuronal electrophysiology
- Studying synaptic transmission and plasticity
- Analyzing neural circuit function
- Understanding sensory processing
- Studying learning and memory mechanisms
- Working with neurodegenerative diseases
- Developing neuropharmacology and drug targets

## Core Concepts

1. **Neuronal Structure**: Axons, dendrites, soma, myelin, synapses
2. **Action Potentials**: Sodium-potassium pumps, voltage-gated channels
3. **Synaptic Transmission**: Neurotransmitters, receptors, vesicle release
4. **Synaptic Plasticity**: LTP, LTD, long-term potentiation
5. **Neural Circuits**: Feedforward, feedback, oscillatory circuits
6. **Brain Regions**: Cortex, hippocampus, basal ganglia, cerebellum
7. **Sensory Systems**: Visual, auditory, somatosensory pathways
8. **Motor Control**: Corticospinal tract, basal ganglia loops
9. **Neurotransmitters**: Glutamate, GABA, dopamine, acetylcholine, serotonin
10. **Neuroplasticity**: Structural and functional brain changes

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class Electrophysiology:
    def __init__(self, neuron_type: str):
        self.neuron_type = neuron_type

    def calculate_membrane_potential(self, na_out: float,
                                    k_out: float,
                                    cl_out: float,
                                    na_in: float,
                                    k_in: float,
                                    cl_in: float) -> float:
        R = 8.314
        T = 310
        F = 96485
        E_na = (R * T / F) * np.log(na_out / na_in)
        E_k = (R * T / F) * np.log(k_out / k_in)
        E_cl = -(R * T / F) * np.log(cl_out / cl_in)
        P_na = 0.01
        P_k = 1.0
        P_cl = 0.45
        V_m = (P_na * E_na + P_k * E_k + P_cl * E_cl) / (P_na + P_k + P_cl)
        return V_m

    def nernst_potential(self, ion_out: float,
                        ion_in: float,
                        valence: int,
                        temperature: float = 310) -> float:
        R = 8.314
        F = 96485
        return (R * temperature / (valence * F)) * np.log(ion_out / ion_in)

    def ghk_equation(self, P_K: float, P_Na: float, P_Cl: float,
                    K_o: float, K_i: float,
                    Na_o: float, Na_i: float,
                    Cl_o: float, Cl_i: float) -> float:
        R = 8.314
        T = 310
        F = 96485
        term_K = P_K * K_o - P_K * K_i * np.exp(-F / (R * T) * 0.07)
        term_Na = P_Na * Na_o - P_Na * Na_i * np.exp(-F / (R * T) * 0.07)
        term_Cl = P_Cl * Cl_o * np.exp(-F / (R * T) * 0.07) - P_Cl * Cl_i
        return (R * T / F) * np.log(
            (term_K + term_Na) / (term_Cl + 1e-9)
        )

    def action_potential_threshold(self, v_rest: float,
                                   density_na: float,
                                   density_k: float) -> float:
        return v_rest + 10 / (density_na / density_k)

    def refractory_period(self, recovery_time: float,
                         temperature: float) -> float:
        q10 = 2.5  # Q10 for ion channel recovery
        return recovery_time / (q10 ** ((temperature - 37) / 10))

class SynapticTransmission:
    def __init__(self, synapse_type: str):
        self.synapse_type = synapse_type

    def calculate_epsp(self, neurotransmitter: float,
                      receptor_count: float,
                      ec50: float,
                      hill_coefficient: float) -> float:
        response = (neurotransmitter ** hill_coefficient) / \
                  (ec50 ** hill_coefficient + neurotransmitter ** hill_coefficient)
        return response * receptor_count

    def vesicle_release_probability(self, calcium_influx: float,
                                   calcium_sensitivity: float) -> float:
        return 1 / (1 + np.exp(-calcium_influx / calcium_sensitivity))

    def synaptic_delay(self, distance: float,
                      conduction_velocity: float) -> float:
        return distance / conduction_velocity

    def short_term_plasticity(self, baseline_release: float,
                             depression_factor: float,
                             facilitation_factor: float,
                             pulse_number: int) -> float:
        release_prob = baseline_release
        for i in range(pulse_number):
            release_prob *= depression_factor
            release_prob += facilitation_factor * (1 - release_prob)
        return release_prob

class NeuralCircuits:
    def __init__(self, circuit_name: str):
        self.circuit = circuit_name

    def calculate_gain(self, input_amplitude: float,
                      output_amplitude: float) -> float:
        return output_amplitude / input_amplitude

    def lateral_inhibition(self, center_excitation: float,
                          surround_inhibition: float,
                          inhibition_strength: float) -> float:
        return center_excitation - inhibition_strength * surround_inhibition

    def receptive_field_center(self, rf_surround: float,
                              center_weight: float) -> float:
        return rf_surround * center_weight

    def spike_timing_dependent_plasticity(self, pre_spike: float,
                                          post_spike: float,
                                          tau: float = 20) -> Dict:
        delta_t = pre_spike - post_spike
        if abs(delta_t) < tau:
            weight_change = np.exp(-abs(delta_t) / tau)
            if delta_t > 0:
                return {'LTP': weight_change, 'depression': 0}
            return {'depression': weight_change, 'LTP': 0}
        return {'LTP': 0, 'depression': 0}

class Neuropharmacology:
    def __init__(self, drug_class: str):
        self.drug_class = drug_class

    def receptor_occupancy(self, drug_concentration: float,
                          kd: float) -> float:
        return drug_concentration / (kd + drug_concentration)

    def ic50_conversion(self, Ki: float,
                       agonist_concentration: float) -> float:
        return Ki * (1 + agonist_concentration / 1000)  # Approximate

    def therapeutic_index(self, td50: float,
                         ed50: float) -> float:
        return td50 / ed50

    def calculate_ecg_interval(self, heart_rate: float) -> Dict:
        qt = 0.4 / np.sqrt(60 / heart_rate)
        return {
            'QT': qt,
            'QTc': qt + 0.1 * (60 / heart_rate - 1)
        }

neuro = Electrophysiology("Pyramidal")
E_na = neuro.nernst_potential(145, 15, 1)
E_k = neuro.nernst_potential(5, 150, 1)
print(f"E_Na: {E_na:.1f} mV, E_K: {E_k:.1f} mV")

syn = SynapticTransmission("Glutamatergic")
epsp = syn.calculate_epsp(100, 1000, 50, 2)
print(f"EPSP amplitude: {epsp:.1f} arbitrary units")
```

## Best Practices

1. Use appropriate controls in electrophysiological experiments
2. Account for temperature effects on neuronal properties
3. Consider brain slice vs in vivo preparation differences
4. Validate calcium imaging and optical methods properly
5. Use proper statistical methods for spike train analysis
6. Consider population vs single-neuron activity
7. Account for anesthesia effects in in vivo studies
8. Use proper virus injection titers for optogenetics
9. Validate antibody specificity in neuroanatomy
10. Follow ethical guidelines for animal research
