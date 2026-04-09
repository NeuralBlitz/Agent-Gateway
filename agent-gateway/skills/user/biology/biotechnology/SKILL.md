---
name: biotechnology
description: Application of biological systems and organisms to develop products and technologies
category: biology
keywords: [biotechnology, genetic engineering, bioprocessing, synthetic biology, biopharmaceuticals, biofuels]
---

# Biotechnology

## What I Do

Biotechnology applies biological systems and organisms to develop products and technologies. I cover genetic engineering, recombinant DNA technology, bioprocessing, synthetic biology, biopharmaceutical manufacturing, biofuel production, and agricultural biotechnology. I help design bioprocesses, develop engineered organisms, and scale up production.

## When to Use Me

- Designing recombinant DNA constructs and vectors
- Developing microbial strains for production
- Optimizing bioprocess conditions and scale-up
- Working with cell culture and biopharmaceuticals
- Developing synthetic biology circuits
- Engineering enzymes and metabolic pathways
- Designing CRISPR gene editing experiments

## Core Concepts

1. **Recombinant DNA**: Plasmids, restriction enzymes, ligation, transformation
2. **Genetic Engineering**: Gene insertion, deletion, modification
3. **Synthetic Biology**: Genetic circuits, BioBrick standards, gene design
4. **Bioprocessing**: Fermentation, bioreactors, upstream/downstream processing
5. **Cell Culture**: Mammalian cell lines, stem cells, media optimization
6. **Protein Engineering**: Directed evolution, rational design, library screening
7. **Enzyme Technology**: Immobilization, cofactor regeneration, kinetics
8. **Downstream Processing**: Purification, chromatography, formulation
9. **Scale-up**: Mixing, oxygen transfer, heat transfer, process parameters
10. **Quality Control**: Purity, potency, identity testing, stability

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class RecombinantDNA:
    def __init__(self, vector_name: str):
        self.vector = vector_name

    def design_gibson_assembly(self, insert_seq: str,
                               vector_seq: str,
                               homology_length: int = 40) -> Dict:
        left_arm = vector_seq[-homology_length:]
        right_arm = vector_seq[:homology_length]
        construct = left_arm + insert_seq + right_arm
        return {
            'full_construct': construct,
            'forward_primer': 'ATG' + construct[:20],
            'reverse_primer': construct[-21:] + 'TCA'
        }

    def calculate_gibson_efficiency(self, fragment_conc: float,
                                    vector_conc: float,
                                    insert_size: int,
                                    vector_size: int) -> float:
        insert_molar = fragment_conc / insert_size
        vector_molar = vector_conc / vector_size
        ratio = 3 * insert_molar / vector_molar
        return min(ratio, 5)

    def crispr_guide_design(self, target_sequence: str,
                           pam: str = "NGG") -> List[Dict]:
        guides = []
        for i in range(len(target_sequence) - 2):
            if target_sequence[i+2:i+4] == pam:
                guide = target_sequence[i:i+20]
                gc = sum(1 for b in guide if b in 'GC') / 20
                if 0.4 < gc < 0.8:
                    guides.append({
                        'guide_rna': guide,
                        'position': i,
                        'gc_content': gc,
                        'score': 1 - abs(0.5 - gc)
                    })
        return sorted(guides, key=lambda x: x['score'], reverse=True)[:5]

    def off_target_prediction(self, guide: str,
                             genome_sequence: str) -> List[str]:
        off_targets = []
        for i in range(len(genome_sequence) - 20):
            mismatch = sum(1 for a, b in zip(guide, genome_sequence[i:i+20]) if a != b)
            if 0 < mismatch <= 3:
                off_targets.append(f"Position {i}: {mismatch} mismatches")
        return off_targets

