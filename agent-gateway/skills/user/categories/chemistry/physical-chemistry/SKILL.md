---
name: Physical Chemistry
description: Physical chemistry including quantum chemistry, molecular structure, spectroscopy, thermodynamics, and reaction kinetics for chemistry research applications.
license: MIT
compatibility: python>=3.8
audience: physical-chemists, materials-scientists, researchers, students
category: chemistry
---

# Physical Chemistry

## What I Do

I provide comprehensive physical chemistry tools including quantum chemistry calculations, molecular orbital theory, spectroscopic analysis, chemical kinetics, surface chemistry, and electrochemistry for chemistry research applications.

## When to Use Me

- Molecular structure calculations
- Quantum chemistry simulations
- Spectroscopic interpretation
- Reaction rate predictions
- Surface science analysis
- Electrochemical systems

## Core Concepts

- **Quantum Chemistry**: Hartree-Fock, DFT, post-HF methods
- **Molecular Orbitals**: Hückel, ab initio, basis sets
- **Spectroscopy**: IR, UV-Vis, NMR, Raman
- **Chemical Kinetics**: Rate laws, Arrhenius equation
- **Surface Chemistry**: Adsorption, catalysis
- **Electrochemistry**: Redox, Nernst equation
- **Statistical Mechanics**: Partition functions
- **Thermodynamics**: Free energy, equilibria

## Code Examples

### Molecular Orbital Calculations

```python
import numpy as np

def huckel_method(hamiltonian_matrix):
    eigenvalues, eigenvectors = np.linalg.eigh(hamiltonian_matrix)
    return eigenvalues, eigenvectors

def build_huckel_matrix(adjacency_matrix, alpha=0, beta=-1):
    n = len(adjacency_matrix)
    H = np.full((n, n), alpha)
    for i in range(n):
        for j in range(n):
            if adjacency_matrix[i, j] == 1:
                H[i, j] = beta
    return H

adjacency_butadiene = np.array([
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 0, 1, 0]
])

H = build_huckel_matrix(adjacency_butadiene)
eigenvalues, eigenvectors = huckel_method(H)
print(f"MO energies (β units): {eigenvalues}")
```

### Spectroscopic Calculations

```python
def vibrational_frequency(mass_reduced, force_constant):
    k = force_constant
    mu = mass_reduced
    return (1 / (2 * np.pi)) * np.sqrt(k / mu)

def ir_intensity(dipole_derivative, reduced_mass):
    return (dipole_derivative**2) / reduced_mass

def electronic_transition_energy(HOMO_LUMO_gap):
    return HOMO_LUMO_gap

def uv_vis_wavelength(nm):
    hc = 1239.84  # eV·nm
    return hc / nm

def calculate_extinction_coefficient(molar_absorptivity, path_length=1):
    return molar_absorptivity * path_length

mu = 1.673e-27  # kg (proton mass)
k = 500  # N/m
freq = vibrational_frequency(mu, k)
print(f"Vibrational frequency: {freq:.2e} Hz")

wavelength = 200  # nm
energy = uv_vis_wavelength(wavelength)
print(f"Energy: {energy:.2f} eV")
```

### Chemical Kinetics

```python
def arrhenius_rate(k0, Ea, T):
    R = 8.314  # J/mol·K
    return k0 * np.exp(-Ea / (R * T))

def rate_law_concentration(order, k, concentrations):
    rate = k
    for i, conc in enumerate(concentrations):
        rate *= conc**order[i]
    return rate

def integrated_rate_law(t, k, initial_conc, order):
    if order == 0:
        return initial_conc - k * t
    elif order == 1:
        return initial_conc * np.exp(-k * t)
    elif order == 2:
        return initial_conc / (1 + k * t * initial_conc)

def activation_energy(t1, t2, k1, k2):
    return np.log(k2 / k1) / (1/t1 - 1/t2) * 8.314

T1, T2 = 298, 308
k0, Ea = 1e10, 50000
k298 = arrhenius_rate(k0, Ea, T1)
k308 = arrhenius_rate(k0, Ea, T2)
print(f"Rate constants: k298={k298:.4e}, k308={k308:.4e}")
```

### Electrochemistry

```python
def nernst_equation(E0, n, Q, T=298):
    R = 8.314
    F = 96485
    return E0 - (R * T / (n * F)) * np.log(Q)

def butler_volmer(i0, alpha_a, alpha_c, eta, n, T=298):
    R = 8.314
    F = 96485
    i = i0 * (np.exp(alpha_a * n * F * eta / (R * T)) - 
              np.exp(-alpha_c * n * F * eta / (R * T)))
    return i

def electrochemical_impedance(Rct, Cdl, omega):
    Z = Rct + 1 / (1/Rct + 1j * omega * Cdl)
    return Z

def diffusion_limited_current(D, n, A, C_bulk, delta):
    return n * F * A * D * C_bulk / delta

E0, n, Q = 0.76, 2, 1
E = nernst_equation(E0, n, Q)
print(f"Nernst potential: {E:.3f} V")
```

### Statistical Thermodynamics

```python
from scipy.special import spherical_jn

def partition_function_translational(V, m, T):
    R = 8.314
    h = 6.626e-34
    return V * (2 * np.pi * m * R * T / h**2)**1.5

def partition_function_vibrational(theta_v, T):
    return 1 / (1 - np.exp(-theta_v / T))

def partition_function_rotational(theta_r, T, symmetry_number=1):
    return T / (symmetry_number * theta_r)

def calculate_free_energy(G, H, S):
    return H - T * S

def calculate_entropy(S_trans, S_rot, S_vib, S_elec):
    return S_trans + S_rot + S_vib + S_elec

theta_v = 2260  # K for N2
T = 298
q_vib = partition_function_vibrational(theta_v, T)
print(f"Vibrational partition function: {q_vib:.4f}")
```

## Best Practices

1. **Convergence**: Check SCF and geometry convergence
2. **Basis Set**: Choose appropriate basis set
3. **Solvent Effects**: Include implicit solvent models
4. **Temperature**: Consider thermal corrections
5. **Method Validation**: Benchmark against experiments

## Common Patterns

```python
# Geometry optimization
def gradient_descent_geometry(forces, step_size=0.01):
    return step_size * forces

# Transition state search
def nudged_elastic_band(images, energies, forces):
    return new_images
```

## Core Competencies

1. Quantum chemistry methods
2. Molecular orbital theory
3. Spectroscopic interpretation
4. Chemical kinetics
5. Electrochemical systems
