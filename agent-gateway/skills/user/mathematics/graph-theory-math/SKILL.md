---
name: graph-theory-math
description: Graph algorithms including shortest paths, network flow, matching, connectivity, coloring, and community detection for network analysis.
category: mathematics
tags:
  - mathematics
  - graph-theory
  - shortest-paths
  - network-flow
  - matching
  - connectivity
  - graph-coloring
  - algorithms
difficulty: intermediate
author: neuralblitz
---

# Graph Theory

## What I do

I provide comprehensive expertise in graph theory, the mathematical study of networks consisting of vertices connected by edges. I enable you to analyze graph properties, implement traversal algorithms, solve shortest path problems, compute network flows, find matchings, detect communities, and solve graph coloring problems. My knowledge spans from fundamental graph properties to advanced algorithms essential for social network analysis, transportation systems, computer networks, and optimization problems.

## When to use me

Use graph theory when you need to: find shortest paths in routing and navigation, solve network flow problems for resource allocation, detect communities in social networks, find maximum matchings in assignment problems, analyze connectivity and reliability of networks, schedule tasks with dependencies, solve puzzles like Sudoku as graph coloring, analyze social network influence, or optimize supply chain and logistics.

## Core Concepts

- **Graph Representations**: Adjacency matrices and lists for storing graphs with different space/time tradeoffs.
- **Graph Traversal**: BFS and DFS algorithms for systematic exploration of graph vertices.
- **Shortest Path Algorithms**: Dijkstra's, Bellman-Ford, and Floyd-Warshall for finding optimal paths.
- **Network Flow**: Max-flow min-cut theorem and Ford-Fulkerson for flow optimization.
- **Matching**: Pairing vertices without sharing edges for assignment and pairing problems.
- **Connectivity**: Properties of connected components and techniques for finding them.
- **Graph Coloring**: Assigning colors to vertices so adjacent vertices have different colors.
- **Eulerian and Hamiltonian Paths**: Traversing all edges or vertices exactly once.
- **Centrality Measures**: Degree, betweenness, and closeness for identifying important vertices.
- **Community Detection**: Clustering algorithms for finding densely connected subgroups.

## Code Examples

### Graph Representations and Traversal

```python
from collections import deque
import heapq

class Graph:
    def __init__(self, directed=False):
        self.adjacency = {}
        self.directed = directed
    
    def add_vertex(self, v):
        if v not in self.adjacency:
            self.adjacency[v] = []
    
    def add_edge(self, u, v, weight=1):
        self.add_vertex(u)
        self.add_vertex(v)
        self.adjacency[u].append((v, weight))
        if not self.directed:
            self.adjacency[v].append((u, weight))
    
    def bfs(self, start):
        """Breadth-first search."""
        visited = {start}
        queue = deque([start])
        order = []
        
        while queue:
            vertex = queue.popleft()
            order.append(vertex)
            for neighbor, _ in self.adjacency[vertex]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        return order
    
    def dfs_iterative(self, start):
        """Depth-first search (iterative)."""
        visited = set()
        stack = [start]
        order = []
        
        while stack:
            vertex = stack.pop()
            if vertex not in visited:
                visited.add(vertex)
                order.append(vertex)
                for neighbor, _ in self.adjacency[vertex]:
                    if neighbor not in visited:
                        stack.append(neighbor)
        
        return order
    
    def dfs_recursive(self, start):
        """Depth-first search (recursive)."""
        visited = set()
        order = []
        
        def dfs(v):
            visited.add(v)
            order.append(v)
            for neighbor, _ in self.adjacency[v]:
                if neighbor not in visited:
                    dfs(neighbor)
        
        dfs(start)
        return order

# Build example graph
g = Graph()
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 4), (3, 4), (4, 5)]
for u, v in edges:
    g.add_edge(u, v)

print(f"BFS from 0: {g.bfs(0)}")
print(f"DFS from 0: {g.dfs_iterative(0)}")

# Connected components
def connected_components(graph):
    """Find all connected components."""
    visited = set()
    components = []
    
    for vertex in graph.adjacency:
        if vertex not in visited:
            component = set(graph.bfs(vertex))
            visited.update(component)
            components.append(component)
    
    return components

components = connected_components(g)
print(f"Connected components: {components}")

# Check bipartiteness
def is_bipartite(graph):
    """Check if graph is bipartite using BFS."""
    color = {}
    
    for start in graph.adjacency:
        if start in color:
            continue
        
        color[start] = 0
        queue = deque([start])
        
        while queue:
            v = queue.popleft()
            for neighbor, _ in graph.adjacency[v]:
                if neighbor not in color:
                    color[neighbor] = 1 - color[v]
                    queue.append(neighbor)
                elif color[neighbor] == color[v]:
                    return False
    
    return True

print(f"Is bipartite: {is_bipartite(g)}")
```

