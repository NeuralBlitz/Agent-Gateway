---
name: Bioinformatics
description: Computational biology tools including sequence alignment, phylogenetic analysis, genome assembly, variant calling, and biological database queries for computational research.
license: MIT
compatibility: python>=3.8
audience: bioinformaticians, computational-biologists, researchers, data-scientists
category: biology
---

# Bioinformatics

## What I Do

I provide comprehensive bioinformatics tools including sequence alignment algorithms, phylogenetic analysis, genome assembly, variant calling, biological database queries, and structural bioinformatics for computational biology applications.

## When to Use Me

- DNA/Protein sequence alignment
- Phylogenetic tree construction
- Genome assembly and annotation
- Variant calling and annotation
- Biological database mining
- Protein structure analysis

## Core Concepts

- **Sequence Alignment**: Global, local, pairwise, multiple
- **Substitution Matrices**: BLOSUM, PAM
- **Phylogenetics**: Distance, character, tree building
- **Genome Assembly**: Overlap-layout-consensus, de Bruijn
- **Variant Calling**: SNPs, indels, structural variants
- **Machine Learning**: Protein function prediction
- **Structural Bioinformatics**: Homology modeling, docking
- **Databases**: NCBI, UniProt, PDB, Ensembl

## Code Examples

### Sequence Alignment

```python
from collections import defaultdict

BLOSUM62 = {
    ('A', 'A'): 4, ('A', 'C'): 0, ('A', 'D'): -2, ('A', 'E'): -1,
    ('A', 'R'): -1, ('A', 'N'): -2, ('A', 'K'): -1, ('A', 'M'): -1,
    ('A', 'F'): -2, ('A', 'S'): 1, ('A', 'T'): 0, ('A', 'W'): -3,
    ('A', 'Y'): -2, ('A', 'V'): 0
}

def needleman_wunsch(seq1, seq2, gap_penalty=-2):
    m, n = len(seq1), len(seq2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(m + 1):
        dp[i][0] = i * gap_penalty
    for j in range(n + 1):
        dp[0][j] = j * gap_penalty
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            match = dp[i-1][j-1] + BLOSUM62.get((seq1[i-1], seq2[j-1]), 0)
            delete = dp[i-1][j] + gap_penalty
            insert = dp[i][j-1] + gap_penalty
            dp[i][j] = max(match, delete, insert)
    
    return dp[m][n]

def smith_waterman(seq1, seq2, gap_penalty=-1):
    m, n = len(seq1), len(seq2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            match = dp[i-1][j-1] + BLOSUM62.get((seq1[i-1], seq2[j-1]), 0)
            delete = dp[i-1][j] + gap_penalty
            insert = dp[i][j-1] + gap_penalty
            dp[i][j] = max(0, match, delete, insert)
    
    return max(max(row) for row in dp)

score = needleman_wunsch("MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH", 
                         "MVLSAADKTNVKAAWSKVGGHAGEYGAEALERMFLGFPTTKTYFPHFDLSH")
print(f"Global alignment score: {score}")
```

### Phylogenetic Analysis

```python
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import pdist

def calculate_distance_matrix(sequences):
    n = len(sequences)
    dist_matrix = np.zeros((n, n))
    
    for i in range(n):
        for j in range(i + 1, n):
            dist = 1 - needleman_wunsch(sequences[i], sequences[j]) / max(len(sequences[i]), len(sequences[j]))
            dist_matrix[i, j] = dist_matrix[j, i] = dist
    
    return dist_matrix

def upgma(distance_matrix):
    n = len(distance_matrix)
    clusters = {i: [i] for i in range(n)}
    heights = {i: 0 for i in range(n)}
    
    for step in range(n - 1):
        min_dist = float('inf')
        merge = (0, 0)
        for i in range(n):
            for j in range(i + 1, n):
                if distance_matrix[i, j] < min_dist and i in clusters and j in clusters:
                    min_dist = distance_matrix[i, j]
                    merge = (i, j)
        
        new_height = max(heights[merge[0]], heights[merge[1]]) + min_dist / 2
        clusters[merge[0]].extend(clusters[merge[1]])
        heights[len(clusters)] = new_height
        del clusters[merge[1]]
    
    return clusters

seqs = ["SEQ1", "SEQ2", "SEQ3", "SEQ4"]
dists = calculate_distance_matrix(seqs)
tree = upgma(dists)
print("UPGMA tree constructed")
```

### Variant Calling Basics

