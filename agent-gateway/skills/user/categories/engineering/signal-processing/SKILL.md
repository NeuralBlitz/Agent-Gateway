---
name: Signal Processing
description: Signal processing fundamentals including Fourier analysis, filter design, sampling theory, spectral estimation, and adaptive filtering for engineering applications.
license: MIT
compatibility: python>=3.8
audience: signal-processing-engineers, data-scientists, researchers, students
category: engineering
---

# Signal Processing

## What I Do

I provide comprehensive signal processing tools including Fourier analysis, filter design, sampling theory, spectral estimation, and adaptive filtering for engineering and data science applications.

## When to Use Me

- Fourier transform analysis
- Filter design and implementation
- Spectral analysis
- Sampling and reconstruction
- Noise reduction
- Adaptive filtering

## Core Concepts

- **Fourier Analysis**: DFT, FFT, DTFT
- **Filter Design**: IIR, FIR, window methods
- **Sampling Theory**: Nyquist, aliasing, reconstruction
- **Spectral Estimation**: Periodogram, Welch, AR
- **Adaptive Filtering**: LMS, RLS, Kalman
- **Multirate**: Decimation, interpolation
- **Wavelets**: DWT, time-frequency analysis
- **Statistical Signal**: Detection, estimation

## Code Examples

### Fourier Analysis

```python
import numpy as np
from scipy.fft import fft, ifft, fftfreq

def discrete_fourier_transform(x):
    N = len(x)
    X = np.zeros(N, dtype=complex)
    for k in range(N):
        for n in range(N):
            X[k] += x[n] * np.exp(-2j * np.pi * k * n / N)
    return X

def fast_fourier_transform(x):
    return fft(x)

def inverse_dft(X):
    N = len(X)
    x = np.zeros(N)
    for n in range(N):
        for k in range(N):
            x[n] += X[k] * np.exp(2j * np.pi * k * n / N)
    return x / N

def spectral_magnitude(X):
    return np.abs(X)

def spectral_phase(X):
    return np.angle(X)

def frequency_resolution(fs, N):
    return fs / N

x = np.array([1, 2, 3, 4, 5])
X = fast_fourier_transform(x)
freqs = fftfreq(len(x), 1/1000)
print(f"Frequencies: {freqs[:len(freqs)//2]}")
```

### Filter Design

```python
from scipy.signal import firwin, butter, lfilter, freqz

def lowpass_fir_design(N, cutoff, fs, window='hamming'):
    nyquist = fs / 2
    taps = firwin(N, cutoff/nyquist, window=window)
    return taps

def butterworth_lowpass(order, cutoff, fs):
    nyquist = fs / 2
    b, a = butter(order, cutoff/nyquist, btype='low')
    return b, a

def iir_design(order, wp, ws, gpass, gstop, ftype='ellip'):
    b, a = ellip(order, gpass, gstop, [wp/nyquist, ws/nyquist])
    return b, a

def window_function(window, N):
    windows = {
        'rectangular': np.ones(N),
        'hanning': np.hanning(N),
        'hamming': np.hamming(N),
        'blackman': np.blackman(N)
    }
    return windows.get(window, np.ones(N))

def fir_filter_coefficients(N, cutoff, fs, response='lowpass'):
    nyquist = fs / 2
    if response == 'lowpass':
        return firwin(N, cutoff/nyquist)
    elif response == 'highpass':
        return firwin(N, cutoff/nyquist, pass_zero=False)

N = 64
fs = 1000
cutoff = 100
taps = lowpass_fir_design(N, cutoff, fs)
print(f"Filter order: {N}, Cutoff: {cutoff} Hz")
```

### Sampling Theory

```python
def nyquist_rate(signal_bandwidth):
    return 2 * signal_bandwidth

def aliasing_check(f_signal, f_sampling):
    if f_signal > f_sampling / 2:
        aliased_freq = abs(f_signal - f_sampling)
        return True, aliased_freq
    return False, f_signal

def anti_aliasing_filter_design(f_pass, f_stop, f_sampling):
    f_nyquist = f_sampling / 2
    return f_pass / f_nyquist, f_stop / f_nyquist

def sample_and_hold(hold_time, aperture_error):
    return hold_time, aperture_error

def reconstruction_sinc(x, t, Ts):
    n = np.arange(len(x))
    t_grid, n_grid = np.meshgrid(t, n)
    sinc = np.sinc(t_grid/Ts - n_grid)
    return np.dot(x, sinc)

def delta_sigma_modulation(quantizer_levels, oversampling_ratio):
    return quantizer_levels / oversampling_ratio

f_signal = 400
f_sampling = 1000
is_aliased, f_aliased = aliasing_check(f_signal, f_sampling)
print(f"Aliased: {is_aliased}, Frequency: {f_aliased} Hz")
```

