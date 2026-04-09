---
name: Neuroscience
description: Neural science including neuronal modeling, synaptic transmission, neural networks, brain imaging analysis, and cognitive neuroscience for biomedical applications.
license: MIT
compatibility: python>=3.8
audience: neuroscientists, cognitive-scientists, researchers, medical-professionals
category: biology
---

# Neuroscience

## What I Do

I provide comprehensive neuroscience tools including neuronal modeling, synaptic dynamics, neural network analysis, brain imaging quantification, EEG/MEG signal processing, and cognitive assessment for biomedical research applications.

## When to Use Me

- Neuronal spiking models
- Synaptic plasticity analysis
- Brain imaging data analysis
- Neural signal processing
- Cognitive testing analysis
- Neuropharmacology studies

## Core Concepts

- **Neuronal Models**: Hodgkin-Huxley, integrate-and-fire
- **Synaptic Transmission**: Neurotransmitter release, receptors
- **Synaptic Plasticity**: LTP, LTD, STDP
- **Neural Networks**: Connectivity, activity patterns
- **Brain Imaging**: fMRI, PET, structural analysis
- **Neural Signals**: EEG, MEG, LFP analysis
- **Cognitive Neuroscience**: Behavioral paradigms
- **Neuropharmacology**: Drug-receptor interactions

## Code Examples

### Hodgkin-Huxley Model

```python
import numpy as np

def alpha_n(V):
    return 0.01 * (V + 55) / (1 - np.exp(-(V + 55) / 10))

def beta_n(V):
    return 0.125 * np.exp(-(V + 65) / 80)

def alpha_m(V):
    return 0.1 * (V + 40) / (1 - np.exp(-(V + 40) / 10))

def beta_m(V):
    return 4 * np.exp(-(V + 65) / 18)

def alpha_h(V):
    return 0.07 * np.exp(-(V + 65) / 20)

def beta_h(V):
    return 1 / (1 + np.exp(-(V + 35) / 10))

def hodgkin_huxley_step(V, n, m, h, dt, I_ext):
    dn = (alpha_n(V) * (1 - n) - beta_n(V) * n) * dt
    dm = (alpha_m(V) * (1 - m) - beta_m(V) * m) * dt
    dh = (alpha_h(V) * (1 - h) - beta_h(V) * h) * dt
    
    dV = (I_ext - 36 * n**4 * (V - 12) - 120 * m**3 * h * (V + 115) - 0.3 * (V + 10.613)) * dt
    
    return V + dV, n + dn, m + dm, h + dh

def simulate_hh(dt=0.01, T=100, I_inj=10):
    V = -65
    n = alpha_n(V) / (alpha_n(V) + beta_n(V))
    m = alpha_m(V) / (alpha_m(V) + beta_m(V))
    h = alpha_h(V) / (alpha_h(V) + beta_h(V))
    
    t = np.arange(0, T, dt)
    V_trace = np.zeros_like(t)
    
    for i, ti in enumerate(t):
        V, n, m, h = hodgkin_huxley_step(V, n, m, h, dt, I_inj)
        V_trace[i] = V
    
    return t, V_trace
```

### Integrate-and-Fire Model

```python
class LeakyIntegrateAndFire:
    def __init__(self, C=1, gL=0.1, EL=-70, Vth=-50, Vreset=-75, tau_ref=2):
        self.C = C
        self.gL = gL
        self.EL = EL
        self.Vth = Vth
        self.Vreset = Vreset
        self.tau_ref = tau_ref
        self.V = EL
    
    def update(self, I, dt):
        if self.tau_ref > 0:
            self.tau_ref -= dt
            return False
        
        dV = (-self.gL * (self.V - self.EL) + I) / self.C * dt
        self.V += dV
        
        if self.V >= self.Vth:
            self.V = self.Vreset
            self.tau_ref = 2
            return True
        return False
    
    def simulate(self, I_func, T, dt):
        t = np.arange(0, T, dt)
        spikes = []
        V_trace = []
        
        for ti in t:
            I = I_func(ti) if callable(I_func) else I
            spiked = self.update(I, dt)
            if spiked:
                spikes.append(ti)
            V_trace.append(self.V)
        
        return np.array(t), np.array(V_trace), np.array(spikes)

neuron = LeakyIntegrateAndFire()
t, V, spikes = neuron.simulate(lambda t: 2.5, 100, 0.1)
print(f"Spike count: {len(spikes)}")
print(f"Average firing rate: {len(spikes) / 100 * 1000:.1f} Hz")
```

