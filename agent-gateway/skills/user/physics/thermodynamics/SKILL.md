---
name: thermodynamics
description: Thermodynamic principles including laws of thermodynamics, entropy, free energy, phase transitions, heat engines, and statistical foundations for physics and engineering.
category: physics
tags:
  - physics
  - thermodynamics
  - entropy
  - free-energy
  - heat-engines
  - phase-transitions
  - statistical-mechanics
difficulty: intermediate
author: neuralblitz
---

# Thermodynamics

## What I do

I provide comprehensive expertise in thermodynamics, the branch of physics describing heat, work, and energy transformations. I enable you to apply the laws of thermodynamics, compute entropy and free energy, analyze heat engines and refrigerators, study phase transitions, work with thermodynamic potentials, and apply statistical interpretations. My knowledge spans from macroscopic laws to statistical foundations essential for engineering, chemistry, materials science, and physics.

## When to use me

Use thermodynamics when you need to: analyze heat engine efficiency and cycles, calculate equilibrium properties of systems, study phase diagrams and phase transitions, compute chemical reaction spontaneity, design refrigeration and HVAC systems, analyze thermodynamic stability, calculate properties of gases and materials, or apply statistical mechanics to derive macroscopic laws.

## Core Concepts

- **Zeroth Law of Thermodynamics**: Thermal equilibrium defines temperature and allows thermometers to measure it.
- **First Law of Thermodynamics**: Conservation of energy with heat (Q) and work (W) as energy transfer modes (ΔU = Q - W).
- **Second Law of Thermodynamics**: Entropy always increases in isolated systems with heat engines having maximum Carnot efficiency.
- **Third Law of Thermodynamics**: Entropy approaches a constant minimum (zero for perfect crystals) as T → 0.
- **Entropy and Disorder**: Statistical measure of microscopic configurations consistent with macroscopic state.
- **Thermodynamic Potentials**: Internal energy (U), enthalpy (H), Helmholtz free energy (F), and Gibbs free energy (G).
- **Phase Transitions**: Changes between states of matter with latent heat and discontinuities in derivatives of free energy.
- **Carnot Cycle**: Maximum possible efficiency for heat engines operating between two temperature reservoirs.
- **Maxwell Relations**: Derivatives of thermodynamic potentials connected through equality of mixed partials.
- **Statistical Interpretation**: Entropy as S = k_B ln(Ω) connecting microscopic and macroscopic descriptions.

## Code Examples

### Thermodynamic Laws and Cycles

```python
import numpy as np

# First law: ΔU = Q - W
def first_law(Q, W):
    """Calculate internal energy change."""
    return Q - W

# Work for different processes
def work_pressure_volume(P, V1, V2):
    """Isothermal work: W = ∫PdV = nRT ln(V2/V1)"""
    return P * V2 - P * V1

def isothermal_work(n, R, T, V1, V2):
    """Work in isothermal expansion."""
    return n * R * T * np.log(V2 / V1)

def adiabatic_work(n, R, T1, V1, V2, gamma):
    """Work in adiabatic expansion."""
    return n * R * (T1 - T2) / (gamma - 1)

def adiabatic_temperature(T1, V1, V2, gamma):
    """TV^(γ-1) = constant."""
    return T1 * (V1 / V2)**(gamma - 1)

# Ideal gas properties
R = 8.314  # J/(mol·K)
gamma = 1.4  # Air

print("First law examples:")
n = 1  # mol
T1 = 300  # K
V1, V2 = 1, 2  # L

T2 = adiabatic_temperature(T1, V1, V2, gamma)
W_adi = adiabatic_work(n, R, T1, V1, V2, gamma)
print(f"  Adiabatic expansion V1→2V1 at T={T1}K:")
print(f"    Final temperature: {T2:.1f} K")
print(f"    Work done: {W_adi:.1f} J")

# Carnot cycle
def carnot_efficiency(T_hot, T_cold):
    """η = 1 - T_cold/T_hot"""
    return 1 - T_cold / T_hot

def carnot_refrigerator_coefficient(T_cold, T_hot):
    """COP = T_cold/(T_hot - T_cold)"""
    return T_cold / (T_hot - T_cold)

T_hot, T_cold = 500, 300  # K
eta_carnot = carnot_efficiency(T_hot, T_cold)
cop_carnot = carnot_refrigerator_coefficient(T_cold, T_hot)

print(f"\nCarnot cycle:")
print(f"  T_hot = {T_hot}K, T_cold = {T_cold}K")
print(f"  Maximum engine efficiency: {eta_carnot*100:.1f}%")
print(f"  Maximum refrigerator COP: {cop_carnot:.2f}")

# Otto cycle (spark ignition engine)
def otto_cycle_efficiency(r, gamma):
    """η = 1 - 1/r^(γ-1)"""
    return 1 - 1 / (r**(gamma - 1))

def diesel_cycle_efficiency(r, cutoff, gamma):
    """η = 1 - (1/r^(γ-1)) * ((ρ^γ - 1)/(γ(ρ-1)))"""
    return 1 - (1 / r**(gamma - 1)) * (cutoff**gamma - 1) / (gamma * (cutoff - 1))

for compression_ratio in [8, 10, 12]:
    eta = otto_cycle_efficiency(compression_ratio, gamma)
    print(f"  Otto cycle (r={compression_ratio}): η = {eta*100:.1f}%")
```

