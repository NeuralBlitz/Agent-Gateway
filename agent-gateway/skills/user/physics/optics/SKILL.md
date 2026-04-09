---
name: optics
description: Geometrical and wave optics including ray tracing, lens systems, interferometry, polarization, lasers, and nonlinear optics for physics and engineering applications.
category: physics
tags:
  - physics
  - optics
  - geometrical-optics
  - wave-optics
  - interferometry
  - polarization
  - lasers
  - nonlinear-optics
difficulty: intermediate
author: neuralblitz
---

# Optics

## What I do

I provide comprehensive expertise in optics, the branch of physics describing light and its interactions with matter. I enable you to analyze ray optics and lens systems, understand wave phenomena and interference, model polarization and birefringence, design laser systems, and apply nonlinear optics for frequency conversion. My knowledge spans from fundamental principles to advanced techniques essential for photonics, telecommunications, microscopy, and laser engineering.

## When to use me

Use optics when you need to: design lens systems and optical instruments, analyze interference and diffraction patterns, model laser resonators and beam propagation, calculate polarization effects and optical activity, design fiber optic systems, understand nonlinear frequency conversion, analyze thin film coatings, or model atmospheric and underwater optical phenomena.

## Core Concepts

- **Snell's Law**: n₁ sin(θ₁) = n₂ sin(θ₂) describing light refraction at interfaces.
- **Thin Lens Equation**: 1/f = 1/d_o + 1/d_i relating focal length to object/image distances.
- **Interference**: Superposition of waves producing constructive/destructive patterns with path difference conditions.
- **Diffraction**: Bending of waves around obstacles with characteristic patterns from aperture size.
- **Polarization**: Orientation of electric field vector with states (linear, circular, elliptical).
- **Fresnel Equations**: Reflectivity and transmittivity at interfaces for different polarizations.
- **Gaussian Beams**: Fundamental laser mode with waist, Rayleigh range, and beam radius.
- **Nonlinear Optics**: Intensity-dependent phenomena including second/third harmonic generation.
- **Coherence**: Temporal and spatial coherence determining interference visibility.
- **ABCD Matrices**: Ray transfer matrices for analyzing optical systems.

## Code Examples

### Geometrical Optics

```python
import numpy as np

def snell_refraction(n1, n2, theta1):
    """Snell's law: n1*sin(theta1) = n2*sin(theta2)"""
    sin_theta2 = (n1 / n2) * np.sin(theta1)
    if abs(sin_theta2) > 1:
        return None  # Total internal reflection
    return np.arcsin(sin_theta2)

def critical_angle(n1, n2):
    """θ_c = arcsin(n2/n1) for n1 > n2."""
    if n1 <= n2:
        return None
    return np.arcsin(n2 / n1)

def brewster_angle(n1, n2):
    """θ_B = arctan(n2/n1) for p-polarization zero reflection."""
    return np.arctan(n2 / n1)

def thin_lens(f, d_o):
    """1/f = 1/d_o + 1/d_i"""
    return 1 / f - 1 / d_o

def lensmaker_equation(R1, R2, n, d):
    """1/f = (n-1)[1/R1 - 1/R2 + (n-1)d/(nR1R2)]"""
    return (n - 1) * (1/R1 - 1/R2 + (n-1)*d/(n*R1*R2))

def lensmaker_thin(R1, R2, n):
    """Thin lens approximation."""
    return (n - 1) * (1/R1 - 1/R2)

# Example calculations
n_air, n_glass = 1.0, 1.5
theta_i = 30 * np.pi / 180  # 30 degrees

print("Refraction examples:")
theta_t = snell_refraction(n_air, n_glass, theta_i)
print(f"  n1=1.0, n2=1.5, θi=30°: θt = {theta_t*180/np.pi:.1f}°")

theta_c = critical_angle(n_glass, n_air)
print(f"\nCritical angle (glass-air): {theta_c*180/np.pi:.1f}°")
print(f"  TIR occurs for θi > {theta_c*180/np.pi:.1f}°")

theta_B = brewster_angle(n_air, n_glass)
print(f"\nBrewster angle (air-glass): {theta_B*180/np.pi:.1f}°")

# Thin lens calculations
f = 50e-3  # 50 mm focal length
d_o = 100e-3  # 100 mm object distance
d_i = 1 / (1/f - 1/d_o)
magnification = -d_i / d_o

print(f"\nThin lens (f=50mm):")
print(f"  Object at 100mm: d_i = {d_i*1000:.1f} mm")
print(f"  Magnification: {magnification:.2f}")

# Lens design (biconvex)
n = 1.5
R1, R2 = 50e-3, -50e-3
f_designed = 1 / lensmaker_thin(R1, R2, n)
print(f"\nBiconvex lens (R1=50mm, R2=-50mm, n=1.5):")
print(f"  Focal length: {f_designed*1000:.1f} mm")
```

