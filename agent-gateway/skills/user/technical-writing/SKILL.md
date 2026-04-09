---
name: technical-writing
description: Creating clear, comprehensive technical documentation
category: interdisciplinary
difficulty: intermediate
tags: [documentation, writing, technical, api]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Technical Writing

## What I Do

I am Technical Writing, the practice of creating clear, accurate, and accessible documentation for technical products and processes. I translate complex technical information into language that users can understand and apply. I encompass various document types: API documentation, user guides, release notes, tutorials, and system documentation. I follow established standards and style guides to ensure consistency. I advocate for readers, anticipating their questions and providing the information they need. I balance completeness with clarity, knowing that documentation is never finished—it's continuously improved based on feedback and evolving products.

## When to Use Me

- Writing API documentation
- Creating user guides and tutorials
- Documenting software architecture
- Writing release notes and changelogs
- Developing help center content
- Creating system documentation
- Writing technical blog posts
- Training material development
- Compliance documentation

## Core Concepts

**Audience Analysis**: Understanding who will read the documentation.

**Information Architecture**: Organizing content for findability.

**Single Sourcing**: Creating content that can be reused across formats.

**Task-Based Writing**: Organizing around user tasks, not features.

**Procedural Writing**: Clear step-by-step instructions.

**Style Guides**: Standards for consistency in voice, tone, and formatting.

**Versioning**: Managing documentation across product versions.

**DITA/XML**: Structured documentation frameworks.

## Code Examples

### Example 1: API Documentation Generator
```python
#!/usr/bin/env python3
"""
API Documentation Generator
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import json
import re

class HTTPMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"

@dataclass
class Parameter:
    name: str
    type: str
    required: bool
    description: str
    default: Optional[str] = None
    example: Optional[str] = None

@dataclass
class RequestExample:
    language: str
    code: str

@dataclass
class ResponseExample:
    status_code: int
    description: str
    schema: Dict
    example: Dict

@dataclass
class APIEndpoint:
    path: str
    method: HTTPMethod
    summary: str
    description: str
    parameters: List[Parameter]
    request_body: Optional[Dict]
    responses: List[ResponseExample]
    authentication_required: bool
    tags: List[str]
    examples: List[RequestExample]

@dataclass
class APIDocumentation:
    title: str
    version: str
    description: str
    base_url: str
    endpoints: List[APIEndpoint]
    authentication: Dict
    rate_limiting: Dict
    errors: List[Dict]

class APIDocumentationGenerator:
    def __init__(self):
        self.endpoints: List[APIEndpoint] = []
        self.common_parameters: List[Parameter] = []
    
    def add_endpoint(self, endpoint: APIEndpoint):
        self.endpoints.append(endpoint)
    
    def add_common_parameter(self, parameter: Parameter):
        self.common_parameters.append(parameter)
    
    def generate_openapi_spec(self) -> Dict:
        """Generate OpenAPI/Swagger specification"""
        spec = {
            "openapi": "3.0.3",
            "info": {
                "title": "API Documentation",
                "version": "1.0.0",
                "description": "API documentation generated automatically"
            },
            "servers": [{"url": "https://api.example.com/v1"}],
            "paths": {},
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                },
                "schemas": {
                    "Error": {
                        "type": "object",
                        "properties": {
                            "code": {"type": "integer"},
                            "message": {"type": "string"},
                            "details": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                }
            }
        }
        
        for endpoint in self.endpoints:
            path_item = self._build_path_item(endpoint)
            if endpoint.path not in spec["paths"]:
                spec["paths"][endpoint.path] = {}
            spec["paths"][endpoint.path][endpoint.method.value.lower()] = path_item
        
        return spec
    
    def _build_path_item(self, endpoint: APIEndpoint) -> Dict:
        return {
            "summary": endpoint.summary,
            "description": endpoint.description,
            "tags": endpoint.tags,
            "security": [{"bearerAuth": []}] if endpoint.authentication_required else [],
            "parameters": [
                {
                    "name": param.name,
                    "in": "query",
                    "required": param.required,
                    "schema": {"type": param.type},
                    "description": param.description,
                    "example": param.example
                }
                for param in endpoint.parameters
            ],
            "requestBody": self._build_request_body(endpoint) if endpoint.request_body else None,
            "responses": self._build_responses(endpoint)
        }
    
    def _build_request_body(self, endpoint: APIEndpoint) -> Dict:
        return {
            "required": any(p.required for p in endpoint.parameters),
            "content": {
                "application/json": {
                    "schema": endpoint.request_body,
                    "example": endpoint.examples[0].code if endpoint.examples else {}
                }
            }
        }
    
    def _build_responses(self, endpoint: APIEndpoint) -> Dict:
        responses = {}
        
        for resp in endpoint.responses:
            responses[str(resp.status_code)] = {
                "description": resp.description,
                "content": {
                    "application/json": {
                        "schema": resp.schema,
                        "example": resp.example
                    }
                }
            }
        
        return responses
    
    def generate_markdown_docs(self) -> str:
        """Generate Markdown documentation"""
        doc = []
        
        doc.append(f"# API Documentation\n")
        doc.append(f"_Generated: {datetime.now().strftime('%Y-%m-%d')}_\n")
        
        # Group endpoints by tag
        by_tag = {}
        for endpoint in self.endpoints:
            for tag in endpoint.tags:
                if tag not in by_tag:
                    by_tag[tag] = []
                by_tag[tag].append(endpoint)
        
        for tag, endpoints in by_tag.items():
            doc.append(f"\n## {tag}\n")
            
            for endpoint in endpoints:
                doc.append(f"### `{endpoint.method.value} {endpoint.path}`\n")
                doc.append(f"{endpoint.description}\n")
                
                if endpoint.parameters:
                    doc.append(f"**Parameters:**\n\n")
                    doc.append("| Name | Type | Required | Description |\n")
                    doc.append("|------|------|----------|-------------|\n")
                    for param in endpoint.parameters:
                        req = "Yes" if param.required else "No"
                        doc.append(f"| {param.name} | {param.type} | {req} | {param.description} |\n")
                
                doc.append("\n**Responses:**\n\n")
                for resp in endpoint.responses:
                    doc.append(f"- `{resp.status_code}`: {resp.description}\n")
                
                doc.append("\n---\n")
        
        return "\n".join(doc)
    
    def generate_postman_collection(self) -> Dict:
        """Generate Postman collection"""
        collection = {
            "info": {
                "name": "API Collection",
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "item": []
        }
        
        for endpoint in self.endpoints:
            item = {
                "name": endpoint.summary,
                "request": {
                    "method": endpoint.method.value,
                    "header": [],
                    "url": {
                        "raw": endpoint.path,
                        "host": ["api", "example", "com"],
                        "path": endpoint.path.strip("/").split("/")
                    }
                },
                "response": [
                    {
                        "name": "Success",
                        "status": "OK",
                        "code": resp.status_code,
                        "body": json.dumps(resp.example, indent=2)
                    }
                    for resp in endpoint.responses
                ]
            }
            
            collection["item"].append(item)
        
        return collection


# Example Usage
generator = APIDocumentationGenerator()

# Add endpoint
generator.add_endpoint(APIEndpoint(
    path="/users",
    method=HTTPMethod.GET,
    summary="List Users",
    description="Retrieve a paginated list of users",
    parameters=[
        Parameter(
            name="page",
            type="integer",
            required=False,
            description="Page number",
            default="1",
            example="1"
        ),
        Parameter(
            name="limit",
            type="integer",
            required=False,
            description="Items per page",
            default="20",
            example="20"
        )
    ],
    request_body=None,
    responses=[
        ResponseExample(
            status_code=200,
            description="Successful response",
            schema={"type": "object", "properties": {"data": {"type": "array"}}},
            example={"data": [{"id": 1, "name": "User 1"}]}
        ),
        ResponseExample(
            status_code=401,
            description="Unauthorized",
            schema={"$ref": "#/components/schemas/Error"},
            example={"code": 401, "message": "Unauthorized"}
        )
    ],
    authentication_required=True,
    tags=["Users"],
    examples=[]
))

# Generate documentation
openapi_spec = generator.generate_openapi_spec()
markdown_docs = generator.generate_markdown_docs()

print(json.dumps(openapi_spec, indent=2))
print("\n" + "="*50 + "\n")
print(markdown_docs)
```

