---
name: signal-processing
description: Signal processing fundamentals including Fourier analysis, filter design, sampling theory, spectral estimation, and adaptive filtering
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Analyze signals in time and frequency domains
- Design digital and analog filters
- Perform spectral analysis and estimation
- Implement adaptive filtering algorithms
- Process audio, image, and sensor data
- Design sampling and reconstruction systems
- Implement signal compression and encoding
- Develop detection and estimation algorithms

## When to use me
When analyzing signals, designing filters, implementing spectral analysis, or processing sensor data for embedded systems and applications.

## Core Concepts
- Fourier analysis (DFT, FFT, DTFT)
- Sampling theory and aliasing
- Filter design (FIR, IIR, analog)
- Z-transform and system representation
- Spectral estimation (periodogram, Welch, parametric)
- Adaptive filtering (LMS, RLS, Kalman)
- Window functions and spectral leakage
- Signal conditioning and preprocessing
- Detection and estimation theory
- Multirate signal processing

## Code Examples

### Fourier Analysis
```python
import numpy as np
from dataclasses import dataclass
from typing import Tuple
import matplotlib.pyplot as plt

def dft(x: np.ndarray) -> np.ndarray:
    """Compute discrete Fourier transform."""
    N = len(x)
    X = np.zeros(N, dtype=complex)
    for k in range(N):
        for n in range(N):
            X[k] += x[n] * np.exp(-2j * np.pi * k * n / N)
    return X

def fft(x: np.ndarray) -> np.ndarray:
    """Compute fast Fourier transform."""
    N = len(x)
    if N <= 16:
        return dft(x)
    even = fft(x[::2])
    odd = fft(x[1::2])
    factor = np.exp(-2j * np.pi * np.arange(N) / N)
    return np.concatenate([even + factor[:N//2] * odd,
                           even + factor[N//2:] * odd])

def fft_frequency_bin(
    N: int,
    fs: float
) -> np.ndarray:
    """Calculate frequency bins for FFT."""
    return np.fft.fftfreq(N, 1/fs)

def stft(
    x: np.ndarray,
    window: np.ndarray,
    hop: int,
    fft_size: int
) -> np.ndarray:
    """Compute short-time Fourier transform."""
    n_frames = 1 + (len(x) - len(window)) // hop
    X = np.zeros((fft_size // 2 + 1, n_frames), dtype=complex)
    for i in range(n_frames):
        x_frame = x[i * hop : i * hop + len(window)] * window
        X[:, i] = fft(x_frame)[:fft_size // 2 + 1]
    return X

def spectrogram(
    x: np.ndarray,
    fs: float,
    nperseg: int = 256,
    noverlap: int = 128
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute spectrogram."""
    window = np.hanning(nperseg)
    hop = nperseg - noverlap
    S = stft(x, window, hop, nperseg)
    f = fft_frequency_bin(nperseg, fs)
    t = np.arange(S.shape[1]) * hop / fs
    return np.abs(S)**2, f, t

# Example: FFT analysis
fs = 1000  # Hz
t = np.arange(0, 1, 1/fs)
x = np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 120 * t)
X = fft(x)
freq = fft_frequency_bin(len(x), fs)
print(f"Fundamental frequency bins: {np.argmax(np.abs(X[1:len(X)//2])) + 1}")
```