### Wave Optics and Interference

```python
import numpy as np

def path_difference(d, theta, wavelength):
    """δ = d sin(θ) for double slit."""
    return d * np.sin(theta)

def constructive_interference(m, wavelength, d=None, theta=None):
    """Constructive: δ = mλ (m = 0, 1, 2, ...)"""
    if theta is not None:
        return m * wavelength / np.sin(theta)
    return m * wavelength

def destructive_interference(m, wavelength, d=None, theta=None):
    """Destructive: δ = (m + 1/2)λ"""
    return (m + 0.5) * wavelength

def fringe_spacing(wavelength, d, L):
    """Δy = λL/d for small angles."""
    return wavelength * L / d

def thin_film_interference(n_film, n_air, n_substrate, wavelength, m, d):
    """
    Thin film interference.
    Constructive: 2n d = (m + 1/2)λ (hard reflection)
    Destructive: 2n d = mλ (soft reflection)
    """
    return None  # Calculate wavelength

def diffraction_angle(a, m, wavelength):
    """Minima in single slit: a sin(θ) = mλ"""
    return np.arcsin(m * wavelength / a)

def resolution_criterion(theta, lambda_, D):
    """Rayleigh criterion: θ = 1.22 λ/D"""
    return 1.22 * wavelength / D

# Double slit experiment
wavelength = 500e-9  # 500 nm (green)
d = 0.1e-3  # 0.1 mm slit separation
L = 1.0  # 1 m to screen

print("Double slit interference:")
print(f"  λ = {wavelength*1e9:.0f} nm, d = {d*1e3:.1f} mm, L = {L:.1f} m")
print(f"  Fringe spacing: {fringe_spacing(wavelength, d, L)*1e3:.2f} mm")

# Constructive angles
for m in range(-3, 4):
    if m != 0:
        theta = np.arcsin(m * wavelength / d)
        print(f"  m = {m}: θ = {theta*180/np.pi:.2f}°")

# Single slit diffraction
a = 0.05e-3  # 50 μm slit width
print(f"\nSingle slit diffraction:")
print(f"  Slit width a = {a*1e6:.0f} μm")
for m in range(-3, 4):
    if m != 0:
        theta = diffraction_angle(a, m, wavelength)
        print(f"  m = {m}: θ = {theta*180/np.pi:.2f}°")

# Resolution
D = 0.1  # 10 cm aperture
theta_res = 1.22 * wavelength / D
print(f"\nResolution (D={D*100:.0f} cm):")
print(f"  Angular resolution: {theta_res*180/np.pi*3600:.1f} arcseconds")

# Fabry-Perot
def fabry_perot_finesse(F):
    """Finesse = π√F/(1-F) for high reflectivity."""
    return np.pi * np.sqrt(F) / (1 - F)

def fabry_perot_resolution(lambda_, FSR, finesse):
    """δλ = FSR/finesse"""
    return FSR / finesse

FSR = 1e9  # 1 GHz free spectral range
finesse = 100
delta_lambda = FSR / finesse
print(f"\nFabry-Perot interferometer:")
print(f"  FSR = {FSR/1e9:.1f} GHz")
print(f"  Finesse = {finesse}")
print(f"  Resolution: δλ = {delta_lambda/1e6:.1f} MHz")
```

### Polarization

