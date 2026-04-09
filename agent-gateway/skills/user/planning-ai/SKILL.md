---
name: planning-ai
description: AI planning and scheduling
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Design AI planning systems
- Implement classical planning
- Build hierarchical task networks
- Handle temporal planning
- Create scheduling systems
- Solve planning under constraints

## When to use me

Use me when:
- Building autonomous agents
- Task automation and orchestration
- Robotics planning
- Resource scheduling

## Key Concepts

### Planning Paradigms
- **Classical**: Fully observable, deterministic
- **Stochastic**: Partially observable, probabilistic
- **Temporal**: Time constraints
- **Hierarchical**: HTN decomposition
- **Preference-based**: Soft constraints

### Planning Example (PDDL)
```pddl
;; Domain definition
(define (domain robot-navigation)
  (:requirements :strips :typing)
  (:types location robot)
  (:predicates
    (at ?r - robot ?l - location)
    (connected ?l1 ?l2 - location)
    (holding ?r - robot))
  
  (:action move
    :parameters (?r - robot ?from ?to - location)
    :precondition (and (at ?r ?from) (connected ?from ?to))
    :effect (and (not (at ?r ?from)) (at ?r ?to)))
  
  (:action pick
    :parameters (?r - robot ?l - location)
    :precondition (at ?r ?l)
    :effect (holding ?r)))

;; Problem
(define (problem robot-prob1)
  (:domain robot-navigation)
  (:objects r1 - robot loc1 loc2 loc3 - location)
  (:init (at r1 loc1) (connected loc1 loc2) (connected loc2 loc3))
  (:goal (at r1 loc3)))
```

### Python Planning (pyplan)
```python
from pyplan import planning

# A* Search Planning
def plan(start, goal, successors, heuristic):
    frontier = [(0, start)]
    came_from = {start: None}
    cost_so_far = {start: 0}
    
    while frontier:
        _, current = heapq.heappop(frontier)
        
        if current == goal:
            return reconstruct_path(came_from, current)
        
        for next_state in successors(current):
            new_cost = cost_so_far[current] + 1
            if next_state not in cost_so_far or new_cost < cost_so_far[next_state]:
                cost_so_far[next_state] = new_cost
                priority = new_cost + heuristic(next_state, goal)
                heapq.heappush(frontier, (priority, next_state))
                came_from[next_state] = current
    
    return None
```
