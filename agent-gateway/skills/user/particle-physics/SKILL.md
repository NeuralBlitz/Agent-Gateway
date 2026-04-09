---
name: Particle Physics
description: Particle physics fundamentals including the Standard Model, Feynman diagrams, detector physics, collider kinematics, and nuclear physics for high-energy physics applications.
license: MIT
compatibility: python>=3.8
audience: particle-physicists, nuclear-physicists, researchers
category: physics
---

# Particle Physics

## What I Do

I provide comprehensive particle physics tools including Standard Model interactions, Feynman diagram calculations, detector response, collider kinematics, and nuclear physics for high-energy physics research applications.

## When to Use Me

- Cross section calculations
- Decay rate predictions
- Collider physics analysis
- Detector simulation
- Neutrino physics
- Nuclear structure

## Core Concepts

- **Standard Model**: Quarks, leptons, gauge bosons
- **Feynman Rules**: Vertices, propagators, amplitudes
- **Cross Sections**: Differential and total
- **Decay Rates**: Branching ratios, lifetimes
- **Collider Kinematics**: Mandelstam variables
- **Detector Physics**: Resolution, efficiency
- **QCD**: Asymptotic freedom, confinement
- **Neutrino Oscillations**: PMNS matrix

## Code Examples

### Particle Properties

```python
import numpy as np

PARTICLE_MASS = {
    'e': 0.511,      # MeV
    'mu': 105.7,
    'tau': 1777,
    'u': 2.3,
    'd': 4.8,
    's': 95,
    'c': 1.27,
    'b': 4.18,
    't': 173,
    'W': 80.4,      # GeV
    'Z': 91.2,
    'H': 125,
    'g': 0,
    'photon': 0,
    'gluon': 0
}

QUANTUM_NUMBERS = {
    'charge': {'u': 2/3, 'd': -1/3, 'e': -1, 'mu': -1},
    'spin': {'quark': 1/2, 'lepton': 1/2, 'photon': 1, 'W': 1}
}

def four_momentum(E, px, py, pz):
    m = np.sqrt(E**2 - px**2 - py**2 - pz**2)
    return np.array([E, px, py, pz, m])

def invariant_mass(p1, p2):
    p_total = p1 + p2
    return np.sqrt(p_total[0]**2 - p_total[1]**2 - p_total[2]**2 - p_total[3]**2)

def lorentz_boost(p, beta):
    gamma = 1 / np.sqrt(1 - beta**2)
    p_parallel = p[3] * beta * gamma
    p_perp = p[1:3]
    E = gamma * (p[0] + beta * p[3])
    return np.array([E, p_perp[0], p_perp[1], p_parallel])
```

### Kinematics

```python
def mandelstam_s(p1, p2):
    return (p1[0] + p2[0])**2 - np.sum((p1[1:] + p2[1:])**2)

def mandelstam_t(p1, p2, p3):
    return (p1[0] - p3[0])**2 - np.sum((p1[1:] - p3[1:])**2)

def mandelstam_u(p1, p2, p4):
    return (p1[0] - p4[0])**2 - np.sum((p1[1:] - p4[1:])**2)

def transverse_momentum(px, py):
    return np.sqrt(px**2 + py**2)

def pseudorapidity(pz, E):
    return 0.5 * np.log((E + pz) / (E - pz))

def rapidity(E, pz):
    return 0.5 * np.log((E + pz) / (E - pz))

def delta_r(eta1, eta2, phi1, phi2):
    d_eta = eta1 - eta2
    d_phi = phi1 - phi2
    return np.sqrt(d_eta**2 + d_phi**2)

s = mandelstam_s(p1, p2)
print(f"Mandelstam s: {s:.2f} GeV²")
```

### Cross Sections

```python
def rutherford_cross_section(theta, alpha, E):
    return (alpha**2 / (16 * E**2 * np.sin(theta/2)**4))

def klein_nishina(Egamma, theta):
    re = 2.818e-15  # Classical electron radius
    alpha = Egamma / (0.511)
    return (re**2 / 2) * (Egamma / (Egamma * (1 + alpha * (1 - np.cos(theta)))))**2 * (1 + np.cos(theta)**2 + alpha**2 * (1 - np.cos(theta))**2 / (1 + alpha * (1 - np.cos(theta))))

def differential_cross_section(dsigma_dcos, cos_theta):
    return dsigma_dcos

def total_cross_section(sigma, integration_range):
    return np.trapz(sigma, integration_range)

def parton_luminosity(LHC, sqrt_s):
    return 1 / sqrt_s

def production_cross_section(parton_luminosity, partonic_cross_section):
    return parton_luminosity * partonic_cross_section
```

### Decay Rates

```python
def phase_space_factor(m_parent, m_daughters):
    m1, m2 = m_daughters
    if m1 + m2 > m_parent:
        return 0
    
    E1 = (m_parent**2 + m1**2 - m2**2) / (2 * m_parent)
    E2 = (m_parent**2 + m2**2 - m1**2) / (2 * m_parent)
    
    p = np.sqrt(E1**2 - m1**2)
    return p / m_parent

def decay_width(width_matrix, phase_space):
    return width_matrix * phase_space

def branching_ratio(width_i, total_width):
    return width_i / total_width

def lifetime_hbar(width):
    return 6.582e-22 / width

def muon_lifetime():
    G_F = 1.166e-5  # GeV^-2
    m_mu = 0.1057
    width = G_F**2 * m_mu**5 / (192 * np.pi**3)
    return 1 / width

width_mu = muon_lifetime()
print(f"Muon decay width: {width_mu:.4e} GeV")
tau_mu = lifetime_hbar(width_mu)
print(f"Muon lifetime: {tau_mu:.2e} s")
```

### Detector Response

```python
def energy_resolution(sigma_E, E):
    return sigma_E / E

def momentum_resolution(sigma_pT, pT):
    return sigma_pT / pT

def tracking_efficiency(hits, tracks):
    return hits / tracks

def particle_identification_probability(PID_response, threshold):
    return np.where(PID_response > threshold, 1, 0)

def jet_energy_correction(jet_pt, eta, MC_data):
    correction_factor = 1 + 0.05 * np.abs(eta)
    return jet_pt * correction_factor

def pileup_subtraction(n_pileup, correction):
    return correction - n_pileup * correction

def missing_ET_resolution(MET, sumET):
    return 0.5 * np.sqrt(sumET)
```

## Best Practices

1. **Renormalization**: Use appropriate renormalization scheme
2. **Higher Orders**: Include NLO/NNLO corrections
3. **PDFs**: Use appropriate parton distribution functions
4. **Backgrounds**: Estimate all backgrounds
5. **Systematics**: Include systematic uncertainties

## Common Patterns

```python
# Event generation
def generate_event(process, kinematics):
    return event

# Cut optimization
def optimize_cuts(signal, background):
    return optimal_cuts
```

## Core Competencies

1. Standard Model interactions
2. Feynman diagram calculations
3. Collider kinematics
4. Detector response
5. Statistical analysis