### Entropy Calculations

```python
import numpy as np
from scipy.integrate import quad

def entropy_change_isothermal(n, R, V2, V1):
    """ΔS = nR ln(V2/V1) for isothermal expansion."""
    return n * R * np.log(V2 / V1)

def entropy_change_temperature(n, Cv, T2, T1):
    """ΔS = ∫dQ_rev/T = ∫Cv dT/T = Cv ln(T2/T1)"""
    return n * Cv * np.log(T2 / T1)

def entropy_of_mixing(n1, n2, V1, V2):
    """Entropy of mixing two ideal gases."""
    return n1 * R * np.log((V1 + V2) / V1) + n2 * R * np.log((V1 + V2) / V2)

# Example: Heating and expanding ideal gas
n = 1  # mol
Cv = (3/2) * R  # Monatomic gas
T1, T2 = 300, 600  # K
V1, V2 = 1, 2  # L

S_heat = entropy_change_temperature(n, Cv, T2, T1)
S_expand = entropy_change_isothermal(n, R, V2, V1)

print("Entropy calculations:")
print(f"  Heating 1 mol from 300K to 600K: ΔS = {S_heat:.2f} J/K")
print(f"  Isothermal expansion V→2V: ΔS = {S_expand:.2f} J/K")
print(f"  Total ΔS: {S_heat + S_expand:.2f} J/K")

# Statistical entropy
def boltzmann_entropy(omega):
    """S = k_B ln(Ω)"""
    kB = 1.38e-23
    return kB * np.log(omega)

# Example: 100 coin tosses
omega = 2**100
S_coins = boltzmann_entropy(omega)

print(f"\nStatistical entropy:")
print(f"  100 coin tosses: Ω = {omega:.2e}")
print(f"  S = {S_coins:.2e} J/K")
print(f"  S/kB = {np.log(omega):.2f}")

# Gibbs paradox
def gibbs_paradox(n, V1, V2):
    """Show entropy of mixing is extensive."""
    return 2 * n * R * np.log((V1 + V2) / V1)

print(f"\nGibbs paradox:")
print(f"  Mixing entropy should be proportional to amount of gas")
print(f"  ΔS = {gibbs_paradox(1, 1, 1):.2f} J/K for 1 mole mixing")

# Entropy of water
def water_entropy(T, phase='liquid'):
    """Approximate entropy of water at 298K."""
    S_liquid = 69.9  # J/(mol·K) at 298K
    S_ice = 48.0  # J/(mol·K) at 273K
    S_vapor = 188.8  # J/(mol·K) at 373K
    
    if phase == 'liquid':
        return S_liquid
    elif phase == 'solid':
        return S_ice
    else:
        return S_vapor

print(f"\nWater entropy at 298K:")
print(f"  Liquid: {water_entropy(298, 'liquid'):.1f} J/(mol·K)")
print(f"  Solid: {water_entropy(298, 'solid'):.1f} J/(mol·K)")
```

### Free Energy and Equilibrium

