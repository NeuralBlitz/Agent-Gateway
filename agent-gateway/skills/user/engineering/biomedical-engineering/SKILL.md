---
name: biomedical-engineering
description: Biomedical engineering fundamentals including medical device design, signal processing for physiological data, imaging systems, and clinical instrumentation
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Design medical devices and diagnostic equipment
- Process physiological signals (ECG, EEG, EMG)
- Analyze medical imaging data (CT, MRI, ultrasound)
- Model biological systems and biomechanics
- Design prosthetics and orthotics
- Implement FDA regulatory compliance
- Create clinical decision support systems
- Design implantable medical devices
- Implement medical data security (HIPAA)
- Validate medical device software

## When to use me
When designing medical devices, processing physiological signals, implementing healthcare software, or ensuring regulatory compliance for medical products.

## Core Concepts
- Physiological signal acquisition and processing
- Medical imaging modalities and analysis
- Biomechanics and rehabilitation engineering
- Medical device design and validation
- FDA and international regulatory requirements
- HIPAA data security and privacy
- Clinical trials and human factors engineering
- Biosensors and instrumentation
- Neural interfaces and brain-computer interfaces
- Biomaterials and tissue engineering

## Code Examples

### ECG Signal Processing
```python
import numpy as np
from scipy import signal
from scipy.ndimage import uniform_filter1d
from dataclasses import dataclass

@dataclass
class ECGSignal:
    data: np.ndarray
    sampling_rate: float
    patient_id: str

def detect_r_peaks(
    ecg: ECGSignal,
    threshold: float = 0.5,
    min_distance: int = None
) -> np.ndarray:
    """Detect R-peaks in ECG signal using Pan-Tompkins algorithm."""
    fs = ecg.sampling_rate
    
    # Bandpass filter (5-15 Hz)
    nyquist = fs / 2
    low = 5 / nyquist
    high = 15 / nyquist
    b, a = signal.butter(4, [low, high], btype='band')
    filtered = signal.filtfilt(b, a, ecg.data)
    
    # Derivative
    diff = np.diff(filtered)
    diff = np.concatenate([[0], diff])
    
    # Squaring
    squared = diff ** 2
    
    # Moving average (integration window ~150ms)
    window = int(0.15 * fs)
    integrated = uniform_filter1d(squared, size=window)
    
    # Find peaks
    if min_distance is None:
        min_distance = int(0.4 * fs)  # Minimum 40 BPM
    
    peaks, properties = signal.find_peaks(
        integrated,
        height=threshold * np.max(integrated),
        distance=min_distance
    )
    
    return peaks

def calculate_heart_rate(
    r_peaks: np.ndarray,
    sampling_rate: float
) -> float:
    """Calculate average heart rate from R-peaks."""
    if len(r_peaks) < 2:
        return 0
    
    rr_intervals = np.diff(r_peaks) / sampling_rate  # in seconds
    mean_rr = np.mean(rr_intervals)
    return 60 / mean_rr

def detect_qrs_complex(
    ecg: ECGSignal,
    r_peaks: np.ndarray
) -> dict:
    """Extract QRS complex characteristics."""
    window_before = int(0.1 * ecg.sampling_rate)
    window_after = int(0.15 * ecg.sampling_rate)
    
    qrs_data = []
    qrs_widths = []
    qrs_amplitudes = []
    
    for r_peak in r_peaks:
        start = max(0, r_peak - window_before)
        end = min(len(ecg.data), r_peak + window_after)
        
        segment = ecg.data[start:end]
        qrs_data.append(segment)
        
        # QRS width (derivative-based)
        diff = np.abs(np.diff(segment))
        qrs_width = np.argmax(np.cumsum(diff) > 0.5 * np.sum(diff))
        qrs_widths.append(qrs_width / ecg.sampling_rate * 1000)  # ms
        
        # R-peak amplitude
        qrs_amplitudes.append(ecg.data[r_peak])
    
    return {
        "qrs_widths_ms": np.mean(qrs_widths),
        "r_amplitudes_mean": np.mean(qrs_amplitudes),
        "beats": len(r_peaks)
    }

def detect_arrhythmia(
    r_peaks: np.ndarray,
    sampling_rate: float
) -> list:
    """Detect potential arrhythmias from RR intervals."""
    if len(r_peaks) < 3:
        return []
    
    rr_intervals = np.diff(r_peaks) / sampling_rate
    rr_diff = np.diff(rr_intervals)
    
    arrhythmias = []
    
    # Tachycardia (>100 bpm)
    hr = 60 / rr_intervals
    if np.mean(hr) > 100:
        arrhythmias.append({
            "type": "tachycardia",
            "severity": "warning",
            "value": np.mean(hr)
        })
    
    # Bradycardia (<60 bpm)
    if np.mean(hr) < 60:
        arrhythmias.append({
            "type": "bradycardia",
            "severity": "warning",
            "value": np.mean(hr)
        })
    
    # Irregular rhythm (high RR variability)
    rr_std = np.std(rr_intervals)
    if rr_std > 0.1:  # >100ms variability
        arrhythmias.append({
            "type": "irregular_rhythm",
            "severity": "warning",
            "rr_variability_ms": rr_std * 1000
        })
    
    # PVC detection (abnormally short RR)
    pvc_indices = np.where(rr_intervals[:-1] < 0.8 * np.median(rr_intervals))[0]
    if len(pvc_indices) > 0:
        arrhythmias.append({
            "type": "pvc",
            "count": len(pvc_indices),
            "severity": "moderate"
        })
    
    return arrhythmias

# Example: ECG analysis
ecg = ECGSignal(
    data=np.load("ecg_sample.npy"),
    sampling_rate=500,
    patient_id="P001"
)
r_peaks = detect_r_peaks(ecg)
hr = calculate_heart_rate(r_peaks, 500)
qrs = detect_qrs_complex(ecg, r_peaks)
arrhythmias = detect_arrhythmia(r_peaks, 500)
print(f"Heart Rate: {hr:.1f} bpm")
print(f"QRS Width: {qrs['qrs_widths_ms']:.1f} ms")
```

