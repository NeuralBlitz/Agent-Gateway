---
name: bioinformatics
description: Application of computational methods to biological data including sequence analysis, genomics, and systems biology
category: biology
keywords: [bioinformatics, sequence alignment, genomics, proteomics, next-generation sequencing, data analysis]
---

# Bioinformatics

## What I Do

Bioinformatics applies computational methods to analyze biological data. I cover sequence alignment, genome assembly, variant calling, phylogenetics, transcriptomics, proteomics, and systems biology. I help process NGS data, analyze biological networks, and extract insights from large-scale biological datasets.

## When to Use Me

- Analyzing DNA, RNA, and protein sequences
- Processing next-generation sequencing data
- Performing genome assembly and annotation
- Identifying genetic variants and mutations
- Building and analyzing phylogenetic trees
- Studying gene expression and pathways
- Developing machine learning models for biological data

## Core Concepts

1. **Sequence Alignment**: BLAST, pairwise, multiple sequence alignment
2. **Sequence Analysis**: ORFs, motifs, domains, functional annotation
3. **Genome Assembly**: De Bruijn graphs, overlap-layout-consensus
4. **Variant Calling**: SNPs, indels, structural variants, annotation
5. **Transcriptomics**: RNA-seq, differential expression, pathway analysis
6. **Phylogenetics**: Tree building, substitution models, bootstrap
7. **Proteomics**: Protein identification, PTM analysis, structure prediction
8. **Machine Learning**: Classification, clustering, regression models
9. **Biological Networks**: PPI networks, gene regulation, metabolic pathways
10. **Data Visualization**: Heatmaps, volcano plots, genome browsers

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple
from collections import Counter

class SequenceAlignment:
    def __init__(self, seq1: str, seq2: str):
        self.seq1 = seq1.upper()
        self.seq2 = seq2.upper()

    def needleman_wunsch(self, match: int = 2,
                        mismatch: int = -1,
                        gap: int = -2) -> Tuple[np.ndarray, np.ndarray, str]:
        m, n = len(self.seq1), len(self.seq2)
        score = np.zeros((m + 1, n + 1))
        for i in range(m + 1):
            score[i, 0] = i * gap
        for j in range(n + 1):
            score[0, j] = j * gap
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                match_score = match if self.seq1[i-1] == self.seq2[j-1] else mismatch
                score[i, j] = max(
                    score[i-1, j-1] + match_score,
                    score[i-1, j] + gap,
                    score[i, j-1] + gap
                )
        align1, align2 = "", ""
        i, j = m, n
        while i > 0 and j > 0:
            if self.seq1[i-1] == self.seq2[j-1]:
                match = match
            else:
                match = mismatch
            if score[i, j] == score[i-1, j-1] + match:
                align1 = self.seq1[i-1] + align1
                align2 = self.seq2[j-1] + align2
                i -= 1
                j -= 1
            elif score[i, j] == score[i-1, j] + gap:
                align1 = self.seq1[i-1] + align1
                align2 = "-" + align2
                i -= 1
            else:
                align1 = "-" + align1
                align2 = self.seq2[j-1] + align2
                j -= 1
        return score, score[m, n], (align1, align2)

    def smith_waterman(self, match: int = 2,
                     mismatch: int = -1,
                     gap: int = -2) -> Tuple[np.ndarray, Dict]:
        m, n = len(self.seq1), len(self.seq2)
        H = np.zeros((m + 1, n + 1))
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                match_score = match if self.seq1[i-1] == self.seq2[j-1] else mismatch
                H[i, j] = max(0, H[i-1, j-1] + match_score,
                            H[i-1, j] + gap, H[i, j-1] + gap)
        max_score = H.max()
        return H, {'max_score': max_score}

    def calculate_identity(self) -> float:
        matches = sum(1 for a, b in zip(self.seq1, self.seq2) if a == b)
        return matches / min(len(self.seq1), len(self.seq2)) * 100

