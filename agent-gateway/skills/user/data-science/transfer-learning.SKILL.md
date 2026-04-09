---
name: Transfer Learning
category: data-science
description: Applying knowledge learned from one task or domain to improve learning on related tasks
---

# Transfer Learning

## What I do

I enable models to leverage knowledge learned from one task or domain to improve learning on different but related tasks. By transferring learned features, weights, or representations, I can significantly reduce training time and data requirements for new problems. This is essential when target domain data is scarce or expensive to obtain.

## When to use me

- Applying pretrained models to new domains with limited data
- Fine-tuning language models for domain-specific tasks
- Adapting vision models to new image distributions
- Cross-lingual transfer for low-resource languages
- Medical imaging where labeled data is scarce
- Time series forecasting with limited historical data
- Building on established benchmarks for new applications
- Speeding up model development in new domains

## Core Concepts

1. **Feature Transfer**: Using pretrained representations as fixed features for new tasks.

2. **Fine-Tuning**: Adapting pretrained model weights to new tasks with continued training.

3. **Domain Adaptation**: Aligning feature distributions between source and target domains.

4. **Domain Confusion**: Training to make source and target domains indistinguishable.

5. **Layer Freezing**: Keeping early layers fixed while training later layers.

6. **Progressive Fine-Tuning**: Gradually unfreezing layers during training.

7. **Feature Extraction**: Using pretrained models as fixed feature extractors.

8. **Model Distillation**: Transferring knowledge from large to smaller models.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TransferLearningClassifier:
    def __init__(self, num_classes, pretrained_model=None, freeze_backbone=True):
        if pretrained_model is None:
            pretrained_model = torchvision.models.resnet50(pretrained=True)
        
        self.backbone = pretrained_model
        
        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False
        
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(num_features, num_classes)
        
        self.new_layers = nn.ModuleList([self.backbone.fc])
    
    def forward(self, x):
        return self.backbone(x)
    
    def freeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = False
    
    def unfreeze_backbone(self, unfreeze_ratio=0.3):
        total_layers = len(list(self.backbone.parameters()))
        unfreeze_start = int(total_layers * (1 - unfreeze_ratio))
        
        for i, param in enumerate(self.backbone.parameters()):
            if i >= unfreeze_start:
                param.requires_grad = True
    
    def get_trainable_params(self):
        trainable = []
        frozen = []
        
        for name, param in self.named_parameters():
            if param.requires_grad:
                trainable.append(name)
            else:
                frozen.append(name)
        
        return trainable, frozen
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DomainAdaptationNetwork(nn.Module):
    def __init__(self, backbone_dim=2048, hidden_dim=512):
        super().__init__()
        self.feature_extractor = nn.Sequential(
            nn.Linear(backbone_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.5)
        )
        
        self.label_classifier = nn.Linear(hidden_dim, 10)
        self.domain_classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 2)
        )
    
    def forward(self, x, alpha=1.0):
        features = self.feature_extractor(x)
        
        class_output = self.label_classifier(features)
        
        reverse_features = GradientReversalLayer.apply(features, alpha)
        domain_output = self.domain_classifier(reverse_features)
        
        return class_output, domain_output

class GradientReversalLayer(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, lambda_):
        ctx.lambda_ = lambda_
        return x.view_as(x)
    
    @staticmethod
    def backward(ctx, grad_output):
        return grad_output.neg() * ctx.lambda_, None

