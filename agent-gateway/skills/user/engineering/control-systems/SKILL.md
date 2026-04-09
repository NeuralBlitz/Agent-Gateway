---
name: control-systems
description: Control systems fundamentals including PID control, state-space analysis, stability criteria, observer design, and robust control
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Design and analyze control systems using various methods
- Implement PID and advanced control algorithms
- Perform stability and robustness analysis
- Design state observers and estimators
- Develop MIMO control strategies
- Tune controller parameters for optimal performance
- Analyze system frequency response
- Implement adaptive and nonlinear control

## When to use me
When designing feedback control systems, analyzing stability, tuning controllers, or implementing advanced control strategies for dynamic systems.

## Core Concepts
- Transfer function and state-space representation
- PID control and tuning methods
- Stability analysis (Routh-Hurwitz, Nyquist, Bode)
- Controllability and observability
- State feedback and LQR control
- Observer design (Luenberger, Kalman)
- Frequency response analysis
- Robust control (H-infinity, mu-synthesis)
- Adaptive control
- Nonlinear control systems

## Code Examples

### Transfer Function Analysis
```python
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple
import control
import matplotlib.pyplot as plt

@dataclass
class TransferFunction:
    num: List[float]
    den: List[float]
    
    def eval(self, s: complex) -> complex:
        """Evaluate transfer function at s."""
        num_val = sum(self.num[i] * s**(len(self.num) - 1 - i) 
                     for i in range(len(self.num)))
        den_val = sum(self.den[i] * s**(len(self.den) - 1 - i) 
                     for i in range(len(self.den)))
        return num_val / den_val if den_val != 0 else complex(float('inf'))

def step_response(tf: TransferFunction, t: np.ndarray) -> np.ndarray:
    """Calculate step response."""
    sys = control.TransferFunction(tf.num, tf.den)
    t_out, y = control.step(sys, t)
    return y

def impulse_response(tf: TransferFunction, t: np.ndarray) -> np.ndarray:
    """Calculate impulse response."""
    sys = control.TransferFunction(tf.num, tf.den)
    t_out, y = control.impulse(sys, t)
    return y

def bode_plot(tf: TransferFunction, w: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Calculate Bode plot data."""
    sys = control.TransferFunction(tf.num, tf.den)
    w_out, mag, phase = control.bode_plot(sys, w, plot=False)
    return mag, phase

def root_locus(tf: TransferFunction, k: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Calculate root locus."""
    sys = control.TransferFunction(tf.num, tf.den)
    k_out, poles = control.root_locus(sys, k, plot=False)
    return k_out, poles

def routh_hurwitz(coeffs: List[float]) -> Tuple[List[List[float]], str]:
    """Construct Routh-Hurwitz array and check stability."""
    n = len(coeffs) - 1
    array = []
    
    row1 = coeffs[::2] if len(coeffs) % 2 else coeffs[::2] + [0]
    row2 = coeffs[1::2] if len(coeffs) % 2 else coeffs[1::2]
    
    array.append(row1)
    array.append(row2)
    
    for i in range(2, n + 1):
        row = []
        for j in range(len(row1) - 1):
            a = array[i-1][0]
            row.append((array[i-2][j+1] * row1[0] - array[i-2][0] * array[i-1][j+1]) / a)
        array.append(row)
        
        if i == n:
            break
    
    # Check stability
    sign_changes = 0
    for i in range(len(array[0])):
        if i == 0:
            continue
        if array[0][i-1] * array[0][i] < 0:
            sign_changes += 1
    
    stable = all(x > 0 for x in array[0])
    return array, "stable" if stable else f"{sign_changes} sign changes"

# Example: Second-order system analysis
sys_tf = TransferFunction([100], [1, 10, 100])
t = np.linspace(0, 2, 1000)
y = step_response(sys_tf, t)
print(f"Peak time: {t[np.argmax(y)]:.3f} s")
print(f"Overshoot: {(max(y) - 1) * 100:.1f}%")
print(f"Settling time: {t[np.argmax(y > 0.98)]:.3f} s")
```

