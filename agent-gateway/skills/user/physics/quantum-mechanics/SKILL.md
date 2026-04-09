---
name: quantum-mechanics
description: Quantum mechanics fundamentals including wave functions, operators, Schrödinger equation, superposition, entanglement, and quantum measurement for physics applications.
category: physics
tags:
  - physics
  - quantum-mechanics
  - wave-functions
  - schrödinger
  - operators
  - superposition
  - entanglement
  - quantum-states
difficulty: advanced
author: neuralblitz
---

# Quantum Mechanics

## What I do

I provide comprehensive expertise in quantum mechanics, the fundamental theory describing nature at the smallest scales of energy levels of atoms and subatomic particles. I enable you to work with wave functions, quantum operators, the Schrödinger equation, superposition, entanglement, and measurement postulates. My knowledge spans from foundational principles to advanced topics like perturbation theory and quantum dynamics essential for quantum computing, atomic physics, chemistry, and materials science.

## When to use me

Use quantum mechanics when you need to: compute energy levels of atomic systems, calculate transition probabilities and selection rules, analyze quantum tunneling phenomena, understand atomic and molecular spectra, model quantum harmonic oscillators, analyze spin systems and magnetic properties, simulate quantum dynamics and time evolution, or develop quantum computing algorithms.

## Core Concepts

- **Wave Functions and Probability Amplitudes**: Mathematical descriptions of quantum states encoding all observable information.
- **The Schrödinger Equation**: Fundamental dynamical equation governing quantum system evolution in time.
- **Quantum Operators and Observables**: Linear operators corresponding to measurable quantities with discrete or continuous spectra.
- **Superposition Principle**: Linear combination of quantum states forming valid states, leading to interference phenomena.
- **Heisenberg Uncertainty Principle**: Fundamental limits on simultaneous knowledge of conjugate variables like position and momentum.
- **Quantum Entanglement**: Non-classical correlations between quantum systems that defy classical intuition.
- **Quantum Measurement**: Wave function collapse and the probabilistic nature of quantum predictions.
- **Angular Momentum and Spin**: Intrinsic and orbital quantum properties with associated operators and commutation relations.
- **Perturbation Theory**: Approximate methods for solving quantum systems close to solvable cases.
- **Identical Particles and Symmetry**: Quantum statistics (bosons vs fermions) and their implications for many-body systems.

## Code Examples

### Wave Functions and Probability

```python
import numpy as np
from scipy import integrate

def gaussian_wavepacket(x, x0, sigma, p0):
    """
    Create a Gaussian wave packet.
    ψ(x) = (1/(2πσ²)^(1/4)) * exp(-(x-x0)²/(4σ²)) * exp(ip0x/ℏ)
    """
    norm = (1 / (2 * np.pi * sigma**2))**0.25
    envelope = np.exp(-(x - x0)**2 / (4 * sigma**2))
    phase = np.exp(1j * p0 * x)
    return norm * envelope * phase

def probability_density(psi):
    """Compute probability density |ψ(x)|²."""
    return np.abs(psi)**2

def normalize_wavefunction(psi, x):
    """Normalize wave function to have unit probability."""
    norm_squared, _ = integrate.quad(lambda x: np.abs(psi(x))**2, x[0], x[-1])
    norm = np.sqrt(norm_squared)
    return lambda x: psi(x) / norm, norm

# Example: Particle in a box wave functions
def particle_in_box_wavefunction(n, L, x):
    """
    ψ_n(x) = sqrt(2/L) * sin(nπx/L)
    Energy: E_n = n²π²ℏ²/(2mL²)
    """
    return np.sqrt(2/L) * np.sin(n * np.pi * x / L)

# Compute normalization and probabilities
x = np.linspace(0, 10, 1000)
L = 10

psi1 = particle_in_box_wavefunction(1, L, x)
psi2 = particle_in_box_wavefunction(2, L, x)

# Probability of finding particle in left half
prob_left = integrate.trapz(np.abs(psi1[:500])**2, x[:500])
print(f"Particle in box (n=1):")
print(f"  P(x < L/2) = {prob_left:.4f} (should be 0.5)")

# Normalized wave packet
x0, sigma, p0 = 5.0, 0.5, 2.0
psi_gauss = gaussian_wavepacket(x, x0, sigma, p0)
psi_norm, norm = normalize_wavefunction(lambda x: gaussian_wavepacket(x, x0, sigma, p0), x)
print(f"\nGaussian wave packet:")
print(f"  Original norm: {norm:.6f}")
print(f"  After normalization: {np.trapz(np.abs(psi_norm(x))**2, x):.6f}")
```

### Schrödinger Equation Solver

