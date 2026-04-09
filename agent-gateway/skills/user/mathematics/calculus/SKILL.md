---
name: calculus
description: Differential and integral calculus including derivatives, integrals, series expansions, differential equations, and multivariable calculus for scientific computing.
category: mathematics
tags:
  - mathematics
  - derivatives
  - integrals
  - differential-equations
  - series
  - multivariable
  - numpy
  - scipy
difficulty: intermediate
author: neuralblitz
---

# Calculus

## What I do

I provide expertise in calculus, the mathematical study of continuous change encompassing derivatives, integrals, limits, and infinite series. I enable you to compute rates of change through differentiation, accumulate quantities through integration, solve ordinary and partial differential equations, and work with functions of multiple variables. My knowledge covers both analytical techniques and numerical methods essential for physics simulations, optimization algorithms, machine learning gradients, and scientific computing applications.

## When to use me

Use calculus when you need to: compute gradients for machine learning optimization, solve differential equations modeling physical systems, perform numerical integration for area/volume calculations, analyze convergence of algorithms and sequences, work with multivariable functions and partial derivatives, implement numerical methods like Newton-Raphson, calculate limits and series expansions for approximations, or model rates of change in scientific simulations.

## Core Concepts

- **Limits and Continuity**: The foundation of calculus describing behavior of functions as inputs approach specific values.
- **Derivatives and Differentiation**: Rates of change measuring instantaneous slope of functions with applications in optimization and physics.
- **Integration and Antiderivatives**: Accumulation of quantities and reverse process of differentiation for calculating areas and totals.
- **The Fundamental Theorem of Calculus**: Connecting derivatives and integrals as inverse operations through evaluation theorems.
- **Series and Taylor Expansions**: Approximating functions through infinite sums of polynomial terms for numerical computation.
- **Ordinary Differential Equations**: Equations relating functions to their derivatives modeling dynamic systems and change.
- **Partial Derivatives and Gradients**: Derivatives of multivariable functions enabling optimization in high-dimensional spaces.
- **Multiple Integration**: Extending integration to functions of several variables for volume and mass calculations.

## Code Examples

### Derivatives and Numerical Differentiation

```python
import numpy as np

def derivative(f, x, h=1e-5):
    """Compute numerical derivative using central difference."""
    return (f(x + h) - f(x - h)) / (2 * h)

def second_derivative(f, x, h=1e-5):
    """Compute second derivative using central difference."""
    return (f(x + h) - 2 * f(x) + f(x - h)) / (h ** 2)

# Example functions
f = lambda x: x ** 3 + 2 * x ** 2 - 5 * x + 1
df = lambda x: 3 * x ** 2 + 4 * x - 5
ddf = lambda x: 6 * x + 4

x = 2.0
print(f"f({x}) = {f(x)}")
print(f"f'({x}) = {derivative(f, x):.6f} (exact: {df(x)})")
print(f"f''({x}) = {second_derivative(f, x):.6f} (exact: {ddf(x)})")

# Automatic differentiation with JAX
try:
    import jax
    import jax.numpy as jnp
    
    f_jax = lambda x: x ** 3 + 2 * x ** 2 - 5 * x + 1
    f_val = f_jax(2.0)
    f_grad = jax.grad(f_jax)
    f_hess = jax.jacobian(jax.jacobian(f_jax))
    
    print(f"JAX f(2) = {f_val}")
    print(f"JAX f'(2) = {f_grad(2.0)}")
except ImportError:
    print("JAX not available, using numerical differentiation")
```

### Integration and Numerical Integration