```python
import numpy as np

def helmholtz_free_energy(T, V, n, U):
    """F = U - TS"""
    return U - T * S

def gibbs_free_energy(T, P, n, H):
    """G = H - TS"""
    return H - T * S

def gibbs_free_energy_reaction(T, dH, dS):
    """ΔG = ΔH - TΔS"""
    return dH - T * dS

def reaction_spontaneity(dG):
    """Check if reaction is spontaneous."""
    return dG < 0

def equilibrium_constant(dG, T, R=8.314):
    """K = exp(-ΔG°/RT)"""
    return np.exp(-dG / (R * T))

# Example: Haber process (N₂ + 3H₂ → 2NH₃)
dH_reaction = -92.4e3  # J/mol (exothermic)
dS_reaction = -198.7  # J/(mol·K) (decrease in gas moles)

T_298 = 298  # K
dG_298 = gibbs_free_energy_reaction(T_298, dH_reaction, dS_reaction)
K_298 = equilibrium_constant(dG_298, T_298)

print("Gibbs free energy (Haber process):")
print(f"  ΔH° = {dH_reaction/1000:.1f} kJ/mol")
print(f"  ΔS° = {dS_reaction:.1f} J/(mol·K)")
print(f"  ΔG°(298K) = {dG_298/1000:.1f} kJ/mol")
print(f"  K(298K) = {K_equilibrium_constant(dG_298, T_298):.2e}")

# Temperature dependence of K
for T in [298, 400, 500, 600, 700]:
    dG = gibbs_free_energy_reaction(T, dH_reaction, dS_reaction)
    K = equilibrium_constant(dG, T)
    print(f"  K({T}K) = {K:.2e}")

# van't Hoff equation
def van_t_hoff(K1, K2, T1, T2, dH):
    """ln(K2/K1) = -ΔH/R (1/T2 - 1/T1)"""
    return np.log(K2/K1) == -dH/R * (1/T2 - 1/T1)

# Maxwell relations
def maxwell_relation_dG(P, T, dG_dP, dG_dT):
    """∂G/∂P = V, ∂G/∂T = -S, then (∂V/∂T)_P = -(∂S/∂P)_T"""
    pass

# Chemical potential
def chemical_potential(T, P, mu0, R=8.314):
    """μ = μ° + RT ln(P/P°)"""
    return mu0 + R * T * np.log(P / 1e5)  # P in Pa

def fugacity_coefficient(P, phi):
    """f = φP for real gases."""
    return phi * P

print(f"\nChemical potential:")
mu0_N2 = -1.5e5  # J/mol at 1 bar
for P in [0.1, 1, 10]:  # bar
    mu = chemical_potential(298, P * 1e5, mu0_N2)
    print(f"  μ(N₂, {P} bar) = {mu/1000:.1f} kJ/mol")
```

### Phase Transitions

```python
import numpy as np

def clausius_clapeyron(dH, T, dV, R=8.314):
    """dP/dT = ΔH/(TΔV)"""
    return dH / (T * dV)

def vapor_pressure_clausius(T, P1, T1, dH_vap):
    """ln(P2/P1) = -ΔH_vap/R (1/T2 - 1/T1)"""
    return P1 * np.exp(-dH_vap/R * (1/T2 - 1/T1))

def critical_properties(Tc, Pc):
    """Estimate critical properties."""
    Pc_atm = Pc / 1.013e5  # Convert to atm
    
    # van der Waals constants
    a = 27 * R**2 * Tc**2 / (64 * Pc)
    b = R * Tc / (8 * Pc)
    
    return a, b

def reduced_properties(T, P, Tc, Pc):
    """Tr = T/Tc, Pr = P/Pc"""
    return T / Tc, P / Pc

def law_of_rectilinear_diameters(T, T_c, rho_l_c, rho_v_c):
    """ρ_liq + ρ_vap = 2ρ_c + A(T_c - T)"""
    A = 0.5  # Typical coefficient
    return rho_l_c + rho_v_c, 2 * rho_v_c + A * (T_c - T)

# Water phase diagram parameters
Tc_water = 647.1  # K
Pc_water = 22.06e6  # Pa
dH_vap_water = 40.7e3  # J/mol

print("Phase transition calculations:")
print(f"  Water critical point: Tc={Tc_water}K, Pc={Pc_water/1e6:.1f} MPa")

# Estimate vapor pressure at different temperatures
P1 = 101325  # 1 atm
T1 = 373.15  # Boiling point at 1 atm
dH_vap = 40.7e3

for T in [350, 360, 370, 380, 390]:
    P_vap = vapor_pressure_clausius(T, P1, T1, dH_vap)
    print(f"  P_vap({T}K) = {P_vap/1000:.1f} kPa")

# Clausius-Clapeyron for water at 100°C
dH = 40.7e3  # J/mol
T = 373.15  # K
dV = 30e-3  # m³/mol (approx volume change vapor-liquid)
dP_dT = clausius_clapeyron(dH, T, dV)
print(f"\nClausius-Clapeyron at 100°C:")
print(f"  dP/dT = {dP_dT:.2f} Pa/K = {dP_dT/1000:.2f} kPa/K")

# Gibbs phase rule
def gibbs_phase_rule(C, P):
    """F = C - P + 2 for non-reactive systems."""
    return C - P + 2

print(f"\nGibbs phase rule:")
print(f"  Pure water (C=1): F = 3 - P")
print(f"  Triple point (P=3): F = 0 (invariant)")
print(f"  Normal conditions (P=1): F = 2 (T,P variable)")
```

