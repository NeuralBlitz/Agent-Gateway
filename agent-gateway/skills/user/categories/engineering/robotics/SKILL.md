---
name: Robotics
description: Robotics fundamentals including kinematics, dynamics, motion planning, perception, control, and human-robot interaction for automation and robotics applications.
license: MIT
compatibility: python>=3.8
audience: roboticists, engineers, researchers, students
category: engineering
---

# Robotics

## What I Do

I provide comprehensive robotics tools including forward and inverse kinematics, dynamics, motion planning, perception algorithms, control systems, and human-robot interaction for robotics applications.

## When to Use Me

- Robot manipulator design
- Mobile robot navigation
- Sensor integration
- Motion planning algorithms
- Robot control systems
- Autonomous systems

## Core Concepts

- **Kinematics**: Forward and inverse kinematics
- **Dynamics**: Newton-Euler, Lagrangian
- **Motion Planning**: Path planning, trajectory generation
- **Perception**: Computer vision, sensor fusion
- **Control**: PID, adaptive, robust control
- **Localization**: SLAM, Kalman filtering
- **Dynamics**: Joint dynamics, workspace analysis
- **Human-Robot Interaction**: Safety, collaboration

## Code Examples

### Forward Kinematics

```python
import numpy as np

def dh_transform(theta, d, a, alpha):
    ct = np.cos(theta)
    st = np.sin(theta)
    ca = np.cos(alpha)
    sa = np.sin(alpha)
    
    return np.array([
        [ct, -st*ca, st*sa, a*ct],
        [st, ct*ca, -ct*sa, a*st],
        [0, sa, ca, d],
        [0, 0, 0, 1]
    ])

def forward_kinematics(dh_params, joint_angles):
    T = np.eye(4)
    for i, (theta, d, a, alpha) in enumerate(dh_params):
        T = T @ dh_transform(joint_angles[i], d, a, alpha)
    return T

dh_params = [
    (0, 0.089, 0, np.pi/2),
    (0, 0, -0.425, 0),
    (0, 0, -0.392, 0)
]
joints = [0, 0, 0]
T = forward_kinematics(dh_params, joints)
print(f"End effector position: {T[:3, 3]}")
```

### Inverse Kinematics

```python
def analytical_ik_2r(link1, link2, target):
    x, y = target
    D = (x**2 + y**2 - link1**2 - link2**2) / (2 * link1 * link2)
    
    if abs(D) > 1:
        return None
    
    theta2 = np.arctan2(np.sqrt(1 - D**2), D)
    theta1 = np.arctan2(y, x) - np.arctan2(link2 * np.sin(theta2), link1 + link2 * np.cos(theta2))
    
    return [theta1, theta2]

def numerical_ik(fk_func, target, initial_joints, max_iter=100, tol=1e-4):
    joints = np.array(initial_joints)
    for _ in range(max_iter):
        T = fk_func(joints)
        error = target - T[:3, 3]
        if np.linalg.norm(error) < tol:
            break
        
        J = numerical_jacobian(fk_func, joints)
        joints += np.linalg.pinv(J) @ error
    
    return joints

link1, link2 = 1.0, 0.8
target = (1.2, 0.5)
solution = analytical_ik_2r(link1, link2, target)
print(f"Joint angles: {solution}")
```

### Motion Planning

```python
def rrt_planner(start, goal, obstacles, bounds, step_size=0.1, max_iter=1000):
    tree = {tuple(start): None}
    
    for _ in range(max_iter):
        if np.random.random() < 0.1:
            rand_point = tuple(goal)
        else:
            rand_point = tuple(np.random.uniform(bounds[0], bounds[1]))
        
        nearest = min(tree.keys(), key=lambda x: np.linalg.norm(np.array(x) - np.array(rand_point)))
        
        direction = np.array(rand_point) - np.array(nearest)
        direction = direction / np.linalg.norm(direction) * step_size
        new_point = tuple(np.array(nearest) + direction)
        
        if not collision_check(nearest, new_point, obstacles):
            tree[new_point] = nearest
            if np.linalg.norm(np.array(new_point) - np.array(goal)) < step_size:
                return reconstruct_path(tree, start, goal)
    
    return None

def astar(start, goal, grid):
    open_set = {start}
    came_from = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}
    
    while open_set:
        current = min(open_set, key=lambda x: f_score.get(x, float('inf')))
        if current == goal:
            return reconstruct_path(came_from, current)
        
        open_set.remove(current)
        for neighbor in get_neighbors(current, grid):
            tentative_g = g_score[current] + 1
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, goal)
                if neighbor not in open_set:
                    open_set.add(neighbor)
    return None
```

