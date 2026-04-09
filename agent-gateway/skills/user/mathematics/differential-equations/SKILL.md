---
name: differential-equations
description: Ordinary and partial differential equations including analytical solutions, numerical methods, stability analysis, and applications in physics and engineering.
category: mathematics
tags:
  - mathematics
  - differential-equations
  - ode
  - pde
  - numerical-methods
  - stability
  - physics
difficulty: advanced
author: neuralblitz
---

# Differential Equations

## What I do

I provide comprehensive expertise in differential equations, mathematical equations relating functions to their derivatives. I enable you to solve ordinary differential equations (ODEs) analytically and numerically, analyze partial differential equations (PDEs), study stability and bifurcations, and apply these techniques to model physical systems. My knowledge spans from first-order ODE solution techniques to advanced PDE methods essential for physics, engineering, biology, and economics modeling.

## When to use me

Use differential equations when you need to: model population dynamics and growth, simulate heat transfer and diffusion processes, analyze mechanical and electrical systems, predict fluid flow behavior, model chemical reaction kinetics, study epidemic spread (SIR models), analyze financial derivatives and growth, or solve wave and heat equations in physics.

## Core Concepts

- **Ordinary Differential Equations (ODEs)**: Equations involving functions of a single variable and their derivatives.
- **Partial Differential Equations (PDEs)**: Equations involving functions of multiple variables and partial derivatives.
- **Initial Value Problems (IVPs)**: ODEs with specified values at an initial time for determining unique solutions.
- **Boundary Value Problems (BVPs)**: ODEs/PDEs with conditions specified at multiple boundary points.
- **Linear vs Nonlinear ODEs**: Linear ODEs have solutions that superimpose; nonlinear ODEs exhibit complex behaviors.
- **Analytical Solutions**: Closed-form expressions obtained through algebraic manipulation and integration.
- **Numerical Methods**: Approximation techniques including Euler, Runge-Kutta, and finite difference methods.
- **Stability Analysis**: Studying how solutions behave near equilibrium points (stable, unstable, asymptotically stable).
- **Phase Plane Analysis**: Visualizing trajectories of systems of ODEs in state space.
- **Eigenvalue Methods**: Using eigenvalues of matrices to analyze linear systems and stability.

## Code Examples

### Solving ODEs with Scipy

```python
import numpy as np
from scipy.integrate import solve_ivp, odeint
from scipy.optimize import fsolve
import matplotlib.pyplot as plt

# First-order ODE: dy/dt = -y (exponential decay)
def exponential_decay(t, y):
    return -y

t_span = (0, 10)
y0 = [1.0]

# Using solve_ivp with RK45
sol = solve_ivp(exponential_decay, t_span, y0, method='RK45', t_eval=np.linspace(0, 10, 100))

print(f"Exact solution y(10) = {np.exp(-10):.6f}")
print(f"Numerical solution y(10) = {sol.y[0, -1]:.6f}")
print(f"Relative error: {abs(sol.y[0, -1] - np.exp(-10)) / np.exp(-10):.2e}")

# System of ODEs: Lotka-Volterra predator-prey
def lotka_volterra(t, z, alpha=1.1, beta=0.4, delta=0.4, gamma=0.1):
    x, y = z
    dxdt = alpha * x - beta * x * y
    dydt = delta * x * y - gamma * y
    return [dxdt, dydt]

z0 = [10, 5]
t_span = (0, 50)
t_eval = np.linspace(0, 50, 1000)

sol_lv = solve_ivp(lotka_volterra, t_span, z0, t_eval=t_eval, method='RK45')

print(f"\nLotka-Volterra:")
print(f"  Initial: ({z0[0]}, {z0[1]})")
print(f"  Final: ({sol_lv.y[0, -1]:.2f}, {sol_lv.y[1, -1]:.2f})")
print(f"  Oscillation period detected: {sol_lv.y[0].max():.2f} to {sol_lv.y[0].min():.2f}")

# Second-order ODE: damped harmonic oscillator
def damped_oscillator(t, y, m=1, b=0.5, k=2):
    """y'' + (b/m)y' + (k/m)y = 0"""
    x, v = y
    dxdt = v
    dvdt = -(b/m) * v - (k/m) * x
    return [dxdt, dvdt]

y0 = [1, 0]  # Initial position and velocity
t_span = (0, 20)
sol_osc = solve_ivp(damped_oscillator, t_span, y0, t_eval=np.linspace(0, 20, 500))

print(f"\nDamped oscillator:")
print(f"  Initial energy (position): {0.5 * k * y0[0]**2}")
print(f"  Final position: {sol_osc.y[0, -1]:.6f}")
print(f"  Damped out after t=20: {abs(sol_osc.y[0, -1]) < 0.01}")
```

