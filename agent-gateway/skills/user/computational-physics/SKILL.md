---
name: computational-physics
description: Numerical simulation of physical systems
license: MIT
compatibility: opencode
metadata:
  audience: programmers
  category: physics
---
## What I do
- Implement numerical integration methods (Runge-Kutta, Verlet)
- Solve partial differential equations (finite difference, FEM)
- Monte Carlo simulations for statistical systems
- Implement spectral methods (FFT-based solutions)
- Optimize computational performance for physics problems
- Validate simulations against analytical solutions

## When to use me
When analytical solutions are intractable and numerical simulation is needed for physical systems.

## Key Concepts
- **Finite Difference**: Approximate derivatives as (f(x+h) - f(x))/h
- **Runge-Kutta 4th Order**: y_{n+1} = y_n + (k₁ + 2k₂ + 2k₃ + k₄)/6 with staged evaluations
- **Verlet Integration**: Symplectic method preserving energy for molecular dynamics
- **Fast Fourier Transform**: O(N log N) for solving PDEs in spectral space
- **Monte Carlo**: Random sampling for integration in high dimensions
- **Finite Element Method**: Mesh-based solution for complex geometries
