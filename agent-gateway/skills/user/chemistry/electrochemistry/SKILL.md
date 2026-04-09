---
name: electrochemistry
description: Study of chemical processes involving electron transfer, electrochemical cells, and electrode potentials
category: chemistry
keywords: [electrochemistry, redox reactions, electrodes, electrolysis, batteries, fuel cells, corrosion]
---

# Electrochemistry

## What I Do

Electrochemistry studies chemical reactions involving electron transfer at electrode surfaces. I cover redox chemistry, electrode potentials, electrochemical cells, electrolysis, batteries, fuel cells, corrosion mechanisms, and electrochemical analysis techniques. I help calculate cell potentials, design electrochemical systems, and understand electron transfer kinetics.

## When to Use Me

- Calculating cell potentials and thermodynamic feasibility
- Designing batteries and energy storage systems
- Understanding corrosion and protection methods
- Performing electrochemical synthesis
- Analyzing redox reactions and electron transfer
- Working with fuel cells and electrolysis
- Interpreting voltammetry and polarography data

## Core Concepts

1. **Redox Reactions**: Oxidation states, reducing agents, oxidizing agents
2. **Electrode Potentials**: Standard reduction potentials, Nernst equation
3. **Electrochemical Cells**: Galvanic/voltaic cells, electrolytic cells, cell notation
4. **Electrode Kinetics**: Butler-Volmer equation, Tafel equation, overpotential
5. **Batteries**: Li-ion, lead-acid, nickel-metal hydride, thermodynamics
6. **Fuel Cells**: Hydrogen fuel cells, PEMFC, SOFC, efficiency
7. **Corrosion**: Rusting, passivation, cathodic protection, galvanic series
8. **Electrolysis**: Faraday's laws, decomposition potential, overpotential
9. **Electroanalytical Techniques**: Potentiometry, voltammetry, amperometry
10. **Diffusion**: Fick's laws, diffusion layers, mass transport

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class ElectrochemicalCell:
    def __init__(self, anode_reaction: str, cathode_reaction: str,
                 e0_anode: float, e0_cathode: float):
        self.anode_reaction = anode_reaction
        self.cathode_reaction = cathode_reaction
        self.e0_anode = e0_anode
        self.e0_cathode = e0_cathode

    def calculate_cell_potential(self) -> float:
        return self.e0_cathode - self.e0_anode

    def calculate_delta_g(self, n_electrons: int) -> float:
        F = 96485  # Faraday constant C/mol
        E_cell = self.calculate_cell_potential()
        return -n_electrons * F * E_cell / 1000  # kJ/mol

    def nernst_equation(self, n_electrons: int, 
                       reaction_quotient: float,
                       temperature: float = 298.15) -> float:
        R = 8.314  # Gas constant J/mol·K
        E0 = self.calculate_cell_potential()
        return E0 - (R * temperature) / (n_electrons * 96485) * np.log(reaction_quotient)

    def calculate_capacity(self, mass: float, n_electrons: int) -> float:
        M = self._get_molar_mass()  # g/mol
        F = 96485  # C/mol
        return (mass / M) * n_electrons * F / 3600  # Ah

    def _get_molar_mass(self) -> float:
        return 100.0  # Placeholder

class Battery:
    def __init__(self, nominal_voltage: float, capacity_ah: float):
        self.nominal_voltage = nominal_voltage
        self.capacity_ah = capacity_ah
        self.energy_wh = nominal_voltage * capacity_ah

    def calculate_energy_density(self, mass_kg: float) -> float:
        return self.energy_wh / mass_kg  # Wh/kg

    def state_of_charge(self, current_load: float, 
                       time_hours: float) -> float:
        return 1.0 - (current_load * time_hours) / self.capacity_ah

    def battery_equivalent_circuit(self, ocv: float, 
                                   internal_resistance: float,
                                   load_current: float) -> float:
        return ocv - load_current * internal_resistance

    def estimate_cycle_life(self, dod: float, 
                          temperature: float) -> int:
        base_life = 1000
        dod_factor = 1.0 / dod
        temp_factor = np.exp(-0.05 * (temperature - 25))
        return int(base_life * dod_factor * temp_factor)

class Corrosion:
    def __init__(self, metal: str, e0_metal: float):
        self.metal = metal
        self.e0_metal = e0_metal

    def galvanic_series_position(self) -> str:
        series = ['Mg', 'Zn', 'Al', 'Cd', 'Fe', 'Ni', 'Cu', 'Ag', 'Au']
        return str(series.index(self.metal)) if self.metal in series else 'unknown'

    def corrosion_rate(self, icorr: float, equivalent_weight: float,
                      density: float) -> float:
        K = 0.1288  # mm·g/mA·cm·yr
        return K * icorr * equivalent_weight / density

    def protection_current(self, area: float, 
                          current_density: float) -> float:
        return area * current_density

li_ion = Battery(nominal_voltage=3.7, capacity_ah=2.5)
print(f"Energy: {li_ion.energy_wh} Wh")
print(f"Energy density: {li_ion.calculate_energy_density(0.05):.0f} Wh/kg")

cell = ElectrochemicalCell("Zn -> Zn2+ + 2e-", "Cu2+ + 2e- -> Cu", -0.76, 0.34)
print(f"Cell potential: {cell.calculate_cell_potential():.2f} V")
```

## Best Practices

1. Always reference standard electrode potentials (SHE scale)
2. Account for solution resistance and overpotential in cell calculations
3. Consider concentration effects using Nernst equation
4. Use proper reference electrodes for accurate measurements
5. Apply IR compensation in electrochemical experiments
6. Consider reaction kinetics and mass transport limitations
7. Validate battery models with experimental cycling data
8. Account for side reactions and Coulombic efficiency
9. Use proper safety protocols with reactive metals and electrolytes
10. Consider temperature effects on electrochemical processes
