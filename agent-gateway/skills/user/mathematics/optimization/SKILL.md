---
name: optimization
description: Mathematical optimization including linear programming, convex optimization, gradient descent, and constrained optimization for machine learning and engineering.
category: mathematics
tags:
  - mathematics
  - optimization
  - linear-programming
  - convex-optimization
  - gradient-descent
  - constrained-optimization
  - machine-learning
difficulty: intermediate
author: neuralblitz
---

# Mathematical Optimization

## What I do

I provide comprehensive expertise in mathematical optimization, the field concerned with finding the best solution from feasible alternatives. I enable you to formulate and solve optimization problems including linear programming, convex optimization, unconstrained and constrained minimization, and integer programming. My knowledge spans from classical optimization techniques to modern machine learning optimization methods essential for operations research, engineering design, machine learning model training, and resource allocation problems.

## When to use me

Use optimization when you need to: train machine learning models by minimizing loss functions, allocate resources efficiently in business operations, design systems subject to constraints (weight, cost, performance), find optimal parameters through grid or random search, solve linear programming problems for logistics, perform hyperparameter tuning for ML models, minimize energy or cost functions in physics simulations, or optimize portfolios in financial applications.

## Core Concepts

- **Objective Functions**: Functions to be minimized or maximized representing the goal of the optimization problem.
- **Feasibility and Constraints**: Conditions that feasible solutions must satisfy including equality, inequality, and bound constraints.
- **Convexity**: A property ensuring any local minimum is a global minimum, simplifying optimization significantly.
- **Gradient-Based Methods**: Optimization algorithms using gradient information to guide search directions toward minima.
- **Linear Programming**: Optimization of linear objective functions subject to linear equality and inequality constraints.
- **KKT Conditions**: Necessary and sufficient conditions for optimality in constrained optimization problems.
- **Dual Problems**: Reformulated optimization problems providing bounds and insights into primal solutions.
- **Convergence Analysis**: Understanding how quickly optimization algorithms approach optimal solutions.
- **Stochastic Optimization**: Methods using random sampling to handle noisy objectives and escape local minima.

## Code Examples

### Gradient-Based Optimization

```python
import numpy as np

def gradient_descent(f, gradient, x0, learning_rate=0.01, max_iter=1000, tol=1e-8):
    """Standard gradient descent with momentum."""
    x = np.array(x0, dtype=float)
    velocity = np.zeros_like(x)
    momentum = 0.9
    
    for i in range(max_iter):
        grad = gradient(x)
        velocity = momentum * velocity - learning_rate * grad
        x = x + velocity
        
        if np.linalg.norm(grad) < tol:
            print(f"Converged at iteration {i}")
            break
    
    return x

def adam(f, gradient, x0, lr=0.001, beta1=0.9, beta2=0.999, 
         epsilon=1e-8, max_iter=1000, tol=1e-8):
    """Adam optimizer combining momentum and RMSprop."""
    x = np.array(x0, dtype=float)
    m = np.zeros_like(x)  # First moment
    v = np.zeros_like(x)  # Second moment
    
    for i in range(max_iter):
        grad = gradient(x)
        
        m = beta1 * m + (1 - beta1) * grad
        v = beta2 * v + (1 - beta2) * (grad ** 2)
        
        m_hat = m / (1 - beta1 ** (i + 1))
        v_hat = v / (1 - beta2 ** (i + 1))
        
        x = x - lr * m_hat / (np.sqrt(v_hat) + epsilon)
        
        if np.linalg.norm(grad) < tol:
            print(f"Converged at iteration {i}")
            break
    
    return x

# Optimize Rosenbrock function
def rosenbrock(x):
    return (1 - x[0])**2 + 100 * (x[1] - x[0]**2)**2

def rosenbrock_grad(x):
    return np.array([
        -2 * (1 - x[0]) - 400 * x[0] * (x[1] - x[0]**2),
        200 * (x[1] - x[0]**2)
    ])

x0 = [-1.5, 0.5]
x_opt = gradient_descent(rosenbrock, rosenbrock_grad, x0, learning_rate=0.001)
print(f"Gradient descent result: {x_opt}")
print(f"Function value: {rosenbrock(x_opt):.6f}")
print(f"Rosenbrock minimum: (1, 1)")

# Adam optimizer
x_adam = adam(rosenbrock, rosenbrock_grad, x0, lr=0.01)
print(f"Adam result: {x_adam}")
print(f"Function value: {rosenbrock(x_adam):.6f}")
```

### Linear Programming with Scipy

