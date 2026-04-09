---
name: Semi-Supervised Learning
category: data-science
description: Leveraging both labeled and unlabeled data to improve model performance
---

# Semi-Supervised Learning

## What I do

I enable models to learn from both small amounts of labeled data and large amounts of unlabeled data. By leveraging the structure and distribution of unlabeled examples, I can significantly improve model performance compared to purely supervised approaches. This is essential when labeling data is expensive but unlabeled data is abundant.

## When to use me

- When you have limited labeled data but abundant unlabeled data
- Building models for domains where expert annotation is costly
- Medical imaging with few diagnoses but many images
- NLP tasks with few annotated documents
- Active learning pipelines before labels are available
- Improving model robustness with additional unlabeled data
- Domain adaptation from unlabeled target domain data
- Data augmentation through pseudo-labeling

## Core Concepts

1. **Pseudo-Labeling**: Using model predictions on unlabeled data as training labels.

2. **Consistency Regularization**: Enforcing that augmenting unlabeled data yields consistent predictions.

3. **Entropy Minimization**: Encouraging confident predictions on unlabeled data.

4. **MixMatch**: Combining multiple semi-supervised techniques with data mixing.

5. **FixMatch**: Simplifying consistency regularization with confidence thresholds.

6. **Mean Teacher**: Using an exponential moving average of model weights for consistency.

7. **Virtual Adversarial Training**: Making predictions robust to adversarial perturbations.

8. **Self-Training**: Iteratively training on own predictions with confidence filtering.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np

class PseudoLabeling:
    def __init__(self, threshold=0.9):
        self.threshold = threshold
    
    def generate_labels(self, model, unlabeled_loader, device):
        model.eval()
        pseudo_labels = []
        unlabeled_data = []
        
        with torch.no_grad():
            for data, _ in unlabeled_loader:
                data = data.to(device)
                outputs = model(data)
                probs = F.softmax(outputs, dim=1)
                max_probs, preds = probs.max(dim=1)
                
                mask = max_probs >= self.threshold
                selected = mask.nonzero(as_tuple=True)[0]
                
                if len(selected) > 0:
                    pseudo_labels.append(preds[selected].cpu())
                    unlabeled_data.append(data[selected].cpu())
        
        if unlabeled_data:
            return torch.cat(unlabeled_data), torch.cat(pseudo_labels)
        return None, None

class ConsistencyRegularization:
    def __init__(self, alpha=0.1):
        self.alpha = alpha
    
    def consistency_loss(self, student_logits, teacher_logits):
        return F.mse_loss(student_logits, teacher_logits)
    
    def apply_augmentation(self, x, augmentation_fn):
        return augmentation_fn(x)

class MeanTeacher:
    def __init__(self, model, ema_decay=0.999):
        self.student = model
        self.teacher = type(model)(**model_kwargs)
        self.ema_decay = ema_decay
        
        for param in self.teacher.parameters():
            param.data.copy_(param.data)
            param.requires_grad = False
    
    @torch.no_grad()
    def update_teacher(self):
        for s_param, t_param in zip(self.student.parameters(), self.teacher.parameters()):
            t_param.data = self.ema_decay * t_param.data + (1 - self.ema_decay) * s_param.data
    
    def forward(self, x):
        return self.student(x), self.teacher(x)

