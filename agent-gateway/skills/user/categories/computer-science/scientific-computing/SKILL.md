---
name: Scientific Computing
description: Application of computational methods to scientific problems including numerical analysis, simulation, data processing, and visualization for physics, chemistry, biology, and engineering applications
license: MIT
compatibility: universal
audience: Research Scientists, Data Engineers, Computational Scientists
category: Computer Science

---

# Scientific Computing

## What I Do

I specialize in scientific computing—the application of computational methods to solve scientific and engineering problems. My expertise spans numerical analysis (linear algebra, ODE/PDE solvers, optimization), scientific simulation techniques, data processing pipelines, visualization, and reproducible research practices. I work with computational physics, computational chemistry, bioinformatics, and engineering simulations, applying mathematical models and algorithms to understand and predict natural phenomena.

## When to Use Me

- Building numerical simulations for physical systems
- Implementing solvers for differential equations
- Processing and analyzing experimental or simulation data
- Creating scientific visualizations and plots
- Optimizing computational bottlenecks in scientific code
- Building reproducible data analysis pipelines
- Implementing machine learning for scientific applications
- Validating computational results against benchmarks

## Core Concepts

1. **Numerical Linear Algebra**: Matrix operations, eigenvalue problems, SVD, sparse matrices
2. **Numerical ODE/PDE**: Runge-Kutta, finite difference, finite element methods
3. **Optimization**: Gradient descent, Newton methods, constrained optimization
4. **Random Numbers**: RNG, Monte Carlo methods, quasi-random sequences
5. **Signal Processing**: FFT, filtering, spectral analysis, wavelets
6. **Interpolation/Approximation**: Splines, polynomial fitting, function approximation
7. **Numerical Integration**: Quadrature, Monte Carlo integration, adaptive methods
8. **Data Structures**: Arrays, sparse matrices, trees, spatial data structures
9. **Error Analysis**: Floating-point precision, conditioning, stability
10. **Visualization**: Plotting, volume rendering, scientific graphics

## Code Examples

