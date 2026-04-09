---
name: analytical-chemistry
description: Chemical analysis and quantification techniques
license: MIT
compatibility: opencode
metadata:
  audience: chemists, researchers, analysts
  category: chemistry
---

## What I do

- Identify and quantify chemical substances using instrumental and classical methods
- Perform chromatography, spectroscopy, and mass spectrometry analyses
- Validate analytical methods and ensure quality control compliance
- Interpret spectral data and chemical measurements
- Develop and optimize separation techniques
- Ensure laboratory safety and regulatory compliance

## When to use me

- When analyzing chemical samples for composition and purity
- When developing or validating analytical methods
- When interpreting spectroscopic or chromatographic data
- When troubleshooting analytical instrumentation issues
- When ensuring compliance with analytical standards (ISO, ASTM, EPA)

## Key Concepts

### Common Analytical Techniques

**Chromatography**
- Gas Chromatography (GC): Volatile compound separation
- High-Performance Liquid Chromatography (HPLC): Non-volatile analysis
- Ion Chromatography: Ionic species detection

**Spectroscopy**
- UV-Vis Spectroscopy: Electronic transitions quantification
- Infrared (IR) Spectroscopy: Functional group identification
- Nuclear Magnetic Resonance (NMR): Molecular structure elucidation
- Mass Spectrometry (MS): Molecular weight and fragmentation analysis

### Method Validation Parameters

```python
# Example: Calculating method validation metrics
import numpy as np

def validate_method(known_concentrations, measured_values):
    """Validate analytical method performance."""
    recovery = (np.mean(measured_values) / np.mean(known_concentrations)) * 100
    rsd = (np.std(measured_values) / np.mean(measured_values)) * 100
    correlation = np.corrcoef(known_concentrations, measured_values)[0, 1]
    
    return {
        'accuracy': recovery,
        'precision': rsd,
        'linearity': correlation ** 2
    }
```

### Quality Control

- Blank measurements: Background correction
- Standard additions: Matrix effect compensation
- Duplicate analyses: Precision monitoring
- Certified reference materials: Calibration verification
