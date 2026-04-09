---
name: Self-Supervised Learning
category: ai
description: Learning representations from unlabeled data using pretext tasks and contrastive methods
---

# Self-Supervised Learning

## What I do

I enable machines to learn useful representations from large amounts of unlabeled data by creating supervised signals from the data itself. I eliminate the dependency on human-annotated labels by designing pretext tasks that encourage models to learn meaningful features. The learned representations can then be transferred to downstream tasks with minimal fine-tuning.

## When to use me

- Pre-training on large unlabeled datasets when labeled data is scarce
- Building representation learning systems for transfer learning
- Learning from web-scale data without manual annotation
- Reducing labeling costs for domain-specific applications
- Pre-training foundation models for various downstream tasks
- Learning from images, text, audio, and other data types
- Building models that generalize across domains without supervision

## Core Concepts

1. **Pretext Tasks**: Artificially created supervised tasks that don't require labels but teach useful representations.

2. **Contrastive Learning**: Learning by pulling similar examples together and pushing dissimilar examples apart in embedding space.

3. **Momentum Contrast (MoCo)**: Using a momentum queue to maintain consistent negative samples during contrastive learning.

4. **SimCLR Framework**: Simple contrastive learning framework with data augmentation and large batch sizes.

5. **Masked Prediction**: Learning by predicting masked portions of input, used successfully in BERT and MAE.

6. **BYOL and Bootstrap Your Own Latent**: Methods that avoid negative samples through online and target networks.

7. **Cluster Assignment**: Methods like SwAV that assign cluster predictions as supervision signal.

8. **Information Maximization**: Learning representations that maximize mutual information between views.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimCLRProjectionHead(nn.Module):
    def __init__(self, input_dim=2048, hidden_dim=2048, output_dim=128):
        super().__init__()
        self.head = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
    
    def forward(self, features):
        return self.head(features)

def nt_xent_loss(z_i, z_j, temperature=0.5):
    batch_size = z_i.size(0)
    
    z = torch.cat([z_i, z_j], dim=0)
    similarity = torch.matmul(z, z.t()) / temperature
    
    mask = torch.eye(2 * batch_size, device=z.device)
    similarity = similarity.masked_fill(mask.bool(), -float('inf'))
    
    pos_mask = torch.zeros(2 * batch_size, 2 * batch_size, device=z.device)
    pos_mask[:batch_size, batch_size:] = torch.eye(batch_size, device=z.device)
    pos_mask[batch_size:, :batch_size] = torch.eye(batch_size, device=z.device)
    
    loss_i = -torch.log(
        torch.exp(similarity[:batch_size, batch_size:2*batch_size].diag()) /
        torch.exp(similarity[:batch_size]).sum(dim=1)
    )
    loss_j = -torch.log(
        torch.exp(similarity[batch_size:, :batch_size].diag()) /
        torch.exp(similarity[batch_size:]).sum(dim=1)
    )
    
    return (loss_i + loss_j).mean()
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MoCoQueue:
    def __init__(self, queue_size=65536, embed_dim=128, momentum=0.999):
        self.queue_size = queue_size
        self.embed_dim = embed_dim
        self.momentum = momentum
        
        self.register_buffer("queue", torch.randn(queue_size, embed_dim))
        self.queue = F.normalize(self.queue, p=2, dim=1)
        self.register_buffer("queue_ptr", torch.zeros(1, dtype=torch.long))
    
    @torch.no_grad()
    def update(self, keys):
        batch_size = keys.size(0)
        ptr = int(self.queue_ptr)
        
        self.queue[ptr:ptr+batch_size] = keys
        ptr = (ptr + batch_size) % self.queue_size
        self.queue_ptr[0] = ptr
    
    def forward(self, query, key, momentum_encoder):
        query = F.normalize(query, p=2, dim=1)
        
        with torch.no_grad():
            key = momentum_encoder(key)
            key = F.normalize(key, p=2, dim=1)
            self.update(key)
        
        positive = torch.sum(query * key, dim=-1, keepdim=True)
        negative = torch.matmul(query, self.queue.t())
        
        logits = torch.cat([positive, negative], dim=1) / 0.07
        labels = torch.zeros(logits.size(0), dtype=torch.long, device=query.device)
        
        return logits, labels

class MoCoModel(nn.Module):
    def __init__(self, base_encoder, embed_dim=128, m=0.999):
        super().__init__()
        self.encoder_q = base_encoder
        self.encoder_k = base_encoder
        self.projector_q = SimCLRProjectionHead(output_dim=embed_dim)
        self.projector_k = SimCLRProjectionHead(output_dim=embed_dim)
        
        for param_q, param_k in zip(self.encoder_q.parameters(), self.encoder_k.parameters()):
            param_k.data.copy_(param_q.data)
            param_k.requires_grad = False
        
        self.moco_queue = MoCoQueue(embed_dim=embed_dim, momentum=m)
    
    def forward(self, im_q, im_k):
        q = self.encoder_q(im_q)
        q = self.projector_q(q)
        
        logits, labels = self.moco_queue.forward(q, im_k, self.encoder_k)
        
        return logits, labels
    
    @torch.no_grad()
    def _momentum_update_key_encoder(self):
        for param_q, param_k in zip(self.encoder_q.parameters(), self.encoder_k.parameters()):
            param_k.data = param_k.data * self.m + param_q.data * (1. - self.m)
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class BYOLPredictor(nn.Module):
    def __init__(self, input_dim=2048, hidden_dim=512, output_dim=128):
        super().__init__()
        self.predictor = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
    
    def forward(self, z):
        return self.predictor(z)

