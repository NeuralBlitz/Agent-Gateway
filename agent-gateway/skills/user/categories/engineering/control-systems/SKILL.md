---
name: Control Systems
description: Control systems fundamentals including PID control, state-space analysis, stability criteria, observer design, and robust control for engineering applications.
license: MIT
compatibility: python>=3.8
audience: control-engineers, automation-engineers, researchers, students
category: engineering
---

# Control Systems

## What I Do

I provide comprehensive control systems tools including PID control, state-space analysis, stability criteria, observer design, and robust control methods for engineering applications.

## When to Use Me

- PID controller tuning
- State-space controller design
- Stability analysis
- Observer/Kalman filter design
- Robust and adaptive control
- Frequency response analysis

## Core Concepts

- **PID Control**: Proportional, integral, derivative
- **State-Space**: Controllability, observability
- **Stability**: Bode, Nyquist, Routh-Hurwitz
- **Control Design**: Pole placement, LQR
- **Observers**: Luenberger, Kalman filter
- **Robust Control**: H-infinity, mu-synthesis
- **Adaptive Control**: MRAC, self-tuning
- **Digital Control**: Discrete systems, z-transform

## Code Examples

### PID Control

```python
import numpy as np

def pid_output(Kp, Ki, Kd, error, integral, prev_error, dt):
    P = Kp * error
    I = Ki * integral * dt
    D = Kd * (error - prev_error) / dt
    return P + I + D

def pid_tuning_ziegler_nichols(Ku, Tu):
    Kp = 0.6 * Ku
    Ki = 1.2 * Ku / Tu
    Kd = 0.075 * Ku * Tu
    return Kp, Ki, Kd

def anti_windup(limit, integral, error, Kp, Kb):
    if abs(integral) > limit:
        integral = integral - Kb * error
    return integral

def pid_discrete(Kp, Ki, Kd, e_k, e_k1, e_k2, u_k1, Ts):
    u_k = u_k1 + Kp * (e_k - e_k1) + Ki * Ts / 2 * (e_k + e_k1) + Kd / Ts * (e_k - 2*e_k1 + e_k2)
    return u_k

def auto_tuning_relay_feedback(relay_amplitude, period, ultimate_gain):
    Ku = 4 * relay_amplitude / (np.pi * amplitude)
    Tu = period
    return Ku, Tu

Kp, Ki, Kd = 2.5, 0.5, 0.1
u = pid_output(Kp, Ki, Kd, error=0.5, integral=1.0, prev_error=0.6, dt=0.01)
print(f"PID output: {u:.4f}")
```

### State-Space Analysis

```python
from numpy.linalg import matrix_rank, eig

def controllability_matrix(A, B):
    n = A.shape[0]
    C = B
    for i in range(1, n):
        C = np.hstack([C, np.linalg.matrix_power(A, i) @ B])
    return C

def observability_matrix(A, C):
    n = A.shape[0]
    O = C
    for i in range(1, n):
        O = np.vstack([O, C @ np.linalg.matrix_power(A, i)])
    return O

def pole_placement(A, B, desired_poles):
    n = A.shape[0]
    K = place(A, B, desired_poles)
    return K

def lyapunov_stability(A, Q):
    P = solve_continuous_lyapunov(A.T, -Q)
    return P

def modal_analysis(A):
    eigenvalues, eigenvectors = np.linalg.eig(A)
    return eigenvalues, eigenvectors

A = np.array([[0, 1], [-2, -3]])
B = np.array([[0], [1]])
C = controllability_matrix(A, B)
rank = matrix_rank(C)
print(f"Controllability: {'controllable' if rank == 2 else 'not controllable'}")
```

### Stability Analysis

```python
def routh_hurwitz(array):
    n = len(array)
    s = [[0] * ((n + 1) // 2) for _ in range(n + 1)]
    s[0] = array[::2]
    s[1] = array[1::2]
    
    for i in range(2, n + 1):
        for j in range((n + 1) // 2):
            if i % 2 == 0:
                s[i][j] = s[i-2][j+1] - s[i-1][j] * s[i-2][0] / s[i-1][0]
            else:
                s[i][j] = s[i-2][j] - s[i-1][j] * s[i-2][0] / s[i-1][0]
    
    return s

def nyquist_stability(G, s_range):
    return G(s_range)

def gain_margin(phase_cross, gain_at_phase_cross):
    return 1 / gain_at_phase_cross

def phase_margin(gain_cross, phase_at_gain_cross):
    return 180 + phase_at_gain_cross

def bode_plot_magnitude(G, omega):
    return 20 * np.log10(np.abs(G(1j * omega)))

def bode_plot_phase(G, omega):
    return np.angle(G(1j * omega), deg=True)

omega = np.logspace(-2, 2, 100)
GM, PM = 15, 45
print(f"Gain margin: {GM:.1f} dB, Phase margin: {PM:.1f}°")
```

### Observer Design

```python
def luenberger_observer(A, C, desired_poles):
    L = place(A.T, C.T, desired_poles).T
    return L

def kalman_gain(A, C, Q, R):
    P = solve_continuous_are(A.T, C.T, Q, R)
    return P @ C.T @ np.linalg.inv(R)

def reduced_order_observer(A, C, L):
    pass

def disturbance_observer(K_d, G_p):
    return K_d / (1 + K_d * G_p)

def sensor_fusion_kalman(GPS_variance, IMU_variance):
    return GPS_variance / (GPS_variance + IMU_variance)

def notch_filter_design(f0, Q, fs):
    w0 = 2 * np.pi * f0 / fs
    alpha = np.sin(w0) / (2 * Q)
    b0 = 1
    b1 = -2 * np.cos(w0)
    b2 = 1
    a0 = 1 + alpha
    a1 = -2 * np.cos(w0)
    a2 = 1 - alpha
    return [b0/a0, b1/a0, b2/a0], [1, a1/a0, a2/a0]

L = luenberger_observer(A, C, [-10, -12])
print(f"Observer gain: {L}")
```

### Discrete Control

```python
def bilinear_transform(s, Ts):
    return (2/Ts) * (1 - s) / (1 + s)

def forward_euler(s, Ts):
    return (z - 1) / Ts

def discrete_poles(continuous_poles, Ts):
    return np.exp(continuous_poles * Ts)

def c2d_continuous_discrete(A, B, Ts):
    n = A.shape[0]
    M = np.eye(n)
    N = np.zeros((n, n))
    for k in range(1, 20):
        M = M @ A / k + np.eye(n)
        N = N + M
    Ad = np.linalg.matrix_power(A, 19) @ Ts
    Bd = N @ B * Ts
    return Ad, Bd

def sample_and_hold(Gc, Ts):
    return Gc * (1 - np.exp(-s * Ts)) / s

s_poles = [-10, -20]
z_poles = discrete_poles(s_poles, 0.01)
print(f"Discrete poles: {z_poles}")
```

## Best Practices

1. **Model Accuracy**: Validate models with experimental data
2. **Tuning**: Systematic tuning procedures
3. **Constraints**: Account for actuator limits
4. **Robustness**: Test under uncertainty
5. **Implementation**: Consider discretization effects

## Common Patterns

```python
# LQR controller
def lqr(A, B, Q, R):
    P = solve_continuous_are(A, B, Q, R)
    return np.linalg.inv(R) @ B.T @ P
```

## Core Competencies

1. PID control and tuning
2. State-space methods
3. Stability analysis
4. Observer design
5. Digital control