```python
import numpy as np
from scipy.optimize import linprog, milp, Bounds

# Linear programming: minimize c^T x subject to A_ub x <= b_ub, A_eq x = b_eq

# Example: Maximize profit in production planning
# Variables: x1 = units of product A, x2 = units of product B
# Maximize: 3*x1 + 5*x2
# Subject to:
#   x1 + 2*x2 <= 8 (labor hours)
#   4*x1 + 3*x2 <= 24 (materials)
#   x1 >= 0, x2 >= 0

c = [-3, -5]  # Minimize negative for maximization
A_ub = [[1, 2], [4, 3]]
b_ub = [8, 24]
bounds = [(0, None), (0, None)]

result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')

print("Linear Programming Result:")
print(f"  Optimal x: {result.x}")
print(f"  Optimal value (profit): {-result.fun:.2f}")

# Sensitivity analysis (shadow prices)
print(f"\nShadow prices (reduced costs):")
print(f"  Labor: {result.slack[0]:.2f}")
print(f"  Materials: {result.slack[1]:.2f}")

# Transportation problem
# Minimize shipping costs between warehouses and stores
cost_matrix = np.array([[4, 5, 3], [2, 8, 6]])
supply = [50, 30]  # Warehouse supplies
demand = [40, 25, 15]  # Store demands

# Flatten for linprog
c_transport = cost_matrix.flatten()
A_eq = [[1, 1, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0], [1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1]]
b_eq = supply + demand

result_transport = linprog(c_transport, A_eq=A_eq, b_eq=b_eq, bounds=[(0, None)]*6, method='highs')
print(f"\nTransportation problem:")
print(f"  Optimal cost: {result_transport.fun:.2f}")
print(f"  Shipments: {result_transport.x}")
```

### Convex Optimization

```python
import numpy as np
from scipy.optimize import minimize

def convex_quadratic(x, Q, c):
    """Convex quadratic function: f(x) = 0.5*x^T Q x + c^T x."""
    return 0.5 * x @ Q @ x + c @ x

def convex_grad(x, Q, c):
    """Gradient of convex quadratic."""
    return Q @ x + c

# Define convex quadratic: f(x) = x^2 + 2y^2 + 3z^2 + 2xy + 3yz + 4zx
Q = np.array([
    [2, 2, 4],
    [2, 4, 3],
    [4, 3, 6]
])
c = np.array([0, 0, 0])

# Check convexity (Q should be positive semi-definite)
eigenvalues = np.linalg.eigvalsh(Q)
print(f"Q eigenvalues: {eigenvalues}")
print(f"Is convex: {all(e >= -1e-10 for e in eigenvalues)}")

# Find minimum using Newton's method
from scipy.optimize import minimize

result = minimize(
    convex_quadratic,
    np.array([1.0, 1.0, 1.0]),
    args=(Q, c),
    method='Newton-CG',
    jac=convex_grad,
    hess=lambda x: Q
)

print(f"\nConvex optimization result:")
print(f"  Optimal x: {result.x}")
print(f"  Function value: {result.fun:.6f}")

# Trust-region method for constrained convex problems
def trust_region_example():
    """Minimize subject to trust region constraint ||x|| <= 1."""
    from scipy.optimize import NonlinearConstraint
    
    def objective(x):
        return x[0]**2 + x[1]**2 + x[2]**2
    
    def gradient(x):
        return 2 * x
    
    constraint = NonlinearConstraint(
        lambda x: np.linalg.norm(x),
        0, 1
    )
    
    result = minimize(objective, np.array([0.5, 0.5, 0.5]), 
                     method='trust-constr', jac=gradient, 
                     constraints=[constraint])
    return result

result_tr = trust_region_example()
print(f"\nTrust-region result: {result_tr.x}")
```

### Constrained Optimization

```python
import numpy as np
from scipy.optimize import minimize, LinearConstraint, NonlinearConstraint

# Constrained optimization using SLSQP
def constrained_optimization():
    """Minimize f(x,y) = (x-1)^2 + (y-2)^2 subject to:
    x + y >= 3 (inequality constraint)
    x^2 + y^2 <= 25 (inequality constraint)
    x >= 0, y >= 0 (bounds)
    """
    def objective(x):
        return (x[0] - 1)**2 + (x[1] - 2)**2
    
    def gradient(x):
        return np.array([2 * (x[0] - 1), 2 * (x[1] - 2)])
    
    # Constraints
    constraints = [
        {'type': 'ineq', 'fun': lambda x: x[0] + x[1] - 3},  # x + y >= 3
        {'type': 'ineq', 'fun': lambda x: 25 - x[0]**2 - x[1]**2}  # x^2 + y^2 <= 25
    ]
    
    bounds = [(0, None), (0, None)]
    
    result = minimize(objective, np.array([2.0, 2.0]), 
                     method='SLSQP', jac=gradient,
                     bounds=bounds, constraints=constraints)
    
    return result

result_constrained = constrained_optimization()
print(f"Constrained optimization result:")
print(f"  Optimal x: {result_constrained.x}")
print(f"  Optimal y: {result_constrained.x[1]}")
print(f"  Constraints satisfied:")
print(f"    x + y >= 3: {result_constrained.x[0] + result_constrained.x[1] - 3:.4f} >= 0")
print(f"    x^2 + y^2 <= 25: {result_constrained.x[0]**2 + result_constrained.x[1]**2:.4f} <= 25")

# Penalty method for constraints
def penalty_method(f, gradient, x0, penalty, max_iter=100, tol=1e-8):
    """Convert constrained to unconstrained using penalty terms."""
    x = np.array(x0, dtype=float)
    
    for i in range(max_iter):
        # Augmented objective with penalty
        def aug_obj(x_aug):
            return f(x_aug) + penalty * constraint_violation(x_aug)**2
        
        def aug_grad(x_aug):
            return gradient(x_aug) + 2 * penalty * constraint_violation(x_aug) * constraint_grad(x_aug)
        
        x = gradient_descent(aug_obj, aug_grad, x, learning_rate=0.01)
        
        if constraint_violation(x) < tol:
            break
    
    return x

# Sequential Quadratic Programming (SQP)
def sqp_example():
    """SQP for nonlinear constrained optimization."""
    def objective(x):
        return (x[0] - 2)**2 + (x[1] - 1)**2
    
    def gradient(x):
        return np.array([2 * (x[0] - 2), 2 * (x[1] - 1)])
    
    constraints = [
        {'type': 'eq', 'fun': lambda x: x[0] + x[1] - 3},  # x + y = 3
        {'type': 'ineq', 'fun': lambda x: x[0] - 1}  # x >= 1
    ]
    
    result = minimize(objective, np.array([1.5, 1.5]), 
                     method='SLSQP', jac=gradient,
                     constraints=constraints,
                     options={'ftol': 1e-10, 'maxiter': 1000})
    return result

result_sqp = sqp_example()
print(f"\nSQP result: {result_sqp.x}")
```

