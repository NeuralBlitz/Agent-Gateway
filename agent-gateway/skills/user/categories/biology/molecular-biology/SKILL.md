---
name: Molecular Biology
description: Molecular biology techniques including PCR, cloning, sequencing, gene expression, CRISPR, and cell culture for biotechnology applications.
license: MIT
compatibility: python>=3.8
audience: molecular-biologists, biochemists, geneticists, researchers
category: biology
---

# Molecular Biology

## What I Do

I provide comprehensive molecular biology tools including PCR design, cloning strategies, DNA sequencing analysis, gene expression quantification, CRISPR guide design, and cell culture calculations for biotechnology applications.

## When to Use Me

- PCR primer design
- Cloning strategy planning
- DNA sequence analysis
- Gene expression studies
- CRISPR genome editing
- Vector construction

## Core Concepts

- **PCR**: Primers, annealing, extension, cycle number
- **Cloning**: Restriction enzymes, ligation, transformation
- **Sequencing**: Sanger, NGS, read quality, assembly
- **Gene Expression**: RT-qPCR, RNA-Seq, normalization
- **CRISPR**: gRNA design, off-target prediction
- **Transformation**: Efficiency, selection markers
- **Protein Expression**: Promoters, vectors, purification
- **Flow Cytometry**: Fluorescence, cell sorting

## Code Examples

### PCR Calculations

```python
def calculate_tm(sequence):
    if len(sequence) < 14:
        return 2 * (sequence.count('A') + sequence.count('T')) + 4 * (sequence.count('G') + sequence.count('C'))
    return 64.9 + 41 * (sequence.count('G') + sequence.count('C') - 16.4) / len(sequence)

def recommended_annealing_temp(forward, reverse):
    Tm_f = calculate_tm(forward)
    Tm_r = calculate_tm(reverse)
    return (Tm_f + Tm_r) / 2 - 5

def optimal_gc_content(sequence):
    return (sequence.count('G') + sequence.count('C')) / len(sequence) * 100

def amplicon_size(forward, reverse, template):
    return len(forward) + len(reverse)

forward = "ATGAGTGTGCTG"
reverse = "TTACACACACCA"
print(f"Tm (forward): {calculate_tm(forward):.1f}°C")
print(f"Annealing temp: {recommended_annealing_temp(forward, reverse):.1f}°C")
```

### Primer Design

```python
PRIMER_CONSTRAINTS = {
    'min_length': 18,
    'max_length': 25,
    'min_tm': 55,
    'max_tm': 65,
    'max_gc': 60,
    'min_gc': 40,
    'max_self_complementarity': 4,
    'max_3end_gc': 3
}

def validate_primer(sequence):
    errors = []
    gc = optimal_gc_content(sequence)
    
    if len(sequence) < PRIMER_CONSTRAINTS['min_length']:
        errors.append(f"Too short: {len(sequence)}")
    if len(sequence) > PRIMER_CONSTRAINTS['max_length']:
        errors.append(f"Too long: {len(sequence)}")
    if gc < PRIMER_CONSTRAINTS['min_gc']:
        errors.append(f"GC too low: {gc:.1f}%")
    if gc > PRIMER_CONSTRAINTS['max_gc']:
        errors.append(f"GC too high: {gc:.1f}%")
    
    return {'valid': len(errors) == 0, 'errors': errors}

def find_primers(target_sequence, product_size_range):
    potential_primers = []
    for i in range(len(target_sequence) - 17):
        fwd = target_sequence[i:i+18]
        gc = optimal_gc_content(fwd)
        if 40 <= gc <= 60:
            potential_primers.append(('forward', i, fwd))
    return potential_primers

print(f"Primer validation: {validate_primer('ATGCGATCGATCGATCG')}")
```

### Gene Expression Analysis

