---
name: attention-mechanisms
description: Attention mechanisms in neural networks
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Implement attention mechanisms
- Design transformer architectures
- Build sequence-to-sequence models
- Optimize attention computations
- Apply self-attention and cross-attention
- Create efficient attention patterns

## When to use me

Use me when:
- Building transformer models
- Working with sequence data
- Implementing NLP models
- Creating vision transformers
- Multi-modal learning

## Key Concepts

### Attention Formula
```
Attention(Q, K, V) = softmax(QK^T / √d_k)V

Q = Query (what we're looking for)
K = Key (what we're searching in)
V = Value (content to retrieve)
d_k = dimension of keys
```

### Multi-Head Attention
```python
import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
    
    def split_heads(self, x):
        batch_size = x.size(0)
        x = x.view(batch_size, -1, self.num_heads, self.d_k)
        return x.permute(0, 2, 1, 3)
    
    def forward(self, q, k, v, mask=None):
        Q = self.split_heads(self.W_q(q))
        K = self.split_heads(self.W_k(k))
        V = self.split_heads(self.W_v(v))
        
        # Attention scores
        scores = torch.matmul(Q, K.permute(0, 1, 3, 2))
        scores = scores / math.sqrt(self.d_k)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attn_weights = torch.softmax(scores, dim=-1)
        attn_output = torch.matmul(attn_weights, V)
        
        # Merge heads
        attn_output = attn_output.permute(0, 2, 1, 3).contiguous()
        attn_output = attn_output.view(attn_output.size(0), -1, self.d_model)
        
        return self.W_o(attn_output)
```

### Attention Types
- **Self-Attention**: Q, K, V from same sequence
- **Cross-Attention**: Q from one, K, V from another
- **Causal Attention**: Masked for language modeling
- **Sparse Attention**: Computational efficiency
- **Linear Attention**: Kernel-based approximation

### Transformer Applications
- **BERT**: Bidirectional encoders
- **GPT**: Autoregressive decoders
- **T5**: Encoder-decoder
- **ViT**: Vision transformers
- **Stable Diffusion**: Cross-attention in diffusion
