---
name: probability
description: Probability theory fundamentals including distributions, conditional probability, Bayes' theorem, random variables, and stochastic processes for modeling uncertainty.
category: mathematics
tags:
  - mathematics
  - probability
  - distributions
  - bayes-theorem
  - random-variables
  - statistics
  - stochastic-processes
difficulty: intermediate
author: neuralblitz
---

# Probability Theory

## What I do

I provide comprehensive expertise in probability theory, the mathematical framework for quantifying uncertainty and modeling random phenomena. I enable you to work with probability distributions, compute conditional probabilities, apply Bayes' theorem for inference, analyze random variables and their properties, and model stochastic processes. My knowledge spans from discrete and continuous distributions to advanced topics like Markov chains and Monte Carlo methods essential for statistics, machine learning, finance, and scientific modeling.

## When to use me

Use probability theory when you need to: model uncertainty in decision-making systems, implement Bayesian inference for parameter estimation, generate random samples from arbitrary distributions, analyze A/B tests and statistical significance, build probabilistic graphical models, simulate stochastic systems, detect anomalies in data streams, implement reinforcement learning algorithms, or quantify risk in financial applications.

## Core Concepts

- **Probability Axioms and Rules**: The mathematical foundation including addition and multiplication rules for combining event probabilities.
- **Conditional Probability**: The probability of an event given occurrence of another, forming the basis for inference.
- **Bayes' Theorem**: The fundamental formula for updating beliefs based on evidence, P(A|B) = P(B|A)P(A)/P(B).
- **Random Variables and Distributions**: Functions mapping outcomes to numerical values with associated probability distributions.
- **Expectation and Variance**: Summary measures characterizing the center and spread of random variable distributions.
- **Common Distributions**: Discrete (binomial, Poisson) and continuous (normal, exponential, uniform) distributions with specific properties.
- **Joint, Marginal, and Conditional Distributions**: Relationships between multiple random variables and their probabilities.
- **Law of Large Numbers and Central Limit Theorem**: Fundamental theorems connecting sample averages to population parameters.
- **Markov Chains and Stochastic Processes**: Sequences of random states with transition probabilities for modeling temporal dynamics.

## Code Examples

### Basic Probability Calculations

```python
import numpy as np
from scipy import stats
from itertools import combinations

def probability_of_union(pA, pB, pAB):
    """P(A ∪ B) = P(A) + P(B) - P(A ∩ B)"""
    return pA + pB - pAB

def conditional_probability(pAB, pB):
    """P(A|B) = P(A ∩ B) / P(B)"""
    if pB == 0:
        raise ValueError("P(B) cannot be zero")
    return pAB / pB

def bayes_theorem(pB_given_A, pA, pB):
    """P(A|B) = P(B|A) * P(A) / P(B)"""
    return (pB_given_A * pA) / pB

# Example: Medical test scenario
p_disease = 0.01  # 1% prevalence
p_positive_given_disease = 0.99  # Sensitivity
p_positive_given_no_disease = 0.05  # False positive rate

# Using Bayes' theorem
p_positive = (p_positive_given_disease * p_disease + 
              p_positive_given_no_disease * (1 - p_disease))
p_disease_given_positive = (p_positive_given_disease * p_disease) / p_positive

print(f"P(disease | positive) = {p_disease_given_positive:.4f}")
print(f"Despite 99% sensitivity, only {p_disease_given_positive*100:.1f}% of positive tests have the disease")

# Verify with counting approach
population = 10000
diseased = int(population * p_disease)
healthy = population - diseased

true_positives = int(diseased * p_positive_given_disease)
false_positives = int(healthy * p_positive_given_no_disease)

total_positives = true_positives + false_positives
p_counting = true_positives / total_positives
print(f"Verification by counting: {p_counting:.4f}")
```

### Working with Probability Distributions

