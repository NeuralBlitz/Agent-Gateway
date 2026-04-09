---
name: chemical-engineering
description: Chemical process engineering fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: engineers, process designers, researchers
  category: engineering
---

## What I do

- Design chemical processes and unit operations
- Perform mass and energy balance calculations
- Analyze reaction kinetics and reactor design
- Model separation processes (distillation, absorption, extraction)
- Size equipment (vessels, heat exchangers, pumps)
- Optimize process economics and efficiency

## When to use me

- When designing chemical plants or process equipment
- When calculating material and energy balances
- When selecting or sizing process equipment
- When analyzing reaction kinetics and reactor performance
- When optimizing separation processes
- When evaluating process safety and economics

## Key Concepts

### Mass and Energy Balances

```python
# Basic mass balance
class MassBalance:
    def __init__(self):
        self.inputs = {}
        self.outputs = {}
        self.reactions = []
    
    def add_stream(self, name, components, flowrate):
        """Add a material stream"""
        self.inputs[name] = {
            "components": components,
            "flowrate": flowrate  # kmol/hr or kg/hr
        }
    
    def add_reaction(self, stoichiometry, rate_expression=None):
        """Add chemical reaction"""
        self.reactions.append({
            "stoichiometry": stoichiometry,
            "rate": rate_expression
        })
    
    def solve_steady_state(self):
        """Solve for unknown streams"""
        # Sum inputs = Sum outputs + Accumulation
        # At steady state: Accumulation = 0
        total_in = sum(s["flowrate"] for s in self.inputs.values())
        return total_in

# Energy balance
def energy_balance(Q_in, W_s, H_out, H_in, dU_steady=0):
    """
    Q_in + W_s + ΣH_in = ΣH_out + dU/dt
    At steady state: dU/dt = 0
    """
    return Q_in + W_s + H_in - H_out - dU_steady
```

### Reaction Engineering

```python
# Reactor design equations
class ReactorDesign:
    @staticmethod
    def cstr_volume(F_A0, X, k, C_A0):
        """Continuous Stirred Tank Reactor"""
        # V = F_A0 * X / (-r_A)
        # For first order: -r_A = k * C_A0 * (1 - X)
        return F_A0 * X / (k * C_A0 * (1 - X))
    
    @staticmethod
    def pfr_volume(F_A0, X, k):
        """Plug Flow Reactor"""
        # V = F_A0 ∫ dX/(-r_A)
        # For first order: V = F_A0 * (-ln(1-X)) / k
        return F_A0 * (-np.log(1 - X)) / k
    
    @staticmethod
    def conversion_time(t, k, order=1):
        """Batch reactor"""
        if order == 1:
            return 1 - np.exp(-k * t)
        elif order == 2:
            return k * t / (1 + k * t)
```

### Heat Transfer

```python
# Heat exchanger design
class HeatExchanger:
    @staticmethod
    def lmtd(T_h_in, T_h_out, T_c_in, T_c_out):
        """Log Mean Temperature Difference"""
        if T_h_out == T_c_in:
            return (T_h_in - T_c_out - (T_h_out - T_c_in)) / \
                   np.log((T_h_in - T_c_out) / (T_h_out - T_c_in))
        
        dT1 = T_h_in - T_c_out
        dT2 = T_h_out - T_c_in
        return (dT1 - dT2) / np.log(dT1 / dT2)
    
    @staticmethod
    def heat_transfer_area(Q, U, LMTD):
        """Calculate required area"""
        return Q / (U * LMTD)
```

### Separation Processes

| Process | Phase Contact | Separation Basis |
|---------|--------------|------------------|
| Distillation | Vapor-Liquid | Boiling point |
| Absorption | Gas-Liquid | Solubility |
| Extraction | Liquid-Liquid | Solute solubility |
| Adsorption | Solid-Gas/Liquid | Surface affinity |
| Filtration | Solid-Liquid | Particle size |
| Crystallization | Solid-Liquid | Solubility |

### Equipment Sizing

```python
# Tank sizing
def size_storage_tank(volume, agitation=False):
    """Size a storage tank"""
    H_to_D = 1.5 if agitation else 1.0
    D = (4 * volume / (np.pi * H_to_D)) ** (1/3)
    H = H_to_D * D
    return {"diameter": D, "height": H}

# Pump power
def pump_power(flow_rate, head, efficiency=0.7):
    """Calculate pump power requirement"""
    # Q in m³/s, H in m, ρ in kg/m³
    rho = 1000  # water
    power_hydraulic = rho * 9.81 * flow_rate * head
    return power_hydraulic / efficiency
```
