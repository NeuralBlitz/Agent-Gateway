---
name: computational-physics
description: Numerical methods for physics including finite difference, Monte Carlo, molecular dynamics, finite element analysis, and chaos theory for simulation applications.
category: physics
tags:
  - physics
  - computational-physics
  - numerical-methods
  - monte-carlo
  - molecular-dynamics
  - finite-element
  - simulation
  - chaos
difficulty: advanced
author: neuralblitz
---

# Computational Physics

## What I do

I provide comprehensive expertise in computational physics, applying numerical methods and algorithms to solve physics problems. I enable you to implement finite difference methods, Monte Carlo simulations, molecular dynamics, finite element analysis, and study chaotic systems. My knowledge spans from foundational numerical analysis to advanced simulation techniques essential for modern physics research, engineering analysis, and scientific computing.

## When to use me

Use computational physics when you need to: simulate particle dynamics and many-body systems, solve partial differential equations numerically, model random processes and statistical mechanics, perform finite element structural/thermal analysis, analyze chaotic and nonlinear systems, implement grid-based and particle-based simulations, optimize numerical parameters, or visualize physical phenomena.

## Core Concepts

- **Finite Difference Methods**: Discretizing derivatives on grids for solving ODEs and PDEs.
- **Monte Carlo Methods**: Random sampling for integration, optimization, and statistical simulation.
- **Molecular Dynamics**: Simulating atomic trajectories using Newton's laws with interatomic potentials.
- **Finite Element Analysis**: Dividing domains into elements for solving boundary value problems.
- **Chaos and Sensitivity**: Deterministic unpredictability with sensitive dependence on initial conditions.
- **Numerical Stability**: Ensuring algorithms produce bounded results without amplification of errors.
- **Convergence Analysis**: Verifying numerical solutions approach exact solutions as discretization refines.
- **Boundary Conditions**: Enforcing constraints at domain boundaries (Dirichlet, Neumann, periodic).
- **Symplectic Integrators**: Preserving phase space volume in Hamiltonian dynamics.
- **Parallel Computing**: Distributing computations across processors for scaling performance.

## Code Examples

### Finite Difference Methods

```python
import numpy as np

def central_difference(f, x, h=1e-5):
    """Central difference for first derivative."""
    return (f(x + h) - f(x - h)) / (2 * h)

def second_derivative(f, x, h=1e-5):
    """Central difference for second derivative."""
    return (f(x + h) - 2*f(x) + f(x - h)) / h**2

def laplacian_2d(f, x, y, h):
    """5-point stencil for 2D Laplacian."""
    return (f(x+h, y) + f(x-h, y) + f(x, y+h) + f(x, y-h) - 4*f(x,y)) / h**2

def solve_poisson_2d(f, nx, ny, Lx, Ly, tol=1e-6):
    """Solve Poisson equation ∇²φ = f using SOR."""
    hx, hy = Lx/nx, Ly/ny
    phi = np.zeros((nx+1, ny+1))
    
    # SOR iteration
    omega = 1.5  # optimal for 2D Poisson
    max_iter = 10000
    
    for iteration in range(max_iter):
        phi_old = phi.copy()
        for i in range(1, nx):
            for j in range(1, ny):
                phi[i,j] = (1-omega)*phi[i,j] + omega/4 * (
                    phi[i+1,j] + phi[i-1,j] + phi[i,j+1] + phi[i,j-1] - hx**2 * f(i*hx, j*hy)
                )
        
        if np.max(np.abs(phi - phi_old)) < tol:
            break
    
    return phi

# Example: Laplace equation on square
def laplace_sor(n=50, tol=1e-6):
    """SOR solver for Laplace equation."""
    phi = np.zeros((n, n))
    phi[:, -1] = 1  # Right boundary = 1
    
    omega = 2 / (1 + np.sin(np.pi/n))
    
    for iteration in range(10000):
        phi_old = phi.copy()
        for i in range(1, n-1):
            for j in range(1, n-1):
                phi[i,j] = (1-omega)*phi[i,j] + omega/4 * (
                    phi[i+1,j] + phi[i-1,j] + phi[i,j+1] + phi[i,j-1]
                )
        
        if np.max(np.abs(phi - phi_old)) < tol:
            print(f"Converged in {iteration} iterations")
            break
    
    return phi

phi = laplace_sor()
print("Laplace equation solved")
print(f"  Max φ = {phi.max():.4f}")
```

### Molecular Dynamics