class MixMatch:
    def __init__(self, K=2, alpha=0.75, T=0.5):
        self.K = K
        self.alpha = alpha
        self.T = T
    
    def mixmatch(self, labeled_batch, unlabeled_batch, model):
        x_l, y_l = labeled_batch
        x_u, _ = unlabeled_batch
        
        batch_size = len(x_l)
        
        all_x = torch.cat([x_l] + [x_u] * self.K, dim=0)
        all_x = self._sharpen(all_x, model)
        
        x_l_aug = self._mixup(x_l, all_x[:batch_size], self.alpha)
        x_u_aug = self._mixup(all_x[batch_size:], all_x[batch_size:], self.alpha)
        
        return x_l_aug, x_u_aug
    
    def _sharpen(self, x, model):
        with torch.no_grad():
            outputs = model(x)
            probs = F.softmax(outputs, dim=1)
            sharpened = probs ** (1 / self.T)
            return sharpened / sharpened.sum(dim=1, keepdim=True)
    
    def _mixup(self, x1, x2, alpha):
        beta = np.random.beta(alpha, alpha)
        beta = max(beta, 1 - beta)
        return beta * x1 + (1 - beta) * x2
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FixMatch:
    def __init__(self, threshold=0.95):
        self.weak_augmentation = lambda x: x + torch.randn_like(x) * 0.1
        self.strong_augmentation = lambda x: self._randaugment(x)
        self.threshold = threshold
    
    def _randaugment(self, x):
        for _ in range(2):
            op = np.random.choice(['brightness', 'contrast', 'saturation'])
            if op == 'brightness':
                x = x + torch.rand_like(x) * 0.2
            elif op == 'contrast':
                x = x * (1 + torch.rand_like(x) * 0.2)
            elif op == 'saturation':
                x = x * (1 + torch.rand_like(x) * 0.2)
        return torch.clamp(x, 0, 1)
    
    def loss(self, model, labeled_batch, unlabeled_batch):
        x_l, y_l = labeled_batch
        x_u_w, x_u_s = unlabeled_batch
        
        logits_l = model(x_l)
        loss_l = F.cross_entropy(logits_l, y_l)
        
        with torch.no_grad():
            logits_u_w = model(x_u_w)
            probs_u_w = F.softmax(logits_u_w, dim=1)
            max_probs, pseudo_labels = probs_u_w.max(dim=1)
            mask = max_probs >= self.threshold
        
        logits_u_s = model(x_u_s)
        loss_u = F.cross_entropy(logits_u_s, pseudo_labels, reduction='none')
        loss_u = (loss_u * mask).sum() / (mask.sum() + 1e-6)
        
        return loss_l + 25.0 * loss_u

class NoisyStudent:
    def __init__(self, noise_std=0.1):
        self.noise_std = noise_std
    
    def train_student(self, model, labeled_loader, unlabeled_loader, epochs):
        for epoch in epochs:
            for x, y in labeled_loader:
                logits = model(x + torch.randn_like(x) * self.noise_std)
                loss = F.cross_entropy(logits, y)
                loss.backward()
                optimizer.step()
            
            pseudo_labels = self._generate_pseudo_labels(model, unlabeled_loader)
            self._train_on_pseudo(model, pseudo_labels, unlabeled_loader)
        
        return model
    
    def _generate_pseudo_labels(self, model, unlabeled_loader):
        model.eval()
        all_labels = []
        all_data = []
        
        with torch.no_grad():
            for x, _ in unlabeled_loader:
                logits = model(x)
                probs = F.softmax(logits, dim=1)
                max_probs, labels = probs.max(dim=1)
                all_labels.append(labels)
                all_data.append(x)
        
        return torch.cat(all_labels), torch.cat(all_data)
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class VAT:
    def __init__(self, xi=10.0, epsilon=1.0, n_power=1):
        self.xi = xi
        self.epsilon = epsilon
        self.n_power = n_power
    
    def virtual_adversarial_loss(self, model, x, logits):
        with torch.no_grad():
            log_preds = F.log_softmax(logits, dim=1)
        
        d = torch.randn_like(x)
        d = self._normalize(d)
        
        for _ in range(self.n_power):
            d.requires_grad_(True)
            adv_logits = model(x + self.xi * d)
            adv_loss = self._kl_divergence(log_preds, adv_logits)
            d = self._normalize(d.grad.data)
            self.xi * d
        
        r_adv = self.epsilon * d
        adv_logits = model(x + r_adv)
        
        loss = self._kl_divergence(log_preds, adv_logits)
        return loss
    
    def _normalize(self, x):
        return x / (torch.norm(x, p=2, dim=(1,2,3), keepdim=True) + 1e-8)
    
    def _kl_divergence(self, p, q):
        return F.kl_div(F.log_softmax(q, dim=1), p, reduction='batchmean')