class VariantAnalysis:
    def __init__(self, vcf_file: str):
        self.vcf_file = vcf_file

    def annotate_variant(self, chromosome: str, position: int,
                        reference: str, alternate: str) -> Dict:
        impact = "MODERATE"
        consequence = "missense_variant"
        if len(reference) == 1 and len(alternate) == 1:
            consequence = "SNP"
        elif len(reference) > len(alternate):
            consequence = "deletion"
        elif len(alternate) > len(reference):
            consequence = "insertion"
        if reference == "ATG" and alternate == "GTG":
            consequence = "start_lost"
        return {
            'chromosome': chromosome,
            'position': position,
            'reference': reference,
            'alternate': alternate,
            'consequence': consequence,
            'impact': impact
        }

    def calculate_zygosity(self, read_depth: int,
                          alt_reads: int) -> str:
        alt_fraction = alt_reads / read_depth
        if alt_fraction > 0.75:
            return "homozygous_alt"
        elif alt_fraction > 0.25:
            return "heterozygous"
        return "homozygous_ref"

    def pathogenicity_prediction(self, variant: Dict) -> Dict:
        score = 0
        if variant['consequence'] == "stop_gained":
            score += 0.8
        elif variant['consequence'] == "missense_variant":
            score += 0.3
        return {
            'pathogenicity_score': score,
            'prediction': 'pathogenic' if score > 0.5 else 'benign'
        }

class NGSAnalysis:
    def __init__(self, sample: str):
        self.sample = sample

    def calculate_coverage(self, aligned_reads: int,
                          genome_size: float) -> float:
        return aligned_reads * 150 / (genome_size * 1e6)

    def expression_analysis(self, counts: Dict[str, float],
                           library_size: float) -> Dict:
        tpm = {}
        for gene, count in counts.items():
            length = 1000  # Average gene length
            tpm[gene] = (count / length) / (sum(c/l for c,l in [(c,1000) for c in counts.values()])) * 1e6
        return tpm

    def differential_expression(self, control_tpm: Dict,
                               treated_tpm: Dict,
                               threshold: float = 2) -> List[Dict]:
        de_genes = []
        for gene in control_tpm:
            if gene in treated_tpm:
                fc = treated_tpm[gene] / (control_tpm[gene] + 0.1)
                if abs(np.log2(fc)) > np.log2(threshold):
                    de_genes.append({
                        'gene': gene,
                        'fold_change': fc,
                        'log2_fc': np.log2(fc)
                    })
        return de_genes

class SequenceAnalysis:
    def __init__(self, sequence: str):
        self.sequence = sequence.upper()

    def calculate_gc_content(self) -> float:
        gc = sum(1 for base in self.sequence if base in 'GC')
        return gc / len(self.sequence) * 100

    def find_orfs(self, min_length: int = 100) -> List[Dict]:
        codons = []
        for frame in range(3):
            for i in range(frame, len(self.sequence) - 2, 3):
                codon = self.sequence[i:i+3]
                if codon == 'ATG':
                    for j in range(i, len(self.sequence) - 2, 3):
                        if self.sequence[j:j+3] in ['TAA', 'TAG', 'TGA']:
                            orf_len = j + 3 - i
                            if orf_len >= min_length:
                                codons.append({
                                    'start': i,
                                    'end': j + 3,
                                    'length': orf_len,
                                    'frame': frame
                                })
                            break
        return codons

seq1 = "ATCGATCGATCG"
seq2 = "ATCGTTCGATCG"
aligner = SequenceAlignment(seq1, seq2)
score, max_score, alignment = aligner.needleman_wunsch()
print(f"Alignment score: {max_score}")
print(f"Alignment: {alignment[0]}\n         {alignment[1]}")
print(f"Identity: {aligner.calculate_identity():.1f}%")

gc = aligner.calculate_gc_content()
print(f"GC Content: {gc:.1f}%")
```

## Best Practices

1. Use appropriate reference genomes and annotations
2. Apply proper quality control to sequencing data
3. Use appropriate statistical methods for differential analysis
4. Validate computational predictions experimentally
5. Document pipeline parameters for reproducibility
6. Use appropriate multiple testing corrections
7. Consider batch effects in large datasets
8. Use standardized data formats (FASTA, FASTQ, BAM, VCF)
9. Report confidence intervals for estimates
10. Share code and data when possible for reproducibility
