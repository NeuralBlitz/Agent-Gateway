# Adapter Pattern

**Category:** Software Architecture  
**Skill Level:** Intermediate  
**Domain:** programming, architecture

## Overview

The Adapter pattern allows incompatible interfaces to work together by wrapping an interface around an existing class.

## Description

The Adapter pattern acts as a bridge between two incompatible interfaces, enabling classes with different interfaces to collaborate. It converts the interface of a class into another interface that clients expect.

## Prerequisites

- Object-oriented programming fundamentals
- Interface design principles
- Understanding of SOLID principles

## Core Competencies

- Identifying when to use adapter pattern
- Implementing class and object adapters
- Working with existing library interfaces
- Maintaining single responsibility principle

## Implementation

```python
class Target:
    def request(self) -> str:
        return "Target: The default target's behavior."

class Adaptee:
    def specific_request(self) -> str:
        return ".eetpadmae eht fo roivaheb laicepS"

class Adapter(Target):
    def __init__(self, adaptee: Adaptee):
        self.adaptee = adaptee

    def request(self) -> str:
        return f"Adapter: (TRANSLATED) {self.adaptee.specific_request()[::-1]}"
```

## Use Cases

- Integrating third-party libraries
- Legacy system integration
- Data format conversions
- API wrapper development

## Artifacts

- Adapter implementations for common interfaces
- Interface compatibility layers
- Legacy system wrappers

## Related Skills

- Bridge Pattern
- Decorator Pattern
- Facade Pattern
