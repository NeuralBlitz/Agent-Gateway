---
name: Active Learning
category: data-science
description: Intelligently selecting which samples to label to maximize model performance with minimal annotation
---

# Active Learning

## What I do

I enable models to strategically select which unlabeled examples would be most informative to label next. By querying only the most valuable samples, I can achieve high performance with significantly fewer labels than random sampling. This is essential when labeling is expensive or time-consuming.

## When to use me

- Annotation budgets are limited and labels are expensive
- Building models for niche domains with limited expert availability
- Iteratively improving models in production systems
- Medical imaging where expert radiologists are scarce
- NLP tasks requiring expert linguistic annotation
- Speeding up initial model development cycle
- Continuous learning with human-in-the-loop feedback
- Domain adaptation with limited target domain labels

## Core Concepts

1. **Uncertainty Sampling**: Selecting examples where the model is most uncertain.

2. **Query Strategy**: The algorithm for selecting which samples to query.

3. **Pool-Based Active Learning**: Selecting from a large unlabeled pool.

4. **Stream-Based Active Learning**: Making sequential decisions as data arrives.

5. **Batch Active Learning**: Selecting multiple samples per iteration.

6. **Diversity Sampling**: Ensuring selected samples are representative.

7. **Expected Model Change**: Selecting samples that would most change the model.

8. **Acquisition Function**: The function that scores unlabeled examples.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class UncertaintySampling:
    def __init__(self, model):
        self.model = model
    
    def least_confidence(self, probs):
        confidence = probs.max(dim=1)[0]
        return 1 - confidence
    
    def margin_sampling(self, probs):
        sorted_probs, _ = probs.sort(dim=1, descending=True)
        margin = sorted_probs[:, 0] - sorted_probs[:, 1]
        return -margin
    
    def entropy(self, probs):
        return -(probs * torch.log(probs + 1e-10)).sum(dim=1)
    
    def query(self, unlabeled_loader, method="entropy", n_samples=10):
        self.model.eval()
        all_scores = []
        all_indices = []
        
        with torch.no_grad():
            for indices, data in unlabeled_loader:
                data = data.to(next(self.model.parameters()).device)
                logits = self.model(data)
                probs = F.softmax(logits, dim=1)
                
                if method == "least_confidence":
                    scores = self.least_confidence(probs)
                elif method == "margin":
                    scores = self.margin_sampling(probs)
                elif method == "entropy":
                    scores = self.entropy(probs)
                
                all_scores.extend(scores.cpu().numpy())
                all_indices.extend(indices.numpy())
        
        selected_indices = np.argsort(all_scores)[-n_samples:]
        
        return [all_indices[i] for i in selected_indices]
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.cluster import KMeans

class BatchActiveLearning:
    def __init__(self, model, device="cuda"):
        self.model = model
        self.device = device
    
    def query_bald(self, unlabeled_loader, n_samples=10, n_dropout=30):
        self.model.eval()
        
        all_entropy = []
        all_predictions = []
        
        with torch.no_grad():
            for indices, data in unlabeled_loader:
                data = data.to(self.device)
                
                dropout_probs = []
                for _ in range(n_dropout):
                    self.model.train()
                    prob = F.softmax(self.model(data), dim=1)
                    dropout_probs.append(prob)
                    self.model.eval()
                
                mean_prob = torch.stack(dropout_probs).mean(dim=0)
                
                entropy_mean = -(mean_prob * torch.log(mean_prob + 1e-10)).sum(dim=1)
                
                entropy_dropout = -(dropout_probs * torch.log(dropout_probs + 1e-10)).sum(dim=2).mean(dim=0)
                
                bald_score = entropy_mean - entropy_dropout
                
                all_entropy.extend(bald_score.cpu().numpy())
                all_predictions.extend(mean_prob.cpu().numpy())
        
        selected_indices = np.argsort(all_entropy)[-n_samples:]
        
        return selected_indices.tolist()
    
    def query_core_set(self, embeddings, n_samples=10):
        n_samples = min(n_samples, len(embeddings))
        
        kmeans = KMeans(n_clusters=n_samples, random_state=42).fit(embeddings)
        
        cluster_centers = kmeans.cluster_centers_
        
        distances = np.linalg.norm(embeddings - cluster_centers[kmeans.labels_], axis=1)
        
        selected_indices = np.argsort(distances)[-n_samples:]
        
        return selected_indices.tolist()
    
    def query_diverse_batch(self, features, probs, n_samples=10, temperature=0.5):
        uncertainty = -(probs * torch.log(probs + 1e-10)).sum(dim=1).cpu().numpy()
        
        indices = np.arange(len(features))
        
        selected = []
        while len(selected) < n_samples:
            remaining = [i for i in indices if i not in selected]
            
            if len(selected) == 0:
                best = remaining[np.argmax([uncertainty[i] for i in remaining])]
                selected.append(best)
            else:
                best_score = -np.inf
                best_idx = None
                
                for i in remaining:
                    diversity = min([np.linalg.norm(features[i] - features[s]) for s in selected])
                    combined = (1 - temperature) * uncertainty[i] + temperature * diversity
                    
                    if combined > best_score:
                        best_score = combined
                        best_idx = i
                
                selected.append(best_idx)
        
        return selected
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.metrics import pairwise_distances

