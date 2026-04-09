---
name: molecular-biology
description: Molecular basis of cellular processes
license: MIT
compatibility: opencode
metadata:
  audience: molecular biologists, researchers, students
  category: biology
---

## What I do

- Study molecular mechanisms in cells
- Analyze DNA, RNA, and protein function
- Investigate gene expression and regulation
- Perform cloning and genetic manipulation
- Study DNA replication and repair
- Research transcription and translation

## When to use me

- When studying gene structure and function
- When analyzing gene expression
- When performing molecular cloning
- When investigating DNA replication
- When researching transcription factors
- When working with RNA

## Key Concepts

### Central Dogma

DNA → RNA → Protein

**Replication**: DNA → DNA
**Transcription**: DNA → RNA
**Translation**: RNA → Protein

### Gene Expression

```python
# Example: Central dogma flow
def central_dogma(sequence):
    """
    Convert DNA sequence to protein.
    """
    # Transcription: DNA to mRNA
    mrna = transcribe(sequence)
    
    # Translation: mRNA to protein
    protein = translate(mrna)
    
    return {'mRNA': mrna, 'protein': protein}

# Gene expression regulation
expression_levels = {
    'constitutive': 'Always expressed',
    'inducible': 'Expression increased by inducer',
    'repressible': 'Expression decreased by repressor'
}
```

### Molecular Techniques

- PCR: Polymerase chain reaction
- Cloning: Gene insertion into vectors
- Sequencing: Sanger, NGS
- Southern/Northern/Western blotting
- CRISPR-Cas9: Genome editing
- RNA interference: Gene silencing

### DNA Replication

- Origins of replication
- DNA polymerases
- Helicase and primase
- Leading and lagging strands
- Okazaki fragments
- DNA ligase