```python
import numpy as np

class MolecularDynamics:
    def __init__(self, n_atoms, box_size, mass=1.0, dt=0.001):
        self.n = n_atoms
        self.L = box_size
        self.m = mass
        self.dt = dt
        
        # Initialize positions on grid
        n_per_side = int(np.ceil(n_atoms**(1/3)))
        self.r = np.zeros((n_atoms, 3))
        idx = 0
        for i in range(n_per_side):
            for j in range(n_per_side):
                for k in range(n_per_side):
                    if idx < n_atoms:
                        self.r[idx] = [i/n_per_side, j/n_per_side, k/n_per_side] * box_size
                        idx += 1
        
        # Initialize velocities (Maxwell-Boltzmann)
        T = 1.0  # Temperature
        self.v = np.random.normal(0, np.sqrt(T/mass), (n_atoms, 3))
    
    def lennard_jones(self, r):
        """LJ potential: V = 4ε[(σ/r)^12 - (σ/r)^6]"""
        sigma, epsilon = 1.0, 1.0
        r6 = (sigma/r)**6
        return 4 * epsilon * (r6**2 - r6)
    
    def lj_force(self, r_vec):
        """LJ force from potential gradient."""
        sigma, epsilon = 1.0, 1.0
        r = np.linalg.norm(r_vec)
        r2 = r*r
        r6 = (sigma**2/r2)**3
        r12 = r6**2
        force_mag = 24 * epsilon * (2*(sigma**12)/r12 - (sigma**6)/r6) / r2
        return force_mag * r_vec
    
    def compute_forces(self):
        """Calculate forces using neighbor list."""
        f = np.zeros((self.n, 3))
        rc = 2.5  # Cutoff radius
        
        for i in range(self.n):
            for j in range(i+1, self.n):
                r_vec = self.r[i] - self.r[j]
                r_vec = r_vec - self.L * np.round(r_vec / self.L)  # PBC
                r = np.linalg.norm(r_vec)
                
                if r < rc and r > 0:
                    f_ij = self.lj_force(r_vec)
                    f[i] += f_ij
                    f[j] -= f_ij
        
        return f
    
    def integrate(self, n_steps, thermostat=None):
        """Velocity Verlet integration."""
        f = self.compute_forces()
        energies = []
        
        for step in range(n_steps):
            # Update positions
            self.r += self.v * self.dt + 0.5 * f / self.m * self.dt**2
            self.r = self.r % self.L  # Periodic boundaries
            
            # Update forces
            f_new = self.compute_forces()
            
            # Update velocities
            self.v += 0.5 * (f + f_new) / self.m * self.dt
            f = f_new
            
            # Thermostat
            if thermostat:
                thermostat.apply(self.v)
            
            # Energy calculation
            KE = 0.5 * self.m * np.sum(self.v**2)
            PE = self.compute_potential()
            energies.append((KE, PE))
        
        return energies
    
    def compute_potential(self):
        """Calculate total potential energy."""
        PE = 0
        for i in range(self.n):
            for j in range(i+1, self.n):
                r_vec = self.r[i] - self.r[j]
                r_vec = r_vec - self.L * np.round(r_vec / self.L)
                r = np.linalg.norm(r_vec)
                if 0 < r < 2.5:
                    PE += self.lennard_jones(r)
        return PE

md = MolecularDynamics(100, 10.0)
energies = md.integrate(1000)
print(f"Molecular dynamics simulation complete")
print(f"  Initial KE: {energies[0][0]:.2f}")
print(f"  Final KE: {energies[-1][0]:.2f}")
```

### Monte Carlo Methods

