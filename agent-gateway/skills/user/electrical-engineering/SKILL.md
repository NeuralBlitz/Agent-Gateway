---
name: electrical-engineering
description: Electrical engineering fundamentals and design
license: MIT
compatibility: opencode
metadata:
  audience: engineers, technicians, students
  category: engineering
---

## What I do

- Design electrical circuits and systems
- Analyze power systems and distribution
- Design digital and analog electronics
- Specify electrical equipment and components
- Ensure compliance with electrical codes

## When to use me

- When designing electrical systems for buildings or facilities
- When analyzing power distribution
- When selecting electrical equipment
- When designing electronic circuits
- When working on power generation or transmission

## Key Concepts

### Circuit Analysis

```python
import numpy as np
from scipy import signal

# Ohm's Law
def ohms_law(V=None, I=None, R=None):
    """Calculate unknown using V=IR"""
    if V is not None and R is not None:
        return V / R
    elif V is not None and I is not None:
        return V / I
    elif I is not None and R is not None:
        return I * R

# Kirchhoff's Current Law (KCL)
def kcl(node_currents):
    """Sum of currents at node = 0"""
    return sum(node_currents)

# Kirchhoff's Voltage Law (KVL)
def kvl(loop_voltages):
    """Sum of voltages in loop = 0"""
    return sum(loop_voltages)

# Power calculations
def electrical_power(V, I=None, R=None):
    """P = VI = I²R = V²/R"""
    if I is not None:
        return V * I
    elif R is not None:
        return V**2 / R

# AC circuits
def impedance(R, X_L=0, X_C=0):
    """Complex impedance Z = R + j(XL - XC)"""
    return complex(R, X_L - X_C)

def apparent_power(P, Q):
    """S = √(P² + Q²)"""
    return np.sqrt(P**2 + Q**2)

def power_factor(P, S):
    """PF = P/S"""
    return P / S
```

### Circuit Theorems

```python
# Thevenin equivalent
class TheveninEquivalent:
    def __init__(self, V_th, R_th):
        self.V_th = V_th  # Open circuit voltage
        self.R_th = R_th  # Equivalent resistance
    
    def max_power_transfer(self):
        """Maximum power when R_load = R_th"""
        return {
            "R_load": self.R_th,
            "P_max": self.V_th**2 / (4 * self.R_th)
        }

# Norton equivalent
class NortonEquivalent:
    def __init__(self, I_n, R_n):
        self.I_n = I_n  # Short circuit current
        self.R_n = R_n  # Equivalent resistance
```

### Power Systems

```python
# Three-phase power
class ThreePhasePower:
    @staticmethod
    def line_to_phase(V_line, connection="Y"):
        if connection == "Y":
            return V_line / np.sqrt(3)
        else:  # Delta
            return V_line
    
    @staticmethod
    def total_power(V_line, I_line, PF):
        # Y: S = √3 × V_L × I_L
        # Δ: S = √3 × V_L × I_L
        S = np.sqrt(3) * V_line * I_line
        P = S * PF
        Q = S * np.sqrt(1 - PF**2)
        return {"S": S, "P": P, "Q": Q}
    
    @staticmethod
    def voltage_drop(percent, V):
        """Allowable voltage drop"""
        return percent / 100 * V
```

### Electronic Components

| Component | Symbol | Function |
|-----------|--------|----------|
| Resistor | R | Current limiting, voltage division |
| Capacitor | C | Energy storage, filtering |
| Inductor | L | Energy storage, filtering |
| Diode | D | One-way current flow |
| Transistor | Q | Amplification, switching |
| Op-Amp | UA | Signal amplification |

### Filter Design

```python
# First order low-pass filter
def lp_filter_fc(R, C):
    """Cutoff frequency f_c = 1/(2πRC)"""
    return 1 / (2 * np.pi * R * C)

# Sallen-Key second order
def sallen_key_components(fc, Q):
    """Calculate component values"""
    # Given fc and Q, solve for R and C
    wc = 2 * np.pi * fc
    # R1 = R2 = R, C1 = C2 = C
    C = 1 / (wc * Q * R)  # Solve for C given R
    return {"R": R, "C": C}
```

### Electrical Codes

- **NEC (NFPA 70)**: National Electrical Code
- **IEC**: International Electrotechnical Commission
- **IEEE**: Institute of Electrical and Electronics Engineers
- **UL**: Underwriters Laboratories safety standards
- **NEMA**: National Electrical Manufacturers Association
