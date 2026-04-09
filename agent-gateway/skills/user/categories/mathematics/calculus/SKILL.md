---
name: Calculus
description: Differential and integral calculus including derivatives, integrals, series expansions, differential equations, and multivariable calculus for scientific computing.
license: MIT
compatibility: python>=3.8
audience: physicists, engineers, mathematicians, data-scientists
category: mathematics
---

# Calculus

## What I Do

I provide comprehensive calculus capabilities including symbolic and numerical differentiation, integration, series expansions, differential equation solving, and multivariable calculus operations for scientific applications.

## When to Use Me

- Finding derivatives and gradients
- Numerical integration of functions
- Solving ordinary differential equations
- Optimization with gradients
- Scientific modeling and simulation
- Engineering calculations

## Core Concepts

- **Derivatives**: Limits, differentiation rules, chain rule
- **Integrals**: Definite, indefinite, improper integrals
- **Series**: Taylor, Maclaurin, Fourier series
- **Differential Equations**: ODEs, initial value problems
- **Partial Derivatives**: Gradients, directional derivatives
- **Multiple Integration**: Double and triple integrals
- **Vector Calculus**: Curl, divergence, gradient fields
- **Numerical Methods**: Simpson's rule, Euler, Runge-Kutta

## Code Examples

### Symbolic Differentiation

```python
import sympy as sp

x = sp.symbols('x')
f = x**3 + 2*x**2 - 5*x + 3

df = sp.diff(f, x)
ddf = sp.diff(df, x)

print(f"f(x) = {f}")
print(f"f'(x) = {df}")
print(f"f''(x) = {ddf}")

evaluated = df.subs(x, 2)
print(f"f'(2) = {evaluated}")
```

### Numerical Integration

```python
import numpy as np
from scipy.integrate import quad, simpson

def f(x):
    return np.sin(x) ** 2

result, error = quad(f, 0, np.pi)
print(f"Integral result: {result:.6f}")
print(f"Estimated error: {error:.2e}")

x = np.linspace(0, np.pi, 1000)
y = f(x)
simpson_result = simpson(y, x=x)
print(f"Simpson's rule: {simpson_result:.6f}")
```

### Solving ODEs

```python
from scipy.integrate import solve_ivp

def ode(t, y):
    dydt = -0.5 * y
    return dydt

y0 = [2.0]
t_span = (0, 10)
t_eval = np.linspace(0, 10, 100)

solution = solve_ivp(ode, t_span, y0, t_eval=t_eval)
print(f"Solution at t=10: y(10) = {solution.y[0][-1]:.4f}")
print(f"Expected (analytical): {2 * np.exp(-5):.4f}")
```

### Series Expansion

```python
x = sp.symbols('x')
f = sp.exp(x)

taylor_series = sp.series(f, x, 0, 6)
print(f"Maclaurin series (n=5): {taylor_series}")

taylor_approx = sp.series(f, x, 0, 6).removeO()
print(f"Approximation: {taylor_approx}")
```

### Partial Derivatives

```python
x, y = sp.symbols('x y')
f = x**2 * y + sp.sin(y)

df_dx = sp.diff(f, x)
df_dy = sp.diff(f, y)

print(f"∂f/∂x = {df_dx}")
print(f"∂f/∂y = {df_dy}")

gradient = sp.Matrix([df_dx, df_dy])
print(f"Gradient: {gradient}")
```

## Best Practices

1. **Symbolic vs Numeric**: Use symbolic for exact results, numeric for evaluation
2. **Step Size**: Choose appropriate step sizes for numerical integration
3. **Error Estimation**: Monitor error bounds in numerical methods
4. **Stiff ODEs**: Use specialized solvers for stiff systems
5. **Adaptive Methods**: Use adaptive quadrature when possible

## Common Patterns

```python
# Newton's method for root finding
def newton_method(f, df, x0, tol=1e-10, max_iter=100):
    x = x0
    for _ in range(max_iter):
        fx = f(x)
        dfx = df(x)
        if abs(dfx) < 1e-15:
            break
        x_new = x - fx / dfx
        if abs(x_new - x) < tol:
            return x_new
        x = x_new
    return x

# Runge-Kutta 4th order
def rk4_step(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h/2, y + h*k1/2)
    k3 = f(t + h/2, y + h*k2/2)
    k4 = f(t + h, y + h*k3)
    return y + (h/6) * (k1 + 2*k2 + 2*k3 + k4)
```

## Core Competencies

1. Symbolic and numerical differentiation
2. Numerical integration techniques
3. ODE solving and numerical methods
4. Series expansions and approximations
5. Partial derivatives and gradients
