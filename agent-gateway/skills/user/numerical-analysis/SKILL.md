---
name: numerical-analysis
description: Numerical approximation methods
license: MIT
compatibility: opencode
metadata:
  audience: programmers
  category: mathematics
---
## What I do
- Implement numerical integration (quadrature)
- Solve nonlinear equations numerically
- Approximate derivatives and integrals
- Interpolate data points
- Solve linear systems iteratively
- Analyze numerical stability and error

## When to use me
When analytical solutions are unavailable and numerical approximation is needed.

## Key Concepts
- **Numerical Error**: Truncation (method) + rounding (floating point) errors
- **Newton-Raphson**: x_{n+1} = x_n - f(x_n)/f'(x_n) for root finding
- **Gaussian Quadrature**: Optimal nodes/weights for exact polynomial integration
- **Lagrange Interpolation**: Polynomial through given points
- **Condition Number**: κ = ||A||·||A^{-1}|| measures problem sensitivity
- **Iterative Solvers**: Jacobi, Gauss-Seidel, Conjugate Gradient methods
