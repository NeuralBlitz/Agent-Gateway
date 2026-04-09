---
name: fuzzy-logic
description: Fuzzy logic systems
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Design fuzzy inference systems
- Implement membership functions
- Create fuzzy rules
- Handle uncertainty and imprecision
- Build expert systems with fuzzy logic
- Control systems with fuzzy rules

## When to use me

Use me when:
- Building control systems
- Working with imprecise inputs
- Expert system development
- Pattern recognition with uncertainty
- Decision support with vague criteria

## Key Concepts

### Fuzzy Logic Basics
```
Classical: Temperature > 30 → Hot (true/false)
Fuzzy:    Temperature 28 → Hot (0.6), Warm (0.4)
```

### Fuzzy Control Example
```python
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# Define universes
temperature = ctrl.Antecedent(np.arange(0, 41, 1), 'temperature')
fan_speed = ctrl.Consequent(np.arange(0, 101, 1), 'fan_speed')

# Membership functions
temperature['cold'] = fuzz.trimf(temperature.universe, [0, 0, 20])
temperature['cool'] = fuzz.trimf(temperature.universe, [10, 25, 30])
temperature['hot'] = fuzz.trimf(temperature.universe, [25, 40, 40])

fan_speed['low'] = fuzz.trimf(fan_speed.universe, [0, 0, 50])
fan_speed['medium'] = fuzz.trimf(fan_speed.universe, [25, 50, 75])
fan_speed['high'] = fuzz.trimf(fan_speed.universe, [50, 100, 100])

# Rules
rule1 = ctrl.Rule(temperature['cold'], fan_speed['low'])
rule2 = ctrl.Rule(temperature['cool'], fan_speed['medium'])
rule3 = ctrl.Rule(temperature['hot'], fan_speed['high'])

# Control system
fan_ctrl = ctrl.ControlSystem([rule1, rule2, rule3])
fan_sim = ctrl.ControlSystemSimulation(fan_ctrl)

# Input and compute
fan_sim.input['temperature'] = 28
fan_sim.compute()
print(fan_sim.output['fan_speed'])
```

### Key Concepts
- **Membership functions**: Triangular, trapezoidal, Gaussian
- **Fuzzy operators**: AND (min), OR (max), NOT (1-x)
- **Defuzzification**: Centroid, bisector, MOM
- **Inference**: Mamdani, Sugeno

### Applications
- **Control**: AC, washing machines, autofocus
- **Decision**: Credit scoring, medical diagnosis
- **Pattern**: Image processing, recognition
