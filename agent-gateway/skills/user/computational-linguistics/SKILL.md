---
name: computational-linguistics
description: Computational linguistics fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Apply linguistic theory to computation
- Build language models with linguistic structure
- Implement syntactic and semantic analysis
- Create cross-linguistic NLP systems
- Handle multilingual text processing

## When to use me

Use me when:
- Building linguistically-aware NLP
- Multilingual applications
- Grammar and syntax processing
- Semantic representation

## Key Concepts

### Linguistic Analysis Levels
```
┌─────────────────────────────────────────────┐
│              Discourse                      │
│         (context, coherence)                │
├─────────────────────────────────────────────┤
│               Semantics                     │
│     (meaning, representation)               │
├─────────────────────────────────────────────┤
│             Pragmatics                      │
│    (intent, context, speech acts)           │
├─────────────────────────────────────────────┤
│              Syntax                         │
│      (grammar, structure rules)            │
├─────────────────────────────────────────────┤
│               Morphology                    │
│       (word formation, inflections)        │
├─────────────────────────────────────────────┤
│             Phonology/Orthography           │
│           (sounds, written form)           │
└─────────────────────────────────────────────┘
```

### Syntax Parsing
```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cat sat on the mat.")

# Part-of-speech tags
for token in doc:
    print(token.text, token.pos_, token.tag_)

# Dependency parsing
for token in doc:
    print(token.text, token.dep_, token.head.text)

# Named entities
for ent in doc.ents:
    print(ent.text, ent.label_)
```

### Semantic Representation
- **Formal Semantics**: Lambda calculus, FOL
- **Frame Semantics**: FrameNet
- **Semantic Primitives**: Primitive theory
- **Distributional Semantics**: Word embeddings

### Linguistic Resources
- **WordNet**: Lexical database
- **UD**: Universal Dependencies
- **Penn Treebank**: Syntactic annotations
- **BabelNet**: Multilingual lexical knowledge
