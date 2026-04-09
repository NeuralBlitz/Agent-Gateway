# Builder Pattern

**Category:** Design Patterns  
**Skill Level:** Intermediate  
**Domain:** Object-Oriented Design, Software Architecture, Code Quality

## Overview

The Builder Pattern is a creational design pattern that separates the construction of a complex object from its representation, enabling the same construction process to create different representations. It is particularly useful when an object requires many optional parameters or when the construction process involves multiple steps.

## Description

The Builder Pattern addresses the challenges of constructing complex objects with numerous configuration options, optional parameters, and intricate initialization sequences. Traditional approaches using constructors with many parameters become unwieldy, especially when some parameters are optional or when the construction logic involves validation, conditional steps, or coordination with external resources. The Builder pattern solves these problems by encapsulating the construction logic in a separate builder object while providing a fluent, readable interface for clients.

The pattern's core structure involves a Builder class that maintains the state of the object being constructed through a series of method calls, each responsible for setting a specific aspect of the object. Methods typically return the builder itself, enabling method chaining for a fluent interface. A final `build()` method performs any remaining validation and returns the constructed object. This separation allows for step-by-step construction, conditional logic based on previously set values, and validation at various stages rather than only at the end.

The Builder Pattern offers several advantages beyond handling complex initialization. It enforces immutability of constructed objects, as all configuration happens before the final object is created. It provides a clear, readable syntax for object creation, especially when compared to constructors with many parameters. It enables validation at multiple points during construction, catching errors early rather than waiting for final object creation. It also supports the same construction process to create different variations of an object by controlling which optional components are included.

Modern languages have adopted builder-like patterns through various syntactic conveniences. Named parameters in Python and Kotlin provide similar readability benefits, while TypeScript interfaces and Java records simplify some use cases. However, the classic Builder pattern remains valuable for complex construction scenarios, particularly in languages without named parameters, and provides a consistent pattern for building objects that might evolve to include more complexity over time.

## Prerequisites

- Understanding of object-oriented programming principles
- Knowledge of creational design patterns
- Familiarity with immutability concepts
- Experience with method chaining and fluent interfaces

## Core Competencies

- Identifying when the Builder Pattern is appropriate
- Implementing fluent builder interfaces with method chaining
- Handling optional parameters and default values
- Performing validation at construction time
- Creating immutable objects through the builder pattern
- Implementing director classes for complex construction sequences

## Implementation

```python
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

@dataclass
class HTTPRequest:
    url: str
    method: str = "GET"
    headers: Dict[str, str] = field(default_factory=dict)
    body: Optional[str] = None
    timeout: int = 30
    allow_redirects: bool = True
    cookies: Dict[str, str] = field(default_factory=dict)

class HTTPRequestBuilder:
    def __init__(self):
        self._url: Optional[str] = None
        self._method: str = "GET"
        self._headers: Dict[str, str] = {}
        self._body: Optional[str] = None
        self._timeout: int = 30
        self._allow_redirects: bool = True
        self._cookies: Dict[str, str] = {}
    
    def url(self, url: str) -> 'HTTPRequestBuilder':
        self._url = url
        return self
    
    def method(self, method: str) -> 'HTTPRequestBuilder':
        self._method = method.upper()
        return self
    
    def get(self) -> 'HTTPRequestBuilder':
        self._method = "GET"
        return self
    
    def post(self, body: Optional[str] = None) -> 'HTTPRequestBuilder':
        self._method = "POST"
        if body:
            self._body = body
        return self
    
    def header(self, key: str, value: str) -> 'HTTPRequestBuilder':
        self._headers[key] = value
        return self
    
    def headers(self, headers: Dict[str, str]) -> 'HTTPRequestBuilder':
        self._headers.update(headers)
        return self
    
    def timeout(self, seconds: int) -> 'HTTPRequestBuilder':
        self._timeout = seconds
        return self
    
    def allow_redirects(self, allow: bool) -> 'HTTPRequestBuilder':
        self._allow_redirects = allow
        return self
    
    def json(self, data: Dict[str, Any]) -> 'HTTPRequestBuilder':
        import json
        self._headers["Content-Type"] = "application/json"
        self._body = json.dumps(data)
        return self
    
    def basic_auth(self, username: str, password: str) -> 'HTTPRequestBuilder':
        import base64
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        self._headers["Authorization"] = f"Basic {encoded}"
        return self
    
    def build(self) -> HTTPRequest:
        if not self._url:
            raise ValueError("URL is required")
        
        return HTTPRequest(
            url=self._url,
            method=self._method,
            headers=self._headers.copy(),
            body=self._body,
            timeout=self._timeout,
            allow_redirects=self._allow_redirects,
            cookies=self._cookies.copy()
        )

@dataclass
class NutritionFacts:
    serving_size: int
    servings: int
    calories: int = 0
    fat: float = 0.0
    carbohydrates: float = 0.0
    protein: float = 0.0
    sodium: float = 0.0

class NutritionFactsBuilder:
    def __init__(self, serving_size: int, servings: int):
        self._serving_size = serving_size
        self._servings = servings
        self._calories = 0
        self._fat = 0.0
        self._carbohydrates = 0.0
        self._protein = 0.0
        self._sodium = 0.0
    
    def calories(self, calories: int) -> 'NutritionFactsBuilder':
        if calories < 0:
            raise ValueError("Calories cannot be negative")
        self._calories = calories
        return self
    
    def fat(self, fat: float) -> 'NutritionFactsBuilder':
        if fat < 0:
            raise ValueError("Fat cannot be negative")
        self._fat = fat
        return self
    
    def carbohydrates(self, carbs: float) -> 'NutritionFactsBuilder':
        if carbs < 0:
            raise ValueError("Carbohydrates cannot be negative")
        self._carbohydrates = carbs
        return self
    
    def protein(self, protein: float) -> 'NutritionFactsBuilder':
        if protein < 0:
            raise ValueError("Protein cannot be negative")
        self._protein = protein
        return self
    
    def sodium(self, sodium: float) -> 'NutritionFactsBuilder':
        if sodium < 0:
            raise ValueError("Sodium cannot be negative")
        self._sodium = sodium
        return self
    
    def build(self) -> NutritionFacts:
        return NutritionFacts(
            serving_size=self._serving_size,
            servings=self._servings,
            calories=self._calories,
            fat=self._fat,
            carbohydrates=self._carbohydrates,
            protein=self._protein,
            sodium=self._sodium
        )

# Example usage
request = (HTTPRequestBuilder()
    .url("https://api.example.com/users")
    .method("GET")
    .header("Accept", "application/json")
    .header("Authorization", "Bearer token123")
    .timeout(60)
    .allow_redirects(False)
    .build())

nutrition = (NutritionFactsBuilder(serving_size=100, servings=2)
    .calories(250)
    .fat(8.0)
    .carbohydrates(35.0)
    .protein(12.0)
    .sodium(450.0)
    .build())
```

## Use Cases

- Constructing complex configuration objects with many optional parameters
- Building HTTP requests or database queries with fluent interfaces
- Creating test fixtures with flexible, readable initialization
- Implementing immutable domain objects with controlled construction
- Separating object construction logic from business logic
- Validating objects during construction rather than at runtime

## Artifacts

- Builder classes for complex domain objects
- Fluent interface implementations for query builders
- Director classes for standardized construction sequences
- Validation logic integrated into builders
- Builder unit tests for construction scenarios

## Related Skills

- Object-Oriented Design
- Fluent Interfaces
- Design Patterns
- Immutability
- Validation Patterns