```python
# Finite Difference Method for PDEs - Heat Equation
import numpy as np
import matplotlib.pyplot as plt
from typing import Callable, Tuple

class HeatEquationSolver:
    """
    2D Heat Equation Solver using Finite Difference Method.
    du/dt = alpha * (d²u/dx² + d²u/dy²)
    """
    
    def __init__(self, nx: int, ny: int, alpha: float = 1.0):
        self.nx = nx
        self.ny = ny
        self.alpha = alpha
        
        self.dx = 1.0 / (nx - 1)
        self.dy = 1.0 / (ny - 1)
        self.dt = None  # Set based on stability condition
        
        self.u = np.zeros((ny, nx))
        self.u_new = np.zeros((ny, nx))
    
    def set_initial_condition(self, u0: Callable[[float, float], float]):
        """Set initial temperature distribution."""
        for j in range(self.ny):
            for i in range(self.nx):
                x = i * self.dx
                y = j * self.dy
                self.u[j, i] = u0(x, y)
    
    def set_stability_condition(self, dt: float = None):
        """Set timestep based on stability condition.
        dt <= dx² * dy² / (4 * alpha * (dx² + dy²))
        """
        if dt is None:
            dx2 = self.dx ** 2
            dy2 = self.dy ** 2
            dt_max = dx2 * dy2 / (4 * self.alpha * (dx2 + dy2))
            self.dt = 0.5 * dt_max  # Safety factor
        else:
            self.dt = dt
    
    def apply_boundary_conditions(self, 
                                  boundary_funcs: dict = None):
        """Apply boundary conditions.
        boundary_funcs: {'left': func(y), 'right': func(y), 
                        'bottom': func(x), 'top': func(x)}
        """
        if boundary_funcs:
            if 'left' in boundary_funcs:
                for j in range(self.ny):
                    y = j * self.dy
                    self.u[j, 0] = boundary_funcs['left'](y)
            if 'right' in boundary_funcs:
                for j in range(self.ny):
                    y = j * self.dy
                    self.u[j, -1] = boundary_funcs['right'](y)
            if 'bottom' in boundary_funcs:
                for i in range(self.nx):
                    x = i * self.dx
                    self.u[0, i] = boundary_funcs['bottom'](x)
            if 'top' in boundary_funcs:
                for i in range(self.nx):
                    x = i * self.dx
                    self.u[-1, i] = boundary_funcs['top'](x)
    
    def step(self):
        """Advance one timestep using FTCS scheme."""
        dx2 = self.dx ** 2
        dy2 = self.dy ** 2
        dt = self.dt
        
        r_x = self.alpha * dt / dx2
        r_y = self.alpha * dt / dy2
        
        # FTCS scheme
        self.u_new[1:-1, 1:-1] = (
            self.u[1:-1, 1:-1] +
            r_x * (self.u[1:-1, 0:-2] - 2 * self.u[1:-1, 1:-1] + self.u[1:-1, 2:]) +
            r_y * (self.u[0:-2, 1:-1] - 2 * self.u[1:-1, 1:-1] + self.u[2:, 1:-1])
        )
        
        # Swap arrays
        self.u, self.u_new = self.u_new, self.u
    
    def solve(self, num_steps: int, record_interval: int = 1) -> np.ndarray:
        """Run simulation for specified number of timesteps."""
        history = [self.u.copy()]
        
        for step in range(num_steps):
            self.step()
            
            if (step + 1) % record_interval == 0:
                history.append(self.u.copy())
        
        return np.array(history)

# Usage example
def initial_condition(x, y):
    """Initial temperature distribution - hot spot in center."""
    r = np.sqrt((x - 0.5)**2 + (y - 0.5)**2)
    return 100.0 * np.exp(-50 * r**2)

def boundary_left(y):
    return 0.0

def boundary_right(y):
    return 0.0

def boundary_bottom(x):
    return 0.0

def boundary_top(x):
    return 0.0

# Create solver
solver = HeatEquationSolver(nx=101, ny=101, alpha=0.01)
solver.set_initial_condition(initial_condition)
solver.set_stability_condition()
solver.apply_boundary_conditions({
    'left': boundary_left,
    'right': boundary_right,
    'bottom': boundary_bottom,
    'top': boundary_top
})

# Run simulation
history = solver.solve(num_steps=1000, record_interval=100)

# Visualization
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for idx, t in enumerate([0, 500, 1000]):
    ax = axes[idx]
    im = ax.imshow(history[idx], cmap='hot', origin='lower', 
                   extent=[0, 1, 0, 1])
    ax.set_title(f't = {t * solver.dt:.4f}')
    ax.set_xlabel('x')
    ax.set_ylabel('y')
    plt.colorbar(im, ax=ax, label='Temperature')

plt.tight_layout()
plt.savefig('heat_equation_solution.png', dpi=150)
```

