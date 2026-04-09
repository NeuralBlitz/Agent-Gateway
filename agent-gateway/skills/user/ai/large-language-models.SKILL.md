---
name: Large Language Models
category: ai
description: Advanced techniques for training and fine-tuning transformer-based language models at scale
---

# Large Language Models

## What I do

I provide specialized techniques for working with large-scale transformer models trained on massive text corpora. I cover efficient training strategies, scaling laws, inference optimization, and advanced fine-tuning methods like RLHF. My focus is on making billion-parameter models practical to train, fine-tune, and deploy.

## When to use me

- Training language models from scratch or continuing pre-training
- Fine-tuning models for specific domains or tasks
- Implementing efficient inference with quantization and distillation
- Applying reinforcement learning from human feedback
- Optimizing models for deployment on limited hardware
- Building retrieval-augmented generation systems
- Implementing chain-of-thought and reasoning capabilities
- Managing training at scale with distributed computing

## Core Concepts

1. **Scaling Laws**: Relationship between model size, data, and performance guiding efficient resource allocation.

2. **Gradient Checkpointing**: Trading computation for memory to train larger models.

3. **Mixed Precision Training**: Using FP16/BF16 for faster training with less memory.

4. **ZeRO Optimizations**: Sharding optimizer states, gradients, and parameters across devices.

5. **LoRA Adapters**: Low-rank adaptation for parameter-efficient fine-tuning.

6. **RLHF**: Reinforcement learning from human feedback for alignment.

7. **Flash Attention**: Memory-efficient attention computation.

8. **Model Quantization**: Reducing precision for faster inference and lower memory.

## Code Examples

```python
import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint

class GradientCheckpointedTransformer(nn.Module):
    def __init__(self, d_model=4096, nhead=32, num_layers=32, checkpoint_freq=2):
        super().__init__()
        self.checkpoint_freq = checkpoint_freq
        
        self.layers = nn.ModuleList([
            TransformerLayer(d_model, nhead) for _ in range(num_layers)
        ])
    
    def forward(self, x, mask=None):
        for i, layer in enumerate(self.layers):
            if i % self.checkpoint_freq == 0:
                x = checkpoint(layer, x, mask)
            else:
                x = layer(x, mask)
        return x

class MixedPrecisionTrainer:
    def __init__(self, model, optimizer, device="cuda"):
        self.model = model
        self.optimizer = optimizer
        self.scaler = torch.cuda.amp.GradScaler()
        self.device = device
    
    def train_step(self, batch):
        self.model.train()
        
        with torch.cuda.amp.autocast():
            loss = self.model(**batch)
        
        self.scaler.scale(loss).backward()
        self.scaler.step(self.optimizer)
        self.scaler.update()
        self.optimizer.zero_grad()
        
        return loss.item()
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class LoRA(nn.Module):
    def __init__(self, in_features, out_features, rank=16, alpha=32):
        super().__init__()
        self.rank = rank
        self.alpha = alpha
        
        self.A = nn.Parameter(torch.randn(rank, in_features) * 0.02)
        self.B = nn.Parameter(torch.zeros(out_features, rank))
    
    def forward(self, x):
        original_dtype = x.dtype
        if x.dtype == torch.float16:
            x = x.float()
        
        lora = x @ self.A.t()
        lora = F.linear(lora, self.B.t())
        
        return (lora * (self.alpha / self.rank)).to(original_dtype)

class LoRALinear(nn.Linear):
    def __init__(self, in_features, out_features, rank=16, alpha=32, lora_dropout=0.0):
        super().__init__(in_features, out_features, bias=False)
        self.lora = LoRA(in_features, out_features, rank, alpha)
        self.lora_dropout = nn.Dropout(p=lora_dropout) if lora_dropout > 0 else None
    
    def forward(self, x):
        result = super().forward(x)
        if self.lora_dropout:
            x_dropped = self.lora_dropout(x)
        else:
            x_dropped = x
        return result + self.lora(x_dropped)
```

```python
import torch
import torch.nn as nn
from transformers import AutoModelForCausalLM

class RLHFTrainer:
    def __init__(self, model_name="gpt2", reward_model=None):
        self.policy = AutoModelForCausalLM.from_pretrained(model_name)
        self.ref_policy = AutoModelForCausalLM.from_pretrained(model_name)
        self.ref_policy.requires_grad_(False)
        
        self.reward_model = reward_model
        self.kl_coef = 0.1
        self.clip_range = 0.2
    
    def compute_reward(self, query, response, **kwargs):
        with torch.no_grad():
            reward = self.reward_model(query, response, **kwargs)
        return reward
    
    def ppo_step(self, queries, responses, old_log_probs, advantages):
        logits = self.policy(responses)
        log_probs = F.log_softmax(logits.logits, dim=-1)
        
        log_probs = log_probs.view(-1, logits.logits.size(-1))
        
        ratio = torch.exp(log_probs - old_log_probs)
        
        surr1 = ratio * advantages
        surr2 = torch.clamp(ratio, 1 - self.clip_range, 1 + self.clip_range) * advantages
        
        policy_loss = -torch.min(surr1, surr2).mean()
        
        with torch.no_grad():
            ref_logits = self.ref_policy(responses).logits
            ref_log_probs = F.log_softmax(ref_logits, dim=-1).view(-1, ref_logits.size(-1))
        
        kl = F.kl_div(log_probs, ref_log_probs, reduction='none', log_target=True)
        kl_loss = kl.mean()
        
        total_loss = policy_loss + self.kl_coef * kl_loss
        
        return total_loss
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FlashAttention(nn.Module):
    def __init__(self, embed_dim, num_heads, dropout=0.0):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        
        assert self.head_dim % 8 == 0, "Head dimension must be multiple of 8"
        
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)
        self.W_o = nn.Linear(embed_dim, embed_dim)
        
        self.dropout = nn.Dropout(dropout)
        self.scale = self.head_dim ** -0.5
    
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        
        attn_weights = torch.matmul(Q, K.transpose(-2, -1)) * self.scale
        
        if mask is not None:
            attn_weights = attn_weights.masked_fill(mask == 0, float('-inf'))
        
        attn_weights = F.softmax(attn_weights, dim=-1)
        attn_weights = self.dropout(attn_weights)
        
        return torch.matmul(attn_weights, V)
```

## Best Practices

1. Use gradient checkpointing to trade computation for memory when training large models.

2. Apply mixed precision training with GradScaler for stable FP16 training.

3. Use DeepSpeed ZeRO for model parallel training beyond single GPU limits.

4. Start with LoRA for fine-tuning before full fine-tuning based on resources.

5. Monitor training stability with gradient norm and loss curves.

6. Use learning rate warmup and cosine scheduling for large model training.

7. Apply weight decay (0.01-0.1) but exclude biases and LayerNorm weights.

8. Use appropriate batch sizes that fit in GPU memory with gradient accumulation.

9. Validate RLHF reward models before use in training.

10. Use Flash Attention for longer context windows and faster training.