```python
import numpy as np

def polarization_ellipse(Ex, Ey, phi, t):
    """Calculate polarization ellipse components."""
    return np.array([Ex * np.cos(wavelength), Ey * np.cos(wavelength + phi)])

def brewster_reflection(s, p):
    """Reflectivity for s and p polarizations."""
    pass

def malus_law(I0, theta):
    """I = I0 cos²θ after polarizer."""
    return I0 * np.cos(theta)**2

def fresnel_coefficients(n1, n2, theta_i):
    """r_s = (n1 cosθi - n2 cosθt)/(n1 cosθi + n2 cosθt)"""
    theta_t = snell_refraction(n1, n2, theta_i)
    if theta_t is None:
        return None, None
    cos_i, cos_t = np.cos(theta_i), np.cos(theta_t)
    r_s = (n1 * cos_i - n2 * cos_t) / (n1 * cos_i + n2 * cos_t)
    r_p = (n2 * cos_i - n1 * cos_t) / (n2 * cos_i + n1 * cos_t)
    return r_s, r_p

def birefringence_delta(n_e, n_o, d):
    """Optical path difference in birefringent crystal."""
    return (n_e - n_o) * d

def half_wave_plate_retardation(d, n_o, n_e):
    """δ = 2π(n_e - n_o)d/λ"""
    return 2 * np.pi * (n_e - n_o) * d

# Polarization calculations
n1, n2 = 1.0, 1.5
theta_i = 60 * np.pi / 180

r_s, r_p = fresnel_coefficients(n1, n2, theta_i)
R_s = abs(r_s)**2
R_p = abs(r_p)**2

print("Fresnel reflectivity (θi=60°, air-glass):")
print(f"  R_s = {R_s*100:.1f}% (s-polarized)")
print(f"  R_p = {R_p*100:.1f}% (p-polarized)")

# Malus law
I0 = 1.0
for theta_deg in [0, 30, 45, 60, 90]:
    I = malus_law(I0, theta_deg * np.pi / 180)
    print(f"  θ = {theta_deg}°: I/I0 = {I:.3f}")

# Birefringent crystal (calcite)
n_o = 1.658
n_e = 1.486
d = 0.1e-3  # 100 μm

delta_n = n_e - n_o
OPD = birefringence_delta(n_e, n_o, d)
print(f"\nCalcite (d=100 μm):")
print(f"  Birefringence Δn = {delta_n:.3f}")
print(f"  OPD = {OPD*1e6:.1f} μm")

# Wave plates
lambda_ = 500e-9  # 500 nm
lambda_quarter = lambda_ / 4
d_quarter = lambda_quarter / abs(delta_n)
print(f"\nQuarter-wave plate thickness: {d_quarter*1e6:.1f} μm")
```

### Gaussian Beams

```python
import numpy as np

def gaussian_beam_radius(w0, lambda_, z):
    """w(z) = w0 * sqrt(1 + (z/z_R)²)"""
    z_R = np.pi * w0**2 / lambda_
    return w0 * np.sqrt(1 + (z / z_R)**2)

def rayleigh_range(w0, lambda_):
    """z_R = πw0²/λ"""
    return np.pi * w0**2 / lambda_

def beam_waist(wavelength, divergence_angle):
    """w0 = λ/(πθ)"""
    return wavelength / (np.pi * divergence_angle)

def gouy_phase(z, lambda_):
    """ψ(z) = arctan(z/z_R)"""
    z_R = rayleigh_range(wavelength, lambda_)
    return np.arctan(z / z_R)

def m_squared(divergence_measured, divergence_diffraction):
    """M² = θ_measured/θ_diffraction"""
    return divergence_measured / divergence_diffraction

# HeNe laser beam
lambda_heNe = 632.8e-9  # 632.8 nm
w0 = 0.5e-3  # 0.5 mm beam waist
z_R = rayleigh_range(w0, lambda_heNe)

print("Gaussian beam (HeNe, w0=0.5mm):")
print(f"  Rayleigh range: {z_R*1e3:.1f} mm")

for z in [0, z_R, 2*z_R, 5*z_R, 10*z_R]:
    w = gaussian_beam_radius(w0, lambda_heNe, z)
    print(f"  z = {z*1e3:.1f} mm: w = {w*1e3:.2f} mm")

# Divergence
w_at_inf = gaussian_beam_radius(w0, lambda_heNe, 1.0)  # 1 meter
divergence = w_at_inf / 1.0  # approximate
print(f"\n  Beam divergence: {divergence*1e3:.2f} mrad")
print(f"  Diffraction-limited M² = 1.0")

# High-power laser
lambda_YAG = 1064e-9  # 1064 nm
P = 10  # 10 W
w0_high = 2e-3  # 2 mm

z_R_high = rayleigh_range(w0_high, lambda_YAG)
print(f"\nNd:YAG laser (λ=1064nm, w0=2mm):")
print(f"  Rayleigh range: {z_R_high*1e3:.1f} mm")
print(f"  Intensity at waist: {P/(np.pi*w0_high**2)/1e4:.1f} MW/cm²")
```

