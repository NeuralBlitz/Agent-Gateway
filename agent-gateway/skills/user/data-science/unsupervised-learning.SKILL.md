---
name: Unsupervised Learning
category: data-science
description: Discovering hidden patterns in data without labeled examples using clustering and dimensionality reduction
---

# Unsupervised Learning

## What I do

I enable machines to discover structure and patterns in data without explicit labels. I group similar data points together, reduce data complexity, and reveal underlying structures that aren't immediately apparent. My techniques are essential for exploratory data analysis, anomaly detection, and preprocessing for downstream tasks.

## When to use me

- Exploring data to discover natural groupings and structures
- Reducing dimensionality of high-dimensional datasets for visualization
- Detecting anomalies or outliers in data
- Customer segmentation for marketing strategies
- Image compression and feature extraction
- Preprocessing unlabeled data for supervised learning
- Document clustering and topic discovery
- Gene expression analysis in bioinformatics

## Core Concepts

1. **Clustering**: Grouping similar data points together based on distance or similarity metrics.

2. **Dimensionality Reduction**: Transforming high-dimensional data into lower-dimensional representations.

3. **Density Estimation**: Learning the probability distribution of the data.

4. **Anomaly Detection**: Identifying data points that deviate significantly from the norm.

5. **Cluster Validity**: Metrics to evaluate the quality of clustering results.

6. **Silhouette Score**: Measuring how similar points are to their own cluster vs. other clusters.

7. **Elbow Method**: Finding optimal cluster count by looking at within-cluster variance.

8. **Manifold Learning**: Capturing non-linear structures in high-dimensional data.

## Code Examples

```python
import numpy as np
from scipy.spatial.distance import cdist
from collections import defaultdict

class KMeans:
    def __init__(self, n_clusters=3, max_iters=300, tol=1e-4):
        self.n_clusters = n_clusters
        self.max_iters = max_iters
        self.tol = tol
        self.centroids = None
        self.labels = None
    
    def fit(self, X):
        n_samples, n_features = X.shape
        
        indices = np.random.choice(n_samples, self.n_clusters, replace=False)
        self.centroids = X[indices].copy()
        
        for _ in range(self.max_iters):
            distances = cdist(X, self.centroids)
            self.labels = np.argmin(distances, axis=1)
            
            new_centroids = np.zeros_like(self.centroids)
            for i in range(self.n_clusters):
                cluster_points = X[self.labels == i]
                if len(cluster_points) > 0:
                    new_centroids[i] = cluster_points.mean(axis=0)
            
            shift = np.linalg.norm(new_centroids - self.centroids)
            self.centroids = new_centroids
            
            if shift < self.tol:
                break
        
        return self
    
    def predict(self, X):
        distances = cdist(X, self.centroids)
        return np.argmin(distances, axis=1)

class HierarchicalClustering:
    def __init__(self, n_clusters=3, linkage="ward"):
        self.n_clusters = n_clusters
        self.linkage = linkage
        self.children = None
        self.distances = None
    
    def fit(self, X):
        n = len(X)
        self.children = np.arange(n)
        self.distances = np.zeros(n - 1)
        
        clusters = {i: X[i:i+1] for i in range(n)}
        
        for k in range(n - self.n_clusters):
            min_dist = float('inf')
            to_merge = None
            
            cluster_ids = list(clusters.keys())
            for i in range(len(cluster_ids)):
                for j in range(i + 1, len(cluster_ids)):
                    dist = self._linkage_distance(clusters[cluster_ids[i]], 
                                                  clusters[cluster_ids[j]])
                    if dist < min_dist:
                        min_dist = dist
                        to_merge = (cluster_ids[i], cluster_ids[j])
            
            c1, c2 = to_merge
            merged = np.vstack([clusters[c1], clusters[c2]])
            
            new_id = n + k
            clusters[new_id] = merged
            del clusters[c1], clusters[c2]
            
            self.children[k] = np.array([c1, c2])
            self.distances[k] = min_dist
        
        return self
    
    def _linkage_distance(self, A, B):
        if self.linkage == "ward":
            nA, nB = len(A), len(B)
            centroid_A = A.mean(axis=0)
            centroid_B = B.mean(axis=0)
            return np.sqrt(nA * nB / (nA + nB)) * np.linalg.norm(centroid_A - centroid_B)
        elif self.linkage == "complete":
            return cdist(A, B).max()
        elif self.linkage == "average":
            return cdist(A, B).mean()
        return cdist(A, B).min()
    
    def get_cluster_labels(self):
        n = len(self.children) + self.n_clusters
        labels = np.zeros(n, dtype=np.int64)
        next_label = 0
        
        def assign(cluster_id, label):
            if cluster_id < len(self.children):
                c1, c2 = self.children[cluster_id]
                assign(c1, label)
                assign(c2, label)
            else:
                labels[cluster_id - len(self.children)] = label
        
        for i in range(self.n_clusters):
            assign(len(self.children) - 1 - i, next_label)
            next_label += 1
        
        return labels
```

