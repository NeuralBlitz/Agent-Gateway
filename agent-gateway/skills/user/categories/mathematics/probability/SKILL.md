---
name: Probability
description: Probability theory fundamentals including distributions, conditional probability, Bayes' theorem, random variables, and stochastic processes for modeling uncertainty.
license: MIT
compatibility: python>=3.8
audience: data-scientists, statisticians, engineers, researchers
category: mathematics
---

# Probability

## What I Do

I provide comprehensive probability theory tools including probability distributions, conditional probability, Bayes' theorem, random variables, expectation calculations, and stochastic process simulations for uncertainty quantification.

## When to Use Me

- Modeling uncertain phenomena
- Bayesian inference and updating beliefs
- Risk assessment and decision making
- Monte Carlo simulations
- Queueing theory applications
- Machine learning probabilistic models

## Core Concepts

- **Probability Axioms**: Kolmogorov's axioms, sample spaces
- **Random Variables**: Discrete and continuous distributions
- **Conditional Probability**: P(A|B) = P(A∩B)/P(B)
- **Bayes' Theorem**: P(H|E) = P(E|H) * P(H) / P(E)
- **Expectation & Variance**: E[X], Var(X), moment generating functions
- **Convergence**: Law of large numbers, Central Limit Theorem
- **Stochastic Processes**: Markov chains, Poisson processes
- **Information Theory**: Entropy, KL divergence

## Code Examples

### Basic Probability Calculations

```python
from scipy import stats
import numpy as np

P_A = 0.3
P_B = 0.4
P_A_and_B = 0.12

P_A_or_B = P_A + P_B - P_A_and_B
P_A_given_B = P_A_and_B / P_B

print(f"P(A or B): {P_A_or_B}")
print(f"P(A|B): {P_A_given_B}")
```

### Bayes' Theorem Application

```python
prior_disease = 0.01
sensitivity = 0.95
specificity = 0.90

likelihood_positive = sensitivity
likelihood_negative = 1 - specificity

evidence = likelihood_positive * prior_disease + (1 - specificity) * (1 - prior_disease)

posterior = (likelihood_positive * prior_disease) / evidence
print(f"P(Disease|Positive): {posterior:.4f}")
```

### Distribution Sampling

```python
np.random.seed(42)

normal_samples = np.random.normal(0, 1, 1000)
exponential_samples = np.random.exponential(1, 1000)
poisson_samples = np.random.poisson(5, 1000)
binomial_samples = np.random.binomial(20, 0.5, 1000)

print(f"Normal - Mean: {np.mean(normal_samples):.3f}, Std: {np.std(normal_samples):.3f}")
print(f"Exponential - Mean: {np.mean(exponential_samples):.3f}")
print(f"Poisson - Mean: {np.mean(poisson_samples):.3f}")
```

### Expectation and Variance

```python
from scipy.stats import norm, expon

X = norm(0, 1)
expected_value = X.mean()
variance = X.var()

print(f"E[X] for N(0,1): {expected_value}")
print(f"Var(X) for N(0,1): {variance}")

custom_dist = expon(scale=2)
print(f"E[X] for Exp(2): {custom_dist.mean()}")
```

### Monte Carlo Simulation

```python
np.random.seed(42)
n_simulations = 100000

def estimate_pi(n):
    x = np.random.uniform(-1, 1, n)
    y = np.random.uniform(-1, 1, n)
    inside = (x**2 + y**2) <= 1
    return 4 * inside.sum() / n

pi_estimate = estimate_pi(n_simulations)
print(f"Pi estimate: {pi_estimate:.5f}")
print(f"Error: {abs(pi_estimate - np.pi):.5f}")
```

## Best Practices

1. **Check Conditions**: Verify assumptions before applying theorems
2. **Numerical Stability**: Use log-probabilities for small probabilities
3. **Conjugate Priors**: Use for computational efficiency in Bayesian analysis
4. **Law of Large Numbers**: Use adequate sample sizes
5. **Sampler Validation**: Check MCMC convergence diagnostics

## Common Patterns

```python
# Markov chain simulation
def markov_chain_transition(transition_matrix, initial_state, n_steps):
    n_states = transition_matrix.shape[0]
    current = initial_state
    states = [current]
    for _ in range(n_steps):
        current = np.random.choice(n_states, p=transition_matrix[current])
        states.append(current)
    return states

# Conditional probability calculation
def conditional_probability(joint_prob, marginal_prob):
    return joint_prob / marginal_prob

# KL divergence
def kl_divergence(p, q):
    return np.sum(p * np.log(p / q))
```

## Core Competencies

1. Probability axioms and rules
2. Bayes' theorem and Bayesian inference
3. Probability distributions and sampling
4. Expectation and moment calculations
5. Monte Carlo methods and simulation