class ICT:
    def __init__(self, alpha=0.1):
        self.alpha = alpha
    
    def inter_consistency_loss(self, model, x_l, x_u, mixup_alpha=4.0):
        logits_l = model(x_l)
        
        beta = np.random.beta(mixup_alpha, mixup_alpha)
        beta = max(beta, 1 - beta)
        
        mix_ratio = len(x_u) / (len(x_l) + len(x_u))
        mix_lam = beta * (1 - mix_ratio) + mix_ratio
        
        indices = torch.randperm(len(x_u))
        x_u_shuffled = x_u[indices]
        
        x_mixed = mix_lam * x_l + (1 - mix_lam) * x_u_shuffled
        
        with torch.no_grad():
            p_pred = F.softmax(model(x_u), dim=1)
        
        logits_mixed = model(x_mixed)
        loss = -torch.sum(p_pred * F.log_softmax(logits_mixed, dim=1), dim=1).mean()
        
        return loss

class CrossConsistencyTraining:
    def __init__(self, n_augmentations=4):
        self.n_augmentations = n_augmentations
        self.augmentations = [
            lambda x: x + torch.randn_like(x) * 0.1,
            lambda x: F.dropout(x, 0.1),
            lambda x: x * (1 + torch.randn_like(x) * 0.05),
            lambda x: x + torch.randn_like(x) * 0.05,
        ]
    
    def loss(self, model, x):
        outputs = model(x)
        loss = 0.0
        
        for aug in self.augmentations:
            aug_x = aug(x)
            aug_out = model(aug_x)
            loss += F.mse_loss(F.softmax(outputs, dim=1), F.softmax(aug_out, dim=1))
        
        return loss / len(self.augmentations)
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import defaultdict

class SemiSupervisedTrainer:
    def __init__(self, labeled_loader, unlabeled_loader, model, device):
        self.labeled_loader = labeled_loader
        self.unlabeled_loader = unlabeled_loader
        self.model = model
        self.device = device
    
    def train_epoch(self, optimizer, ssl_method="fixmatch", ssl_weight=1.0):
        self.model.train()
        total_loss = 0.0
        total_ssl_loss = 0.0
        
        for (x_l, y_l), (x_u, _) in zip(self.labeled_loader, self.unlabeled_loader):
            x_l = x_l.to(self.device)
            y_l = y_l.to(self.device)
            x_u = x_u.to(self.device)
            
            optimizer.zero_grad()
            
            logits_l = self.model(x_l)
            loss_l = F.cross_entropy(logits_l, y_l)
            
            if ssl_method == "pseudolabel":
                ssl_loss = self._pseudolabel_loss(x_u)
            elif ssl_method == "consistency":
                ssl_loss = self._consistency_loss(x_u)
            elif ssl_method == "fixmatch":
                ssl_loss = self._fixmatch_loss(x_u)
            else:
                ssl_loss = 0
            
            total_loss = loss_l + ssl_weight * ssl_loss
            total_loss.backward()
            optimizer.step()
            
            total_ssl_loss += ssl_loss.item()
        
        return total_loss.item(), total_ssl_loss
    
    def _pseudolabel_loss(self, x_u):
        self.model.eval()
        with torch.no_grad():
            logits_u = self.model(x_u)
            probs = F.softmax(logits_u, dim=1)
            max_probs, pseudo_labels = probs.max(dim=1)
            mask = max_probs > 0.9
        
        self.model.train()
        if mask.sum() > 0:
            logits_masked = self.model(x_u[mask])
            return F.cross_entropy(logits_masked, pseudo_labels[mask])
        return torch.tensor(0.0, device=self.device)
    
    def _consistency_loss(self, x_u):
        aug1 = x_u + torch.randn_like(x_u) * 0.1
        aug2 = x_u + torch.randn_like(x_u) * 0.1
        
        logits1 = self.model(aug1)
        logits2 = self.model(aug2)
        
        return F.mse_loss(F.softmax(logits1, dim=1), F.softmax(logits2, dim=1))
    
    def _fixmatch_loss(self, x_u):
        x_u_w = x_u + torch.randn_like(x_u) * 0.05
        
        x_u_s = self._strong_augment(x_u)
        
        with torch.no_grad():
            logits_w = self.model(x_u_w)
            probs_w = F.softmax(logits_w, dim=1)
            max_probs, pseudo_labels = probs_w.max(dim=1)
            mask = max_probs > 0.95
        
        logits_s = self.model(x_u_s)
        
        loss = F.cross_entropy(logits_s, pseudo_labels, reduction='none')
        loss = (loss * mask).sum() / (mask.sum() + 1e-6)
        
        return loss
    
    def _strong_augment(self, x):
        for _ in range(2):
            if torch.rand() < 0.5:
                x = F.dropout(x, 0.1)
            if torch.rand() < 0.5:
                x = x + torch.randn_like(x) * 0.1
        return torch.clamp(x, 0, 1)