```python
import numpy as np

class DBSCAN:
    def __init__(self, eps=0.5, min_samples=5, metric="euclidean"):
        self.eps = eps
        self.min_samples = min_samples
        self.metric = metric
        self.labels = None
    
    def fit(self, X):
        n = len(X)
        self.labels = np.full(n, -1)
        core_indices = set()
        
        for i in range(n):
            if i in core_indices:
                continue
            
            neighbors = self._region_query(X, i)
            
            if len(neighbors) < self.min_samples:
                self.labels[i] = -1
            else:
                self._expand_cluster(X, i, neighbors, len(core_indices))
                core_indices.add(i)
        
        return self
    
    def _region_query(self, X, idx):
        distances = cdist([X[idx]], X, self.metric)[0]
        return set(np.where(distances <= self.eps)[0])
    
    def _expand_cluster(self, X, idx, neighbors, cluster_id):
        self.labels[idx] = cluster_id
        
        queue = list(neighbors - {idx})
        
        while queue:
            current = queue.pop(0)
            
            if self.labels[current] == -2:
                self.labels[current] = cluster_id
            elif self.labels[current] != -1:
                continue
            
            current_neighbors = self._region_query(X, current)
            
            if len(current_neighbors) >= self.min_samples:
                for neighbor in current_neighbors:
                    if neighbor not in neighbors:
                        queue.append(neighbor)
                neighbors.update(current_neighbors)

class OPTICS:
    def __init__(self, eps=0.5, min_samples=5):
        self.eps = eps
        self.min_samples = min_samples
        self.reachability = None
        self.ordering = None
    
    def fit(self, X):
        n = len(X)
        self.ordering = []
        self.reachability = np.zeros(n)
        
        processed = np.zeros(n, dtype=bool)
        core_distances = np.zeros(n)
        
        for i in range(n):
            if not processed[i]:
                if len(self.ordering) > 0:
                    seeds = self._get_seeds(X, i, processed)
                    core_distances[i] = self._core_distance(X, i, seeds)
                else:
                    core_distances[i] = 0
        
        for i in range(n):
            unprocessed = np.where(~processed)[0]
            if len(unprocessed) == 0:
                break
            
            idx = unprocessed[np.argmax(core_distances[unprocessed])]
            processed[idx] = True
            self.ordering.append(idx)
            
            neighbors = self._get_neighbors(X, idx)
            for neighbor in neighbors:
                processed[neighbor] = True
                core_dist = self._core_distance(X, neighbor, neighbors)
                core_distances[neighbor] = min(core_dist, core_distances[idx])
                self.reachability[neighbor] = core_distances[neighbor]
        
        return self
    
    def _get_neighbors(self, X, idx):
        distances = cdist([X[idx]], X)[0]
        return set(np.where(distances <= self.eps)[0])
    
    def _core_distance(self, X, idx, neighbors):
        if len(neighbors) < self.min_samples:
            return -1
        distances = cdist([X[idx]], X[list(neighbors)])[0]
        return np.sort(distances)[self.min_samples - 1]
```

