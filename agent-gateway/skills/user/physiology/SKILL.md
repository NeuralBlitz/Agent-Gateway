---
name: physiology
description: Body function and systems
license: MIT
compatibility: opencode
metadata:
  audience: physiologists, medical students, researchers
  category: biology
---

## What I do

- Study body system functions and regulation
- Analyze organ system interactions
- Investigate homeostasis mechanisms
- Research physiological adaptations
- Study exercise and environmental physiology
- Analyze physiological disorders

## When to use me

- When studying organ system function
- When analyzing homeostasis
- When investigating physiological responses
- When studying disease mechanisms
- When researching exercise physiology
- When learning integrative physiology

## Key Concepts

### Major Organ Systems

- **Cardiovascular**: Heart, blood vessels, blood
- **Respiratory**: Lungs, airways, gas exchange
- **Nervous**: Brain, spinal cord, nerves
- **Endocrine**: Glands, hormones
- **Digestive**: GI tract, accessory organs
- **Renal**: Kidneys, fluid balance
- **Musculoskeletal**: Bones, muscles, joints

### Homeostasis

```python
# Negative feedback example: Thermoregulation
def thermoregulation(body_temp, set_point=37.0):
    """
    Maintain body temperature.
    """
    deviation = body_temp - set_point
    
    if deviation > 0.5:
        # Too hot: vasodilation, sweating
        return {'response': 'cooling', 'mechanisms': ['sweating', 'vasodilation']}
    elif deviation < -0.5:
        # Too cold: vasoconstriction, shivering
        return {'response': 'warming', 'mechanisms': ['shivering', 'vasoconstriction']}
    else:
        return {'response': 'normal'}

# Feedback types
feedback_types = {
    'negative': 'Counteracts change (most common)',
    'positive': 'Amplifies change (rare, e.g., childbirth)'
}
```

### Physiological Parameters

- Blood pressure: 120/80 mmHg
- Heart rate: 60-100 bpm
- Body temperature: 36.5-37.5°C
- pH: 7.35-7.45
- Blood glucose: 70-100 mg/dL

### Cell Physiology

- Membrane potential: -70 mV
- Action potential: All-or-none
- Diffusion, osmosis, filtration
- Active transport
- Signal transduction
