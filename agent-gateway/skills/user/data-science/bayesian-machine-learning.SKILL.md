---
name: Bayesian Machine Learning
category: data-science
description: Quantifying uncertainty and incorporating prior knowledge using probabilistic inference
---

# Bayesian Machine Learning

## What I do

I enable rigorous uncertainty quantification by treating model parameters as probability distributions rather than point estimates. By incorporating prior knowledge and updating beliefs with data, I provide principled confidence estimates for predictions. This is essential for safety-critical applications and decision-making under uncertainty.

## When to use me

- Quantifying prediction uncertainty in critical applications
- Incorporating domain knowledge through priors
- Small data regimes where priors provide regularization
- Active learning with uncertainty estimates
- Model selection through Bayes factors
- Comparing models with different complexities
- Continual learning with belief updates
- Building robust systems with calibrated uncertainties

## Core Concepts

1. **Bayes' Theorem**: Updating probability beliefs with new evidence.

2. **Prior Distribution**: Initial beliefs before observing data.

3. **Posterior Distribution**: Updated beliefs after seeing data.

4. **Likelihood**: Probability of data given parameters.

5. **Evidence**: Marginal probability of data.

6. **Variational Inference**: Approximating posteriors with simpler distributions.

7. **Monte Carlo Methods**: Sampling-based posterior approximation.

8. **Uncertainty Decomposition**: Aleatoric vs. epistemic uncertainty.

## Code Examples

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class BayesianLinear(nn.Module):
    def __init__(self, in_features, out_features, prior_mean=0.0, prior_std=1.0):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        
        self.weight_mu = nn.Parameter(torch.Tensor(out_features, in_features))
        self.weight_rho = nn.Parameter(torch.Tensor(out_features, in_features))
        self.bias_mu = nn.Parameter(torch.Tensor(out_features))
        self.bias_rho = nn.Parameter(torch.Tensor(out_features))
        
        self.prior_mean = prior_mean
        self.prior_std = prior_std
        
        self.reset_parameters()
    
    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight_mu)
        nn.init.zeros_(self.bias_mu)
        nn.init.constant_(self.weight_rho, -4.0)
        nn.init.constant_(self.bias_rho, -4.0)
    
    def forward(self, x):
        weight_sigma = F.softplus(self.weight_rho)
        bias_sigma = F.softplus(self.bias_rho)
        
        weight_eps = torch.randn_like(self.weight_mu)
        bias_eps = torch.randn_like(self.bias_mu)
        
        weight = self.weight_mu + weight_sigma * weight_eps
        bias = self.bias_mu + bias_sigma * bias_eps
        
        self.save_weight_for_kl(weight, weight_sigma)
        
        return F.linear(x, weight, bias)
    
    def save_weight_for_kl(self, weight, weight_sigma):
        if self.training:
            self.last_weight = weight
            self.last_weight_sigma = weight_sigma
    
    def kl_divergence(self):
        if not self.training or not hasattr(self, 'last_weight'):
            return torch.tensor(0.0, device=self.weight_mu.device)
        
        kl_weight = self._kl_normal(self.last_weight, self.last_weight_sigma)
        kl_bias = self._kl_normal(self.bias_mu, F.softplus(self.bias_rho))
        
        return kl_weight + kl_bias
    
    def _kl_normal(self, mu, sigma):
        var = sigma ** 2
        return 0.5 * (torch.log(var) / np.log(np.e) - torch.log(self.prior_std ** 2) + 
                     (self.prior_std ** 2 + (self.prior_mean - mu) ** 2) / var - 1)
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class VariationalInference:
    def __init__(self, model, prior_std=1.0, kl_weight=1.0):
        self.model = model
        self.prior_std = prior_std
        self.kl_weight = kl_weight
    
    def loss(self, x, y):
        logits = self.model(x)
        
        nll = F.cross_entropy(logits, y, reduction='mean')
        
        kl = self._compute_kl()
        
        return nll + self.kl_weight * kl
    
    def _compute_kl(self):
        kl = 0.0
        for module in self.model.modules():
            if hasattr(module, 'kl_divergence'):
                kl += module.kl_divergence()
        
        return kl
    
    def train_step(self, optimizer, x, y):
        optimizer.zero_grad()
        loss = self.loss(x, y)
        loss.backward()
        optimizer.step()
        
        return loss.item()
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MCDropout(nn.Module):
    def __init__(self, base_model, dropout_rate=0.5):
        super().__init__()
        self.base_model = base_model
        self.dropout_rate = dropout_rate
    
    def forward(self, x):
        return F.dropout(x, p=self.dropout_rate, training=self.training)