```python
import numpy as np

class PCA:
    def __init__(self, n_components=2):
        self.n_components = n_components
        self.components = None
        self.mean = None
        self.explained_variance = None
    
    def fit(self, X):
        self.mean = X.mean(axis=0)
        X_centered = X - self.mean
        
        cov = np.cov(X_centered.T)
        
        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        
        sorted_idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[sorted_idx]
        eigenvectors = eigenvectors[:, sorted_idx]
        
        self.components = eigenvectors[:, :self.n_components]
        self.explained_variance = eigenvalues[:self.n_components]
        
        return self
    
    def transform(self, X):
        X_centered = X - self.mean
        return X_centered @ self.components
    
    def fit_transform(self, X):
        self.fit(X)
        return self.transform(X)

class KernelPCA:
    def __init__(self, n_components=2, kernel="rbf", gamma=1.0):
        self.n_components = n_components
        self.kernel = kernel
        self.gamma = gamma
        self.alphas = None
        self.lambdas = None
        self.X_train = None
    
    def _kernel_matrix(self, X):
        n = len(X)
        K = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i, n):
                if self.kernel == "rbf":
                    d = np.linalg.norm(X[i] - X[j]) ** 2
                    K[i, j] = K[j, i] = np.exp(-self.gamma * d)
                elif self.kernel == "linear":
                    K[i, j] = K[j, i] = X[i] @ X[j]
        
        return K
    
    def fit(self, X):
        self.X_train = X
        K = self._kernel_matrix(X)
        
        n = len(X)
        ones = np.ones((n, n)) / n
        K_centered = K - ones @ K - K @ ones + ones @ K @ ones
        
        eigenvalues, eigenvectors = np.linalg.eigh(K_centered)
        sorted_idx = np.argsort(eigenvalues)[::-1]
        
        self.lambdas = eigenvalues[sorted_idx][:self.n_components]
        self.alphas = eigenvectors[:, sorted_idx][:self.n_components].T
        
        return self
    
    def transform(self, X):
        K_new = np.array([[self._kernel(X[i], x) for x in self.X_train] 
                          for i in range(len(X))])
        
        n = len(X)
        ones = np.ones((n, len(self.X_train))) / len(self.X_train)
        K_new_centered = K_new - ones @ self._kernel_matrix(self.X_train) - \
                        K_new @ np.ones((len(self.X_train), len(self.X_train))) / len(self.X_train)
        
        return K_new_centered @ self.alphas.T / np.sqrt(self.lambdas)
    
    def _kernel(self, x, y):
        if self.kernel == "rbf":
            d = np.linalg.norm(x - y) ** 2
            return np.exp(-self.gamma * d)
        return x @ y
```

```python
import numpy as np

class Autoencoder:
    def __init__(self, input_dim, hidden_dims=[256, 128, 64]):
        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        
        self.encoder_layers = []
        self.decoder_layers = []
        
        dims = [input_dim] + hidden_dims
        for i in range(len(dims) - 1):
            self.encoder_layers.append(nn.Linear(dims[i], dims[i+1]))
            self.decoder_layers.insert(0, nn.Linear(dims[i+1], dims[i]))
        
        self.encoder = nn.Sequential(*self.encoder_layers + [nn.Tanh()])
        self.decoder = nn.Sequential(*self.decoder_layers)
    
    def forward(self, x):
        encoded = self.encode(x)
        return self.decode(encoded)
    
    def encode(self, x):
        return self.encoder(x)
    
    def decode(self, z):
        return self.decoder(z)

class tSNE:
    def __init__(self, perplexity=30, n_components=2, max_iters=1000, learning_rate=200):
        self.perplexity = perplexity
        self.n_components = n_components
        self.max_iters = max_iters
        self.learning_rate = learning_rate
        self.P = None
        self.Y = None
    
    def fit_transform(self, X):
        n = len(X)
        self.Y = np.random.randn(n, self.n_components)
        
        self.P = self._compute_joint_probabilities(X)
        
        for t in range(self.max_iters):
            dY = self._compute_gradient(self.Y, self.P)
            self.Y -= self.learning_rate * dY
            
            if t % 100 == 0:
                print(f"Iteration {t}")
        
        return self.Y
    
    def _compute_joint_probabilities(self, X):
        n = len(X)
        D = cdist(X, X, 'sqeuclidean')
        
        P = np.zeros((n, n))
        for i in range(n):
            Di = D[i, np.concatenate((np.arange(i), np.arange(i+1, n)))]
            target_entropy = np.log(self.perplexity)
            
            beta = 1.0
            beta_min = -np.inf
            beta_max = np.inf
            
                H, P_i = self._binary_search(Di, beta, target_entropy)
                P[i, np.concatenate((np.arange(i), np.arange(i+1, n)))] = P_i
        
        P = (P + P.T) / (2 * n)
        P = np.maximum(P, 1e-12)
        return P
    
    def _binary_search(self, Di, beta, target_entropy):
        beta_min = -np.inf
        beta_max = np.inf
        P_i = np.zeros(len(Di))
        
        for _ in range(50):
            P_i = np.exp(-Di * beta)
            P_i[np.isinf(P_i)] = 0
            
            sum_Pi = P_i.sum() + 1e-12
            H = np.log(sum_Pi) + beta * np.sum(Di * P_i) / sum_Pi
            
            if abs(H - target_entropy) < 1e-5:
                break
            
            if H < target_entropy:
                beta_min = beta
            else:
                beta_max = beta
            
            beta = (beta_min + beta_max) / 2
        
        P_i = P_i / (P_i.sum() + 1e-12)
        return H, P_i
    
    def _compute_gradient(self, Y, P):
        n = dY.shape[0]
        dY = np.zeros_like(Y)
        
        Q = self._compute_q_distribution(Y)
        
        for i in range(n):
            dY[i] = 4 * np.sum((P[i, :, np.newaxis] - Q[i, :, np.newaxis]) * (Y[i] - Y), axis=0)
        
        return dY
    
    def _compute_q_distribution(self, Y):
        D = cdist(Y, Y, 'sqeuclidean')
        Q = np.exp(-D)
        np.fill_diagonal(Q, 0)
        Q = Q / (Q.sum() + 1e-12)
        return np.maximum(Q, 1e-12)
```