```python
import numpy as np
from scipy import integrate

def trapezoidal_rule(f, a, b, n=1000):
    """Numerical integration using trapezoidal rule."""
    x = np.linspace(a, b, n + 1)
    y = f(x)
    h = (b - a) / n
    return h * (0.5 * y[0] + y[1:-1].sum() + 0.5 * y[-1])

def simpsons_rule(f, a, b, n=1000):
    """Numerical integration using Simpson's rule (n must be even)."""
    if n % 2 == 1:
        n += 1
    x = np.linspace(a, b, n + 1)
    y = f(x)
    h = (b - a) / n
    return (h / 3) * (y[0] + 4 * y[1:-1:2].sum() + 2 * y[2:-2:2].sum() + y[-1])

# Example: integrate e^(-x^2) from -inf to inf (sqrt(pi))
f = lambda x: np.exp(-x ** 2)
integral = integrate.quad(f, -np.inf, np.inf)
print(f"∫ e^(-x^2) dx from -∞ to ∞ = {integral[0]:.10f} (π^0.5 = {np.sqrt(np.pi):.10f})")

# Simpson's rule example
result_simp = simpsons_rule(lambda x: np.sin(x) / x, 0.001, np.pi)
print(f"∫ sin(x)/x dx from 0.001 to π ≈ {result_simp:.10f}")

# Double integration
f_2d = lambda x, y: np.sin(x) * np.cos(y)
result_2d = integrate.dblquad(f_2d, 0, np.pi, lambda x: 0, lambda x: np.pi)
print(f"∬ sin(x)cos(y) dA over [0,π]×[0,π] = {result_2d[0]:.10f}")
```

### Taylor Series and Function Approximation

```python
import numpy as np

def taylor_expansion(f, f_prime, f_double, a=0, n_terms=10):
    """Generate Taylor polynomial coefficients around point a."""
    def poly(x):
        result = 0
        for k in range(n_terms):
            if k == 0:
                term = f(a)
            elif k == 1:
                term = f_prime(a) * (x - a)
            elif k == 2:
                term = f_double(a) / 2 * (x - a) ** 2
            else:
                # Higher derivatives approximated
                term = 0
            result += term
        return result
    return poly

# Taylor series for e^x = sum(x^n / n!)
def exp_taylor(x, n_terms=20):
    """Compute e^x using Taylor series."""
    result = 0
    for n in range(n_terms):
        result += x ** n / np.math.factorial(n)
    return result

# Taylor series for sin(x) = sum((-1)^n * x^(2n+1) / (2n+1)!)
def sin_taylor(x, n_terms=10):
    """Compute sin(x) using Taylor series."""
    result = 0
    for n in range(n_terms):
        result += ((-1) ** n) * x ** (2 * n + 1) / np.math.factorial(2 * n + 1)
    return result

# Test approximations
x = np.pi / 4
print(f"e^{x:.4f} ≈ {exp_taylor(x, 10):.10f} (actual: {np.exp(x):.10f})")
print(f"sin({x:.4f}) ≈ {sin_taylor(x, 10):.10f} (actual: {np.sin(x):.10f})")

# Error analysis for Taylor series
def taylor_error_bound(M, a, b, n):
    """Bound on Taylor polynomial error using Lagrange remainder."""
    return M * (b - a) ** (n + 1) / np.math.factorial(n + 1)

print(f"Taylor series error bound for e^x on [0, 1] with n=10: {taylor_error_bound(np.e, 0, 1, 10):.2e}")
```

### Ordinary Differential Equations

```python
import numpy as np
from scipy.integrate import solve_ivp

def euler_method(f, y0, t0, tf, h):
    """Simple Euler method for ODE integration."""
    n = int((tf - t0) / h)
    t = np.linspace(t0, tf, n + 1)
    y = np.zeros((n + 1, len(y0)))
    y[0] = y0
    
    for i in range(n):
        y[i + 1] = y[i] + h * f(t[i], y[i])
    
    return t, y

def runge_kutta4(f, y0, t0, tf, h):
    """Fourth-order Runge-Kutta method."""
    n = int((tf - t0) / h)
    t = np.linspace(t0, tf, n + 1)
    y = np.zeros((n + 1, len(y0)))
    y[0] = y0
    
    for i in range(n):
        k1 = f(t[i], y[i])
        k2 = f(t[i] + h/2, y[i] + h*k1/2)
        k3 = f(t[i] + h/2, y[i] + h*k2/2)
        k4 = f(t[i] + h, y[i] + h*k3)
        y[i + 1] = y[i] + (h/6) * (k1 + 2*k2 + 2*k3 + k4)
    
    return t, y

# ODE: dy/dt = -y (exponential decay)
f = lambda t, y: -y
y0 = [1.0]
t_span = (0, 5)

# Using scipy's solve_ivp (preferred for accuracy)
sol = solve_ivp(f, t_span, y0, method='RK45', rtol=1e-8, atol=1e-10)
print(f"ODE solution at t=5: y(5) = {sol.y[0, -1]:.10f} (exact: {np.exp(-5):.10f})")

# Using Euler method
t_euler, y_euler = euler_method(f, y0, 0, 5, 0.1)
print(f"Euler method y(5) = {y_euler[-1, 0]:.10f}")

# System of ODEs: Lotka-Volterra predator-prey
def lotka_volterra(t, z, alpha=1.0, beta=0.1, delta=0.1, gamma=0.1):
    x, y = z
    dxdt = alpha * x - beta * x * y
    dydt = delta * x * y - gamma * y
    return [dxdt, dydt]

z0 = [10, 5]
sol_lv = solve_ivp(lotka_volterra, (0, 20), z0, method='RK45', t_eval=np.linspace(0, 20, 500))
print(f"Lotka-Volterra: Initial ({z0[0]}, {z0[1]}), Final ({sol_lv.y[0, -1]:.2f}, {sol_lv.y[1, -1]:.2f})")
```

