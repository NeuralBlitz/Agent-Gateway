---
name: Zero-Shot Learning
category: ai
description: Recognizing classes without any training examples using semantic attributes and transfer learning
---

# Zero-Shot Learning

## What I do

I enable models to recognize classes they have never seen during training by leveraging semantic relationships between known and unknown classes. I transfer knowledge from seen classes to unseen classes using attributes, textual descriptions, or learned embeddings. This is essential for expanding model capabilities without retraining on new categories.

## When to use me

- Recognizing novel object categories without training data
- Expanding classification systems to new classes dynamically
- Building models that generalize to rare or unseen categories
- Cross-domain transfer where target domain classes differ from source
- Few-shot adaptation where even K=1 examples are unavailable
- Semantic image retrieval based on textual descriptions
- Building open-vocabulary recognition systems

## Core Concepts

1. **Semantic Embeddings**: Dense vector representations that capture class semantics from text or attributes.

2. **Attribute-Based Classification**: Using human-defined or learned attributes as intermediate representation.

3. **Class Embedding Spaces**: Learned spaces where both seen and unseen class embeddings reside.

4. **Generalized Zero-Shot Learning**: Setting where test samples can belong to either seen or unseen classes.

5. **Bias Calibration**: Adjusting predictions to account for the distribution shift between seen and unseen classes.

6. **Semantic Autoencoders**: Learning to reconstruct class embeddings to improve generalization.

7. **Transductive Learning**: Using unlabeled test data to improve zero-shot performance.

8. **Word Embeddings**: Pre-trained embeddings (Word2Vec, GloVe) that provide semantic class representations.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import defaultdict

class SemanticEmbedding(nn.Module):
    def __init__(self, num_classes, embed_dim=300):
        super().__init__()
        self.embeddings = nn.Embedding(num_classes, embed_dim)
    
    def forward(self, class_ids):
        return self.embeddings(class_ids)

class AttributeClassifier(nn.Module):
    def __init__(self, num_attributes, image_dim=512, hidden_dim=256):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(image_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, num_attributes)
        )
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, features):
        attributes = self.fc(features)
        return self.sigmoid(attributes)

class ZeroShotClassifier(nn.Module):
    def __init__(self, seen_classes, unseen_classes, attribute_dim=312, image_dim=512):
        super().__init__()
        self.seen_classes = seen_classes
        self.unseen_classes = unseen_classes
        
        self.image_encoder = nn.Linear(image_dim, attribute_dim)
        
        self.seen_classifier = nn.Linear(attribute_dim, len(seen_classes))
        self.unseen_classifier = nn.Linear(attribute_dim, len(unseen_classes))
        
        self.attribute_matrix = self._create_attribute_matrix()
    
    def _create_attribute_matrix(self):
        attributes = torch.randn(len(self.unseen_classes), 312)
        return nn.Parameter(attributes)
    
    def forward(self, features, training=False):
        projected = self.image_encoder(features)
        
        seen_logits = self.seen_classifier(projected)
        unseen_logits = self.unseen_classifier(projected)
        
        return seen_logits, unseen_logits
    
    def predict(self, features, calibrate=True):
        seen_logits, unseen_logits = self.forward(features)
        
        seen_probs = F.softmax(seen_logits, dim=1)
        unseen_probs = F.softmax(unseen_logits, dim=1)
        
        if calibrate:
            seen_calibrated = seen_probs * 0.6
            unseen_calibrated = unseen_probs * 0.4
            total = seen_calibrated.sum(dim=1, keepdim=True) + unseen_calibrated.sum(dim=1, keepdim=True)
            seen_probs = seen_calibrated / total
            unseen_probs = unseen_calibrated / total
        
        combined = torch.cat([seen_probs, unseen_probs], dim=1)
        all_classes = list(self.seen_classes) + list(self.unseen_classes)
        
        return combined, all_classes
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from scipy.spatial.distance import cdist

class WordEmbeddingExtractor:
    def __init__(self, method="word2vec"):
        import gensim.downloader as api
        self.method = method
        
        if method == "word2vec":
            self.model = api.load("word2vec-google-news-300")
        elif method == "glove":
            self.model = api.load("glove-wiki-gigaword-100")
    
    def get_class_embeddings(self, class_names: list) -> torch.Tensor:
        embeddings = []
        for name in class_names:
            words = name.replace("_", " ").lower().split()
            word_embs = []
            for word in words:
                if word in self.model:
                    word_embs.append(self.model[word])
            if word_embs:
                class_emb = np.mean(word_embs, axis=0)
                embeddings.append(class_emb)
            else:
                embeddings.append(np.random.randn(self.model.vector_size))
        
        return torch.tensor(np.array(embeddings), dtype=torch.float32)

