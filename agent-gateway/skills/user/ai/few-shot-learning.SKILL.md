---
name: Few-Shot Learning
category: ai
description: Learning from a small number of examples per class using metric learning and meta-learning
---

# Few-Shot Learning

## What I do

I enable models to recognize new categories from only a handful of examples by learning to learn efficiently. I leverage meta-learning approaches that train models on many related tasks to develop representations and learning strategies that transfer to new tasks with minimal data. This is essential for applications where labeling data is expensive or impractical.

## When to use me

- Recognizing new object categories from just 1-5 examples
- Rapidly adapting models to new domains with limited data
- Personalized recommendation systems with few user interactions
- Medical diagnosis where rare conditions have few examples
- Edge deployment where collecting large datasets is impractical
- Dynamic categorization systems that must handle novel classes
- Low-resource language processing tasks

## Core Concepts

1. **N-Way K-Shot Classification**: Standard benchmark format with N novel classes and K training examples per class.

2. **Episode-Based Training**: Training on many small " episodes" that simulate the few-shot evaluation setting.

3. **Prototypical Networks**: Learning class prototypes as mean embeddings of support set examples.

4. **Matching Networks**: Using attention over support set to classify query examples.

5. **Model-Agnostic Meta-Learning (MAML)**: Learning initial weights that can quickly adapt to new tasks.

6. **Relation Networks**: Learning a learned distance metric rather than using predefined metrics.

7. **Task Distribution**: The distribution of tasks the meta-learner is trained on.

8. **Support and Query Sets**: The few labeled examples and unlabeled test examples within each episode.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, List

