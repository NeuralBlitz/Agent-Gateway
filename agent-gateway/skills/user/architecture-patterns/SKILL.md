---
name: architecture-patterns
description: Software architecture patterns and design principles
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Apply architectural patterns
- Design scalable systems
- Choose appropriate patterns
- Implement layered architecture
- Design for change
- Handle cross-cutting concerns
- Balance trade-offs
- Document architecture decisions

## When to use me
When designing system architecture or evaluating patterns.

## Common Patterns
```
Layered Architecture:
┌─────────────┐
│ Presentation│
├─────────────┤
│ Application│
├─────────────┤
│   Domain    │
├─────────────┤
│ Infrastructure│
└─────────────┘

Microservices:
Service A ──► Service B ──► Service C

Event-Driven:
Producer ──► Event Bus ──► Consumer

CQRS:
Command ──► Write DB
Query ──► Read DB (optimized)
```