### Shortest Path Algorithms

```python
import heapq
import math

def dijkstra(graph, start, end=None):
    """Dijkstra's shortest path algorithm."""
    distances = {v: float('inf') for v in graph.adjacency}
    distances[start] = 0
    predecessors = {start: None}
    pq = [(0, start)]
    visited = set()
    
    while pq:
        dist, vertex = heapq.heappop(pq)
        
        if vertex in visited:
            continue
        visited.add(vertex)
        
        if vertex == end:
            break
        
        for neighbor, weight in graph.adjacency[vertex]:
            if neighbor in visited:
                continue
            new_dist = dist + weight
            
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                predecessors[neighbor] = vertex
                heapq.heappush(pq, (new_dist, neighbor))
    
    return distances, predecessors

def bellman_ford(graph, start):
    """Bellman-Ford algorithm for graphs with negative weights."""
    distances = {v: float('inf') for v in graph.adjacency}
    distances[start] = 0
    predecessors = {}
    
    n = len(graph.adjacency)
    for _ in range(n - 1):
        for u in graph.adjacency:
            for v, w in graph.adjacency[u]:
                if distances[u] != float('inf') and distances[u] + w < distances[v]:
                    distances[v] = distances[u] + w
                    predecessors[v] = u
    
    # Check for negative cycles
    for u in graph.adjacency:
        for v, w in graph.adjacency[u]:
            if distances[u] != float('inf') and distances[u] + w < distances[v]:
                return None, None  # Negative cycle detected
    
    return distances, predecessors

def floyd_warshall(graph):
    """Floyd-Warshall for all-pairs shortest paths."""
    n = len(graph.adjacency)
    vertices = list(graph.adjacency.keys())
    idx = {v: i for i, v in enumerate(vertices)}
    
    # Initialize distance matrix
    dist = [[float('inf')] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    
    for u in graph.adjacency:
        for v, w in graph.adjacency[u]:
            i, j = idx[u], idx[v]
            dist[i][j] = min(dist[i][j], w)
    
    # Floyd-Warshall
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[j][k] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    return dist, vertices

# Example with weighted graph
gw = Graph()
weighted_edges = [(0, 1, 4), (0, 2, 2), (1, 2, 1), (1, 3, 5), (2, 4, 10), (3, 4, 2)]
for u, v, w in weighted_edges:
    gw.add_edge(u, v, w)

distances, predecessors = dijkstra(gw, 0)
print(f"Dijkstra from 0: distances = {distances}")

# Reconstruct path
def reconstruct_path(predecessors, start, end):
    path = []
    current = end
    while current is not None:
        path.append(current)
        current = predecessors.get(current)
    return list(reversed(path))

path = reconstruct_path(predecessors, 0, 4)
print(f"Shortest path from 0 to 4: {path}")

# Negative weight example
gn = Graph()
gn.add_edge(0, 1, 4)
gn.add_edge(0, 2, 2)
gn.add_edge(1, 2, -3)
gn.add_edge(2, 3, 2)
gn.add_edge(1, 3, 3)
gn.add_edge(3, 1, -1)

dist_neg, pred_neg = bellman_ford(gn, 0)
if dist_neg is None:
    print("Negative cycle detected!")
else:
    print(f"Bellman-Ford: {dist_neg}")
```

### Network Flow