```

```python
import numpy as np
from sklearn.model_selection import train_test_split

class CoTraining:
    def __init__(self, classifiers, max_iterations=100):
        self.classifiers = classifiers
        self.max_iterations = max_iterations
    
    def fit(self, X_labeled, y_labeled, X_unlabeled):
        X_l = X_labeled.copy()
        y_l = y_labeled.copy()
        X_u = X_unlabeled.copy()
        
        n_samples = len(X_l)
        
        for iteration in range(self.max_iterations):
            predictions = []
            
            for clf in self.classifiers:
                clf.fit(X_l, y_l)
                probs = clf.predict_proba(X_u)
                preds = clf.predict(X_u)
                predictions.append((probs, preds, clf))
            
            for i, (probs, preds, clf) in enumerate(predictions):
                for j, (_, preds_j, clf_j) in enumerate(predictions):
                    if i != j:
                        confident_mask = probs.max(axis=1) > 0.95
                        if confident_mask.sum() > 0:
                            new_X = X_u[confident_mask]
                            new_y = preds[confident_mask]
                            X_l = np.vstack([X_l, new_X])
                            y_l = np.concatenate([y_l, new_y])
                            X_u = np.delete(X_u, confident_mask, axis=0)
            
            if len(X_u) == 0 or n_samples >= len(X_l):
                break
        
        return self.classifiers

class TriTraining:
    def __init__(self, base_classifier, max_iterations=50):
        self.classifiers = [base_classifier() for _ in range(3)]
        self.max_iterations = max_iterations
    
    def fit(self, X_labeled, y_labeled, X_unlabeled):
        X_l = X_labeled.copy()
        y_l = y_labeled.copy()
        
        for iteration in range(self.max_iterations):
            for i in range(3):
                other_indices = [j for j in range(3) if j != i]
                
                X_i, y_i = self._get_labelled_by_others(i, other_indices, X_l, y_l)
                
                if len(np.unique(y_i)) > 1:
                    self.classifiers[i].fit(X_i, y_i)
            
            if iteration > 0 and self._has_converged():
                break
        
        return self.classifiers
    
    def _get_labelled_by_others(self, target_idx, other_indices, X, y):
        combined_predictions = np.zeros((len(X), 3))
        
        for j, idx in enumerate(other_indices):
            combined_predictions[:, j] = self.classifiers[idx].predict(X)
        
        return X, y
    
    def _has_converged(self):
        predictions = [clf.predict(X_l) for clf in self.classifiers]
        return np.all(predictions[0] == predictions[1]) and np.all(predictions[1] == predictions[2])
```

## Best Practices

1. Start with a strong supervised baseline before applying SSL methods.

2. Use confidence thresholds carefully; too low introduces noise, too high limits learning.

3. Balance labeled and unlabeled batch sizes for stable training.

4. Apply data augmentation to unlabeled data to create diverse views.

5. Use consistency regularization to prevent the model from making inconsistent predictions.

6. Monitor the ratio of pseudo-labels to monitor SSL effectiveness.

7. Apply learning rate warmup and weight decay to prevent overfitting to pseudo-labels.

8. Use ensemble methods or mean teacher for more stable pseudo-label generation.

9. Gradually increase SSL weight over training rather than using fixed weight from start.

10. Use domain-specific augmentations when generic ones don't capture data structure.
