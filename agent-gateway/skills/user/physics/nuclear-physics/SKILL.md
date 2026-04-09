---
name: nuclear-physics
description: Nuclear physics fundamentals including radioactive decay, nuclear structure, fission, fusion, particle interactions, and nuclear models for energy and research applications.
category: physics
tags:
  - physics
  - nuclear-physics
  - radioactive-decay
  - fission
  - fusion
  - nuclear-structure
  - particle-physics
difficulty: advanced
author: neuralblitz
---

# Nuclear Physics

## What I do

I provide comprehensive expertise in nuclear physics, the branch of physics studying atomic nuclei and their constituents. I enable you to analyze radioactive decay processes, understand nuclear structure and binding energy, calculate fission and fusion reactions, apply nuclear models (shell model, liquid drop), compute reaction cross-sections, and model nuclear reactors and weapons. My knowledge spans from foundational nuclear properties to applications in energy production, medicine, and astrophysics.

## When to use me

Use nuclear physics when you need to: calculate half-lives and decay rates, design or analyze nuclear reactors, compute fusion reaction rates in stars, model radioactive decay chains, calculate shielding and dosimetry, analyze nuclear data and cross-sections, understand stellar nucleosynthesis, or develop nuclear medicine applications.

## Core Concepts

- **Nuclear Structure**: Protons and neutrons (nucleons) bound by strong nuclear force with meson exchange.
- **Binding Energy and Mass Defect**: Mass difference between nucleus and constituent nucleons (E=mc²).
- **Radioactive Decay**: Alpha (helium emission), beta (electron/positron emission), gamma (photon emission) processes.
- **Decay Law**: N(t) = N₀ exp(-λt) with half-life t½ = ln(2)/λ.
- **Nuclear Fission**: Splitting of heavy nuclei releasing energy (U-235, Pu-239 fission).
- **Nuclear Fusion**: Combining light nuclei to release energy (D-T, p-p chain in stars).
- **Shell Model and Magic Numbers**: Single-particle orbits explaining nuclear structure and stability.
- **Liquid Drop Model**: Semi-empirical mass formula describing binding energy trends.
- **Q-Value**: Energy released/absorbed in nuclear reactions (mass difference × c²).
- **Cross-Section and Reaction Rate**: Probability of interaction and resulting reaction rate (R = nσv).

## Code Examples

### Nuclear Properties

```python
import numpy as np

# Physical constants
c = 2.998e8  # m/s
u = 1.66054e-27  # Atomic mass unit (kg)
e = 1.602e-19  # Elementary charge (C)
MeV_to_J = 1.602e-13  # MeV to Joules

# Nuclear masses and binding energy
def atomic_mass_excess(A, Z, mass_excess_MeV):
    """Convert mass excess to atomic mass in u."""
    return A + mass_excess_MeV / 931.494

def binding_energy(A, Z, mass_nucleus):
    """Calculate binding energy from nuclear mass."""
    mp = 1.007276  # Proton mass (u)
    mn = 1.008665  # Neutron mass (u)
    mass_defect = Z * mp + (A - Z) * mn - mass_nucleus
    return mass_defect * 931.494  # MeV

def semi_empirical_mass(A, Z):
    """
    Semi-empirical mass formula (Weizsäcker formula).
    B(A,Z) = a_v A - a_s A^(2/3) - a_c Z(Z-1)/A^(1/3) - a_a (A-2Z)²/A ± δ
    """
    a_v = 15.75
    a_s = 17.8
    a_c = 0.711
    a_a = 23.7
    a_p = 11.18
    
    # Pairing term
    if A % 2 == 0 and Z % 2 == 0:
        delta = a_p / np.sqrt(A)
    elif A % 2 == 1 and Z % 2 == 1:
        delta = -a_p / np.sqrt(A)
    else:
        delta = 0
    
    B = (a_v * A 
         - a_s * A**(2/3) 
         - a_c * Z * (Z - 1) / A**(1/3) 
         - a_a * (A - 2*Z)**2 / A 
         + delta)
    
    return B

def binding_energy_per_nucleon(B, A):
    """Calculate binding energy per nucleon."""
    return B / A

# Example calculations
print("Nuclear binding energy:")
print(f"  Semi-empirical for ⁴⁰Ca (Z=20, A=40):")
B_Ca40 = semi_empirical_mass(40, 20)
print(f"    Total B = {B_Ca40:.1f} MeV")
print(f"    B/A = {B_Ca40/40:.3f} MeV/nucleon")

print(f"\n  Semi-empirical for ⁵⁶Fe (Z=26, A=56):")
B_Fe56 = semi_empirical_mass(56, 26)
print(f"    Total B = {B_Fe56:.1f} MeV")
print(f"    B/A = {B_Fe56/56:.3f} MeV/nucleon")

print(f"\n  Semi-empirical for ²³⁸U (Z=92, A=238):")
B_U238 = semi_empirical_mass(238, 92)
print(f"    Total B = {B_U238:.1f} MeV")
print(f"    B/A = {B_U238/238:.3f} MeV/nucleon")

# Magic numbers (nuclear shell closure)
magic_numbers = [2, 8, 20, 28, 50, 82, 126]
print(f"\nMagic numbers (shell closures): {magic_numbers}")
print("  Nuclei with magic numbers have:")
print("    - Extra binding energy")
print("    - Larger neutron separation energies")
print("    - Spherical ground states")
print("    - Higher first excited states")
```

