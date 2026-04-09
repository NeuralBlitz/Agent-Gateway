---
name: Materials Science
description: Materials science fundamentals including crystal structures, mechanical properties, phase diagrams, polymers, ceramics, and composites for materials engineering applications.
license: MIT
compatibility: python>=3.8
audience: materials-scientists, engineers, researchers, students
category: engineering
---

# Materials Science

## What I Do

I provide comprehensive materials science tools including crystal structure analysis, mechanical properties, phase diagrams, polymers, ceramics, and composite materials for materials engineering applications.

## When to Use Me

- Material selection and characterization
- Mechanical property prediction
- Phase diagram analysis
- Failure analysis
- Microstructure engineering
- Corrosion analysis

## Core Concepts

- **Crystal Structures**: BCC, FCC, HCP, defects
- **Mechanical Properties**: Strength, hardness, toughness
- **Phase Diagrams**: Binary, ternary, invariant reactions
- **Polymers**: Molecular weight, Tg, crystallinity
- **Ceramics**: Brittle fracture, thermal properties
- **Composites**: Rule of mixtures, laminate theory
- **Corrosion**: Electrochemical, pitting, galvanic
- **Materials Selection**: Ashby charts, indices

## Code Examples

### Crystal Structures

```python
import numpy as np

def lattice_parameter_a(atomic_radius, structure):
    if structure == 'BCC':
        return 4 * atomic_radius / np.sqrt(3)
    elif structure == 'FCC':
        return 2 * np.sqrt(2) * atomic_radius
    elif structure == 'HCP':
        return 2 * atomic_radius
    return None

def atomic_packing_factor(structure):
    if structure == 'BCC':
        return np.pi * np.sqrt(3) / 8
    elif structure == 'FCC':
        return np.pi / np.sqrt(18)
    elif structure == 'HCP':
        return np.pi / (3 * np.sqrt(2))
    return None

def miller_indices_distance(d_hkl, a, h, k, l):
    return a / np.sqrt(h**2 + k**2 + l**2)

def schmid_factor(phi, lambda_):
    return np.cos(np.radians(phi)) * np.cos(np.radians(lambda_))

def critical_resolved_shear_stress(tau_y, schmid_factor):
    return tau_y / schmid_factor

r_Fe = 1.24e-10  # Angstroms
a_BCC = lattice_parameter_a(r_Fe, 'BCC')
print(f"BCC lattice parameter: {a_BCC:.4f} Angstroms")
APF = atomic_packing_factor('FCC')
print(f"FCC atomic packing factor: {APF:.4f}")
```

### Mechanical Properties

```python
def youngs_modulus_voigt(E1, E2, V1):
    return V1 * E1 + (1 - V1) * E2

def poisson_ratio_nu(E, G):
    return E / (2 * G) - 1

def yield_strength_hall_petch(d, d0, sigma0, ky):
    return sigma0 + ky / np.sqrt(d)

def work_hardening_exponent(true_strain, true_stress, n):
    return np.log(true_stress) - n * np.log(true_stress / K)

def fracture_toughness_KIC(Y, sigma, a):
    return Y * sigma * np.sqrt(np.pi * a)

def creep_rate_A(sigma, Q, R, T, n):
    return A * sigma**n * np.exp(-Q / (R * T))

E = 200e9  # GPa
G = 80e9   # GPa
nu = poisson_ratio_nu(E, G)
print(f"Poisson ratio: {nu:.3f}")
```

### Phase Diagrams

```python
def lever_rule(C0, C_alpha, C_beta, f_alpha):
    return f_alpha = (C_beta - C0) / (C_beta - C_alpha)

def gibbs_phase_rule(F, C, P):
    return F = C - P + 2

def ttt_diagram_start_time(A, Q, R, T):
    return 1 / A * np.exp(Q / (R * T))

def continuous_cooling_transformation(T, t):
    return np.exp(-((T - Ms) / M)**2 / (2 * t**2))

def invariant_reaction_type(composition_range):
    if composition_range > 0:
        return 'eutectic'
    elif composition_range < 0:
        return 'eutectoid'
    return 'peritectic'

def t0_temperature(T_melt, H_fus, delta_S):
    return T_melt - H_fus / delta_S

C0, C_alpha, C_beta = 40, 10, 80
f_alpha = lever_rule(C0, C_alpha, C_beta, 0)
print(f"Alpha fraction: {f_alpha:.2%}")
```

### Polymer Properties

```python
def glass_transition_tpTg, delta_Cp):
    return Tg + delta_Cp

def degree_of_crystallinity(X_c, Delta_H_m, Delta_H_100):
    return Delta_H_m / Delta_H_100 * 100

def number_average_molecular_weight(M0, DP):
    return M0 * DP

def weight_average_molecular_weight(Mn, PDI):
    return Mn * PDI

def mark_houwink_sakurada(M, K, a):
    return K * M**a

def rheology_viscosity(eta0, shear_rate, n):
    return eta0 * shear_rate**(n - 1)

def time_temperature_superposition(T, T_ref, aT, freq_ref):
    return freq_ref * aT

M0 = 100  # g/mol (monomer)
DP = 1000
Mn = number_average_molecular_weight(M0, DP)
print(f"Number average MW: {Mn:.0f} g/mol")
```

### Composite Materials

```python
def rule_of_mixtures_isostrain(E_c, E_f, V_f, E_m):
    return E_c = E_m * (1 - V_f) + E_f * V_f

def rule_of_mixtures_isostress(E_c, E_f, V_f, E_m):
    return E_c = 1 / ((1 - V_f)/E_m + V_f/E_f)

def halpin_tsai_modulus(E_f, E_m, V_f, aspect_ratio):
    return E_c = E_m * (1 + xi * eta * V_f) / (1 - eta * V_f)

def laminate_stiffness(A_matrix, D_matrix):
    return A, B, D

def shear_lag_model(sigma_m, sigma_f, s):
    return sigma_f = sigma_m * (1 - np.exp(-s / l)) / (1 - V_f)

def fiber_volume_fraction(w_f, rho_f, rho_m):
    return V_f = 1 / (1 + (rho_m / rho_f) * ((1 - w_f) / w_f))

V_f = 0.6  # 60% fiber volume
E_f = 230e9  # GPa (carbon)
E_m = 3.5e9  # GPa (epoxy)
E_c = rule_of_mixtures_isostrain(E_f, E_m, V_f, E_m)
print(f"Composite modulus: {E_c:.1f} GPa")
```

## Best Practices

1. **Microstructure-Property Relations**: Link structure to properties
2. **Processing-Microstructure**: Control processing for desired structure
3. **Testing**: Appropriate characterization techniques
4. **Statistical Analysis**: Account for variability
5. **Modeling**: Calibrate models with experimental data

## Common Patterns

```python
# Materials selection (Ashby method)
def materials_index(E, rho, sigma_y):
    return sigma_y / rho**0.5
```

## Core Competencies

1. Crystal structure and defects
2. Mechanical properties
3. Phase diagram analysis
4. Composite materials
5. Materials selection
