---
name: relativity
description: Special and general relativity including Lorentz transformations, spacetime diagrams, relativistic mechanics, black holes, and gravitational waves for physics applications.
category: physics
tags:
  - physics
  - relativity
  - special-relativity
  - general-relativity
  - spacetime
  - black-holes
  - gravitational-waves
difficulty: advanced
author: neuralblitz
---

# Relativity

## What I do

I provide comprehensive expertise in relativity, the theoretical framework describing space, time, and gravitation. I enable you to apply special relativity (Lorentz transformations, relativistic mechanics, E=mc²) and general relativity (curved spacetime, Einstein's equations, black holes, gravitational waves). My knowledge spans from Einstein's postulates to modern applications in GPS, cosmology, gravitational wave astronomy, and high-energy physics.

## When to use me

Use relativity when you need to: analyze high-speed particle dynamics, compute time dilation and length contraction effects, design or analyze GPS satellite systems, study black hole physics and event horizons, understand gravitational lensing and time delay, detect and interpret gravitational waves, model cosmology and cosmic expansion, or apply four-vectors and tensors in physics calculations.

## Core Concepts

- **Lorentz Transformations**: Coordinate transformations between inertial frames preserving the spacetime interval.
- **Spacetime Interval**: s² = c²t² - x² - y² - z², invariant under Lorentz transformations.
- **Time Dilation and Length Contraction**: Moving clocks run slow; moving objects contract in direction of motion.
- **Relativistic Velocity Addition**: Velocities don't add linearly; formula prevents exceeding c.
- **Energy-Momentum Relation**: E² = (pc)² + (mc²)² with mass-energy equivalence E = mc².
- **Four-Vectors and Tensor Formalism**: Relativistic quantities transforming as 4-vectors (position, velocity, momentum).
- **Einstein's Field Equations**: G_μν = 8πG/c⁴ T_μν relating spacetime curvature to matter-energy.
- **Schwarzschild Metric**: Exact solution for spherical mass describing black holes and gravitational fields.
- **Gravitational Time Dilation**: Clocks in gravitational potential run slower (GPS corrections).
- **Gravitational Waves**: Ripples in spacetime from accelerating masses, detected by LIGO/Virgo.

## Code Examples

### Special Relativity

```python
import numpy as np

# Lorentz transformations
def lorentz_gamma(v, c=3e8):
    """γ = 1/√(1 - v²/c²)"""
    beta = v / c
    if beta >= 1:
        raise ValueError("v must be less than c")
    return 1 / np.sqrt(1 - beta**2)

def time_dilation(t, v, c=3e8):
    """Δt' = γΔt (moving clocks run slow)"""
    return lorentz_gamma(v, c) * t

def length_contraction(L, v, c=3e8):
    """L' = L/γ (moving objects contract)"""
    return L / lorentz_gamma(v, c)

def velocity_addition(v, u, c=3e8):
    """Relativistic velocity addition."""
    return (v + u) / (1 + v*u/c**2)

# Example calculations
v = 0.8 * 3e8  # 80% speed of light
c = 3e8

gamma = lorentz_gamma(v, c)
t_proper = 1  # seconds in moving frame
t_lab = time_dilation(t_proper, v, c)
L_proper = 10  # meters
L_lab = length_contraction(L_proper, v, c)

print("Special relativity effects:")
print(f"  v = 0.8c: γ = {gamma:.2f}")
print(f"  Proper time Δτ = {t_proper}s → Lab time Δt = {t_lab:.2f}s")
print(f"  Proper length L₀ = {L_proper}m → Lab length L = {L_lab:.2f}m")

# Relativistic velocity addition
v1 = 0.5 * c
v2 = 0.5 * c
v_total = velocity_addition(v1, v2, c)
print(f"\nVelocity addition: v₁ = 0.5c, v₂ = 0.5c → v = {v_total/c:.3f}c (not 1.0c!)")

# Relativistic Doppler effect
def doppler_shift(f, v, c=3e8, source_approaching=True):
    """Relativistic Doppler shift."""
    gamma = lorentz_gamma(v, c)
    if source_approaching:
        return f * np.sqrt((1 + v/c) / (1 - v/c))
    else:
        return f * np.sqrt((1 - v/c) / (1 + v/c))

f_source = 500e12  # 500 THz (green light)
for v_c in [0, 0.1, 0.5, 0.9]:
    f_observed = doppler_shift(f_source, v_c * c, source_approaching=True)
    print(f"  v = {v_c}c: f_observed = {f_observed/1e12:.2f} THz (blueshift)")

# Space travel example
def interstellar_travel(d, v_frac):
    """Calculate travel time at fraction of c."""
    c = 1  # units of c
    gamma = lorentz_gamma(v_frac, c)
    
    t_earth = d / v_frac  # Earth frame time
    t_ship = d / (v_frac * gamma)  # Ship frame (proper) time
    return t_earth, t_ship

distance = 4.24  # Light years (Proxima Centauri)
for v_frac in [0.1, 0.5, 0.9, 0.99]:
    t_earth, t_ship = interstellar_travel(distance, v_frac)
    print(f"  To Proxima Centauri at {v_frac}c:")
    print(f"    Earth time: {t_earth:.1f} years, Ship time: {t_ship:.1f} years")
```

### Relativistic Mechanics

```python
import numpy as np

# Energy-momentum relations
def relativistic_energy(m, v, c=3e8):
    """E = γmc²"""
    gamma = lorentz_gamma(v, c)
    return gamma * m * c**2

def kinetic_energy(m, v, c=3e8):
    """T = (γ - 1)mc²"""
    gamma = lorentz_gamma(v, c)
    return (gamma - 1) * m * c**2

def momentum(m, v, c=3e8):
    """p = γmv"""
    return lorentz_gamma(v, c) * m * v

def energy_momentum_relation(E, p, m, c=3e8):
    """E² = (pc)² + (mc²)²"""
    return np.sqrt((p*c)**2 + (m*c**2)**2)

# Example: Electron acceleration
m_e = 9.11e-31  # kg
c = 3e8
E_rest = m_e * c**2  # 511 keV

v = 0.99 * c
gamma = lorentz_gamma(v, c)

E_total = relativistic_energy(m_e, v, c)
K = kinetic_energy(m_e, v, c)
p = momentum(m_e, v, c)

print("Relativistic electron (v = 0.99c):")
print(f"  γ = {gamma:.2f}")
print(f"  Rest energy: {E_rest/1.6e-16:.1f} erg = {E_rest/1.6e-13:.1f} keV = {E_rest/1.6e-10:.1f} MeV")
print(f"  Total energy: {E_total/1.6e-10:.1f} MeV")
print(f"  Kinetic energy: {K/1.6e-10:.1f} MeV")
print(f"  Momentum: {p/1.6e-19:.2f} MeV/c")

# Compare classical and relativistic
for v_frac in [0.1, 0.5, 0.9, 0.99]:
    K_classical = 0.5 * m_e * (v_frac * c)**2
    K_relativistic = kinetic_energy(m_e, v_frac * c, c)
    print(f"\n  v = {v_frac}c:")
    print(f"    Classical K: {K_classical/1.6e-16:.1f} eV")
    print(f"    Relativistic K: {K_relativistic/1.6e-16:.1f} eV")
    print(f"    Ratio: {K_relativistic/K_classical:.2f}")

# Four-momentum
def four_momentum(m, v, c=3e8):
    """p^μ = (E/c, p_x, p_y, p_z)"""
    gamma = lorentz_gamma(v, c)
    E = gamma * m * c**2
    p = gamma * m * v
    return np.array([E/c, p[0], p[1], p[2]])

# Photon properties
def photon_energy(wavelength):
    """E = hc/λ"""
    h = 6.626e-34
    c = 3e8
    return h * c / wavelength

def photon_momentum(wavelength):
    """p = h/λ"""
    h = 6.626e-34
    return h / wavelength

lambda_green = 500e-9  # 500 nm
E_photon = photon_energy(lambda_green)
p_photon = photon_momentum(lambda_green)

print(f"\nPhoton (λ = 500 nm):")
print(f"  Energy: {E_photon/1.6e-19:.2f} eV")
print(f"  Momentum: {p_photon:.2e} kg·m/s")
```

### General Relativity Basics

```python
import numpy as np

# Schwarzschild metric
def schwarzschild_radius(M):
    """Event horizon radius: r_s = 2GM/c²"""
    G = 6.674e-11
    c = 3e8
    return 2 * G * M / c**2

def schwarzschild_metric(t, r, theta, phi, M):
    """
    Schwarzschild metric components.
    ds² = -(1-r_s/r)c²dt² + (1-r_s/r)⁻¹dr² + r²dΩ²
    """
    rs = schwarzschild_radius(M)
    
    g_tt = -(1 - rs/r) * c**2
    g_rr = 1 / (1 - rs/r)
    g_thth = r**2
    g_phph = r**2 * np.sin(theta)**2
    
    return g_tt, g_rr, g_thth, g_phph

# Black hole calculations
M_sun = 1.989e30  # kg
rs_sun = schwarzschild_radius(M_sun)
rs_earth = schwarzschild_radius(5.97e24)

print("Schwarzschild radius:")
print(f"  Sun: r_s = {rs_sun:.0f} m = {rs_sun/3e6:.2f} km (actual radius: 696,000 km!)")
print(f"  Earth: r_s = {rs_earth:.0f} m = {rs_earth:.2f} mm")

# Supermassive black hole
M_sgrA = 4.154e6 * M_sun  # Sagittarius A*
rs_sgrA = schwarzschild_radius(M_sgrA)
print(f"  Sagittarius A*: r_s = {rs_sgrA/1.5e11:.2f} AU = {rs_sgrA/1e9:.1f} million km")

# Gravitational time dilation
def gravitational_time_dilation(r, M, c=3e8):
    """Δt' = Δt √(1 - r_s/r)"""
    rs = schwarzschild_radius(M)
    return np.sqrt(1 - rs / r)

# GPS satellite correction
M_earth = 5.97e24
r_gps = 26560e3  # GPS orbital radius (m)
r_surface = 6371e3  # Earth surface (m)

# Special relativistic (satellite motion)
v_gps = 3874  # m/s
gamma_sr = lorentz_gamma(v_gps)

# General relativistic (gravitational)
t_dilation_gr = gravitational_time_dilation(r_gps, M_earth)

print(f"\nGPS time dilation corrections:")
print(f"  Orbital velocity: {v_gps} m/s")
print(f"  Special relativistic (satellite fast): {1/gamma_sr*1e12:.1f} ps/s slow")
print(f"  Gravitational (satellite high): {t_dilation_gr*1e12:.1f} μs/s fast")
print(f"  Net correction: ~38 μs/day")

# Orbital velocity in Schwarzschild
def schwarzschild_orbital_velocity(r, M):
    """Circular orbit velocity at radius r."""
    rs = schwarzschild_radius(M)
    return c * np.sqrt(rs / (2 * r))

for r_ratio in [3, 6, 10]:
    r = r_ratio * rs_sun
    v = schwarzschild_orbital_velocity(r, M_sun)
    print(f"  Orbit at r = {r_ratio} r_s: v = {v/c:.3f}c = {v/1e3:.1f} km/s")

# Innermost Stable Circular Orbit (ISCO)
r_isco = 6 * schwarzschild_radius(M_sun)
print(f"\nInnermost Stable Circular Orbit (ISCO):")
print(f"  For Sun-mass BH: r_ISCO = 3 × r_s = {r_isco/1e3:.1f} km")
```

### Gravitational Waves

```python
import numpy as np

def gravitational_wave_strain(m1, m2, r, frequency, c=3e8, G=6.674e-11):
    """
    Characteristic strain from binary merger.
    h ~ 4G² m1 m2 / (c⁴ r d) × (πf)²/³
    """
    M_chirp = (m1 * m2)**(3/5) / (m1 + m2)**(1/5)
    return 4 * (G * M_chirp / c**2)**(5/3) * (np.pi * frequency / c)**(2/3) / r

def merger_time(m1, m2, a0, e0=0):
    """
    Time to merger due to gravitational radiation.
    t_merge ~ (5/256) c⁵ a⁴ / (G³ m1 m2 (m1+m2))
    """
    G = 6.674e-11
    c = 3e8
    return 5 * c**5 * a0**4 / (256 * G**3 * m1 * m2 * (m1 + m2))

# Binary black hole merger (GW150914)
m1 = 36 * 1.989e30  # Solar masses
m2 = 29 * 1.989e30
d = 410e6 * 9.46e15  # 410 Mpc in meters
f = 35  # Hz (at LIGO detection)

h = gravitational_wave_strain(m1, m2, d, f)
print("Gravitational wave strain (GW150914-like):")
print(f"  m₁ = 36 M☉, m₂ = 29 M☉, distance = 410 Mpc")
print(f"  Strain amplitude: h ~ {h:.2e}")

# Binary neutron star merger (GW170817)
m1 = m2 = 1.4 * 1.989e30  # NS masses
d = 40e6 * 9.46e15  # 40 Mpc
f = 100  # Hz

h_ns = gravitational_wave_strain(m1, m2, d, f)
print(f"\nNeutron star merger (GW170817-like):")
print(f"  m₁ = m₂ = 1.4 M☉, distance = 40 Mpc")
print(f"  Strain amplitude: h ~ {h_ns:.2e}")

# Strain sensitivity of detectors
def detector_noise(f, detector='LIGO'):
    """Approximate noise spectral density."""
    if detector == 'LIGO':
        # Approximate A+ sensitivity
        return 1e-24 / np.sqrt(f/100)
    return 1e-23

frequencies = np.logspace(1, 4, 100)  # 10 Hz to 10 kHz
print(f"\nDetector sensitivity comparison:")
print(f"  LIGO sensitive to h ~ 10⁻²¹ around 100 Hz")
print(f"  Our GW170817 strain {h_ns:.1e} is detectable!")

# Energy radiated
def gw_luminosity(m1, m2, a, c=3e8, G=6.674e-11):
    """Quadrupole formula luminosity."""
    return 32 * G**4 * m1**2 * m2**2 * (m1 + m2) / (5 * c**5 * a**5)

M_sun = 1.989e30
L_gw = gw_luminosity(10*M_sun, 10*M_sun, 1e9)  # Solar masses, 1 million km separation
L_sun = 3.828e26  # Solar luminosity

print(f"\nGravitational wave luminosity:")
print(f"  Binary BH (10+10 M☉, 1 Gm separation):")
print(f"    L_GW = {L_gw/L_sun:.0f} L☉")
print(f"    This is more luminous than entire observable universe!")
```

### Cosmology

```python
import numpy as np

# Hubble's Law
def hubble_distance(H0):
    """d_H = c/H₀"""
    c = 3e5  # km/s
    return c / H0

def hubble_time(H0):
    """t_H = 1/H₀ (age of universe for empty model)"""
    return 1 / H0

def luminosity_distance(d, z):
    """d_L = (1+z)d for small z."""
    return d * (1 + z)

# Cosmological parameters
H0 = 70  # km/s/Mpc
c = 299792.458  # km/s
d_H = c / H0  # Hubble distance

print("Cosmological parameters:")
print(f"  H₀ = {H0} km/s/Mpc")
print(f"  Hubble distance: {d_H:.0f} Mpc")
print(f"  Hubble time: {1/H0 * 9.78e9:.1f} billion years")

# Redshift
def redshift_to_distance(z, H0=70, Omega_m=0.3, Omega_Lambda=0.7):
    """Approximate luminosity distance."""
    d_L = c * z / H0 * (1 + z * (1 - z) / 2)  # Low-z approximation
    return d_L

for z in [0.01, 0.1, 0.5, 1.0, 2.0]:
    d = redshift_to_distance(z)
    print(f"  z = {z}: d_L ≈ {d:.0f} Mpc")

# Age of universe
def universe_age(z, H0=70, Omega_m=0.3, Omega_Lambda=0.7):
    """Approximate age at redshift z."""
    # Flat ΛCDM approximation
    age_present = 13.8  # Gyr
    return age_present / (1 + z) * (1 + 0.5 * z)  # Rough approximation

print(f"\nAge of universe at different redshifts:")
for z in [0, 1, 2, 5, 10]:
    t = universe_age(z)
    print(f"  z = {z}: age = {t:.1f} Gyr")

# Critical density
def critical_density(H0):
    """ρ_c = 3H₀²/(8πG)"""
    G = 6.674e-11
    H0_si = H0 * 1000 / 3.086e22  # Convert to 1/s
    return 3 * H0_si**2 / (8 * np.pi * G)

rho_c = critical_density(H0)
print(f"\nCritical density:")
print(f"  ρ_c = {rho_c:.2e} kg/m³")
print(f"  = {rho_c / 1.36e-7:.1f} atoms/cm³ (hydrogen at STP is ~10¹⁹)")

# Cosmological event horizon
def event_horizon(H0, Omega_Lambda=0.7):
    """Distance to which we can ever receive signals."""
    c = 3e5  # km/s
    return c / H0 * np.arccosh(1/Omega_Lambda)**(-1) * 2 / np.sqrt(Omega_Lambda)

d_horizon = event_horizon(H0)
print(f"\nCosmological event horizon:")
print(f"  d_horizon ≈ {d_horizon:.0f} Mpc")
print(f"  We can only see part of the universe!")
```

## Best Practices

- Use consistent units throughout relativistic calculations (natural units with c=1 often simplify algebra).
- Always specify which frame you're working in when calculating time dilation, length contraction, or Doppler shifts.
- For GPS and precision timing applications, account for both special and general relativistic corrections.
- In general relativity, remember that coordinates don't have direct physical meaning; compute observable quantities using proper time and distances.
- When calculating gravitational wave strains, distinguish between characteristic strain and amplitude at the detector.
- Use the quadrupole formula for gravitational radiation; monopole and dipole radiation are forbidden by conservation laws.
- For cosmology, be clear about which distance measure you're using (comoving, proper, luminosity, angular diameter).
- In numerical relativity, use gauge conditions that avoid coordinate singularities (e.g., 1+log slicing, harmonic gauge).
- For black hole physics, distinguish between the event horizon (global property) and apparent horizon (local, coordinate-dependent).
- When comparing theory with observations, account for redshift of source when interpreting measured quantities.