### Radioactive Decay

```python
import numpy as np

def decay_constant(half_life):
    """λ = ln(2) / t_1/2"""
    return np.log(2) / half_life

def activity(N, half_life):
    """A = λN = (ln2/t_1/2) × N"""
    return decay_constant(half_life) * N

def radioactive_decay(N0, half_life, t):
    """N(t) = N₀ × 2^(-t/t_1/2) = N₀ × exp(-λt)"""
    return N0 * np.exp(-decay_constant(half_life) * t)

def daughter_growth(N0, half_life_parent, half_life_daughter, t):
    """Bateman equations for decay chain."""
    lambda_p = decay_constant(half_life_parent)
    lambda_d = decay_constant(half_life_daughter)
    
    N_parent = N0 * np.exp(-lambda_p * t)
    N_daughter = (lambda_p / (lambda_d - lambda_p)) * N0 * (
        np.exp(-lambda_p * t) - np.exp(-lambda_d * t)
    )
    
    return N_parent, N_daughter

def secular_equilibrium(t, lambda_p, lambda_d):
    """When t >> t_parent, N_daughter/N_parent ≈ λ_p/λ_d."""
    return lambda_p / lambda_d

# Decay constants and half-lives
half_lives = {
    'U-238': 4.468e9,      # years
    'U-235': 7.038e8,      # years
    'Ra-226': 1600,        # years
    'C-14': 5730,          # years
    'Co-60': 5.27,         # years
    'I-131': 8.02,         # days
    'Cs-137': 30.17,       # years
    'Rn-222': 3.82,         # days
}

print("Radioactive decay:")
for isotope, t_half in list(half_lives.items())[:5]:
    lambda_decay = decay_constant(t_half)
    print(f"  {isotope}: t_1/2 = {t_half:.2e}")
    print(f"    λ = {lambda_decay:.2e} s⁻¹")
    print(f"    1/λ = {1/lambda_decay:.2e} s = {1/lambda_decay/3600:.2e} hours")

# Carbon-14 dating
def carbon14_age(C14_ratio, t_half=5730):
    """
    Calculate age from C-14 ratio.
    Assumes initial ratio was 1.25e-12 (living organism)
    """
    lambda_c14 = decay_constant(t_half * 365.25 * 24 * 3600)
    return np.log(C14_ratio) / (-lambda_c14) / (365.25 * 24 * 3600)

# Samples with different C-14 ratios
initial_ratio = 1.25e-12
for ratio in [1.25e-12, 0.625e-12, 0.156e-12, 0.039e-12]:
    age = carbon14_age(ratio / initial_ratio)
    print(f"\n  C-14 ratio = {ratio:.3e}: age = {age:.0f} years")
    print(f"    ~ {age/1000:.1f} thousand years")

# Decay chain (U-238 series)
U238_hl = 4.468e9 * 365.25 * 24 * 3600  # seconds
Pb206_hl = np.inf  # Stable

t_equilibrium = 1e9 * 365.25 * 24 * 3600  # 1 billion years
N_U238 = 1e6  # Atoms
ratio_Pb_U = np.exp(-decay_constant(U238_hl) * t_equilibrium)
print(f"\nU-238 → Pb-206 decay chain:")
print(f"  After 1 billion years: Pb-206/U-238 ≈ {ratio_Pb_U:.2e}")
print(f"  Secular equilibrium reached when t >> 4.5 billion years")
```