```python
import numpy as np
from scipy.linalg import eigh_tridiagonal
from scipy.integrate import solve_ivp

def finite_difference_schrodinger(V, x, m=1, hbar=1):
    """
    Solve 1D Schrödinger equation using finite differences.
    -ℏ²/2m ψ'' + Vψ = Eψ
    
    Returns: eigenvalues (energies) and eigenvectors (wavefunctions)
    """
    n = len(x)
    dx = x[1] - x[0]
    
    # Kinetic energy matrix elements (finite difference)
    h2 = hbar**2 / (2 * m * dx**2)
    
    # Tridiagonal matrices
    diag = np.full(n, 2 * h2 + V(x))
    off_diag = np.full(n - 1, -h2)
    
    # Boundary conditions (infinite well: ψ(0)=ψ(L)=0)
    diag[0] = h2 + V(x[0])
    diag[-1] = h2 + V(x[-1])
    
    eigenvalues, eigenvectors = eigh_tridiagonal(diag, off_diag)
    return eigenvalues, eigenvectors.T

# Example: Infinite square well with perturbation
L = 10
x = np.linspace(0, L, 200)

# Pure infinite well
V_infinite = np.zeros_like(x)
energies_inf, psi_inf = finite_difference_schrodinger(lambda x: 0, x)

print("Infinite square well energies (units of ℏ²/2m):")
for i, E in enumerate(energies_inf[:5]):
    exact = (i + 1)**2 * np.pi**2 / (2 * L**2)
    print(f"  E_{i+1} = {E:.4f} (exact: {exact:.4f})")

# Finite square well
def finite_well(x, V0=50, L=10):
    """Finite square well potential."""
    V = np.zeros_like(x)
    for i, xi in enumerate(x):
        if xi < L/4 or xi > 3*L/4:
            V[i] = V0
    return V

V_finite = finite_well(x)
energies_fin, psi_fin = finite_difference_schrodinger(lambda x: V_finite, x)

print(f"\nFinite square well:")
for i, E in enumerate(energies_fin[:5]):
    print(f"  E_{i+1} = {E:.4f} (bound states: E < {V_finite.max()})")

# Time-dependent Schrödinger equation
def time_dependent_schrodinger(t, psi, V_func, x, m=1, hbar=1):
    """
    Solve TDSE using split-operator method or Crank-Nicolson.
    Using finite differences for spatial derivative.
    """
    dx = x[1] - x[0]
    psi = psi.reshape(-1, 1)
    
    # Laplacian using finite differences
    laplacian = (np.roll(psi, -1, axis=0) - 2*psi + np.roll(psi, 1, axis=0)) / dx**2
    
    # Potential energy
    V = np.diag(V_func(x))
    
    # Schrödinger equation: iℏ dψ/dt = -ℏ²/2m ∇²ψ + Vψ
    dpsi = (-hbar**2 / (2*m)) * laplacian + V @ psi
    dpsi = dpsi.flatten()
    
    return -1j * dpsi / hbar

# Initialize Gaussian wave packet
x0, sigma = L/2, 0.5
psi0 = gaussian_wavepacket(x, x0, sigma, 2)  # Moving packet

print(f"\nTDSE: Initialized Gaussian wave packet at x={x0}")
```

### Quantum Operators and Expectation Values

