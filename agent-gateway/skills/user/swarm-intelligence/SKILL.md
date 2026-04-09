---
name: swarm-intelligence
description: Swarm intelligence algorithms
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Implement swarm optimization
- Design particle swarm systems
- Build ant colony algorithms
- Create collective intelligence
- Optimize using swarm behavior

## When to use me

Use me when:
- Distributed optimization
- Routing problems
- Collective robotics
- Emergent behavior systems

## Key Concepts

### Particle Swarm Optimization (PSO)
```python
import numpy as np

class ParticleSwarm:
    def __init__(self, n_particles, n_dims, func):
        self.n_particles = n_particles
        self.func = func
        
        # Initialize particles
        self.positions = np.random.uniform(-10, 10, (n_particles, n_dims))
        self.velocities = np.random.uniform(-1, 1, (n_particles, n_dims))
        
        # Personal best
        self.personal_best_pos = self.positions.copy()
        self.personal_best_val = np.array([self.func(p) for p in self.positions])
        
        # Global best
        best_idx = np.argmin(self.personal_best_val)
        self.global_best_pos = self.personal_best_pos[best_idx].copy()
        self.global_best_val = self.personal_best_val[best_idx]
    
    def update(self, w=0.7, c1=1.5, c2=1.5):
        r1, r2 = np.random.random((2, self.n_particles, 1))
        
        # Update velocities
        cognitive = c1 * r1 * (self.personal_best_pos - self.positions)
        social = c2 * r2 * (self.global_best_pos - self.positions)
        self.velocities = w * self.velocities + cognitive + social
        
        # Update positions
        self.positions += self.velocities
        
        # Evaluate and update personal bests
        current_vals = np.array([self.func(p) for p in self.positions])
        improved = current_vals < self.personal_best_val
        self.personal_best_pos[improved] = self.positions[improved]
        self.personal_best_val[improved] = current_vals[improved]
        
        # Update global best
        best_idx = np.argmin(self.personal_best_val)
        if self.personal_best_val[best_idx] < self.global_best_val:
            self.global_best_pos = self.personal_best_pos[best_idx].copy()
            self.global_best_val = self.personal_best_val[best_idx]
    
    def optimize(self, n_iterations):
        for _ in range(n_iterations):
            self.update()
        return self.global_best_pos, self.global_best_val
```

### Ant Colony Optimization
- Pheromone-based path finding
- Probabilistic solution construction
- Global and local pheromone updates
- Used for: TSP, VRP, routing

### Swarm Applications
- **ACO**: Routing, scheduling
- **PSO**: Function optimization
- **Artificial Bee Colony**: Optimization
- **Firefly Algorithm**: Clustering