### Nuclear Reactions and Q-Values

```python
import numpy as np

def Q_value(m_initial, m_final, c2=931.494):
    """
    Calculate Q-value of nuclear reaction.
    Q = (m_initial - m_final) × c²
    Positive Q: exothermic (releases energy)
    Negative Q: endothermic (absorbs energy)
    """
    return (m_initial - m_final) * c2

def threshold_energy(Q, A_target, A_projectile, c2=931.494):
    """
    Minimum kinetic energy for endothermic reaction.
    E_thresh = |Q| × (A_target + A_projectile) / A_target
    """
    return abs(Q) * (A_target + A_projectile) / A_target

def reaction_rate(n1, n2, sigma, v):
    """R = n₁n₂σv for two-body reactions."""
    return n1 * n2 * sigma * v

def cross_section_beer_lambert(I0, I, x):
    """σ = (1/nx) × ln(I₀/I) from Beer-Lambert law."""
    return np.log(I0 / I) / x

# Masses in atomic mass units (u)
masses_u = {
    'n': 1.008665,
    'p': 1.007825,
    'D': 2.014102,    # Deuterium
    'T': 3.016049,   # Tritium
    'He3': 3.016029,
    'He4': 4.002602,
    'U235': 235.043930,
    'U236': 236.045568,
    'Ba141': 140.914411,
    'Kr92': 91.926156,
    'fission_fragments': 140.9 + 91.9,  # Approximate
}

# Fusion reactions
print("Nuclear reaction Q-values:")
print("\n1. D + T → He-4 + n:")
m_init = masses_u['D'] + masses_u['T']
m_final = masses_u['He4'] + masses_u['n']
Q_DT = Q_value(m_init - m_final)
print(f"   Q = {Q_DT:.1f} MeV (releases energy!)")

print("\n2. D + D → He-3 + n:")
m_init = 2 * masses_u['D']
m_final = masses_u['He3'] + masses_u['n']
Q_DDn = Q_value(m_init - m_final)
print(f"   Q = {Q_DDn:.1f} MeV")

print("\n3. D + D → T + p:")
m_init = 2 * masses_u['D']
m_final = masses_u['T'] + masses_u['p']
Q_DDp = Q_value(m_init - m_final)
print(f"   Q = {Q_DDp:.1f} MeV")

print("\n4. U-235 + n → U-236*:")
m_init = masses_u['U235'] + masses_u['n']
m_final = masses_u['U236']
Q_fission = Q_value(m_init - m_final)
print(f"   Q = {Q_fission:.1f} MeV")

print("\n5. U-236 fission products (typical):")
Q_fission_products = Q_value(masses_u['U236'] - (masses_u['Ba141'] + masses_u['Kr92'] + 3*masses_u['n']))
print(f"   Ba-141 + Kr-92 + 3n: Q = {Q_fission_products:.1f} MeV")
print(f"   Total fission Q ≈ 200 MeV")

# Threshold energy
A_target, A_proj = 12, 1  # C-12 + n
E_thresh = threshold_energy(-5 MeV), A_target, A_proj)
print(f"\nThreshold energy (¹²C + n → ¹³C):")
print(f"   Q = -1.95 MeV (endothermic)")
print(f"   E_thresh = {E_thresh:.2f} MeV")
```

