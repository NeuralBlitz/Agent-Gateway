---
name: search-algorithms
description: Search algorithms in AI
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Implement search algorithms
- Solve pathfinding problems
- Optimize search strategies
- Apply heuristic search
- Handle adversarial search

## When to use me

Use me when:
- Finding optimal paths
- Game playing
- Puzzle solving
- Route planning

## Key Concepts

### Search Categories
- **Uninformed**: BFS, DFS, Uniform-cost
- **Informed**: A*, Greedy, IDA*
- **Adversarial**: Minimax, Alpha-beta
- **Local**: Hill climbing, Simulated annealing

### A* Implementation
```python
import heapq

def astar(start, goal, neighbors, heuristic):
    frontier = [(0, start)]
    came_from = {start: None}
    cost_so_far = {start: 0}
    
    while frontier:
        _, current = heapq.heappop(frontier)
        
        if current == goal:
            return reconstruct_path(came_from, current)
        
        for next_node in neighbors(current):
            new_cost = cost_so_far[current] + cost(current, next_node)
            
            if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                cost_so_far[next_node] = new_cost
                priority = new_cost + heuristic(next_node, goal)
                heapq.heappush(frontier, (priority, next_node))
                came_from[next_node] = current
    
    return None
```

### Minimax for Games
```python
def minimax(board, depth, is_maximizing):
    if is_terminal(board) or depth == 0:
        return evaluate(board)
    
    if is_maximizing:
        max_eval = -inf
        for move in get_moves(board):
            eval = minimax(make_move(board, move), depth - 1, False)
            max_eval = max(max_eval, eval)
        return max_eval
    else:
        min_eval = inf
        for move in get_moves(board):
            eval = minimax(make_move(board, move), depth - 1, True)
            min_eval = min(min_eval, eval)
        return min_eval

# Alpha-beta pruning
def alphabeta(board, depth, alpha, beta, is_maximizing):
    if is_terminal(board) or depth == 0:
        return evaluate(board)
    
    if is_maximizing:
        max_eval = -inf
        for move in get_moves(board):
            eval = alphabeta(make_move(board, move), depth - 1, 
                          alpha, beta, False)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = inf
        for move in get_moves(board):
            eval = alphabeta(make_move(board, move), depth - 1,
                          alpha, beta, True)
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval
```
