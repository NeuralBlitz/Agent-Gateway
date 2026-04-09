---
name: robotics
description: Robotics fundamentals including kinematics, dynamics, motion planning, perception, control, and human-robot interaction
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Model robot kinematics and dynamics
- Design motion planning algorithms
- Implement perception and computer vision systems
- Develop robot control systems
- Design end-effectors and grippers
- Integrate sensors and actuators
- Plan human-robot interaction interfaces
- Simulate and test robotic systems

## When to use me
When designing robotic systems, implementing kinematics, developing motion planning algorithms, or integrating perception systems for automation.

## Core Concepts
- Forward and inverse kinematics
- Robot dynamics (Lagrangian, Newton-Euler)
- Trajectory planning and path optimization
- Sensor integration (LiDAR, cameras, IMUs)
- Computer vision for robotics
- Motion control (PID, MPC, adaptive control)
- Force/torque control and impedance control
- Grip design and grasping
- ROS/ROS2 development
- Swarm robotics and multi-agent systems

## Code Examples

### Forward Kinematics
```python
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple
import math

@dataclass
class DHParameter:
    a: float  # link length
    alpha: float  # link twist
    d: float  # link offset
    theta: float  # joint angle

def transformation_matrix(
    a: float,
    alpha: float,
    d: float,
    theta: float
) -> np.ndarray:
    """Create DH transformation matrix."""
    c = math.cos(theta)
    s = math.sin(theta)
    ca = math.cos(alpha)
    sa = math.sin(alpha)
    
    return np.array([
        [c, -s * ca,  s * sa, a * c],
        [s,  c * ca, -c * sa, a * s],
        [0,  sa,      ca,     d],
        [0,  0,       0,      1]
    ])

def forward_kinematics(
    dh_params: List[DHParameter]
) -> np.ndarray:
    """Calculate forward kinematics for robot arm."""
    T = np.eye(4)
    for params in dh_params:
        T = T @ transformation_matrix(
            params.a, params.alpha, params.d, params.theta
        )
    return T

# Example: 3-DOF planar arm
dh_3dof = [
    DHParameter(a=0.5, alpha=0, d=0, theta=0.3),
    DHParameter(a=0.4, alpha=0, d=0, theta=0.5),
    DHParameter(a=0.3, alpha=0, d=0, theta=-0.2)
]
T_ee = forward_kinematics(dh_3dof)
print(f"End effector position: [{T_ee[0,3]:.3f}, {T_ee[1,3]:.3f}, {T_ee[2,3]:.3f}]")
```

### Inverse Kinematics
```python
def planar_ik(
    x: float,
    y: float,
    L1: float,
    L2: float
) -> Tuple[float, float, float, float]:
    """Analytical inverse kinematics for 2-link planar arm."""
    D = (x**2 + y**2 - L1**2 - L2**2) / (2 * L1 * L2)
    if abs(D) > 1:
        return None
    
    theta2 = math.atan2(math.sqrt(1 - D**2), D)
    theta1 = math.atan2(y, x) - math.atan2(
        L2 * math.sin(theta2), L1 + L2 * math.cos(theta2)
    )
    return theta1, theta2, -theta2, theta1

def jacobian_ik(
    target_pose: np.ndarray,
    current_joints: np.ndarray,
    T_base: np.ndarray,
    link_lengths: List[float],
    iterations: int = 100,
    alpha: float = 0.1
) -> np.ndarray:
    """Iterative inverse kinematics using Jacobian."""
    joints = current_joints.copy()
    for _ in range(iterations):
        T_current = forward_kinematics([
            DHParameter(a=link_lengths[i], alpha=0, d=0, theta=joints[i])
            for i in range(len(joints))
        ])
        
        error = np.zeros(6)
        error[0:3] = target_pose[0:3, 3] - T_current[0:3, 3]
        
        if np.linalg.norm(error) < 1e-4:
            break
        
        J = numerical_jacobian(joints, link_lengths)
        try:
            joints += alpha * np.linalg.lstsq(J, error, rcond=None)[0]
        except:
            break
    return joints

# Example: IK for point (1.0, 0.5)
solution = planar_ik(1.0, 0.5, 0.8, 0.6)
if solution:
    print(f"Theta1: {solution[0]:.3f} rad ({math.degrees(solution[0]):.1f}°)")
    print(f"Theta2: {solution[1]:.3f} rad ({math.degrees(solution[1]):.1f}°)")
```

