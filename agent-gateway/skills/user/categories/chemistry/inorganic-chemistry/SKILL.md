---
name: Inorganic Chemistry
description: Inorganic chemistry fundamentals including coordination compounds, organometallic chemistry, crystal field theory, transition metal chemistry, and spectroscopy for chemistry applications.
license: MIT
compatibility: python>=3.8
audience: inorganic-chemists, materials-scientists, researchers, students
category: chemistry
---

# Inorganic Chemistry

## What I Do

I provide comprehensive inorganic chemistry tools including coordination chemistry, organometallic compounds, crystal field theory, transition metal complexes, and spectroscopic analysis for chemistry applications.

## When to Use Me

- Coordination compound analysis
- Crystal field splitting calculations
- Organometallic reaction mechanisms
- Transition metal spectroscopy
- Ligand field theory
- Inorganic synthesis planning

## Core Concepts

- **Coordination Chemistry**: Ligands, coordination numbers
- **Crystal Field Theory**: d-orbital splitting, CFSE
- **Ligand Field Theory**: Molecular orbital approach
- **Organometallic Chemistry**: Metal-carbon bonds
- **Spectroscopy**: UV-Vis, IR, NMR, EPR
- **Redox Chemistry**: Oxidation states, potentials
- **Solid State**: Defects, non-stoichiometry
- **Bioinorganic**: Metalloenzymes, metals in biology

## Code Examples

### Coordination Chemistry

```python
from itertools import permutations

LIGAND_TYPES = {
    'monodentate': 1,
    'bidentate': 2,
    'tridentate': 3,
    'tetradentate': 4,
    'hexadentate': 6
}

GEOMETRIES = {
    2: 'linear',
    3: 'trigonal planar',
    4: 'tetrahedral/square planar',
    5: 'trigonal bipyramidal/square pyramidal',
    6: 'octahedral',
    8: 'square antiprismatic'
}

def coordination_number(metal, ligands):
    return sum(LIGAND_TYPES.get(ligand, 1) for ligand in ligands)

def effective_atomic_number(metal_z, oxidation_state, ligands):
    metal_e = metal_z - oxidation_state
    ligand_e = sum(18 if l in ['CO', 'CN-', 'NO+'] else 2 for l in ligands)
    return metal_e + ligand_e

def igeometry(coordination_number, metal_electron_config):
    if coordination_number == 4:
        d_count = metal_electron_config.get('d_electrons', 0)
        if d_count < 8:
            return 'tetrahedral'
        else:
            return 'square planar'
    return GEOMETRIES.get(coordination_number, 'unknown')

def ionization_isomerism(metal, ligands, counter_ions):
    return len(list(permutations(counter_ions)))

def hydrate_isomerism(metal, ligands, water_positions):
    return water_positions

coordination_number = coordination_number('Fe', ['H2O', 'H2O', 'CN-', 'CN-', 'CN-', 'CN-'])
print(f"Coordination number: {coordination_number}")
EAN = effective_atomic_number(26, 2, ['CO', 'CO', 'CO', 'CO'])
print(f"Effective atomic number: {EAN}")
```

### Crystal Field Theory

```python
import numpy as np

def cfse_oh(d_electrons, spin_state, delta_oct):
    high_spin = {
        0: 0, 1: 0, 2: 0, 3: -0.4*delta_oct, 4: -0.8*delta_oct,
        5: -1.2*delta_oct, 6: -1.6*delta_oct + P, 7: -2.0*delta_oct + P,
        8: -2.4*delta_oct + 2*P, 9: -1.8*delta_oct + 2*P, 10: -2.4*delta_oct + 2*P
    }
    low_spin = {
        0: 0, 1: -0.4*delta_oct, 2: -0.8*delta_oct, 3: -1.2*delta_oct,
        4: -1.6*delta_oct, 5: -2.0*delta_oct, 6: -2.4*delta_oct, 7: -2.8*delta_oct,
        8: -3.2*delta_oct, 9: -3.6*delta_oct + 2.5*P, 10: -4.0*delta_oct + 2.5*P
    }
    
    if spin_state == 'high':
        return high_spin.get(d_electrons, 0)
    return low_spin.get(d_electrons, 0)

def tanabe_sugano_diagram(d_electron):
    diagrams = {
        'd1': 'Ground state: 2T2g',
        'd2': 'Ground state: 3T1g',
        'd3': 'Ground state: 4A2g',
        'd5_high': 'Ground state: 6A 'd61g',
       _low': 'Ground state: 1A1g'
    }
    return diagrams.get(f'd{d_electron}', 'Consult diagram')

def magnetic_moment(spin_only, spin_quantum):
    return np.sqrt(spin_quantum * (spin_quantum + 2))

def orbital_contribution_L(L):
    return np.sqrt(L * (L + 1))

def racah_parameter(A, B, C):
    return A - B, B, C

delta_oct = 15000  # cm^-1
d6_cfse = cfse_oh(6, 'low', delta_oct)
print(f"CFSE for low-spin d6: {d6_cfse:.0f} cm^-1")
spin_only = 2  # S = 2
mu_so = magnetic_moment(True, spin_only)
print(f"Spin-only magnetic moment: {mu_so:.1f} BM")
```

