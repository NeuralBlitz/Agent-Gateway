---
name: biomedical
description: Biomedical science and healthcare technology
license: MIT
compatibility: opencode
metadata:
  audience: healthcare professionals, engineers, students
  category: engineering
---

## What I do

- Explain biomedical concepts and terminology
- Support health technology applications
- Guide on medical device categories and uses
- Assist with biological signal interpretation
- Provide healthcare technology context

## When to use me

- When working with health data or medical software
- When understanding medical device classifications
- When learning about human physiology for engineering
- When researching healthcare technology trends
- When explaining medical concepts to technical teams

## Key Concepts

### Vital Signs and Measurements

| Parameter | Normal Range | Measurement Method |
|-----------|--------------|-------------------|
| Heart Rate | 60-100 bpm | Pulse, ECG |
| Blood Pressure | 120/80 mmHg | Sphygmomanometer |
| Respiratory Rate | 12-20/min | Chest movement |
| Temperature | 36.5-37.5°C | Thermometer |
| SpO2 | 95-100% | Pulse oximetry |

### Biological Signal Types

```python
# Common biomedical signal characteristics
SIGNAL_TYPES = {
    "ECG": {
        "frequency": "0.05-100 Hz",
        "amplitude": "0.1-5 mV",
        "duration": "Continuous",
        "clinical_use": "Heart rhythm, rate"
    },
    "EEG": {
        "frequency": "0.5-50 Hz",
        "amplitude": "10-100 μV",
        "duration": "30-60 min typical",
        "clinical_use": "Brain activity, seizures"
    },
    "EMG": {
        "frequency": "10-500 Hz",
        "amplitude": "0.1-5 mV",
        "duration": "Task-dependent",
        "clinical_use": "Muscle function"
    },
    "EOG": {
        "frequency": "0-10 Hz",
        "amplitude": "10-100 μV",
        "duration": "Recording session",
        "clinical_use": "Eye movements"
    }
}
```

### Medical Device Classifications

| Class | Risk Level | Examples |
|-------|------------|----------|
| Class I | Low | Bandages, stethoscopes |
| Class II | Medium | Infusion pumps, ECG monitors |
| Class III | High | Pacemakers, heart valves |
| IVD | In vitro | Blood glucose meters, pregnancy tests |

### Healthcare Data Standards

- **HL7 FHIR**: Modern healthcare data exchange
- **DICOM**: Medical imaging data format
- **IHE**: Healthcare integration standards
- **SNOMED CT**: Clinical terminology
- **ICD-10**: Disease classification