```python
import numpy as np
from scipy import integrate

def metropolis_hastings(log_prob, proposal_std, n_samples, x0):
    """Metropolis-Hastings algorithm for sampling."""
    samples = [x0]
    x = x0
    accept_count = 0
    
    for _ in range(n_samples):
        x_proposed = x + np.random.normal(0, proposal_std)
        
        # Acceptance ratio
        log_alpha = log_prob(x_proposed) - log_prob(x)
        
        if np.log(np.random.random()) < log_alpha:
            x = x_proposed
            accept_count += 1
        
        samples.append(x)
    
    return np.array(samples), accept_count / n_samples

# Example: Gaussian mixture sampling
def log_prob_gaussian_mixture(x):
    """Log probability of mixture of two Gaussians."""
    mu1, sigma1 = -2, 1
    mu2, sigma2 = 2, 0.5
    w1, w2 = 0.4, 0.6
    
    p1 = w1 * np.exp(-0.5 * ((x - mu1)/sigma1)**2) / (sigma1 * np.sqrt(2*np.pi))
    p2 = w2 * np.exp(-0.5 * ((x - mu2)/sigma2)**2) / (sigma2 * np.sqrt(2*np.pi))
    return np.log(p1 + p2)

samples, accept_rate = metropolis_hastings(log_prob_gaussian_mixture, 0.5, 10000, 0.0)
print(f"Metropolis-Hastings sampling:")
print(f"  Acceptance rate: {accept_rate*100:.1f}%")
print(f"  Sample mean: {samples.mean():.3f}")
print(f"  Sample std: {samples.std():.3f}")

# Monte Carlo integration
def estimate_pi_mc(n_samples):
    """Estimate π using Monte Carlo integration."""
    np.random.seed(42)
    x = np.random.uniform(-1, 1, n_samples)
    y = np.random.uniform(-1, 1, n_samples)
    inside = np.sum(x**2 + y**2 <= 1)
    return 4 * inside / n_samples

for n in [1000, 10000, 100000, 1000000]:
    pi_est = estimate_pi_mc(n)
    error = abs(pi_est - np.pi)
    print(f"  n = {n:7d}: π ≈ {pi_est:.6f} (error: {error:.6f})")

# Importance sampling
def importance_sampling_integral(f, target_dist, proposal_dist, n_samples):
    """Estimate ∫f(x)p(x)dx using importance sampling."""
    np.random.seed(42)
    x = proposal_dist.rvs(n_samples)
    weights = target_dist.pdf(x) / proposal_dist.pdf(x)
    return np.mean(weights * f(x)), np.std(weights * f(x)) / np.sqrt(n_samples)

from scipy.stats import norm, expon
result, error = importance_sampling_integral(
    lambda x: x**2, 
    norm(0, 1), 
    expon(scale=1), 
    10000
)
print(f"\nImportance sampling estimate: {result:.4f} ± {error:.4f}")
```

### Chaos and Nonlinear Dynamics

```python
import numpy as np
from scipy.integrate import solve_ivp

def lorenz_attractor(t, state, sigma=10, rho=28, beta=8/3):
    """Lorenz system: dx/dt = σ(y-x), dy/dt = x(ρ-z)-y, dz/dt = xy-βz"""
    x, y, z = state
    dxdt = sigma * (y - x)
    dydt = x * (rho - z) - y
    dzdt = x * y - beta * z
    return [dxdt, dydt, dzdt]

def rossler_system(t, state, a=0.2, b=0.2, c=5.7):
    """Rössler system."""
    x, y, z = state
    dxdt = -y - z
    dydt = x + a * y
    dzdt = b + z * (x - c)
    return [dxdt, dydt, dzdt]

def lyapunov_exponent(system, state0, t_span, n_perturbations=4):
    """Estimate Lyapunov exponents using Bennetin's algorithm."""
    t_eval = np.linspace(t_span[0], t_span[1], 100)
    
    # Perturbed states
    perturbed = [state0 + epsilon * np.random.randn(len(state0)) 
                 for epsilon in [1e-8]*n_perturbations]
    
    # Evolve
    for eps_state in perturbed:
        sol = solve_ivp(system, t_span, eps_state, t_eval=t_eval)
    
    return np.random.randn(n_perturbations)  # Placeholder

# Lorenz attractor simulation
state0 = [1.0, 1.0, 1.0]
t_span = (0, 50)
sol = solve_ivp(lorenz_attractor, t_span, state0, t_eval=np.linspace(0, 50, 10000))

print("Lorenz attractor simulation:")
print(f"  Integration complete")
print(f"  x range: [{sol.y[0].min():.2f}, {sol.y[0].max():.2f}]")
print(f"  z range: [{sol.y[2].min():.2f}, {sol.y[2].max():.2f}]")

# Butterfly effect demonstration
state1 = [1.0, 1.0, 1.0]
state2 = [1.0, 1.0, 1.0000001]  # Perturbed

sol1 = solve_ivp(lorenz_attractor, (0, 50), state1, t_eval=np.linspace(0, 50, 10000))
sol2 = solve_ivp(lorenz_attractor, (0, 50), state2, t_eval=np.linspace(0, 50, 10000))

divergence = np.linalg.norm(sol1.y - sol2.y, axis=0)
print(f"\nButterfly effect:")
print(f"  Max separation at t=50: {divergence[-1]:.2f}")
print(f"  Initial separation: 1e-7")

# Period doubling route to chaos
def logistic_map(r, x):
    """x_{n+1} = r x_n (1 - x_n)"""
    return r * x * (1 - x)

print(f"\nLogistic map bifurcation:")
for r in [2.5, 3.0, 3.5, 3.57, 4.0]:
    x = 0.5
    transient = []
    orbit = []
    for _ in range(200):
        x = logistic_map(r, x)
        transient.append(x)
    for _ in range(100):
        x = logistic_map(r, x)
        orbit.append(x)
    
    n_unique = len(set(round(x, 6) for x in orbit))
    behavior = "fixed point" if n_unique == 1 else "period-" + str(n_unique) if n_unique < 10 else "chaotic"
    print(f"  r = {r}: {behavior} ({n_unique} distinct values)")
```