### Numerical Methods Implementation

```python
import numpy as np

def euler_method(f, y0, t0, tf, h):
    """Forward Euler method (first-order)."""
    n = int((tf - t0) / h)
    t = np.linspace(t0, tf, n + 1)
    y = np.zeros((n + 1, len(y0)))
    y[0] = y0
    
    for i in range(n):
        y[i + 1] = y[i] + h * f(t[i], y[i])
    
    return t, y

def heun_method(f, y0, t0, tf, h):
    """Heun's method (improved Euler, second-order)."""
    n = int((tf - t0) / h)
    t = np.linspace(t0, tf, n + 1)
    y = np.zeros((n + 1, len(y0)))
    y[0] = y0
    
    for i in range(n):
        k1 = f(t[i], y[i])
        k2 = f(t[i] + h, y[i] + h * k1)
        y[i + 1] = y[i] + (h / 2) * (k1 + k2)
    
    return t, y

def runge_kutta4(f, y0, t0, tf, h):
    """Fourth-order Runge-Kutta method."""
    n = int((tf - t0) / h)
    t = np.linspace(t0, tf, n + 1)
    y = np.zeros((n + 1, len(y0)))
    y[0] = y0
    
    for i in range(n):
        k1 = f(t[i], y[i])
        k2 = f(t[i] + h/2, y[i] + (h/2) * k1)
        k3 = f(t[i] + h/2, y[i] + (h/2) * k2)
        k4 = f(t[i] + h, y[i] + h * k3)
        y[i + 1] = y[i] + (h / 6) * (k1 + 2*k2 + 2*k3 + k4)
    
    return t, y

# Compare methods for dy/dt = -y
f = lambda t, y: -y
y0 = [1]
t0, tf = 0, 5
h = 0.1

t_euler, y_euler = euler_method(f, y0, t0, tf, h)
t_heun, y_heun = heun_method(f, y0, t0, tf, h)
t_rk4, y_rk4 = runge_kutta4(f, y0, t0, tf, h)

exact = np.exp(-t_rk4)

print("Comparison of numerical methods (dy/dt = -y, h=0.1):")
print(f"{'Method':<15} {'y(5)':<12} {'Error':<12}")
print(f"{'Exact':<15} {exact[-1]:<12.6f} {'0':<12}")
print(f"{'Euler':<15} {y_euler[-1, 0]:<12.6f} {abs(y_euler[-1, 0] - exact[-1]):<12.6f}")
print(f"{'Heun':<15} {y_heun[-1, 0]:<12.6f} {abs(y_heun[-1, 0] - exact[-1]):<12.6f}")
print(f"{'RK4':<15} {y_rk4[-1, 0]:<12.6f} {abs(y_rk4[-1, 0] - exact[-1]):<12.6f}")

# Adaptive step size (conceptual)
def adaptive_rk(f, y0, t0, tf, tol=1e-6):
    """Simplified adaptive RK method."""
    t = [t0]
    y = [y0[0]]
    h = 0.1
    
    while t[-1] < tf:
        # Compute with h
        k1 = f(t[-1], y[-1])
        k2 = f(t[-1] + h/2, y[-1] + h*k1/2)
        k3 = f(t[-1] + h/2, y[-1] + h*k2/2)
        k4 = f(t[-1] + h, y[-1] + h*k3)
        y_h = y[-1] + (h/6)*(k1 + 2*k2 + 2*k3 + k4)
        
        # Compute with h/2
        h_half = h/2
        k1 = f(t[-1], y[-1])
        k2 = f(t[-1] + h_half, y[-1] + h_half*k1/2)
        k3 = f(t[-1] + h_half, y[-1] + h_half*k2/2)
        k4 = f(t[-1] + h_half, y[-1] + h_half*k3)
        y_h2_step1 = y[-1] + (h_half/6)*(k1 + 2*k2 + 2*k3 + k4)
        
        k1 = f(t[-1] + h_half, y_h2_step1)
        k2 = f(t[-1] + h, y_h2_step1 + h_half*k1/2)
        k3 = f(t[-1] + h, y_h2_step1 + h_half*k2/2)
        k4 = f(t[-1] + h, y_h2_step1 + h_half*k3)
        y_h2 = y_h2_step1 + (h_half/6)*(k1 + 2*k2 + 2*k3 + k4)
        
        # Estimate error
        error = abs(y_h2 - y_h) / 15  # Richardson extrapolation
        
        if error < tol:
            t.append(t[-1] + h)
            y.append(y_h2)
            h = h * min(2, max(0.5, (tol/error)**0.25))
        else:
            h = h * max(0.5, (tol/error)**0.25)
    
    return np.array(t), np.array(y)
```

