---
name: Multi-Modal Learning
category: ai
description: Integrating and reasoning across multiple data modalities including text, images, audio, and video
---

# Multi-Modal Learning

## What I do

I enable AI systems to process, understand, and generate content across multiple sensory modalities simultaneously. I bridge the gap between different types of data by learning unified representations that capture relationships between text, images, audio, video, and other modalities. My capabilities enable applications like image captioning, visual question answering, text-to-image generation, and cross-modal retrieval.

## When to use me

- Building systems that understand both images and text descriptions
- Creating text-to-image or image-to-text generation systems
- Developing visual question answering applications
- Building cross-modal search and retrieval systems
- Creating video understanding and summarization systems
- Developing multi-modal chatbots that can process images and audio
- Building accessibility tools that describe visual content to blind users

## Core Concepts

1. **Cross-Modal Attention**: Learning attention mechanisms that connect representations across different modalities.

2. **Unified Embedding Spaces**: Learning a common latent space where representations from different modalities can be directly compared.

3. **Modality-Specific Encoders**: Specialized neural networks for each input type that project raw data into useful representations.

4. **Multi-Modal Fusion**: Combining information from multiple modalities through concatenation, attention, or learned fusion functions.

5. **Contrastive Learning**: Learning by pulling together related examples across modalities while pushing apart unrelated ones.

6. **Cross-Modal Retrieval**: Finding relevant content in one modality using queries from another modality.

7. **Vision-Language Models**: Models trained on image-text pairs for tasks like captioning, VQA, and visual reasoning.

8. **Alignment Losses**: Training objectives that enforce correspondence between aligned multi-modal examples.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ImageEncoder(nn.Module):
    def __init__(self, embed_dim=512):
        super().__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=16, stride=16),  # 224 -> 14
            nn.ReLU(),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(256, 512, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.projection = nn.Linear(512, embed_dim)
    
    def forward(self, images):
        features = self.conv_layers(images)
        features = features.view(features.size(0), -1)
        embeddings = self.projection(features)
        return F.normalize(embeddings, p=2, dim=1)

class TextEncoder(nn.Module):
    def __init__(self, vocab_size=30000, embed_dim=512, max_len=77):
        super().__init__()
        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.position_embedding = nn.Parameter(torch.randn(1, max_len, embed_dim))
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=embed_dim, nhead=8),
            num_layers=6
        )
        self.projection = nn.Linear(embed_dim, embed_dim)
    
    def forward(self, tokens):
        batch_size = tokens.size(0)
        embeddings = self.token_embedding(tokens) + self.position_embedding[:, :tokens.size(1), :]
        features = self.transformer(embeddings)
        features = features[:, 0, :]  # CLS token
        return F.normalize(self.projection(features), p=2, dim=1)

class CLIPModel(nn.Module):
    def __init__(self, embed_dim=512, temperature=0.07):
        super().__init__()
        self.image_encoder = ImageEncoder(embed_dim)
        self.text_encoder = TextEncoder(embed_dim=embed_dim)
        self.temperature = nn.Parameter(torch.log(temperature))
    
    def forward(self, images, tokens):
        image_embeds = self.image_encoder(images)
        text_embeds = self.text_encoder(tokens)
        
        logits = torch.matmul(image_embeds, text_embeds.t()) * torch.exp(self.temperature)
        return logits
```

```python
import torch
import torch.nn as nn

class MultiModalFusion(nn.Module):
    def __init__(self, visual_dim=512, text_dim=512, hidden_dim=512):
        super().__init__()
        self.visual_projection = nn.Linear(visual_dim, hidden_dim)
        self.text_projection = nn.Linear(text_dim, hidden_dim)
        
        self.cross_attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=8,
            dropout=0.1
        )
        
        self.ffn = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim * 4, hidden_dim)
        )
        
        self.layer_norm = nn.LayerNorm(hidden_dim)
    
    def forward(self, visual_features, text_features):
        v_proj = self.visual_projection(visual_features)
        t_proj = self.text_projection(text_features)
        
        fused, _ = self.cross_attention(
            query=v_proj.unsqueeze(0),
            key=t_proj.unsqueeze(0),
            value=t_proj.unsqueeze(0)
        )
        
        fused = fused.squeeze(0)
        fused = self.layer_norm(fused + self.ffn(fused))
        return fused

