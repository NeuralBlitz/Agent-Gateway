# Code Generation

## Overview

Code Generation is the automated creation of source code from higher-level specifications, models, or templates. It accelerates development by generating repetitive boilerplate code, implementing design patterns, creating CRUD operations from schemas, and building infrastructure from declarative configurations.

## Description

Code generation ranges from simple string templating to sophisticated model-driven engineering. Templates define the structure with placeholders, while engines replace these with actual values. More advanced generators parse input schemas to produce type-safe code for multiple languages.

## Prerequisites

- Programming language proficiency
- Understanding of text processing and parsing
- Familiarity with template engines
- Knowledge of abstract syntax trees
- Experience with build systems

## Core Competencies

- Template engine usage and creation
- AST manipulation and code parsing
- Schema-driven code generation
- Metaprogramming techniques
- Multi-language code generation

## Implementation

```python
import re
import os
from typing import Any, Dict, List, Callable
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class GenerationContext:
    name: str
    version: str = "1.0.0"
    author: str = ""
    date: str = ""
    custom: Dict[str, Any] = None

    def __post_init__(self):
        if not self.date:
            self.date = datetime.now().isoformat()
        if self.custom is None:
            self.custom = {}

@dataclass
class GenerationResult:
    success: bool
    files_generated: List[str] = None
    files_updated: List[str] = None
    errors: List[str] = None

    def __post_init__(self):
        if self.files_generated is None:
            self.files_generated = []
        if self.files_updated is None:
            self.files_updated = []
        if self.errors is None:
            self.errors = []

class TemplateEngine:
    def __init__(self):
        self.filters: Dict[str, Callable] = {}

    def register_filter(self, name: str, func: Callable):
        self.filters[name] = func

    def render(self, template: str, context: GenerationContext) -> str:
        result = template
        for key, value in context.custom.items():
            placeholder = f"{{{{ {key} }}}}"
            result = result.replace(placeholder, str(value))

        for name, func in self.filters.items():
            pattern = f"{{{{ |{name}"
            result = re.sub(rf"{{{{\s*(\w+)\s*\|{name}\s*}}}}",
                          lambda m: str(func(m.group(1))), result)

        return result

def to_snake_case(name: str) -> str:
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def to_pascal_case(name: str) -> str:
    components = name.replace('-', '_').split('_')
    return ''.join(x.title() for x in components)

def to_camel_case(name: str) -> str:
    s = to_pascal_case(name)
    return s[0].lower() + s[1:] if s else s

class CodeGenerator:
    def __init__(self):
        self.engine = TemplateEngine()
        self.engine.register_filter("snake_case", to_snake_case)
        self.engine.register_filter("pascal_case", to_pascal_case)
        self.engine.register_filter("camel_case", to_camel_case)

    def generate(self, template: str, context: GenerationContext, output_path: str) -> GenerationResult:
        try:
            rendered = self.engine.render(template, context)
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(rendered)
            return GenerationResult(success=True, files_generated=[output_path])
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return GenerationResult(success=False, errors=[str(e)])
```

## Use Cases

- Boilerplate code generation (CRUD, REST APIs)
- Infrastructure as Code templates
- Database schema to code mappings
- API client generation from OpenAPI specs
- Test scaffolding from source code

## Artifacts

- `GenerationContext`: Template context data
- `GenerationResult`: Generation output
- `TemplateEngine`: Template rendering
- `CodeGenerator`: Main generator class
- Case conversion utilities

## Related Skills

- Template Engine Usage
- AST Parsing
- Schema-Driven Development
- Metaprogramming
- Build Tool Integration
