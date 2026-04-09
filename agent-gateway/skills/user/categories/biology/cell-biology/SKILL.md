---
name: Cell Biology
description: Cell biology fundamentals including cell structure, membrane transport, cell signaling, cell cycle, apoptosis, and microscopy techniques for life science applications.
license: MIT
compatibility: python>=3.8
audience: cell-biologists, biochemists, researchers, students
category: biology
---

# Cell Biology

## What I Do

I provide comprehensive cell biology tools including cell structure analysis, membrane transport calculations, cell signaling pathways, cell cycle modeling, apoptosis analysis, and microscopy quantification for life science applications.

## When to Use Me

- Cell counting and viability
- Membrane transport analysis
- Signaling pathway modeling
- Cell cycle analysis
- Apoptosis detection
- Microscopy image analysis

## Core Concepts

- **Cell Structure**: Organelles, cytoskeleton, membranes
- **Membrane Transport**: Diffusion, osmosis, active transport
- **Cell Signaling**: Receptors, second messengers
- **Cell Cycle**: G1, S, G2, M phases
- **Apoptosis**: Intrinsic and extrinsic pathways
- **Cell Adhesion**: Integrins, cadherins
- **Cytoskeleton**: Actin, microtubules, intermediate filaments
- **Microscopy**: Fluorescence, confocal, electron

## Code Examples

### Cell Counting and Viability

```python
def trypan_blue_exclusion(live_count, total_count):
    return live_count / total_count * 100

def hemocytometer_calculation(count, squares, dilution_factor, depth=0.1):
    cells_per_ml = count / squares * dilution_factor / depth * 10**4
    return cells_per_ml

def doubling_time(N0, Nt, t):
    return t * np.log(2) / np.log(Nt / N0)

def confluence_estimation(area_fraction, total_area):
    return area_fraction / total_area * 100

live_count, total_count = 85, 100
viability = trypan_blue_exclusion(live_count, total_count)
print(f"Cell viability: {viability:.1f}%")

N0, Nt, t = 1000, 8000, 24
td = doubling_time(N0, Nt, t)
print(f"Doubling time: {td:.1f} hours")
```

### Membrane Transport

```python
def ficks_first_law(J, D, dC, dx):
    return -D * dC / dx

def ghk_voltage(V, P_K, P_Na, P_Cl, K_out, K_in, Na_out, Na_in, Cl_out, Cl_in):
    RT_F = 0.0267  # V at 37C
    
    P_total = P_K + P_Na + P_Cl
    num = P_K * K_out + P_Na * Na_out + P_Cl * Cl_in
    den = P_K * K_in + P_Na * Na_in + P_Cl * Cl_out
    
    return RT_F * np.log(num / den)

def osmotic_pressure(pi, C, R=0.0821, T=310):
    return pi * C * R * T

def pump_rate(ATP_consumed, efficiency=0.5):
    return ATP_consumed / efficiency

def diffusion_time(dx, D):
    return dx**2 / (2 * D)

D = 1e-6  # cm²/s
dx = 100e-4  # 100 microns
t = diffusion_time(dx, D)
print(f"Diffusion time: {t:.2f} seconds")
```

### Cell Signaling

```python
def receptor_ligand_binding(Kd, L):
    return L / (Kd + L)

def hill_equation(response, L, Kd, n):
    return L**n / (Kd**n + L**n)

def second_messenger_cascade(Receptor, amplification):
    return Receptor * amplification

def mapk_cascade(MKKK, MKK, MK, transcription_factor):
    return MKKK * MKK * MK * transcription_factor

def calcium_spark_frequency(Fura2_ratio, baseline):
    return Fura2_ratio / baseline

Kd = 1e-9  # nM
L = 1e-8   # M
occupancy = receptor_ligand_binding(Kd, L)
print(f"Receptor occupancy: {occupancy:.2%}")
```

### Cell Cycle Analysis

```python
def cell_cycle_phases(G1, S, G2, M, total=100):
    return {
        'G1': G1 / total * 100,
        'S': S / total * 100,
        'G2': G2 / total * 100,
        'M': M / total * 100
    }

def brdu_incorporation(BrdU_label, control):
    return BrdU_label / control * 100

def mitotic_index(mitotic_cells, total_cells):
    return mitotic_cells / total_cells * 100

def g2_m_checkpoint_activity(ATM_phosphorylation, Chk1_phosphorylation):
    return (ATM_phosphorylation + Chk1_phosphorylation) / 2

def senescence_beta_galactosidase(SA_beta_gal_positive, total):
    return SA_beta_gal_positive / total * 100

mitotic = 15
total = 1000
MI = mitotic_index(mitotic, total)
print(f"Mitotic index: {MI:.2f}%")
```

### Microscopy Analysis

```python
def fluorescence_intensity(fluorescence_background, area):
    return fluorescence_background / area

def colocalization_coefficient(ch1, ch2, threshold_ch1, threshold_ch2):
    overlap = np.sum((ch1 > threshold_ch1) & (ch2 > threshold_ch2))
    coef1 = overlap / np.sum(ch1 > threshold_ch1)
    coef2 = overlap / np.sum(ch2 > threshold_ch2)
    return coef1, coef2

def fRET_efficiency(donor_emission, acceptor_emission, FRET):
    return FRET / (donor_emission + acceptor_emission)

def frap_recovery(t, t_half, plateau, mobile_fraction):
    return plateau * (1 - np.exp(-np.log(2) / t_half * t))

def calculate_fluorescence_lifetime(tau, tau0):
    return tau / tau0

def particle_tracking_displacement(x, y, t):
    return np.sqrt((x[-1] - x[0])**2 + (y[-1] - y[0])**2)
```

## Best Practices

1. **Controls**: Include appropriate controls
2. **Blinding**: Blind samples when possible
3. **Replication**: Technical and biological replicates
4. **Quantification**: Use appropriate metrics
5. **Calibration**: Calibrate instruments

## Common Patterns

```python
# Flow cytometry analysis
def flow_cytometry_gate(single_cells, debris):
    return single_cells / debris

# Western blot quantification
def western_blot_band_intensity(band, background):
    return band - background
```

## Core Competencies

1. Cell culture and counting
2. Membrane transport
3. Cell signaling pathways
4. Cell cycle analysis
5. Microscopy techniques