class BYOLModel(nn.Module):
    def __init__(self, base_encoder, input_dim=2048, hidden_dim=512, output_dim=128, m=0.996):
        super().__init__()
        self.encoder = base_encoder
        self.projector = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
        self.predictor = BYOLPredictor(input_dim, hidden_dim, output_dim)
        
        self.online_encoder = nn.Sequential(self.encoder, self.projector)
        self.target_encoder = nn.Sequential(
            type(self.encoder)(**self.encoder_kwargs),
            type(self.projector)(**self.projector_kwargs)
        )
        
        for param in self.target_encoder.parameters():
            param.requires_grad = False
        
        self.m = m
    
    def forward(self, v1, v2):
        h1 = self.online_encoder(v1)
        h2 = self.online_encoder(v2)
        
        z1 = F.normalize(h1, dim=1)
        z2 = F.normalize(h2, dim=1)
        
        p1 = self.predictor(z1)
        p2 = self.predictor(z2)
        
        with torch.no_grad():
            t1 = self.target_encoder(v1)
            t2 = self.target_encoder(v2)
            z1_t = F.normalize(t1, dim=1)
            z2_t = F.normalize(t2, dim=1)
        
        loss = 2 - F.cosine_similarity(p1, z2_t, dim=-1).mean() - F.cosine_similarity(p2, z1_t, dim=-1).mean()
        return loss
    
    @torch.no_grad()
    def update_target(self):
        for param_o, param_t in zip(self.online_encoder.parameters(), self.target_encoder.parameters()):
            param_t.data = param_t.data * self.m + param_o.data * (1 - self.m)
```

```python
import torch
import random
from typing import Tuple, List

class SimCLRTransforms:
    def __init__(self, size=224):
        self.color_jitter = torch.nn.ColorJitter(
            brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1
        )
        self.gaussian_blur = GaussianBlur(kernel_size=23)
        self.size = size
    
    def __call__(self, img):
        t1 = self._transform(img)
        t2 = self._transform(img)
        return t1, t2
    
    def _transform(self, img):
        img = self._random_resize_crop(img)
        img = self.color_jitter(img)
        img = self._random_grayscale(img)
        if random.random() < 0.5:
            img = self.gaussian_blur(img)
        img = self._normalize(img)
        return img
    
    def _random_resize_crop(self, img):
        i, j, h, w = transforms.RandomResizedCrop.get_params(img, (0.08, 1.0), (3/4, 4/3))
        return transforms.functional.resized_crop(img, i, j, h, w, self.size)
    
    def _random_grayscale(self, img):
        if random.random() < 0.2:
            return transforms.functional.to_grayscale(img)
        return img
    
    def _normalize(self, img):
        return transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])(img)

class GaussianBlur:
    def __init__(self, kernel_size=23):
        self.kernel_size = kernel_size
    
    def __call__(self, img):
        sigma = random.uniform(0.1, 2.0)
        return transforms.functional.gaussian_blur(img, self.kernel_size, sigma=[sigma])
```

```python
import torch
import torch.nn as nn

class MAEEncoder(nn.Module):
    def __init__(self, patch_size=16, embed_dim=768, depth=12, num_heads=12):
        super().__init__()
        self.patch_embed = nn.Conv2d(3, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.pos_embed = nn.Parameter(torch.zeros(1, 196, embed_dim))
        
        self.blocks = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=embed_dim,
                nhead=num_heads,
                dim_feedforward=4*embed_dim,
                dropout=0.0
            ) for _ in range(depth)
        ])
        
        self.norm = nn.LayerNorm(embed_dim)
        self._init_weights()
    
    def _init_weights(self):
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.xavier_uniform_(self.patch_embed.weight)
    
    def forward(self, x):
        x = self.patch_embed(x)
        x = x.flatten(2).transpose(1, 2)
        
        x = x + self.pos_embed
        for block in self.blocks:
            x = block(x)
        return self.norm(x)

class MAEDecoder(nn.Module):
    def __init__(self, embed_dim=768, depth=8, num_heads=16, patch_size=16, num_patches=196):
        super().__init__()
        self.mask_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        
        self.blocks = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=embed_dim,
                nhead=num_heads,
                dim_feedforward=4*embed_dim
            ) for _ in range(depth)
        ])
        
        self.head = nn.Linear(embed_dim, 3 * patch_size ** 2)
        self._init_weights()
    
    def _init_weights(self):
        nn.init.normal_(self.mask_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
    
    def forward(self, x, ids_restore, ids_keep):
        x = self._unpatchify(x)
        return x
    
    def _unpatchify(self, x):
        C = 3
        p = 16
        h = w = int(x.shape[1] ** 0.5)
        x = x.reshape(shape=(x.shape[0], h, w, p, p, C))
        x = torch.einsum('nhwpqc->nchpwq', x)
        return x.reshape(x.shape[0], C, h * p, w * p)

def mae_loss(reconstructed, original, mask):
    loss = (reconstructed - original) ** 2
    loss = loss.mean(dim=-1)
    loss = (loss * mask).sum() / mask.sum()
    return loss
```

## Best Practices

1. Use stronger augmentations for contrastive learning to create more informative positive pairs.

2. Increase batch size for SimCLR as it directly affects the number of negative samples.

3. Use learning rate warmup and cosine scheduling for stable contrastive training.

4. Monitor representation similarity metrics to track learning progress.

5. Use projection heads to map features to contrastive space, not raw backbone outputs.

6. Apply symmetric loss terms when using two views to ensure balanced optimization.

7. Use momentum encoders to maintain consistency in MoCo and BYOL.

8. Choose appropriate temperature values (typically 0.1) for contrastive losses.

9. Use sufficient epochs for pre-training as contrastive learning converges slower than supervised.

10. Evaluate using linear probing on frozen features to assess representation quality.