### Robot Dynamics

```python
def compute_inertia_tensor(m, dims, com):
    I = np.zeros((3, 3))
    I[0, 0] = m/12 * (dims[1]**2 + dims[2]**2)
    I[1, 1] = m/12 * (dims[0]**2 + dims[2]**2)
    I[2, 2] = m/12 * (dims[0]**2 + dims[1]**2)
    return I

def newton_euler_iteration(i, omega, alpha, a, v, joint_type, params):
    if joint_type == 'revolute':
        Fi = params['I'] @ alpha + np.cross(omega, params['I'] @ omega)
        Ni = params['I'] @ alpha + np.cross(omega, params['I'] @ omega)
    else:
        Fi = params['m'] * (a + np.cross(alpha, params['r']) + 
                           np.cross(omega, np.cross(omega, params['r'])))
        Ni = params['I'] @ alpha + np.cross(omega, params['I'] @ omega)
    return Fi, Ni

def gravitational_torque(g, M, J):
    return -J.T @ M @ g

def compute_dynamic_model(M, C, G, q, dq):
    Mq = M(q) @ ddot_q + C(q, dq) + G(q)
    return Mq
```

### Kalman Filter for Localization

```python
def kalman_filter(x, P, z, H, R, F, Q):
    x_pred = F @ x
    P_pred = F @ P @ F.T + Q
    
    K = P_pred @ H.T @ np.linalg.inv(H @ P_pred @ H.T + R)
    x_update = x_pred + K @ (z - H @ x_pred)
    P_update = (np.eye(len(x)) - K @ H) @ P_pred
    
    return x_update, P_update

def extended_kalman_filter(x, P, z, h, H_func, F_func, Q, R):
    x_pred = F_func(x)
    P_pred = F_func(x) @ P @ F_func(x).T + Q
    
    H = H_func(x_pred)
    K = P_pred @ H.T @ np.linalg.inv(H @ P_pred @ H.T + R)
    
    z_pred = h(x_pred)
    x_update = x_pred + K @ (z - z_pred)
    P_update = (np.eye(len(x)) - K @ H) @ P_pred
    
    return x_update, P_update

def particle_filter(particles, weights, z, motion_model, measurement_model):
    particles = [motion_model(p) for p in particles]
    weights = [w * measurement_model(z, p) for w, p in zip(weights, particles)]
    weights /= sum(weights)
    
    indices = np.random.choice(len(particles), len(particles), p=weights)
    particles = [particles[i] for i in indices]
    
    return particles, weights
```

## Best Practices

1. **Coordinate Frames**: Define and track all frames consistently
2. **Singularities**: Handle kinematic singularities carefully
3. **Numerical Stability**: Use stable algorithms for inverse kinematics
4. **Safety**: Implement safety checks for all motions
5. **Calibration**: Account for calibration errors

## Common Patterns

```python
# PID controller
class PIDController:
    def __init__(self, kp, ki, kd):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.integral = 0
        self.prev_error = 0
    
    def compute(self, error, dt):
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt if dt > 0 else 0
        self.prev_error = error
        return self.kp * error + self.ki * self.integral + self.kd * derivative
```

## Core Competencies

1. Kinematics (forward/inverse)
2. Motion planning algorithms
3. Robot dynamics and control
4. Localization and SLAM
5. Sensor integration