```python
import copy

class FlowNetwork:
    def __init__(self):
        self.graph = {}
        self.capacity = {}
        self.flow = {}
    
    def add_edge(self, u, v, capacity):
        if u not in self.graph:
            self.graph[u] = []
        if v not in self.graph:
            self.graph[v] = []
        
        self.graph[u].append(v)
        self.graph[v].append(u)  # Residual edge
        
        self.capacity[(u, v)] = capacity
        self.capacity[(v, u)] = 0
        self.flow[(u, v)] = 0
        self.flow[(v, u)] = 0
    
    def bfs_level_graph(self, source, sink):
        """BFS to build level graph."""
        level = {source: 0}
        queue = [source]
        
        while queue:
            u = queue.pop(0)
            for v in self.graph[u]:
                if v not in level and self.capacity[(u, v)] - self.flow[(u, v)] > 0:
                    level[v] = level[u] + 1
                    queue.append(v)
        
        return level
    
    def dfs_blocking_flow(self, u, sink, flow, level, current_flow):
        """DFS to find blocking flow."""
        if u == sink:
            return flow
        
        for i in range(current_flow[u], len(self.graph[u])):
            v = self.graph[u][i]
            
            if v in level and self.capacity[(u, v)] - self.flow[(u, v)] > 0:
                min_cap = min(flow, self.capacity[(u, v)] - self.flow[(u, v)])
                pushed = self.dfs_blocking_flow(v, sink, min_cap, level, current_flow)
                
                if pushed > 0:
                    self.flow[(u, v)] += pushed
                    self.flow[(v, u)] -= pushed
                    return pushed
            
            current_flow[u] += 1
        
        return 0
    
    def max_flow(self, source, sink):
        """Dinic's algorithm for max flow."""
        max_flow = 0
        
        while True:
            level = self.bfs_level_graph(source, sink)
            if sink not in level:
                break
            
            current_flow = {u: 0 for u in self.graph}
            
            while True:
                pushed = self.dfs_blocking_flow(source, sink, float('inf'), level, current_flow)
                if pushed == 0:
                    break
                max_flow += pushed
        
        return max_flow

# Example: Maximum flow in network
flow_net = FlowNetwork()
# Add edges with capacities
flow_net.add_edge('S', 'A', 10)
flow_net.add_edge('S', 'B', 5)
flow_net.add_edge('A', 'B', 15)
flow_net.add_edge('A', 'T', 10)
flow_net.add_edge('B', 'T', 10)

max_flow = flow_net.max_flow('S', 'T')
print(f"Maximum flow: {max_flow}")

# Minimum cut
def min_cut(flow_net, source):
    """Find minimum cut using residual graph."""
    visited = {source}
    queue = [source]
    
    while queue:
        u = queue.pop(0)
        for v in flow_net.graph[u]:
            if v not in visited and flow_net.capacity[(u, v)] - flow_net.flow[(u, v)] > 0:
                visited.add(v)
                queue.append(v)
    
    return visited

cut = min_cut(flow_net, 'S')
print(f"Min cut (reachable from S): {cut}")
```

### Graph Coloring and Matching

```python
import itertools

def greedy_coloring(graph):
    """Graph coloring using greedy algorithm."""
    colors = {}
    available_colors = {}
    
    for v in graph.adjacency:
        available_colors[v] = set()
    
    for v in graph.adjacency:
        # Find colors used by neighbors
        used_colors = {colors.get(n) for n in graph.adjacency[v] if n in colors}
        
        # Find smallest available color
        color = 0
        while color in used_colors:
            color += 1
        colors[v] = color
    
    return colors

def graph_coloring_backtracking(graph, colors, current_assignment=None):
    """Backtracking graph coloring (exact algorithm)."""
    if current_assignment is None:
        current_assignment = {}
    
    # Check if all vertices colored
    if len(current_assignment) == len(graph.adjacency):
        return current_assignment
    
    # Select uncolored vertex with most constraints
    uncolored = [v for v in graph.adjacency if v not in current_assignment]
    vertex = min(uncolored, key=lambda v: sum(1 for n in graph.adjacency[v] 
                                               if n in current_assignment))
    
    # Try each color
    used_colors = {current_assignment.get(n) for n in graph.adjacency[vertex] 
                   if n in current_assignment}
    
    for color in range(colors):
        if color not in used_colors:
            current_assignment[vertex] = color
            result = graph_coloring_backtracking(graph, colors, current_assignment)
            if result is not None:
                return result
            del current_assignment[vertex]
    
    return None

# Graph coloring example
gc = Graph()
gc.add_edge(0, 1)
gc.add_edge(0, 2)
gc.add_edge(1, 2)
gc.add_edge(1, 3)
gc.add_edge(2, 3)
gc.add_edge(3, 4)

greedy_colors = greedy_coloring(gc)
print(f"Greedy coloring: {greedy_colors}")

exact_colors = graph_coloring_backtracking(gc, 3)
print(f"Exact 3-coloring: {exact_colors}")

# Maximum matching (blossom algorithm - simplified version)
def maximum_matching(graph):
    """Simplified maximum matching using augmenting paths."""
    match = {}
    
    def bfs_augmenting_path():
        """Find augmenting path using BFS."""
        parent = {v: None for v in graph.adjacency}
        queue = [v for v in graph.adjacency if v not in match]
        
        for start in queue:
            parent[start] = -1
        
        for u in queue:
            if match.get(u) is None:
                for v, _ in graph.adjacency[u]:
                    if parent[v] is None:
                        parent[v] = u
                        if match.get(v) is None:
                            # Found augmenting path
                            return parent
                        queue.append(match[v])
        return None
    
    while True:
        parent = bfs_augmenting_path()
        if parent is None:
            break
        
        # Augment matching
        v = [v for v in parent if match.get(v) is None and parent[v] is not None][0]
        while v is not None and parent[v] is not None:
            u = parent[v]
            prev = match.get(u)
            match[u] = v
            match[v] = u
            v = prev
    
    return match

# Matching example
gm = Graph()
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 4), (3, 4)]
for u, v in edges:
    gm.add_edge(u, v)

matching = maximum_matching(gm)
print(f"Maximum matching: {matching}")
```

