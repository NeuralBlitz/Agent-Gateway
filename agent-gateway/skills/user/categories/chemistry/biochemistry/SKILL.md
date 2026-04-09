---
name: Biochemistry
description: Biological chemistry including enzyme kinetics, metabolic pathways, protein structure, nucleic acid biochemistry, and molecular biology techniques for life science applications.
license: MIT
compatibility: python>=3.8
audience: biochemists, molecular-biologists, pharmaceutical-scientists, researchers
category: chemistry
---

# Biochemistry

## What I Do

I provide comprehensive biochemistry tools including enzyme kinetics, metabolic pathways, protein structure analysis, nucleic acid biochemistry, lipid chemistry, and molecular biology calculations for life science applications.

## When to Use Me

- Enzyme kinetics analysis
- Metabolic pathway modeling
- Protein structure prediction
- DNA/RNA calculations
- Ligand binding analysis
- Metabolic engineering

## Core Concepts

- **Enzyme Kinetics**: Michaelis-Menten, Lineweaver-Burk
- **Metabolic Pathways**: Glycolysis, TCA, oxidative phosphorylation
- **Protein Structure**: Primary, secondary, tertiary, quaternary
- **Nucleic Acids**: DNA, RNA, transcription, translation
- **Thermodynamics**: Gibbs free energy in biological systems
- **Ligand Binding**: KD, IC50, Hill equation
- **Coenzymes**: NAD+, ATP, Coenzyme A
- **Membrane Biology**: Lipid bilayers, transport

## Code Examples

### Enzyme Kinetics

```python
import numpy as np
from scipy.optimize import curve_fit

def michaelis_menten(S, Vmax, Km):
    return Vmax * S / (Km + S)

def lineweaver_burk_linear(S, v):
    return 1/v, 1/S

def inhibition_types(Km_app, Vmax_app, type_name):
    types = {
        'competitive': {'Km': 'increased', 'Vmax': 'unchanged'},
        'noncompetitive': {'Km': 'unchanged', 'Vmax': 'decreased'},
        'uncompetitive': {'Km': 'decreased', 'Vmax': 'decreased'},
        'mixed': {'Km': 'varied', 'Vmax': 'decreased'}
    }
    return types.get(type_name, {'Km': 'unknown', 'Vmax': 'unknown'})

S_data = np.array([0.5, 1.0, 2.5, 5.0, 10.0])
v_data = np.array([12, 20, 30, 38, 42])

Vmax, Km = curve_fit(michaelis_menten, S_data, v_data, p0=[50, 2])[0]
print(f"Vmax: {Vmax:.2f} μmol/min, Km: {Km:.2f} mM")

kcat = Vmax / 0.001  # if [E] = 1 μM
print(f"kcat: {kcat:.2f} s⁻¹")
```

### Protein Calculations

```python
AMINO_ACID_MASS = {
    'A': 89, 'R': 174, 'N': 132, 'D': 133, 'C': 121,
    'E': 147, 'Q': 146, 'G': 75, 'H': 155, 'I': 131,
    'L': 131, 'K': 146, 'M': 149, 'F': 165, 'P': 115,
    'S': 105, 'T': 119, 'W': 204, 'Y': 181, 'V': 117
}

def protein_molecular_weight(sequence):
    water_loss = 18.015 * (len(sequence) - 1)
    mass = sum(AMINO_ACID_MID.get(aa, 0) for aa in sequence) + 1.008
    return mass - water_loss / 1000

def calculate_extinction_coefficient(sequence, wavelength=280):
    W = sequence.count('W')
    Y = sequence.count('Y')
    C = sequence.count('C') // 2
    return 1490 * W + 550 * Y + 125 * C

def predict_isoelectric_point(sequence):
    pKa = {'D': 3.9, 'E': 4.3, 'C': 8.3, 'Y': 10.1,
           'H': 6.0, 'K': 10.5, 'R': 12.5}
    
    charges = []
    for aa in sequence:
        if aa in ['D', 'E']:
            pH = pKa.get(aa, 4.0)
        elif aa in ['K', 'R']:
            pH = pKa.get(aa, 11.0)
        elif aa == 'H':
            pH = pKa.get(aa, 6.0)
        else:
            pH = 7.0
        charges.append(pH)
    
    return np.median(charges) if charges else 7.0

sequence = "MSEQKQUENCE"
print(f"MW: {protein_molecular_weight(sequence):.2f} kDa")
print(f"ε280: {calculate_extinction_coefficient(sequence)} M⁻¹cm⁻¹")
```

