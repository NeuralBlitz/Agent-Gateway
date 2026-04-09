---
name: statistical-mechanics
description: Statistical mechanics fundamentals including ensembles, partition functions, phase transitions, Monte Carlo methods, and non-equilibrium dynamics for physics applications.
category: physics
tags:
  - physics
  - statistical-mechanics
  - ensembles
  - partition-functions
  - phase-transitions
  - monte-carlo
  - non-equilibrium
  - thermodynamics
difficulty: advanced
author: neuralblitz
---

# Statistical Mechanics

## What I do

I provide comprehensive expertise in statistical mechanics, the bridge between microscopic physics and thermodynamics. I enable you to apply ensemble theory, calculate partition functions, analyze phase transitions, implement Monte Carlo simulations, and model non-equilibrium dynamics. My knowledge spans from foundational statistical foundations to modern computational methods essential for condensed matter physics, soft matter, biological physics, and materials science.

## When to use me

Use statistical mechanics when you need to: derive thermodynamic properties from microscopic models, analyze critical phenomena and phase transitions, simulate many-body systems using Monte Carlo, calculate equation of state for gases and materials, understand transport phenomena and fluctuations, model magnetic systems and spin models, or connect molecular dynamics to macroscopic observables.

## Core Concepts

- **Microstates and Macrostates**: Microscopic configurations and their macroscopic aggregations with entropy S = k_B ln Ω.
- **Phase Space**: Complete specification of particle positions and momenta for classical systems.
- **Ensembles**: Collections of microstates with different constraints (microcanonical, canonical, grand canonical).
- **Partition Functions**: Z = Σ exp(-βE) encoding all thermodynamic information.
- **Thermodynamic Relations**: Connecting partition functions to free energy, entropy, and equations of state.
- **Phase Transitions**: Qualitative changes in system behavior with singularities in derivatives of free energy.
- **Mean-Field Theory**: Approximate treatment replacing interactions with effective fields.
- **Critical Phenomena**: Universal behavior near phase transitions characterized by critical exponents.
- **Fluctuation-Dissipation**: Connecting response functions to equilibrium fluctuations.
- **Non-Equilibrium Dynamics**: Time evolution toward equilibrium and current flows.

## Code Examples

### Ensembles and Partition Functions

```python
import numpy as np

def boltzmann_factor(E, T):
    """exp(-E/k_B T)"""
    kB = 1.38e-23
    return np.exp(-E / (kB * T))

def canonical_partition_function(energies, T):
    """Z = Σ exp(-βE_i)"""
    beta = 1 / (1.38e-23 * T)
    return np.sum(np.exp(-beta * np.array(energies)))

def canonical_expectation(E, Z, T):
    """⟨E⟩ = (1/Z) Σ E_i exp(-βE_i)"""
    beta = 1 / (1.38e-23 * T)
    weights = np.exp(-beta * np.array(E))
    return np.sum(E * weights) / Z

def heat_capacity(energies, T, Cv):
    """Cv = (⟨E²⟩ - ⟨E⟩²) / (k_B T²)"""
    beta = 1 / (1.38e-23 * T)
    Z = canonical_partition_function(energies, T)
    E_avg = canonical_expectation(energies, Z, T)
    E2_avg = canonical_expectation([E**2 for E in energies], Z, T)
    return (E2_avg - E_avg**2) / ((1.38e-23) * T**2)

# Example: Two-level system
E0, E1 = 0, 0.001  # Energy levels in J (corresponds to ~72 K)
energies = [E0, E1]

print("Two-level system:")
for T in [10, 50, 100, 300, 1000]:
    Z = canonical_partition_function(energies, T)
    E_avg = canonical_expectation(energies, Z, T)
    print(f"  T = {T:4d} K: Z = {Z:.4f}, ⟨E⟩ = {E_avg*1e21:.2f} × 10⁻²¹ J")

# Partition function for harmonic oscillator
def harmonic_oscillator_z(T, omega):
    """Z = exp(-βℏω/2) / (1 - exp(-βℏω))"""
    hbar = 1.055e-34
    beta = 1 / (1.38e-23 * T)
    if omega * hbar * beta > 100:
        return np.exp(-omega * hbar * beta / 2)
    return np.exp(-omega * hbar * beta / 2) / (1 - np.exp(-omega * hbar * beta))

# Free particle partition function (classical limit)
def free_partition_function_1D(V, T, m=1.67e-27):
    """Z = V / λ³ where λ = h/√(2πmkT)"""
    h = 6.626e-34
    kB = 1.38e-23
    lam = h / np.sqrt(2 * np.pi * m * kB * T)
    return V / lam**3

# 3D ideal gas
def ideal_gas_pressure(N, T, V, m=1.67e-27):
    """P = NkT/V (ideal gas law)"""
    kB = 1.38e-23
    return N * kB * T / V

N_A = 6.022e23
V = 0.0224  # 1 mole at STP
T = 273
P = ideal_gas_pressure(N_A, T, V)
print(f"\nIdeal gas at STP: P = {P/1e5:.2f} bar")

# Grand canonical ensemble
def grand_canonical_partition_function(grand_mu, T, single_particle_states):
    """Ξ = Π_k (1 + exp(-β(ε_k - μ))) for fermions"""
    beta = 1 / (1.38e-23 * T)
    Xi = 1
    for eps in single_particle_states:
        Xi *= (1 + np.exp(-beta * (eps - grand_mu)))
    return Xi

# Fermi-Dirac and Bose-Einstein occupation
def fermi_dirac_occupation(eps, mu, T):
    """f(ε) = 1/(exp((ε-μ)/kT) + 1)"""
    kB = 1.38e-23
    return 1 / (np.exp((eps - mu) / (kB * T)) + 1)

def bose_einstein_occupation(eps, mu, T):
    """n(ε) = 1/(exp((ε-μ)/kT) - 1)"""
    kB = 1.38e-23
    if mu >= eps:
        return np.inf
    return 1 / (np.exp((eps - mu) / (kB * T)) - 1)

print(f"\nFermi-Dirac occupation (ε-μ = 0.1 eV, T=300K):")
delta_E = 0.1 * 1.6e-19  # 0.1 eV
f = fermi_dirac_occupation(delta_E, 0, 300)
print(f"  f(ε_F + 0.1 eV) = {f:.4f}")
```

