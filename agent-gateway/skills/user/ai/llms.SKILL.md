---
name: Large Language Models
category: ai
description: Foundational understanding and practical implementation of transformer-based language models
---

# Large Language Models

## What I do

I provide the foundation for understanding and working with transformer-based models trained on massive text corpora. I enable natural language understanding, generation, translation, summarization, question answering, and countless other language tasks. My core innovation lies in the attention mechanism that allows models to weigh the importance of different parts of input when processing language.

## When to use me

- Building conversational AI and chatbots
- Document summarization and information extraction
- Code generation and debugging assistance
- Multi-language translation systems
- Text classification and sentiment analysis
- Knowledge retrieval and question answering
- Content generation and copywriting

## Core Concepts

1. **Self-Attention Mechanism**: Computes relationships between all tokens in a sequence, allowing each token to attend to every other token with learned attention weights.

2. **Positional Encoding**: Injects position information into token embeddings since transformers are permutation-invariant by design.

3. **Multi-Head Attention**: Parallel attention computations that capture different types of relationships between tokens.

4. **Feed-Forward Networks**: Position-wise transformations that process attention outputs through learned nonlinear functions.

5. **Layer Normalization**: Stabilizes training by normalizing activations within each layer.

6. **Tokenization**: Converting raw text into token sequences that models can process, typically using BPE or SentencePiece algorithms.

7. **Context Window**: Maximum number of tokens a model can attend to simultaneously, limiting input length.

8. **In-Context Learning**: Model's ability to learn from examples provided in the prompt without weight updates.

## Code Examples

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
    
    def attention(self, Q, K, V, mask=None):
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = torch.softmax(scores, dim=-1)
        return torch.matmul(attn, V), attn
    
    def forward(self, Q, K, V, mask=None):
        batch_size = Q.size(0)
        
        Q = self.W_q(Q).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(K).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(V).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        attn, attn_weights = self.attention(Q, K, V, mask)
        attn = attn.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        
        return self.W_o(attn), attn_weights
```

```python
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

def generate_text(prompt, model_name="gpt2", max_new_tokens=100, temperature=0.7, top_k=50):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    inputs = tokenizer(prompt, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

prompt = "The future of artificial intelligence involves"
generated = generate_text(prompt, temperature=0.8)
print(generated)
```

```python
import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F

def get_embeddings(texts, model_name="bert-base-uncased", pooling="mean"):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    
    encoded = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model(**encoded)
    
    hidden_states = outputs.last_hidden_state
    
    if pooling == "mean":
        attention_mask = encoded["attention_mask"]
        mask = attention_mask.unsqueeze(-1).expand(hidden_states.size()).float()
        summed = torch.sum(hidden_states * mask, 1)
        counts = torch.clamp(attention_mask.sum(1), min=1e-9)
        embeddings = summed / counts
    elif pooling == "cls":
        embeddings = hidden_states[:, 0]
    
    embeddings = F.normalize(embeddings, p=2, dim=1)
    return embeddings

texts = ["I love machine learning", "Deep learning is fascinating", "Neural networks are powerful"]
embeddings = get_embeddings(texts)
similarity = torch.mm(embeddings, embeddings.T)
print("Semantic similarity matrix:")
print(similarity)
```

```python
import torch
import torch.nn as nn
from torch.nn import functional as F

class PositionwiseFeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        return self.linear2(self.dropout(F.relu(self.linear1(x))))

class TransformerBlock(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = PositionwiseFeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        attn_output, _ = self.attention(x, x, x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_output))
        return x
```

```python
import torch
from collections import Counter
import re

class BytePairEncoding:
    def __init__(self, vocab_size=1000):
        self.vocab_size = vocab_size
        self.word_freq = Counter()
        self.merges = {}
        self.vocab = {}
    
    def train(self, text, num_merges=100):
        words = re.findall(r'\S+', text.lower())
        self.word_freq.update(words)
        self.base_vocab = set(ch for word in words for ch in word)
        self.vocab = {ch: i for i, ch in enumerate(sorted(self.base_vocab))}
        
        for i in range(num_merges):
            pairs = Counter()
            for word, freq in self.word_freq.items():
                for j in range(len(word) - 1):
                    pairs[(word[j], word[j+1])] += freq
            
            if not pairs:
                break
            best_pair = pairs.most_common(1)[0][0]
            self.merges[best_pair] = len(self.vocab)
            self.vocab[chr(best_pair[0]) + chr(best_pair[1])] = len(self.vocab)
            
            new_word = word.replace(chr(best_pair[0]) + chr(best_pair[1]), chr(best_pair[0]) + chr(best_pair[1]))
            del self.word_freq[word]
            self.word_freq[new_word] = freq
    
    def encode(self, text):
        tokens = list(text)
        while len(tokens) > 1:
            pairs = [(tokens[i], tokens[i+1]) for i in range(len(tokens)-1)]
            if not any(p in self.merges for p in pairs):
                break
            merge_pairs = [p for p in pairs if p in self.merges]
            best_pair = min(merge_pairs, key=lambda p: self.merges[p])
            
            new_tokens = []
            skip = False
            for i in range(len(tokens)):
                if skip:
                    skip = False
                    continue
                if i < len(tokens) - 1 and (tokens[i], tokens[i+1]) == best_pair:
                    new_tokens.append(tokens[i] + tokens[i+1])
                    skip = True
                else:
                    new_tokens.append(tokens[i])
            tokens = new_tokens
        return tokens
```

## Best Practices

1. Choose appropriate model size based on task complexity and computational constraints; larger isn't always better.

2. Fine-tune models on domain-specific data for specialized applications rather than using generic pre-trained models.

3. Implement proper attention masking to prevent attending to padding tokens and future tokens in autoregressive models.

4. Use learning rate warmup and cosine scheduling for stable transformer training.

5. Apply gradient checkpointing to reduce memory usage when training deep transformers.

6. Monitor token-level and sequence-level metrics during training to catch issues early.

7. Use appropriate loss functions (cross-entropy for language modeling, specific losses for other tasks).

8. Implement proper evaluation protocols including few-shot evaluation for comprehensive assessment.

9. Consider model distillation for deployment scenarios with strict latency requirements.

10. Regularly update tokenizer vocabulary when adding new domain-specific terminology.
