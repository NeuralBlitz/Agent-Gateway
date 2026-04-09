---
name: computational-chemistry
description: Computer simulation and modeling of chemical systems using molecular mechanics and quantum methods
category: chemistry
keywords: [computational chemistry, molecular modeling, molecular dynamics, docking, simulation, force fields]
---

# Computational Chemistry

## What I Do

Computational chemistry uses computer simulations to model chemical systems. I cover molecular mechanics, molecular dynamics, quantum mechanical calculations, molecular docking, QSAR, and chemoinformatics. I help design simulations, analyze trajectories, visualize molecular structures, and predict properties of chemical systems.

## When to Use Me

- Simulating protein-ligand binding and drug design
- Running molecular dynamics simulations
- Performing virtual screening and drug discovery
- Calculating solvation effects and free energies
- Analyzing molecular dynamics trajectories
- Building and optimizing molecular structures
- Developing quantitative structure-activity relationships

## Core Concepts

1. **Force Fields**: AMBER, CHARMM, OPLS, MMFF94 parameterization
2. **Molecular Dynamics**: Newton's equations, integrators, thermostats, barostats
3. **Energy Minimization**: Steepest descent, conjugate gradient, Newton-Raphson
4. **Monte Carlo Methods**: Metropolis algorithm, configurational sampling
5. **Molecular Docking**: Scoring functions, conformational sampling, induced fit
6. **Free Energy Calculations**: Thermodynamic integration, FEP, TI, MM/PBSA
7. **Conformational Analysis**: Cluster analysis, principal component analysis
8. **QSAR/QSPR**: Descriptor calculation, regression models, validation
9. **Chemoinformatics**: Fingerprints, similarity searching, library design
10. **Visualization**: RMSD, hydrogen bonding, solvent accessibility analysis

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from collections import defaultdict

class MolecularDynamics:
    def __init__(self, num_atoms: int, mass: np.ndarray, 
                 timestep: float = 0.001):
        self.num_atoms = num_atoms
        self.mass = mass
        self.timestep = timestep
        self.positions = np.zeros((num_atoms, 3))
        self.velocities = np.zeros((num_atoms, 3))
        self.forces = np.zeros((num_atoms, 3))

    def initialize_velocities(self, temperature: float) -> None:
        kb = 1.380649e-23
        for i in range(self.num_atoms):
            self.velocities[i] = np.random.normal(0, np.sqrt(kb * temperature / self.mass[i]), 3)

    def compute_bonded_energy(self, bonds: List[Tuple], 
                             angles: List[Tuple], 
                             dihedrals: List[Tuple]) -> float:
        Ebond = 0.0
        Eangle = 0.0
        for i, j, r0 in bonds:
            r = np.linalg.norm(self.positions[i] - self.positions[j])
            Ebond += 0.5 * 1000 * (r - r0)**2  # k_bond = 1000 kcal/mol/A^2
        for i, j, k, theta0 in angles:
            theta = self._calculate_angle(i, j, k)
            Eangle += 0.5 * 100 * (theta - theta0)**2  # k_angle = 100
        return Ebond + Eangle

    def _calculate_angle(self, i: int, j: int, k: int) -> float:
        v1 = self.positions[i] - self.positions[j]
        v2 = self.positions[k] - self.positions[j]
        cos_theta = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        return np.arccos(np.clip(cos_theta, -1, 1))

    def compute_nonbonded_energy(self, charges: np.ndarray, 
                                lj_params: Dict) -> float:
        Evdw = 0.0
        Eelec = 0.0
        cutoff = 12.0  # Angstroms
        for i in range(self.num_atoms):
            for j in range(i + 1, self.num_atoms):
                r = np.linalg.norm(self.positions[i] - self.positions[j])
                if r < cutoff:
                    sigma = (lj_params.get(i, 3.5) + lj_params.get(j, 3.5)) / 2
                    epsilon = (lj_params.get(f'eps_{i}', 0.1) * 
                              lj_params.get(f'eps_{j}', 0.1)) ** 0.5
                    Evdw += 4 * epsilon * ((sigma/r)**12 - (sigma/r)**6)
                    Eelec += 332.0 * charges[i] * charges[j] / r  # kcal/mol
        return Evdw + Eelec

    def verlet_integration(self) -> None:
        r = self.positions + self.velocities * self.timestep + \
            0.5 * self.forces / self.mass[:, np.newaxis] * self.timestep**2
        v_new = self.velocities + 0.5 * (self.forces / self.mass[:, np.newaxis]) * self.timestep
        self.positions = r
        self.velocities = v_new

    def analyze_trajectory(self, trajectory: np.ndarray) -> Dict:
        rmsd = []
        for frame in trajectory:
            rmsd.append(np.sqrt(np.mean((frame - trajectory[0])**2)))
        return {'rmsd': rmsd, 'max_rmsd': max(rmsd), 'mean_rmsd': np.mean(rmsd)}

class LigandDocking:
    def __init__(self, grid_size: float = 0.375, 
                 exhaustiveness: int = 32):
        self.grid_size = grid_size
        self.exhaustiveness = exhaustiveness

    def calculate_vina_score(self, ligand_coords: np.ndarray,
                            protein_coords: np.ndarray,
                            ligands: List) -> float:
        gauss1 = -0.035579  # weight for Gaussian term 1
        gauss2 = -0.005156  # weight for Gaussian term 2
        repulsion = 0.840245  # weight for repulsion term
        hydrophobic = -0.035069  # weight for hydrophobic term
        
        score = 0.0
        for atom in ligand_coords:
            for site in protein_coords[:50]:  # Binding site atoms
                r = np.linalg.norm(atom - site)
                if r < 9.0:
                    score += (gauss1 * np.exp(-(r/0.5)**2) + 
                             gauss2 * np.exp(-((r-3)/2)**2))
                    if r < 0.5:
                        score += repulsion / (r**2 + 0.001)
        return score

md = MolecularDynamics(num_atoms=1000, mass=np.ones(1000) * 12.0)
md.initialize_velocities(300)
print(f"Initialized velocities for {md.num_atoms} atoms")
```

## Best Practices

1. Validate force field parameters against experimental or high-level QM data
2. Use appropriate equilibration protocols before production runs
3. Check for convergence in free energy calculations
4. Apply periodic boundary conditions correctly for solvated systems
5. Use proper long-range electrostatics (PME, particle mesh Ewald)
6. Choose appropriate simulation timestep (2 fs for constrained bonds)
7. Perform sufficient sampling for reliable statistics
8. Account for protein flexibility in docking studies
9. Validate docking results with known actives and decoys
10. Use proper file formats and maintain simulation documentation
