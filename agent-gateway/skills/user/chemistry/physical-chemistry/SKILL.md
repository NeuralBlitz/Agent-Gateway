---
name: physical-chemistry
description: Study of physical principles underlying chemical systems, thermodynamics, quantum mechanics, and kinetics
category: chemistry
keywords: [physical chemistry, thermodynamics, quantum mechanics, kinetics, spectroscopy, statistical mechanics]
---

# Physical Chemistry

## What I Do

Physical chemistry applies the principles of physics to understand chemical systems. I cover thermodynamics, statistical mechanics, quantum chemistry, chemical kinetics, electrochemistry, and spectroscopy. I help analyze energy changes, equilibrium states, reaction rates, molecular structure, and the fundamental properties of matter at atomic and molecular levels.

## When to Use Me

- Analyzing thermodynamic feasibility of reactions
- Understanding molecular structure through quantum mechanics
- Studying reaction kinetics and rate laws
- Interpreting spectroscopic data
- Calculating equilibrium constants and equilibrium concentrations
- Applying statistical mechanics to molecular systems
- Designing electrochemical cells and understanding redox processes

## Core Concepts

1. **Thermodynamics**: Laws of thermodynamics, enthalpy, entropy, Gibbs free energy, and spontaneity
2. **Quantum Mechanics**: Wave functions, operators, Schrödinger equation, and molecular orbitals
3. **Chemical Kinetics**: Rate laws, reaction mechanisms, Arrhenius equation, and activation energy
4. **Statistical Mechanics**: Partition functions, ensembles, and thermodynamic properties from molecular data
5. **Spectroscopy**: UV-Vis, IR, NMR, and quantum mechanical selection rules
6. **Electrochemistry**: Electrode potentials, Nernst equation, and galvanic/voltaic cells
7. **Equilibrium**: Chemical equilibrium, Le Chatelier's principle, and equilibrium constants
8. **Molecular Structure**: Bonding theories, hybridization, and molecular orbital theory
9. **Phase Transitions**: Phase diagrams, Clapeyron equation, and critical phenomena
10. **Solution Chemistry**: Activity, ionic strength, and Debye-Hückel theory

## Code Examples

```python
import numpy as np
from typing import Dict, Tuple, Callable

class Thermodynamics:
    def __init__(self, delta_h: float, delta_s: float, temp: float = 298.15):
        self.delta_h = delta_h
        self.delta_s = delta_s
        self.temp = temp

    def calculate_delta_g(self) -> float:
        return self.delta_h - self.temp * self.delta_s

    def equilibrium_constant(self, r_gas: float = 8.314) -> float:
        delta_g = self.calculate_delta_g()
        return np.exp(-delta_g / (r_gas * self.temp))

    def spontaneity_check(self) -> str:
        delta_g = self.calculate_delta_g()
        if delta_g < 0:
            return "spontaneous"
        elif delta_g > 0:
            return "non-spontaneous"
        return "equilibrium"

class QuantumChemistry:
    def __init__(self, mass: float = 9.109e-31, planck: float = 6.626e-34):
        self.m = mass
        self.h = planck

    def particle_in_box_energy(self, n: int, box_length: float) -> float:
        return (n**2 * self.h**2) / (8 * self.m * box_length**2)

    def hydrogen_wavefunction(self, n: int, l: int, m: int, r: float) -> complex:
        from scipy.special import spherical_yn, eval_hermite
        from mpmath import sqrt, exp, pi, factorial
        rho = 2 * r / n  # Bohr radius units
        radial = np.exp(-rho/2) * rho**l * eval_hermite(2*l+1, rho)
        normalization = sqrt(2/(n * factorial(2*l+1))) * (2/(n**(3/2)))
        return normalization * radial

    def calculate_spectral_line(self, energy_diff: float) -> float:
        return (energy_diff * 6.626e-34) / (3e8 * 6.626e-25)  # wavelength

thermo = Thermodynamics(delta_h=-285.8, delta_s=163.2)
print(f"ΔG: {thermo.calculate_delta_g():.2f} kJ/mol")
print(f"Keq: {thermo.equilibrium_constant():.2e}")
print(f"Reaction is: {thermo.spontaneity_check()}")
```

## Best Practices

1. Always use consistent units throughout thermodynamic calculations
2. Apply Hess's law and Born-Haber cycles for indirect enthalpy measurements
3. Consider temperature dependence of thermodynamic parameters
4. Use appropriate approximations (Born-Oppenheimer, Hartree-Fock) in quantum calculations
5. Validate kinetic models with experimental rate data
6. Account for non-ideal behavior in concentrated solutions
7. Use partition functions correctly for statistical mechanical calculations
8. Consider selection rules when interpreting spectroscopic data
9. Apply proper error analysis to experimental measurements
10. Use computational chemistry software for complex molecular calculations
