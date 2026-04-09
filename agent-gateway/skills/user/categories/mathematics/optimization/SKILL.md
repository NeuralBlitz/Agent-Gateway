---
name: Optimization
description: Mathematical optimization including linear programming, convex optimization, gradient descent, and constrained optimization for machine learning and engineering.
license: MIT
compatibility: python>=3.8
audience: machine-learning-engineers, data-scientists, engineers, researchers
category: mathematics
---

# Optimization

## What I Do

I provide comprehensive optimization tools including gradient-based methods, linear and quadratic programming, convex optimization, and constrained optimization for machine learning and scientific applications.

## When to Use Me

- Training machine learning models
- Resource allocation problems
- Parameter tuning and fitting
- Engineering design optimization
- Operations research problems
- Function minimization/maximization

## Core Concepts

- **Gradient Descent**: Batch, stochastic, mini-batch variants
- **Convex Optimization**: Local = global optimum
- **Linear Programming**: Objective with linear constraints
- **Quadratic Programming**: Quadratic objective, linear constraints
- **Constrained Optimization**: Lagrange multipliers, KKT conditions
- **Stochastic Methods**: SGD, Adam, momentum
- **Newton's Method**: Second-order optimization
- **遗传算法**: Genetic algorithms, evolutionary strategies

## Code Examples

### Gradient Descent

```python
import numpy as np

def gradient_descent(f, df, x0, learning_rate=0.01, max_iter=1000, tol=1e-6):
    x = x0
    for i in range(max_iter):
        grad = df(x)
        x_new = x - learning_rate * grad
        if np.linalg.norm(x_new - x) < tol:
            return x_new, i
        x = x_new
    return x, max_iter

f = lambda x: x**2 + 10*np.sin(x)
df = lambda x: 2*x + 10*np.cos(x)

x_opt, iterations = gradient_descent(f, df, x0=5.0)
print(f"Optimal x: {x_opt:.6f}")
print(f"Iterations: {iterations}")
```

### Linear Programming

```python
from scipy.optimize import linprog

c = [-1, 4]
A_ub = [[-3, 1], [1, 2]]
b_ub = [6, 4]
A_eq = [[-1, 1]]
b_eq = [1]
bounds = [(0, None), (None, None)]

result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq, bounds=bounds)
print(f"Optimal value: {-result.fun:.4f}")
print(f"Optimal x: {result.x}")
```

### Conjugate Gradient

```python
def conjugate_gradient(A, b, x0, max_iter=None, tol=1e-10):
    if max_iter is None:
        max_iter = len(b)
    x = x0
    r = b - A @ x
    p = r
    rsold = r @ r
    
    for i in range(max_iter):
        Ap = A @ p
        alpha = rsold / (p @ Ap)
        x = x + alpha * p
        r = r - alpha * Ap
        rsnew = r @ r
        if np.sqrt(rsnew) < tol:
            break
        beta = rsnew / rsold
        p = r + beta * p
        rsold = rsnew
    return x

A = np.array([[4, 1], [1, 3]])
b = np.array([1, 2])
x = conjugate_gradient(A, b, np.zeros(2))
print(f"Solution: {x}")
```

### Newton's Method

```python
def newton_method(f, df, ddf, x0, max_iter=100, tol=1e-10):
    x = x0
    for _ in range(max_iter):
        fx = f(x)
        dfx = df(x)
        ddfx = ddf(x)
        x_new = x - dfx / ddfx
        if abs(x_new - x) < tol:
            return x_new
        x = x_new
    return x

f = lambda x: x**3 - 2*x - 2
df = lambda x: 3*x**2 - 2
ddf = lambda x: 6*x

root = newton_method(f, df, ddf, x0=2)
print(f"Root: {root:.6f}")
```

### Constrained Optimization with Lagrange

```python
from scipy.optimize import minimize

def objective(x):
    return x[0]**2 + x[1]**2

def constraint_eq(x):
    return x[0] + x[1] - 1

constraint = {'type': 'eq', 'fun': constraint_eq}
x0 = [0.5, 0.5]

result = minimize(objective, x0, method='SLSQP', constraints=[constraint])
print(f"Optimal solution: {result.x}")
print(f"Optimal value: {result.fun:.4f}")
```

## Best Practices

1. **Learning Rate**: Use adaptive methods or learning rate schedules
2. **Convergence**: Monitor gradient norms for stopping criteria
3. **Scaling**: Normalize features for gradient-based methods
4. **Constraints**: Use appropriate solvers for constrained problems
5. **Local Minima**: Use multiple starting points for non-convex problems

## Common Patterns

```python
# Adam optimizer implementation
class Adam:
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.m = None
        self.v = None
        self.t = 0
    
    def step(self, gradient):
        self.t += 1
        if self.m is None:
            self.m = np.zeros_like(gradient)
            self.v = np.zeros_like(gradient)
        self.m = self.beta1 * self.m + (1 - self.beta1) * gradient
        self.v = self.beta2 * self.v + (1 - self.beta2) * gradient**2
        m_hat = self.m / (1 - self.beta1**self.t)
        v_hat = self.v / (1 - self.beta2**self.t)
        return self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
```

## Core Competencies

1. Gradient-based optimization methods
2. Linear and quadratic programming
3. Convex optimization theory
4. Constrained optimization
5. Adaptive optimization algorithms