### Nuclear Reactors

```python
import numpy as np

# Neutron transport
def neutron_diffusion(D, Σa, phi):
    """Diffusion equation: D∇²φ - Σaφ = -S"""
    # Simplified 1D slab solution
    L = np.sqrt(D / Σa)  # Diffusion length
    return phi

def four_factor_formula(k_inf, epsilon, p, f):
    """
    Four-factor formula for infinite multiplication.
    k∞ = η × f × ε × p
    η = neutrons per absorption in fuel
    f = thermal utilization factor
    ε = fast fission factor
    p = resonance escape probability
    """
    return eta * f * epsilon * p

def effective_multiplication(k_inf, k_eff):
    """k_eff = k∞ × P_non_leakage"""
    return k_inf * (1 - k_non_leakage)

def reactor_period(T, rho):
    """Reactor period from reactivity."""
    # inhour equation (simplified)
    return T / (1 - 1/k_eff)

# Criticality calculations
k_inf = 1.32  # For U-235 thermal reactor
L = 0.10  # Non-leakage probability for large reactor
k_eff = k_inf * L

print("Nuclear reactor criticality:")
print(f"  k∞ = {k_inf:.2f}")
print(f"  k_eff = {k_eff:.2f}")
print(f"  Reactivity ρ = (k-1)/k = {(k_eff-1)/k_eff*100:.2f}%")

if k_eff > 1:
    print(f"  Supercritical - power increasing!")
elif k_eff < 1:
    print(f"  Subcritical - power decreasing!")
else:
    print(f"  Critical - steady power")

# Neutron life cycle
neutron_generations = []
N_thermal = 1  # Start with one thermal neutron

for gen in range(10):
    if gen == 0:
        N_thermal = 1
    else:
        N_thermal *= k_eff
    neutron_generations.append(N_thermal)

print(f"\nNeutron generations (k={k_eff:.2f}):")
for i, N in enumerate(neutron_generations[:5]):
    print(f"  Generation {i}: {N:.2f} neutrons")

# Power calculation
def thermal_power(P_thermal, E_fission=200):
    """Calculate fission rate from thermal power."""
    return P_thermal / (E_fission * 1.602e-13)

def power_density(P, volume):
    """Power density in W/m³."""
    return P / volume

# 1 GW thermal reactor
P_gw = 1e9  # 1 GW
fissions_per_sec = thermal_power(P_gw)
print(f"\n1 GW thermal reactor:")
print(f"  Fission rate: {fissions_per_sec:.2e} fissions/s")
print(f"  U-235 consumption: {fissions_per_sec * 235 / 6.022e23 * 1e6:.1f} kg/day")

# Enrichment calculation
def enrichment(N_235, N_238):
    """Calculate weight percent enrichment."""
    return N_235 * 235 / (N_235 * 235 + N_238 * 238) * 100

for N_235_perc in [3, 5, 20, 90]:
    N_238_perc = 100 - N_235_perc
    wt_235 = enrichment(N_235_perc, N_238_perc)
    print(f"\n  {N_235_perc}% U-235 atoms = {wt_235:.2f}% by weight")
```

### Stellar Nucleosynthesis