### PID Controller Design
```python
@dataclass
class PIDGains:
    Kp: float
    Ki: float
    Kd: float
    Tf: float = 0.0  # Filter time constant

def pid_transfer_function(gains: PIDGains) -> Tuple[List[float], List[float]]:
    """Get PID transfer function coefficients."""
    if gains.Tf > 0:
        num = [gains.Kp + gains.Ki * gains.Tf + gains.Kd,
               gains.Ki + gains.Kd / gains.Tf,
               gains.Kd * gains.Ki / gains.Tf]
        den = [gains.Tf, 1, 0]
    else:
        num = [gains.Kp + gains.Kd, gains.Ki]
        den = [1, 0]
    return num, den

def ziegler_nichols_tuning(
    Ku: float,  # ultimate gain
    Tu: float   # ultimate period
) -> PIDGains:
    """Ziegler-Nichols tuning method."""
    return PIDGains(
        Kp=0.6 * Ku,
        Ki=1.2 * Ku / Tu,
        Kd=0.075 * Ku * Tu
    )

def cohen_coon_tuning(
    K: float,
    L: float,
    T: float
) -> PIDGains:
    """Cohen-Coon tuning method."""
    return PIDGains(
        Kp=(1.35 * T / (K * L)) * (1 + 0.2 * (L / T)),
        Ki=1.35 / L,
        Kd=0.37 * T
    )

def imc_tuning(
    K: float,
    tau: float,
    lambda_c: float  # closed-loop time constant
) -> PIDGains:
    """IMC (Internal Model Control) tuning."""
    Kc = tau / (K * (lambda_c + tau))
    tau_I = tau
    tau_D = lambda_c * tau / (tau + lambda_c)
    return PIDGains(Kp=Kc, Ki=Kc/tau_I, Kd=Kc*tau_D)

def antiwindup_pid(
    Kp: float,
    Ki: float,
    Kd: float,
    u_max: float,
    u_min: float,
    Kb: float = 1.0
) -> Tuple[float, float, float]:
    """Anti-windup gain adjustment."""
    return Kp, Ki, Kd

# Example: PID tuning
gains = ziegler_nichols_tuning(Ku=2.5, Tu=1.2)
print(f"Ziegler-Nichols: Kp={gains.Kp:.2f}, Ki={gains.Ki:.2f}, Kd={gains.Kd:.3f}")

imc_gains = imc_tuning(K=2.0, tau=0.5, lambda_c=0.3)
print(f"IMC: Kp={imc_gains.Kp:.2f}, Ki={imc_gains.Ki:.2f}, Kd={imc_gains.Kd:.3f}")
```

### State-Space Control
```python
@dataclass
class StateSpaceModel:
    A: np.ndarray
    B: np.ndarray
    C: np.ndarray
    D: np.ndarray

def controllability_matrix(sys: StateSpaceModel) -> np.ndarray:
    """Check controllability."""
    n = sys.A.shape[0]
    Cc = sys.B.copy()
    for i in range(1, n):
        Cc = np.hstack([Cc, np.linalg.matrix_power(sys.A, i) @ sys.B])
    return Cc

def observability_matrix(sys: StateSpaceModel) -> np.ndarray:
    """Check observability."""
    n = sys.A.shape[0]
    Co = sys.C.copy()
    for i in range(1, n):
        Co = np.vstack([Co, sys.C @ np.linalg.matrix_power(sys.A, i)])
    return Co

def lyapunov_equation(A: np.ndarray, Q: np.ndarray) -> np.ndarray:
    """Solve Lyapunov equation A'P + PA = -Q."""
    n = A.shape[0]
    P = np.zeros((n, n))
    # Use SciPy's lyapunov_solve for numerical solution
    from scipy.linalg import lyapunov_solve
    return lyapunov_solve(A.T, -Q)

def lqr_design(
    A: np.ndarray,
    B: np.ndarray,
    Q: np.ndarray,
    R: float
) -> Tuple[np.ndarray, np.ndarray]:
    """Design LQR state feedback controller."""
    from scipy.linalg import solve
    n = A.shape[0]
    P = solve_continuous_lyapunov(A.T @ Q, -Q @ B)
    K = np.linalg.inv(R) @ B.T @ P
    return K, P

def place_poles(A: np.ndarray, B: np.ndarray, desired_poles: np.ndarray) -> np.ndarray:
    """Pole placement controller design."""
    return control.place(A, B, desired_poles)

def kalman_filter(
    A: np.ndarray,
    C: np.ndarray,
    Q: np.ndarray,
    R: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """Design Kalman filter."""
    from scipy.linalg import solve_discrete_lyapunov
    P = solve_discrete_lyapunov(A.T, C.T @ R @ C + Q)
    L = P @ C.T @ np.linalg.inv(C @ P @ C.T + R)
    return L, P

# Example: State-space system
A = np.array([[0, 1], [-100, -10]])
B = np.array([[0], [1]])
C = np.array([[1, 0]])
D = np.array([[0]])

sys_ss = StateSpaceModel(A, B, C, D)
Cc = controllability_matrix(sys_ss)
rank = np.linalg.matrix_rank(Cc)
print(f"Controllability matrix rank: {rank} (system is {'controllable' if rank == 2 else 'not controllable'})")
```

