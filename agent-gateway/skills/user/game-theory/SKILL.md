---
name: Game Theory
description: Game theory fundamentals including Nash equilibria, strategic games, cooperative games, mechanism design, and multi-agent decision making.
license: MIT
compatibility: python>=3.8
audience: economists, ai-researchers, strategists, data-scientists
category: mathematics
---

# Game Theory

## What I Do

I provide comprehensive game theory tools including Nash equilibrium computation, strategic analysis, cooperative game theory, mechanism design, and multi-agent optimization for competitive and collaborative scenarios.

## When to Use Me

- Multi-agent system design
- Auction and market mechanism design
- Resource allocation strategies
- Economic modeling
- AI competitive scenarios
- Negotiation and bargaining

## Core Concepts

- **Strategic Games**: Normal form, extensive form
- **Nash Equilibrium**: Best response, pure/mixed strategies
- **Dominant Strategies**: Strict and weak dominance
- **Cooperative Games**: Coalitions, Shapley value
- **Mechanism Design**: Incentive compatibility, revelation principle
- **Repeated Games**: Folk theorem, trigger strategies
- **Zero-Sum Games**: Minimax theorem, value of game
- **Evolutionary Games**: Replicator dynamics, ESS

## Code Examples

### Normal Form Game

```python
import numpy as np
from itertools import product

class NormalFormGame:
    def __init__(self, payoffs_player1, payoffs_player2):
        self.payoffs_p1 = np.array(payoffs_player1)
        self.payoffs_p2 = np.array(payoffs_player2)
        self.n_strategies_1 = payoffs_player1.shape[0]
        self.n_strategies_2 = payoffs_player1.shape[1]
    
    def best_response(self, player, beliefs):
        if player == 1:
            expected = self.payoffs_p1 @ beliefs
        else:
            expected = self.payoffs_p2.T @ beliefs
        return np.argmax(expected)

prisoners_dilemma = NormalFormGame(
    [[-1, -3], [0, -2]], [[-1, 0], [-3, -2]]
)
print("Prisoner's Dilemma payoff matrix (P1):")
print(prisoners_dilemma.payoffs_p1)
```

### Nash Equilibrium (Mixed Strategy)

```python
def nash_equilibrium_2x2(payoffs1, payoffs2):
    p1, p2 = payoffs1.shape
    
    best_responses_p1 = []
    for s2 in range(p2):
        br = np.argmax(payoffs1[:, s2])
        best_responses_p1.append([1 if i == br else 0 for i in range(p1)])
    
    best_responses_p2 = []
    for s1 in range(p1):
        br = np.argmax(payoffs2[s1, :])
        best_responses_p2.append([1 if j == br else 0 for j in range(p2)])
    
    return best_responses_p1, best_responses_p2

payoffs1 = np.array([[3, 0], [5, 1]])
payoffs2 = np.array([[3, 5], [0, 1]])
br1, br2 = nash_equilibrium_2x2(payoffs1, payoffs2)
print(f"Player 1 best responses: {br1}")
print(f"Player 2 best responses: {br2}")
```

### Zero-Sum Game (Minimax)

```python
def solve_zero_sum_game(payoff_matrix):
    from scipy.optimize import linprog
    
    n_rows, n_cols = payoff_matrix.shape
    
    c = np.zeros(n_cols + 1)
    c[-1] = -1
    
    A_ub = np.hstack([payoff_matrix.T, -np.ones((n_cols, 1))])
    b_ub = np.ones(n_cols)
    
    bounds = [(0, None)] * (n_cols + 1)
    
    result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')
    
    v = 1 / result.x[-1]
    strategy = result.x[:-1] * v
    return strategy, v

payoff = np.array([[1, -1], [-1, 1]])
strategy, value = solve_zero_sum_game(payoff)
print(f"Optimal strategy: {strategy}")
print(f"Value of game: {value:.4f}")
```

### Shapley Value

```python
from itertools import combinations

def shapley_value(n_players, value_function):
    shapley = np.zeros(n_players)
    for i in range(n_players):
        for subset_size in range(n_players):
            for subset in combinations([j for j in range(n_players) if j != i], subset_size):
                S = set(subset)
                n_S = len(S)
                weight = 1 / (n_players * choose(n_players - 1, n_S))
                v_S = value_function(S)
                v_S_i = value_function(S | {i})
                shapley[i] += weight * (v_S_i - v_S)
    return shapley

def choose(n, k):
    from math import comb
    return comb(n, k)

def coalition_value(coalition):
    if len(coalition) >= 2:
        return 10
    return 0

shapley = shapley_value(4, coalition_value)
print(f"Shapley values: {shapley}")
```

### Replicator Dynamics

```python
def replicator_dynamics(payoff_matrix, initial_population, steps=1000, dt=0.01):
    n_strategies = len(initial_population)
    x = np.array(initial_population, dtype=float)
    x = x / x.sum()
    
    for _ in range(steps):
        fitness = payoff_matrix @ x
        avg_fitness = x @ fitness
        dx = x * (fitness - avg_fitness)
        x = x + dt * dx
        x = np.maximum(x, 0)
        x = x / x.sum()
    return x

payoff = np.array([[0, -1, -1], [1, 0, -1], [1, 1, 0]])
initial = [1, 1, 1]
equilibrium = replicator_dynamics(payoff, initial)
print(f"Evolutionary stable strategy: {equilibrium}")
```

## Best Practices

1. **Equilibrium Selection**: Multiple equilibria require additional criteria
2. **Mixed Strategies**: Use linear programming for equilibrium finding
3. **Convergence**: Replicator dynamics may oscillate
4. **Large Games**: Approximate equilibria for complex games
5. **Information**: Complete vs incomplete information games

## Common Patterns

```python
# Fictitious Play
def fictitious_play(payoffs1, payoffs2, n_iterations=1000):
    n1, n2 = payoffs1.shape
    history1 = np.zeros(n1)
    history2 = np.zeros(n2)
    
    for _ in range(n_iterations):
        strategy1 = history1 / (history1.sum() + 1)
        strategy2 = history2 / (history2.sum() + 1)
        
        br1 = np.argmax(payoffs1 @ strategy2)
        br2 = np.argmax(payoffs2.T @ strategy1)
        
        history1[br1] += 1
        history2[br2] += 1
    
    return history1 / history1.sum(), history2 / history2.sum()
```

## Core Competencies

1. Nash equilibrium computation
2. Zero-sum game solving
3. Cooperative game analysis
4. Evolutionary game dynamics
5. Mechanism design principles