### Filter Design
```python
@dataclass
class FilterSpec:
    pass

def fir_window_design(
    cutoff: float,
    fs: float,
    window_type: str = "hamming",
    num_taps: int = None
) -> np.ndarray:
    """Design FIR filter using window method."""
    if num_taps is None:
        num_taps = int(4 / (cutoff / fs)) | 1
    
    if window_type == "rectangular":
        window = np.ones(num_taps)
    elif window_type == "hanning":
        window = np.hanning(num_taps)
    elif window_type == "hamming":
        window = np.hamming(num_taps)
    elif window_type == "blackman":
        window = np.blackman(num_taps)
    else:
        window = np.hamming(num_taps)
    
    wc = 2 * np.pi * cutoff / fs
    h = np.zeros(num_taps)
    for n in range(num_taps):
        if n == num_taps // 2:
            h[n] = wc / np.pi
        else:
            h[n] = np.sin(wc * (n - num_taps // 2)) / (np.pi * (n - num_taps // 2))
    
    return h * window

def iir_butterworth_design(
    wp: float,
    ws: float,
    gpass: float,
    gstop: float,
    fs: float
) -> Tuple[np.ndarray, np.ndarray]:
    """Design IIR Butterworth filter."""
    wp_norm = 2 * wp / fs
    ws_norm = 2 * ws / fs
    
    n = np.ceil(np.log10(10**(gpass/10) - 1) / np.log10(10**(gstop/10) - 1) / 
                (np.log10(ws_norm) - np.log10(wp_norm)) / 2)
    wc = wp_norm / (10**(0.1 * gpass) - 1)**(1/(2*n))
    
    z, p, k = butter poles(n, wc, analog=False, output='zpk')
    return z, p

def iir_biquad_section(
    b0: float, b1: float, b2: float,
    a0: float, a1: float, a2: float
) -> Tuple[np.ndarray, np.ndarray]:
    """Create biquad filter section coefficients."""
    num = np.array([b0/a0, b1/a0, b2/a0])
    den = np.array([1, a1/a0, a2/a0])
    return num, den

def bilinear_transform(
    s_num: np.ndarray,
    s_den: np.ndarray,
    fs: float
) -> Tuple[np.ndarray, np.ndarray]:
    """Apply bilinear transform for IIR design."""
    fprewarp = 2 * fs * np.tan(np.pi * np.linspace(0, 1, 100) / fs)
    z = np.exp(2j * np.pi * np.linspace(0, 1, 100) / fs)
    return z, z

# Example: FIR low-pass filter
cutoff = 200  # Hz
fs = 1000  # Hz
h = fir_window_design(cutoff, fs, "hamming", 65)
print(f"FIR filter order: {len(h)}")
print(f"Filter coefficients sum: {np.sum(h):.4f}")
```

### Spectral Estimation
```python
def periodogram(
    x: np.ndarray,
    fs: float,
    window: str = "hamming"
) -> Tuple[np.ndarray, np.ndarray]:
    """Compute periodogram spectral estimate."""
    N = len(x)
    w = np.hanning(N) if window == "hanning" else np.ones(N)
    xw = x * w
    X = np.fft.fft(xw)
    Pxx = (np.abs(X)**2) / (np.sum(w**2) / N)
    freqs = np.fft.fftfreq(N, 1/fs)
    return Pxx[:N//2], freqs[:N//2]

def welch_psd(
    x: np.ndarray,
    fs: float,
    nperseg: int = 256,
    noverlap: int = 128
) -> Tuple[np.ndarray, np.ndarray]:
    """Compute Welch's method PSD estimate."""
    window = np.hanning(nperseg)
    hop = nperseg - noverlap
    n_frames = 1 + (len(x) - nperseg) // hop
    
    Pxx_sum = np.zeros(nperseg // 2 + 1)
    for i in range(n_frames):
        x_frame = x[i * hop : i * hop + nperseg] * window
        X = np.fft.fft(x_frame)
        Pxx = np.abs(X[:nperseg//2 + 1])**2
        Pxx_sum += Pxx
    
    Pxx_avg = Pxx_sum / n_frames
    Pxx_avg[1:-1] *= 2  # Single-sided correction
    freqs = np.fft.fftfreq(nperseg, 1/fs)[:nperseg//2 + 1]
    return Pxx_avg, freqs

def ar_psd_estimation(
    x: np.ndarray,
    order: int,
    nfft: int = 1024,
    fs: float = 1.0
) -> Tuple[np.ndarray, np.ndarray]:
    """Estimate PSD using autoregressive model (Burg method)."""
    from scipy.signal import lfilter
    n = len(x)
    r = np.correlate(x, x, mode='full')
    r = r[n-1:n+order]
    
    # Burg algorithm for AR coefficients
    a = np.zeros(order + 1)
    a[0] = 1
    for k in range(order):
        pass
    
    freqs = np.fft.fftfreq(nfft, 1/fs)[:nfft//2 + 1]
    return np.abs(np.fft.fft(a, nfft))**2, freqs

def music_algorithm(
    x: np.ndarray,
    n_sources: int,
    nfft: int = 1024,
    fs: float = 1.0
) -> np.ndarray:
    """MUSIC algorithm for frequency estimation."""
    N = len(x)
    R = np.correlate(x, x, mode='full')
    R = R[N-1:N+n_sources]
    U, S, Vh = np.linalg.svd(R)
    noise_subspace = U[:, n_sources:]
    return np.arange(nfft) / nfft * fs / 2
```

