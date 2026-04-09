---
name: bioinformatics
description: Computational biological data analysis
license: MIT
compatibility: opencode
metadata:
  audience: bioinformaticians, computational biologists, researchers
  category: biology
---

## What I do

- Analyze and interpret large-scale biological datasets
- Perform sequence alignment and homology modeling
- Develop algorithms for biological data processing
- Create and maintain biological databases
- Predict protein structure and function
- Identify biomarkers and genetic variants

## When to use me

- When analyzing genomic, proteomic, or transcriptomic data
- When searching sequence databases (BLAST, FASTA)
- When predicting protein structure or function
- When identifying variants from sequencing data
- When building phylogenetic trees
- When analyzing gene expression patterns

## Key Concepts

### Sequence Analysis

**Alignment Algorithms**
- Needleman-Wunsch: Global alignment
- Smith-Waterman: Local alignment
- BLAST: Heuristic local alignment
- FASTA: Fast sequence similarity search

```python
# Example: Simple sequence alignment scoring
def simple_align(seq1, seq2, match=1, mismatch=-1, gap=-2):
    """Calculate simple alignment score."""
    score = 0
    for a, b in zip(seq1, seq2):
        if a == b:
            score += match
        else:
            score += mismatch
    return score
```

### Biological Databases

- NCBI (GenBank, PubMed, BLAST)
- UniProt: Protein sequences and function
- PDB: Protein structures
- Ensembl: Genome annotations
- UCSC Genome Browser

### Data Formats

- FASTA: Sequence data
- FASTQ: Sequences + quality scores
- SAM/BAM: Sequence alignment
- VCF: Variant calls
- PDB: Protein structure
- GO: Gene Ontology annotations