```python
import numpy as np
from scipy import integrate

def expectation_value(psi, operator_func, x):
    """
    Compute expectation value <ψ|Ô|ψ>.
    For position: <x> = ∫ψ* x ψ dx
    For momentum: <p> = ∫ψ* (-iℏ d/dx) ψ dx
    """
    psi_conj = np.conj(psi)
    
    # Apply operator
    op_psi = operator_func(psi, x)
    
    # Integrate
    integrand = psi_conj * op_psi
    expectation, _ = integrate.trapz(integrand, x)
    
    return expectation

def position_operator(psi, x):
    """Position operator: xψ."""
    return x * psi

def momentum_operator(psi, x, hbar=1):
    """Momentum operator: -iℏ d/dx."""
    dpsi_dx = np.gradient(psi, x)
    return -1j * hbar * dpsi_dx

def kinetic_energy_operator(psi, x, m=1, hbar=1):
    """Kinetic energy operator: -ℏ²/2m d²/dx²."""
    d2psi_dx2 = np.gradient(np.gradient(psi, x), x)
    return -hbar**2 / (2*m) * d2psi_dx2

# Example: Harmonic oscillator
def harmonic_oscillator_analytic(n, x, m=1, hbar=1, omega=1):
    """
    Hermite polynomial solutions.
    E_n = ℏω(n + 1/2)
    """
    from scipy.special import hermite
    
    xi = np.sqrt(m * omega / hbar) * x
    Hn = hermite(n)(xi)
    norm = 1 / np.sqrt(2**n * np.math.factorial(n)) * (m * omega / (np.pi * hbar))**0.25
    return norm * Hn * np.exp(-xi**2 / 2)

x = np.linspace(-5, 5, 500)
psi0 = harmonic_oscillator_analytic(0, x)

# Compute expectation values
<x> = expectation_value(psi0, position_operator, x)
<p> = expectation_value(psi0, momentum_operator, x)
<T> = expectation_value(psi0, kinetic_energy_operator, x)

print("Harmonic oscillator ground state:")
print(f"  <x> = {<x>:.6f} (should be 0)")
print(f"  <p> = {<p>:.6f} (should be 0)")
print(f"  <T> = {hbar**2 * omega / 4:.4f} (expected)")

# Uncertainty product ΔxΔp ≥ ℏ/2
def uncertainty_position(psi, x):
    x2 = expectation_value(psi, position_operator, x)**2
    psi2 = expectation_value(psi, lambda psi, x: x**2 * psi, x)
    return np.sqrt(np.abs(psi2 - x2))

def uncertainty_momentum(psi, x, hbar=1):
    p2 = expectation_value(psi, momentum_operator, x)**2
    p2_sq = expectation_value(psi, lambda psi, x: momentum_operator(psi, x, hbar)**2, x)
    return np.sqrt(np.abs(p2_sq - p2**2))

delta_x = uncertainty_position(psi0, x)
delta_p = uncertainty_momentum(psi0, x)

print(f"\nUncertainty product:")
print(f"  Δx = {delta_x:.4f}")
print(f"  Δp = {delta_p:.4f}")
print(f"  ΔxΔp = {delta_x * delta_p:.4f} (≥ 0.5)")
```

### Quantum Tunneling

```python
import numpy as np

def tunneling_coefficient(E, V0, m=1, hbar=1, a=1):
    """
    Calculate tunneling probability through a rectangular barrier.
    For E < V0 (under-barrier transmission).
    
    Transmission coefficient T ≈ exp(-2κa)
    where κ = sqrt(2m(V0-E))/ℏ
    """
    if E > V0:
        # Above barrier (oscillatory)
        k = np.sqrt(2 * m * E) / hbar
        k1 = np.sqrt(2 * m * (V0 - E)) / hbar
        T = 1 / (1 + (V0**2 * np.sinh(k1*a)**2) / (4 * E * (V0 - E)))
    else:
        # Below barrier (exponential decay)
        kappa = np.sqrt(2 * m * (V0 - E)) / hbar
        T = np.exp(-2 * kappa * a)
    
    return T

# Example: Alpha decay
m_alpha = 3727  # MeV/c²
V0 = 25  # MeV (Coulomb barrier height)
E_alpha = 5  # MeV (typical alpha energy)
hbar_c = 197.3  # MeV·fm (converted from eV·m)

# Convert to consistent units
hbar = hbar_c  # MeV·fm
a = 5  # fm (barrier width)

T = tunneling_coefficient(E_alpha, V0, m_alpha, hbar, a)
print(f"Alpha decay tunneling:")
print(f"  Barrier height: {V0} MeV")
print(f"  Alpha energy: {E_alpha} MeV")
print(f"  Transmission probability: {T:.2e}")
print(f"  Log(T) = {np.log10(T):.1f}")

# Scan energies
energies = np.linspace(4, 8, 50)
transmissions = [tunneling_coefficient(E, V0, m_alpha, hbar, a) for E in energies]

print(f"\nEnergy dependence of tunneling:")
print(f"  T(E=4MeV) = {transmissions[0]:.2e}")
print(f"  T(E=6MeV) = {transmissions[25]:.2e}")
print(f"  T(E=8MeV) = {transmissions[-1]:.2e}")

# Double barrier (resonant tunneling)
def double_barrier_transmission(E, V0, m=1, hbar=1, a=1, b=5):
    """
    Double barrier with well width b-a between barriers at [0,a] and [b,c].
    Shows resonant transmission at certain energies.
    """
    kappa = np.sqrt(2 * m * V0) / hbar
    k = np.sqrt(2 * m * E) / hbar
    
    # Simplified resonant condition: k*b = nπ
    resonance_condition = np.sin(k * b / 2)**2
    T_resonant = 1 / (1 + (V0**2 * kappa**2 * np.sin(k*b)**2) / (4 * E * (V0 - E) * k**2))
    
    return T_resonant

print(f"\nDouble barrier resonant tunneling:")
for n in range(1, 4):
    E_res = (n * np.pi * hbar / b)**2 / (2 * m)
    print(f"  Resonance {n}: E ≈ {E_res:.2f} MeV")
```

### Spin Systems and Entanglement

