---
name: physiology
description: Study of normal function in living systems, including organ systems, homeostasis, and integrative biology
category: biology
keywords: [physiology, homeostasis, organ systems, metabolism, circulation, respiration, nervous system]
---

# Physiology

## What I Do

Physiology studies the normal function of living systems at molecular, cellular, and organismal levels. I cover organ systems (cardiovascular, respiratory, nervous, endocrine), homeostasis, metabolism, fluid balance, and integrative physiology. I help understand how organ systems work together to maintain health.

## When to Use Me

- Understanding organ system function and regulation
- Analyzing homeostatic control mechanisms
- Studying metabolism and energy balance
- Understanding cardiovascular and respiratory physiology
- Studying endocrine and nervous system communication
- Analyzing fluid and electrolyte balance
- Understanding exercise and environmental physiology

## Core Concepts

1. **Homeostasis**: Negative feedback, set points, allostatic load
2. **Cardiovascular System**: Cardiac output, blood pressure, microcirculation
3. **Respiratory System**: Lung volumes, gas exchange, oxygen transport
4. **Nervous System**: Action potentials, synaptic transmission, reflexes
5. **Endocrine System**: Hormones, feedback loops, target tissue responses
6. **Renal Physiology**: Filtration, reabsorption, secretion, concentration
7. **Gastrointestinal System**: Digestion, absorption, motility, secretion
8. **Metabolism**: Basal metabolic rate, substrate utilization
9. **Thermoregulation**: Heat production, heat loss, hypothalamic control
10. **Muscle Physiology**: Contraction, excitation-contraction coupling

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class CardiovascularPhysiology:
    def __init__(self, patient_id: str):
        self.patient = patient_id

    def calculate_cardiac_output(self, heart_rate: float,
                                stroke_volume: float) -> float:
        return heart_rate * stroke_volume

    def mean_arterial_pressure(self, systolic: float,
                              diastolic: float) -> float:
        return diastolic + (systolic - diastolic) / 3

    def total_peripheral_resistance(self, map_val: float,
                                    cardiac_output: float) -> float:
        return (map_val / cardiac_output) * 80  # mmHg/L/min to dyn·s/cm^5

    def ejection_fraction(self, edv: float, esv: float) -> float:
        return (edv - esv) / edv * 100

    def stroke_work(self, map_val: float,
                   stroke_volume: float) -> float:
        return map_val * stroke_volume * 0.0136  # mmHg·mL to Joules

    def vo2_max_estimation(self, age: int, sex: str,
                          resting_hr: float) -> float:
        if sex == 'male':
            return 15.3 * (resting_hr / 70) ** (-0.4) - age * 0.2
        return 15.3 * (resting_hr / 75) ** (-0.4) - age * 0.2

class RespiratoryPhysiology:
    def __init__(self, subject_id: str):
        self.subject = subject_id

    def alveolar_gas_equation(self, patm: float,
                            paco2: float,
                            fio2: float,
                            rq: float) -> float:
        PAO2 = fio2 * (patm - 47) - (paco2 / rq) + (paco2 * fio2 * (1 - rq) / rq)
        return PAO2

    def alveolar_ventilation(self, vco2: float,
                           paco2: float) -> float:
        return (vco2 / paco2) * 863  # L/min

    def calculate_shunt(self, cco2: float,
                       cao2: float,
                       cvo2: float) -> float:
        return (cco2 - cao2) / (cco2 - cvo2) * 100

    def diffusion_capacity(self, vco2: float,
                          paco2: float) -> float:
        return vco2 / paco2

    def lung_compliance(self, volume_change: float,
                       pressure_change: float) -> float:
        return volume_change / pressure_change

class RenalPhysiology:
    def __init__(self, patient: str):
        self.patient = patient

    def glomerular_filtration_rate(self, u creatinine: float,
                                  ucr_molar: float,
                                  plasma_creatinine: float,
                                  pcr_molar: float,
                                  age: int,
                                  weight: float,
                                  sex: str) -> float:
        if sex == 'male':
            return (140 - age) * weight / (72 * plasma_creatinine)
        return (140 - age) * weight * 0.85 / (72 * plasma_creatinine)

    def effective_circulating_volume(self, map_val: float,
                                    cvp: float) -> float:
        return map_val - cvp

    def fractional_excretion(self, u_x: float,
                            p_x: float,
                            u_cr: float,
                            p_cr: float) -> float:
        return (u_x / p_x) / (u_cr / p_cr) * 100

    def free_water_clearance(self, osm_plasma: float,
                            u_osm: float,
                            v: float) -> float:
        return v - (u_osm / osm_plasma) * v

    def urine_concentration(self, u_osm: float,
                           p_osm: float) -> float:
        return u_osm / p_osm

class MetabolicPhysiology:
    def __init__(self, individual: str):
        self.individual = individual

    def basal_metabolic_rate(self, weight: float,
                            height: float,
                            age: int,
                            sex: str) -> float:
        if sex == 'male':
            return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
        return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age

    def respiratory_quotient(self, co2_produced: float,
                            o2_consumed: float) -> float:
        return co2_produced / o2_consumed

    def substrate_oxidation(self, vo2: float,
                          vco2: float,
                          urinary_nitrogen: float) -> Dict:
        rq = vco2 / vo2
        cho_ox = 4.11 * vco2 - 2.96 * vo2 - 2.54 * urinary_nitrogen
        fat_ox = 1.68 * vo2 - 1.94 * vco2 - 1.94 * urinary_nitrogen
        return {'carbohydrate_oxidation': max(0, cho_ox),
                'fat_oxidation': max(0, fat_ox),
                'respiratory_quotient': rq}

    def thermic_effect_of_food(self, tef: float,
                             bmr: float) -> float:
        return tef / bmr * 100

cardio = CardiovascularPhysiology("Patient001")
co = cardio.calculate_cardiac_output(70, 70)
print(f"Cardiac Output: {co:.1f} L/min")
map_press = cardio.mean_arterial_pressure(120, 80)
print(f"MAP: {map_press:.1f} mmHg")

resp = RespiratoryPhysiology("Subject001")
pao2 = resp.alveolar_gas_equation(760, 40, 0.21, 0.8)
print(f"Alveolar PO2: {pao2:.1f} mmHg")
```

## Best Practices

1. Consider whole-organism integration in physiological studies
2. Account for compensatory mechanisms in disease states
3. Use appropriate reference ranges for age, sex, and population
4. Consider circadian rhythms in physiological measurements
5. Validate measurements against gold-standard techniques
6. Account for acclimatization in environmental physiology
7. Use proper units and conversions in calculations
8. Consider inter-individual variability in responses
9. Apply proper ethical standards in human/animal research
10. Document measurement conditions for reproducibility