```python
def delta_delta_ct_method(ct_treated, ct_control, ref_treated, ref_control):
    dct_treated = ct_treated - ref_treated
    dct_control = ct_control - ref_control
    ddct = dct_treated - dct_control
    fold_change = 2 ** (-ddct)
    return fold_change, ddct

def rpkm_normalization(mapped_reads, gene_length, total_reads):
    return mapped_reads / (gene_length / 1000 * total_reads / 1e6)

def tpm_normalization(mapped_reads, gene_length, rpkm_sum):
    rpkm = rpkm_normalization(mapped_reads, gene_length, sum(mapped_reads))
    return (rpkm / rpkm_sum) * 1e6

ct_gene = 22.5
ct_ref = 18.2
fold_change, ddct = delta_delta_ct_method(ct_gene, 25.0, ct_ref, 17.8)
print(f"Fold change: {fold_change:.2f}x")
```

### CRISPR gRNA Design

```python
PAM_SEQUENCE = "NGG"

def find_spCas9_sites(sequence):
    sites = []
    for i in range(len(sequence) - 2):
        motif = sequence[i:i+3]
        if motif[1:] == "GG":
            guide = sequence[i:i+20]
            sites.append({
                'position': i,
                'gRNA': guide,
                'PAM': motif,
                'score': predict_guide_score(guide)
            })
    return sorted(sites, key=lambda x: x['score'], reverse=True)

def predict_guide_score(gRNA):
    scores = {
        'G': 0.5, 'C': 0.5, 'A': 0.3, 'T': 0.2,
        'GG': 0.2, 'CC': 0.2, 'AA': 0.1, 'TT': 0.1
    }
    score = 0
    for i in range(len(gRNA) - 1):
        dinuc = gRNA[i:i+2]
        score += scores.get(dinuc, 0)
    return score

def check_off_targets(gRNA, genome, mismatch_limit=3):
    off_targets = []
    for i in range(len(genome) - len(gRNA) + 1):
        mismatches = sum(1 for j in range(len(gRNA)) if genome[i+j] != gRNA[j])
        if mismatches <= mismatch_limit:
            off_targets.append({'position': i, 'mismatches': mismatches})
    return off_targets

sequence = "ATGCGTAGCTAGCTAGCTAGCGGATCC"
sites = find_spCas9_sites(sequence)
print(f"Found {len(sites)} potential gRNA sites")
```

### Cloning Calculations

```python
def calculate_ligation_efficiency(insert_conc, vector_conc, insert_size, vector_size):
    insert_moles = insert_conc / insert_size
    vector_moles = vector_conc / vector_size
    molar_ratio = insert_moles / vector_moles
    return min(molar_ratio / 3, 1.0)  # 3:1 molar ratio recommended

def calculate_transformation_efficiency(colonies, volume_plated, dilution_factor, DNA_amount):
    cfu_per_µg = colonies * dilution_factor * (1000 / volume_plated) / DNA_amount
    return cfu_per_µg

def digest_calculation(DNA_amount, units_enzyme, incubation_time):
    units_per_µg = units_enzyme / DNA_amount
    return {
        'units_per_µg': units_per_µg,
        'suggested_incubation': f"{max(incubation_time, 60)} min at 37°C"
    }

insert_ng, vector_ng = 50, 100
insert_bp, vector_bp = 500, 3000
eff = calculate_ligation_efficiency(insert_ng/500, vector_ng/3000, 500, 3000)
print(f"Ligation efficiency: {eff:.2f}")
```

## Best Practices

1. **Primer Design**: Avoid hairpins and dimers
2. **qPCR**: Include technical replicates
3. **CRISPR**: Validate off-target effects
4. **Controls**: Include positive and negative controls
5. **Replication**: Multiple biological replicates

## Common Patterns

```python
# Codon usage optimization
CODON_USAGE = {
    'A': ['GCT', 'GCC', 'GCA', 'GCG'],
    'K': ['AAA', 'AAG']
}

def optimize_codon_usage(sequence, host='E.coli'):
    optimized = ''
    for aa in translate_dna(sequence):
        best_codon = max(CODON_USAGE.get(aa, [sequence[i:i+3]]))
        optimized += best_codon
    return optimized

# Sanger sequencing trace analysis
def analyze_trace_quality(trace_file):
    peak_heights = extract_peak_heights(trace_file)
    return {
        'Q20_bases': sum(1 for h in peak_heights if h > 100),
        'average_quality': np.mean(peak_heights)
    }
```

## Core Competencies

1. PCR and primer design
2. Gene expression quantification
3. CRISPR guide RNA design
4. Cloning and transformation
5. Sequence analysis and assembly
