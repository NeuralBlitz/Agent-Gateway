---
name: Meta-Learning
category: data-science
description: Learning to learn by acquiring knowledge across multiple tasks that transfers to new tasks
---

# Meta-Learning

## What I do

I enable models to learn how to learn by extracting knowledge from multiple related tasks. Rather than optimizing for a single task, I learn representations and optimization strategies that allow rapid adaptation to new tasks with minimal data. This is fundamental for building systems that can generalize across diverse problems.

## When to use me

- Building models that can quickly adapt to new tasks with few examples
- Learning from multiple related tasks to improve sample efficiency
- Few-shot image classification and recognition
- Rapid policy learning for reinforcement learning
- Hyperparameter optimization and neural architecture search
- Learning to learn across different domains
-冷启动 recommendation systems
- Adaptive data selection and curriculum design

## Core Concepts

1. **Task Distribution**: The distribution of tasks from which meta-learning occurs.

2. **Episode**: A single meta-training iteration containing support and query sets.

3. **Meta-Loss**: The loss computed over query set performance after adaptation.

4. **Task-Agnostic Parameters**: Parameters that encode useful knowledge across tasks.

5. **Adaptation Steps**: The number of gradient steps taken before evaluating on query set.

6. **Support Set**: The small labeled set used for task-specific adaptation.

7. **Query Set**: The unlabeled or labeled set used to compute meta-loss.

8. **Gradient-Based Meta-Learning**: Methods that learn initializations amenable to quick adaptation.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MAML(nn.Module):
    def __init__(self, model_fn, inner_lr=0.01, outer_lr=0.001):
        super().__init__()
        self.model = model_fn()
        self.inner_lr = inner_lr
        self.outer_lr = outer_lr
    
    def forward(self, x):
        return self.model(x)
    
    def adaptation(self, support_x, support_y, first_order=True):
        fast_weights = {name: param.clone() for name, param in self.model.named_parameters()}
        
        logits = self._forward_with_weights(support_x, fast_weights)
        loss = F.cross_entropy(logits, support_y)
        
        grads = torch.autograd.grad(loss, fast_weights.values(), create_graph=not first_order)
        
        fast_weights = {
            name: param - self.inner_lr * grad
            for (name, param), grad in zip(fast_weights.items(), grads)
        }
        
        return fast_weights
    
    def meta_evaluation(self, support_x, support_y, query_x, query_y):
        fast_weights = self.adaptation(support_x, support_y)
        
        query_logits = self._forward_with_weights(query_x, fast_weights)
        query_loss = F.cross_entropy(query_logits, query_y)
        query_acc = (query_logits.argmax(dim=1) == query_y).float().mean()
        
        return query_loss, query_acc
    
    def meta_update(self, task_losses):
        total_loss = sum(task_losses) / len(task_losses)
        
        grads = torch.autograd.grad(total_loss, self.model.parameters())
        
        with torch.no_grad():
            for param, grad in zip(self.model.parameters(), grads):
                param -= self.outer_lr * grad
        
        return total_loss
    
    def _forward_with_weights(self, x, weights):
        x = F.conv2d(x, weights['conv1.weight'], weights.get('conv1.bias'))
        x = F.relu(F.max_pool2d(x, 2))
        x = F.conv2d(x, weights['conv2.weight'], weights.get('conv2.bias'))
        x = F.relu(F.max_pool2d(x, 2))
        x = x.view(x.size(0), -1)
        x = F.linear(x, weights['fc1.weight'], weights['fc1.bias'])
        return x
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MetaSGD(nn.Module):
    def __init__(self, model_fn, inner_lr=0.01):
        super().__init__()
        self.model = model_fn()
        self.inner_lr = nn.Parameter(torch.tensor([inner_lr] * len(list(self.model.parameters()))))
    
    def adaptation(self, support_x, support_y):
        fast_weights = []
        for i, (name, param) in enumerate(self.model.named_parameters()):
            grad = self._compute_grad(param, support_x, support_y)
            new_param = param - self.inner_lr[i] * grad
            fast_weights.append(new_param)
        
        return fast_weights
    
    def _compute_grad(self, param, support_x, support_y):
        logits = self.model(support_x)
        loss = F.cross_entropy(logits, support_y)
        return torch.autograd.grad(loss, param)[0]
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class PrototypicalNetworks(nn.Module):
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
            nn.Flatten()
        )
    
    def forward(self, support, query):
        support_emb = self.encode(support)
        query_emb = self.encode(query)
        
        prototypes = self._compute_prototypes(support_emb)
        logits = self._compute_logits(query_emb, prototypes)
        
        return logits
    
    def encode(self, x):
        return self.encoder(x)
    
    def _compute_prototypes(self, support_emb):
        return support_emb.view(len(support_emb) // 5, 5, -1).mean(dim=1)
    
    def _compute_logits(self, query_emb, prototypes):
        dists = -torch.cdist(query_emb, prototypes, p=2)
        return dists
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MemoryAugmentedNetwork(nn.Module):
    def __init__(self, input_dim=784, memory_size=100, memory_dim=128):
        super().__init__()
        self.memory_size = memory_size
        self.memory_dim = memory_dim
        
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, memory_dim)
        )
        
        self.memory = nn.Parameter(torch.randn(memory_size, memory_dim))
        self.key_head = nn.Linear(memory_dim, 1)
        self.value_head = nn.Linear(memory_dim, memory_dim)
        
        nn.init.xavier_uniform_(self.memory)
    
    def forward(self, x, memory_read=True):
        features = self.encoder(x)
        
        if memory_read:
            read_output = self._memory_read(features)
            output = torch.cat([features, read_output], dim=1)
        else:
            output = features
        
        return output
    
    def _memory_read(self, query):
        keys = self.key_head(self.memory)
        values = self.value_head(self.memory)
        
        similarities = query @ keys.t()
        attention = F.softmax(similarities, dim=1)
        
        read = attention @ values
        return read
    
    def write(self, new_memory, new_labels):
        self.memory.data[new_labels] = new_memory
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MetaLearnerLSTM(nn.Module):
    def __init__(self, input_dim=784, hidden_dim=100, output_dim=10):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=output_dim + 1,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True
        )
        
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU()
        )
        
        self.classifier = nn.Linear(hidden_dim, output_dim)
        
        self.hidden_dim = hidden_dim
    
    def forward(self, support_x, support_y, query_x):
        batch_size = support_x.size(0)
        n_support = support_x.size(1)
        n_query = query_x.size(1)
        
        support_features = self.encoder(support_x.view(-1, 784)).view(batch_size, n_support, -1)
        
        support_input = torch.cat([
            support_features,
            F.one_hot(support_y, num_classes=10).float()
        ], dim=-1)
        
        lstm_out, _ = self.lstm(support_input)
        
        h_n = lstm_out[:, -1, :]
        
        query_features = self.encoder(query_x.view(-1, 784)).view(batch_size, n_query, -1)
        
        query_features = query_features + h_n.unsqueeze(1).expand_as(query_features)
        
        logits = self.classifier(query_features)
        
        return logits
```

## Best Practices

1. Design task distributions that reflect the types of tasks expected at test time.

2. Use larger inner learning rates and smaller outer learning rates for MAML.

3. Apply first-order approximations to MAML for computational efficiency.

4. Balance the number of support and query examples per episode.

5. Use proper episode batching for stable meta-training.

6. Monitor both support and query accuracy during training.

7. Apply data augmentation to support sets to improve generalization.

8. Use appropriate evaluation protocols (multiple test episodes).

9. Consider task difficulty progression for curriculum meta-learning.

10. Validate on held-out task distributions to detect overfitting.