### Spectral Estimation

```python
from scipy.signal import welch, periodogram

def periodogram_spectrum(x, fs):
    f, Pxx = periodogram(x, fs=fs)
    return f, Pxx

def welch_psd(x, fs, nperseg=256):
    f, Pxx = welch(x, fs=fs, nperseg=nperseg)
    return f, Pxx

def bartlett_method(x, L, fs):
    N = len(x)
    K = N // L
    P_bartlett = np.zeros(L)
    for k in range(K):
        x_k = x[k*L:(k+1)*L]
        P_bartlett += np.abs(fft(x_k, L))**2
    return P_bartlett / K

def ar_spectrum(y, order, fs):
    from scipy.signal import lfilter
    a = arburg(y, order)[0]
    w, H = freqz(1, a, worN=1024, fs=fs)
    P_ar = np.abs(H)**2
    return w, P_ar

def coherence_function(x, y, fs):
    from scipy.signal import csd
    f, Pxx = welch(x, fs=fs)
    f, Pyy = welch(y, fs=fs)
    f, Pxy = csd(x, y, fs=fs)
    Cxy = np.abs(Pxy)**2 / (Pxx * Pyy)
    return f, Cxy

def cepstrum_analysis(x):
    log_spectrum = np.log(np.abs(fft(x)))
    cepstrum = np.real(ifft(log_spectrum))
    return cepstrum

fs = 1000
f, Pxx = welch(x, fs=fs)
print(f"Peak frequency: {f[np.argmax(Pxx)]:.1f} Hz")
```

### Adaptive Filtering

```python
def lms_filter(x, d, mu, order):
    N = len(x)
    w = np.zeros(order)
    y = np.zeros(N)
    e = np.zeros(N)
    
    for n in range(order, N):
        X = x[n-order:n][::-1]
        y[n] = np.dot(w, X)
        e[n] = d[n] - y[n]
        w = w + 2 * mu * e[n] * X
    
    return y, e, w

def rls_filter(x, d, lambda_, order, delta=1.0):
    N = len(x)
    w = np.zeros(order)
    P = np.eye(order) / delta
    y = np.zeros(N)
    e = np.zeros(N)
    
    for n in range(order, N):
        X = x[n-order:n][::-1]
        y[n] = np.dot(w, X)
        e[n] = d[n] - y[n]
        K = P @ X / (lambda_ + X @ P @ X)
        w = w + K * e[n]
        P = (P - np.outer(K, X @ P)) / lambda_
    
    return y, e, w

def nlms_filter(x, d, mu, order, epsilon=1e-6):
    N = len(x)
    w = np.zeros(order)
    y = np.zeros(N)
    e = np.zeros(N)
    
    for n in range(order, N):
        X = x[n-order:n][::-1]
        norm = np.linalg.norm(X) + epsilon
        y[n] = np.dot(w, X)
        e[n] = d[n] - y[n]
        w = w + (mu / norm**2) * e[n] * X
    
    return y, e, w

def affine_projection_filter(x, d, mu, order, K):
    N = len(x)
    w = np.zeros(order)
    y = np.zeros(N)
    e = np.zeros(N)
    
    for n in range(order, N, K):
        X = np.array([x[n-i-order:n-i][::-1] for i in range(K)])
        Y = X @ w
        E = d[n:n+K] - Y
        w = w + mu * X.T @ np.linalg.inv(X @ X.T + 1e-6 * np.eye(K)) @ E
    
    return y, e, w
```

## Best Practices

1. **Windowing**: Choose appropriate windows
2. **Zero Padding**: For interpolation, not resolution
3. **Leakage**: Minimize with proper windowing
4. **Numerical**: Use stable filter structures
5. **Quantization**: Consider fixed-point effects

## Common Patterns

```python
# Hilbert transform
def hilbert_transform(x):
    return np.imag(hilbert(x))
```

## Core Competencies

1. Fourier analysis
2. Filter design
3. Spectral estimation
4. Sampling theory
5. Adaptive filtering