### Stability Analysis

```python
import numpy as np
from scipy.linalg import eig

def linear_stability_analysis(A):
    """Analyze stability of linear system x' = Ax."""
    eigenvalues, eigenvectors = eig(A)
    
    print(f"Eigenvalues: {eigenvalues}")
    
    stability = "Stable (all real parts < 0)"
    for ev in eigenvalues:
        if np.real(ev) > 0:
            stability = "Unstable (positive real part)"
            break
        elif abs(np.imag(ev)) > 1e-10:
            stability = "Spiral (complex with negative real part)"
    
    return eigenvalues, stability

# Example systems
print("1. Decaying oscillator:")
A1 = np.array([[0, 1], [-2, -0.5]])
ev1, stab1 = linear_stability_analysis(A1)
print(f"   Stability: {stab1}")

print("\n2. Unstable saddle:")
A2 = np.array([[1, 0], [0, -1]])
ev2, stab2 = linear_stability_analysis(A2)
print(f"   Stability: {stab2}")

print("\n3. Center (pure oscillation):")
A3 = np.array([[0, 1], [-1, 0]])
ev3, stab3 = linear_stability_analysis(A3)
print(f"   Stability: {stab3}")

# Phase portrait
def phase_portrait(A, xlim, ylim, n_points=20):
    """Generate phase portrait for linear system."""
    x = np.linspace(xlim[0], xlim[1], n_points)
    y = np.linspace(ylim[0], ylim[1], n_points)
    X, Y = np.meshgrid(x, y)
    
    U = A[0, 0] * X + A[0, 1] * Y
    V = A[1, 0] * X + A[1, 1] * Y
    
    return X, Y, U, V

# Nonlinear stability (linearization)
def nonlinear_stability(f, x0, y0):
    """Analyze nonlinear system near equilibrium."""
    from scipy.optimize import fsolve
    
    # Find equilibrium
    eq = fsolve(f, [x0, y0])
    print(f"Equilibrium point: {eq}")
    
    # Jacobian at equilibrium
    h = 1e-6
    J = np.zeros((2, 2))
    for j in range(2):
        delta = np.zeros(2)
        delta[j] = h
        f_plus = f(eq + delta, 0)
        f_minus = f(eq - delta, 0)
        J[:, j] = (f_plus - f_minus) / (2 * h)
    
    eigenvalues, _ = eig(J)
    print(f"Jacobian eigenvalues: {eigenvalues}")
    
    # Lyapunov stability for nonlinear
    if all(np.real(ev) < 0 for ev in eigenvalues):
        return "Locally asymptotically stable"
    elif any(np.real(ev) > 0 for ev in eigenvalues):
        return "Unstable"
    else:
        return "Linearization inconclusive"

# SIR model stability
def sir_model(t, y, beta=0.3, gamma=0.1):
    S, I, R = y
    dSdt = -beta * S * I
    dIdt = beta * S * I - gamma * I
    dRdt = gamma * I
    return [dSdt, dIdt, dRdt]

print(f"\nSIR model stability: {nonlinear_stability(sir_model, 0.5, 0.5)}")
```

### Boundary Value Problems

