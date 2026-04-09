---
name: signal-processing
description: Signal processing theory and applications
license: MIT
compatibility: opencode
metadata:
  audience: engineers, scientists, students
  category: engineering
---

## What I do

- Design digital filters and signal processing algorithms
- Analyze signals in time and frequency domains
- Implement Fourier transforms and spectral analysis
- Develop signal conditioning and preprocessing
- Create data compression and feature extraction

## When to use me

- When filtering noisy signals
- When analyzing frequency content
- When designing digital filters
- When extracting features from signals
- When implementing DSP algorithms

## Key Concepts

### Discrete Signals

```python
import numpy as np
from scipy import signal, fft

# Signal generation
def generate_sine(freq, amplitude, duration, fs):
    """Generate sinusoidal signal"""
    t = np.arange(0, duration, 1/fs)
    return t, amplitude * np.sin(2 * np.pi * freq * t)

def generate_impulse(N):
    """Unit impulse signal"""
    impulse = np.zeros(N)
    impulse[0] = 1
    return impulse

def generate_step(N):
    """Unit step signal"""
    return np.ones(N)

# Basic operations
def convolution(x, h):
    """Linear convolution"""
    return np.convolve(x, h, mode='full')

def correlation(x, y):
    """Cross-correlation"""
    return np.correlate(x, y, mode='full')
```

### Fourier Transform

```python
# DFT/FFT
def compute_fft(x, fs):
    """Compute frequency spectrum"""
    N = len(x)
    X = fft.fft(x)
    freq = fft.fftfreq(N, 1/fs)
    
    # Get positive frequencies only
    positive = slice(0, N//2)
    return freq[positive], np.abs(X[positive])

def compute_stft(x, fs, nperseg=256, noverlap=None):
    """Short-Time Fourier Transform"""
    if noverlap is None:
        noverlap = nperseg // 2
    
    f, t, Sxx = signal.stft(x, fs, nperseg=nperseg, noverlap=noverlap)
    return f, t, np.abs(Sxx)

# Window functions
WINDOWS = {
    "hamming": lambda N: signal.windows.hamming(N),
    "hann": lambda N: signal.windows.hann(N),
    "blackman": lambda N: signal.windows.blackman(N),
    "kaiser": lambda N, beta=0: signal.windows.kaiser(N, beta)
}
```

### Digital Filters

```python
# IIR Filter design
def design_butterworth_lowpass(cutoff, fs, order=4):
    """Design Butterworth lowpass filter"""
    nyquist = fs / 2
    normalized = cutoff / nyquist
    b, a = signal.butter(order, normalized, btype='low')
    return b, a

def design_cheby1_lowpass(cutoff, fs, order=4, ripple=0.5):
    """Chebyshev Type I lowpass filter"""
    nyquist = fs / 2
    normalized = cutoff / nyquist
    b, a = signal.cheby1(order, ripple, normalized, btype='low')
    return b, a

def apply_filter(b, a, x):
    """Apply IIR filter using difference equation"""
    return signal.filtfilt(b, a, x)

# FIR Filter design
def design_fir_lowpass(cutoff, fs, num_taps=51):
    """Design FIR lowpass using window method"""
    nyquist = fs / 2
    normalized = cutoff / nyquist
    b = signal.firwin(num_taps, normalized, window='hamming')
    return b

# Filter structures
def direct_form_1(b, a, x):
    """Direct Form I IIR filter"""
    N = len(b)
    M = len(a)
    y = np.zeros(len(x))
    
    for n in range(len(x)):
        for i in range(min(n+1, N)):
            y[n] += b[i] * x[n-i]
        for i in range(1, min(n+1, M)):
            y[n] -= a[i] * y[n-i]
    
    return y
```

### Filter Response Analysis

```python
def frequency_response(b, a, fs):
    """Compute frequency response"""
    w, h = signal.freqz(b, a, worN=204    freq = w8)
 * fs / (2 * np.pi)
    return freq, 20 * np.log10(np.abs(h))

def phase_response(b, a):
    """Compute phase response"""
    w, h = signal.freqz(b, a, worN=2048)
    phase = np.unwrap(np.angle(h))
    return w, phase

def group_delay(b, a):
    """Compute group delay"""
    w, gd = signal.group_delay((b, a))
    return w, gd
```

### Spectral Analysis

```python
def periodogram(x, fs):
    """Compute periodogram (power spectral density)"""
    f, Pxx = signal.periodogram(x, fs)
    return f, Pxx

def welch_psd(x, fs, nperseg=256):
    """Compute PSD using Welch's method"""
    f, Pxx = signal.welch(x, fs, nperseg=nperseg)
    return f, Pxx

def spectrogram(x, fs, nperseg=256):
    """Compute spectrogram"""
    f, t, Sxx = signal.spectrogram(x, fs, nperseg=nperseg)
    return f, t, 10 * np.log10(Sxx)
```

### Adaptive Filters

```python
class LMSFilter:
    """Least Mean Squares adaptive filter"""
    def __init__(self, filter_length, mu):
        self.length = filter_length
        self.mu = mu  # Step size
        self.weights = np.zeros(filter_length)
    
    def filter(self, x, d):
        """Process input signal"""
        y = np.zeros_like(d)
        
        for n in range(len(d)):
            x_window = np.flip(x[max(0, n-self.length+1):n+1])
            if len(x_window) < self.length:
                x_window = np.pad(x_window, (self.length - len(x_window), 0))
            
            y[n] = np.dot(self.weights, x_window)
            error = d[n] - y[n]
            self.weights += self.mu * error * x_window
        
        return y

class RLSFilter:
    """Recursive Least Squares filter"""
    def __init__(self, filter_length, delta=0.01, lam=0.99):
        self.length = filter_length
        self.lam = lam  # Forgetting factor
        self.delta = delta
        self.weights = np.zeros(filter_length)
        self.P = np.eye(filter_length) / delta
    
    def filter(self, x, d):
        """Process input signal"""
        y = np.zeros_like(d)
        
        for n in range(len(d)):
            x_window = np.flip(x[max(0, n-self.length+1):n+1])
            if len(x_window) < self.length:
                x_window = np.pad(x_window, (self.length - len(x_window), 0))
            
            y[n] = np.dot(self.weights, x_window)
            error = d[n] - y[n]
            
            k = self.P @ x_window / (self.lam + x_window @ self.P @ x_window)
            self.weights += k * error
            self.P = (self.P - np.outer(k, x_window @ self.P)) / self.lam
        
        return y
```

### Feature Extraction

```python
def extract_features(signal_data, fs):
    """Extract common time-domain features"""
    features = {
        "mean": np.mean(signal_data),
        "std": np.std(signal_data),
        "rms": np.sqrt(np.mean(signal_data**2)),
        "peak": np.max(np.abs(signal_data)),
        "crest_factor": np.max(np.abs(signal_data)) / np.sqrt(np.mean(signal_data**2)),
        "skewness": stats.skew(signal_data),
        "kurtosis": stats.kurtosis(signal_data)
    }
    
    # Zero crossing rate
    features["zcr"] = np.sum(np.diff(np.sign(signal_data)) != 0) / len(signal_data)
    
    return features
```
