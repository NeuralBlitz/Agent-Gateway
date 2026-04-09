---
name: reinforcement
description: Reinforcement learning fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Build reinforcement learning systems
- Design reward functions and environments
- Implement policy optimization algorithms
- Train agents for sequential decision-making
- Apply RL to games and robotics
- Handle exploration-exploitation tradeoffs

## When to use me

Use me when:
- Building AI for games
- Training robotics control systems
- Optimizing resource allocation
- Creating adaptive systems
- Solving sequential decision problems

## Key Concepts

### RL Framework
```
Agent ──────▶ Action ──────▶ Environment
  │                        │
  │◀─── State + Reward ◀──│
  │                        │
  └─────── (Loop) ─────────┘

Goal: Maximize cumulative reward
```

### OpenAI Gym Example
```python
import gym
import numpy as np
from collections import defaultdict

# Create environment
env = gym.make("CartPole-v1")
state = env.reset()

# Q-Learning Implementation
class QLearningAgent:
    def __init__(self, n_actions, learning_rate=0.1, 
                 epsilon=0.1, gamma=0.99):
        self.q_table = defaultdict(lambda: np.zeros(n_actions))
        self.lr = learning_rate
        self.epsilon = epsilon
        self.gamma = gamma
        self.n_actions = n_actions
    
    def choose_action(self, state):
        if np.random.random() < self.epsilon:
            return env.action_space.sample()
        return np.argmax(self.q_table[state])
    
    def learn(self, state, action, reward, next_state):
        current_q = self.q_table[state][action]
        max_next_q = np.max(self.q_table[next_state])
        new_q = current_q + self.lr * (reward + 
                         self.gamma * max_next_q - current_q)
        self.q_table[state][action] = new_q

# Training loop
agent = QLearningAgent(env.action_space.n)
episodes = 1000

for episode in range(episodes):
    state = env.reset()
    done = False
    
    while not done:
        action = agent.choose_action(state)
        next_state, reward, done, _ = env.step(action)
        agent.learn(state, action, reward, next_state)
        state = next_state
```

### Key Algorithms
- **Q-Learning**: Value-based, off-policy
- **SARSA**: On-policy value-based
- **DQN**: Deep Q-Networks
- **A2C/A3C**: Actor-Critic
- **PPO**: Proximal Policy Optimization
- **DDPG**: Continuous actions
- **AlphaZero**: Tree search + RL

### Key Concepts
- **Reward shaping**: Designing reward signals
- **Exploration**: Epsilon-greedy, entropy
- **Credit assignment**: Delayed rewards
- **Function approximation**: Deep RL