```python
import numpy as np
from scipy.optimize import minimize, root_scalar
from scipy.integrate import solve_bvp

def shooting_method(f, t_span, y0_guess, bc, tol=1e-6, max_iter=50):
    """Solve BVP using shooting method."""
    a, b = t_span
    
    def objective(s):
        """Minimize boundary condition difference."""
        y0 = [y0_guess[0], s]
        sol = solve_ivp(f, t_span, y0, method='RK45', rtol=1e-8, atol=1e-10)
        return bc(sol.y[:, -1])
    
    # Find root of objective
    s = root_scalar(objective, bracket=[-10, 10], method='brentq').root
    
    y0 = [y0_guess[0], s]
    sol = solve_ivp(f, t_span, y0, method='RK45')
    
    return sol

# Example: y'' + y = 0, y(0) = 0, y(π/2) = 1
def ode_bvp(t, y):
    """y'' + y = 0 written as system."""
    return [y[1], -y[0]]

def bc_final(y_final):
    """Boundary condition at t=π/2."""
    return y_final[0] - 1  # y(π/2) = 1

t_span = (0, np.pi/2)
sol = shooting_method(ode_bvp, t_span, [0, 1], bc_final)

print("BVP: y'' + y = 0, y(0)=0, y(π/2)=1")
print(f"Solution at t=π/4: y(π/4) = {sol.y[0, len(sol.y[0])//2]:.4f}")
print(f"Exact solution: y(t) = sin(t), y(π/4) = {np.sin(np.pi/4):.4f}")

# Using solve_bvp (collocation method)
def ode_collocation(t, y):
    return [y[1], -y[0]]

def bc(ya, yb):
    return [ya[0], yb[0] - 1]

t_bvp = np.linspace(0, np.pi/2, 10)
y_bvp = np.zeros((2, len(t_bvp)))
y_bvp[0] = np.sin(t_bvp)  # Initial guess

sol_bvp = solve_bvp(ode_collocation, bc, t_bvp, y_bvp)

print(f"\nsolve_bvp result at t=π/4: {sol_bvp.y[0, len(t_bvp)//2]:.4f}")

# Eigenvalue BVP: y'' + λy = 0, y(0) = y(π) = 0
def eigenvalue_bvp(lambda_val):
    """Solve BVP for given eigenvalue."""
    def ode(t, y):
        return [y[1], -lambda_val * y[0]]
    
    def bc(ya, yb):
        return [ya[0], yb[0]]
    
    t = np.linspace(0, np.pi, 50)
    y_guess = np.zeros((2, len(t)))
    y_guess[0] = np.sin(np.sqrt(lambda_val) * t)
    
    try:
        sol = solve_bvp(ode, bc, t, y_guess, tol=1e-4)
        return sol
    except:
        return None

# Find eigenvalues (λ_n = n^2)
print("\nEigenvalue BVP: y'' + λy = 0, y(0)=y(π)=0")
for n in range(1, 4):
    lambda_n = n**2
    sol = eigenvalue_bvp(lambda_n)
    if sol is not None:
        print(f"  λ_{n} = {lambda_n}, solution exists")
```

### Partial Differential Equations

