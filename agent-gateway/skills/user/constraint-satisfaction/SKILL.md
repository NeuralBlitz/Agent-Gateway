---
name: constraint-satisfaction
description: Constraint satisfaction problems
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Formulate and solve constraint satisfaction problems
- Implement search algorithms
- Apply backtracking and propagation
- Design constraint solvers
- Optimize constraint solving
- Handle complex combinatorial problems

## When to use me

Use me when:
- Scheduling and planning problems
- Resource allocation
- Puzzle solving (Sudoku, crossword)
- Configuration problems
- Combinatorial optimization

## Key Concepts

### CSP Framework
```
Variables: {X1, X2, X3, ..., Xn}
Domains: {D1, D2, D3, ..., Dn}
Constraints: {C1, C2, C3, ..., Cm}

Goal: Find assignment to all variables satisfying all constraints
```

### Python CSP Example
```python
from constraint import Problem, BacktrackingSolver

# Define problem
problem = Problem(BacktrackingSolver())

# Variables with domains
problem.addVariable("A", [1, 2, 3, 4])
problem.addVariable("B", [1, 2, 3, 4])
problem.addVariable("C", [1, 2, 3, 4])

# Constraints
def all_different(vars):
    return len(set(vars)) == len(vars)

problem.addConstraint(all_different, ["A", "B", "C"])
problem.addConstraint(lambda a, b: a + b > 4, ["A", "B"])
problem.addConstraint(lambda b, c: b != c, ["B", "C"])

# Solve
solutions = problem.getSolutions()
print(solutions)
```

### Algorithms
- **Backtracking**: Systematic search
- **Forward Checking**: Prune domains early
- **Arc Consistency (AC-3)**: Remove inconsistent values
- **Min-Conflicts**: Local search for large problems
- **Genetic Algorithms**: For complex constraints

### Applications
- **Scheduling**: Employee rostering, class scheduling
- **Routing**: Vehicle routing with constraints
- **Puzzles**: Sudoku, N-Queens
- **Configuration**: Product configuration
- **Planning**: Task ordering with dependencies