class BioprocessEngineering:
    def __init__(self, organism: str):
        self.organism = organism

    def calculate_yield_coefficient(self, substrate_consumed: float,
                                   biomass_produced: float,
                                   product_formed: float) -> Dict:
        Y_xs = biomass_produced / substrate_consumed
        Y_ps = product_formed / substrate_consumed
        return {
            'YXS': Y_xs,
            'YPS': Y_ps,
            'substrate_efficiency': biomass_produced / (substrate_consumed + 1e-9)
        }

    def calculate_oxygen_transfer_rate(self, kla: float,
                                      c_star: float,
                                      c: float) -> float:
        return kla * (c_star - c)

    def predict_specific_growth_rate(self, substrate: float,
                                    mu_max: float,
                                    ks: float) -> float:
        return mu_max * substrate / (ks + substrate)

    def scale_up_parameters(self, small_scale: Dict,
                           scale_factor: float) -> Dict:
        power_small = small_scale.get('power', 100)
        volume_small = small_scale.get('volume', 1)
        return {
            'volume': volume_small * scale_factor,
            'power': power_small * (scale_factor ** 0.67),
            'rpm': small_scale.get('rpm', 500) * (scale_factor ** -0.33)
        }

    def calculate_pff(self, permeate_flux: float,
                      membrane_area: float,
                      feed_concentration: float) -> float:
        return permeate_flux * membrane_area * feed_concentration

class ProteinEngineering:
    def __init__(self, protein_name: str):
        self.protein = protein_name

    def directed_evolution_library(self, wild_type_seq: str,
                                  mutation_rate: float) -> List[str]:
        library = [wild_type_seq]
        for i in range(len(wild_type_seq)):
            if np.random.random() < mutation_rate:
                for aa in 'ACDEFGHIKLMNPQRSTVWY':
                    if aa != wild_type_seq[i]:
                        new_seq = wild_type_seq[:i] + aa + wild_type_seq[i+1:]
                        library.append(new_seq)
        return library[:1000]

    def calculate_mutational_load(self, library_size: int,
                                 target_protein_size: int) -> float:
        theoretical_library = 19 ** target_protein_size
        coverage = library_size / theoretical_library
        return coverage

    def thermal_stability_prediction(self, mutations: List[str],
                                    wt_tm: float) -> Dict:
        return {'predicted_Tm': wt_tm + 2, 'delta_Tm': 2}

class BiopharmaceuticalManufacturing:
    def __init__(self, product: str):
        self.product = product

    def calculate_cell_density(self, viable_count: float,
                             viability: float,
                             volume: float) -> Dict:
        total_cells = viable_count * volume
        viable_cells = total_cells * viability / 100
        return {
            'total_cells_ml': total_cells,
            'viable_cells_ml': viable_cells,
            'viability': viability
        }

    def purification_yield(self, load_mass: float,
                          eluate_mass: float,
                          volume_load: float,
                          volume_eluate: float) -> Dict:
        yield_percent = eluate_mass / load_mass * 100
        concentration_factor = (eluate_mass / volume_eluate) / (load_mass / volume_load)
        return {
            'yield': yield_percent,
            'concentration_factor': concentration_factor
        }

    def calculate_hcp_removal(self, hcp_before: float,
                              hcp_after: float,
                              purification_factor: float) -> Dict:
        log_reduction = np.log10(hcp_before / hcp_after)
        return {
            'log_reduction': log_reduction,
            'purification_factor': purification_factor
        }

crispr = RecombinantDNA("pX330")
guides = crispr.crispr_guide_design("ATCGATCGATCGATCGATCG")
print(f"Top 5 guides: {len(guides)} designed")

bio = BioprocessEngineering("E.coli")
scale = bio.scale_up_parameters({'power': 100, 'volume': 1, 'rpm': 500}, 1000)
print(f"Scaled up - Volume: {scale['volume']:.0f}L, Power: {scale['power']:.0f}W")
```

## Best Practices

1. Use proper vector backbones with selection markers
2. Verify all constructs with sequencing before use
3. Optimize expression conditions for each protein
4. Maintain detailed notebooks for strain and clone tracking
5. Apply QbD principles for bioprocess development
6. Use appropriate analytical characterization methods
7. Follow GMP guidelines for therapeutic products
8. Monitor critical process parameters continuously
9. Implement proper contamination controls
10. Validate purification processes for each product