def dann_loss(class_logits, domain_logits, class_labels, domain_labels, alpha=1.0):
    class_loss = F.cross_entropy(class_logits, class_labels)
    domain_loss = F.cross_entropy(domain_logits, domain_labels)
    return class_loss + alpha * domain_loss
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MMDLoss(nn.Module):
    def __init__(self, kernel_mul=2.0, kernel_num=5):
        super().__init__()
        self.kernel_mul = kernel_mul
        self.kernel_num = kernel_num
    
    def forward(self, source, target):
        batch_size = min(source.size(0), target.size(0))
        source = source[:batch_size]
        target = target[:batch_size]
        
        kernels = self._get_kernels(source, target)
        return sum(kernels) / len(kernels)
    
    def _get_kernels(self, source, target):
        kernels = []
        n = min(len(source), len(target))
        
        for sigma in self._get_sigmas():
            kernel_source = self._gaussian_kernel(source, source, sigma)
            kernel_target = self._gaussian_kernel(target, target, sigma)
            kernel_cross = self._gaussian_kernel(source, target, sigma)
            
            kernel_source = kernel_source[:n, :n]
            kernel_target = kernel_target[:n, :n]
            kernel_cross = kernel_cross[:n, :n]
            
            loss = kernel_source.mean() + kernel_target.mean() - 2 * kernel_cross.mean()
            kernels.append(loss)
        
        return kernels
    
    def _get_sigmas(self):
        bandwidths = []
        for _ in range(self.kernel_num):
            bandwidth = torch.randn(1) * self.kernel_mul + 1.0
            bandwidths.append(bandwidth)
        return bandwidths
    
    def _gaussian_kernel(self, x, y, sigma):
        n, m = len(x), len(y)
        x = x.view(n, -1)
        y = y.view(m, -1)
        
        x_sq = torch.sum(x ** 2, dim=1).view(-1, 1)
        y_sq = torch.sum(y ** 2, dim=1).view(1, -1)
        
        dist_sq = x_sq + y_sq - 2 * x @ y.t()
        return torch.exp(-dist_sq / (2 * sigma ** 2))
```

```python
import torch
import torch.nn as nn
from transformers import AutoModelForSequenceClassification

class BertFineTuner:
    def __init__(self, model_name="bert-base-uncased", num_labels=2, learning_rate=2e-5):
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        )
        self.learning_rate = learning_rate
    
    def get_optimizer(self):
        no_decay = ['bias', 'LayerNorm.weight']
        optimizer_grouped_parameters = [
            {'params': [p for n, p in self.model.named_parameters() 
                       if not any(nd in n for nd in no_decay)],
             'weight_decay': 0.01},
            {'params': [p for n, p in self.model.named_parameters() 
                       if any(nd in n for nd in no_decay)],
             'weight_decay': 0.0}
        ]
        
        return torch.optim.AdamW(optimizer_grouped_parameters, lr=self.learning_rate)
    
    def freeze_encoder(self, num_layers_to_freeze=10):
        for param in self.model.bert.embeddings.parameters():
            param.requires_grad = False
        
        for i in range(num_layers_to_freeze):
            for param in self.model.bert.encoder.layer[i].parameters():
                param.requires_grad = False
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ModelDistillation:
    def __init__(self, teacher_model, student_model, temperature=2.0, alpha=0.5):
        self.teacher = teacher_model
        self.student = student_model
        self.temperature = temperature
        self.alpha = alpha
    
    def distillation_loss(self, student_logits, teacher_logits, true_labels):
        soft_targets = F.softmax(teacher_logits / self.temperature, dim=1)
        soft_prob = F.log_softmax(student_logits / self.temperature, dim=1)
        
        soft_loss = F.kl_div(soft_prob, soft_targets, reduction='batchmean') * (self.temperature ** 2)
        
        hard_loss = F.cross_entropy(student_logits, true_labels)
        
        return self.alpha * hard_loss + (1 - self.alpha) * soft_loss
```

## Best Practices

1. Choose pretrained models that are close to your target domain for better transfer.

2. Start with frozen backbone and train only new layers before gradually unfreezing.

3. Use lower learning rates for pretrained layers compared to new random layers.

4. Apply data augmentation to limited target domain data.

5. Monitor for negative transfer when source and target domains are too dissimilar.

6. Use domain adaptation techniques when domain shift is significant.

7. Consider layer-wise fine-tuning for very different target domains.

8. Validate on held-out target domain data to detect overfitting.

9. Use smaller batch sizes and longer training when fine-tuning.

10. Consider partial fine-tuning (only top layers) for very small datasets.
