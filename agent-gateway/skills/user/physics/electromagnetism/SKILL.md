---
name: electromagnetism
description: Electromagnetic theory including Maxwell's equations, electrostatics, magnetostatics, electromagnetic waves, and radiation for physics and engineering applications.
category: physics
tags:
  - physics
  - electromagnetism
  - maxwell-equations
  - electrostatics
  - magnetostatics
  - em-waves
  - radiation
difficulty: intermediate
author: neuralblitz
---

# Electromagnetism

## What I do

I provide comprehensive expertise in electromagnetism, the branch of physics describing electromagnetic forces between charged particles. I enable you to apply Maxwell's equations, solve electrostatic and magnetostatic problems, analyze electromagnetic wave propagation, calculate radiation patterns, and model electromagnetic fields in materials. My knowledge spans from Coulomb's law to relativistic electrodynamics essential for electrical engineering, optics, plasma physics, and astrophysics.

## When to use me

Use electromagnetism when you need to: calculate electric and magnetic fields of charge/current distributions, analyze wave propagation in various media, design antennas and waveguides, solve boundary value problems, compute electromagnetic radiation and scattering, model dielectric and magnetic materials, calculate forces and torques on charges and currents, or analyze electromagnetic compatibility.

## Core Concepts

- **Maxwell's Equations**: Four fundamental equations governing all electromagnetic phenomena (Gauss's law, Gauss's magnetism law, Faraday's law, Ampère-Maxwell law).
- **Electrostatics**: Electric fields from stationary charges with potential energy and equipotential surfaces.
- **Magnetostatics**: Magnetic fields from steady currents with Biot-Savart law and Ampère's law.
- **Electromagnetic Induction**: Time-varying magnetic fields inducing electric fields (Faraday's law) with self/mutual inductance.
- **Electromagnetic Waves**: Self-propagating solutions to Maxwell's equations traveling at speed c.
- **Boundary Conditions**: Matching conditions for fields at interfaces between different media.
- **Potentials and Gauge Transformations**: Scalar and vector potentials with freedom to choose gauges (Coulomb, Lorenz).
- **Radiation and Antennas**: Time-varying currents producing propagating electromagnetic fields.
- **Electromagnetic Materials**: Response of matter to fields (polarization, magnetization, conductivity).
- **Relativistic Electromagnetism**: Unification with special relativity and electromagnetic field tensors.

## Code Examples

### Electrostatics

```python
import numpy as np
from scipy.integrate import nquad, dblquad
from scipy.special import ellipe, ellipk

def point_charge_field(q, r, r0):
    """Electric field of point charge: E = kq(r-r0)/|r-r0|³"""
    k = 8.99e9
    r_vec = np.array(r) - np.array(r0)
    r_mag = np.linalg.norm(r_vec)
    if r_mag < 1e-10:
        return np.zeros(3)
    return k * q * r_vec / r_mag**3

def line_charge_field(lambda_charge, x, L=10):
    """
    Electric field of infinite line charge.
    E = (2kλ)/r radially outward
    """
    k = 8.99e9
    r = np.abs(x)
    if r < 1e-10:
        return 0
    return 2 * k * lambda_charge / r * np.sign(x)

def charged_ring_field(z, R, Q):
    """
    Electric field on axis of charged ring.
    E_z = kQz/(z²+R²)^(3/2)
    """
    k = 8.99e9
    return k * Q * z / (z**2 + R**2)**1.5

def charged_disk_field(z, R, sigma):
    """
    Electric field on axis of charged disk.
    E_z = (2πkσ)[1 - z/√(z²+R²)]
    """
    k = 8.99e9
    if z == 0:
        return 2 * np.pi * k * sigma
    return 2 * np.pi * k * sigma * (1 - z / np.sqrt(z**2 + R**2))

# Example calculations
Q = 1e-9  # 1 nC
z = 0.1  # 10 cm from charge
print("Point charge field:")
print(f"  E at z=0.1m from q=1nC: {point_charge_field(Q, [z, 0, 0], [0, 0, 0])[0]:.2e} V/m")

print(f"\nCharged ring (R=0.1m, Q=1μC):")
for z_val in [0.05, 0.1, 0.2, 0.5]:
    E = charged_ring_field(z_val, 0.1, 1e-6)
    print(f"  E(z={z_val}m) = {E:.2e} V/m")

print(f"\nCharged disk (R=0.1m, σ=1e-5 C/m²):")
for z_val in [0.01, 0.05, 0.1]:
    E = charged_disk_field(z_val, 0.1, 1e-5)
    print(f"  E(z={z_val}m) = {E:.2e} V/m")

# Electric potential
def point_charge_potential(q, r, r0):
    """V = kq/|r-r0|"""
    k = 8.99e9
    r_vec = np.array(r) - np.array(r0)
    return k * q / np.linalg.norm(r_vec)

def dipole_potential(p, r, theta):
    """
    Potential of electric dipole.
    V = kp·r̂/r² = kp cos(θ)/r²
    """
    k = 8.99e9
    return k * p * np.cos(theta) / r**2

# Capacitance calculations
def parallel_plate_capacitor(A, d, epsilon_r=1):
    """C = ε₀εᵣA/d"""
    epsilon_0 = 8.85e-12
    return epsilon_0 * epsilon_r * A / d

def cylindrical_capacitor(a, b, L, epsilon_r=1):
    """C = 2πε₀εᵣL/ln(b/a)"""
    epsilon_0 = 8.85e-12
    return 2 * np.pi * epsilon_0 * epsilon_r * L / np.log(b/a)

def spherical_capacitor(a, b, epsilon_r=1):
    """C = 4πε₀εᵣab/(b-a)"""
    epsilon_0 = 8.85e-12
    return 4 * np.pi * epsilon_0 * epsilon_r * a * b / (b - a)

print(f"\nCapacitance calculations:")
print(f"  Parallel plate (A=1cm², d=1mm): {parallel_plate_capacitor(1e-4, 1e-3)*1e12:.2f} pF")
print(f"  Cylindrical (a=1mm, b=2mm, L=10cm): {cylindrical_capacitor(1e-3, 2e-3, 0.1)*1e12:.2f} pF")
print(f"  Spherical (a=1cm, b=2cm): {spherical_capacitor(0.01, 0.02)*1e12:.2f} pF")
```

### Magnetostatics

```python
import numpy as np
from scipy.integrate import quad

def biot_savart(I, dl, r, r0):
    """
    Magnetic field from current element.
    dB = (μ₀I/4π) dl × r̂/r²
    """
    mu_0 = 4 * np.pi * 1e-7
    r_vec = np.array(r) - np.array(r0)
    r_mag = np.linalg.norm(r_vec)
    r_hat = r_vec / r_mag
    dl_vec = np.array(dl)
    
    cross = np.cross(dl_vec, r_hat)
    return mu_0 * I / (4 * np.pi) * cross / r_mag**2

def infinite_wire_field(I, r):
    """
    Magnetic field of infinite straight wire.
    B = (μ₀I)/(2πr) φ̂
    """
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * I / (2 * np.pi * np.abs(r))

def circular_loop_field(z, R, I):
    """
    Magnetic field on axis of circular loop.
    B_z = (μ₀I R²)/(2(R²+z²)^(3/2))
    """
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * I * R**2 / (2 * (R**2 + z**2)**1.5)

def solenoid_field(n, I, L, z):
    """
    Magnetic field of ideal solenoid.
    B = μ₀nI (inside), 0 (outside)
    """
    mu_0 = 4 * np.pi * 1e-7
    n_density = n / L
    return mu_0 * n_density * I

print("Magnetostatic fields:")
print(f"  Infinite wire (I=1A, r=0.1m): B = {infinite_wire_field(1, 0.1):.2e} T")
print(f"  Circular loop (I=1A, R=0.1m, z=0): B = {circular_loop_field(0, 0.1, 1):.2e} T")
print(f"  Solenoid (n=1000, L=0.1m, I=1A): B = {solenoid_field(1000, 1, 0.1, 0):.2e} T")

# Magnetic vector potential
def infinite_wire_potential(I, r):
    """
    Vector potential of infinite wire (Coulomb gauge).
    A_z = (μ₀I/2π) ln(r/r₀)
    """
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * I / (2 * np.pi) * np.log(r)

def circular_loop_potential(R, I, r, theta):
    """
    Vector potential of circular loop (Bessel functions for off-axis).
    Simplified: A_φ = (μ₀IR/πk) √((1-k²/2)) [Complete elliptic integral]
    """
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * I * R / (2 * np.pi)

# Inductance calculations
def solenoid_inductance(n, A, L):
    """L = μ₀n²A = μ₀(N²A)/L"""
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * n**2 * A / L

def toroid_inductance(N, a, b, mu_r=1):
    """L = (μ₀μᵣN²a/b) ln(b/a)"""
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * mu_r * N**2 * a / b * np.log(b/a)

def parallel_wire_inductance(d, a, L):
    """
    Inductance per unit length of parallel wires.
    L/L' = (μ₀/π) [ln(d/a) - 0.5]
    """
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 / np.pi * (np.log(d/a) - 0.5)

print(f"\nInductance calculations:")
A = np.pi * (0.01)**2  # 1cm radius
print(f"  Solenoid (n=1000, L=0.1m, A=πcm²): L = {solenoid_inductance(1000, A, 0.1)*1000:.2f} mH")

# Magnetic force
def parallel_wires_force(I1, I2, d, L):
    """Force per unit length between parallel currents."""
    mu_0 = 4 * np.pi * 1e-7
    return mu_0 * I1 * I2 / (2 * np.pi * d) * L

I1, I2 = 100, 100  # 100 A each
d = 0.1  # 10 cm apart
L = 1  # 1 m length

print(f"\nMagnetic force:")
print(f"  Parallel wires (I=100A, d=0.1m, L=1m): F = {parallel_wires_force(I1, I2, d, L):.2f} N")
```

### Electromagnetic Waves

```python
import numpy as np

def wave_speed(epsilon, mu):
    """Speed of EM wave in medium: v = 1/√(εμ)"""
    epsilon_0 = 8.85e-12
    mu_0 = 4 * np.pi * 1e-7
    return 1 / np.sqrt(epsilon * epsilon_0 * mu * mu_0)

def wave_impedance(epsilon, mu):
    """Intrinsic impedance: η = √(μ/ε)"""
    eta_0 = 377  # Ohms (free space)
    return eta_0 * np.sqrt(mu / epsilon)

def skin_depth(frequency, conductivity, permeability):
    """δ = √(2/(ωμσ))"""
    mu_0 = 4 * np.pi * 1e-7
    omega = 2 * np.pi * frequency
    return np.sqrt(2 / (omega * mu * conductivity))

# Wave propagation in media
c = 3e8  # Speed of light
print("EM wave propagation:")
print(f"  Free space: v = {c:.2e} m/s, η = 377 Ω")

# In dielectric (εᵣ = 4)
v_dielectric = c / 2
eta_dielectric = 377 / 2
print(f"  Dielectric (εᵣ=4): v = {v_dielectric:.2e} m/s, η = {eta_dielectric:.1f} Ω")

# In conductor (copper at 1 MHz)
sigma_copper = 5.8e7  # S/m
mu_r_copper = 1
f = 1e6
delta = np.sqrt(2 / (2 * np.pi * f * mu_0 * sigma_copper))
print(f"  Copper at 1 MHz: δ = {delta*1e6:.2f} μm")

# Wave equation solution
def plane_wave_E(z, t, E0, k, omega):
    """E(z,t) = E0 cos(kz - ωt) ŷ"""
    return E0 * np.cos(k * z - omega * t)

def plane_wave_B(z, t, E0, c):
    """B(z,t) = (E0/c) cos(kz - ωt) x̂"""
    return E0 / c * np.cos(k * z - omega * t)

# Poynting vector
def poynting_vector(E, B):
    """S = E × B/μ₀"""
    mu_0 = 4 * np.pi * 1e-7
    return np.cross(E, B) / mu_0

def time_average_poynting(E0, eta):
    """⟨S⟩ = E₀²/(2η)"""
    return E0**2 / (2 * eta)

print(f"\nPoynting vector:")
E0 = 100  # V/m
print(f"  Free space, E₀=100V/m: ⟨S⟩ = {time_average_poynting(E0, 377):.2f} W/m²")

# Reflection and transmission
def fresnel_reflection(n1, n2, theta_i):
    """Normal incidence reflection coefficient."""
    return (n2 - n1) / (n2 + n1)

def fresnel_transmission(n1, n2, theta_i):
    """Normal incidence transmission coefficient."""
    return 2 * n1 / (n2 + n1)

n_air, n_glass = 1.0, 1.5
R = fresnel_reflection(n_air, n_glass, 0)
T = fresnel_transmission(n_air, n_glass, 0)

print(f"\nFresnel coefficients (air to glass):")
print(f"  R = {(R**2)*100:.2f}% reflection")
print(f"  T = {(1 - R**2)*100:.2f}% transmission")
```

### Radiation

```python
import numpy as np

def hertzian_dipole_radiation(I, L, theta, frequency):
    """
    Radiation from short dipole antenna.
    Far field: E_θ = (jωμ₀I₀L sinθ)/(4πr) e^(-jkr)
    """
    mu_0 = 4 * np.pi * 1e-7
    omega = 2 * np.pi * frequency
    k = omega / c
    
    E = omega * mu_0 * I * L * np.sin(theta) / (4 * np.pi * r)
    return E

def dipole_radiated_power(I, L, frequency):
    """
    Total radiated power from Hertzian dipole.
    P = (μ₀ω²I₀²L²)/(12πc)
    """
    mu_0 = 4 * np.pi * 1e-7
    omega = 2 * np.pi * frequency
    return mu_0 * omega**2 * I**2 * L**2 / (12 * np.pi * c)

def antenna_directivity(radiation_pattern):
    """D = 4π⟨P⟩/P_max"""
    pass

def half_wave_dipole_radiation(theta):
    """Radiation pattern of half-wave dipole."""
    return np.cos(np.pi/2 * np.cos(theta)) / np.sin(theta)

def effective_aperture(D, wavelength):
    """A_eff = Dλ²/(4π)"""
    return D * wavelength**2 / (4 * np.pi)

# Calculate radiated power
I = 1  # A
L = 0.01  # 1 cm (short dipole)
f = 1e9  # 1 GHz

P_rad = dipole_radiated_power(I, L, f)
print("Hertzian dipole radiation:")
print(f"  Current: {I} A, Length: {L*100:.2f} cm, Frequency: {f/1e9:.1f} GHz")
print(f"  Radiated power: {P_rad*1e3:.2f} mW")

# Half-wave dipole
lambda_dipole = c / f
L_hw = lambda_dipole / 2

def half_wave_dipole_power(I_rms, L):
    """P = 36.6 I_rms² for half-wave dipole."""
    return 36.6 * I_rms**2

print(f"\nHalf-wave dipole:")
print(f"  Length: {L_hw*100:.2f} cm")
print(f"  Input impedance: ≈73 Ω")
print(f"  Directivity: 1.64 (2.15 dBi)")

# Radiation pressure
def radiation_pressure(intensity, reflectivity):
    """P_rad = I/c (1 + R)"""
    c = 3e8
    return intensity / c * (1 + reflectivity)

I_sun = 1361  # W/m² at Earth
P_sun_earth = radiation_pressure(I_sun, 0)
print(f"\nRadiation pressure (Sun at Earth):")
print(f"  Solar constant: {I_sun} W/m²")
print(f"  Pressure (absorbed): {P_sun_earth*1e6:.2f} μPa")
```

## Best Practices

- Always verify Gauss's law and Ampère's law numerically for symmetric charge/current distributions.
- Use appropriate boundary conditions (continuity of tangential E and H, normal D and B) when solving interface problems.
- For time-harmonic fields, work with complex amplitudes and use phasor notation consistently.
- In numerical EM, ensure grid resolution is fine enough to resolve skin depth and wavelength features.
- Use the method of images for solving boundary problems with conductors and dielectrics.
- Apply gauge transformations carefully to ensure scalar and vector potentials satisfy the Lorenz gauge.
- For radiation calculations, distinguish between near-field (inductive/capacitive) and far-field (radiative) regions.
- When computing self-inductance, account for both internal and external flux linkages.
- For antenna design, ensure proper matching to maximize power transfer and radiation efficiency.
- Consider dispersion in wave propagation by using frequency-dependent material properties when needed.