class CLIPZeroShot(nn.Module):
    def __init__(self, embed_dim=512):
        super().__init__()
        self.visual_projection = nn.Linear(512, embed_dim)
        self.text_projection = nn.Linear(512, embed_dim)
        self.logit_scale = nn.Parameter(torch.ones([]) * np.log(1 / 0.07))
    
    def forward(self, images, class_names):
        image_features = self.visual_projection(images)
        image_features = F.normalize(image_features, p=2, dim=1)
        
        text_features = self._encode_text(class_names)
        text_features = F.normalize(text_features, p=2, dim=1)
        
        logits = torch.matmul(image_features, text_features.t()) * self.logit_scale.exp()
        return logits
    
    def _encode_text(self, class_names: list) -> torch.Tensor:
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, preprocess = clip.load("ViT-B/32", device=device)
        
        text_tokens = clip.tokenize([f"a photo of a {name}" for name in class_names])
        with torch.no_grad():
            text_features = model.encode_text(text_tokens.to(device))
        
        return text_features.float().cpu()

class SemanticAutoencoder(nn.Module):
    def __init__(self, input_dim, hidden_dim=1024, latent_dim=300):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, latent_dim)
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )
    
    def forward(self, x):
        z = self.encoder(x)
        x_recon = self.decoder(z)
        return x_recon, z
    
    def loss(self, x, x_recon):
        return F.mse_loss(x_recon, x)
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GZSLPredictor(nn.Module):
    def __init__(self, seen_classes, unseen_classes, semantic_dim=300, visual_dim=512):
        super().__init__()
        self.seen_classes = list(seen_classes)
        self.unseen_classes = list(unseen_classes)
        
        self.semantic_embedder = nn.Linear(visual_dim, semantic_dim)
        self.class_embeddings = nn.Parameter(torch.randn(len(self.unseen_classes), semantic_dim))
        
        self.relation_network = nn.Sequential(
            nn.Linear(semantic_dim * 2, semantic_dim),
            nn.ReLU(),
            nn.Linear(semantic_dim, 1)
        )
    
    def forward(self, features):
        visual_embed = self.semantic_embedder(features)
        visual_embed = F.normalize(visual_embed, p=2, dim=1)
        
        class_embeds = F.normalize(self.class_embeddings, p=2, dim=1)
        
        seen_embed = torch.tensor([
            self.class_embeddings[self.unseen_classes.index(c)] 
            if c in self.unseen_classes else self._get_seen_embed(c)
            for c in self.seen_classes
        ]).to(features.device)
        
        seen_embed = F.normalize(seen_embed, p=2, dim=1)
        
        all_classes = list(self.seen_classes) + list(self.unseen_classes)
        all_embeds = torch.cat([seen_embed, class_embeds], dim=0)
        
        relations = self._compute_relations(visual_embed, all_embeds)
        
        return relations, all_classes
    
    def _compute_relations(self, visual_emb: torch.Tensor,
                          class_embs: torch.Tensor) -> torch.Tensor:
        batch_size = visual_emb.size(0)
        num_classes = class_embs.size(0)
        
        visual_exp = visual_emb.unsqueeze(1).expand(batch_size, num_classes, -1)
        class_exp = class_embs.unsqueeze(0).expand(batch_size, num_classes, -1)
        
        combined = torch.cat([visual_exp, class_exp], dim=2)
        relations = self.relation_network(combined).squeeze(-1)
        
        return relations
    
    def _get_seen_embed(self, class_id):
        return self.seen_class_embeddings[class_id]

class CalibratedStacking(nn.Module):
    def __init__(self, seen_weights=0.3, unseen_weights=0.7):
        super().__init__()
        self.seen_weights = seen_weights
        self.unseen_weights = unseen_weights
    
    def forward(self, seen_logits, unseen_logits):
        seen_probs = F.softmax(seen_logits, dim=1) * self.seen_weights
        unseen_probs = F.softmax(unseen_logits, dim=1) * self.unseen_weights
        
        total = seen_probs.sum(dim=1, keepdim=True) + unseen_probs.sum(dim=1, keepdim=True)
        return seen_probs / total, unseen_probs / total

class TransductiveBiasCorrection(nn.Module):
    def __init__(self, num_iterations=5):
        super().__init__()
        self.num_iterations = num_iterations
    
    def forward(self, features, classifier, class_embeddings):
        classifier.eval()
        
        with torch.no_grad():
            logits = classifier(features)
            probs = F.softmax(logits, dim=1)
        
        avg_unseen_prob = probs[:, len(classifier.seen_classes):].mean(dim=0)
        bias = avg_unseen_prob.mean()
        
        corrected_logits = logits.clone()
        corrected_logits[:, len(classifier.seen_classes):] -= bias
        
        return corrected_logits
```

```python
import numpy as np
from sklearn.metrics import accuracy_score