```python
import numpy as np
from sklearn.metrics import silhouette_score, calinski_harabasz_score

class ClusterValidator:
    def __init__(self):
        self.metrics = {}
    
    def compute_silhouette(self, X, labels):
        if len(np.unique(labels)) > 1:
            return silhouette_score(X, labels)
        return 0
    
    def compute_calinski_harabasz(self, X, labels):
        if len(np.unique(labels)) > 1:
            return calinski_harabasz_score(X, labels)
        return 0
    
    def compute_davies_bouldin(self, X, labels):
        n_clusters = len(np.unique(labels))
        if n_clusters < 2:
            return float('inf')
        
        cluster_centers = np.array([X[labels == i].mean(axis=0) for i in range(n_clusters)])
        cluster_spreads = np.array([X[labels == i].std(axis=0).mean() for i in range(n_clusters)])
        
        R = np.zeros((n_clusters, n_clusters))
        for i in range(n_clusters):
            for j in range(n_clusters):
                if i != j:
                    d = np.linalg.norm(cluster_centers[i] - cluster_centers[j])
                    R[i, j] = (cluster_spreads[i] + cluster_spreads[j]) / d
        
        return np.mean([R[i].max() for i in range(n_clusters)])
    
    def evaluate(self, X, labels):
        return {
            "silhouette": self.compute_silhouette(X, labels),
            "calinski_harabasz": self.compute_calinski_harabasz(X, labels),
            "davies_bouldin": self.compute_davies_bouldin(X, labels)
        }

def find_optimal_clusters(X, max_k=10):
    inertias = []
    silhouettes = []
    
    for k in range(2, max_k + 1):
        kmeans = KMeans(n_clusters=k)
        kmeans.fit(X)
        inertias.append(kmeans.inertia_)
        silhouettes.append(silhouette_score(X, kmeans.labels))
    
    elbow_point = find_elbow(inertias)
    best_k = silhouettes.index(max(silhouettes)) + 2
    
    return elbow_point, best_k, inertias, silhouettes

def find_elbow(inertias):
    if len(inertias) < 3:
        return len(inertias)
    
    line_from = np.array([0, inertias[0]])
    line_to = np.array([len(inertias) - 1, inertias[-1]])
    
    distances = []
    for i, inertia in enumerate(inertias):
        p = np.array([i, inertia])
        d = np.abs(np.cross(line_to - line_from, p - line_from)) / np.linalg.norm(line_to - line_from)
        distances.append(d)
    
    return np.argmax(distances) + 2
```

## Best Practices

1. Standardize or normalize data before applying distance-based clustering algorithms.

2. Use multiple validation metrics (silhouette, CH index) to evaluate clustering quality.

3. Apply dimensionality reduction for visualization and computational efficiency.

4. Use the elbow method or silhouette analysis to determine optimal cluster count.

5. Consider data characteristics (density, shape) when choosing algorithms.

6. Handle outliers appropriately as they can significantly affect clustering results.

7. Use sampling for large datasets as many algorithms scale poorly.

8. Validate clusters on holdout data when possible to assess generalization.

9. Consider hierarchical clustering for exploring multi-scale structures.

10. Use domain knowledge to validate that discovered clusters make sense.