```python
import numpy as np

def pp_chain_rate(T):
    """
    Proton-proton chain reaction rate.
    Approximate: ε ∝ T⁴ for pp-I
    """
    T9 = T / 1e9  # Temperature in billions of K
    if T9 < 0.01:
        return 1e-26 * T9**4
    return 1e-6 * np.exp(-33.8 / T9**0.5)

def CNO_cycle_rate(T):
    """CNO cycle rate dominates at T > 1.5e7 K."""
    T9 = T / 1e9
    return 1e-25 * np.exp(-152 / T9**0.5)

def triple_alpha_rate(T):
    """
    Triple-alpha reaction (3⁴He → ¹²C).
    Rate ∝ T⁻³ for helium burning.
    """
    T9 = T / 1e9
    return 1e-8 * np.exp(-4.4 / T9**3)

# Stellar temperatures
temps = [1.5e7, 2e7, 3e7]  # K (Sun core, hotter stars)

print("Stellar nucleosynthesis rates:")
for T in temps:
    T9 = T / 1e9
    pp_rate = pp_chain_rate(T)
    cno_rate = CNO_cycle_rate(T)
    triple_alpha = triple_alpha_rate(T)
    
    print(f"\n  T = {T:.1e} K ({T9:.2f}×10⁹ K):")
    print(f"    pp-chain: {pp_rate:.2e}")
    print(f"    CNO: {cno_rate:.2e}")
    print(f"    Dominant: {'CNO' if cno_rate > pp_rate else 'pp-chain'}")

# Energy generation
def energy_generation_pp(T):
    """ε_pp ≈ 1.08×10⁻⁶ T⁶ in L☉/M☉ for pp-I."""
    T8 = T / 1e8
    return 1.08e-6 * T8**6

def energy_generation_CNO(T):
    """ε_CNO ≈ 1.27×10⁻²⁷ T¹⁷ in L☉/M☉."""
    T8 = T / 1e8
    return 1.27e-27 * T8**17

print(f"\nEnergy generation (erg/s/g):")
for T in [1.5e7, 2e7]:
    eps_pp = energy_generation_pp(T)
    eps_cno = energy_generation_CNO(T)
    
    print(f"  T = {T:.1e} K:")
    print(f"    pp-chain: {eps_pp:.2e}")
    print(f"    CNO: {eps_cno:.2e}")

# Main sequence lifetime
def main_sequence_lifetime(M_solar, L_solar=1):
    """t_MS ≈ 10¹⁰ × (M/M☉)^(-2.5) × (L☉/L) years."""
    return 10e9 * M_solar**(-2.5) / L_solar

for M in [0.5, 1, 2, 5, 10]:
    L = M**3.5  # Mass-luminosity relation
    t = main_sequence_lifetime(M, L)
    print(f"\n  M = {M} M☉: L = {L:.1f} L☉, t_MS = {t/1e9:.1f} billion years")

# Hydrostatic equilibrium
def hydrostatic_equilibrium():
    """dP/dr = -G M(r) ρ(r) / r²"""
    pass

# Jeans mass
def jeans_mass(T, rho):
    """M_J ≈ (5kT/Gm_H)^(3/2) × (3/4πρ)^(1/2)"""
    k = 1.38e-23
    G = 6.674e-11
    m_H = 1.67e-27
    
    T_K = T
    rho_kg = rho
    
    return (5 * k * T_K / (G * m_H))**(3/2) * (3 / (4 * np.pi * rho_kg))**(1/2)

print(f"\nJeans mass (cloud collapse):")
T_Jeans = 100  # K
rho_Jeans = 1e-21  # kg/m³
M_J = jeans_mass(T_Jeans, rho_Jeans)
print(f"  T = {T_Jeans} K, ρ = {rho_Jeans:.1e} kg/m³")
print(f"  M_J = {M_J / 2e30:.2f} M☉")
```

## Best Practices

- Use consistent mass units (u or MeV/c²) when calculating Q-values and binding energies.
- For half-life calculations, be careful with time unit conversions (seconds, years, etc.).
- In reactor physics, distinguish between infinite multiplication factor (k∞) and effective multiplication factor (k_eff).
- Account for both prompt and delayed neutrons in reactor kinetics; delayed neutrons make control possible.
- For shielding calculations, consider gamma ray buildup factors and neutron moderation.
- In decay chain calculations, use the Bateman equations for secular and transient equilibrium.
- For stellar nucleosynthesis, remember that reaction rates depend strongly on temperature (Arrhenius behavior).
- When calculating cross-sections, distinguish between microscopic (σ) and macroscopic (Σ) cross-sections.
- Use Monte Carlo methods (MCNP, Geant4) for complex radiation transport problems.
- Always consider radiation safety (ALARA principle) when working with radioactive materials.