```python
# Runge-Kutta 4th Order ODE Solver
import numpy as np
from typing import Callable, Tuple

class RK4Solver:
    """
    4th Order Runge-Kutta Method for Systems of ODEs.
    dy/dt = f(t, y)
    """
    
    def __init__(self, dt: float, method: str = 'rk4'):
        self.dt = dt
        self.method = method
    
    def step(self, 
             f: Callable[[float, np.ndarray], np.ndarray],
             t: float,
             y: np.ndarray) -> Tuple[float, np.ndarray]:
        """Advance one timestep."""
        if self.method == 'rk4':
            return self._rk4_step(f, t, y)
        elif self.method == 'rk2':
            return self._rk2_step(f, t, y)
        else:
            raise ValueError(f"Unknown method: {self.method}")
    
    def _rk4_step(self,
                  f: Callable[[float, np.ndarray], np.ndarray],
                  t: float,
                  y: np.ndarray) -> Tuple[float, np.ndarray]:
        """Standard RK4 step."""
        k1 = f(t, y)
        k2 = f(t + 0.5 * self.dt, y + 0.5 * self.dt * k1)
        k3 = f(t + 0.5 * self.dt, y + 0.5 * self.dt * k2)
        k4 = f(t + self.dt, y + self.dt * k3)
        
        y_new = y + (self.dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        t_new = t + self.dt
        
        return t_new, y_new
    
    def _rk2_step(self,
                  f: Callable[[float, np.ndarray], np.ndarray],
                  t: float,
                  y: np.ndarray) -> Tuple[float, np.ndarray]:
        """Heun's method (RK2)."""
        k1 = f(t, y)
        k2 = f(t + self.dt, y + self.dt * k1)
        
        y_new = y + 0.5 * self.dt * (k1 + k2)
        t_new = t + self.dt
        
        return t_new, y_new
    
    def solve(self,
              f: Callable[[float, np.ndarray], np.ndarray],
              y0: np.ndarray,
              t_span: Tuple[float, float],
              adaptive: bool = False) -> Tuple[np.ndarray, np.ndarray]:
        """Solve ODE from t_span[0] to t_span[1]."""
        t0, tf = t_span
        n_steps = int((tf - t0) / self.dt)
        
        t = np.zeros(n_steps + 1)
        y = np.zeros((n_steps + 1, len(y0)))
        
        t[0] = t0
        y[0] = y0
        
        for i in range(n_steps):
            t[i+1], y[i+1] = self.step(f, t[i], y[i])
        
        return t, y

# Example: Double Pendulum Equations of Motion
def double_pendulum(t, state):
    """
    Double pendulum dynamics.
    state = [theta1, omega1, theta2, omega2]
    """
    theta1, omega1, theta2, omega2 = state
    m1, m2 = 1.0, 1.0
    L1, L2 = 1.0, 1.0
    g = 9.81
    
    delta = theta1 - theta2
    sin_delta = np.sin(delta)
    cos_delta = np.cos(delta)
    
    denom = L1 * (2 * m1 + m2 - m2 * np.cos(2 * delta))
    
    alpha1 = (m2 * g * np.sin(theta2) * cos_delta - 
              m2 * L2 * omega2**2 * sin_delta - 
              (m1 + m2) * g * np.sin(theta1)) / denom
    
    alpha2 = ((m1 + m2) * (L1 * omega1**2 * sin_delta - 
              g * np.sin(theta2) + g * np.sin(theta1) * cos_delta) +
              m2 * L2 * omega2**2 * sin_delta) / denom
    
    return np.array([omega1, alpha1, omega2, alpha2])

# Solve
solver = RK4Solver(dt=0.001)
initial_state = np.array([np.pi/2, 0, np.pi/2, 0])  # Starting horizontal
t, states = solver.solve(double_pendulum, initial_state, (0, 10))

# Extract angles
theta1 = states[:, 0]
theta2 = states[:, 2]

# Plot
plt.figure(figsize=(12, 4))
plt.subplot(121)
plt.plot(t, theta1, label='theta1')
plt.plot(t, theta2, label='theta2')
plt.xlabel('Time (s)')
plt.ylabel('Angle (rad)')
plt.legend()
plt.title('Double Pendulum Angles')

plt.subplot(122)
plt.plot(np.sin(theta1), np.cos(theta1), label='Mass 1')
plt.plot(np.sin(theta2), np.cos(theta2), label='Mass 2')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.title('Phase Space')
plt.tight_layout()
```