```python
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# Discrete distributions
binomial = stats.binom(n=10, p=0.3)
poisson = stats.poisson(mu=5)

# PMF: Probability Mass Function
print(f"Binomial P(X=5) = {binomial.pmf(5):.4f}")
print(f"Poisson P(X=3) = {poisson.pmf(3):.4f}")

# CDF: Cumulative Distribution Function
print(f"Binomial P(X≤5) = {binomial.cdf(5):.4f}")
print(f"Poisson P(X>7) = 1 - poisson.cdf(7):.4f}")

# Continuous distributions
normal = stats.norm(loc=0, scale=1)
exponential = stats.expon(scale=1)
uniform = stats.uniform(loc=0, scale=1)

# PDF: Probability Density Function
x_normal = np.linspace(-4, 4, 100)
print(f"Normal PDF at x=0: {normal.pdf(0):.4f}")
print(f"Normal CDF at x=0: {normal.cdf(0):.4f}")

# Percent point function (inverse CDF)
print(f"90th percentile of normal: {normal.ppf(0.9):.4f}")

# Generate random samples
np.random.seed(42)
samples_normal = normal.rvs(size=1000)
samples_binomial = binomial.rvs(size=1000)

print(f"Sample mean of normal: {samples_normal.mean():.4f}")
print(f"Sample variance of binomial: {samples_binomial.var():.4f}")
```

### Monte Carlo Simulation

```python
import numpy as np

def estimate_pi_monte_carlo(n_samples=1000000):
    """Estimate π using Monte Carlo integration."""
    np.random.seed(42)
    
    # Generate points in [0, 1] x [0, 1]
    x = np.random.uniform(0, 1, n_samples)
    y = np.random.uniform(0, 1, n_samples)
    
    # Count points inside unit circle
    inside = x**2 + y**2 <= 1
    pi_estimate = 4 * inside.sum() / n_samples
    
    return pi_estimate, np.sqrt(pi_estimate * (1 - pi_estimate))

pi_est, std_err = estimate_pi_monte_carlo(1000000)
print(f"Monte Carlo π estimate: {pi_est:.6f} ± {1.96*std_err:.6f}")
print(f"Error: {abs(pi_est - np.pi):.6f}")

def estimate_integral_monte_carlo(f, a, b, n_samples=100000):
    """Estimate ∫f(x)dx using Monte Carlo integration."""
    np.random.seed(42)
    x = np.random.uniform(a, b, n_samples)
    y = f(x)
    
    integral_estimate = (b - a) * y.mean()
    std_error = (b - a) * y.std() / np.sqrt(n_samples)
    
    return integral_estimate, std_error

# Example: estimate ∫e^(-x^2) dx from 0 to 1
f = lambda x: np.exp(-x**2)
integral, error = estimate_integral_monte_carlo(f, 0, 1, 100000)
print(f"∫e^(-x^2) dx from 0 to 1 ≈ {integral:.6f} ± {1.96*error:.6f}")

# Importance sampling for better efficiency
def importance_sampling_estimate(f, n_samples=100000):
    """Use exponential distribution for importance sampling."""
    np.random.seed(42)
    
    # Sample from exponential (our proposal)
    samples = np.random.exponential(scale=1.0, size=n_samples)
    
    # Weight by likelihood ratio
    weights = stats.uniform(0, 1).pdf(samples) / stats.expon(scale=1).pdf(samples)
    samples = samples[samples <= 1]  # Truncate to [0, 1]
    weights = weights[:len(samples)]
    
    estimate = f(samples).mean()
    return estimate

# Simulate gambler's ruin
def gambler_ruin_simulation(p=0.5, N=100, initial=50, n_simulations=10000):
    """Simulate gambler's ruin problem."""
    np.random.seed(42)
    ruin_count = 0
    
    for _ in range(n_simulations):
        fortune = initial
        while 0 < fortune < N:
            if np.random.random() < p:
                fortune += 1
            else:
                fortune -= 1
        if fortune == 0:
            ruin_count += 1
    
    return ruin_count / n_simulations

ruin_prob = gambler_ruin_simulation(p=0.5, N=100, initial=50)
print(f"P(gambler ruined) = {ruin_prob:.4f} (theoretical: {1 - 50/100 = 0.5})")
```

### Markov Chains