### Trajectory Planning
```python
def cubic_polynomial(
    t: float,
    t0: float,
    tf: float,
    p0: float,
    pf: float,
    v0: float = 0,
    vf: float = 0
) -> Tuple[float, float]:
    """Generate cubic polynomial trajectory."""
    T = tf - t0
    a0 = p0
    a1 = v0
    a2 = 3 * (pf - p0) / T**2 - 2 * v0 / T - vf / T
    a3 = -2 * (pf - p0) / T**3 + (v0 + vf) / T**2
    
    if t < t0:
        tau = 0
    elif t > tf:
        tau = T
    else:
        tau = t - t0
    
    p = a0 + a1 * tau + a2 * tau**2 + a3 * tau**3
    v = a1 + 2 * a2 * tau + 3 * a3 * tau**2
    return p, v

def quintic_polynomial(
    t: float,
    t0: float, tf: float,
    p0: float, pf: float,
    v0: float = 0, vf: float = 0,
    a0: float = 0, af: float = 0
) -> Tuple[float, float, float]:
    """Generate quintic polynomial with acceleration control."""
    T = tf - t0
    a0 = p0
    a1 = v0
    a2 = a0 / 2
    a3 = (20 * (pf - p0) - (8 * vf + 12 * v0) - (3 * af - a0) * T) / (2 * T**3)
    a4 = (30 * (p0 - pf) + (14 * vf + 16 * v0) + (af - 2 * a0) * T) / (2 * T**4)
    a5 = (12 * (pf - p0) - 6 * (vf + v0) - (af - a0) * T) / (2 * T**5)
    
    if t < t0:
        return p0, v0, a0
    elif t > tf:
        return pf, vf, af
    
    tau = t - t0
    p = a0 + a1 * tau + a2 * tau**2 + a3 * tau**3 + a4 * tau**4 + a5 * tau**5
    v = a1 + 2 * a2 * tau + 3 * a3 * tau**2 + 4 * a4 * tau**3 + 5 * a5 * tau**4
    a = 2 * a2 + 6 * a3 * tau + 12 * a4 * tau**2 + 20 * a5 * tau**3
    return p, v, a

def rrt_star(
    start: Tuple[float, float],
    goal: Tuple[float, float],
    obstacles: List[Tuple[float, float, float]],
    bounds: Tuple[float, float],
    max_iter: int = 500,
    step_size: float = 0.5
) -> List[Tuple[float, float]]:
    """RRT* path planning algorithm."""
    from scipy.spatial.distance import cdist
    
    nodes = [start]
    parents = [None]
    costs = [0]
    
    for _ in range(max_iter):
        if np.random.random() < 0.1:
            rand = goal
        else:
            rand = (np.random.uniform(bounds[0], bounds[1]),
                   np.random.uniform(bounds[0], bounds[1]))
        
        nearest_idx = min(range(len(nodes)),
                         key=lambda i: np.linalg.norm(
                             np.array(nodes[i]) - np.array(rand)))
        
        direction = np.array(rand) - np.array(nodes[nearest_idx])
        dist = np.linalg.norm(direction)
        if dist > step_size:
            direction = direction / dist * step_size
        
        new_node = tuple(np.array(nodes[nearest_idx]) + direction)
        
        if not collision_check(new_node, obstacles):
            continue
        
        # Find near neighbors
        near_idx = [i for i in range(len(nodes))
                   if np.linalg.norm(np.array(nodes[i]) - np.array(new_node)) < step_size * 3]
        
        # Connect to best parent
        best_idx = nearest_idx
        best_cost = costs[nearest_idx] + step_size
        for idx in near_idx:
            cost = costs[idx] + np.linalg.norm(
                np.array(nodes[idx]) - np.array(new_node))
            if cost < best_cost:
                best_cost = cost
                best_idx = idx
        
        nodes.append(new_node)
        parents.append(best_idx)
        costs.append(best_cost)
        
        # Rewire
        for idx in near_idx:
            if idx == best_idx:
                continue
            new_cost = costs[best_idx] + np.linalg.norm(
                np.array(new_node) - np.array(nodes[idx]))
            if new_cost < costs[idx]:
                costs[idx] = new_cost
                parents[idx] = best_idx
    
    # Extract path
    path = [goal]
    current = goal
    while current != start:
        idx = nodes.index(current)
        current = nodes[parents[idx]]
        path.append(current)
    path.reverse()
    return path

# Example: Trajectory generation
trajectory = []
for t in np.linspace(0, 2, 100):
    p, v = cubic_polynomial(t, 0, 2, 0, 1)
    trajectory.append((p, v))
print(f"Trajectory points: {len(trajectory)}")
```

