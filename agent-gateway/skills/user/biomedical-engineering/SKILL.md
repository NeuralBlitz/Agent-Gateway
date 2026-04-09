---
name: biomedical-engineering
description: Biomedical engineering principles and applications
license: MIT
compatibility: opencode
metadata:
  audience: engineers, medical professionals, researchers
  category: engineering
---

## What I do

- Design medical devices and diagnostic equipment
- Analyze physiological systems and model biological processes
- Develop biomedical imaging systems and signal processing
- Create prosthetic devices and rehabilitation technology
- Apply engineering principles to healthcare solutions

## When to use me

- When developing medical devices or healthcare technology
- When analyzing biological signals (ECG, EEG, EMG)
- When designing prosthetic or orthotic devices
- When working on diagnostic equipment or imaging systems
- When modeling physiological processes

## Key Concepts

### Biomedical Signals

```python
import numpy as np
from scipy import signal

# ECG processing example
def filter_ecg(raw_signal, fs=1000):
    # Remove powerline interference
    b, a = signal.iirnotch(60, 30, fs)
    filtered = signal.filtfilt(b, a, raw_signal)
    
    # Bandpass filter for QRS detection
    low, high = 5, 15
    b, a = signal.butter(4, [low, high], btype='bandpass', fs=fs)
    return signal.filtfilt(b, a, filtered)

# Heart rate calculation
def calculate_bpm(rr_intervals):
    return 60000 / np.mean(rr_intervals)
```

### Medical Imaging Modalities

| Modality | Principle | Applications |
|----------|-----------|--------------|
| X-ray | X-ray attenuation | Bone, chest imaging |
| CT | X-ray tomography | 3D anatomy |
| MRI | Nuclear magnetic resonance | Soft tissue imaging |
| Ultrasound | Echo reflection | Obstetrics, cardiology |
| PET | Radioactive decay | Functional imaging |

### Biomechanics

```python
# Joint torque calculation
def calculate_joint_torque(force, moment_arm):
    return force * moment_arm

# Impact analysis
def impact_force(mass, velocity, contact_time):
    impulse = mass * velocity
    return impulse / contact_time
```

### Device Design Considerations

```python
# Biocompatibility testing parameters
BIOCOMPATIBILITY_TESTS = [
    "Cytotoxicity",
    "Sensitization", 
    "Irritation",
    "Systemic toxicity",
    "Implantation"
]

# Material selection criteria
def select_implant_material(requirements):
    candidates = {
        "titanium": {"biocompatible": True, "strength": "high"},
        "stainless_steel": {"biocompatible": True, "strength": "medium"},
        "peek": {"biocompatible": True, "strength": "medium"},
        "hydroxyapatite": {"biocompatible": True, "strength": "low"}
    }
    return [m for m, p in candidates.items() 
            if all(p[k] == requirements.get(k) for k in p)]
```

### Regulatory Framework

- **FDA (US)**: 21 CFR Part 820 - Quality System Regulation
- **EU MDR**: Medical Device Regulation 2017/745
- **ISO 13485**: Quality management systems for medical devices
- **IEC 60601**: Electrical safety of medical equipment