```python
# Monte Carlo Integration and Variance Reduction
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

def monte_carlo_integration(f, bounds, n_samples, method='crude'):
    """
    Monte Carlo integration of function f over hyperrectangle bounds.
    bounds: list of (min, max) tuples for each dimension
    """
    if method == 'crude':
        return crude_mc(f, bounds, n_samples)
    elif method == 'importance':
        return importance_sampling(f, bounds, n_samples)
    elif method == 'antithetic':
        return antithetic_variates(f, bounds, n_samples)
    else:
        raise ValueError(f"Unknown method: {method}")

def crude_mc(f, bounds, n_samples):
    """Crude Monte Carlo integration."""
    dims = len(bounds)
    
    # Generate uniform samples
    samples = np.array([[np.random.uniform(b[0], b[1]) for b in bounds] 
                        for _ in range(n_samples)])
    
    # Compute volume
    volume = np.prod([b[1] - b[0] for b in bounds])
    
    # Estimate integral
    f_samples = np.array([f(*sample) for sample in samples])
    integral = volume * np.mean(f_samples)
    variance = volume**2 * np.var(f_samples) / n_samples
    
    return integral, np.sqrt(variance)

def importance_sampling(f, bounds, n_samples):
    """Importance sampling with normal distribution."""
    dims = len(bounds)
    
    # Use normal distribution centered in integration region
    centers = [(b[0] + b[1]) / 2 for b in bounds]
    stds = [(b[1] - b[0]) / 4 for b in bounds]
    
    # Generate samples from proposal distribution
    samples = np.array([np.random.normal(c, s) for c, s in zip(centers, stds)
                        for _ in range(n_samples)]).T
    
    # Compute importance weights
    proposal_pdf = np.prod(stats.norm.pdf(samples, centers, stds))
    uniform_pdf = 1.0 / np.prod([b[1] - b[0] for b in bounds])
    weights = uniform_pdf / proposal_pdf
    
    # Estimate integral
    f_samples = np.array([f(*sample) for sample in samples])
    integral = np.mean(weights * f_samples)
    variance = np.var(weights * f_samples) / n_samples
    
    return integral, np.sqrt(variance)

def antithetic_variates(f, bounds, n_samples):
    """Antithetic variates for variance reduction."""
    dims = len(bounds)
    half_samples = n_samples // 2
    
    # Generate uniform samples
    u1 = np.array([[np.random.uniform(b[0], b[1]) for b in bounds] 
                   for _ in range(half_samples)])
    
    # Generate antithetic samples
    u2 = np.array([[b[1] - (u - b[0]) for u, b in zip(row, bounds)] 
                   for row in u1])
    
    # Combine samples
    samples = np.vstack([u1, u2])
    
    # Compute volume
    volume = np.prod([b[1] - b[0] for b in bounds])
    
    # Estimate integral
    f_samples = np.array([f(*sample) for sample in samples])
    integral = volume * np.mean(f_samples)
    variance = volume**2 * np.var(f_samples) / n_samples
    
    return integral, np.sqrt(variance)

# Example: Integrate 2D Gaussian
def gaussian_2d(x, y):
    mu_x, mu_y = 0.5, 0.5
    sigma = 0.1
    return np.exp(-((x - mu_x)**2 + (y - mu_y)**2) / (2 * sigma**2))

bounds = [(0, 1), (0, 1)]

# Run with different methods
methods = ['crude', 'importance', 'antithetic']
results = {}

for method in methods:
    integrals = []
    for _ in range(100):
        integral, error = monte_carlo_integration(gaussian_2d, bounds, 10000, method)
        integrals.append(integral)
    results[method] = {
        'mean': np.mean(integrals),
        'std': np.std(integrals)
    }

# Compare methods
print("Monte Carlo Integration Results (10000 samples):")
for method, stats in results.items():
    print(f"  {method:12s}: {stats['mean']:.6f} ± {stats['std']:.6f}")
```

## Best Practices

1. **Validate Against Known Solutions**: Test against analytical solutions when available
2. **Check Conservation Laws**: Verify energy/momentum conservation in physical simulations
3. **Convergence Testing**: Refine grid/timestep and verify numerical convergence
4. **Handle Floating-Point Carefully**: Use appropriate precision, watch for cancellation
5. **Reproducibility**: Fix random seeds for Monte Carlo and stochastic methods
6. **Unit Testing**: Test numerical routines independently from simulation logic
7. **Benchmark Before Optimization**: Profile to find actual computational bottlenecks
8. **Document Units and Conventions**: Always document physical units and coordinate systems
9. **Version Control for Research**: Track code, data, and environment for reproducibility
10. **Visualize Intermediate Results**: Check results at each stage of computation
