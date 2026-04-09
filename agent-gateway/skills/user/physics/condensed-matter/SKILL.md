---
name: condensed-matter
description: Condensed matter physics including crystal structures, electronic band theory, superconductivity, magnetism, and semiconductor physics for materials science applications.
category: physics
tags:
  - physics
  - condensed-matter
  - crystal-structures
  - band-theory
  - superconductivity
  - magnetism
  - semiconductors
  - solid-state
difficulty: advanced
author: neuralblitz
---

# Condensed Matter Physics

## What I do

I provide comprehensive expertise in condensed matter physics, the study of macroscopic quantum phenomena in solids and liquids. I enable you to analyze crystal structures and diffraction, understand electronic band theory and transport, study superconductivity and magnetism, model semiconductor devices, and apply condensed matter concepts to materials science. My knowledge spans from foundational solid-state physics to topological phases essential for electronics, quantum computing, and materials research.

## When to use me

Use condensed matter physics when you need to: analyze crystal structures and lattice dynamics, calculate electronic band structures, design semiconductor devices, understand superconductivity and Josephson effects, model magnetic properties of materials, analyze transport phenomena, study topological insulators and quantum Hall effect, or develop new materials with specific properties.

## Core Concepts

- **Crystal Structures**: Periodic arrangements of atoms with Bravais lattices, unit cells, and symmetry operations.
- **Reciprocal Lattice**: Fourier transform of real-space lattice governing diffraction and Brillouin zones.
- **Band Theory**: Electronic energy levels forming bands (valence, conduction) with band gaps.
- **Bloch's Theorem**: Wave functions in periodic potentials as plane waves modulated by lattice-periodic functions.
- **Drude Model**: Classical description of electron transport with relaxation time approximation.
- **Fermi-Dirac Statistics**: Electron occupation of states at T > 0 with Fermi-Dirac distribution.
- **Superconductivity**: Zero resistance and Meissner effect below critical temperature with Cooper pairs.
- **Magnetism**: Diamagnetism, paramagnetism, ferromagnetism, and antiferromagnetism from electron spins.
- **Phonons**: Quantized lattice vibrations carrying heat and mediating electron interactions.
- **Topological Phases**: Protected surface states and edge modes from topological band invariants.

## Code Examples

### Crystal Structures and Reciprocal Lattice

```python
import numpy as np

def fcc_lattice(a):
    """Face-centered cubic lattice points."""
    return np.array([
        [0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5],
        [0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5], [0.5, 0.5, 0.5]
    ]) * a

def bcc_lattice(a):
    """Body-centered cubic lattice points."""
    return np.array([[0, 0, 0], [0.5, 0.5, 0.5]]) * a

def reciprocal_lattice_vectors(a1, a2, a3):
    """Calculate reciprocal lattice vectors."""
    V = np.dot(a1, np.cross(a2, a3))
    b1 = 2 * np.pi * np.cross(a2, a3) / V
    b2 = 2 * np.pi * np.cross(a3, a1) / V
    b3 = 2 * np.pi * np.cross(a1, a2) / V
    return b1, b2, b3

# Silicon diamond structure
def diamond_structure(a):
    """Diamond cubic structure (Si, Ge)."""
    fcc = fcc_lattice(a)
    tetrahedral = fcc + np.array([0.25, 0.25, 0.25]) * a
    return np.vstack([fcc, tetrahedral])

# Miller indices
def miller_spacing(h, k, l, a):
    """d-spacing for cubic crystal."""
    return a / np.sqrt(h**2 + k**2 + l**2)

print("Crystal structures:")
print(f"  Si lattice constant: 5.43 Å")
print(f"  GaAs lattice constant: 5.65 Å")
for hkl in [(1,0,0), (1,1,0), (1,1,1)]:
    d = miller_spacing(*hkl, 5.43)
    print(f"  ({hkl[0]}{hkl[1]}{hkl[2]}): d = {d:.3f} Å")

# Reciprocal lattice for fcc
a1 = np.array([a, 0, 0])
a2 = np.array([0, a, 0])
a3 = np.array([0, 0, a])
b1, b2, b3 = reciprocal_lattice_vectors(a1, a2, a3)
print(f"\nFCC reciprocal lattice (becomes bcc):")
print(f"  b1 = {b1}")
print(f"  b2 = {b2}")
```

