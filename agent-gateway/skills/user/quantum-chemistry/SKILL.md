---
name: quantum-chemistry
description: Quantum mechanics in chemistry
license: MIT
compatibility: opencode
metadata:
  audience: quantum chemists, researchers, students
  category: chemistry
---

## What I do

- Apply quantum mechanics to chemical systems
- Calculate molecular electronic structure
- Predict molecular properties
- Analyze spectroscopic transitions
- Develop computational methods
- Study chemical bonding

## When to use me

- When calculating molecular orbitals
- When predicting molecular properties
- When studying chemical bonding
- When analyzing spectroscopy
- When designing new molecules
- When simulating molecular behavior

## Key Concepts

### Schrödinger Equation

**Time-independent form**
```
ĤΨ = EΨ
```

- Ĥ: Hamiltonian operator
- Ψ: Wavefunction
- E: Energy eigenvalue

### Approximation Methods

**Variational Principle**
- Trial function gives upper bound to ground state energy
- Better trial function → better energy

**Perturbation Theory**
- Divide problem into solvable + small perturbation
- Møller-Plesset (MP2, MP3, MP4)

```python
# Example: Hydrogen atom energy levels
def hydrogen_energy(n):
    """
    Calculate hydrogen atom energy.
    n: Principal quantum number
    """
    E0 = -13.6  # eV (ground state)
    return E0 / (n**2)

# Quantum numbers
quantum_numbers = {
    'n': 'Principal (energy level)',
    'l': 'Orbital (0=s, 1=p, 2=d, 3=f)',
    'm_l': 'Magnetic (-l to +l)',
    'm_s': 'Spin (-1/2 or +1/2)'
}
```

### Electronic Structure Methods

**Ab Initio**
- Hartree-Fock (SCF)
- Configuration Interaction
- Coupled Cluster (CCSD, CCSD(T))
- Møller-Plesset perturbation theory

**Density Functional**
- LDA, GGA, hybrid functionals
- B3LYP, PBE0, ωB97X

### Chemical Bonding

- MO theory: Linear combination of atomic orbitals
- Bonding, antibonding, nonbonding orbitals
- Hückel theory: π-electron systems
- Valence bond theory: Resonance
