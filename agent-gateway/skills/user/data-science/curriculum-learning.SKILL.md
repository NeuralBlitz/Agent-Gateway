---
name: Curriculum Learning
category: data-science
description: Training models by presenting examples in order of increasing difficulty for better convergence
---

# Curriculum Learning

## What I do

I enable models to learn more efficiently by presenting training examples in a meaningful order from easy to hard. By structuring the learning process like human education, I help models converge faster, achieve better generalization, and avoid local minima. This mimics how humans learn best by building understanding progressively.

## When to use me

- When training is unstable or converges slowly
- Limited computational resources require sample efficiency
- Data has natural difficulty gradients
- Models need to learn complex concepts progressively
- Preventing overfitting to hard examples early
- Building robust models for noisy real-world data
- Improving transfer learning from simple to complex domains
- Multi-task learning with task dependencies

## Core Concepts

1. **Difficulty Scoring**: Assigning difficulty scores to training examples.

2. **Curriculum Schedule**: The rate at which difficulty increases over training.

3. **Scratch vs. Pre-trained**: Starting from scratch vs. using pre-trained models.

4. **Pacing Function**: How quickly easy examples are replaced by harder ones.

5. **Task Curriculum**: Ordering tasks by complexity.

6. **Self-Paced Learning**: Learning to estimate example difficulty.

7. **Teacher-Student Curriculum**: Using a teacher model to score difficulty.

8. **Difficulty Measures**: Confidence, loss, entropy, or external metrics.

## Code Examples

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class CurriculumScheduler:
    def __init__(self, total_samples, initial_pct=0.1, final_pct=1.0, 
                 num_epochs=100, method="linear"):
        self.total_samples = total_samples
        self.initial_pct = initial_pct
        self.final_pct = final_pct
        self.num_epochs = num_epochs
        self.method = method
        
        self.current_epoch = 0
    
    def get_num_samples(self, epoch):
        if epoch >= self.num_epochs:
            return self.total_samples
        
        if self.method == "linear":
            pct = self.initial_pct + (self.final_pct - self.initial_pct) * (epoch / self.num_epochs)
        elif self.method == "exponential":
            base = self.final_pct / self.initial_pct
            pct = self.initial_pct * (base ** (epoch / self.num_epochs))
        elif self.method == "step":
            pct = self.initial_pct if epoch < self.num_epochs // 2 else self.final_pct
        elif self.method == "cosine":
            pct = self.initial_pct + 0.5 * (self.final_pct - self.initial_pct) * (1 - np.cos(np.pi * epoch / self.num_epochs))
        
        return int(self.total_samples * pct)
    
    def get_difficulty_weights(self, losses, epoch):
        n_samples = self.get_num_samples(epoch)
        
        sorted_indices = np.argsort(losses)
        
        weights = np.zeros_like(losses)
        weights[sorted_indices[:n_samples]] = 1.0
        
        return weights
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConfidenceBasedCurriculum:
    def __init__(self, confidence_threshold=0.7):
        self.confidence_threshold = confidence_threshold
    
    def score_difficulty(self, model, data_loader):
        self.model.eval()
        all_confidences = []
        all_indices = []
        
        with torch.no_grad():
            for indices, data in data_loader:
                data = data.to(next(model.parameters()).device)
                logits = model(data)
                probs = F.softmax(logits, dim=1)
                confidence = probs.max(dim=1)[0]
                all_confidences.extend(confidence.cpu().numpy())
                all_indices.extend(indices.numpy())
        
        return dict(zip(all_indices, all_confidences))
    
    def get_easy_samples(self, difficulty_scores, percentile=30):
        confidences = list(difficulty_scores.values())
        threshold = np.percentile(confidences, percentile)
        
        easy_samples = [idx for idx, conf in difficulty_scores.items() if conf >= threshold]
        
        return easy_samples, threshold
    
    def curriculum_collate_fn(self, easy_indices, all_indices, epoch, total_epochs):
        pct_easy = 0.3 + 0.5 * (epoch / total_epochs)
        
        num_easy = int(len(all_indices) * pct_easy)
        easy_available = len(set(easy_indices) & set(all_indices))
        
        if easy_available < num_easy:
            num_easy = easy_available
        
        num_hard = min(len(all_indices) - num_easy, len(all_indices) - easy_available)
        
        selected_indices = list(set(easy_indices) & set(all_indices))[:num_easy]
        remaining = [i for i in all_indices if i not in selected_indices]
        selected_indices.extend(remaining[:num_hard])
        
        return selected_indices
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SelfPacedLearning:
    def __init__(self, model, reg_lambda=0.1, K=10):
        self.model = model
        self.reg_lambda = reg_lambda
        self.K = K
    
    def compute_weights(self, losses, epoch):
        batch_size = len(losses)
        
        sorted_losses, _ = torch.sort(losses)
        threshold = sorted_losses[min(self.K, batch_size - 1)]
        
        weights = torch.zeros_like(losses)
        for i in range(batch_size):
            if losses[i] <= threshold:
                weights[i] = 1.0
            else:
                weights[i] = self.reg_lambda * torch.exp(-losses[i] / self.reg_lambda)
        
        return weights / (weights.sum() + 1e-8)
    
    def train_epoch(self, train_loader, optimizer, device):
        self.model.train()
        total_loss = 0
        
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            
            optimizer.zero_grad()
            logits = self.model(x)
            loss = F.cross_entropy(logits, y, reduction='none')
            
            weights = self.compute_weights(loss, epoch=0)
            weighted_loss = (loss * weights).mean()
            
            weighted_loss.backward()
            optimizer.step()
            
            total_loss += weighted_loss.item()
        
        return total_loss / len(train_loader)
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

