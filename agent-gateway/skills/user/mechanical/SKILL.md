---
name: mechanical
description: Mechanical systems and applications
license: MIT
compatibility: opencode
metadata:
  audience: technicians, mechanics, students
  category: engineering
---

## What I do

- Explain mechanical concepts and terminology
- Guide on mechanical equipment and systems
- Assist with maintenance and troubleshooting
- Support selection of mechanical components
- Provide mechanical safety guidance

## When to use me

- When working with mechanical equipment
- When selecting bearings, fasteners, or components
- When troubleshooting mechanical issues
- When understanding mechanical systems
- When planning maintenance activities

## Key Concepts

### Common Mechanical Components

| Component | Function | Selection Criteria |
|-----------|----------|-------------------|
| Bearing | Reduce friction, support load | Load, speed, alignment |
| Gear | Transmit power, change speed/ratio | Pitch, ratio, material |
| Belt | Transmit power over distance | HP, speed ratio |
| Chain | High torque transmission | Pitch, strength |
| Fastener | Join components | Shear, tension load |

### Bearing Types

```python
# Bearing selection basics
BEARING_TYPES = {
    "deep_groove": {
        "load": "Radial and some axial",
        "speed": "High",
        "cost": "Low"
    },
    "angular_contact": {
        "load": "Combined radial/thrust",
        "speed": "High",
        "cost": "Medium"
    },
    "tapered_roller": {
        "load": "Heavy radial and thrust",
        "speed": "Medium",
        "cost": "Medium"
    },
    "thrust": {
        "load": "Axial only",
        "speed": "Medium",
        "cost": "Low"
    }
}

def bearing_life(L10, C, P):
    """L10 life in hours
    L10 = (C/P)^3 × 10^6 / (60n)
    """
    return (C / P)**3 * 10**6 / (60 * 3600)
```

### Fasteners

```python
# Bolt strength grades
BOLT_GRADES = {
    "grade_2": {"tensile": 345, "yield": 190},  # MPa
    "grade_5": {"tensile": 635, "yield": 420},
    "grade_8": {"tensile": 855, "yield": 720},
    "metric_8.8": {"tensile": 800, "yield": 640},
    "metric_12.9": {"tensile": 1200, "yield": 1080}
}

def bolt_preload(F_bolt, A_t):
    """σ = F/A"""
    return F_bolt / A_t
```

### Lubrication

```python
# Lubricant types
LUBRICANT_TYPES = {
    "oil": {
        "viscosity_grade": "ISO VG 32-680",
        "applications": "Bearings, gears, hydraulics"
    },
    "grease": {
        "nlgi_grade": "1-3",
        "applications": "Bearings, sealed systems"
    },
    "dry_film": {
        "types": ["graphite", "MoS2", "PTFE"],
        "applications": "High temp, food grade"
    }
}

# Viscosity temperature relationship
def viscosity_index(VI, v1, v2):
    """Higher VI = less viscosity change with temperature"""
    pass
```

### Power Transmission

| Mechanism | Efficiency | Speed Range | Torque |
|-----------|------------|-------------|--------|
| Gear | 95-98% | Wide | High |
| Belt | 90-95% | Limited | Medium |
| Chain | 90-96% | Limited | High |
| Direct Drive | 98%+ | Limited | High |

### Maintenance Schedules

```python
MAINTENANCE_INTERVALS = {
    "daily": [
        "Visual inspection",
        "Lubrication level check",
        "Temperature check"
    ],
    "weekly": [
        "Vibration analysis",
        "Noise inspection",
        "Belt tension"
    ],
    "monthly": [
        "Lubricant analysis",
        "Alignment check",
        "Torque verification"
    ],
    "annually": [
        "Complete overhaul",
        "Bearing replacement",
        "System calibration"
    ]
}
```

### Safety

- Lockout/tagout procedures
- Machine guarding requirements
- Personal protective equipment
- Hydraulic system pressure safety
- Lifting and rigging safety