### Computer Vision for Robotics
```python
def camera_calibration(
    image_points: np.ndarray,
    object_points: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """Perform camera calibration using Zhang's method."""
    return cv.calibrateCamera(object_points, image_points, (640, 480))

def aruco_detection(
    image: np.ndarray,
    marker_dict: cv.aruco.Dictionary_get(cv.aruco.DICT_6X6_250)
) -> List[dict]:
    """Detect ArUco markers for robot localization."""
    corners, ids, rejected = cv.aruco.detectMarkers(
        image, marker_dict)
    return [{"id": i[0] if i is not None else None, 
             "corners": c} for i, c in zip(ids, corners)]

def depth_from_stereo(
    disparity: np.ndarray,
    focal_length: float,
    baseline: float
) -> np.ndarray:
    """Calculate depth from stereo disparity."""
    depth = focal_length * baseline / (disparity + 1e-6)
    depth[depth < 0] = 0
    return depth

def point_cloud_from_depth(
    depth: np.ndarray,
    fx: float,
    fy: float,
    cx: float,
    cy: float
) -> np.ndarray:
    """Generate point cloud from depth image."""
    x, y = np.meshgrid(np.arange(depth.shape[1]), np.arange(depth.shape[0]))
    X = (x - cx) * depth / fx
    Y = (y - cy) * depth / fy
    Z = depth
    return np.stack([X, Y, Z], axis=-1)
```

### Robot Control
```python
def jacobian_derivative(
    q: np.ndarray,
    dq: np.ndarray,
    link_lengths: List[float]
) -> np.ndarray:
    """Calculate time derivative of Jacobian."""
    n = len(q)
    J = np.zeros((6, n))
    for i in range(n):
        J[0, i] = -sum(link_lengths[k] * math.sin(sum(q[:k+1])) 
                       for k in range(i, n)) if i < n - 1 else 0
        J[1, i] = sum(link_lengths[k] * math.cos(sum(q[:k+1])) 
                       for k in range(i, n)) if i < n - 1 else link_lengths[-1]
    return J

def computed_torque_control(
    q_des: np.ndarray,
    dq_des: np.ndarray,
    ddq_des: np.ndarray,
    q: np.ndarray,
    dq: np.ndarray,
    M: np.ndarray,
    C: np.ndarray,
    G: np.ndarray,
    Kp: np.ndarray,
    Kd: np.ndarray
) -> np.ndarray:
    """Computed torque control with PD feedback."""
    e = q_des - q
    de = dq_des - dq
    tau_feedforward = M @ ddq_des + C @ dq_des + G
    tau_feedback = Kp @ e + Kd @ de
    return tau_feedforward + tau_feedback

def impedance_control(
    x: np.ndarray,
    dx: np.ndarray,
    xd: np.ndarray,
    dxd: np.ndarray,
    M_d: np.ndarray,
    B_d: np.ndarray,
    K_d: np.ndarray,
    F_ext: np.ndarray
) -> np.ndarray:
    """Impedance control for force regulation."""
    e = x - xd
    de = dx - dxd
    F_desired = M_d @ (-ddx_des if False else np.zeros(3)) + B_d @ de + K_d @ e
    return F_desired + F_ext

# Example: PD controller for joint control
Kp = 100 * np.eye(6)
Kd = 20 * np.eye(6)
q_des = np.array([0.5, 0.3, -0.2, 0, 0, 0])
dq_des = np.zeros(6)
ddq_des = np.zeros(6)
q_current = np.array([0.4, 0.25, -0.15, 0, 0, 0])
dq_current = np.array([0.1, 0.05, -0.03, 0, 0, 0])
```

## Best Practices
- Use simulation (Gazebo, Webots) before hardware deployment
- Implement safety stops and limit switches in hardware
- Consider workspace constraints and singularities in motion planning
- Use proper coordinate frames (world, base, tool, camera)
- Account for calibration errors and thermal drift
- Implement smooth trajectory generation with velocity/acceleration limits
- Use redundancy resolution for obstacle avoidance
- Consider sensor fusion for improved state estimation
- Implement graceful degradation for sensor failures
- Document robot configuration and calibration parameters