### Gradient Descent and Optimization

```python
import numpy as np

def gradient_descent(f, gradient, x0, learning_rate=0.01, max_iter=1000, tol=1e-8):
    """Gradient descent optimization algorithm."""
    x = np.array(x0, dtype=float)
    history = [x.copy()]
    
    for i in range(max_iter):
        grad = gradient(x)
        x_new = x - learning_rate * grad
        
        if np.linalg.norm(x_new - x) < tol:
            print(f"Converged after {i+1} iterations")
            break
        
        x = x_new
        history.append(x.copy())
    
    return x, np.array(history)

def newton_method(f, gradient, hessian, x0, max_iter=100, tol=1e-8):
    """Newton's method using second-order information."""
    x = np.array(x0, dtype=float)
    
    for _ in range(max_iter):
        grad = gradient(x)
        hess = hessian(x)
        
        try:
            delta = np.linalg.solve(hess, -grad)
        except np.linalg.LinAlgError:
            delta = -grad * 0.01  # Fallback to gradient descent
        
        x = x + delta
        
        if np.linalg.norm(delta) < tol:
            break
    
    return x

# Minimize f(x, y) = x^2 + y^2 (sphere function)
f = lambda x: x[0]**2 + x[1]**2
gradient = lambda x: np.array([2*x[0], 2*x[1]])
hessian = lambda x: np.array([[2, 0], [0, 2]])

x0 = [5.0, 5.0]
x_opt, history = gradient_descent(f, gradient, x0, learning_rate=0.1)
print(f"Gradient descent: minimum at ({x_opt[0]:.10f}, {x_opt[1]:.10f})")

# Minimize Rosenbrock function (test problem)
def rosenbrock(x):
    return (1 - x[0])**2 + 100*(x[1] - x[0]**2)**2

def rosenbrock_grad(x):
    return np.array([
        -2*(1 - x[0]) - 400*x[0]*(x[1] - x[0]**2),
        200*(x[1] - x[0]**2)
    ])

x0_rosen = [-1.0, 1.0]
x_opt_rosen, _ = gradient_descent(rosenbrock, rosenbrock_grad, x0_rosen, learning_rate=0.001, max_iter=10000)
print(f"Rosenbrock minimum: ({x_opt_rosen[0]:.6f}, {x_opt_rosen[1]:.6f})")
```

## Best Practices

- Use central difference formulas for numerical derivatives as they have smaller truncation error than forward/backward differences.
- For stiff ODE systems, use implicit methods (like BDF) rather than explicit methods for stability.
- Start with adaptive step size methods (like RK45) when accuracy requirements are unknown or variable.
- Validate numerical integration results by comparing with known analytical solutions when available.
- Use vectorized operations in NumPy instead of explicit loops for performance in numerical computations.
- For optimization problems, check gradient correctness using finite differences before relying on gradient-based methods.
- Handle edge cases in integration like singularities by using appropriate transformations or specialized quadrature methods.
- Monitor convergence criteria in iterative methods to balance accuracy with computational cost.
- Consider computational complexity when selecting between analytical and numerical calculus approaches.
- Use automatic differentiation libraries (JAX, Autograd) when gradients are needed for complex functions to avoid numerical errors.

