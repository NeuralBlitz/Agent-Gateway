---
name: genetic-algorithms
description: Genetic algorithm optimization
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Implement evolutionary algorithms
- Design genetic representations
- Create fitness functions
- Implement selection and crossover
- Handle mutation operators
- Optimize using evolution

## When to use me

Use me when:
- Complex optimization problems
- Noisy or non-differentiable fitness
- Multi-objective optimization
- Feature selection
- Neural architecture search

## Key Concepts

### Genetic Algorithm Flow
```
┌──────────────┐
│   Population │◀──────────────┐
│   Generation │                │
└──────┬───────┘               │
       │                       │
       ▼                       │
┌──────────────┐    ┌─────────┐│
│   Evaluate   │    │ Select ││
│   Fitness    │───▶│ Parents││
└──────────────┘    └────┬────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  Crossover  │
                 │   + Mutate  │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Replace   │
                 │  Population │
                 └──────┬──────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Continue?  │
                 └──────────────┘
```

### Implementation
```python
import random
import numpy as np

class GeneticAlgorithm:
    def __init__(self, pop_size=100, mutation_rate=0.1, 
                 crossover_rate=0.8):
        self.pop_size = pop_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
    
    def init_population(self):
        return [self.create_individual() for _ in range(self.pop_size)]
    
    def fitness(self, individual):
        raise NotImplemented
    
    def selection(self, population, fitnesses):
        # Tournament selection
        selected = []
        for _ in range(len(population)):
            i, j = random.sample(range(len(population)), 2)
            if fitnesses[i] > fitnesses[j]:
                selected.append(population[i].copy())
            else:
                selected.append(population[j].copy())
        return selected
    
    def crossover(self, parent1, parent2):
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        point = random.randint(1, len(parent1) - 1)
        child1 = parent1[:point] + parent2[point:]
        child2 = parent2[:point] + parent1[point:]
        return child1, child2
    
    def mutate(self, individual):
        for i in range(len(individual)):
            if random.random() < self.mutation_rate:
                individual[i] = self.random_gene()
        return individual
    
    def evolve(self, generations=100):
        population = self.init_population()
        
        for gen in range(generations):
            fitnesses = [self.fitness(ind) for ind in population]
            
            # Elitism - keep best
            best_idx = np.argmax(fitnesses)
            new_pop = [population[best_idx].copy()]
            
            # Selection
            parents = self.selection(population, fitnesses)
            
            # Crossover and mutation
            for i in range(0, len(parents) - 1, 2):
                child1, child2 = self.crossover(parents[i], parents[i+1])
                new_pop.append(self.mutate(child1))
                new_pop.append(self.mutate(child2))
            
            population = new_pop[:self.pop_size]
            
        return max(population, key=self.fitness)
```

### Operators
- **Selection**: Tournament, roulette, rank
- **Crossover**: One-point, two-point, uniform
- **Mutation**: Bit flip, swap, Gaussian
- **Replacement**: Generational, elitism