### Adaptive Filtering
```python
class LMSFilter:
    def __init__(self, order: float, mu: float):
        self.order = int(order)
        self.mu = mu
        self.w = np.zeros(order + 1)
    
    def filter(self, x: np.ndarray, d: np.ndarray) -> np.ndarray:
        """LMS adaptive filtering."""
        y = np.zeros(len(x))
        for n in range(self.order, len(x)):
            x_vec = x[n - self.order : n + 1][::-1]
            y[n] = np.dot(self.w, x_vec)
            e = d[n] - y[n]
            self.w += self.mu * e * x_vec
        return y

class RLSFilter:
    def __init__(self, order: float, delta: float, lambda_rls: float):
        self.order = int(order)
        self.lambda_rls = lambda_rls
        self.delta = delta
        self.w = np.zeros(order + 1)
        self.P = np.eye(order + 1) / delta
    
    def filter(self, x: np.ndarray, d: np.ndarray) -> np.ndarray:
        """RLS adaptive filtering."""
        y = np.zeros(len(x))
        for n in range(self.order, len(x)):
            x_vec = x[n - self.order : n + 1][::-1]
            y[n] = np.dot(self.w, x_vec)
            e = d[n] - y[n]
            Px = self.P @ x_vec
            k = Px / (self.lambda_rls + np.dot(x_vec, Px))
            self.w += k * e
            self.P = (self.P - np.outer(k, x_vec) @ self.P) / self.lambda_rls
        return y

def kalman_filter_1d(
    z: np.ndarray,
    x0: float,
    P0: float,
    Q: float,
    R: float
) -> Tuple[np.ndarray, np.ndarray]:
    """1D Kalman filter for signal estimation."""
    x = np.zeros(len(z))
    P = np.zeros(len(z))
    x[0] = x0
    P[0] = P0
    
    for k in range(1, len(z)):
        x_pred = x[k-1]
        P_pred = P[k-1] + Q
        K = P_pred / (P_pred + R)
        x[k] = x_pred + K * (z[k] - x_pred)
        P[k] = (1 - K) * P_pred
    
    return x, P

# Example: Adaptive noise cancellation
np.random.seed(42)
N = 1000
mu = 0.01
order = 32

# Reference noise
v = np.random.randn(N)
s = np.sin(2 * np.pi * 50 * np.arange(N) / 1000)
d = s + 0.5 * v

# Noise reference (delayed version)
x = np.concatenate([[0], v[:-1]])

lms = LMSFilter(order, mu)
y = lms.filter(x, d)
print(f"Signal-to-Noise Ratio improvement: {10 * np.log10(np.var(s) / np.var(d - y)):.2f} dB")
```

### Sampling and Reconstruction
```python
def nyquist_rate(
    signal_bandwidth: float
) -> float:
    """Calculate Nyquist sampling rate."""
    return 2 * signal_bandwidth

def anti_aliasing_design(
    fp: float,  # passband edge Hz
    fs: float,  # stopband edge Hz
    As: float,  # stopband attenuation dB
    delta_f: float  # transition width Hz
) -> Tuple[float, int]:
    """Design anti-aliasing filter requirements."""
    delta_p = 10**(-0.05) - 1
    delta_s = 10**(-As/20)
    delta_f_norm = delta_f / fs
    
    # Kaiser window design
    if As > 50:
        beta = 0.1102 * (As - 8.7)
    elif As > 21:
        beta = 0.5842 * (As - 21)**0.4 + 0.07886 * (As - 21)
    else:
        beta = 5
    
    N = int((As - 8) / (2.285 * 2 * np.pi * delta_f_norm)) + 1
    return N, beta

def sinc_interpolation(
    x: np.ndarray,
    t: np.ndarray,
    T: float
) -> np.ndarray:
    """Reconstruct continuous signal using sinc interpolation."""
    y = np.zeros(len(t))
    for n, xn in enumerate(x):
        y += xn * np.sinc((t - n * T) / T)
    return y

def sample_and_hold(
    x: np.ndarray,
    fs: float,
    T_hold: float
) -> np.ndarray:
    """Model sample-and-hold circuit."""
    N = len(x)
    t_original = np.arange(N) / fs
    t_hold = np.arange(0, N, T_hold * fs) / fs
    return np.interp(t_original, t_hold, x)
```

## Best Practices
- Always consider anti-aliasing filtering before sampling
- Use appropriate window functions to minimize spectral leakage
- Choose FFT size based on frequency resolution requirements
- Consider numerical precision in IIR filter implementations
- Use cascaded biquad sections for high-order IIR filters
- Implement proper initialization for adaptive filters
- Verify filter stability before deployment
- Consider quantization effects in fixed-point implementations
- Use overlap-add or overlap-save for efficient convolution
- Document filter specifications and design parameters