### Laser Physics

```python
import numpy as np

def gain_bandwidth(g0, delta_nu, nu0):
    """g(ν) = g0 / (1 + (ν-ν0)²/δν²)"""
    return None

def cavity_mode_spacing(c, L, n=1):
    """Δν = c/(2nL) for Fabry-Perot cavity."""
    return c / (2 * n * L)

def threshold_gain(alpha_i, R):
    """g_th = α_i + (1/2L) ln(1/R)"""
    return alpha_i + np.log(1/np.sqrt(R)) / L

def output_coupling(T, R1, R2):
    """T = 1 - R1 for input coupler."""
    return 1 - R1

def laser_power(P_pump, eta_slope, P_thresh):
    """P_out = η_slope(P_pump - P_thresh)"""
    return max(0, eta_slope * (P_pump - P_thresh))

def wavelength_to_frequency(wavelength):
    """ν = c/λ"""
    return 3e8 / wavelength

def frequency_stability(delta_nu, nu0):
    """Δν/ν for stability."""
    return delta_nu / nu0

# HeNe laser parameters
L = 0.3  # 30 cm cavity
R1, R2 = 0.98, 0.95  # Mirror reflectivities
nu_spacing = cavity_mode_spacing(3e8, L)

print("HeNe laser cavity:")
print(f"  Cavity length: {L*100:.0f} cm")
print(f"  Mode spacing: {nu_spacing/1e6:.1f} MHz")
print(f"  Gain bandwidth: ~1.5 GHz")

# Threshold
alpha_i = 0.01  # Internal loss per meter
L_cavity = 0.3
g_th = threshold_gain(alpha_i, np.sqrt(R1*R2))
print(f"\n  Gain threshold: {g_th*100:.1f}%/m")

# Nd:YAG laser
lambda_NdYAG = 1064e-9
P_pump = 10  # W
eta_slope = 0.5  # 50% slope efficiency
P_thresh = 2  # W

P_out = laser_power(P_pump, eta_slope, P_thresh)
print(f"\nNd:YAG laser:")
print(f"  Pump power: {P_pump} W")
print(f"  Output power: {P_out:.1f} W")
print(f"  Slope efficiency: {eta_slope*100:.0f}%")

# Frequency doubling efficiency
def shg_efficiency(P_fund, L_crystal, d_eff, n_match):
    """Second harmonic generation efficiency."""
    pass
```

## Best Practices

- Use Jones calculus for systematic analysis of polarization transformations through optical systems.
- Account for chromatic dispersion in lens design by specifying wavelength range.
- For interferometers, maintain path length stability within wavelengths for good visibility.
- Consider apodization and phase masks for optimizing diffraction-limited performance.
- When designing laser cavities, verify stability criterion 0 < g₁g₂ < 1.
- Account for thermal lensing effects in high-power laser systems.
- For thin film coatings, use transfer matrix method for accurate reflectance predictions.
- Consider atmospheric effects (turbulence, absorption) for free-space optical communication.
- Use spatial filtering for improving beam quality in Gaussian beam optics.
- Validate optical designs with ray tracing and wave propagation calculations.