```python
def calculate_phred_quality(accuracy):
    return -10 * np.log10(1 - accuracy)

def fastq_to_fasta(input_file, output_file):
    with open(input_file, 'r') as f_in, open(output_file, 'w') as f_out:
        while True:
            header = f_in.readline().strip()
            if not header:
                break
            seq = f_in.readline().strip()
            plus = f_in.readline()
            qual = f_in.readline().strip()
            f_out.write(f">{header[1:]}\n{seq}\n")

def vcf_header(sample_name):
    return f"""##fileformat=VCFv4.2
##source=MyVariantCaller
##sample={sample_name}
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE
"""

def parse_vcf_line(line):
    fields = line.strip().split('\t')
    return {
        'chrom': fields[0],
        'pos': int(fields[1]),
        'ref': fields[3],
        'alt': fields[4],
        'qual': float(fields[5]) if fields[5] != '.' else None,
        'genotype': fields[9].split(':')[0]
    }
```

### Protein Analysis

```python
from collections import Counter

AMINO_ACID_PROPERTIES = {
    'hydrophobic': set('AILMFVWP'),
    'hydrophilic': set('RNDCEQGHKSTY'),
    'positively_charged': set('RKH'),
    'negatively_charged': set('DE'),
    'aromatic': set('FWY')
}

def calculate_protein_properties(sequence):
    aa_counts = Counter(sequence)
    length = len(sequence)
    
    properties = {
        'length': length,
        'molecular_weight': calculate_mw(sequence),
        'isoelectric_point': predict_pi(sequence),
        'hydrophobic_ratio': sum(aa_counts[aa] for aa in 'AILMFVWP') / length,
        'charge_at_ph7': net_charge(sequence, 7)
    }
    return properties

def calculate_mw(sequence):
    mw = 0
    for aa in sequence:
        mw += AA_WEIGHTS.get(aa, 110)
    return mw - 18 * (len(sequence) - 1)

def predict_pi(sequence):
    pKa = {'D': 3.9, 'E': 4.3, 'C': 8.3, 'Y': 10.1, 'H': 6.0, 'K': 10.5, 'R': 12.5}
    charges = {ph: 0 for ph in [5, 6, 7, 8, 9, 10]}
    
    for aa in sequence:
        for ph in charges:
            if aa in pKa:
                if aa in ['D', 'E', 'C', 'Y']:
                    charges[ph] -= 1 / (1 + 10**(ph - pKa[aa]))
                else:
                    charges[ph] += 1 / (1 + 10**(pKa[aa] - ph))
    
    return min(range(5, 11), key=lambda x: abs(charges[x]))

def find_membrane_regions(sequence, window=20):
    hydrophobicity = {'A': 1.8, 'C': 2.5, 'D': -3.5, 'E': -3.5, 'F': 2.8,
                      'G': -0.4, 'H': -3.2, 'I': 4.5, 'K': -3.9, 'L': 3.8,
                      'M': 1.9, 'N': -3.5, 'P': -1.6, 'Q': -3.5, 'R': -4.5,
                      'S': -0.8, 'T': -0.7, 'V': 4.2, 'W': -0.9, 'Y': -1.3}
    
    regions = []
    for i in range(len(sequence) - window):
        avg = np.mean([hydrophobicity.get(aa, 0) for aa in sequence[i:i+window]])
        if avg > 1.0:
            regions.append((i, i+window, avg))
    return regions
```

### Database Queries

```python
import urllib.request
import json

def query_uniprot(accession):
    url = f"https://rest.uniprot.org/uniprotkb/{accession}.json"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())

def query_ncbi_blast(query_sequence, database='nr', max_results=10):
    from Bio.Blast import NCBIWWW
    result_handle = NCBIWWW.qblast('blastp', database, query_sequence)
    return result_handle.read()

def query_ensembl(gene_id):
    url = f"https://rest.ensembl.org/lookup/id/{gene_id}?expand=1"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())

def calculate_sequence_identity(seq1, seq2):
    alignments = needleman_wunsch(seq1, seq2)
    return alignments / max(len(seq1), len(seq2))
```

## Best Practices

1. **Quality Control**: Filter low-quality sequences
2. **Reference Bias**: Use appropriate reference genomes
3. **Multiple Testing**: Correct for statistical testing
4. **Data Formats**: Use standard formats (FASTA, VCF, BAM)
5. **Reproducibility**: Document all parameters

## Common Patterns

```python
# K-mer counting
def count_kmers(sequence, k):
    kmers = {}
    for i in range(len(sequence) - k + 1):
        kmer = sequence[i:i+k]
        kmers[kmer] = kmers.get(kmer, 0) + 1
    return kmers

# Sliding window analysis
def sliding_window_analysis(sequence, window_size, analysis_func):
    results = []
    for i in range(len(sequence) - window_size + 1):
        window = sequence[i:i+window_size]
        results.append(analysis_func(window))
    return results
```

## Core Competencies

1. Sequence alignment algorithms
2. Phylogenetic tree construction
3. Variant calling and annotation
4. Protein sequence analysis
5. Biological database integration