class PrototypicalNetwork(nn.Module):
    def __init__(self, encoder_dim=64):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        self.proto_dim = 64
    
    def forward(self, support: torch.Tensor, query: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        support_emb = self.encoder(support)
        query_emb = self.encoder(query)
        
        prototypes = self._compute_prototypes(support_emb)
        logits = self._compute_logits(query_emb, prototypes)
        
        return logits, prototypes
    
    def _compute_prototypes(self, support_emb: torch.Tensor) -> torch.Tensor:
        n, c, h, w = support_emb.shape
        support_emb = support_emb.view(n, -1)
        
        class_examples = support_emb.view(self.n_way, self.k_shot, -1).mean(dim=1)
        return class_examples
    
    def _compute_logits(self, query_emb: torch.Tensor, prototypes: torch.Tensor) -> torch.Tensor:
        query_emb = query_emb.view(query_emb.size(0), -1)
        dists = self._euclidean_distance(query_emb, prototypes)
        return -dists
    
    def _euclidean_distance(self, a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
        n = a.size(0)
        m = b.size(0)
        a = a.unsqueeze(1).expand(n, m, -1)
        b = b.unsqueeze(0).expand(n, m, -1)
        return ((a - b) ** 2).sum(dim=2)

def episodic_training(model, optimizer, epochs, n_way, k_shot, query_samples, episodes_per_epoch=100):
    model.train()
    
    for epoch in range(epochs):
        total_loss = 0.0
        
        for _ in range(episodes_per_epoch):
            support, query, labels = sample_episode(n_way, k_shot, query_samples)
            
            logits, _ = model(support, query)
            
            loss = F.cross_entropy(logits, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        avg_loss = total_loss / episodes_per_epoch
        print(f"Epoch {epoch+1}: Avg Loss = {avg_loss:.4f}")
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MatchingNetwork(nn.Module):
    def __init__(self, encoder_dim=64, attention_fn="cosine"):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        self.attention_fn = attention_fn
        self.fce = nn.Linear(64, 64)
    
    def forward(self, support: torch.Tensor, support_labels: torch.Tensor,
                query: torch.Tensor) -> torch.Tensor:
        support_emb = self.encoder(support)
        query_emb = self.encoder(query)
        
        attention = self._attention(support_emb, query_emb)
        
        logits = torch.matmul(attention, F.one_hot(support_labels, num_classes=5).float())
        return logits
    
    def _attention(self, support_emb: torch.Tensor, query_emb: torch.Tensor) -> torch.Tensor:
        if self.attention_fn == "cosine":
            support_emb = F.normalize(support_emb, p=2, dim=1)
            query_emb = F.normalize(query_emb, p=2, dim=1)
            similarities = torch.mm(query_emb, support_emb.t())
        elif self.attention_fn == "dot":
            similarities = torch.mm(query_emb, support_emb.t())
        
        attention = F.softmax(similarities, dim=1)
        return attention

class RelationNetwork(nn.Module):
    def __init__(self, encoder_dim=64, hidden_dim=128):
        super().__init__()
        self.embedding_fn = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        
        self.relation_fn = nn.Sequential(
            nn.Linear(128, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
    
    def forward(self, support: torch.Tensor, query: torch.Tensor) -> torch.Tensor:
        support_emb = self.embedding_fn(support)
        query_emb = self.embedding_fn(query)
        
        batch_size = query_emb.size(0)
        n_support = support_emb.size(0)
        
        support_exp = support_emb.unsqueeze(0).expand(batch_size, n_support, -1, -1, -1)
        query_exp = query_emb.unsqueeze(1).expand(-1, n_support, -1, -1, -1)
        
        relation_input = torch.cat([support_exp, query_exp], dim=2)
        relation_input = relation_input.view(batch_size * n_support, -1)
        
        relations = self.relation_fn(relation_input)
        relations = relations.view(batch_size, n_support)
        
        return relations
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MAML(nn.Module):
    def __init__(self, model_fn, lr_inner=0.01, lr_outer=0.001):
        super().__init__()
        self.model = model_fn()
        self.lr_inner = lr_inner
        self.lr_outer = lr_outer
    
    def forward(self, x):
        return self.model(x)
    
    def adapt(self, support: torch.Tensor, support_labels: torch.Tensor,
             second_order: bool = False):
        fast_weights = {name: param.clone() for name, param in self.model.named_parameters()}
        
        logits = self._forward_with_weights(support, fast_weights)
        loss = F.cross_entropy(logits, support_labels)
        
        grads = torch.autograd.grad(loss, fast_weights.values(), create_graph=second_order)
        
        fast_weights = {
            name: param - self.lr_inner * grad
            for (name, param), grad in zip(fast_weights.items(), grads)
        }
        
        return fast_weights
    
    def meta_update(self, fast_weights_list, query_labels_list, outer_batch_size=5):
        total_loss = 0.0
        
        for fast_weights, query_labels in zip(fast_weights_list, query_labels_list):
            logits = self._forward_with_weights(self.query, fast_weights)
            total_loss += F.cross_entropy(logits, query_labels)
        
        avg_loss = total_loss / outer_batch_size
        
        grads = torch.autograd.grad(avg_loss, self.model.parameters())
        self.optimizer.step()
        
        return avg_loss.item()
    
    def _forward_with_weights(self, x, weights):
        x = F.conv2d(x, weights['model.0.weight'], weights['model.0.bias'])
        x = F.relu(F.max_pool2d(x, 2))
        return x

class SimpleCNN(nn.Module):
    def __init__(self, num_ways=5):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        self.classifier = nn.Linear(64, num_ways)
    
    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)
```

```python
import random
import torch
from typing import Tuple, List, Dict

class FewShotDataset:
    def __init__(self, dataset, num_classes):
        self.dataset = dataset
        self.class_indices = self._get_class_indices()
        self.num_classes = num_classes
    
    def _get_class_indices(self) -> Dict[int, List[int]]:
        class_indices = {}
        for idx, label in enumerate(self.dataset.targets):
            if label not in class_indices:
                class_indices[label] = []
            class_indices[label].append(idx)
        return class_indices
    
    def sample_episode(self, n_way: int, k_shot: int, query_samples: int = 15
                      ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        classes = random.sample(list(self.class_indices.keys()), n_way)
        
        support_indices = []
        query_indices = []
        
        for i, cls in enumerate(classes):
            indices = self.class_indices[cls]
            sample_indices = random.sample(indices, k_shot + query_samples)
            
            support_indices.extend(sample_indices[:k_shot])
            query_indices.extend(sample_indices[k_shot:k_shot + query_samples])
        
        support_set = torch.stack([self.dataset[i][0] for i in support_indices])
        query_set = torch.stack([self.dataset[i][0] for i in query_indices])
        
        query_labels = torch.cat([
            torch.full((query_samples,), i, dtype=torch.long)
            for i in range(n_way)
        ])
        
        return support_set, query_set, query_labels

def evaluate_few_shot(model, dataset, n_way: int, k_shot: int,
                      num_episodes: int = 500) -> float:
    model.eval()
    
    total_correct = 0
    total_samples = 0
    
    for _ in range(num_episodes):
        support, query, labels = dataset.sample_episode(n_way, k_shot)
        
        with torch.no_grad():
            logits, _ = model(support, query)
            predictions = logits.argmax(dim=1)
        
        total_correct += (predictions == labels).sum().item()
        total_samples += labels.size(0)
    
    accuracy = total_correct / total_samples
    print(f"{n_way}-Way {k_shot}-Shot Accuracy: {accuracy:.4f}")
    return accuracy
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ProtoNetWithRelation(nn.Module):
    def __init__(self, encoder_dim=64, hidden_dim=128):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten()
        )
        
        self.relation_head = nn.Sequential(
            nn.Linear(128, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        )
    
    def forward(self, support: torch.Tensor, query: torch.Tensor,
                n_way: int, k_shot: int) -> torch.Tensor:
        support_emb = self.encoder(support)
        query_emb = self.encoder(query)
        
        prototypes = support_emb.view(n_way, k_shot, -1).mean(dim=1)
        
        prototypes_exp = prototypes.unsqueeze(0).expand(query_emb.size(0), n_way, -1)
        query_exp = query_emb.unsqueeze(1).expand(-1, n_way, -1)
        
        relations = torch.cat([prototypes_exp, query_exp], dim=2)
        relations = relations.view(relations.size(0) * n_way, -1)
        
        relations = self.relation_head(relations)
        relations = relations.view(query_emb.size(0), n_way)
        
        return relations

class FEAT(nn.Module):
    def __init__(self, encoder_dim=64, num_ways=5, eps=1e-10):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        self.num_ways = num_ways
        self.eps = eps
    
    def forward(self, support: torch.Tensor, query: torch.Tensor,
                support_labels: torch.Tensor) -> torch.Tensor:
        support_emb = self.encoder(support)
        query_emb = self.encoder(query)
        
        proto = self._compute_prototypes(support_emb, support_labels)
        
        attn_query = self._scale_attention(query_emb, proto)
        transformed_query = proto + attn_query
        
        dists = -self._euclidean_distance(F.normalize(transformed_query, dim=-1),
                                           F.normalize(proto, dim=-1))
        
        return dists
    
    def _scale_attention(self, query_emb: torch.Tensor,
                        prototypes: torch.Tensor) -> torch.Tensor:
        attn = torch.matmul(F.normalize(query_emb), F.normalize(prototypes).t())
        attn = F.softmax(attn + self.eps, dim=-1)
        adjusted = torch.matmul(attn, prototypes)
        return query_emb + 0.5 * adjusted
    
    def _compute_prototypes(self, support_emb: torch.Tensor,
                           support_labels: torch.Tensor) -> torch.Tensor:
        one_hot = F.one_hot(support_labels, self.num_ways).float()
        counts = one_hot.sum(dim=0, keepdim=True)
        summed = torch.matmul(one_hot.t(), support_emb)
        return summed / (counts.t() + self.eps)
```

## Best Practices

1. Use episode-based training that mirrors the evaluation setting (same N-way K-shot structure).

2. Apply data augmentation to support set examples to improve generalization.

3. Use appropriate distance metrics (Euclidean for prototypes, cosine for embeddings).

4. Balance the number of support and query examples per episode.

5. Use higher learning rates for inner loop adaptation in MAML.

6. Monitor both support and query accuracy during training to detect overfitting.

7. Use feature normalization to ensure fair distance comparisons across classes.

8. Start with simple methods (Prototypical Networks) before moving to complex ones.

9. Ensure the training task distribution matches the evaluation distribution.

10. Use regularization (dropout, weight decay) to prevent overfitting to few examples.
