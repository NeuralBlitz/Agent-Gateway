---
name: unsupervised-learning
description: Unsupervised learning techniques
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Find patterns in unlabeled data
- Cluster similar data points
- Reduce data dimensionality
- Detect anomalies
- Learn representations
- Segment data populations

## When to use me

Use me when:
- Data has no labels
- Exploratory analysis needed
- Dimensionality reduction required
- Anomaly detection needed
- Customer segmentation
- Data compression

## Key Concepts

### Clustering Methods
```python
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score

# K-Means
kmeans = KMeans(n_clusters=3, random_state=42)
labels = kmeans.fit_predict(X)
centers = kmeans.cluster_centers_

# Find optimal k
silhouette_scores = []
for k in range(2, 10):
    kmeans = KMeans(n_clusters=k)
    score = silhouette_score(X, kmeans.fit_predict(X))
    silhouette_scores.append(score)

# DBSCAN (density-based)
dbscan = DBSCAN(eps=0.5, min_samples=5)
labels = dbscan.fit_predict(X)

# Hierarchical
hierarchical = AgglomerativeClustering(n_clusters=3)
labels = hierarchical.fit_predict(X)

# Gaussian Mixture (probabilistic)
gmm = GaussianMixture(n_components=3)
gmm.fit(X)
labels = gmm.predict(X)
probs = gmm.predict_proba(X)
```

### Dimensionality Reduction
```python
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.manifold import TSNE

# PCA
pca = PCA(n_components=0.95)  # 95% variance
X_pca = pca.fit_transform(X)

# t-SNE (visualization)
tsne = TSNE(n_components=2, perplexity=30)
X_tsne = tsne.fit_transform(X)

# SVD (sparse data)
svd = TruncatedSVD(n_components=100)
X_svd = svd.fit_transform(X)
```

### Anomaly Detection
```python
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor

# Isolation Forest
iso = IsolationForest(contamination=0.1)
outliers = iso.fit_predict(X)

# LOF
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.1)
outliers = lof.fit_predict(X)
```
