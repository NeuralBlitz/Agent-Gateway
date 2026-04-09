---
name: control-systems
description: Control systems analysis and design
license: MIT
compatibility: opencode
metadata:
  audience: engineers, automation specialists, students
  category: engineering
---

## What I do

- Design feedback control systems and controllers
- Analyze system stability and performance
- Implement PID and advanced control strategies
- Model dynamic systems and create simulations
- Tune control parameters for optimal performance

## When to use me

- When designing automated control systems
- When analyzing stability of feedback systems
- When implementing PID controllers
- When tuning control system parameters
- When modeling dynamic systems

## Key Concepts

### Control System Basics

```python
import numpy as np
import control as ct

# Transfer function representation
s = ct.TransferFunction.s

# First order system
G1 = 1 / (s + 1)

# Second order system
G2 = 1 / (s**2 + 2*0.1*s + 1)

# Closed loop transfer function
def closed_loop(G, K):
    """Calculate closed loop TF"""
    return (G * K) / (1 + G * K)

# System response
t = np.linspace(0, 10, 100)
t, y = ct.step_response(G1, t)
```

### PID Controller

```python
class PIDController:
    def __init__(self, Kp=1, Ki=0, Kd=0):
        self.Kp = Kp  # Proportional gain
        self.Ki = Ki  # Integral gain  
        self.Kd = Kd  # Derivative gain
        self.prev_error = 0
        self.integral = 0
        self.setpoint = 0
    
    def compute(self, measurement, dt):
        """Compute PID output"""
        error = self.setpoint - measurement
        
        # Proportional term
        P = self.Kp * error
        
        # Integral term
        self.integral += error * dt
        I = self.Ki * self.integral
        
        # Derivative term
        derivative = (error - self.prev_error) / dt
        D = self.Kd * derivative
        
        self.prev_error = error
        
        return P + I + D
    
    def tune_ziegler_nichols(self, Ku, Tu):
        """Ziegler-Nichols tuning"""
        self.Kp = 0.6 * Ku
        self.Ki = 2 * self.Kp / Tu
        self.Kd = self.Kp * Tu / 8
```

### Stability Analysis

```python
# Routh-Hurwitz criterion
def routh_hurwitz(coeffs):
    """Determine stability from characteristic equation"""
    n = len(coeffs)
    if n < 2:
        return "Insufficient order"
    
    # Check coefficients
    if any(c <= 0 for c in coeffs[:-1]):
        return "Unstable - negative coefficients"
    
    # For 2nd order: a1 > 0, a0 > 0
    # For 3rd order: a1*a2 > a0*a3
    
    return "Potentially stable - verify"

# Bode stability margin
def stability_margins(G):
    """Calculate gain and phase margin"""
    mag, phase, omega = ct.bode(G, Plot=False)
    
    # Phase crossover (phase = -180)
    phase_cross_idx = np.where(phase <= -180)[0]
    if len(phase_cross_idx) > 0:
        gm = 1 / mag[phase_cross_idx[0]]
    else:
        gm = np.inf
    
    # Gain crossover (magnitude = 1)
    gain_cross_idx = np.where(mag >= 1)[0][0]
    pm = 180 + phase[gain_cross_idx]
    
    return {"gain_margin": gm, "phase_margin": pm}
```

### State Space Control

```python
class StateSpaceController:
    def __init__(self, A, B, C, D):
        self.A = A
        self.B = B
        self.C = C
        self.D = D
        self.x = np.zeros((A.shape[0], 1))
    
    def pole_placement(self, desired_poles):
        """Place closed loop poles"""
        # Calculate gain matrix K for desired poles
        # K = place(A, B, poles)
        pass
    
    def observer_design(self, desired_poles):
        """Design state observer"""
        # L = place(A', C', poles)'
        pass
    
    def update(self, u, dt):
        """State update"""
        self.x = self.x + dt * (self.A @ self.x + self.B @ u)
        return self.C @ self.x
```

### Performance Specifications

| Specification | Definition | Typical Value |
|----------------|------------|---------------|
| Rise Time | 10%-90% of final value | < 2 sec |
| Settling Time | Within 2% of final | < 5 sec |
| Overshoot | Peak above final value | < 10% |
| Steady-State Error | Final value error | < 1% |
| Bandwidth | -3dB frequency | Design dependent |

### Control Strategies

```python
# Feedforward control
class FeedforwardController:
    def __init__(self, G_inv):
        self.G_inv = G_inv  # Inverse of plant model
    
    def compute(self, disturbance, setpoint):
        """Feedforward + feedback"""
        u_ff = self.G_inv * setpoint
        u_fb = self.feedback_controller.compute()
        return u_ff + u_fb

# Cascade control
class CascadeControl:
    """Inner loop (fast) and outer loop (slow)"""
    def __init__(self, inner_loop, outer_loop):
        self.inner = inner_loop
        self.outer = outer_loop
```
