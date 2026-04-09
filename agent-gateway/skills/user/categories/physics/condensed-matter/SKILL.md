---
name: Condensed Matter Physics
description: Condensed matter physics including crystal structures, electronic band theory, superconductivity, magnetism, and semiconductor physics for materials science applications.
license: MIT
compatibility: python>=3.8
audience: condensed-matter-physicists, materials-scientists, researchers
category: physics
---

# Condensed Matter Physics

## What I Do

I provide comprehensive condensed matter physics tools including crystal structure analysis, electronic band theory, superconductivity, magnetism, and semiconductor physics for materials science applications.

## When to Use Me

- Crystal structure analysis
- Electronic band calculations
- Superconducting material properties
- Magnetic material behavior
- Semiconductor device design
- Phonon dispersion calculations

## Core Concepts

- **Crystal Lattices**: Bravais lattices, Miller indices
- **Band Theory**: Bloch theorem, band gaps, DOS
- **Superconductivity**: BCS theory, Ginzburg-Landau
- **Magnetism**: Ferromagnetism, antiferromagnetism
- **Phonons**: Lattice vibrations, thermal conductivity
- **Semiconductors**: Doping, heterostructures
- **Topological Phases**: Berry phase, Chern numbers
- **Strong Correlation**: Hubbard model, Mott insulators

## Code Examples

### Crystal Structure

```python
import numpy as np

def reciprocal_lattice(a1, a2, a3):
    V = np.dot(a1, np.cross(a2, a3))
    b1 = 2 * np.pi * np.cross(a2, a3) / V
    b2 = 2 * np.pi * np.cross(a3, a1) / V
    b3 = 2 * np.pi * np.cross(a1, a2) / V
    return b1, b2, b3

def miller_indices(h, k, l, a):
    d = a / np.sqrt(h**2 + k**2 + l**2)
    return d

def bragg_angle(d, lambda_):
    return np.arcsin(lambda_ / (2 * d))

a = 4.0  # Angstroms
h, k, l = 1, 1, 1
d = miller_indices(h, k, l, a)
print(f"d-spacing for (111): {d:.4f} Angstroms")

a1 = np.array([a, 0, 0])
a2 = np.array([0, a, 0])
a3 = np.array([0, 0, a])
b1, b2, b3 = reciprocal_lattice(a1, a2, a3)
print(f"Reciprocal lattice vectors: {b1}")
```

### Band Theory

```python
def free_electron_energy(k, m):
    hbar = 1.055e-34
    return hbar**2 * np.dot(k, k) / (2 * m)

def nearly_free_electron(k, G, V_G, a):
    return hbar**2 * k**2 / (2*m) + V_G * np.cos(np.dot(G, k) * a)

def tight_binding_hopping(t, k, a):
    return -2 * t * np.cos(np.dot(k, a))

def density_of_states(E, E_F, sigma):
    return np.exp(-(E - E_F)**2 / (2*sigma**2)) / (sigma * np.sqrt(2*np.pi))

def berry_phase(A_k):
    return np.sum(A_k) % (2*np.pi)

def zak_phase(A_k):
    return np.imag(np.sum(np.log(A_k)))

def chern_number(berry_curvature):
    return int(np.sum(berry_curvature) / (2*np.pi))
```

### Superconductivity

```python
def bc_gap_delta(T, Tc, delta0=1.76):
    if T >= Tc:
        return 0
    return delta0 * np.sqrt(1 - (T/Tc)**3)

def london_penetration_depth(lambda_L, n_s, m):
    mu0 = 4e-7 * np.pi
    return np.sqrt(m / (mu0 * n_s * e**2))

def critical_field_hc(T, Tc, hc0):
    return hc0 * (1 - (T/Tc)**2)

def superconducting_energy_gap(delta, V=1):
    return 2 * delta

def ginzburg_landau_coherence_length(xi, Tc, m, hbar):
    return xi

def abrikosov_vortex_lattice(nu, H):
    return nu * H

T = 4.0
Tc = 9.2
delta = bc_gap_delta(T, Tc)
print(f"Gap at T=4K: {delta:.4f} meV")
```

### Magnetism

```python
def exchange_energy(J, S1, S2):
    return -2 * J * np.dot(S1, S2)

def zeeman_energy(g, mu_B, B, S):
    return -g * mu_B * np.dot(B, S)

def curie_temperature(J, z, S):
    return 2 * z * J * S * (S + 1) / (3 * k_B)

def susceptibility_chi(C, T):
    return C / T

def langevin_function(x):
    return coth(x) - 1/x

def brillouin_function(J, x):
    return (2*J + 1)/(2*J) * coth((2*J+1)*x/2) - 1/(2*J) * coth(x/2)

def neutron_scattering_factor(F_hkl):
    return np.sum(b_j * np.exp(2*np.pi*i * (h*x_j + k*y_j + l*z_j)))

J = 0.5
z = 8
S = 0.5
k_B = 8.617e-5  # eV/K
Tc = 2 * z * J * S * (S + 1) / (3 * k_B)
print(f"Curie temperature: {Tc:.1f} K")
```

### Semiconductor Physics

```python
def effective_mass(m*, m_e):
    return m* / m_e

def carrier_concentration(ni, T):
    return ni

def intrinsic_carrier_concentration(Eg, T, Nc, Nv):
    k_B = 8.617e-5
    return np.sqrt(Nc * Nv) * np.exp(-Eg / (2 * k_B * T))

def fermi_level(Eg, ni, N_d, N_a):
    return Eg/2 + k_B * T * np.log(N_d/N_a)

def mobility_mu(E, T, mu0):
    return mu0 * (T/T0)**alpha

def hall_coefficient(RH, p, n, mu_p, mu_n):
    return 1 / (p * e) * (1 - (n * mu_n**2) / (p * mu_p**2 + n * mu_n**2))

def bandgap_narrowing(delta_Eg, N):
    return delta_Eg * (N / N0)**(1/2)

Eg = 1.12  # eV for Si
T = 300
ni = intrinsic_carrier_concentration(Eg, T, 2.8e19, 1.04e19)
print(f"Intrinsic carrier concentration: {ni:.2e} cm^-3")
```

## Best Practices

1. **Periodic Boundary Conditions**: Use for infinite crystals
2. **K-point Sampling**: Ensure convergence
3. **Temperature Effects**: Include thermal expansion
4. **Spin-Orbit Coupling**: Important for heavy elements
5. ** Hubbard U**: Use DFT+U for correlated systems

## Common Patterns

```python
# Wannier functions
def maximally_localized_wannier():
    pass

# DFTB calculations
def density_functional_tight_binding():
    pass
```

## Core Competencies

1. Crystal structure and symmetry
2. Electronic band structure
3. Superconductivity theory
4. Magnetic properties
5. Semiconductor physics
