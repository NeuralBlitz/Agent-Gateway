---
name: chemical
description: Chemistry fundamentals and applications
license: MIT
compatibility: opencode
metadata:
  audience: engineers, scientists, students
  category: engineering
---

## What I do

- Explain chemical principles and reaction mechanisms
- Provide solubility, reactivity, and safety information
- Support chemical analysis and characterization
- Guide on chemical handling and storage
- Assist with laboratory and industrial chemistry

## When to use me

- When working with chemical processes or formulations
- When needing chemical property data or reactivity
- When selecting materials for chemical compatibility
- When understanding reaction stoichiometry
- When researching chemical safety considerations

## Key Concepts

### Chemical Properties

```python
# Common chemical data structures
CHEMICAL_PROPERTIES = {
    "water": {
        "formula": "H2O",
        "mw": 18.015,
        "density": 1000,  # kg/m³
        "melting_point": 0,  # °C
        "boiling_point": 100,
        "solubility": "miscible"
    },
    "ethanol": {
        "formula": "C2H5OH",
        "mw": 46.07,
        "density": 789,
        "melting_point": -114,
        "boiling_point": 78.37,
        "solubility": "miscible"
    },
    "acetone": {
        "formula": "C3H6O",
        "mw": 58.08,
        "density": 784,
        "melting_point": -95,
        "boiling_point": 56,
        "solubility": "miscible"
    }
}
```

### Common Chemical Reactions

| Reaction Type | General Form | Example |
|---------------|--------------|---------|
| Synthesis | A + B → AB | 2H₂ + O₂ → 2H₂O |
| Decomposition | AB → A + B | 2H₂O → 2H₂ + O₂ |
| Single Replacement | A + BC → AC + B | Zn + 2HCl → ZnCl₂ + H₂ |
| Double Replacement | AB + CD → AD + CB | AgNO₃ + NaCl → AgCl + NaNO₃ |
| Combustion | Fuel + O₂ → CO₂ + H₂O | CH₄ + 2O₂ → CO₂ + 2H₂O |

### Safety and Handling

```python
# GHS Hazard Classes
GHS_HAZARDS = {
    "flammable": ["Flammable gas", "Flammable liquid", "Flammable solid"],
    "oxidizer": ["Oxidizing gas", "Oxidizing liquid", "Oxidizing solid"],
    "corrosive": ["Skin corrosion", "Eye damage"],
    "toxic": ["Acute toxicity", "Carcinogen", "Mutagen"],
    "environmental": ["Aquatic toxicity", "Ozone layer"]
}

# Storage groups (incompatible chemicals)
STORAGE_GROUPS = {
    "acids": {"compatible": ["acids"], "incompatible": ["bases", "cyanides", "sulfides"]},
    "bases": {"compatible": ["bases"], "incompatible": ["acids", "metals", "acids"]},
    "flammables": {"compatible": ["flammables"], "incompatible": ["oxidizers", "acids"]},
    "oxidizers": {"compatible": ["oxidizers"], "incompatible": ["flammables", "acids", "metals"]}
}
```

### Concentration Units

```python
# Common concentration conversions
def molarity_to_molality(M, density, mw_solute):
    """Convert molarity to molality"""
    # m = (1000 * M) / (1000*ρ - M * mw)
    solvent_mass = (1000 * density - M * mw_solute) / 1000
    return M / solvent_mass

def ppm_to_mg_m3(ppm, mw):
    """Convert ppm to mg/m³"""
    # At 25°C and 1 atm: mg/m³ = ppm × MW / 24.45
    return ppm * mw / 24.45

def percent_to_molarity(percent, mw):
    """Convert weight percent to molarity"""
    # Approximate: M = (10 × percent) / MW
    return (10 * percent) / mw
```

### Chemical Analysis Methods

| Method | Principle | Applications |
|--------|-----------|--------------|
| Titration | Neutralization reaction | Concentration determination |
| Spectroscopy | Light absorption/emission | Elemental analysis |
| Chromatography | Phase separation | Mixture analysis |
| Mass spec | Ion mass/charge | Molecular identification |
| pH measurement | Electrode potential | Acidity/basicity |