### Medical Imaging Utilities
```python
import numpy as np
from scipy import ndimage
from skimage import exposure, filters

def apply_window_level(
    image: np.ndarray,
    window_center: float,
    window_width: float
) -> np.ndarray:
    """Apply window/level adjustment for medical imaging."""
    min_val = window_center - window_width / 2
    max_val = window_center + window_width / 2
    
    windowed = np.clip(image, min_val, max_val)
    windowed = (windowed - min_val) / (max_val - min_val)
    return windowed

def lung_segmentation(
    ct_slice: np.ndarray
) -> np.ndarray:
    """Simple lung segmentation using thresholding."""
    # Typical HU values: air <-400, lung -400 to -900, tissue >0
    lung_mask = (ct_slice < -200) & (ct_slice > -1000)
    
    # Remove noise
    lung_mask = ndimage.binary_opening(lung_mask, iterations=2)
    
    # Fill holes
    lung_mask = ndimage.binary_closing(lung_mask, iterations=3)
    
    # Label and keep two largest regions (left and right lung)
    labels, num_features = ndimage.label(lung_mask)
    if num_features >= 2:
        sizes = ndimage.sum(lung_mask, labels, range(1, num_features + 1))
        keep = np.argsort(sizes)[-2:] + 1
        lung_mask = np.isin(labels, keep)
    
    return lung_mask.astype(np.uint8)

def enhance_contrast(
    image: np.ndarray,
    method: str = "clahe"
) -> np.ndarray:
    """Enhance contrast in medical images."""
    if method == "clahe":
        return exposure.equalize_adapthist(image / np.max(image))
    elif method == "histogram":
        return exposure.equalize_hist(image)
    elif method == "rescale":
        return exposure.rescale_intensity(image, out_range=(0, 1))
    return image

def calculate_hu_statistics(
    ct_image: np.ndarray,
    mask: np.ndarray = None
) -> dict:
    """Calculate Hounsfield Unit statistics within a region."""
    if mask is None:
        mask = np.ones_like(ct_image, dtype=bool)
    
    hu_values = ct_image[mask]
    
    return {
        "mean_hu": np.mean(hu_values),
        "std_hu": np.std(hu_values),
        "min_hu": np.min(hu_values),
        "max_hu": np.max(hu_values),
        "median_hu": np.median(hu_values),
        "volume_voxels": np.sum(mask)
    }
```

