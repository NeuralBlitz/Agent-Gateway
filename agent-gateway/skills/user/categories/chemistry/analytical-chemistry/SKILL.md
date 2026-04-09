---
name: analytical-chemistry
description: Quantitative and qualitative analysis of chemical substances using laboratory techniques and instrumentation
category: chemistry
keywords: analytical chemistry, titration, spectroscopy, chromatography, mass spectrometry, calibration
---

# Analytical Chemistry

## What I Do

I provide expertise in analytical chemistry—the science of identifying and quantifying chemical substances. I help with titration techniques, spectroscopic analysis, chromatographic separations, mass spectrometry, electroanalytical methods, statistical analysis of data, method validation, and quality assurance protocols. I cover both classical wet chemistry and modern instrumental techniques.

## When to Use Me

- Designing analytical methods for quantification
- Interpreting titration curves and endpoint detection
- Calibrating instruments and creating standard curves
- Analyzing spectroscopic data (UV-Vis, AA, ICP)
- Performing chromatographic separations (GC, HPLC)
- Understanding mass spectral fragmentation patterns
- Calculating detection limits and uncertainty
- Validating analytical methods and quality control

## Core Concepts

**Titrimetry**: Acid-base, redox, complexometric, and precipitation titrations with appropriate indicators and endpoint detection.

**Spectroscopy**: Beer-Lambert law, atomic absorption, emission spectroscopy, and molecular absorption methods.

**Chromatography**: Partition coefficients, retention time, column efficiency (theoretical plates), resolution, and gradient elution.

**Mass Spectrometry**: Mass-to-charge ratio, fragmentation patterns, ionization methods (EI, ESI, MALDI), and spectral interpretation.

**Electrochemistry**: Potentiometry, voltammetry, coulometry, and ion-selective electrodes.

**Statistics**: Mean, standard deviation, confidence intervals, linear regression, detection limits, and error propagation.

## Code Examples

