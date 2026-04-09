---
name: microbiology
description: Study of microorganisms including bacteria, viruses, fungi, and parasites
category: biology
keywords: [microbiology, bacteria, viruses, fungi, pathogens, infection, immune response, antibiotics]
---

# Microbiology

## What I Do

Microbiology studies microorganisms including bacteria, viruses, fungi, and parasites. I cover microbial structure, metabolism, genetics, pathogenicity, antimicrobial resistance, and host-microbe interactions. I help understand infectious diseases, microbial ecology, and applied microbiology.

## When to Use Me

- Identifying and characterizing bacterial isolates
- Understanding viral replication and pathogenesis
- Studying antibiotic mechanisms and resistance
- Analyzing microbial metabolism and physiology
- Working with clinical microbiology and diagnostics
- Understanding host immune responses to infection
- Studying microbiome and environmental microbiology

## Core Concepts

1. **Bacterial Structure**: Cell wall, membrane, flagella, pili, endospores
2. **Microbial Metabolism**: Glycolysis, TCA cycle, respiration, fermentation
3. **Microbial Genetics**: Horizontal gene transfer, plasmids, transformation
4. **Viral Structure**: Capsid, envelope, nucleic acids, replication strategies
5. **Pathogenicity**: Virulence factors, toxins, invasion mechanisms
6. **Antimicrobial Resistance**: Mechanisms, resistance genes, multidrug resistance
7. **Host Defense**: Innate immunity, adaptive immunity, immune evasion
8. **Microbial Ecology**: Biogeochemical cycles, microbial communities
9. **Sterilization and Disinfection**: Autoclaving, disinfectants, aseptic technique
10. **Diagnostic Microbiology**: Culture, staining, PCR, serology

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class BacterialGrowth:
    def __init__(self, organism: str):
        self.organism = organism

    def calculate_generation_time(self, initial_cfu: float,
                                  final_cfu: float,
                                  hours: float) -> float:
        n = np.log2(final_cfu / initial_cfu)
        return hours / n

    def exponential_growth(self, initial_cells: float,
                           growth_rate: float,
                           time: float) -> float:
        return initial_cells * np.exp(growth_rate * time)

    def calculate_moi(self, multiplicity: int,
                      target_cells: float) -> float:
        return multiplicity * target_cells

    def kill_curve_analysis(self, antibiotic_conc: List[float],
                           survival_fractions: List[float]) -> Dict:
        log_kill = [-np.log10(sf) for sf in survival_fractions if sf > 0]
        if len(log_kill) >= 2:
            slope = (log_kill[-1] - log_kill[0]) / (antibiotic_conc[-1] - antibiotic_conc[0])
            return {'slope': slope, 'log_reduction': log_kill}
        return {'slope': 0, 'log_reduction': log_kill}

    def calculate_mic(self, antibiotic_conc: List[float],
                     growth_inhibition: List[float]) -> float:
        for conc, inhibition in zip(antibiotic_conc, growth_inhibition):
            if inhibition >= 0.9:
                return conc
        return max(antibiotic_conc)

    def mbic_predictor(self, mic: float, static_conc: float) -> float:
        return mic * 4  # MBIC typically 4x MIC