### Frequency Response Analysis
```python
def gain_margin_phase_margin(
    sys: control.TransferFunction
) -> Tuple[float, float]:
    """Calculate gain and phase margins."""
    w, mag, phase = control.bode_plot(sys, plot=False)
    
    # Find phase crossover frequency (where phase = -180)
    phase_deg = np.rad2deg(phase)
    idx_phase = np.where(phase_deg[:-1] * phase_deg[1:] < 0)[0]
    if len(idx_phase) > 0:
        w_pc = w[idx_phase[0]]
        gm = 1 / np.abs(mag[idx_phase[0]])
    else:
        w_pc, gm = 0, float('inf')
    
    # Find gain crossover frequency (where gain = 1 or 0 dB)
    mag_db = 20 * np.log10(mag)
    idx_gain = np.where(mag_db[:-1] * mag_db[1:] < 0)[0]
    if len(idx_gain) > 0:
        w_gc = w[idx_gain[0]]
        pm = 180 + phase_deg[idx_gain[0]]
    else:
        w_gc, pm = 0, float('inf')
    
    return gm, pm

def nyquist_stability(sys: control.TransferFunction) -> Tuple[int, bool]:
    """Analyze Nyquist plot for stability."""
    from control import nyquist_plot
    s = 1j * np.logspace(-3, 3, 1000)
    sys_val = np.array([sys(complex(s_i)) for s_i in s])
    N = -np.sum(np.diff(np.angle(sys_val)) < -np.pi) - 1
    P = 0  # Number of unstable open-loop poles
    Z = N + P
    return N, Z == 0

def Nichols_analysis():
    pass
```

### Adaptive and Robust Control
```python
def model_reference_adaptive_control(
    ref_model: np.ndarray,
    plant: np.ndarray,
    gamma: float = 100
) -> Tuple[np.ndarray, np.ndarray]:
    """MRAC parameter adaptation."""
    pass

def sliding_mode_control(
    x: np.ndarray,
    A: np.ndarray,
    B: np.ndarray,
    K: np.ndarray,
    lambda_smc: float,
    eta: float
) -> np.ndarray:
    """Sliding mode control with reaching law."""
    s = K @ x
    sat_s = np.sign(s)
    return np.linalg.inv(B) @ (A @ x + lambda_smc * sat_s + eta * sat_s)

def h_infinity_design(
    G: control.TransferFunction,
    W1: control.TransferFunction,
    W2: control.TransferFunction,
    gamma: float = 1.0
) -> control.TransferFunction:
    """H-infinity controller synthesis."""
    pass

# Example: Sliding mode control
A_cl = np.array([[0, 1], [-2, -3]])
B = np.array([[0], [1]])
K = np.array([[-3, -2]])  # Desired closed-loop poles
lambda_smc = 10
eta = 2.0
x = np.array([[0.5], [0.2]])
u = sliding_mode_control(x, A_cl, B, K, lambda_smc, eta)
print(f"SMC input: {u[0,0]:.3f}")
```

## Best Practices
- Always verify stability before deploying controllers
- Use anti-windup techniques for integral control
- Consider measurement noise in derivative terms
- Validate models with experimental data
- Use multiple tuning methods and compare results
- Consider robustness to parameter variations
- Implement safety limits and saturation handling
- Use proper signal conditioning (filtering, scaling)
- Document controller design and tuning procedures
- Test under realistic conditions before deployment