class TeacherStudentCurriculum:
    def __init__(self, teacher_model, student_model):
        self.teacher = teacher_model
        self.student = student_model
    
    def compute_teacher_confidence(self, x):
        self.teacher.eval()
        with torch.no_grad():
            logits = self.teacher(x)
            probs = F.softmax(logits, dim=1)
            confidence = probs.max(dim=1)[0]
        return confidence
    
    def rank_by_teacher(self, unlabeled_loader, n_samples=100):
        all_confidences = []
        all_data = []
        
        for indices, data in unlabeled_loader:
            confidences = self.compute_teacher_confidence(data)
            for idx, conf, d in zip(indices, confidences, data):
                all_confidences.append((idx, conf, d))
        
        all_confidences.sort(key=lambda x: x[1], reverse=True)
        
        selected = all_confidences[:n_samples]
        
        return selected
    
    def progressive_transfer(self, unlabeled_loader, n_rounds=5, samples_per_round=100):
        for round_idx in range(n_rounds):
            selected = self.rank_by_teacher(unlabeled_loader, samples_per_round)
            
            for idx, confidence, data in selected:
                with torch.no_grad():
                    logits = self.teacher(data.unsqueeze(0))
                    pseudo_label = logits.argmax(dim=1)
                
                self._train_student_step(data, pseudo_label)
            
            print(f"Round {round_idx + 1}: Selected {len(selected)} samples")
```

```python
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import defaultdict

class TaskCurriculum:
    def __init__(self):
        self.task_difficulties = {}
        self.task_performance = defaultdict(list)
    
    def estimate_task_difficulty(self, tasks, model):
        difficulties = {}
        
        for task in tasks:
            performance = self._evaluate_task(model, task)
            difficulties[task] = 1 - performance
        
        self.task_difficulties.update(difficulties)
        
        return difficulties
    
    def get_ordered_tasks(self, tasks):
        sorted_tasks = sorted(tasks, key=lambda t: self.task_difficulties.get(t, 0.5))
        return sorted_tasks
    
    def curriculum_schedule(self, tasks, current_epoch, total_epochs):
        ordered = self.get_ordered_tasks(tasks)
        
        num_tasks = len(ordered)
        tasks_per_epoch = max(1, int(num_tasks * min(1.0, current_epoch / (total_epochs * 0.5))))
        
        available_tasks = ordered[:tasks_per_epoch]
        
        if current_epoch > total_epochs * 0.5:
            available_tasks.extend(ordered[tasks_per_epoch:tasks_per_epoch + num_tasks // 4])
        
        return available_tasks
    
    def _evaluate_task(self, model, task):
        model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for x, y in task.test_loader:
                logits = model(x)
                predictions = logits.argmax(dim=1)
                correct += (predictions == y).sum().item()
                total += y.size(0)
        
        return correct / total if total > 0 else 0
```

## Best Practices

1. Start with very easy examples (high confidence) and gradually increase difficulty.

2. Use multiple difficulty metrics for more robust curriculum design.

3. Apply curriculum learning in early epochs only, then use full dataset.

4. Use exponential or cosine pacing for smoother difficulty transitions.

5. Combine curriculum with data augmentation for harder examples.

6. Monitor learning curves to tune curriculum parameters.

7. Consider task-level curricula for multi-task learning.

8. Use self-paced learning when difficulty scoring is uncertain.

9. Validate that curriculum improves both convergence and final performance.

10. Allow skipping difficult examples that are mislabeled.