class PerceiverAttention(nn.Module):
    def __init__(self, latent_dim=512, num_heads=8):
        super().__init__()
        self.latent_dim = latent_dim
        self.num_heads = num_heads
        
        self.latent_to_q = nn.Linear(latent_dim, latent_dim)
        self.input_to_kv = nn.Linear(latent_dim, latent_dim * 2)
        self.output_projection = nn.Linear(latent_dim, latent_dim)
    
    def forward(self, latent, inputs):
        q = self.latent_to_q(latent)
        k, v = self.input_to_kv(inputs).chunk(2, dim=-1)
        
        q = q.view(1, self.num_heads, -1).transpose(0, 1)
        k = k.view(-1, self.num_heads, k.size(-1) // self.num_heads).transpose(0, 1)
        v = v.view(-1, self.num_heads, v.size(-1) // self.num_heads).transpose(0, 1)
        
        attn_output, _ = nn.functional.scaled_dot_product_attention(q, k, v)
        attn_output = attn_output.transpose(0, 1).contiguous()
        attn_output = attn_output.view(attn_output.size(0), -1)
        
        return self.output_projection(attn_output)
```

```python
import torch
from torch.utils.data import Dataset
import random
from PIL import Image
import os

class MultiModalDataset(Dataset):
    def __init__(self, data_path, tokenizer, image_transform=None, max_length=77):
        self.data_path = data_path
        self.tokenizer = tokenizer
        self.image_transform = image_transform or self.default_transform()
        self.max_length = max_length
        
        self.annotations = []
        for filename in os.listdir(os.path.join(data_path, "images")):
            if filename.endswith(".jpg") or filename.endswith(".png"):
                base_name = os.path.splitext(filename)[0]
                caption_path = os.path.join(data_path, "captions", f"{base_name}.txt")
                if os.path.exists(caption_path):
                    with open(caption_path) as f:
                        captions = f.read().strip().split('\n')
                    for caption in captions:
                        self.annotations.append({
                            "image": os.path.join(data_path, "images", filename),
                            "caption": caption
                        })
    
    def default_transform(self):
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def __len__(self):
        return len(self.annotations)
    
    def __getitem__(self, idx):
        ann = self.annotations[idx]
        
        image = Image.open(ann["image"]).convert("RGB")
        image = self.image_transform(image)
        
        caption = ann["caption"]
        tokens = self.tokenizer(
            caption,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        return {
            "image": image,
            "input_ids": tokens["input_ids"].squeeze(),
            "attention_mask": tokens["attention_mask"].squeeze()
        }

def contrastive_loss(logits, temperature=0.07):
    labels = torch.arange(logits.size(0)).to(logits.device)
    loss_i = F.cross_entropy(logits, labels)
    loss_t = F.cross_entropy(logits.t(), labels)
    return (loss_i + loss_t) / 2
```

```python
import torch
import torch.nn as nn
import torchaudio

class AudioEncoder(nn.Module):
    def __init__(self, embed_dim=512, audio_length=16000):
        super().__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv1d(1, 32, kernel_size=512, stride=160, padding=160),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Conv1d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Conv1d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm1d(256),
            nn.ReLU(),
        )
        self.projection = nn.Linear(256, embed_dim)
    
    def forward(self, waveform):
        features = self.conv_layers(waveform)
        features = features.mean(dim=2)
        return self.projection(features)

class VideoEncoder(nn.Module):
    def __init__(self, embed_dim=512, num_frames=16):
        super().__init__()
        self.pretrained = torch.hub.load('pytorch/vision', 'r3d_18', pretrained=True)
        self.pretrained.fc = nn.Identity()
        self.projection = nn.Linear(512, embed_dim)
        self.num_frames = num_frames
    
    def forward(self, video):
        if video.size(1) > self.num_frames:
            indices = torch.linspace(0, video.size(1)-1, self.num_frames).long()
            video = video[:, indices]
        features = self.pretrained(video)
        return self.projection(features)

class MultiModalProjector(nn.Module):
    def __init__(self, input_dims, hidden_dim=512, output_dim=512):
        super().__init__()
        self.projections = nn.ModuleList([
            nn.Linear(dim, hidden_dim) for dim in input_dims
        ])
        self.output_projection = nn.Linear(hidden_dim, output_dim)
        self.gelu = nn.GELU()
    
    def forward(self, *modal_features):
        projected = [self.gelu(proj(f)) for proj, f in zip(self.projections, modal_features)]
        combined = torch.stack(projected, dim=1).mean(dim=1)
        return self.output_projection(combined)
```

```python
from typing import Dict, List
import numpy as np

class MultiModalRetrieval:
    def __init__(self, model, image_db, text_db):
        self.model = model
        self.image_db = image_db
        self.text_db = text_db
        self.image_embeddings = None
        self.text_embeddings = None
    
    def index_database(self, batch_size=32):
        self.model.eval()
        self.image_embeddings = []
        
        for i in range(0, len(self.image_db), batch_size):
            batch = self.image_db[i:i+batch_size]
            with torch.no_grad():
                embeds = self.model.image_encoder(batch)
            self.image_embeddings.append(embeds.cpu().numpy())
        
        self.image_embeddings = np.vstack(self.image_embeddings)
    
    def retrieve_text_to_image(self, query: str, k: int = 5) -> List[int]:
        self.model.eval()
        
        tokens = self.model.tokenizer(query, return_tensors="pt")
        with torch.no_grad():
            query_embed = self.model.text_encoder(tokens["input_ids"])
            query_embed = F.normalize(query_embed, p=2, dim=1)
        
        similarities = np.dot(self.image_embeddings, query_embed.squeeze().numpy())
        top_k = np.argsort(similarities)[-k:][::-1]
        return top_k.tolist()
    
    def retrieve_image_to_text(self, query_image: str, k: int = 5) -> List[int]:
        self.model.eval()
        
        image = Image.open(query_image).convert("RGB")
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])
        image_tensor = transform(image).unsqueeze(0)
        
        with torch.no_grad():
            query_embed = self.model.image_encoder(image_tensor)
            query_embed = F.normalize(query_embed, p=2, dim=1)
        
        similarities = np.dot(self.text_embeddings, query_embed.squeeze().numpy())
        top_k = np.argsort(similarities)[-k:][::-1]
        return top_k.tolist()
    
    def evaluate_retrieval(self, ground_truth: Dict[str, List[int]]) -> Dict[str, float]:
        recalls = []
        for query_type, relevant_indices in ground_truth.items():
            if query_type == "text_to_image":
                retrieved = self.retrieve_text_to_image(query_type, k=len(relevant_indices))
            else:
                retrieved = self.retrieve_image_to_text(query_type, k=len(relevant_indices))
            
            relevant_set = set(relevant_indices)
            retrieved_set = set(retrieved)
            
            recall = len(relevant_set & retrieved_set) / len(relevant_set)
            recalls.append(recall)
        
        return {"recall@K": np.mean(recalls)}
```

## Best Practices

1. Use consistent normalization across all modalities for effective cross-modal learning.

2. Preprocess audio to consistent lengths and sample rates for batch processing.

3. Balance the number of examples from each modality during training to prevent modality collapse.

4. Start with pretrained uni-modal encoders and fine-tune incrementally to avoid catastrophic forgetting.

5. Use symmetric and asymmetric contrastive losses depending on the similarity between modalities.

6. Implement modality dropout during training to improve robustness to missing modalities.

7. Consider temporal alignment for video and audio to capture synchronization information.

8. Use attention mechanisms to dynamically weight contributions from different modalities.

9. Evaluate on both uni-modal and cross-modal tasks to ensure balanced performance.

10. Monitor for modality collapse where the model ignores one modality entirely.