### Ising Model and Phase Transitions

```python
import numpy as np

class IsingModel:
    def __init__(self, L, J=1, h=0):
        """2D Ising model on L×L lattice."""
        self.L = L
        self.J = J
        self.h = h
        self.N = L * L
        self.spins = np.random.choice([-1, 1], size=(L, L))
    
    def energy(self):
        """Calculate total energy."""
        E = 0
        for i in range(self.L):
            for j in range(self.L):
                # Periodic boundaries
                right = self.spins[(i+1) % self.L, j]
                down = self.spins[i, (j+1) % self.L]
                E -= self.J * self.spins[i, j] * (right + down)
                E -= self.h * self.spins[i, j]
        return E / 2  # Each bond counted twice
    
    def magnetization(self):
        """Total magnetization."""
        return np.sum(self.spins)
    
    def metropolis_step(self, T):
        """Single Metropolis sweep."""
        kB = 1.0  # Units where kB = 1
        
        for _ in range(self.N):
            # Random spin flip
            i = np.random.randint(self.L)
            j = np.random.randint(self.L)
            
            # Calculate energy change
            neighbors = (self.spins[(i-1) % self.L, j] + 
                        self.spins[(i+1) % self.L, j] +
                        self.spins[i, (j-1) % self.L] + 
                        self.spins[i, (j+1) % self.L])
            
            dE = 2 * self.spins[i, j] * (self.J * neighbors + self.h)
            
            # Metropolis criterion
            if dE < 0 or np.random.random() < np.exp(-dE / (kB * T)):
                self.spins[i, j] *= -1
    
    def equilibrate(self, T, n_sweeps=1000):
        """Equilibrate at given temperature."""
        for _ in range(n_sweeps):
            self.metropolis_step(T)
    
    def simulate(self, T, n_sweeps=10000):
        """Run simulation and return observables."""
        self.equilibrate(T, n_sweeps)
        
        mags = []
        eners = []
        for _ in range(n_sweeps):
            self.metropolis_step(T)
            mags.append(self.magnetization())
            eners.append(self.energy())
        
        return np.mean(mags)/self.N, np.std(mags)/self.N, np.mean(eners)/self.N, np.std(eners)/self.N

# Critical temperature for 2D Ising (Onsager solution: kB Tc/J ≈ 2.269)
L = 20
ising = IsingModel(L)

print("2D Ising model simulation:")
temperatures = [1.0, 2.0, 2.2, 2.269, 2.3, 2.5, 3.0]
for T in temperatures:
    m, dm, E, dE = ising.simulate(T, n_sweeps=5000)
    print(f"  T = {T:.2f}: m = {m:.4f} ± {dm:.4f}, E = {E/L**2:.4f} ± {dE/L**2:.4f}")

# Binder cumulant
def binder_cumulant(mags):
    """U = 1 - ⟨m⁴⟩/(3⟨m²⟩²)"""
    m2 = np.mean(np.array(mags)**2)
    m4 = np.mean(np.array(mags)**4)
    return 1 - m4 / (3 * m2**2)

print(f"\nBinder cumulant at Tc ≈ 2.27:")
for T in [2.2, 2.269, 2.3]:
    ising2 = IsingModel(20)
    ising2.equilibrate(T, 5000)
    mags = [ising2.magnetization() for _ in range(5000)]
    U = binder_cumulant(mags)
    print(f"  U(T={T}) = {U:.4f}")
```