### Band Theory and Fermi Surface

```python
import numpy as np

def free_electron_energy(k, m_eff):
    """E = ℏ²k²/2m*"""
    hbar = 1.055e-34
    return hbar**2 * k**2 / (2 * m_eff * 9.11e-31)

def fermi_energy(n, m_eff):
    """E_F = ℏ²/2m (3π²n)^(2/3)"""
    hbar = 1.055e-34
    return hbar**2 / (9.11e-31) * (3 * np.pi**2 * n)**(2/3) / 2

def fermi_wavenumber(n):
    """k_F = (3π²n)^(1/3)"""
    return (3 * np.pi**2 * n)**(1/3)

def fermi_dirac(E, E_F, T):
    """f(E) = 1/(exp((E-E_F)/kT) + 1)"""
    kB = 8.617e-5
    return 1 / (np.exp((E - E_F) / (kB * T)) + 1)

# Copper properties
n_Cu = 8.45e28
k_F = fermi_wavenumber(n_Cu)
E_F = fermi_energy(n_Cu, 1)

print("Free electron gas (copper):")
print(f"  Electron density: {n_Cu:.2e} m⁻³")
print(f"  Fermi wavevector: k_F = {k_F:.2e} m⁻¹")
print(f"  Fermi energy: {E_F/1.6e-19:.2f} eV")
print(f"  Fermi temperature: {E_F/1.38e-23/1e4:.1f} × 10⁴ K")

# DOS in 3D
def dos_3D(E, m_eff):
    """g(E) ∝ √E for 3D free electrons."""
    hbar = 1.055e-34
    m_star = m_eff * 9.11e-31
    prefactor = 1 / (2 * np.pi**2) * (2 * m_star / hbar**2)**1.5
    return prefactor * np.sqrt(E)

E = 0.1 * 1.6e-19
print(f"\nDOS at E = 0.1 eV: {dos_3D(E, 1):.2e} states/J")
```

### Drude Model and Transport

```python
import numpy as np

def drude_conductivity(n, e, tau, m):
    """σ = ne²τ/m"""
    return n * e**2 * tau / m

def drude_mobility(tau, m, e=1.6e-19):
    """μ = eτ/m"""
    return e * tau / m

def hall_coefficient(n, e=1.6e-19):
    """R_H = 1/(ne)"""
    return 1 / (n * e)

# Copper properties
n_Cu = 8.45e28
m_e = 9.11e-31
e = 1.6e-19
tau_Cu = 2.5e-14

sigma_Cu = drude_conductivity(n_Cu, e, tau_Cu, m_e)
mu_Cu = drude_mobility(tau_Cu, m_e)

print("Drude model (copper):")
print(f"  Conductivity: {sigma_Cu/1e7:.1f} × 10⁷ S/m (actual: 5.96×10⁷)")
print(f"  Mobility: {mu_Cu*1e4:.1f} cm²/V·s")
print(f"  Resistivity: {1/sigma_Cu*1e8:.2f} μΩ·cm")

# Thermal conductivity (Wiedemann-Franz)
def thermal_conductivity(sigma, L, T):
    """κ = LσT (Wiedemann-Franz law)"""
    L = 2.44e-8  # Lorenz number
    return L * sigma * T

kappa_Cu = thermal_conductivity(sigma_Cu, 2.44e-8, 300)
print(f"\nThermal conductivity: {kappa_Cu:.1f} W/m·K (actual: ~400)")
```

### Superconductivity

