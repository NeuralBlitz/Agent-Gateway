---
name: quantum-chemistry
description: Application of quantum mechanics to chemical systems, molecular structure, and chemical bonding
category: chemistry
keywords: [quantum chemistry, molecular orbital theory, wave functions, Schrödinger equation, computational chemistry]
---

# Quantum Chemistry

## What I Do

Quantum chemistry applies quantum mechanical principles to understand chemical bonding, molecular structure, and reactivity. I cover wave function theory, molecular orbital theory, Hartree-Fock methods, density functional theory, and computational approaches to solving the electronic Schrödinger equation. I help calculate molecular properties, spectra, and reaction pathways.

## When to Use Me

- Calculating molecular orbital energies and configurations
- Determining molecular geometry and vibrational frequencies
- Predicting spectroscopic properties and transition energies
- Understanding chemical bonding and electron distribution
- Performing computational chemistry calculations
- Optimizing molecular structures and transition states
- Calculating reaction energetics and barriers

## Core Concepts

1. **Wave Functions**: Born interpretation, normalization, and orthogonal functions
2. **Operators and Observables**: Hamiltonian, momentum, position operators
3. **Schrödinger Equation**: Time-independent and time-dependent formulations
4. **Atomic Orbitals**: Hydrogen atom solutions, quantum numbers, orbital shapes
5. **Molecular Orbital Theory**: LCAO approximation, bonding and antibonding orbitals
6. **Hartree-Fock Method**: Self-consistent field, electron correlation
7. **Density Functional Theory**: Exchange-correlation functionals, Kohn-Sham equations
8. **Basis Sets**: Gaussian-type orbitals, STO-nG, 6-31G*, cc-pVTZ
9. **Electron Correlation**: Configuration interaction, perturbation theory
10. **Molecular Properties**: Dipole moment, polarizability, spectroscopic constants

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class QuantumChemistry:
    def __init__(self, atomic_numbers: List[int], coordinates: np.ndarray):
        self.atomic_numbers = atomic_numbers
        self.coordinates = coordinates  # Angstroms
        self.num_electrons = sum(atomic_numbers) // 2

    def calculate_hückel_matrix(self) -> np.ndarray:
        n = len(self.atomic_numbers)
        H = np.zeros((n, n))
        alpha = -11.0  # Coulomb integral (eV)
        beta = -1.0    # Resonance integral (eV)
        for i in range(n):
            H[i, i] = alpha
            for j in range(i + 1, n):
                dist = np.linalg.norm(self.coordinates[i] - self.coordinates[j])
                if dist < 2.5:  # Adjacency threshold
                    H[i, j] = beta
                    H[j, i] = beta
        return H

    def hückel_eigenvalues(self) -> List[float]:
        H = self.calculate_hückel_matrix()
        eigenvalues = np.linalg.eigvalsh(H)
        return sorted(eigenvalues.tolist())

    def calculate_mo_energies(self, basis_size: int = 6) -> List[float]:
        energies = []
        for n in range(1, basis_size + 1):
            energy = -13.6 / n**2  # Hydrogen-like
            energies.append(energy)
        return energies

    def predict_uv_vis(self, transition_energies: List[float]) -> List[float]:
        hc = 1240  # eV·nm
        wavelengths = [hc / E for E in transition_energies]
        return wavelengths

    def calculate_dipole_moment(self, charges: np.ndarray, 
                                dipole_vector: np.ndarray) -> float:
        return np.linalg.norm(dipole_vector)

    def estimate_homo_lumo_gap(self, n_electrons: int, 
                              mo_energies: List[float]) -> float:
        if n_electrons <= len(mo_energies):
            lumo = mo_energies[n_electrons]
            homo = mo_energies[n_electrons - 1]
            return lumo - homo
        return 0.0

    def atomic_units_conversion(self, energy_ev: float) -> float:
        return energy_ev / 27.211  # Convert eV to Hartree

    def bohr_to_angstrom(self, bohr_radius: float) -> float:
        return bohr_radius * 0.529177

h2 = QuantumChemistry(atomic_numbers=[1, 1], 
                      coordinates=np.array([[0.0, 0.0, 0.0], 
                                            [0.74, 0.0, 0.0]]))
H = h2.calculate_hückel_matrix()
print(f"Hückel Matrix:\n{H}")
energies = h2.hückel_eigenvalues()
print(f"MO Energies (eV): {energies}")
```

## Best Practices

1. Choose appropriate basis sets for the system and property of interest
2. Consider electron correlation beyond Hartree-Fock for accuracy
3. Validate computational results against experimental data when available
4. Use proper convergence criteria for geometry optimizations
5. Account for solvation effects in condensed phase calculations
6. Use symmetry to reduce computational cost when applicable
7. Perform frequency calculations to verify stationary points
8. Consider relativistic effects for heavy atoms
9. Use composite methods (G2, G3, CBS) for high-accuracy thermochemistry
10. Document computational methods and parameters for reproducibility