### Thermodynamic Cycles Analysis

```python
import numpy as np

def rankine_cycle_efficiency(T_boiler, T_condenser, eta_pump=0.8):
    """
    Rankine cycle (steam power plant) efficiency.
    η = 1 - Q_out/Q_in
    """
    # Simplified: assume Carnot-like efficiency with irreversibilities
    T_hot = T_boiler + 273.15  # K
    T_cold = T_condenser + 273.15  # K
    
    eta_carnot = 1 - T_cold / T_hot
    return eta_carnot * eta_pump  # Account for pump inefficiency

def rankine_work_output(T_boiler, T_condenser, m_dot, h1, h2, h3, h4):
    """
    Calculate work output per unit mass flow.
    W = (h1 - h2) + (h3 - h4)
    """
    turbine_work = h1 - h2
    pump_work = h3 - h4
    return m_dot * (turbine_work - pump_work)

def heat_pump_cop(T_cold, T_hot, eta):
    """COP = T_cold/(T_hot - T_cold) for ideal."""
    return T_cold / (T_hot - T_cold)

# Rankine cycle analysis
T_boiler = 500  # °C
T_condenser = 40  # °C

eta_rankine = rankine_cycle_efficiency(T_boiler, T_condenser)
print(f"Rankine cycle efficiency:")
print(f"  T_boiler = {T_boiler}°C, T_condenser = {T_condenser}°C")
print(f"  Ideal efficiency: {eta_rankine*100:.1f}%")

# Brayton cycle (gas turbine)
def brayton_cycle_efficiency(T3, T4, T1, T2, eta_c=0.85, eta_t=0.90):
    """
    Brayton cycle (gas turbine) efficiency.
    η = 1 - (T4 - T3)/(T2 - T1)
    """
    # Assume ideal: T2/T1 = T3/T4 = r^((γ-1)/γ)
    r = (T3 / T1)**(gamma / (gamma - 1))  # Pressure ratio
    T4 = T3 / r**((gamma - 1) / gamma)
    T2 = T1 * r**((gamma - 1) / gamma)
    
    eta_ideal = 1 - (T4 - T3) / (T2 - T1)
    return eta_ideal * eta_c * eta_t

T1, T3 = 300, 1200  # K
for r_pressure in [5, 10, 15, 20]:
    eta = brayton_cycle_efficiency(T3, T3, T1, T1)
    print(f"  Brayton (r={r_pressure}): η = {eta*100:.1f}%")

# Stirling and Ericsson cycles (regenerative)
def stirling_cycle_efficiency(T_hot, T_cold):
    """Stirling cycle has Carnot efficiency with regeneration."""
    return carnot_efficiency(T_hot, T_cold)

# Combined cycle (Brayton + Rankine)
def combined_cycle_efficiency(eta_brayton, eta_rankine_bottom):
    """η_total = η_brayton + (1 - η_brayton) * η_rankine_bottom"""
    return eta_brayton + (1 - eta_brayton) * eta_rankine_bottom

eta_cc = combined_cycle_efficiency(0.40, 0.35)
print(f"\nCombined cycle (40% Brayton + 35% Rankine): η = {eta_cc*100:.1f}%")
print(f"  This is more efficient than either cycle alone!")
```

## Best Practices

- Always specify the system boundaries when applying thermodynamic laws to avoid confusion between system and surroundings.
- Use proper sign conventions consistently: work done BY system is positive, heat added TO system is positive.
- For irreversible processes, calculate entropy generation and distinguish between reversible and irreversible contributions.
- When analyzing cycles, calculate both thermal efficiency and second-law efficiency to identify irreversibilities.
- Apply the most appropriate thermodynamic potential for given constraints (constant S,V → U; constant S,P → H; constant T,V → F; constant T,P → G).
- For phase transitions, be aware of metastable states and nucleation barriers in first-order transitions.
- Use tabulated thermodynamic data for accuracy; empirical correlations introduce errors.
- In numerical calculations, ensure units are consistent (SI units recommended).
- For mixtures, use partial molar quantities and activity coefficients for non-ideal behavior.
- Remember that the third law establishes a reference point for absolute entropy but does not prevent negative heat capacities.

