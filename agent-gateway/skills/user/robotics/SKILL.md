---
name: robotics
description: Robotics design and programming
license: MIT
compatibility: opencode
metadata:
  audience: engineers, programmers, students
  category: engineering
---

## What I do

- Design robot kinematics and dynamics
- Develop motion planning algorithms
- Program robot controllers
- Implement perception and localization
- Create robot simulation environments

## When to use me

- When designing robotic systems
- When programming robot movements
- When implementing perception algorithms
- When working with robot kinematics
- When simulating robot behavior

## Key Concepts

### Forward Kinematics

```python
import numpy as np

class RobotArm:
    def __init__(self, dh_params):
        """DH parameters: [theta, d, a, alpha]"""
        self.dh = dh_params
        self.joints = len(dh_params)
    
    def forward_kinematics(self, joint_angles):
        """Calculate end-effector pose from joint angles"""
        T = np.eye(4)
        
        for i, (theta, d, a, alpha) in enumerate(self.dh):
            # Update theta with joint angle
            theta += joint_angles[i]
            
            # DH transformation matrix
            ct = np.cos(theta)
            st = np.sin(theta)
            ca = np.cos(alpha)
            sa = np.sin(alpha)
            
            T_i = np.array([
                [ct, -st*ca, st*sa, a*ct],
                [st, ct*ca, -ct*sa, a*st],
                [0, sa, ca, d],
                [0, 0, 0, 1]
            ])
            
            T = T @ T_i
        
        return T
    
    def jacobian(self, joint_angles):
        """Compute Jacobian matrix"""
        # Geometric Jacobian method
        pass
```

### Inverse Kinematics

```python
class InverseKinematics:
    @staticmethod
    def analytical_ik_2link(target, L1, L2):
        """2-link planar arm analytical solution"""
        x, y = target
        
        # Cosine rule
        cos_theta2 = (x**2 + y**2 - L1**2 - L2**2) / (2 * L1 * L2)
        cos_theta2 = np.clip(cos_theta2, -1, 1)
        
        theta2 = np.arccos(cos_theta2)
        theta1 = np.arctan2(y, x) - np.arctan2(
            L2 * np.sin(theta2), 
            L1 + L2 * np.cos(theta2)
        )
        
        return [theta1, theta2]
    
    @staticmethod
    def numerical_ik(forward_fn, target_pose, initial_joints, max_iter=100):
        """Numerical IK using Jacobian pseudo-inverse"""
        joints = np.array(initial_joints)
        
        for _ in range(max_iter):
            current_pose = forward_fn(joints)
            error = target_pose - current_pose
            
            if np.linalg.norm(error) < 1e-6:
                break
            
            J = self.jacobian(joints)
            delta_joints = J.T @ np.linalg.pinv(J @ J.T + 0.01) @ error
            joints += delta_joints
        
        return joints
```

### Motion Planning

```python
class MotionPlanner:
    @staticmethod
    def rrt(start, goal, obstacles, max_iter=1000):
        """Rapidly-exploring Random Tree"""
        tree = [start]
        
        for _ in range(max_iter):
            # Random sample
            if np.random.rand() < 0.1:
                sample = goal
            else:
                sample = random_configuration()
            
            # Find nearest
            nearest = tree[np.argmin([dist(n, sample) for n in tree])]
            
            # Steer towards sample
            new = steer(nearest, sample)
            
            if not collision(new, obstacles):
                tree.append(new)
                
                if dist(new, goal) < threshold:
                    return reconstruct_path(tree, start, goal)
        
        return None
    
    @staticmethod
    def trajectory_smooth(waypoints, resolution=0.01):
        """Smooth trajectory using splines"""
        from scipy.interpolate import splprep, splev
        
        tck, u = splprep(waypoints, s=0)
        smoothed = splev(np.linspace(0, 1, 100), tck)
        return smoothed
```

### Robot Controllers

```python
# PID joint controller
class JointController:
    def __init__(self, kp, ki, kd):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.integral = 0
        self.prev_error = 0
    
    def compute(self, setpoint, measurement, dt):
        error = setpoint - measurement
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        
        output = self.kp * error + self.ki * self.integral + self.kd * derivative
        self.prev_error = error
        
        return output

# Impedance control
class ImpedanceController:
    def __init__(self, M, B, K):
        self.M = M  # Mass matrix
        self.B = B  # Damping
        self.K = K  # Stiffness
    
    def compute_force(self, desired_pos, actual_pos, velocity):
        # F = M*acc_d + B*(v_d - v) + K*(x_d - x)
        error = desired_pos - actual_pos
        force = -self.B @ velocity - self.K @ error
        return force
```

### Perception

```python
# Object detection basics
class PerceptionSystem:
    def __init__(self):
        self.camera = None
        self.lidar = None
        self.depth_sensor = None
    
    def point_cloud_to_image(self, points, camera_matrix):
        """Project 3D points to 2D image"""
        # Apply camera extrinsics and intrinsics
        pass
    
    def detect_objects(self, point_cloud):
        """Detect objects in point cloud"""
        # Use clustering (DBSCAN, Euclidean)
        # Classify clusters
        pass
    
    def estimate_pose(self, object_points, image_points, camera_matrix):
        """PnP pose estimation"""
        # Perspective-n-Points algorithm
        pass
```

### ROS Basics

```python
# ROS 2 Python node
class ROS2Node:
    def __init__(self, node_name):
        self.node_name = node_name
        self.pubs = {}
        self.subs = {}
    
    def create_publisher(self, topic, msg_type):
        """Create publisher"""
        pass
    
    def create_subscription(self, topic, msg_type, callback):
        """Create subscriber"""
        pass
    
    def spin(self):
        """Process callbacks"""
        pass
```

### Robot Types

| Type | Characteristics | Applications |
|------|-----------------|--------------|
| Articulated | Multiple rotating joints | Manufacturing, welding |
| SCARA | Horizontal articulated | Pick and place |
| Delta | Parallel mechanism | High speed assembly |
| Cartesian | Linear axes | CNC, 3D printing |
| Mobile | Moving base | Delivery, exploration |
| Humanoid | Bipedal | Research, assistance |