### Example 2: Release Notes Generator
```python
RELEASE_NOTES_TEMPLATE = """
# Release Notes {version}

**Release Date:** {date}
**Version:** {version}
**Type:** {release_type}  # major, minor, patch

## What's New

### New Features
{fmt_features}

### Improvements
{fmt_improvements}

### Bug Fixes
{ fmt_bugfixes}

### Breaking Changes
{breaking_changes}

## Upgrade Guide

{upgrade_guide}

## Deprecations

{deprecations}

## Known Issues

{known_issues}

## Full Changelog

{full_changelog}

---

*For full documentation, visit [docs.example.com](https://docs.example.com)*
"""

class ReleaseNotesGenerator:
    def __init__(self):
        self.changes = {
            'features': [],
            'improvements': [],
            'bugfixes': [],
            'breaking_changes': [],
            'deprecations': []
        }
        self.known_issues = []
    
    def add_feature(self, title: str, description: str, pr_number: str = None, 
                   contributor: str = None):
        self.changes['features'].append({
            'title': title,
            'description': description,
            'pr': pr_number,
            'contributor': contributor
        })
    
    def add_improvement(self, title: str, description: str, pr_number: str = None):
        self.changes['improvements'].append({
            'title': title,
            'description': description,
            'pr': pr_number
        })
    
    def add_bugfix(self, title: str, description: str, pr_number: str = None):
        self.changes['bugfixes'].append({
            'title': title,
            'description': description,
            'pr': pr_number
        })
    
    def add_breaking_change(self, description: str, migration_guide: str):
        self.changes['breaking_changes'].append({
            'description': description,
            'migration': migration_guide
        })
    
    def generate_release_notes(self, version: str, release_type: str) -> str:
        def fmt_section(items):
            if not items:
                return "- No changes in this category"
            return "\n".join(
                f"- **{item['title']}**: {item['description']}"
                for item in items
            )
        
        return RELEASE_NOTES_TEMPLATE.format(
            version=version,
            date=datetime.now().strftime('%Y-%m-%d'),
            release_type=release_type,
            fmt_features=fmt_section(self.changes['features']),
            fmt_improvements=fmt_section(self.changes['improvements']),
            fmt_bugfixes=fmt_section(self.changes['bugfixes']),
            breaking_changes=self._format_breaking_changes(),
            upgrade_guide=self._format_upgrade_guide(),
            deprecations=self._format_deprecations(),
            known_issues=self._format_known_issues(),
            full_changelog=self._generate_changelog_link(version)
        )
```

## Best Practices

- Know your audience and write for them
- Use active voice and clear, concise language
- Follow consistent style guides
- Organize information hierarchically
- Use examples and visuals
- Write task-oriented documentation
- Review and test documentation regularly
- Version control documentation with code
- Automate documentation generation where possible
- Seek feedback from users

## Core Competencies

- API documentation
- User guides and tutorials
- Release notes
- System documentation
- Style guide development
- Information architecture
- Content strategy
- Technical blogging
- Video tutorials
- Accessibility in documentation
- Version control for docs
- Single sourcing
- Structured authoring (DITA)
- Localization/translation
- Documentation tooling
