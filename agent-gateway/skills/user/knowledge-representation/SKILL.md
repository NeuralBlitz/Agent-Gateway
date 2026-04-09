---
name: knowledge-representation
description: Knowledge representation in AI
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Design knowledge structures
- Build ontologies and taxonomies
- Implement semantic networks
- Create knowledge graphs
- Represent uncertain knowledge
- Build expert systems

## When to use me

Use me when:
- Building knowledge-based systems
- Creating semantic search
- Implementing reasoning systems
- Integrating heterogeneous data
- Building question-answering systems

## Key Concepts

### Knowledge Representation Schemes

**1. Semantic Networks**
```
      ┌─────────┐
      │Animal  │
      └────┬────┘
           │is-a
     ┌─────┴─────┐
     ▼           ▼
┌───────┐   ┌────────┐
│Mammal │   │  Bird  │
└───┬───┘   └───┬────┘
    │           │has-a
    ▼           ▼
┌───────┐   ┌────────┐
│ Dog  │   │Wings   │
└───────┘   └────────┘
```

**2. Frames**
```python
class Frame:
    def __init__(self, name, slots):
        self.name = name
        self.slots = slots

dog = Frame("Dog", {
    "is_a": ["Mammal"],
    "legs": 4,
    "sound": "bark",
    "eats": ["meat", "dog_food"],
    "can": ["fetch", "guard", "hunt"]
})
```

**3. Logic Representation**
```
// First-Order Logic
∀x (Dog(x) → Mammal(x))
∀x (Mammal(x) → Animal(x))
∃x (Dog(x) ∧ Barks(x))

// Rules
IF patient.has_fever AND patient.cough THEN patient.has_cold
```

### Knowledge Graphs
```python
# RDF-like representation
from rdflib import Graph, Namespace, URIRef, Literal

EX = Namespace("http://example.org/")

g = Graph()
g.add((EX.Person, EX.hasName, Literal("Alice")))
g.add((EX.Person, EX.hasAge, Literal(30)))
g.add((EX.Person, EX.worksAt, EX.Company))
```

### Applications
- **Ontologies**: OWL, RDF schemas
- **Knowledge Graphs**: Google, Wikidata
- **Expert Systems**: MYCIN, DENDRAL
- **Semantic Web**: Linked data