### Hyperparameter Optimization

```python
import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification

# Grid Search
def grid_search(param_grid, X, y, cv=5):
    """Exhaustive grid search for hyperparameters."""
    best_score = -np.inf
    best_params = {}
    
    for params in param_grid:
        model = RandomForestClassifier(**params, random_state=42)
        scores = cross_val_score(model, X, y, cv=cv)
        mean_score = scores.mean()
        
        if mean_score > best_score:
            best_score = mean_score
            best_params = params
    
    return best_params, best_score

# Random Search
def random_search(param_distributions, X, y, n_iter=50, cv=5):
    """Random search over hyperparameter distributions."""
    best_score = -np.inf
    best_params = {}
    
    for _ in range(n_iter):
        params = {k: np.random.choice(v) for k, v in param_distributions.items()}
        model = RandomForestClassifier(**params, random_state=42)
        scores = cross_val_score(model, X, y, cv=cv)
        mean_score = scores.mean()
        
        if mean_score > best_score:
            best_score = mean_score
            best_params = params
    
    return best_params, best_score

# Example parameter grids
param_grid = [
    {'n_estimators': 100, 'max_depth': 5, 'min_samples_split': 2},
    {'n_estimators': 100, 'max_depth': 10, 'min_samples_split': 2},
    {'n_estimators': 200, 'max_depth': 15, 'min_samples_split': 5},
]

param_distributions = {
    'n_estimators': [50, 100, 200, 300],
    'max_depth': [3, 5, 7, 10, 15, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)

# Run searches
best_grid, score_grid = grid_search(param_grid, X, y)
print(f"Grid search best params: {best_grid}")
print(f"Grid search best score: {score_grid:.4f}")

best_random, score_random = random_search(param_distributions, X, y, n_iter=20)
print(f"\nRandom search best params: {best_random}")
print(f"Random search best score: {score_random:.4f}")

# Bayesian Optimization (conceptual example)
class BayesianOptimizer:
    """Simplified Bayesian optimization for hyperparameter tuning."""
    def __init__(self, param_space, acquisition='EI'):
        self.param_space = param_space
        self.acquisition = acquisition
        self.X_observed = []
        self.y_observed = []
    
    def surrogate_model(self, X, y):
        """Fit Gaussian process surrogate model."""
        # Placeholder for actual GP implementation
        pass
    
    def expected_improvement(self, X_candidate):
        """Compute expected improvement acquisition function."""
        # Placeholder for EI computation
        pass
    
    def optimize(self, objective_func, n_iter=20):
        """Run Bayesian optimization."""
        for _ in range(n_iter):
            # Find next point to evaluate
            X_next = self._choose_next_point()
            y_next = objective_func(X_next)
            
            self.X_observed.append(X_next)
            self.y_observed.append(y_next)
        
        return min(self.y_observed), self.X_observed[np.argmin(self.y_observed)]

print("\nBayesian optimization framework ready for implementation")
```

## Best Practices

- Start with simpler optimization methods before moving to sophisticated algorithms; gradient descent often suffices for convex problems.
- Scale features to similar ranges when using gradient-based methods to ensure faster convergence.
- Use appropriate learning rate schedules (decay, warm-up) to balance exploration and exploitation.
- For non-convex problems, try multiple random initializations to escape poor local minima.
- When formulating linear programs, verify that the problem is feasible and bounded before solving.
- Use warm-start capabilities in iterative solvers when solving sequences of related problems.
- For constrained optimization, prefer specialized methods (SQP, interior-point) over penalty methods for better accuracy.
- Monitor optimization progress using multiple metrics (objective value, gradient norm, constraint violation).
- Consider computational complexity; some theoretically optimal methods may be impractical for large-scale problems.
- Validate optimization results by checking KKT conditions and testing against analytical solutions when available.