class ZeroShotEvaluator:
    def __init__(self, seen_classes, unseen_classes):
        self.seen_classes = list(seen_classes)
        self.unseen_classes = list(unseen_classes)
    
    def evaluate(self, model, test_features, test_labels, mode="gzsl"):
        model.eval()
        
        with torch.no_grad():
            logits, class_names = model.predict(test_features)
        
        predictions = logits.argmax(dim=1).numpy()
        
        if mode == "zsl":
            unseen_indices = [i for i, c in enumerate(class_names) if c in self.unseen_classes]
            pred_unseen = [class_names.index(self.unseen_classes[p]) if p < len(self.seen_classes) else
                          self.unseen_classes.index(p) for p in predictions]
            
            unseen_mask = [i for i, l in enumerate(test_labels) if l in self.unseen_classes]
            
            seen_mask = [i for i, l in enumerate(test_labels) if l in self.seen_classes]
            
            seen_acc = accuracy_score([test_labels[i] for i in seen_mask],
                                     [predictions[i] for i in seen_mask])
            unseen_acc = accuracy_score([self.unseen_classes.index(test_labels[i]) for i in unseen_mask],
                                        [self.unseen_classes.index(class_names[predictions[i]]) for i in unseen_mask])
            
            harmonic_mean = 2 * seen_acc * unseen_acc / (seen_acc + unseen_acc + 1e-10)
            
            return {
                "seen_accuracy": seen_acc,
                "unseen_accuracy": unseen_acc,
                "harmonic_mean": harmonic_mean
            }
        
        return {"accuracy": accuracy_score(test_labels, predictions)}

class AttributeBank:
    def __init__(self, attribute_file):
        self.attributes = self._load_attributes(attribute_file)
        self.class_to_attrs = {}
    
    def _load_attributes(self, attribute_file):
        import pandas as pd
        df = pd.read_csv(attribute_file)
        return df
    
    def get_class_attributes(self, class_name):
        if class_name not in self.class_to_attrs:
            row = self.attributes[self.attributes['class'] == class_name]
            self.class_to_attrs[class_name] = torch.tensor(
                row.iloc[:, 1:].values.astype(np.float32)
            )
        return self.class_to_attrs[class_name]
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DEMLZeroShot(nn.Module):
    def __init__(self, seen_classes, unseen_classes, num_attributes=312,
                 visual_dim=2048, attribute_dim=512):
        super().__init__()
        self.seen_classes = list(seen_classes)
        self.unseen_classes = list(unseen_classes)
        
        self.visual_projector = nn.Linear(visual_dim, attribute_dim)
        
        self.attribute_predictor = nn.Linear(attribute_dim, num_attributes)
        
        self.class_to_idx = {c: i for i, c in enumerate(seen_classes + unseen_classes)}
    
    def forward(self, features, labels):
        projected = self.visual_projector(features)
        normalized = F.normalize(projected, p=2, dim=1)
        
        attributes = self.attribute_predictor(normalized)
        
        loss = self._attribute_compatibility_loss(attributes, labels)
        
        return attributes, loss
    
    def _attribute_compatibility_loss(self, predicted_attrs: torch.Tensor,
                                      labels: torch.Tensor) -> torch.Tensor:
        class_attrs = self._get_class_attribute_matrix(labels)
        
        compat = torch.sum(predicted_attrs * class_attrs, dim=1)
        return F.binary_cross_entropy_with_logits(compat, torch.ones_like(compat))
    
    def _get_class_attribute_matrix(self, labels: torch.Tensor) -> torch.Tensor:
        attr_matrix = torch.zeros(len(labels), 312)
        for i, label in enumerate(labels):
            if label in self.seen_classes:
                attr_matrix[i] = self._get_seen_class_attrs(label)
            else:
                attr_matrix[i] = self._get_unseen_class_attrs(label)
        return attr_matrix

class OpenVocabularyClassifier(nn.Module):
    def __init__(self, clip_model, device="cuda"):
        super().__init__()
        self.clip = clip_model
        self.device = device
    
    def forward(self, images, class_names):
        batch_size = images.size(0)
        
        with torch.no_grad():
            image_features = self.clip.encode_image(images).float()
            image_features = F.normalize(image_features, p=2, dim=1)
            
            text_tokens = self._create_prompts(class_names)
            text_features = self.clip.encode_text(text_tokens).float()
            text_features = F.normalize(text_features, p=2, dim=1)
        
        logits = torch.matmul(image_features, text_features.t())
        return logits
    
    def _create_prompts(self, class_names):
        import clip
        prompts = [f"a photo of a {name}" for name in class_names]
        return clip.tokenize(prompts).to(self.device)
```

## Best Practices

1. Use pre-trained semantic embeddings (Word2Vec, GloVe, CLIP) for better class representations.

2. Apply attribute normalization to ensure fair contribution of each attribute to classification.

3. Use calibration techniques (stacking, bias correction) for generalized zero-shot learning.

4. Balance the number of seen and unseen classes during training to avoid bias.

5. Use transductive inference when unlabeled test data is available.

6. Combine multiple semantic sources (attributes, word embeddings) for robust representations.

7. Monitor both seen and unseen class accuracy; high seen accuracy doesn't guarantee good generalization.

8. Use proper evaluation protocols (ZSL, GZSL) based on your application requirements.

9. Apply attribute smoothing or dropout during training to improve robustness.

10. Consider ensemble methods combining multiple zero-shot classifiers for improved performance.