### DNA/RNA Calculations

```python
from collections import Counter

DNA_COMPLEMENT = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
RNA_COMPLEMENT = {'A': 'U', 'U': 'A', 'G': 'C', 'C': 'G'}

def gc_content(sequence):
    gc = sequence.count('G') + sequence.count('C')
    return gc / len(sequence) * 100

def melting_temperature(sequence):
    if len(sequence) < 14:
        return 2 * (sequence.count('A') + sequence.count('T')) + 4 * (sequence.count('G') + sequence.count('C'))
    return 64.9 + 41 * (gc_content(sequence) - 16.4) / len(sequence)

def reverse_complement(sequence, dna=True):
    complement = DNA_COMPLEMENT if dna else RNA_COMPLEMENT
    return ''.join(complement.get(base, base) for base in reversed(sequence))

dna = "ATGCGCTA"
print(f"GC content: {gc_content(dna):.1f}%")
print(f"Tm: {melting_temperature(dna):.1f}°C")
print(f"Reverse complement: {reverse_complement(dna)}")
```

### Metabolic Calculations

```python
ATP_YIELD = {
    'glycolysis': 2,
    'pyruvate_to_acetyl_CoA': 0,
    'citric_acid_cycle': 2,
    'oxidative_phosphorylation': 26
}

def calculate_atp_yield(glucose=1):
    yield_dict = ATP_YIELD.copy()
    yield_dict['oxidative_phosphorylation'] *= 2.5 * glucose
    yield_dict['total'] = sum(yield_dict.values())
    return yield_dict

def nadh_to_atp_conversion(nadh, proton_pump_efficiency=3):
    return nadh * 2.5 * proton_pump_efficiency

def calculate_gibbs_free_energy(deltaG0, Q, T=298):
    R = 8.314
    return deltaG0 + R * T * np.log(Q)

print(f"ATP from glucose: {calculate_atp_yield()['total']:.0f}")
```

### Ligand Binding Analysis

```python
def hill_equation(L, KD, n, Bmax):
    return Bmax * L**n / (KD + L**n)

def ic50_from_kd(KD, inhibitor_conc, Ki):
    return Ki * (1 + inhibitor_conc / KD)

def schild_receptor_agonist(EC50, antagonist_conc, dose_ratio):
    return antagonist_conc / (dose_ratio - 1)

def binding_free_energy(KD):
    R = 8.314
    T = 298
    return -R * T * np.log(KD * 1e-6) / 1000  # kcal/mol

KD = 1e-9  # 1 nM
L = np.logspace(-12, -6, 100)
B = hill_equation(L, KD, 1, 100)
print(f"Binding free energy: {binding_free_energy(KD):.2f} kcal/mol")
```

## Best Practices

1. **Enzyme Assays**: Measure initial velocities
2. **Protein Purity**: Use multiple methods for confirmation
3. **Buffer Conditions**: Consider pH and ionic strength
4. **Temperature Control**: Biological systems are temperature sensitive
5. **Controls**: Always include appropriate controls

## Common Patterns

```python
# Bradford protein assay
def bradford_concentration(od595, intercept=0.045, slope=0.62):
    return (od595 - intercept) / slope

# Circular dichroism secondary structure
def estimate_alpha_helix(cd_signal_222, reference=-33000):
    return cd_signal_222 / reference * 100

# Restriction digest
def predict_digest_pattern(sequence, enzyme_sites):
    sites = []
    for site in enzyme_sites:
        sites.extend([m.start() for m in re.finditer(site, sequence)])
    return sorted(set([0] + [s + len(site) for s in sites for site in enzyme_sites if site in sequence]))
```

## Core Competencies

1. Enzyme kinetics and inhibition
2. Protein structure and properties
3. Nucleic acid calculations
4. Metabolic pathway analysis
5. Ligand binding thermodynamics
