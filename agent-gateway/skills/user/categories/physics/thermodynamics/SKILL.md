---
name: Thermodynamics
description: Thermodynamic principles including laws of thermodynamics, entropy, free energy, phase transitions, statistical mechanics, and heat transfer for engineering applications.
license: MIT
compatibility: python>=3.8
audience: physicists, engineers, chemists, materials-scientists
category: physics
---

# Thermodynamics

## What I Do

I provide comprehensive thermodynamics tools including thermodynamic laws, entropy calculations, free energy minimization, phase equilibria, heat engines, and statistical mechanics for engineering and scientific applications.

## When to Use Me

- Heat engine analysis
- Phase transition prediction
- Chemical equilibrium
- Heat transfer calculations
- Material property analysis
- Energy system design

## Core Concepts

- **Laws of Thermodynamics**: Conservation, entropy increase
- **State Functions**: Internal energy, enthalpy, entropy
- **Free Energy**: Gibbs and Helmholtz free energy
- **Phase Transitions**: Critical points, phase diagrams
- **Heat Capacity**: Constant volume and pressure
- **Statistical Mechanics**: Microstates and macrostates
- **Heat Engines**: Efficiency, Carnot cycle
- **Chemical Potential**: Equilibrium conditions

## Code Examples

### Basic Thermodynamic Calculations

```python
import numpy as np

R = 8.314  # J/(mol·K)

def ideal_gas_energy(T, Cv):
    return Cv * T

def ideal_gas_enthalpy(T, Cp):
    return Cp * T

def entropy_change(T1, T2, Cp):
    return Cp * np.log(T2 / T1)

Cp = 29.1  # J/(mol·K) for diatomic gas
T1, T2 = 300, 500
delta_S = entropy_change(T1, T2, Cp)
print(f"ΔS = {delta_S:.2f} J/(mol·K)")

def gibbs_free_energy(H, T, S):
    return H - T * S

def helmholtz_free_energy(U, T, S):
    return U - T * S
```

### Carnot Efficiency

```python
def carnot_efficiency(Th, Tc):
    return 1 - Tc / Th

def carnot_coefficient_performance(Th, Tc):
    return Tc / (Th - Tc)

Th = 500  # Hot reservoir (K)
Tc = 300  # Cold reservoir (K)

efficiency = carnot_efficiency(Th, Tc)
cop = carnot_coefficient_performance(Th, Tc)

print(f"Carnot efficiency: {efficiency:.2%}")
print(f"Carnot COP (refrigerator): {cop:.2f}")

def rankine_efficiency(Th_in, Tc_out, eta_pump=0.8, eta_turb=0.9):
    q_in = Th_in - Tc_out
    w_net = eta_turb * q_in - (Th_in - Tc_out) / eta_pump
    return w_net / (Th_in - Tc_out)
```

### Maxwell Relations

```python
from sympy import symbols, diff

T, V, P, S = symbols('T V P S')

def maxwell_relation(dPdT_V, dVdT_P):
    return dPdT_V == -dVdT_P

def gibbs_helmholtz(G, T):
    return -T * (G.diff(T) / T).diff(T)

def equation_of_state(P, V, T, a=0, b=0):
    return P * V / (R * T) - 1 + a / (R * T * V) - b / (V**2)

van_der_waals_params = {'a': 1.39, 'b': 0.0391}  # CO2
print(f"Van der Waals equation ready for parameters: {van_der_waals_params}")
```

### Phase Transitions

```python
def clausius_clapeyron(P1, T1, T2, delta_H_vap):
    R = 8.314
    return P1 * np.exp(-delta_H_vap / R * (1/T2 - 1/T1)

def critical_properties(Tc, Pc):
    ac = 27 * (R * Tc)**2 / (64 * Pc)
    bc = R * Tc / (8 * Pc)
    return ac, bc

def reduced_properties(T, Tc, P, Pc):
    return T / Tc, P / Pc

T_critical = 304.2  # CO2 critical temperature (K)
P_critical = 73.8   # CO2 critical pressure (bar)

Tr, Pr = reduced_properties(320, T_critical, 80, P_critical)
print(f"Reduced T: {Tr:.3f}, Reduced P: {Pr:.3f}")
```

### Statistical Mechanics

```python
def boltzmann_distribution(energies, T):
    beta = 1 / (R * T)
    probabilities = np.exp(-beta * energies)
    return probabilities / probabilities.sum()

def partition_function(energies, T):
    beta = 1 / (R * T)
    return np.sum(np.exp(-beta * energies))

energies = np.array([0, 0.1, 0.2, 0.3, 0.5])  # kJ/mol
T = 298  # K

Z = partition_function(energies, T)
probs = boltzmann_distribution(energies, T)

print(f"Partition function: {Z:.4f}")
print(f"Probabilities: {probs}")

def internal_energy_statmech(energies, probs):
    return np.sum(energies * probs)

U = internal_energy_statmech(energies, probs)
print(f"Internal energy: {U:.4f} kJ/mol")
```

## Best Practices

1. **Consistent Units**: Use consistent unit systems
2. **State Functions**: Path independence for calculations
3. **Approximations**: Ideal gas assumptions validity
4. **Reversibility**: Carnot limits for real processes
5. **Phase Diagrams**: Use appropriate equations of state

## Common Patterns

```python
# Maxwell-Boltzmann speed distribution
def maxwell_boltzmann_speed(T, m, v_range):
    k = 1.38e-23
    A = 4 * np.pi * (m / (2 * np.pi * k * T))**1.5
    return A * v_range**2 * np.exp(-m * v_range**2 / (2 * k * T))

# Free energy minimization
from scipy.optimize import minimize_scalar

def gibbs_free_energy(T, P, G0, H0, S0):
    return G0 + H0 * (T - 298) - T * S0 * np.log(T / 298)
```

## Core Competencies

1. Thermodynamic laws and state functions
2. Heat engine and refrigerator analysis
3. Phase equilibrium calculations
4. Statistical mechanics foundations
5. Free energy minimization