```python
import numpy as np

def heat_equation_fd(u0, L, T, nx, nt, alpha=1):
    """
    Solve heat equation u_t = αu_xx using finite differences.
    Boundary conditions: u(0,t) = u(L,t) = 0
    """
    dx = L / (nx - 1)
    dt = T / (nt - 1)
    r = alpha * dt / dx**2
    
    if r > 0.5:
        print(f"Warning: r = {r:.2f} > 0.5, method may be unstable")
    
    u = u0.copy()
    u_new = np.zeros_like(u)
    
    for n in range(nt - 1):
        for i in range(1, nx - 1):
            u_new[i] = r * u[i-1] + (1 - 2*r) * u[i] + r * u[i+1]
        u = u_new.copy()
    
    return u

# Heat equation example
L = np.pi
T = 0.5
nx, nt = 50, 100
x = np.linspace(0, L, nx)
t = np.linspace(0, T, nt)

# Initial condition: u(x,0) = sin(x)
u0 = np.sin(x)

# Solve
u_final = heat_equation_fd(u0, L, T, nx, nt)

# Compare with analytical solution
analytical = np.exp(-t[-1]) * np.sin(x)  # u(x,t) = e^(-t)*sin(x)
print("Heat equation u_t = u_xx:")
print(f"  Numerical u(π/2, 0.5) = {u_final[nx//2]:.6f}")
print(f"  Analytical u(π/2, 0.5) = {analytical[nx//2]:.6f}")

# Wave equation using method of lines
from scipy.integrate import solve_ivp

def wave_equation_mol(t, y, c=1, L=1, nx=100):
    """Wave equation u_tt = c^2 u_xx using method of lines."""
    u = y[:nx]
    v = y[nx:]
    
    # Second spatial derivative using central differences
    uxx = np.zeros(nx)
    uxx[1:-1] = (u[:-2] - 2*u[1:-1] + u[2:]) / (L/(nx-1))**2
    
    # Boundary conditions (fixed ends)
    uxx[0] = 0
    uxx[-1] = 0
    
    dvdt = c**2 * uxx
    dudt = v
    
    return np.concatenate([dudt, dvdt])

# Initial conditions: u(x,0) = sin(πx), u_t(x,0) = 0
nx = 100
L = 1
x = np.linspace(0, L, nx)
y0 = np.concatenate([np.sin(np.pi * x), np.zeros(nx)])

t_span = (0, 2)
sol_wave = solve_ivp(wave_equation_mol, t_span, y0, method='RK45', t_eval=np.linspace(0, 2, 100))

print(f"\nWave equation u_tt = u_xx:")
print(f"  Initial shape preserved at t=2: {np.allclose(sol_wave.y[:nx, -1], np.sin(np.pi * x), atol=0.01)}")

# Poisson equation (elliptic PDE)
def poisson_equation_fd(f, nx, ny, Lx, Ly):
    """
    Solve Poisson equation ∇²u = f using finite differences.
    Dirichlet boundary conditions: u = 0 on boundary.
    """
    from scipy.sparse import lil_matrix, csr_matrix
    from scipy.sparse.linalg import spsolve
    
    N = nx * ny
    A = lil_matrix((N, N))
    b = np.zeros(N)
    
    dx = Lx / (nx - 1)
    dy = Ly / (ny - 1)
    h2 = dx**2  # Assuming dx = dy
    
    for i in range(nx):
        for j in range(ny):
            k = i + j * nx
            
            if i == 0 or i == nx - 1 or j == 0 or j == ny - 1:
                A[k, k] = 1
                b[k] = 0  # Dirichlet BC
            else:
                A[k, k] = -4
                A[k, k-1] = 1
                A[k, k+1] = 1
                A[k, k-nx] = 1
                A[k, k+nx] = 1
                b[k] = h2 * f(i*dx, j*dy)
    
    A = csr_matrix(A)
    u = spsolve(A, b)
    
    return u.reshape(nx, ny)

# Test Poisson: ∇²u = -2π²sin(πx)sin(πy) with solution u = sin(πx)sin(πy)
f_poisson = lambda x, y: -2 * np.pi**2 * np.sin(np.pi * x) * np.sin(np.pi * y)
u_poisson = poisson_equation_fd(f_poisson, 20, 20, 1, 1)

print(f"\nPoisson equation:")
print(f"  Numerical solution max: {u_poisson.max():.6f}")
print(f"  Analytical solution max: 1.0")
```

## Best Practices

- For stiff ODEs, use implicit methods (BDF, Rosenbrock) rather than explicit Runge-Kutta to avoid stability issues.
- Always check the CFL condition for PDEs to ensure numerical stability in explicit schemes.
- Use adaptive step size methods when solution behavior varies significantly across the domain.
- For boundary value problems, shooting methods work well when solutions are sensitive to initial conditions.
- For elliptic PDEs, use iterative solvers (Gauss-Seidel, SOR) or direct sparse solvers for large systems.
- Validate numerical solutions by checking conservation laws, symmetry, and limiting cases.
- When solving eigenvalue problems, verify that computed eigenvalues satisfy the original equation.
- For nonlinear PDEs, consider using Newton's method with continuation techniques for difficult problems.
- Use method of lines to convert PDEs to ODE systems, then apply ODE solvers.
- Monitor computational cost: implicit methods have higher per-step cost but can use larger time steps.