### Centrality and Community Detection

```python
import numpy as np
from collections import defaultdict

def degree_centrality(graph):
    """Compute degree centrality."""
    n = len(graph.adjacency)
    max_degree = n - 1
    
    centrality = {}
    for v in graph.adjacency:
        degree = len(graph.adjacency[v])
        centrality[v] = degree / max_degree
    
    return centrality

def betweenness_centrality(graph):
    """Compute betweenness centrality (Brandes algorithm)."""
    n = len(graph.adjacency)
    betweenness = {v: 0.0 for v in graph.adjacency}
    
    for s in graph.adjacency:
        # BFS to find shortest paths
        S = []
        P = {v: [] for v in graph.adjacency}
        sigma = {v: 0 for v in graph.adjacency}
        d = {v: -1 for v in graph.adjacency}
        
        sigma[s] = 1
        d[s] = 0
        queue = [s]
        
        while queue:
            v = queue.pop(0)
            S.append(v)
            for w, _ in graph.adjacency[v]:
                if d[w] < 0:
                    queue.append(w)
                    d[w] = d[v] + 1
                
                if d[w] == d[v] + 1:
                    sigma[w] += sigma[v]
                    P[w].append(v)
        
        # Accumulate dependencies
        delta = {v: 0.0 for v in graph.adjacency}
        
        while S:
            w = S.pop()
            for v in P[w]:
                delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
            
            if w != s:
                betweenness[w] += delta[w]
        
        # Normalize
        for v in betweenness:
            betweenness[v] /= ((n - 1) * (n - 2) / 2) if n > 2 else 1
    
    return betweenness

def closeness_centrality(graph, start):
    """Compute closeness centrality from a source."""
    distances = {v: float('inf') for v in graph.adjacency}
    distances[start] = 0
    
    queue = [start]
    while queue:
        v = queue.pop(0)
        for w, _ in graph.adjacency[v]:
            if distances[w] == float('inf'):
                distances[w] = distances[v] + 1
                queue.append(w)
    
    reachable = [d for d in distances.values() if d != float('inf')]
    if not reachable:
        return 0
    
    return sum(reachable) / (len(reachable) * max(reachable))

# Community detection using Label Propagation
def label_propagation(graph, max_iterations=100):
    """Simple label propagation for community detection."""
    labels = {v: v for v in graph.adjacency}
    
    for _ in range(max_iterations):
        updated = False
        order = list(graph.adjacency.keys())
        np.random.shuffle(order)
        
        for v in order:
            neighbor_labels = [labels[n] for n, _ in graph.adjacency[v]]
            
            if neighbor_labels:
                most_common = max(set(neighbor_labels), key=neighbor_labels.count)
                if labels[v] != most_common:
                    labels[v] = most_common
                    updated = True
        
        if not updated:
            break
    
    # Group by labels
    communities = defaultdict(list)
    for v, label in labels.items():
        communities[label].append(v)
    
    return list(communities.values())

# Compute centralities for example graph
gc = Graph()
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 4), (3, 4), (3, 5), (4, 5)]
for u, v in edges:
    gc.add_edge(u, v)

print(f"Degree centrality: {degree_centrality(gc)}")
print(f"Betweenness centrality: {betweenness_centrality(gc)}")

communities = label_propagation(gc)
print(f"Communities: {communities}")
```

## Best Practices

- Choose appropriate graph representation: adjacency lists for sparse graphs, matrices for dense graphs.
- When implementing BFS, use collections.deque for O(1) popleft operations.
- Dijkstra's algorithm requires non-negative edge weights; use Bellman-Ford for negative weights.
- Always check for negative cycles in Bellman-Ford before using distances.
- For max-flow, Dinic's algorithm is preferred over Edmonds-Karp for better time complexity.
- Graph coloring is NP-hard; greedy algorithms provide approximate solutions suitable for most applications.
- Use union-find (disjoint set) for efficient connected component detection.
- When dealing with large graphs, consider space-efficient representations and streaming algorithms.
- For betweenness centrality on large graphs, use approximation with random sampling.
- Validate graph inputs for self-loops and parallel edges based on problem requirements.