class AntibioticMechanisms:
    def __init__(self, antibiotic_class: str):
        self.antibiotic_class = antibiotic_class

    def target_analysis(self, organism: str) -> Dict:
        targets = {
            'penicillin': {'target': 'PBPs', 'organism': 'Gram-positive'},
            'vancomycin': {'target': 'D-Ala-D-Ala', 'organism': 'Gram-positive'},
            'fluoroquinolone': {'target': 'DNA gyrase', 'organism': 'Broad'},
            'aminoglycoside': {'target': '30S ribosome', 'organism': 'Broad'},
            'macrolide': {'target': '50S ribosome', 'organism': 'Broad'}
        }
        return targets.get(self.antibiotic_class, {'target': 'unknown', 'organism': 'unknown'})

    def resistance_mechanism_prediction(self, gene_list: List[str]) -> Dict:
        resistance_genes = {
            'blaZ': 'beta-lactamase',
            'mecA': 'methicillin resistance',
            'vanA': 'vancomycin resistance',
            'tetM': 'tetracycline resistance',
            'erm': 'macrolide resistance'
        }
        mechanisms = []
        for gene in gene_list:
            if gene in resistance_genes:
                mechanisms.append(resistance_genes[gene])
        return {'detected_mechanisms': mechanisms}

    def fractional_inhibitory_index(self, mic_a: float, mic_b: float,
                                    mic_ab: float) -> str:
        fici = (mic_ab / mic_a) + (mic_ab / mic_b)
        if fici <= 0.5:
            return "synergistic"
        elif fici <= 1:
            return "additive"
        elif fici <= 4:
            return "indifferent"
        return "antagonistic"

class ViralReplication:
    def __init__(self, virus: str):
        self.virus = virus

    def calculate_titer(self, wells_positive: List[int],
                        dilution_factor: float,
                        volume_inoculated: float) -> float:
        positive_count = sum(1 for w in wells_positive if w > 0)
        tcid50 = dilution_factor * positive_count / volume_inoculated
        return tcid50

    def plaque_assay_analysis(self, plaques: List[int],
                             dilution: float,
                             volume: float) -> Dict:
        avg_plaques = np.mean(plaques)
        pfu_ml = avg_plaques / (dilution * volume)
        return {
            'pfu_ml': pfu_ml,
            'log10_pfu_ml': np.log10(pfu_ml) if pfu_ml > 0 else 0
        }

    def multiplicity_of_infection(self, virus_titer: float,
                                  target_cells: float) -> float:
        return virus_titer / target_cells

    def calculate_replication_index(self, ct_day1: float,
                                    ct_day3: float) -> float:
        return 2 ** ((ct_day1 - ct_day3) / 3.3)

class HostResponse:
    def __init__(self, pathogen: str):
        self.pathogen = pathogen

    def wbc_response_estimate(self, infection_severity: str) -> Dict:
        responses = {
            'bacterial': {'wbc': 15, 'neutrophils': 0.80},
            'viral': {'wbc': 8, 'lymphocytes': 0.50},
            'fungal': {'wbc': 12, 'neutrophils': 0.70}
        }
        return responses.get(infection_severity, {'wbc': 10, 'neutrophils': 0.60})

    def crp_estimation(self, inflammation_level: str) -> float:
        levels = {'mild': 10, 'moderate': 50, 'severe': 150}
        return levels.get(inflammation_level, 20)

    def procalcitonin_interpretation(self, pct: float) -> str:
        if pct < 0.1:
            return "low probability bacterial infection"
        elif pct < 0.5:
            return "possible bacterial infection"
        elif pct < 2:
            return "likely bacterial infection"
        return "severe bacterial infection likely"

microbe = BacterialGrowth("E.coli")
gen_time = microbe.calculate_generation_time(1000, 1e6, 4)
print(f"Generation time: {gen_time:.1f} hours")
n = microbe.exponential_growth(1000, 1.5, 2)
print(f"Cell count after 2h: {n:.0f}")

mic = microbe.calculate_mic([0.125, 0.25, 0.5, 1, 2, 4], [0.95, 0.92, 0.85, 0.4, 0.1, 0.0])
print(f"MIC: {mic} µg/mL")
```

## Best Practices

1. Use appropriate biosafety levels for pathogenic organisms
2. Maintain sterile technique in all microbiological procedures
3. Use proper controls in antimicrobial susceptibility testing
4. Follow CLSI or EUCAST guidelines for antibiotic interpretation
5. Validate culture conditions for fastidious organisms
6. Store reference strains properly for quality control
7. Use appropriate PPE and containment practices
8. Document strain passage number and storage conditions
9. Use molecular methods for rapid pathogen identification
10. Report infectious disease findings per public health requirements
