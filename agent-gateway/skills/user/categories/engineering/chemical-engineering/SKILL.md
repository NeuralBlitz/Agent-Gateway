---
name: Chemical Engineering
description: Chemical engineering fundamentals including reaction engineering, separation processes, thermodynamics, process control, and plant design for industrial applications.
license: MIT
compatibility: python>=3.8
audience: chemical-engineers, process-engineers, researchers, students
category: engineering
---

# Chemical Engineering

## What I Do

I provide comprehensive chemical engineering tools including reaction kinetics, separation processes, process thermodynamics, reactor design, process control, and plant economics for industrial applications.

## When to Use Me

- Reactor design and scale-up
- Distillation column design
- Heat exchanger sizing
- Process optimization
- Process control systems
- Economic analysis

## Core Concepts

- **Reaction Engineering**: PFR, CSTR, residence time
- **Mass Transfer**: Diffusion, convection, mass transfer coefficients
- **Heat Transfer**: Conduction, convection, heat exchangers
- **Separations**: Distillation, extraction, chromatography
- **Thermodynamics**: Phase equilibria, activity coefficients
- **Process Control**: PID, cascade, feedforward
- **Process Safety**: HAZOP, relief systems
- **Economics**: CAPEX, OPEX, NPV

## Code Examples

### Reactor Design

```python
import numpy as np

def arrhenius_equation(k0, Ea, T):
    R = 8.314
    return k0 * np.exp(-Ea / (R * T))

def pfr_design(F_A0, X, -rA):
    return np.trapz(F_A0 * X / (-rA), X)

def cstr_volume(V, F_A0, X, -rA):
    return V * F_A0 * X / (-rA)

def residence_time(tau, V, v0):
    return V / v0

def conversion_pfr(F_A0, k, V):
    X = 1 - np.exp(-k * V / F_A0)
    return X

def multiple_reactors_cstr(n, V_total, F_A0, k):
    V = V_total / n
    X = 1 / (1 + k * V / F_A0)
    for _ in range(n - 1):
        X = 1 / (1 + k * V / (F_A0 * (1 - X)))
    return X

def damkohler_number(k, tau):
    return k * tau

F_A0 = 100  # mol/s
k = 0.01    # 1/s
V = 50      # m³
X_pfr = conversion_pfr(F_A0, k, V)
print(f"PFR conversion: {X_pfr:.4f}")
Da = damkohler_number(k, 5)
print(f"Damkohler number: {Da:.2f}")
```

### Distillation

```python
def mccabe_thiele(xD, xB, xF, alpha, reflux_ratio):
    x = np.linspace(0, 1, 100)
    y_eq = alpha * x / (1 + (alpha - 1) * x)
    
    R_min = (xD - y_eq[np.argmin(np.abs(x - xF))]) / (y_eq[np.argmin(np.abs(x - xF))] - x_F)
    R = 1.2 * R_min
    
    y = xD / (R + 1) + R / (R + 1) * x
    q_line = x / (x + (1 - x) / 0.5)
    
    return y, y_eq, R

def fenske_equation(xD, xB, alpha, N_min):
    return np.log((xD / (1 - xD)) * ((1 - xB) / xB)) / np.log(alpha)

def underwood_equations(alpha, xF, zF):
    theta = np.linspace(1.1, alpha - 0.1, 100)
    return np.interp(1, theta, np.sum(alpha * xF / (theta - alpha)))

def plate_efficiency_murphree(Emv, yn, yn_star):
    return (yn - yn_minus1) / (yn_star - yn_minus1)

xD, xB, xF = 0.95, 0.05, 0.50
alpha = 2.5
N_min = fenske_equation(xD, xB, alpha, 1)
print(f"Minimum stages: {N_min:.0f}")
```

### Heat Transfer

```python
def overall_heat_transfer(U, A, delta_T_lm):
    return U * A * delta_T_lm

def lmtd(delta_T1, delta_T2):
    return (delta_T1 - delta_T2) / np.log(delta_T1 / delta_T2) if delta_T1 != delta_T2 else delta_T1

def fouling_factor(h_foul, R_foul):
    return 1 / h_foul + R_foul

def heat_exchanger_effectiveness(NTU, C_min, C_max, heat_exchanger_type='counter'):
    if heat_exchanger_type == 'counter':
        epsilon = (1 - np.exp(-NTU * (1 - C_min/C_max))) / (1 - C_min/C_max * np.exp(-NTU * (1 - C_min/C_max)))
    else:
        epsilon = (1 - np.exp(-NTU * (1 - C_min))) / (1 - C_min * np.exp(-NTU))
    return epsilon

def ntu_method(Q_max, C_min, epsilon):
    return Q_max / (epsilon * C_min)

def shell_side_pressure_drop(f, G, D, L, rho):
    return 4 * f * (G**2) / (2 * rho * D) * (L / D)

U, A = 500, 100  # W/m²K, m²
dT1, dT2 = 50, 30
delta_Tlm = lmtd(dT1, dT2)
Q = overall_heat_transfer(U, A, delta_Tlm)
print(f"Heat duty: {Q:.0f} W")
```

### Mass Transfer

```python
def mass_transfer_coefficient(kL, a, D):
    return kL * a

def two_film_theory(k_g, k_l, H, P_A, p_Ai, C_Ai):
    N_A = k_g * (P_A - p_Ai) = k_l * (C_Ai - C_Al)
    return N_A

def penetration_theory(t_exp, D):
    k_L = np.sqrt(D / (np.pi * t_exp))

def wilson_plot(data, kL_a, temperature):
    return np.log(kL_a * temperature**0.5)

def hETP_height_equivalent_theoretical_plate(H, N):
    return H * N

def gas_liquid_equilibrium(P, y, x, m):
    return P * y / x

def overall_mass_transfer(K, k_g, k_l, m):
    return 1 / (1/k_g + m/k_l)
```

### Process Economics

```python
def capital_cost_base(capacity, scale_factor, cost_index):
    return base_cost * (capacity / base_capacity)**scale_factor * cost_index

def operating_cost(utilities, labor, maintenance, raw_materials):
    return sum([utilities, labor, maintenance, raw_materials])

def annualized_capital_cost(CAPEX, lifetime, interest_rate):
    return CAPEX * (interest_rate * (1 + interest_rate)**lifetime) / ((1 + interest_rate)**lifetime - 1)

def payback_period(initial_investment, annual_cash_flow):
    return initial_investment / annual_cash_flow

def net_present_value(cash_flows, discount_rate):
    return sum(cf / (1 + discount_rate)**t for t, cf in enumerate(cash_flows))

def levelized_cost(LCOE, annual_production):
    return LCOE / annual_production

CAPEX = 10e6
OPEX = 1e6
NPV = net_present_value([-CAPEX] + [OPEX]*10, 0.1)
print(f"NPV: {NPV:.2f} $")
```

## Best Practices

1. **Safety**: Consider HAZOP and safety factors
2. **Scale-up**: Consider mass/heat transfer limitations
3. **Economic Optimization**: Minimize total cost
4. **Environmental**: Consider emissions and waste
5. **Control**: Include appropriate control systems

## Common Patterns

```python
# Process flow diagram
def process_simulation():
    pass

# Aspen Plus integration
def aspen_export():
    pass
```

## Core Competencies

1. Reactor design
2. Separation processes
3. Heat transfer
4. Process economics
5. Process control