### Ligand Field Theory

```python
def ligand_field_splitting(ligand_series):
    spectrochemical_series = ['I-', 'Br-', 'Cl-', 'F-', 'OH-', 'H2O', 'NH3', 'en', 'NO2-', 'CN-', 'CO']
    return ligand_series in spectrochemical_series

def nephelauxetic_effect(beta):
    return beta  # B_free / B_complex

def mixing_coefficient(d_electrons, ligands):
    return 0.1 * d_electrons * len(ligands)

def molecular_orbital_diagram(metal, ligands, symmetry):
    return {'sigma': [], 'pi': [], 'delta': []}

def backbonding_strength(metal_d_electrons, pi_acceptor_ligands):
    return metal_d_electrons * len(pi_acceptor_ligands) / 2

def covalency_parameter(h):
    return 1 - h  # h = (beta_free - beta) / beta_free

def charge_transfer_energy(metal_oxidation, ligand_donation, pi_backbonding):
    return metal_oxidation - ligand_donation + pi_backbonding
```

### Organometallic Chemistry

```python
def electron_counting_ionic(metal_ox, metal_group, ligands):
    return metal_group - metal_ox + sum(ligand_hapticity(lig) for lig in ligands)

def electron_counting_covalent(metal_group, ligands):
    return metal_group + sum(ligand_hapticity(lig) for lig in ligands)

def ligand_hapticity(eta_n):
    return n

def effective_atomic_number_rule(electron_count):
    return 18  # Noble gas configuration

def stability_18_electron_rule(total_electrons):
    if total_electrons == 18:
        return 'Stable 18-electron complex'
    elif total_electrons < 18:
        return f' electron-deficient: {18 - total_electrons} electrons needed'
    return f' electron-rich: {total_electrons - 18} electrons extra'

def catalytic_cycle_step(oxidative_addition, rate_constant):
    if oxidative_addition:
        return 'OA - increase oxidation state by 2'
    return 'RE - reductive elimination'

electron_count = electron_counting_covalent(8, ['CO', 'CO', 'CO', 'CO', 'H'])
print(f"Electron count: {electron_count}")
stability = stability_18_electron_rule(18)
print(stability)
```

### Inorganic Spectroscopy

```python
def d_d_transition_energy(CFSE, pairing_energy):
    return CFSE + pairing_energy

def selection_rules(delta_l, delta_s, parity):
    return delta_l == 1 and delta_s == 0 and parity == 'odd'

def extinction_coepsilon(epsilon_max, bandwidth):
    return epsilon_max * bandwidth

def ir_stretching_frequency(bond_order, reduced_mass):
    return 1/(2*np.pi) * np.sqrt(k / reduced_mass)

def epr_g_value(h_nu, beta_e, D):
    return (h_nu - D) / (beta_e * B)

def nmr_chemical_shift(reference, sample):
    return (nu_sample - nu_reference) / nu_reference * 1e6

def mossbauer_isomer_shift(electron_density):
    return electron_density

nu_ref = 100.0
nu_sample = 100.5
shift = nmr_chemical_shift(nu_ref, nu_sample)
print(f"Chemical shift: {shift:.1f} ppm")
```

## Best Practices

1. **Oxidation States**: Assign carefully
2. **Spectroscopic Assignment**: Consider all transitions
3. **Magnetic Properties**: Measure experimentally
4. **Kinetics**: Consider substitution mechanisms
5. **Bonding**: Use appropriate model

## Common Patterns

```python
# Walsh diagrams
def walsh_diagram_correlations():
    pass

# Covalent bond classification
def covalent_classification():
    pass
```

## Core Competencies

1. Coordination chemistry
2. Crystal field theory
3. Organometallic chemistry
4. Inorganic spectroscopy
5. Structure-property relationships