class MCEnsembleUncertainty:
    def __init__(self, model, n_samples=30, dropout_rate=0.5):
        self.model = model
        self.n_samples = n_samples
        self.dropout_rate = dropout_rate
    
    def predict_with_uncertainty(self, x):
        self.model.eval()
        
        all_predictions = []
        
        with torch.no_grad():
            for _ in range(self.n_samples):
                self.model.train()
                predictions = F.softmax(self.model(x), dim=1)
                all_predictions.append(predictions)
        
        self.model.eval()
        
        all_predictions = torch.stack(all_predictions)
        
        mean_prediction = all_predictions.mean(dim=0)
        
        variance = all_predictions.var(dim=0)
        predictive_uncertainty = variance.sum(dim=1)
        
        aleatoric_uncertainty = (mean_prediction * (1 - mean_prediction)).sum(dim=1)
        
        epistemic_uncertainty = predictive_uncertainty - aleatoric_uncertainty
        
        return mean_prediction, predictive_uncertainty, aleatoric_uncertainty, epistemic_uncertainty
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class LaplaceApproximation:
    def __init__(self, model):
        self.model = model
        self.hessian = None
    
    def fit(self, train_loader):
        self.model.eval()
        
        params = [p for p in self.model.parameters() if p.requires_grad]
        
        self.hessian = self._compute_hessian(params, train_loader)
        
        self.posterior_precision = self.hessian
        self.prior_precision = torch.eye(1)
    
    def _compute_hessian(self, params, train_loader):
        loss = 0
        count = 0
        
        for x, y in train_loader:
            logits = self.model(x)
            loss += F.cross_entropy(logits, y)
            count += 1
        
        loss = loss / count
        
        grads = torch.autograd.grad(loss, params, create_graph=True)
        
        flat_grad = torch.cat([g.view(-1) for g in grads])
        
        hessian = torch.zeros(len(flat_grad), len(flat_grad))
        
        for i, g in enumerate(flat_grad):
            hess_i = torch.autograd.grad(g, params, retain_graph=True)
            hessian[i] = torch.cat([h.view(-1) for h in hess_i])
        
        return hessian
    
    def predict_with_uncertainty(self, x):
        self.model.eval()
        
        with torch.no_grad():
            predictions = F.softmax(self.model(x), dim=1)
        
        if self.hessian is not None:
            variance = torch.diag(torch.inverse(self.hessian))
            uncertainty = torch.sqrt(variance[:predictions.size(0)])
        else:
            uncertainty = torch.zeros(predictions.size(0))
        
        return predictions, uncertainty
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class BayesianNeuralNetwork:
    def __init__(self, input_dim=784, hidden_dims=[256, 128], output_dim=10,
                 prior_mean=0.0, prior_std=1.0, n_posterior_samples=30):
        self.n_posterior_samples = n_posterior_samples
        
        self.layers = nn.ModuleList()
        dims = [input_dim] + hidden_dims + [output_dim]
        
        for i in range(len(dims) - 1):
            self.layers.append(BayesianLinear(dims[i], dims[i + 1], prior_mean, prior_std))
        
        self.kl_weight = 1.0 / len(dims[1:-1])
    
    def forward(self, x):
        for layer in self.layers[:-1]:
            x = F.relu(layer(x))
            x = F.dropout(x, p=0.1, training=self.training)
        x = self.layers[-1](x)
        return x
    
    def loss(self, x, y):
        logits = self.forward(x)
        nll = F.cross_entropy(logits, y, reduction='mean')
        
        kl = 0.0
        for layer in self.layers:
            if hasattr(layer, 'kl_divergence'):
                kl += layer.kl_divergence()
        
        return nll + self.kl_weight * kl
    
    def sample_predict(self, x, n_samples=None):
        n_samples = n_samples or self.n_posterior_samples
        self.model.eval()
        
        all_probs = []
        
        with torch.no_grad():
            for _ in range(n_samples):
                logits = self.forward(x)
                probs = F.softmax(logits, dim=1)
                all_probs.append(probs)
        
        all_probs = torch.stack(all_probs)
        
        mean_probs = all_probs.mean(dim=0)
        
        predictive_entropy = -(mean_probs * torch.log(mean_probs + 1e-10)).sum(dim=1)
        
        expected_entropy = -(all_probs * torch.log(all_probs + 1e-10)).sum(dim=2).mean(dim=0)
        
        mutual_info = predictive_entropy - expected_entropy
        
        return mean_probs, predictive_entropy, mutual_info

class BayesianOptimizer:
    def __init__(self, model, lr=0.001):
        self.model = model
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
    
    def train(self, train_loader, epochs=100):
        for epoch in range(epochs):
            total_loss = 0
            for x, y in train_loader:
                self.optimizer.zero_grad()
                loss = self.model.loss(x, y)
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()
            
            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch + 1}: Loss = {total_loss / len(train_loader):.4f}")
        
        return self.model
```

## Best Practices

1. Choose appropriate priors based on domain knowledge and regularization needs.

2. Start with simple variational approximations before complex methods.

3. Use proper scaling of KL divergence for mini-batch training.

4. Monitor KL divergence to detect posterior collapse or over-regularization.

5. Use MC Dropout for fast uncertainty estimation when full BNN is too slow.

6. Combine multiple posterior samples for more stable uncertainty estimates.

7. Validate calibration of uncertainty estimates on test data.

8. Consider computational cost vs. uncertainty quality trade-offs.

9. Use reparameterization trick for stable gradient estimation.

10. Apply temperature scaling to calibrate predictive probabilities.
