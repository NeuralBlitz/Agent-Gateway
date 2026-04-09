---
name: molecular-biology
description: Study of biological processes at the molecular level including DNA, RNA, proteins, and gene expression
category: biology
keywords: [molecular biology, DNA, RNA, gene expression, transcription, translation, PCR, cloning]
---

# Molecular Biology

## What I Do

Molecular biology investigates the molecular mechanisms underlying cellular processes. I cover DNA replication, transcription, translation, gene regulation, recombinant DNA technology, PCR, sequencing, and molecular cloning techniques. I help design experiments, analyze genetic sequences, and understand gene expression patterns.

## When to Use Me

- Designing PCR primers and cloning strategies
- Analyzing DNA and protein sequences
- Understanding gene expression regulation
- Working with recombinant DNA and expression vectors
- Interpreting sequencing data and variants
- Studying epigenetic modifications
- Developing molecular assays and diagnostics

## Core Concepts

1. **Central Dogma**: DNA → RNA → Protein flow of genetic information
2. **DNA Structure**: Double helix, base pairing, replication mechanisms
3. **Transcription**: RNA polymerase, promoters, enhancers, post-transcriptional modifications
4. **Translation**: Ribosomes, tRNA, genetic code, protein synthesis
5. **Gene Regulation**: Promoters, operators, transcription factors, epigenetic control
6. **Recombinant DNA**: Restriction enzymes, ligases, vectors, transformation
7. **PCR**: Primers, cycling conditions, qPCR, RT-PCR applications
8. **Sequencing**: Sanger, NGS, variant calling, sequence alignment
9. **RNA Biology**: miRNA, siRNA, lncRNA, RNA interference
10. **Epigenetics**: DNA methylation, histone modification, chromatin remodeling

## Code Examples

```python
import numpy as np
from typing import List, Dict, Tuple

class DNAAnalysis:
    def __init__(self, sequence: str):
        self.sequence = sequence.upper().replace(' ', '').replace('\n', '')

    def transcribe(self) -> str:
        complement = {'A': 'U', 'T': 'A', 'G': 'C', 'C': 'G'}
        return ''.join(complement.get(base, 'N') for base in self.sequence)

    def reverse_transcribe(self) -> str:
        return self.sequence[::-1]

    def translate(self, frame: int = 0) -> str:
        codon_table = {
            'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
            'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
            'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
            'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
            'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
            'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
            'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
            'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
            'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
            'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
            'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
            'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
            'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
            'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
            'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
            'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
        }
        protein = ""
        for i in range(frame, len(self.sequence) - 2, 3):
            codon = self.sequence[i:i+3]
            protein += codon_table.get(codon, 'X')
        return protein

    def reverse_complement(self) -> str:
        complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
        return ''.join(complement.get(base, 'N') for base in self.sequence[::-1])

    def gc_content(self) -> float:
        gc = sum(1 for base in self.sequence if base in 'GC')
        return gc / len(self.sequence) * 100 if self.sequence else 0

    def find_restriction_sites(self) -> Dict[str, List[int]]:
        enzymes = {
            'EcoRI': 'GAATTC',
            'BamHI': 'GGATCC',
            'HindIII': 'AAGCTT',
            'NotI': 'GCGGCCGC'
        }
        sites = {}
        for enzyme, seq in enzymes.items():
            pos = 0
            sites[enzyme] = []
            while True:
                pos = self.sequence.find(seq, pos)
                if pos == -1:
                    break
                sites[enzyme].append(pos)
                pos += 1
        return sites

    def design_primers(self, product_size: int = 500) -> Dict:
        gc_target = 40 + np.random.uniform(-5, 5)
        tm_target = 55 + np.random.uniform(-2, 2)
        forward_gc = gc_target + np.random.uniform(-10, 10)
        reverse_gc = gc_target + np.random.uniform(-10, 10)
        return {
            'forward_primer': f"{np.random.choice(['AT','GC'])}{np.random.randint(18,25)}bp",
            'reverse_primer': f"{np.random.choice(['AT','GC'])}{np.random.randint(18,25)}bp",
            'expected_tm_forward': tm_target,
            'expected_tm_reverse': tm_target
        }

    def calculate_tm(self, primer: str, na_conc: float = 50) -> float:
        a_t = sum(1 for b in primer if b in 'AT')
        g_c = sum(1 for b in primer if b in 'GC')
        return 64.9 + 41 * (g_c - 16.4) / len(primer) + \
               np.log10(na_conc / 1000) * (len(primer) > 14)

class PCRReaction:
    def __init__(self, template_dna: str):
        self.template = template_dna

    def calculate_cycles(self, initial_amount: float, 
                        efficiency: float = 0.9) -> List[float]:
        cycles = []
        amount = initial_amount
        for i in range(30):
            cycles.append(amount)
            amount *= 2 * efficiency
        return cycles

    def qpcr_analysis(self, ct_values: List[float]) -> Dict:
        return {
            'mean_ct': np.mean(ct_values),
            'std_ct': np.std(ct_values),
            'fold_change': 2 ** (-np.mean(ct_values))
        }

dna = DNAAnalysis("ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG")
print(f"Translation: {dna.translate()}")
print(f"GC Content: {dna.gc_content():.1f}%")
print(f"Restriction sites: {dna.find_restriction_sites()}")
```

## Best Practices

1. Always include proper controls in molecular biology experiments
2. Design primers with appropriate Tm and avoid secondary structures
3. Use fresh reagents and maintain sterile technique
4. Verify plasmid constructs with sequencing before use
5. Optimize PCR conditions for each primer pair
6. Store DNA/RNA samples properly to prevent degradation
7. Document all experimental conditions for reproducibility
8. Use appropriate biosafety levels for biological materials
9. Validate antibody specificity in Western blot experiments
10. Quantify nucleic acids before downstream applications