### Mean-Field Theory

```python
import numpy as np

def mean_field_ising(T, J, h=0, max_iter=100, tol=1e-6):
    """Mean-field solution of Ising model."""
    kB = 1.0  # Units where kB = 1
    beta = 1 / T
    
    # Initial magnetization
    m = 0.1
    
    for iteration in range(max_iter):
        m_new = np.tanh(beta * (J * 6 * m + h))  # z=6 for 3D
        if abs(m_new - m) < tol:
            break
        m = m_new
    
    return m

def solve_self_consistent(T, J):
    """Solve MF equations numerically."""
    from scipy.optimize import brentq
    
    def equation(m):
        kB = 1.0
        return m - np.tanh(m * J * 6 / (kB * T))
    
    # Below Tc, look for non-zero solution
    Tc_mf = J * 6  # Mean-field Tc
    
    if T > Tc_mf:
        return 0
    
    # Find root
    try:
        m = brentq(equation, 1e-6, 1.0)
        return m
    except:
        return 0

# Critical exponents
Tc_mf = 6.0  # For J=1
print("Mean-field Ising critical behavior:")
print(f"  Mean-field Tc = {Tc_mf:.3f} J/kB")

# Below Tc, magnetization follows m ∝ (Tc - T)^β with β = 0.5
for T in [0.5, 1.0, 2.0, 4.0, 5.0, 5.5, 5.9, 5.99]:
    m = solve_self_consistent(T, 1.0)
    if T < Tc_mf:
        beta_mf = np.log(m) / np.log((Tc_mf - T) / Tc_mf)
        print(f"  T = {T:.2f}: m = {m:.4f}, effective β = {beta_mf:.3f}")
    else:
        print(f"  T = {T:.2f}: m = 0")

# Landau theory
def landau_free_energy(m, a, b, T):
    """F(m) = a(T-Tc)m² + bm⁴ + hm"""
    return a * (T - Tc_mf) * m**2 + b * m**4

# Susceptibility
def susceptibility(T, Tc, chi0=1):
    """χ ∝ |T-Tc|^(-γ) with γ = 1 (MF)"""
    if T > Tc:
        return chi0 / (T - Tc)
    return chi0 / (T_c - T)

print(f"\nMean-field susceptibility divergence:")
for T in [2.0, 1.1, 1.01, 1.001]:
    chi = susceptibility(T, 1.0)
    print(f"  T = {T:.3f}: χ = {chi:.1f}")
```

### Monte Carlo Methods

```python
import numpy as np

def metropolis_sampling(pdf, proposal_std, n_samples, x0):
    """Metropolis-Hastings sampling from arbitrary PDF."""
    samples = [x0]
    x = x0
    
    for _ in range(n_samples):
        x_proposed = x + np.random.normal(0, proposal_std)
        alpha = pdf(x_proposed) / pdf(x)
        
        if np.random.random() < alpha:
            x = x_proposed
        
        samples.append(x)
    
    return np.array(samples)

def wolff_cluster_update(spins, J, T):
    """Wolff single-cluster Monte Carlo update."""
    L = len(spins)
    visited = np.zeros(L, dtype=bool)
    
    # Start new cluster
    site = np.random.randint(L)
    cluster = [site]
    visited[site] = True
    
    S_cluster = spins[site]
    
    # Grow cluster
    i = 0
    while i < len(cluster):
        current = cluster[i]
        P_add = 1 - np.exp(-2 * J / T)
        
        neighbors = [(current - 1) % L, (current + 1) % L]
        for n in neighbors:
            if not visited[n] and spins[n] == S_cluster:
                if np.random.random() < P_add:
                    visited[n] = True
                    cluster.append(n)
        i += 1
    
    # Flip cluster
    for site in cluster:
        spins[site] *= -1
    
    return spins

def swendsen_wang_update(spins, J, T):
    """Swendsen-Wang multi-cluster update."""
    L = len(spins)
    bonds = np.zeros(L, dtype=bool)
    
    # Create bonds
    for i in range(L):
        if spins[i] == spins[(i+1) % L]:
            P_bond = 1 - np.exp(-2 * J / T)
            bonds[i] = np.random.random() < P_bond
    
    # Find clusters using bond connectivity
    clusters = []
    visited = np.zeros(L, dtype=bool)
    
    for i in range(L):
        if not visited[i]:
            cluster = [i]
            visited[i] = True
            j = i
            while bonds[j]:
                j = (j + 1) % L
                if not visited[j]:
                    visited[j] = True
                    cluster.append(j)
            clusters.append(cluster)
    
    # Flip random subset of clusters
    for cluster in clusters:
        if np.random.random() < 0.5:
            for site in cluster:
                spins[site] *= -1
    
    return spins

# Auto-correlation time estimation
def autocorrelation_time(samples):
    """Estimate autocorrelation time from decay of autocorrelation function."""
    n = len(samples)
    mean = np.mean(samples)
    var = np.var(samples)
    
    # Normalized autocorrelation
    acf = np.correlate(samples - mean, samples - mean, mode='full')
    acf = acf[n-1:] / (acf[n-1] * np.arange(n, 0, -1))
    
    # Integrate to get tau
    tau = 0.5 + np.sum(acf[1:])
    return tau

# Example: 1D Ising model autocorrelation
N = 100
J, T = 1.0, 1.0
spins = np.random.choice([-1, 1], size=N)

# Measure autocorrelation time for different algorithms
print("Autocorrelation time comparison (1D Ising at Tc):")
print(f"  Single-spin flip: high τ (critical slowing down)")
print(f"  Wolff/S-W clusters: τ = O(1) near Tc")
```