### Spike Timing Dependent Plasticity

```python
def stdp_rule(dt, A_plus=1, tau_plus=20, A_minus=1, tau_minus=20):
    if dt > 0:
        return A_plus * np.exp(-dt / tau_plus)
    else:
        return -A_minus * np.exp(dt / tau_minus)

def update_weights_stdp(weights, pre_spikes, post_spikes, dt, time_window=100):
    dw = np.zeros_like(weights)
    
    for i, t_pre in enumerate(pre_spikes):
        for j, t_post in enumerate(post_spikes):
            delta_t = t_post - t_pre
            if abs(delta_t) <= time_window:
                dw[i, j] = stdp_rule(delta_t)
    
    weights = np.clip(weights + dw, 0, 1)
    return weights

def hebbian_learning(pre_activity, post_activity, learning_rate=0.01):
    delta_w = learning_rate * np.outer(pre_activity, post_activity)
    return delta_w

def oja's_rule(pre_activity, post_activity, w, alpha=0.001):
    delta_w = post_activity * (pre_activity - alpha * post_activity * w)
    return delta_w
```

### Neural Signal Processing

```python
from scipy import signal

def bandpower(data, fs, band):
    f, Pxx = signal.welch(data, fs=fs, nperseg=1024)
    idx_band = np.logical_and(f >= band[0], f <= band[1])
    return np.trapz(Pxx[idx_band], f[idx_band])

def extract_lfp_features(lfp_signal, sampling_rate=1000):
    theta = bandpower(lfp_signal, sampling_rate, [4, 8])
    gamma = bandpower(lfp_signal, sampling_rate, [30, 100])
    delta = bandpower(lfp_signal, sampling_rate, [0.5, 4])
    
    return {'theta': theta, 'gamma': gamma, 'delta': delta}

def detect_spikes_amplitude(data, threshold=-3):
    std = np.std(data)
    mean = np.mean(data)
    threshold_val = mean + threshold * std
    
    spikes = np.where(data > threshold_val)[0]
    return spikes

def coherence_analysis(signal1, signal2, fs=1000):
    f, Cxy = signal.coherence(signal1, signal2, fs=fs, nperseg=256)
    return f, Cxy
```

### fMRI Analysis Basics

```python
def spm_hrf(TR, num_volumes):
    import scipy.stats as stats
    d = np.arange(0, num_volumes * TR, TR)
    hrf = stats.gamma.pdf(d, 6) - stats.gamma.pdf(d, 16) / 6
    return hrf / np.sum(hrf)

def motion_correction(motion_params):
    corrections = {
        'translation_x': motion_params[0],
        'translation_y': motion_params[1],
        'translation_z': motion_params[2],
        'rotation_x': motion_params[3],
        'rotation_y': motion_params[4],
        'rotation_z': motion_params[5]
    }
    return corrections

def compute_beta_maps(design_matrix, bold_timeseries):
    betas = np.linalg.lstsq(design_matrix, bold_timeseries, rcond=None)[0]
    return betas

def roi_timeseries提取(roi_mask, bold_data):
    n_timepoints = bold_data.shape[3]
    roi_ts = np.zeros(n_timepoints)
    for t in range(n_timepoints):
        roi_ts[t] = np.mean(bold_data[:, :, :, t][roi_mask])
    return roi_ts
```

## Best Practices

1. **Model Validation**: Compare with experimental data
2. **Parameter Sensitivity**: Test parameter ranges
3. **Noise**: Include realistic noise models
4. **Spatial Resolution**: Consider imaging limitations
5. **Multiple Comparisons**: Correct for fMRI analysis

## Common Patterns

```python
# Firing rate calculation
def firing_rate(spike_times, bin_size, time_range):
    bins = np.arange(time_range[0], time_range[1] + bin_size, bin_size)
    counts, _ = np.histogram(spike_times, bins)
    return counts / bin_size

# Information theory measures
def mutual_information(rate1, rate2):
    from sklearn.metrics import mutual_info_score
    return mutual_info_score(rate1, rate2)

# Neural decoding
def neural_decoding(patterns, labels):
    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression()
    clf.fit(patterns, labels)
    return clf.score(patterns, labels)
```

## Core Competencies

1. Biophysical neuron modeling
2. Synaptic plasticity mechanisms
3. Neural signal processing
4. Brain imaging analysis
5. Cognitive paradigm analysis