### Biomechanics Calculations
```python
from dataclasses import dataclass
from typing import Tuple

@dataclass
class ForceData:
    force_x: np.ndarray
    force_y: np.ndarray
    force_z: np.ndarray
    sampling_rate: float

@dataclass
class BiomechanicalModel:
    mass_kg: float
    height_m: float
    leg_length_m: float

def calculate_center_of_pressure(
    force_data: ForceData
) -> Tuple[np.ndarray, np.ndarray]:
    """Calculate COP from ground reaction forces."""
    fx, fy, fz = force_data.force_x, force_data.force_y, force_data.force_z
    sampling_rate = force_data.sampling_rate
    
    # COP calculation (assuming force plate at origin)
    cop_x = -fy / fz
    cop_y = -fx / fz
    
    return cop_x, cop_y

def gait_analysis(
    cop_x: np.ndarray,
    cop_y: np.ndarray,
    sampling_rate: float
) -> dict:
    """Analyze gait from COP data."""
    # Find gait cycles (peaks in medial-lateral direction)
    peaks, _ = signal.find_peaks(cop_x, distance=int(0.5 * sampling_rate))
    
    if len(peaks) < 2:
        return {"error": "Insufficient data for gait analysis"}
    
    # Calculate cadence
    step_times = np.diff(peaks) / sampling_rate
    cadence = 60 / np.mean(step_times)  # steps per minute
    
    # Calculate stride length
    stride_lengths = np.abs(np.diff(cop_y[peaks]))
    stride_length_mean = np.mean(stride_lengths)
    
    # COP velocity
    velocity = np.gradient(cop_y) * sampling_rate
    velocity_rms = np.sqrt(np.mean(velocity ** 2))
    
    return {
        "cadence_steps_min": cadence,
        "stride_length_m": stride_length_mean,
        "cop_velocity_m_s": velocity_rms,
        "num_steps": len(peaks)
    }

def calculate_joint_moment(
    force: np.ndarray,
    moment_arm: np.ndarray
) -> np.ndarray:
    """Calculate joint moment from force and moment arm."""
    return np.cross(moment_arm, force)

def bone_stress_analysis(
    force: np.ndarray,
    cross_sectional_area: float,
    section_modulus: float
) -> dict:
    """Calculate stress in bone under load."""
    normal_stress = force / cross_sectional_area
    bending_stress = moment / section_modulus
    
    return {
        "normal_stress": normal_stress,
        "bending_stress": bending_stress
    }
```

### Medical Device Regulatory Compliance
```python
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List

class RiskClass(Enum):
    CLASS_I = "Class I"
    CLASS_II = "Class II"
    CLASS_III = "Class III"

@dataclass
class DesignControl:
    design_input: str
    design_output: str
    design_review: str
    verification: str
    validation: str

@dataclass
class DHFEntry:
    document_id: str
    title: str
    date: datetime
    author: str
    reviewer: str
    status: str

class DesignHistoryFile:
    def __init__(self, device_name: str, risk_class: RiskClass):
        self.device_name = device_name
        self.risk_class = risk_class
        self.entries: List[DHFEntry] = []
        self.design_controls: List[DesignControl] = []
    
    def add_entry(self, entry: DHFEntry):
        self.entries.append(entry)
    
    def add_design_control(self, control: DesignControl):
        self.design_controls.append(control)
    
    def generate_compliance_report(self) -> dict:
        """Generate FDA design control compliance report."""
        return {
            "device_name": self.device_name,
            "risk_class": self.risk_class.value,
            "total_entries": len(self.entries),
            "design_controls_complete": len(self.design_controls),
            "required_controls": self._get_required_controls(),
            "compliance_status": self._check_compliance()
        }
    
    def _get_required_controls(self) -> List[str]:
        if self.risk_class == RiskClass.CLASS_I:
            return ["design_controls", "establish_registration"]
        elif self.risk_class == RiskClass.CLASS_II:
            return ["design_controls", "special_controls", "establish_registration", "pmc"]
        else:
            return ["design_controls", "premarket_approval", "establish_registration", "pmc"]
    
    def _check_compliance(self) -> str:
        required = self._get_required_controls()
        return "COMPLIANT" if len(self.entries) >= 10 else "INCOMPLETE"

# HIPAA Compliance Check
class HIPAAChecklist:
    def __init__(self):
        self.checks = {
            "access_control": False,
            "audit_controls": False,
            "integrity_controls": False,
            "transmission_security": False,
            "authentication": False,
            "encryption": False,
            "data_backup": False,
            "disaster_recovery": False
        }
    
    def verify_compliance(self) -> dict:
        """Verify HIPAA compliance status."""
        score = sum(self.checks.values()) / len(self.checks) * 100
        return {
            "compliant": score >= 80,
            "score_percent": score,
            "passed_checks": sum(self.checks.values()),
            "total_checks": len(self.checks),
            "details": self.checks
        }
```

## Best Practices
- Follow FDA design controls (21 CFR Part 820) for medical devices
- Implement comprehensive risk management per ISO 14971
- Ensure HIPAA compliance for all PHI data
- Use validated software development processes (IEC 62304)
- Perform human factors validation for user-facing devices
- Document all design decisions in Design History File
- Implement traceability from requirements to verification
- Use proper biocompatibility testing for implantables
- Follow cybersecurity best practices for connected devices
- Maintain audit trails for all device modifications