```python
import numpy as np
from scipy import stats
from typing import List, Tuple, Dict


class TitrationAnalysis:
    def __init__(self, analyte_conc: float, analyte_volume: float, titrant_conc: float):
        self.Ca = analyte_conc  # M
        self.Va = analyte_volume  # L
        self.Cb = titrant_conc  # M
    
    def equivalence_volume(self) -> float:
        return (self.Ca * self.Va) / self.Cb
    
    def calculate_analyte(self, titrant_volume: float) -> float:
        return (self.Cb * titrant_volume) / self.Va
    
    def titration_curve(self, volumes: List[float]) -> List[Tuple[float, float]]:
        pH_data = []
        for Vb in volumes:
            if Vb < self.equivalence_volume():
                excess_analyte = (self.Ca * self.Va - self.Cb * Vb) / (self.Va + Vb)
                pH_data.append((Vb, -np.log10(max(excess_analyte, 1e-14))))
            elif Vb == self.equivalence_volume():
                pH_data.append((Vb, 7.0))
            else:
                excess_titrant = (self.Cb * Vb - self.Ca * self.Va) / (self.Va + Vb)
                pOH = -np.log10(max(excess_titrant, 1e-14))
                pH_data.append((Vb, 14 - pOH))
        return pH_data
    
    def identify_endpoint(self, pH_data: List[Tuple[float, float]]) -> float:
        dpH = np.diff([pH for _, pH in pH_data])
        dV = np.diff([V for V, _ in pH_data])
        d2pH = np.diff(dpH / dV)
        return pH_data[np.argmax(d2pH) + 1][0]


class SpectroscopicAnalysis:
    def __init__(self, wavelength: float, path_length: float = 1.0):
        self.wavelength = wavelength
        self.l = path_length
    
    def beer_lambert(self, concentration: float, epsilon: float) -> float:
        return epsilon * self.l * concentration
    
    def concentration_from_absorbance(self, absorbance: float, epsilon: float) -> float:
        return absorbance / (epsilon * self.l)
    
    def standard_addition(self, concentrations: List[float], absorbances: List[float]) -> Tuple[float, float]:
        slope, intercept, r, p, se = stats.linregress(concentrations, absorbances)
        unknown_conc = -intercept / slope
        return unknown_conc, r ** 2
    
    def create_calibration_curve(self, standards: List[float], absorbances: List[float]) -> Dict:
        slope, intercept, r, p, se = stats.linregress(standards, absorbances)
        return {
            "slope": slope,
            "intercept": intercept,
            "r_squared": r ** 2,
            "equation": f"A = {slope:.4f}C + {intercept:.4f}"
        }
    
    def determine_detection_limit(self, blank_absorbance: float, blank_std: float, 
                                   slope: float, confidence: float = 3) -> float:
        return (confidence * blank_std) / slope


class Chromatography:
    def __init__(self, column_length: float, particle_size: float, flow_rate: float):
        self.L = column_length  # cm
        self.dp = particle_size  # μm
        self.F = flow_rate  # mL/min
    
    def retention_factor(self, t_R: float, t_0: float) -> float:
        return (t_R - t_0) / t_0
    
    def selectivity_factor(self, k1: float, k2: float) -> float:
        return k2 / k1 if k2 > k1 else k1 / k2
    
    def resolution(self, N: float, alpha: float, k: float) -> float:
        return (np.sqrt(N) / 4) * ((alpha - 1) / alpha) * (k / (1 + k))
    
    def theoretical_plates(self, t_R: float, W: float) -> float:
        return 16 * (t_R / W) ** 2
    
    def plate_height(self, N: float) -> float:
        return self.L / N
    
    def van_deemter(self, u: float, A: float = 1.0, B: float = 2.0, C: float = 0.1) -> float:
        return A + B / u + C * u
    
    def optimal_velocity(self, B: float, C: float) -> float:
        return np.sqrt(B / C)


class QualityControl:
    def __init__(self, measurements: List[float], true_value: float):
        self.data = np.array(measurements)
        self.true_value = true_value
    
    def mean(self) -> float:
        return np.mean(self.data)
    
    def standard_deviation(self) -> float:
        return np.std(self.data, ddof=1)
    
    def relative_standard_deviation(self) -> float:
        return (self.standard_deviation() / abs(self.mean())) * 100
    
    def confidence_interval(self, confidence: float = 0.95) -> Tuple[float, float]:
        n = len(self.data)
        t_value = stats.t.ppf((1 + confidence) / 2, n - 1)
        se = self.standard_deviation() / np.sqrt(n)
        return (self.mean() - t_value * se, self.mean() + t_value * se)
    
    def accuracy(self) -> float:
        return ((self.mean() - self.true_value) / self.true_value) * 100
    
    def outlier_test(self, method: str = "grubbs") -> List[int]:
        mean = self.mean()
        std = self.standard_deviation()
        z_scores = np.abs((self.data - mean) / std)
        threshold = stats.t.ppf(0.975, len(self.data) - 2) / np.sqrt(len(self.data))
        return list(np.where(z_scores > threshold)[0])
    
    def linear_regression_uncertainty(self, x: List[float]) -> float:
        n = len(self.data)
        x_mean = np.mean(x)
        ss_xx = sum((xi - x_mean) ** 2 for xi in x)
        residuals = self.data - np.polyval(np.polyfit(x, self.data, 1), x)
        s_e = np.sqrt(sum(residuals ** 2) / (n - 2))
        return s_e * np.sqrt(1/n + (x[-1] - x_mean)**2 / ss_xx)


class MassSpectrometry:
    @staticmethod
    def calculate_mz(mass: float, charge: int) -> float:
        return mass / charge
    
    @staticmethod
    def isotope_pattern(molecular_formula: str) -> Dict[str, float]:
        isotopes = {
            "C": {"12C": 0.9893, "13C": 0.0107},
            "H": {"1H": 0.999885, "2H": 0.000115},
            "N": {"14N": 0.99632, "15N": 0.00368},
            "O": {"16O": 0.99757, "17O": 0.00038, "18O": 0.00205},
            "S": {"32S": 0.9493, "33S": 0.0076, "34S": 0.0429, "36S": 0.0002}
        }
        # Simplified isotope calculation
        formula = parse_formula(molecular_formula)
        return calculate_isotope_distribution(formula, isotopes)
    
    @staticmethod
    def nitrogen_rule(mass: float, charge: int = 1) -> bool:
        nominal_mass = int(round(mass * charge))
        return nominal_mass % 2 == 1 if count_nitrogen(mass) % 2 == 1 else nominal_mass % 2 == 0


# Usage examples
titration = TitrationAnalysis(analyte_conc=0.1, analyte_volume=0.025, titrant_conc=0.1)
print(f"Equivalence volume: {titration.equivalence_volume():.3f} L")

spec = SpectroscopicAnalysis(wavelength=500)
curve = spec.create_calibration_curve(
    standards=[0, 1, 2, 3, 4],
    absorbances=[0.00, 0.15, 0.31, 0.47, 0.62]
)
print(f"Calibration: {curve['equation']}, R² = {curve['r_squared']:.4f}")

chrom = Chromatography(column_length=250, particle_size=5, flow_rate=1.0)
N = chrom.theoretical_plates(t_R=15.2, W=0.8)
print(f"Theoretical plates: {N:.0f}")
print(f"Resolution at optimum: {chrom.resolution(N, 1.2, 3.5):.2f}")

qc = QualityControl([0.98, 1.02, 0.99, 1.01, 1.00], true_value=1.00)
print(f"Mean: {qc.mean():.4f}, RSD: {qc.relative_standard_deviation():.2f}%")
print(f"95% CI: {qc.confidence_interval()}")
```

## Best Practices

1. Use appropriate blank corrections for all measurements
2. Perform triplicate or greater replicate analysis
3. Validate linear ranges before quantitative analysis
4. Use internal standards to compensate for matrix effects
5. Report uncertainty with all quantitative results
6. Follow proper sampling and sample preparation protocols
7. Maintain chain of custody for regulatory compliance
8. Use certified reference materials for calibration

## Common Patterns

- **Standard Addition**: Compensate for matrix effects by spiking known amounts
- **Method of Standard Comparisons**: Single point vs calibration curve
- **Internal Standardization**: Ratio analyte signal to internal standard
- **Recovery Experiments**: Spike samples to verify accuracy
- **Duplicate Analysis**: Assess precision between replicates