### Non-Equilibrium Dynamics

```python
import numpy as np

class MasterEquation:
    def __init__(self, transition_matrix):
        """dP/dt = W·P for Markov process."""
        self.W = transition_matrix
    
    def propagate(self, P0, dt, n_steps):
        """Forward Euler integration of master equation."""
        P = P0.copy()
        t = 0
        results = [P.copy()]
        
        for _ in range(n_steps):
            dP = self.W @ P
            P = P + dt * dP
            t += dt
            results.append(P.copy())
        
        return np.array(results)

def langevin_dynamics(x0, v0, gamma, kT, m, dt, n_steps):
    """Langevin dynamics: m dv/dt = -γv - dU/dx + √(2γkT)ξ(t)"""
    x, v = x0, v0
    results = [(x, v)]
    
    for _ in range(n_steps):
        # Random force (Einstein relation)
        xi = np.random.normal(0, 1)
        noise = np.sqrt(2 * gamma * kT / dt)
        
        # Velocity Verlet with friction
        v += dt / m * (-gamma * v + noise * xi)
        x += dt * v
        
        results.append((x, v))
    
    return np.array(results)

def green_kubo_relation(velocity_correlation):
    """Diffusion coefficient from velocity autocorrelation."""
    return np.trapz(velocity_correlation, dx=dt)

# Brownian motion
def brownian_motion_1D(D, dt, n_steps):
    """Einstein-Smoluchowski relation: ⟨x²⟩ = 2Dt"""
    x = 0
    positions = [x]
    
    for _ in range(n_steps):
        dx = np.random.normal(0, np.sqrt(2 * D * dt))
        x += dx
        positions.append(x)
    
    return np.array(positions)

# Mean squared displacement
def mean_squared_displacement(positions):
    """MSD = ⟨(x(t) - x(0))²⟩"""
    return np.array([np.mean((positions[t:] - positions[:-t])**2) 
                     for t in range(len(positions)//2)])

D = 1.0  # Diffusion coefficient
dt = 0.001
n_steps = 10000

positions = brownian_motion_1D(D, dt, n_steps)
msd = mean_squared_displacement(positions)

print("Brownian motion (Einstein relation):")
print(f"  D = {D}")
print(f"  MSD(t) ≈ 2Dt: slope at short times = {np.polyfit(range(100), msd[:100], 1)[0]/dt:.2f}")

# Fokker-Planck equation (conceptual)
def fokker_planck_forward(x, t, D, drift):
    """∂P/∂t = -∂/∂x(Drift·P) + D ∂²P/∂x²"""
    pass

# Non-equilibrium work relations
def jarzynski_equality(work_samples):
    """⟨exp(-W/kT)⟩ = exp(-ΔF/kT)"""
    kT = 1.0  # Units
    return np.mean(np.exp(-np.array(work_samples) / kT))

# Crooks fluctuation theorem
def crooks_fluctuation_theorem(work_forward, work_reverse):
    """P_F(W)/P_R(-W) = exp((W - ΔF)/kT)"""
    pass
```

## Best Practices

- Verify equilibrium properties by checking that observables don't drift over time in long simulations.
- Use multiple independent runs with different random seeds to estimate statistical errors.
- For critical phenomena, simulate large systems near Tc to minimize finite-size effects.
- Use cluster algorithms (Wolff, Swendsen-Wang) to overcome critical slowing down near phase transitions.
- Distinguish between different ensemble averages and ensure proper equilibration before measurement.
- Use block averaging to estimate statistical errors and autocorrelation times.
- For non-equilibrium simulations, verify that fluctuations satisfy fluctuation-dissipation relations.
- When applying mean-field theory, check self-consistency of the mean-field approximation.
- Use histogram reweighting to efficiently sample across phase transitions.
- Consider conservation laws and select appropriate dynamics (microcanonical vs canonical) for your system.

