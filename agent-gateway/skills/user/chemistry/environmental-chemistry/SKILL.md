---
name: environmental-chemistry
description: Study of chemical processes in the environment, pollution, green chemistry, and sustainability
category: chemistry
keywords: [environmental chemistry, pollution, green chemistry, atmospheric chemistry, water quality, sustainability]
---

# Environmental Chemistry

## What I Do

Environmental chemistry studies chemical processes occurring in natural and human-impacted environments. I cover atmospheric chemistry, water quality, soil chemistry, pollution, green chemistry principles, climate change chemistry, and environmental analysis. I help assess contaminant fate, design sustainable processes, and analyze environmental samples.

## When to Use Me

- Analyzing water and soil quality
- Studying atmospheric chemistry and air pollution
- Assessing contaminant transport and fate
- Designing green chemical processes
- Evaluating environmental remediation strategies
- Calculating pollutant concentrations and exposure
- Implementing sustainable chemistry practices

## Core Concepts

1. **Atmospheric Chemistry**: Ozone formation, greenhouse gases, aerosols, smog
2. **Water Chemistry**: pH, hardness, dissolved oxygen, nutrients, contaminants
3. **Soil Chemistry**: Cation exchange capacity, adsorption, nutrient cycling
4. **Pollution**: Heavy metals, organic pollutants, endocrine disruptors
5. **Green Chemistry**: Atom economy, renewable feedstocks, waste prevention
6. **Fate and Transport**: Partitioning, degradation, bioaccumulation
7. **Environmental Analysis**: GC-MS, LC-MS, ICP-MS for environmental samples
8. **Climate Change**: Carbon cycle, radiative forcing, carbon footprint
9. **Remediation**: Bioremediation, adsorption, advanced oxidation
10. **Toxicology**: LD50, bioaccumulation factor, ecological risk assessment

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class WaterQuality:
    def __init__(self, location: str):
        self.location = location
        self.parameters = {}

    def calculate_dissolved_oxygen(self, temperature: float,
                                  salinity: float = 0,
                                  pressure: float = 1) -> float:
        do_saturation = 14.652 - 0.41022 * temperature + 0.00799 * temperature**2
        do_saturation -= 0.00000319 * temperature**3
        if salinity > 0:
            do_saturation *= (1 - 0.017 * salinity)
        return do_saturation * pressure

    def calculate_hardness(self, ca_conc: float, mg_conc: float) -> Dict:
        hardness_mgl = ca_conc * 2.497 + mg_conc * 4.118
        hardness_mmol = ca_conc * 2.497 / 100 + mg_conc * 4.118 / 100
        classification = "soft" if hardness_mmol < 2 else \
                        "moderately_hard" if hardness_mmol < 4 else \
                        "hard" if hardness_mmol < 8 else "very_hard"
        return {
            'hardness_mgl': hardness_mgl,
            'hardness_mmol': hardness_mmol,
            'classification': classification
        }

    def calculate_bod(self, initial_do: float, final_do: float,
                      dilution_factor: float) -> float:
        return (initial_do - final_do) * dilution_factor

    def calculate_cod(self, sample_volume: float, titrant_volume: float,
                     normality: float, dilution: int) -> float:
        return (titrant_volume * normality * 8000) / (sample_volume * dilution)

class AirQuality:
    def __init__(self, site: str):
        self.site = site
        self.pollutants = {}

    def calculate_aqi(self, pollutant_concentrations: Dict[str, float]) -> Dict:
        aqi_breakpoints = {
            'PM2.5': [(0, 12, 50), (12.1, 35.4, 100), (35.5, 55.4, 150)],
            'PM10': [(0, 54, 50), (55, 154, 100), (155, 254, 150)],
            'O3': [(0, 54, 50), (55, 70, 100), (71, 85, 150)]
        }
        max_aqi = 0
        pollutant_of_concern = ""
        for pollutant, conc in pollutant_concentrations.items():
            if pollutant in aqi_breakpoints:
                for bp in aqi_breakpoints[pollutant]:
                    if bp[0] <= conc <= bp[1]:
                        aqi = ((bp[3] - bp[2]) / (bp[1] - bp[0])) * (conc - bp[0]) + bp[2]
                        if aqi > max_aqi:
                            max_aqi = aqi
                            pollutant_of_concern = pollutant
                        break
        return {'AQI': max_aqi, 'primary_pollutant': pollutant_of_concern}

    def ozone_formation(self, voc: float, nox: float) -> Dict:
        voc_nox_ratio = voc / nox if nox > 0 else float('inf')
        ozone_production = 0.0
        if voc_nox_ratio > 4:
            ozone_production = "NOx-limited"
        elif voc_nox_ratio < 4:
            ozone_production = "VOC-limited"
        return {'ratio': voc_nox_ratio, 'regime': ozone_production}

class GreenChemistry:
    def __init__(self, reaction: str):
        self.reaction = reaction

    def atom_economy(self, molecular_weights_products: List[float],
                     mw_reactants: List[float]) -> float:
        total_product = sum(molecular_weights_products)
        total_reactant = sum(mw_reactants)
        return (total_product / total_reactant) * 100

    def e_factor(self, total_waste: float, product_mass: float) -> float:
        return total_waste / product_mass

    def calculate_carbon_efficiency(self, carbon_in_product: float,
                                   total_carbon: float) -> float:
        return (carbon_in_product / total_carbon) * 100

    def reaction_mass_efficiency(self, product_mass: float,
                                 reactant_masses: List[float],
                                 solvent_mass: float) -> float:
        return product_mass / (sum(reactant_masses) + solvent_mass) * 100

water = WaterQuality("River Site A")
do = water.calculate_dissolved_oxygen(25)
print(f"DO saturation at 25°C: {do:.2f} mg/L")

air = AirQuality("Urban Station")
aqi = air.calculate_aqi({'PM2.5': 45, 'O3': 60})
print(f"AQI: {aqi['AQI']:.0f}, Primary pollutant: {aqi['primary_pollutant']}")
```

## Best Practices

1. Use proper sampling protocols for environmental analysis
2. Account for matrix effects in environmental sample preparation
3. Apply appropriate QA/QC procedures (blanks, spikes, duplicates)
4. Consider seasonal and temporal variations in environmental data
5. Use proper detection limits for trace environmental contaminants
6. Apply green chemistry principles when developing new processes
7. Consider life cycle assessment for environmental impact
8. Validate analytical methods with certified reference materials
9. Report uncertainty in environmental measurements
10. Follow proper disposal protocols for environmental samples
