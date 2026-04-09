---
name: Generative AI
category: ai
description: Techniques and frameworks for generating new data instances that match the distribution of training data
---

# Generative AI

## What I do

I enable systems to create new content including images, text, audio, video, and other data types that resemble patterns found in training data. I power modern creative AI tools, synthetic data generation, and automated content creation workflows. My capabilities span from simple pattern replication to sophisticated creative generation that can produce novel, high-quality outputs indistinguishable from human-created content.

## When to use me

- Creating synthetic training data when real data is scarce or privacy-sensitive
- Generating realistic images, videos, or audio for media and entertainment
- Automating content creation for marketing, design, and creative workflows
- Data augmentation to improve downstream model performance
- Prototyping and ideation in design processes
- Anomaly detection through reconstruction error analysis

## Core Concepts

1. **Generative Adversarial Networks (GANs)**: Two neural networks compete in a game-theoretic framework where a generator creates fake samples and a discriminator tries to distinguish real from fake, driving both toward improvement.

2. **Variational Autoencoders (VAEs)**: Encoder-decoder architectures that learn a compressed latent representation of data distribution, enabling structured sampling and interpolation between samples.

3. **Diffusion Models**: Remove noise from random samples through learned denoising steps, producing high-quality outputs by iteratively refining random noise into coherent data.

4. **Autoregressive Models**: Generate sequences token-by-token conditioned on previously generated tokens, enabling precise control over generation length and content.

5. **Latent Space Navigation**: Moving through the compressed representation learned by generative models to explore variations and interpolate between different outputs.

6. **Mode Collapse**: GAN training pathology where generator produces limited variety of outputs, failing to capture full data distribution diversity.

7. **Temperature Sampling**: Controlling randomness in text generation by adjusting probability distribution sharpness during token selection.

8. **Classifier-Free Guidance**: Technique to balance generation fidelity and diversity without separate classifier models.

## Code Examples

```python
import torch
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self, latent_dim, img_shape):
        super().__init__()
        self.img_shape = img_shape
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.Linear(1024, int(torch.prod(torch.tensor(img_shape)))),
            nn.Tanh()
        )
    
    def forward(self, z):
        img = self.model(z)
        return img.view(img.size(0), *self.img_shape)

class Discriminator(nn.Module):
    def __init__(self, img_shape):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(int(torch.prod(torch.tensor(img_shape))), 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(self, img):
        img_flat = img.view(img.size(0), -1)
        validity = self.model(img_flat)
        return validity
```

```python
import torch
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, latent_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 32, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Flatten()
        )
        self.fc_mu = nn.Linear(64 * 7 * 7, latent_dim)
        self.fc_logvar = nn.Linear(64 * 7 * 7, latent_dim)
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64 * 7 * 7),
            nn.ReLU(),
            nn.Unflatten(1, (64, 7, 7)),
            nn.ConvTranspose2d(64, 32, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32, 1, 3, stride=2, padding=1, output_padding=1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar
    
    def encode(self, x):
        x = self.encoder(x)
        return self.fc_mu(x), self.fc_logvar(x)
    
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        return mu + std * torch.randn_like(std)
    
    def decode(self, z):
        return self.decoder(z)

def vae_loss(recon_x, x, mu, logvar, beta=1.0):
    recon_loss = F.binary_cross_entropy(recon_x, x, reduction='sum')
    kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon_loss + beta * kl_loss
```

```python
import numpy as np

def temperature_sample(logits, temperature=1.0):
    logits = np.array(logits)
    scaled_logits = logits / temperature
    probs = np.exp(scaled_logits - np.max(scaled_logits))
    probs = probs / probs.sum()
    return np.random.choice(len(logits), p=probs)

def nucleus_sample(logits, p=0.9):
    sorted_logits = np.sort(logits)[::-1]
    sorted_probs = np.exp(sorted_logits) / np.sum(np.exp(sorted_logits))
    cumsum = np.cumsum(sorted_probs)
    cutoff = np.searchsorted(cumsum, p)
    indices_to_keep = sorted_logits >= sorted_logits[min(cutoff, len(sorted_logits)-1)]
    logits[~indices_to_keep] = -np.inf
    return logits
```

## Best Practices

1. Start with simpler generative models (VAEs) before advancing to GANs or diffusion models based on your quality requirements.

2. Use progressive growing techniques for high-resolution image generation to stabilize training.

3. Implement proper evaluation metrics like FID (Fréchet Inception Distance) and Inception Score to measure generation quality.

4. Monitor for mode collapse during GAN training by tracking sample diversity.

5. Apply classifier guidance sparingly as it can reduce output diversity while improving adherence to prompts.

6. Use mixed-precision training for diffusion models to reduce memory footprint and speed up training.

7. Consider ethical implications before deploying generative models, including potential misuse for deepfakes or misinformation.

8. Implement content safety filters and watermarking for generated outputs in production systems.

9. Balance model capacity with computational constraints; larger models don't always produce proportionally better results.

10. Use appropriate activation functions (Tanh for image outputs, Sigmoid for normalized data) in generator networks.
