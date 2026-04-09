---
name: Optics
description: Geometrical and wave optics including ray tracing, lens systems, interferometry, polarization, lasers, and nonlinear optics for physics and engineering applications.
license: MIT
compatibility: python>=3.8
audience: physicists, optical-engineers, researchers, students
category: physics
---

# Optics

## What I Do

I provide comprehensive optics tools including geometrical optics, wave optics, interferometry, polarization, laser physics, and nonlinear optics for physics and engineering applications.

## When to Use Me

- Optical system design
- Interferometer analysis
- Laser cavity design
- Thin film coatings
- Fiber optics
- Nonlinear optics

## Core Concepts

- **Geometrical Optics**: Ray tracing, ABCD matrices
- **Wave Optics**: Diffraction, interference
- **Polarization**: Jones vectors, Mueller matrices
- **Laser Physics**: Cavity modes, gain, linewidth
- **Interferometry**: Michelson, Fabry-Perot
- **Thin Films**: Coating design, reflectivity
- **Nonlinear Optics**: SHG, Raman, Kerr
- **Fiber Optics**: Waveguides, dispersion

## Code Examples

### Ray Tracing (ABCD Matrix)

```python
import numpy as np

def translation_matrix(d):
    return np.array([[1, d], [0, 1]])

def thin_lens_matrix(f):
    return np.array([[1, 0], [-1/f, 1]])

def interface_matrix(n1, n2):
    return np.array([[1, 0], [0, n1/n2]])

def propagate_ray(ABCD, ray):
    y, theta = ray
    return np.dot(ABCD, ray)

def transfer_matrix_system(matrices):
    M = np.eye(2)
    for M_i in matrices:
        M = M_i @ M
    return M

f1, f2 = 50, -30  # mm
d1, d2 = 20, 40   # mm

M_lens1 = thin_lens_matrix(f1)
M_drift1 = translation_matrix(d1)
M_lens2 = thin_lens_matrix(f2)
M_drift2 = translation_matrix(d2)

M_total = M_drift2 @ M_lens2 @ M_drift1 @ M_lens1
print(f"System matrix:\n{M_total}")
```

### Interferometry

```python
def michelson_interference(delta, I0=1):
    return I0 * np.cos(delta / 2)**2

def fabry_perot_transmission(free_spectral_range, finesse, nu):
    delta = 2 * np.pi * nu / free_spectral_range
    return 1 / (1 + finesse**2 * np.sin(delta/2)**2)

def coherence_length(c, delta_nu):
    return c / delta_nu

def visibility(I_max, I_min):
    return (I_max - I_min) / (I_max + I_min)

def thin_film_reflectivity(n_film, n_substrate, n_air, d, wavelength):
    n1, n2, n3 = n_air, n_film, n_substrate
    phi = 4 * np.pi * n2 * d / wavelength
    
    r12 = (n1 - n2) / (n1 + n2)
    r23 = (n2 - n3) / (n2 + n3)
    
    return (r12 + r23 * np.exp(1j*phi))**2 / (1 + r12 * r23 * np.exp(1j*phi))**2

d = 500e-9  # 500 nm film
lam = 600e-9
R = thin_film_reflectivity(1.38, 1.5, 1.0, d, lam)
print(f"Film reflectivity: {abs(R)**2:.4f}")
```

### Laser Physics

```python
def laser_threshold_gain(g_th, losses):
    return g_th + losses

def cavity_mode_spacing(c, n, L):
    return c / (2 * n * L)

def output_coupling(T, L_internal):
    return T / (T + L_internal)

def laser_linewidth(nu, P, tau_cavity, hnu):
    from scipy.constants import h
    return nu * h * nu / (4 * np.pi * P * tau_cavity)

def rate_equations(N2, N1, sigma_e, sigma_a, V, phi, Wp):
    dN2 = Wp - (N2 - N1) * sigma_e * phi / V - N2 / tau
    dphi = (N2 - N1) * sigma_e * phi / V - phi / tau_cavity
    return dN2, dphi

c = 3e8
n = 1.5
L = 0.5  # m
delta_nu = cavity_mode_spacing(c, n, L)
print(f"FSR: {delta_nu:.0f} Hz")
```

### Polarization

```python
def jones_vector(theta, delta):
    return np.array([np.cos(theta), np.exp(1j * delta) * np.sin(theta)])

def jones_matrix_linear_polarizer(angle):
    c = np.cos(angle)**2
    s = np.sin(angle)**2
    cs = np.cos(angle) * np.sin(angle)
    return np.array([[c, cs], [cs, s]])

def jones_matrix_retarder(delta, fast_axis_angle=0):
    return np.array([
        [np.cos(delta/2) + 1j*np.sin(delta/2)*np.cos(2*fast_axis_angle),
         1j*np.sin(delta/2)*np.sin(2*fast_axis_angle)],
        [1j*np.sin(delta/2)*np.sin(2*fast_axis_angle),
         np.cos(delta/2) - 1j*np.sin(delta/2)*np.cos(2*fast_axis_angle)]
    ])

def stokes_parameters(S0, S1, S2, S3):
    return np.array([S0, S1, S2, S3])

def mueller_matrix_linear_polarizer(P):
    return np.array([
        [1, P, 0, 0],
        [P, P**2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ])

delta = np.pi  # Half-wave plate
print(f"Jones matrix:\n{jones_matrix_retarder(delta)}")
```

### Diffraction

```python
def fraunhofer_intensity(k, a, z, I0=1):
    beta = k * a / (2 * z)
    sinc = np.sin(beta) / beta
    return I0 * sinc**2

def fresnel_diffraction(z, lambda_, w):
    from scipy.special import fresnel
    u = np.sqrt(2 / (lambda_ * z)) * w
    S, C = fresnel(u)
    return 0.5 * ((0.5 + C)**2 + (0.5 + S)**2)

def grating_equation(d, theta_m, lambda_):
    return np.sin(theta_m) = m * lambda_ / d

def resolve_two_points(theta, lambda_, D):
    return 1.22 * lambda_ / D * np.sin(theta)

def numerical_aperture(n, theta_max):
    return n * np.sin(theta_max)

D = 0.1  # 10 cm aperture
lam = 500e-9
resolution = 1.22 * lam / D
print(f"Angular resolution: {resolution:.2e} rad")
```

## Best Practices

1. **Paraxial Approximation**: Check validity for given NA
2. **Aberrations**: Consider spherical, chromatic aberrations
3. **Coherence**: Consider spatial and temporal coherence
4. **Polarization**: Account for polarization effects
5. **Alignment**: Minimize misalignment errors

## Common Patterns

```python
# Gaussian beam propagation
def gaussian_beam_w0(wavelength, w0):
    k = 2 * np.pi / wavelength
    zR = np.pi * w0**2 / wavelength
    return k, zR
```

## Core Competencies

1. Geometrical optics and ray tracing
2. Wave optics and diffraction
3. Laser physics and cavities
4. Interferometry
5. Polarization optics
