---
name: aerospace-engineering
description: Aerospace engineering fundamentals and applications
license: MIT
compatibility: opencode
metadata:
  audience: engineers, developers, students
  category: engineering
---

## What I do

- Analyze aerodynamic forces and fluid dynamics around airframes and components
- Design and simulate aircraft structures, materials, and propulsion systems
- Calculate flight mechanics, stability, and control characteristics
- Evaluate propulsion systems including jet engines, turbines, and rockets
- Perform structural analysis using finite element methods
- Model orbital mechanics and spacecraft trajectories

## When to use me

- When working on aircraft or spacecraft design projects
- When analyzing aerodynamic performance or fluid flow
- When calculating flight dynamics and control systems
- When evaluating structural integrity of aerospace components
- When designing propulsion systems or analyzing engine performance
- When modeling orbital trajectories or satellite operations

## Key Concepts

### Aerodynamics

Aerodynamics studies how air flows around objects and the forces generated:

```python
# Lift equation
L = 0.5 * rho * V**2 * S * Cl

# Drag equation  
D = 0.5 * rho * V**2 * S * Cd

# Reynolds number (laminar vs turbulent flow)
Re = (rho * V * L) / mu
```

Where ρ = air density, V = velocity, S = wing area, Cl/Cd = coefficients.

### Flight Mechanics

```python
# Thrust required for level flight at constant altitude
TR = W * (Cd0 + (K * Cl**2)) / Cl

# Turn rate for coordinated turn
n = 1 / cos(bank_angle)  # load factor

# Range equation (Breguet)
R = (V / SFC) * (L/D) * ln(W_start / W_end)
```

### Structural Analysis

```python
# Stress-strain relationship (Hooke's Law)
sigma = E * epsilon

# Von Mises stress for yielding criteria
sigma_vm = sqrt(0.5 * ((s1-s2)**2 + (s2-s3)**2 + (s3-s1)**2))

# Factor of Safety
FoS = Ultimate_Stress / Working_Stress
```

### Orbital Mechanics

```python
# Orbital velocity
v = sqrt(mu / r)

# Escape velocity
v_esc = sqrt(2 * mu / r)

# Period of circular orbit
T = 2 * pi * sqrt(a**3 / mu)
```

### Common Software Tools

| Tool | Purpose |
|------|---------|
| ANSYS Fluent | CFD analysis |
| STAR-CCM+ | Multi-physics simulation |
| NASA OpenVSP | Vehicle preliminary design |
| AVL | aerodynamic prediction |
| JSBSim | flight dynamics simulation |
