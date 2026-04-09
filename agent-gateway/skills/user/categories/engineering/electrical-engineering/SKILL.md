---
name: Electrical Engineering
description: Circuit analysis including analog and digital circuits, signal processing, control systems, power electronics, and electromagnetic compatibility for engineering applications.
license: MIT
compatibility: python>=3.8
audience: electrical-engineers, electronics-engineers, researchers, students
category: engineering
---

# Electrical Engineering

## What I Do

I provide comprehensive electrical engineering tools including circuit analysis, signal processing, control systems, power electronics, digital logic, and electromagnetic compatibility for engineering applications.

## When to Use Me

- Circuit analysis and design
- Filter and amplifier design
- Control system analysis
- Power electronics design
- Digital logic design
- EMC/EMI analysis

## Core Concepts

- **Circuit Laws**: Ohm's, Kirchhoff's, Thevenin's, Norton's
- **AC Analysis**: Phasors, impedance, power factor
- **Filters**: Low-pass, high-pass, band-pass, notch
- **Amplifiers**: Op-amp, transistor, feedback
- **Control Systems**: Transfer functions, stability, PID
- **Power Electronics**: Rectifiers, converters, inverters
- **Digital Logic**: Gates, combinational, sequential
- **Signals**: Fourier, Laplace, Z-transforms

## Code Examples

### Circuit Analysis

```python
import numpy as np

def ohm_law(V, I, R):
    return V - I * R

def voltage_divider(Vin, R1, R2):
    return Vin * R2 / (R1 + R2)

def current_divider(Iin, R1, R2):
    return Iin * R1 / (R1 + R2)

def thevenin_equivalent(Vth, Rth, RL):
    return Vth * RL / (Rth + RL)

def nodal_analysis(admittances, source_voltages):
    Y = np.array(admittances)
    I = np.array(source_voltages)
    return np.linalg.solve(Y, I)

Vin, R1, R2 = 12, 1000, 2000
Vout = voltage_divider(Vin, R1, R2)
print(f"Output voltage: {Vout:.2f} V")
```

### AC Circuit Analysis

```python
def impedance_resistor(R):
    return R + 0j

def impedance_inductor(L, f):
    omega = 2 * np.pi * f
    return 0 + 1j * omega * L

def impedance_capacitor(C, f):
    omega = 2 * np.pi * f
    return 0 - 1j / (omega * C)

def series_impedance(Z1, Z2):
    return Z1 + Z2

def parallel_impedance(Z1, Z2):
    return Z1 * Z2 / (Z1 + Z2)

def power_apparent(S, pf):
    return {'S': S, 'P': S * pf, 'Q': S * np.sqrt(1 - pf**2)}

R, L, C = 100, 0.01, 1e-6
f = 60  # Hz
Z_L = impedance_inductor(L, f)
Z_C = impedance_capacitor(C, f)
Z_R = impedance_resistor(R)
Z_total = series_impedance(Z_R, series_impedance(Z_L, Z_C))
print(f"Total impedance: {Z_total:.2f} Ω")
```

### Filter Design

```python
def lowpass_rc(f, fc):
    omega = 2 * np.pi * f
    omega_c = 2 * np.pi * fc
    return 1 / np.sqrt(1 + (omega / omega_c)**2)

def highpass_rc(f, fc):
    omega = 2 * np.pi * f
    omega_c = 2 * np.pi * fc
    return (omega / omega_c) / np.sqrt(1 + (omega / omega_c)**2)

def butterworth_order(f_pass, f_stop, Ap, As):
    n = np.log10((10**(As/10) - 1) / (10**(Ap/10) - 1)) / (2 * np.log10(f_stop / f_pass))
    return int(np.ceil(n))

def chebyshev_coeff(n, ripple):
    from scipy.special import chebyshev
    return chebyshev(n, 1)

fc = 1000
f = np.linspace(100, 10000, 1000)
gain = lowpass_rc(f, fc)
print(f"Gain at cutoff: {gain[list(f).index(fc)]:.3f}")
```

### Transfer Functions

```python
from control import TransferFunction, step_response, bode_plot

def transfer_function(num_coeffs, den_coeffs):
    return TransferFunction(num_coeffs, den_coeffs)

def pid_controller(Kp, Ki, Kd):
    s = TransferFunction.s
    return Kp + Ki/s + Kd*s

def closed_loop_tf(G, H):
    return G / (1 + G * H)

def root_locus_plot(G):
    import matplotlib.pyplot as plt
    plt.figure()
    plt.grid(True)
    return G

G = TransferFunction([1], [1, 2, 1])
print(f"Transfer function poles: {G.pole()}")
print(f"Transfer function zeros: {G.zero()}")
```

### Power Electronics

```python
def rectifier_dc_output(Vrms, diode_drop=0.7, n=1):
    return n * np.sqrt(2) * Vrms / np.pi - 2 * diode_drop

def boost_converter Vin, Vout, D):
    return Vout / (1 - D)

def buck_converter(Vin, D, R, ESR_L=0, ESR_C=0):
    return Vin * D

def inverter_output(fundamental_amplitude, harmonic_order):
    V_fund = 4 * fundamental_amplitude / np.pi
    return V_fund / harmonic_order

def switching_loss(P_cond, P_sw, f_sw):
    return P_cond + P_sw * f_sw

Vin = 12
Vout = 24
D = 0.5
print(f"Boost converter duty cycle: {1 - Vin/Vout:.3f}")
print(f"Required D: {D:.3f}")
```

## Best Practices

1. **Ground**: Maintain clean ground planes
2. **Impedance Matching**: Minimize reflections
3. **EMI**: Filter and shield appropriately
4. **Thermal**: Consider power dissipation
5. **Tolerance**: Account for component variations

## Common Patterns

```python
# Bode plot calculation
def bode_magnitude(num, den, omega):
    H = np.polyval(num, 1j*omega) / np.polyval(den, 1j*omega)
    return 20 * np.log10(np.abs(H))

# Nyquist stability
def nyquist_plot(G):
    return G

# Monte Carlo analysis
def monte_carlo_circuit(circuit_func, n=1000):
    results = []
    for _ in range(n):
        params = sample_parameters()
        results.append(circuit_func(params))
    return np.array(results)
```

## Core Competencies

1. Circuit analysis and design
2. AC and transient analysis
3. Filter and amplifier design
4. Control system fundamentals
5. Power electronics basics
