---
name: cheminformatics
description: Chemical informatics and modeling
license: MIT
compatibility: opencode
metadata:
  audience: cheminformaticians, computational chemists, researchers
  category: chemistry
---

## What I do

- Apply computational methods to chemical data analysis
- Design and search chemical databases
- Predict molecular properties and reactivity
- Perform molecular similarity analysis
- Develop quantitative structure-activity relationships (QSAR)
- Visualize and analyze chemical structures

## When to use me

- When searching chemical databases
- When predicting molecular properties
- When building QSAR/QSPR models
- When analyzing molecular similarity
- When virtual screening compounds
- When managing chemical data

## Key Concepts

### Molecular Descriptors

**Constitutional Descriptors**
- Molecular weight
- Atom counts (C, H, O, N, etc.)
- Number of rings
- LogP (lipophilicity)

**Topological Descriptors**
- Wiener index
- Balaban index
- Connectivity indices
- Hydrogen bond donors/acceptors

```python
# Example: Simple molecular fingerprint
def morgan_fingerprint(molecule, radius=2):
    """Generate Morgan/ECFP fingerprint."""
    # Simplified representation
    return {
        'features': extract_substructures(molecule, radius),
        'bit_vector': encode_as_bits(features),
        'similarity': lambda other: tanimoto_coefficient(features, other)
    }
```

### Chemical File Formats

- SMILES: String representation
- SDF: Structure-data file
- MOL: MOL file format
- PDB: 3D structure
- InChI: IUPAC identifier

### Similarity Metrics

- Tanimoto coefficient (Jaccard)
- Dice similarity
- Cosine similarity
- Euclidean distance
