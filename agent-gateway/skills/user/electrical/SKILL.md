---
name: electrical
description: Electrical systems and applications
license: MIT
compatibility: opencode
metadata:
  audience: electricians, technicians, homeowners
  category: engineering
---

## What I do

- Explain electrical concepts and terminology
- Provide safety guidance for electrical work
- Guide on electrical equipment selection
- Assist with wiring and installation questions
- Support troubleshooting of electrical issues

## When to use me

- When working on residential or commercial wiring
- When selecting electrical components or equipment
- When understanding electrical safety
- When planning electrical installations
- When troubleshooting electrical problems

## Key Concepts

### Electrical Safety

```python
# Electrical safety parameters
SAFETY_THRESHOLDS = {
    "current_mA": {
        "perception": 1,       # mA - sensation
        "muscular_control": 10, # mA - can't let go
        "ventricular_fibrillation": 100,  # mA
        "cardiac_arrest": 1000  # mA
    },
    "voltage_levels": {
        "low": "< 50V",
        "medium": "50V - 1000V",
        "high": "> 1000V"
    }
}

# PPE requirements
PPE_CATEGORIES = {
    "voltage_class": {
        "0-50V": "None required",
        "50-500V": "Class 00 insulated tools",
        "500V-1kV": "Class 0 insulated tools, gloves",
        "1kV-36kV": "Class 2+ gloves, blankets"
    }
}
```

### Residential Wiring

```python
# Wire gauge selection (AWG)
WIRE_GAUGES = {
    15: {"ampacity": 15, "use": "Lighting circuits"},
    20: {"ampacity": 20, "use": "General outlets"},
    30: {"ampacity": 30, "use": "Appliances, dryers"},
    40: {"ampacity": 40, "use": "Ranges, AC units"},
    50: {"ampacity": 50, "use": "Large appliances"}
}

# Voltage drop calculation
def voltage_drop_percent(I, L, AWG, V):
    """VD% = (2 × K × I × L) / CM
    K = 10.4 (copper), L = one-way length
    """
    cm = {14: 4110, 12: 6530, 10: 10380, 8: 16540}.get(AWG, 10380)
    k = 10.4  # Copper
    vd = (2 * k * I * L) / cm
    return (vd / V) * 100
```

### Common Electrical Devices

| Device | Rating | Application |
|--------|--------|-------------|
| Circuit Breaker | 15-200A | Overcurrent protection |
| GFCI | 15-20A | Ground fault protection |
| AFCI | 15-20A | Arc fault protection |
| Surge Protector | Varies | Transient protection |
| Transformer | Varies | Voltage conversion |

### Electrical Panels

```python
# Panel scheduling
PANEL_SCHEDULE = {
    "main": {
        "rating": "100A, 200A typical",
        "breakers": "Single or double pole"
    },
    "branch": {
        "types": ["15A", "20A", "30A", "40A", "50A"],
        "spacing": "1/2 inch per breaker"
    }
}
```

### AC Power Types

- **Single-phase**: 120V or 240V, residential
- **Three-phase**: 208V or 480V, commercial/industrial
- **Split-phase**: 120/240V, US residential
- **Grounding**: Safety ground, equipment ground

### Circuit Types

| Circuit | Voltage | Application |
|---------|---------|-------------|
| General Purpose | 120V | Lighting, outlets |
| Small Appliance | 120V | Kitchen, laundry |
| Fixed Appliance | 240V | Ranges, dryers |
| HVAC | 240V | Air conditioning |
| Sub-panel | 240V | Distribution |