```python
import numpy as np

def pauli_matrices():
    """Return Pauli matrices and identity."""
    sigma_x = np.array([[0, 1], [1, 0]], dtype=complex)
    sigma_y = np.array([[0, -1j], [1j, 0]], dtype=complex)
    sigma_z = np.array([[1, 0], [0, -1]], dtype=complex)
    I = np.array([[1, 0], [0, 1]], dtype=complex)
    return sigma_x, sigma_y, sigma_z, I

def spin_state(direction, theta=0, phi=0):
    """
    Create spin-1/2 state in arbitrary direction.
    |θ,φ⟩ = cos(θ/2)|↑⟩ + e^(iφ)sin(θ/2)|↓⟩
    """
    sigma_x, sigma_y, sigma_z, I = pauli_matrices()
    
    # State vector
    psi = np.array([np.cos(theta/2), np.exp(1j * phi) * np.sin(theta/2)])
    return psi / np.linalg.norm(psi)

def expectation_spin(psi, direction):
    """Compute expectation value of spin in given direction."""
    sigma_x, sigma_y, sigma_z, I = pauli_matrices()
    
    # Spin operator in direction
    if direction == 'x':
        sigma = sigma_x
    elif direction == 'y':
        sigma = sigma_y
    else:
        sigma = sigma_z
    
    return np.real(np.conj(psi) @ sigma @ psi)

# Bell states (maximally entangled)
def bell_state(which):
    """Create one of four Bell states."""
    if which == '00':
        return np.array([1, 0, 0, 1]) / np.sqrt(2)
    elif which == '01':
        return np.array([1, 0, 0, -1]) / np.sqrt(2)
    elif which == '10':
        return np.array([0, 1, 1, 0]) / np.sqrt(2)
    else:  # '11'
        return np.array([0, 1, -1, 0]) / np.sqrt(2)

def partial_trace(rho, subsystem):
    """
    Compute partial trace of density matrix.
    subsystem: which qubit to trace out (0 or 1)
    """
    # Reshape to 4x4 density matrix
    rho = rho.reshape(2, 2, 2, 2)
    
    if subsystem == 0:
        # Trace over first qubit
        reduced = np.trace(rho, axis1=0, axis2=2)
    else:
        # Trace over second qubit
        reduced = np.trace(rho, axis1=1, axis2=3)
    
    return reduced

def entanglement_entropy(rho):
    """Compute von Neumann entropy of reduced density matrix."""
    eigenvalues = np.linalg.eigvalsh(rho)
    eigenvalues = eigenvalues[eigenvalues > 1e-10]  # Filter zeros
    return -np.sum(eigenvalues * np.log2(eigenvalues))

# Bell state entanglement
psi_bell = bell_state('00')
rho = np.outer(psi_bell, np.conj(psi_bell))
rho_A = partial_trace(rho, 0)
rho_B = partial_trace(rho, 1)

print("Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2:")
print(f"  Reduced density matrix entropy: {entanglement_entropy(rho_A):.4f}")
print(f"  Maximum entanglement (log2(2) = 1): {entanglement_entropy(rho_A):.4f}")

# Werner state (mixture of Bell state and noise)
def werner_state(f, which='00'):
    """Werner state: F|Φ⟩⟨Φ| + (1-F)/3 I (for qubit case)."""
    bell = bell_state(which)
    rho_bell = np.outer(bell, np.conj(bell))
    I = np.eye(4, dtype=complex)
    
    # Isotropic Werner state for qubits
    rho = f * rho_bell + (1 - f) / 3 * I
    
    # Renormalize
    return rho / np.trace(rho)

print("\nWerner state entanglement vs fidelity:")
for f in [0.5, 0.7, 0.9, 1.0]:
    rho_w = werner_state(f)
    rho_red = partial_trace(rho_w, 0)
    S = entanglement_entropy(rho_red)
    print(f"  f={f}: Entanglement S = {S:.4f}")
```

## Best Practices

- Always normalize wave functions numerically or analytically to ensure proper probability interpretation.
- Use consistent units throughout calculations; common choices include atomic units or natural units with ℏ=c=1.
- For numerical solutions, choose grid spacing small enough to resolve features but coarse enough for efficiency.
- When computing expectation values, verify operator Hermiticity and boundary conditions.
- For time-dependent problems, use unitary evolution methods (split-operator, Crank-Nicolson) to preserve probability.
- Be aware of the sign ambiguity in wave functions; physical observables are unaffected but interference depends on relative phases.
- In perturbation theory, verify convergence by computing higher-order corrections.
- For identical particles, always use properly symmetrized/antisymmetrized wave functions.
- When analyzing entanglement, use multiple measures (entropy, negativity) for complete characterization.
- Validate numerical solutions against known analytical results when available.