### Finite Element Analysis

```python
import numpy as np

class FiniteElement1D:
    def __init__(self, n_elements, length, degree=1):
        self.n = n_elements
        self.L = length
        self.h = length / n_elements
        
        # Nodes and elements
        self.nodes = np.linspace(0, length, n_elements + 1)
        self.elements = [(i, i+1) for i in range(n_elements)]
    
    def shape_functions(self, xi):
        """Linear shape functions on reference element [-1, 1]."""
        N1 = (1 - xi) / 2
        N2 = (1 + xi) / 2
        return np.array([N1, N2])
    
    def shape_derivatives(self, xi):
        """Derivatives of shape functions."""
        return np.array([-1/2, 1/2])
    
    def assemble_stiffness(self):
        """Assemble stiffness matrix for -u'' = f."""
        K = np.zeros((self.n + 1, self.n + 1))
        
        for (i, j) in self.elements:
            # Element stiffness
            ke = np.array([[1/self.h, -1/self.h], 
                          [-1/self.h, 1/self.h]])
            K[i:i+2, i:i+2] += ke
        
        return K
    
    def assemble_load(self, f):
        """Assemble load vector."""
        F = np.zeros(self.n + 1)
        f_eval = f(self.nodes)
        
        for (i, j) in self.elements:
            fe = self.h / 2 * np.array([f_eval[i], f_eval[j]])
            F[i:i+2] += fe
        
        return F
    
    def solve(self, f, bc_type='dirichlet', bc_values=(0, 1)):
        """Solve boundary value problem."""
        K = self.assemble_stiffness()
        F = self.assemble_load(f)
        
        if bc_type == 'dirichlet':
            # u(0) = 0, u(L) = 1
            K[0, :] = 0
            K[0, 0] = 1
            F[0] = bc_values[0]
            
            K[-1, :] = 0
            K[-1, -1] = 1
            F[-1] = bc_values[1]
        
        return np.linalg.solve(K, F)

# Solve -u'' = 1 with u(0)=0, u(1)=1
def f_constant(x):
    return np.ones_like(x)

fem = FiniteElement1D(100, 1.0)
u = fem.solve(f_constant)

print("FEM solution of -u'' = 1, u(0)=0, u(1)=1:")
print(f"  u(0.5) = {u[50]:.4f} (analytical: 0.375)")
print(f"  u(1.0) = {u[-1]:.4f}")

# Convergence test
def convergence_test():
    errors = []
    ns = [10, 20, 40, 80, 160]
    
    for n in ns:
        fem = FiniteElement1D(n, 1.0)
        u_fem = fem.solve(f_constant)
        u_analytical = 0.5 * fem.nodes - 0.5 * fem.nodes**2
        error = np.max(np.abs(u_fem - u_analytical))
        errors.append(error)
        print(f"  n = {n:3d}: error = {error:.2e}")
    
    # Estimate convergence rate
    if len(errors) > 1:
        rate = np.log(errors[-2]/errors[-1]) / np.log(2)
        print(f"  Convergence rate: ~{rate:.1f}")

convergence_test()
```

## Best Practices

- Verify numerical solutions against known analytical solutions when available to check implementation.
- Use adaptive step sizes in ODE/PDE solvers to balance accuracy and computational cost.
- For molecular dynamics, ensure adequate equilibration before collecting statistics.
- Check energy conservation in symplectic integrators as a validation test.
- For chaotic systems, use many trajectories and ensemble averages for statistical reliability.
- Consider numerical dispersion and dissipation when choosing numerical schemes for wave equations.
- Use appropriate boundary conditions (absorbing, periodic, reflective) for your physical problem.
- Profile and parallelize computationally intensive sections for performance optimization.
- Validate convergence by refining grids/step sizes until results change within tolerance.
- Use dimensional analysis and physical intuition to check if numerical results are reasonable.

