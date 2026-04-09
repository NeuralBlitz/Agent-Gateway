---
name: Graph Theory
description: Graph algorithms including shortest paths, network flow, matching, connectivity, coloring, and community detection for network analysis.
license: MIT
compatibility: python>=3.8
audience: computer-scientists, network-engineers, data-scientists, researchers
category: mathematics
---

# Graph Theory

## What I Do

I provide comprehensive graph theory tools including shortest path algorithms, network flow, maximum matching, connectivity analysis, graph coloring, and community detection for network analysis and optimization.

## When to Use Me

- Network routing and optimization
- Social network analysis
- Transportation and logistics
- Dependency resolution
- Recommendation systems
- Web page ranking

## Core Concepts

- **Shortest Paths**: Dijkstra, Bellman-Ford, Floyd-Warshall
- **Network Flow**: Max flow, min cut, Ford-Fulkerson
- **Matching**: Maximum matching, bipartite matching
- **Connectivity**: Components, articulation points, bridges
- **Graph Coloring**: Chromatic number, greedy coloring
- **Centrality Measures**: Degree, betweenness, PageRank
- **Community Detection**: Louvain, Girvan-Newman
- **Planar Graphs**: Euler's formula, Kuratowski's theorem

## Code Examples

### Graph Representation

```python
import numpy as np
from collections import defaultdict, deque

class Graph:
    def __init__(self, directed=False):
        self.adj_list = defaultdict(list)
        self.directed = directed
    
    def add_edge(self, u, v, weight=1):
        self.adj_list[u].append((v, weight))
        if not self.directed:
            self.adj_list[v].append((u, weight))
    
    def dijkstra(self, source):
        dist = {node: float('inf') for node in self.adj_list}
        dist[source] = 0
        pq = [(0, source)]
        
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            for v, w in self.adj_list[u]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    heapq.heappush(pq, (dist[v], v))
        return dist

g = Graph()
g.add_edge('A', 'B', 4)
g.add_edge('A', 'C', 2)
g.add_edge('B', 'C', 1)
g.add_edge('B', 'D', 5)
g.add_edge('C', 'D', 8)
```

### BFS and DFS

```python
def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor, _ in graph.adj_list[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order

def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    order = [start]
    for neighbor, _ in graph.adj_list[start]:
        if neighbor not in visited:
            order.extend(dfs(graph, neighbor, visited))
    return order

print(f"BFS: {bfs(g, 'A')}")
print(f"DFS: {dfs(g, 'A')}")
```

### Maximum Flow (Ford-Fulkerson)

```python
def bfs_path(graph, source, sink, parent):
    visited = set([source])
    queue = deque([source])
    
    while queue:
        u = queue.popleft()
        for v, capacity in graph.adj_list[u]:
            if v not in visited and capacity > 0:
                visited.add(v)
                parent[v] = (u, capacity)
                queue.append(v)
                if v == sink:
                    return True
    return False

def max_flow(graph, source, sink):
    parent = {}
    max_flow = 0
    
    while bfs_path(graph, source, sink, parent):
        path_flow = float('inf')
        v = sink
        while v != source:
            u, capacity = parent[v]
            path_flow = min(path_flow, capacity)
            v = u
        
        max_flow += path_flow
        v = sink
        while v != source:
            u, capacity = parent[v]
            graph.update_edge(u, v, -path_flow)
            graph.update_edge(v, u, path_flow)
            v = u
    
    return max_flow
```

### PageRank

```python
def pagerank(adjacency_matrix, damping=0.85, max_iter=100, tol=1e-6):
    n = adjacency_matrix.shape[0]
    
    out_degree = adjacency_matrix.sum(axis=1, keepdims=True)
    transition = adjacency_matrix / np.where(out_degree > 0, out_degree, 1)
    
    pagerank = np.ones(n) / n
    
    for _ in range(max_iter):
        new_pagerank = damping * (transition.T @ pagerank) + (1 - damping) / n
        if np.linalg.norm(new_pagerank - pagerank) < tol:
            break
        pagerank = new_pagerank
    
    return pagerank

adj = np.array([[0, 1, 1], [1, 0, 1], [1, 1, 0]])
ranks = pagerank(adj)
print(f"PageRank: {ranks}")
```

### Community Detection (Louvain)

```python
def modularity(adjacency, community_labels):
    m = adjacency.sum() / 2
    n = len(community_labels)
    Q = 0
    for i in range(n):
        for j in range(n):
            if community_labels[i] == community_labels[j]:
                A_ij = adjacency[i, j]
                k_i = adjacency[i].sum()
                k_j = adjacency[j].sum()
                Q += (A_ij - k_i * k_j / (2 * m))
    return Q / (2 * m)

adjacency = np.array([
    [0, 1, 1, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 1, 1],
    [0, 0, 1, 0, 1],
    [0, 0, 1, 1, 0]
])

communities = [0, 0, 1, 1, 1]
mod = modularity(adjacency, communities)
print(f"Modularity: {mod:.4f}")
```

## Best Practices

1. **Graph Representation**: Use adjacency lists for sparse graphs
2. **Algorithm Selection**: Match algorithm to graph properties
3. **Memory Efficiency**: Consider sparse matrix formats
4. **Parallelization**: Some algorithms parallelize well
5. **Special Cases**: Trees, DAGs have specialized algorithms

## Common Patterns

```python
import heapq

# Dijkstra with path reconstruction
def dijkstra_with_path(graph, source, target):
    dist = {node: float('inf') for node in graph.adj_list}
    parent = {}
    dist[source] = 0
    pq = [(0, source)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == target:
            break
        for v, w in graph.adj_list[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                heapq.heappush(pq, (dist[v], v))
    
    path = []
    node = target
    while node is not None:
        path.append(node)
        node = parent.get(node)
    return dist[target], path[::-1]
```

## Core Competencies

1. Shortest path algorithms
2. Maximum flow computation
3. Graph connectivity analysis
4. Centrality and ranking algorithms
5. Community detection methods