```python
import numpy as np

def london_penetration_depth(T, T_c, lambda_0):
    """λ(T) = λ_0 / √(1 - T/T_c)"""
    if T >= T_c:
        return np.inf
    return lambda_0 / np.sqrt(1 - (T/T_c)**2)

def coherence_length(T, T_c, xi_0):
    """ξ(T) = ξ_0 / √(1 - T/T_c)"""
    if T >= T_c:
        return np.inf
    return xi_0 / np.sqrt(1 - (T/T_c)**2)

def critical_field(T, T_c, H_c0):
    """H_c(T) = H_c0(1 - (T/T_c)²)"""
    return H_c0 * (1 - (T/T_c)**2)

# Nb3Sn properties
T_c = 18.3  # K
lambda_0 = 200e-9  # m
xi_0 = 5e-9  # m
H_c0 = 0.4  # T

print("Superconductor properties (Nb3Sn):")
print(f"  Critical temperature: {T_c} K")
print(f"  London penetration depth: {lambda_0*1e9:.0f} nm at T=0")
print(f"  Coherence length: {xi_0*1e9:.0f} nm at T=0")

for T in [0, 5, 10, 15]:
    lambda_T = london_penetration_depth(T, T_c, lambda_0)
    xi_T = coherence_length(T, T_c, xi_0)
    H_cT = critical_field(T, T_c, H_c0)
    print(f"  T = {T}K: λ = {lambda_T*1e9:.0f} nm, ξ = {xi_T*1e9:.0f} nm, H_c = {H_cT:.2f} T")

# Energy gap
def gap_energy(T, T_c, Delta_0=1.76):
    """Δ(T) = 1.76 k_B T_c tanh(1.74√(T_c/T - 1))"""
    if T >= T_c:
        return 0
    return 1.76 * 8.617e-5 * T_c * np.tanh(1.74 * np.sqrt(T_c/T - 1))

Delta_0 = 1.76 * 8.617e-5 * T_c
print(f"\nEnergy gap at T=0: {Delta_0*1e3:.1f} meV")
print(f"  2Δ/k_B T_c = {2 * Delta_0 / (8.617e-5 * T_c):.2f} (BCS value: 3.52)")
```

### Magnetic Properties

```python
import numpy as np

def curie_law(T, C):
    """χ = C/T for paramagnets."""
    return C / T

def curie_weiss(T, T_cw, C):
    """χ = C/(T - T_cw) for ferromagnets above T_c."""
    return C / (T - T_cw)

def langevin_paramagnetism(mu, B, T):
    """Classical paramagnet."""
    kB = 1.38e-23
    x = mu * B / (kB * T)
    return np.cosh(x) / x - np.sinh(x) / x**2

def susceptibility_ferromagnet(T, T_c, chi_0=0):
    """Mean-field susceptibility."""
    return chi_0 + C / (T - T_c)

# Parameters
mu_B = 9.27e-24  # Bohr magneton
C = 1 / 3  # Curie constant approximation
T_c = 1043  # K for iron

print("Magnetic susceptibility:")
print(f"  Iron Curie temperature: {T_c} K")
for T in [300, 500, 773, 1000, 1100]:
    chi_cw = curie_weiss(T, T_c, C) if T > T_c else np.inf
    print(f"  T = {T}K: χ = {chi_cw:.4f} (paramagnetic)" if T > T_c else f"  T = {T}K: Ferromagnetic")

# Exchange energy
def exchange_energy(J, S):
    """E_exchange = -2J S·S for Heisenberg model."""
    return -2 * J * S**2

J = 0.1  # eV
S = 0.5  # Spin-1/2
print(f"\nExchange energy (J={J} eV, S={S}):")
print(f"  E_exchange = {exchange_energy(J, S):.3f} eV")

# Magnetic ordering temperature (Mermin-Wagner bound check)
print(f"\nMermin-Wagner theorem: No spontaneous symmetry breaking in 1D/2D at T>0")
```

## Best Practices

- Use appropriate boundary conditions (periodic, open) for different crystal types when simulating electronic structure.
- Account for electron-electron interactions through DFT or many-body methods when simple band theory is insufficient.
- Consider both spin and orbital contributions to magnetic properties.
- For superconductivity, distinguish between Type-I and Type-II behavior based on κ = λ/ξ ratio.
- When analyzing transport, remember the difference between drift velocity and Fermi velocity.
- For topological materials, calculate topological invariants (Chern number, Z2 invariant) to confirm topology.
- Use zone folding concepts when comparing Brillouin zones of different structures.
- Consider phonon contributions to thermal conductivity at different temperatures.
- For strongly correlated systems, standard band theory fails; use DMFT or similar methods.
- Validate band structure calculations against experimental photoemission data when available.