class QueryByCommittee:
    def __init__(self, n_models=5):
        self.models = []
        self.n_models = n_models
    
    def fit(self, train_loader):
        for i in range(self.n_models):
            model = self._create_model()
            
            self._train_with_bootstrap(model, train_loader, seed=i)
            self.models.append(model)
    
    def query(self, unlabeled_loader, n_samples=10):
        all_disagreements = []
        all_indices = []
        
        with torch.no_grad():
            for indices, data in unlabeled_loader:
                data = data.to(next(self.models[0].parameters()).device)
                
                predictions = []
                for model in self.models:
                    logits = model(data)
                    probs = F.softmax(logits, dim=1)
                    predictions.append(probs)
                
                predictions = torch.stack(predictions)
                
                mean_pred = predictions.mean(dim=0)
                variance = ((predictions - mean_pred) ** 2).mean(dim=0)
                
                disagreement = variance.sum(dim=1)
                
                all_disagreements.extend(disagreement.cpu().numpy())
                all_indices.extend(indices.numpy())
        
        selected_indices = np.argsort(all_disagreements)[-n_samples:]
        
        return [all_indices[i] for i in selected_indices]
```

```python
import numpy as np
from scipy.spatial.distance import cdist

class ExpectedModelChange:
    def __init__(self, model, unlabeled_loader):
        self.model = model
        self.unlabeled_loader = unlabeled_loader
    
    def compute_gradients(self, x, y):
        self.model.train()
        logits = self.model(x)
        loss = F.cross_entropy(logits, y)
        grads = torch.autograd.grad(loss, self.model.parameters())
        
        return torch.cat([g.view(-1) for g in grads])
    
    def query_egramma(self, labeled_loader, n_samples=10):
        self.model.eval()
        
        emc_scores = []
        all_indices = []
        
        with torch.no_grad():
            for indices, data in unlabeled_loader:
                data = data.to(next(self.model.parameters()).device)
                logits = self.model(data)
                probs = F.softmax(logits, dim=1)
                
                expected_grad_norm = torch.zeros(len(data))
                
                for i in range(len(data)):
                    p = probs[i]
                    expected_grad = torch.zeros_like(p)
                    for c in range(len(p)):
                        y_onehot = torch.zeros_like(p)
                        y_onehot[c] = 1.0
                        grad = self.compute_gradients(data[i:i+1], y_onehot)
                        expected_grad[c] = grad.norm()
                    
                    expected_grad_norm[i] = expected_grad.mean()
                
                emc_scores.extend(expected_grad_norm.cpu().numpy())
                all_indices.extend(indices.numpy())
        
        selected_indices = np.argsort(emc_scores)[-n_samples:]
        
        return [all_indices[i] for i in selected_indices]
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from scipy.stats import pearsonr

class ActiveLearningLoop:
    def __init__(self, model, unlabeled_dataset, initial_batch_size=100, query_batch_size=20):
        self.model = model
        self.unlabeled_dataset = unlabeled_dataset
        self.initial_batch_size = initial_batch_size
        self.query_batch_size = query_batch_size
        
        self.labeled_indices = set()
        self.unlabeled_indices = set(range(len(unlabeled_dataset)))
        
        self.sampler = UncertaintySampling(model)
    
    def select_initial_batch(self):
        indices = np.random.choice(
            list(self.unlabeled_indices),
            self.initial_batch_size,
            replace=False
        )
        
        for idx in indices:
            self.labeled_indices.add(idx)
            self.unlabeled_indices.discard(idx)
        
        return list(indices)
    
    def query_next_batch(self, unlabeled_loader, method="entropy"):
        if len(self.unlabeled_indices) < self.query_batch_size:
            return list(self.unlabeled_indices)
        
        selected = self.sampler.query(unlabeled_loader, method, self.query_batch_size)
        
        for idx in selected:
            if idx in self.unlabeled_indices:
                self.labeled_indices.add(idx)
                self.unlabeled_indices.discard(idx)
        
        return selected
    
    def train(self, train_loader, epochs=10):
        self.model.train()
        
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        
        for epoch in range(epochs):
            for x, y in train_loader:
                optimizer.zero_grad()
                logits = self.model(x)
                loss = F.cross_entropy(logits, y)
                loss.backward()
                optimizer.step()
        
        return self.model
    
    def evaluate(self, test_loader):
        self.model.eval()
        
        correct = 0
        total = 0
        
        with torch.no_grad():
            for x, y in test_loader:
                logits = self.model(x)
                predictions = logits.argmax(dim=1)
                correct += (predictions == y).sum().item()
                total += y.size(0)
        
        return correct / total
```

## Best Practices

1. Start with a diverse initial labeled set rather than random samples.

2. Use batch query strategies to avoid selecting similar samples.

3. Combine uncertainty and diversity for more robust selection.

4. Monitor learning curves to detect diminishing returns.

5. Use model ensembles for more stable uncertainty estimates.

6. Apply temperature scaling before computing uncertainty.

7. Consider computational cost of querying and training together.

8. Use warm start models for faster convergence per iteration.

9. Validate query strategies on small test sets before deployment.

10. Balance exploration and exploitation in query selection.