```python
import numpy as np

class MarkovChain:
    def __init__(self, transition_matrix, states):
        """
        Initialize Markov chain.
        transition_matrix[i][j] = P(X_{t+1}=j | X_t=i)
        """
        self.P = np.array(transition_matrix)
        self.states = states
        self.n = len(states)
    
    def simulate(self, initial_state, n_steps=100):
        """Simulate trajectory from initial state."""
        state_idx = self.states.index(initial_state)
        trajectory = [initial_state]
        
        for _ in range(n_steps):
            state_idx = np.random.choice(self.n, p=self.P[state_idx])
            trajectory.append(self.states[state_idx])
        
        return trajectory
    
    def stationary_distribution(self, tolerance=1e-8):
        """Find stationary distribution π = πP."""
        pi = np.ones(self.n) / self.n
        
        for _ in range(10000):
            pi_new = pi @ self.P
            if np.linalg.norm(pi_new - pi) < tolerance:
                break
            pi = pi_new
        
        return pi / pi.sum()
    
    def n_step_probability(self, start, end, n_steps):
        """Compute P(X_n = end | X_0 = start)."""
        return np.linalg.matrix_power(self.P, n_steps)[self.states.index(start)][self.states.index(end)]

# Example: Weather Markov chain
weather_states = ['sunny', 'cloudy', 'rainy']
weather_transition = [
    [0.7, 0.2, 0.1],  # sunny -> sunny, cloudy, rainy
    [0.3, 0.4, 0.3],  # cloudy -> sunny, cloudy, rainy
    [0.2, 0.3, 0.5],  # rainy -> sunny, cloudy, rainy
]

chain = MarkovChain(weather_transition, weather_states)

# Simulate 10 days starting from sunny
trajectory = chain.simulate('sunny', n_steps=10)
print(f"Weather trajectory: {' -> '.join(trajectory)}")

# Find stationary distribution
stationary = chain.stationary_distribution()
print(f"Stationary distribution: {dict(zip(weather_states, stationary))}")

# 7-day forecast
prob_rain_in_7 = chain.n_step_probability('sunny', 'rainy', 7)
print(f"P(rain in 7 days | sunny today) = {prob_rain_in_7:.4f}")
```

### Bayesian Inference

```python
import numpy as np
from scipy import stats

def bayesian_update(prior, likelihood_func, data):
    """Perform Bayesian update using likelihood function."""
    posterior = prior.copy()
    for observation in data:
        posterior = posterior * likelihood_func(observation)
        posterior = posterior / posterior.sum()  # Normalize
    return posterior

# Example: Binomial likelihood with Beta prior
class BetaBinomial:
    def __init__(self, alpha=1, beta=1):
        self.alpha = alpha
        self.beta = beta
        self.prior = stats.beta(alpha, beta)
    
    def posterior(self, successes, trials):
        """Update Beta prior to posterior given binomial data."""
        alpha_post = self.alpha + successes
        beta_post = self.beta + trials - successes
        return stats.beta(alpha_post, beta_post)
    
    def credible_interval(self, posterior, credible=0.95):
        """Compute credible interval from posterior."""
        return posterior.interval(credible)

# Coin flip experiment
model = BetaBinomial(alpha=1, beta=1)  # Uniform prior

# Observe 7 heads out of 10 flips
posterior = model.posterior(successes=7, trials=10)

print(f"Prior: Beta(1, 1) → Posterior: Beta({model.alpha + 7}, {model.beta + 3})")
print(f"P(heads > 0.5 | data) = {1 - posterior.cdf(0.5):.4f}")

# 95% credible interval
ci_low, ci_high = posterior.interval(0.95)
print(f"95% Credible Interval: ({ci_low:.4f}, {ci_high:.4f})")

# Posterior predictive for next flip
prob_next_heads = posterior.mean()
print(f"P(next flip is heads | data) = {prob_next_heads:.4f}")

# Compare with maximum likelihood estimate
mle = 7 / 10
print(f"MLE estimate: {mle:.4f}")
print(f"Posterior mean: {posterior.mean():.4f}")

# Sequential updating
model2 = BetaBinomial(alpha=1, beta=1)
posterior1 = model2.posterior(successes=3, trials=5)
alpha_new = 1 + 3 + 4  # prior + first update + second update
beta_new = 1 + 2 + 3   # prior + first update + second update
print(f"Sequential update: Beta({alpha_new}, {beta_new}) same as batch update")
```

## Best Practices

- Always normalize probability distributions to ensure they sum/integrate to 1 before using them in computations.
- Use log-probabilities in numerical calculations to avoid underflow when multiplying many small probabilities.
- Validate Monte Carlo estimates by computing standard errors and increasing sample size until convergence.
- For Bayesian updating, choose priors that reflect genuine prior knowledge rather than convenience.
- Check Markov chain convergence diagnostics before interpreting stationary distributions from MCMC.
- Use appropriate variance reduction techniques (importance sampling, control variates) in Monte Carlo simulations.
- Handle edge cases like division by zero in conditional probability calculations with appropriate checks.
- Distinguish between frequentist confidence intervals and Bayesian credible intervals in interpretation.
- When working with high-dimensional distributions, consider dimensionality reduction or specialized sampling methods.
- Test probability calculations with simple cases where analytical results are known to verify implementations.

