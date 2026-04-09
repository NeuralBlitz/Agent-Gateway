---
name: analytical-chemistry
description: Development and application of methods for identifying and quantifying chemical substances
category: chemistry
keywords: [analytical chemistry, quantitative analysis, spectroscopy, chromatography, mass spectrometry, titrations]
---

# Analytical Chemistry

## What I Do

Analytical chemistry involves the qualitative and quantitative analysis of chemical substances. I help with method development, instrument analysis, sample preparation, data interpretation, and quality control. I cover techniques including chromatography, spectroscopy, mass spectrometry, electroanalytical methods, and classical wet chemical methods.

## When to Use Me

- Determining concentration of unknown samples
- Developing and validating analytical methods
- Interpreting spectroscopic and chromatographic data
- Performing quality control and assurance
- Analyzing complex mixtures and separations
- Calibrating instruments and maintaining accuracy
- Performing trace analysis and detection limit studies

## Core Concepts

1. **Spectroscopy**: UV-Vis, atomic absorption, atomic emission, fluorescence, and NMR
2. **Chromatography**: GC, HPLC, TLC, ion chromatography, and column separations
3. **Mass Spectrometry**: Ionization techniques, mass analyzers, and fragmentation patterns
4. **Titration**: Acid-base, redox, complexometric, and precipitation titrations
5. **Electroanalytical Methods**: Potentiometry, voltammetry, and polarography
6. **Sample Preparation**: Extraction, digestion, derivatization, and cleanup procedures
7. **Calibration**: Linear regression, calibration curves, and standard addition
8. **Quality Control**: Precision, accuracy, detection limits, and uncertainty
9. **Data Analysis**: Statistics, confidence intervals, and error propagation
10. **Method Validation**: Specificity, linearity, LOD/LOQ, robustness, and recovery

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from scipy import stats

class AnalyticalMethod:
    def __init__(self, name: str, detection_limit: float = 0.0):
        self.name = name
        self.detection_limit = detection_limit
        self.calibration_data = []

    def linear_calibration(self, concentrations: List[float], 
                          responses: List[float]) -> Dict:
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            concentrations, responses
        )
        self.calibration_data = list(zip(concentrations, responses))
        return {
            'slope': slope,
            'intercept': intercept,
            'r_squared': r_value**2,
            'standard_error': std_err
        }

    def calculate_unknown(self, response: float, calibration: Dict) -> float:
        return (response - calibration['intercept']) / calibration['slope']

    def detection_limit_3sigma(self, blank_responses: List[float]) -> float:
        blank_mean = np.mean(blank_responses)
        blank_std = np.std(blank_responses)
        return blank_mean + 3 * blank_std

    def standard_addition(self, original_response: float,
                         added_concentrations: List[float],
                         spiked_responses: List[float]) -> float:
        slope, intercept, _, _, _ = stats.linregress(
            added_concentrations, spiked_responses
        )
        return -intercept / slope

    def precision_check(self, measurements: List[float]) -> Dict:
        return {
            'mean': np.mean(measurements),
            'std_dev': np.std(measurements),
            'relative_std_dev': np.std(measurements) / np.mean(measurements) * 100,
            'confidence_interval_95': stats.t.interval(
                0.95, len(measurements)-1, 
                loc=np.mean(measurements),
                scale=stats.sem(measurements)
            )
        }

method = AnalyticalMethod("HPLC Quantification")
cal = method.linear_calibration(
    [0, 10, 20, 30, 40],
    [0.02, 0.45, 0.89, 1.32, 1.78]
)
unknown = method.calculate_unknown(0.65, cal)
print(f"R²: {cal['r_squared']:.4f}")
print(f"Unknown concentration: {unknown:.2f}")
```

## Best Practices

1. Always include proper blanks and controls in analytical runs
2. Perform calibration curves with sufficient data points (minimum 5)
3. Validate methods with certified reference materials when available
4. Report uncertainty alongside analytical results
5. Use appropriate sample preparation to avoid matrix effects
6. Perform replicate measurements for statistical reliability
7. Check linearity and dynamic range before quantitative analysis
8. Document all procedures for reproducibility and audit trails
9. Use appropriate sig figs and significant figures in reporting
10. Implement proper QA/QC protocols including proficiency testing
